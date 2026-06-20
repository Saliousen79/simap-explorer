import { NextResponse } from "next/server";
import { OpenRouterChartAgent } from "@/lib/agents/openrouter-chart-agent";
import { OpenRouterSQLAgent } from "@/lib/agents/openrouter-sql-agent";
import { PlannerSQLAgent } from "@/lib/agents/planner-sql-agent";
import {
  AgentChatResponse,
  AgentStreamEvent,
  PlannerSQLResult,
  PlannerSource,
  WorkflowStage
} from "@/lib/agents/types";
import { runReadonlyQuery } from "@/lib/db/readonly-postgres";
import { assertSafeSelectQuery } from "@/lib/security/sql-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

const CHART_MODEL_A = process.env.OPENROUTER_CHART_MODEL_A ?? "deepseek/deepseek-v4-flash";
const CHART_MODEL_B = process.env.OPENROUTER_CHART_MODEL_B ?? "google/gemini-3.1-flash-lite";

function fallbackPlan(userMessage: string): PlannerSQLResult {
  return { ...PlannerSQLAgent(userMessage), source: "fallback" };
}

export async function POST(request: Request) {
  let userMessage: string;
  try {
    const body = (await request.json()) as { message?: string };
    userMessage = body.message?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Ungültiger Request." }, { status: 400 });
  }

  if (!userMessage) {
    return NextResponse.json({ error: "Eine Frage ist erforderlich." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const startedAt = Date.now();
      let activeStage: WorkflowStage = "planning";
      const send = (event: AgentStreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const stage = (id: WorkflowStage, status: "running" | "complete" | "error", detail?: string) => {
        if (status === "running") activeStage = id;
        send({ type: "stage", stage: id, status, detail });
      };

      try {
        stage("planning", "running", "DeepSeek übersetzt die Frage in SQL.");
        let planner: PlannerSQLResult;
        let source: PlannerSource = "openrouter";

        try {
          planner = { ...(await OpenRouterSQLAgent(userMessage)), source };
        } catch (error) {
          source = "fallback";
          planner = fallbackPlan(userMessage);
          stage("planning", "running", `SQL-Fallback aktiv: ${error instanceof Error ? error.message : "Planner nicht verfügbar"}`);
        }

        send({ type: "plan", plan: planner.plan, reason: planner.reason });
        stage("planning", "complete", source === "openrouter" ? "SQL-Plan von DeepSeek erstellt." : "Regelbasierter SQL-Plan erstellt.");

        stage("guard", "running", "SQL wird gegen Tabellen- und Spaltenregeln geprüft.");
        let safeSql: string;
        try {
          safeSql = assertSafeSelectQuery(planner.sql);
        } catch (error) {
          if (source === "fallback") throw error;
          stage("guard", "running", `LLM-SQL abgelehnt, Fallback aktiv: ${error instanceof Error ? error.message : "Guard-Fehler"}`);
          source = "fallback";
          planner = fallbackPlan(userMessage);
          safeSql = assertSafeSelectQuery(planner.sql);
          send({ type: "plan", plan: planner.plan, reason: planner.reason });
        }
        send({ type: "sql", sql: safeSql, source });
        stage("guard", "complete", "Read-only-SQL freigegeben.");

        stage("query", "running", "Supabase wertet alle passenden Datensätze aus.");
        let rows;
        try {
          rows = await runReadonlyQuery(safeSql);
        } catch (error) {
          if (source === "fallback") throw error;
          stage("query", "running", `LLM-Abfrage fehlgeschlagen, Fallback aktiv: ${error instanceof Error ? error.message : "Datenbankfehler"}`);
          source = "fallback";
          planner = fallbackPlan(userMessage);
          safeSql = assertSafeSelectQuery(planner.sql);
          send({ type: "plan", plan: planner.plan, reason: planner.reason });
          send({ type: "sql", sql: safeSql, source });
          rows = await runReadonlyQuery(safeSql);
        }
        send({ type: "data", rowCount: rows.length, columns: rows[0] ? Object.keys(rows[0]) : [] });
        stage("query", "complete", `${rows.length} aggregierte Ergebniszeilen geladen.`);

        stage("charts", "running", "DeepSeek und Gemini entwickeln parallel zwei Perspektiven.");
        const chartAPromise = OpenRouterChartAgent({
          model: CHART_MODEL_A,
          modelLabel: "DeepSeek V4 Flash",
          perspective: "Wähle eine klare, managementorientierte Darstellung und priorisiere schnelle Vergleichbarkeit.",
          userPrompt: userMessage,
          sql: safeSql,
          rows
        }).then((candidate) => {
          send({ type: "candidate", slot: "chartA", candidate });
          return candidate;
        });

        const chartBPromise = OpenRouterChartAgent({
          model: CHART_MODEL_B,
          modelLabel: "Gemini 3.1 Flash Lite",
          perspective: "Suche eine alternative analytische Perspektive, die einen anderen relevanten Zusammenhang sichtbar macht.",
          userPrompt: userMessage,
          sql: safeSql,
          rows
        }).then((candidate) => {
          send({ type: "candidate", slot: "chartB", candidate });
          return candidate;
        });

        const [chartA, chartB] = await Promise.all([chartAPromise, chartBPromise]);
        stage("charts", "complete", "Beide Diagrammvorschläge sind bereit.");

        const result: AgentChatResponse = {
          userMessage,
          plan: planner.plan,
          sql: safeSql,
          reason: planner.reason,
          expectedChartType: planner.expectedChartType,
          source,
          rows,
          chartA,
          chartB,
          totalLatencyMs: Date.now() - startedAt
        };
        send({ type: "complete", result });
      } catch (error) {
        stage(activeStage, "error");
        send({
          type: "error",
          stage: activeStage,
          message: error instanceof Error ? error.message : "Agentenworkflow fehlgeschlagen."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
