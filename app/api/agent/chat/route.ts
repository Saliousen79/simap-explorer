import { NextResponse } from "next/server";
import { z } from "zod";
import { compileAnalyticsQuery } from "@/lib/agents/analytics-query-compiler";
import { OpenRouterChartAgent } from "@/lib/agents/openrouter-chart-agent";
import { OpenRouterAnalyticsPlanner } from "@/lib/agents/openrouter-sql-agent";
import { createFallbackAnalyticsPlan, normalizeAnalyticsPlan } from "@/lib/agents/planner-sql-agent";
import {
  AgentChatResponse, AgentError, AgentStreamEvent, CANTON_CODES, cantonCodeSchema,
  PlannerSource, WorkflowStage
} from "@/lib/agents/types";
import { runReadonlyQuery } from "@/lib/db/readonly-postgres";
import {
  AgentWorkflowError, assertCantonSelectionMatchesPrompt, assertPromptAllowed, toAgentError
} from "@/lib/security/prompt-guard";
import { assertSafeSelectQuery } from "@/lib/security/sql-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

const CHART_MODEL_A = process.env.OPENROUTER_CHART_MODEL_A ?? "deepseek/deepseek-v4-flash";
const CHART_MODEL_B = process.env.OPENROUTER_CHART_MODEL_B ?? "google/gemini-3.1-flash-lite";
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 15;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const requestSchema = z.object({
  message: z.string().trim().min(3, "Die Frage muss mindestens 3 Zeichen enthalten.").max(800, "Die Frage darf höchstens 800 Zeichen enthalten."),
  selectedCantons: z.array(cantonCodeSchema).max(CANTON_CODES.length),
  selectionMode: z.enum(["all", "specific"])
}).strict().superRefine((value, context) => {
  if (value.selectionMode === "all" && value.selectedCantons.length) {
    context.addIssue({ code: "custom", path: ["selectedCantons"], message: "Bei 'Ganze Schweiz' dürfen keine einzelnen Kantone übertragen werden." });
  }
  if (value.selectionMode === "specific" && !value.selectedCantons.length) {
    context.addIssue({ code: "custom", path: ["selectedCantons"], message: "Wähle mindestens einen Kanton oder 'Ganze Schweiz'." });
  }
  if (new Set(value.selectedCantons).size !== value.selectedCantons.length) {
    context.addIssue({ code: "custom", path: ["selectedCantons"], message: "Kantone dürfen nicht doppelt vorkommen." });
  }
});

function errorResponse(error: AgentError, status: number) {
  return NextResponse.json({ error }, { status });
}

function assertWithinRateLimit(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  if (current.count >= RATE_LIMIT_REQUESTS) {
    throw new AgentWorkflowError({
      code: "RATE_LIMITED",
      message: "Zu viele Analyseanfragen in kurzer Zeit.",
      suggestions: ["Warte einige Minuten und versuche es erneut."],
      retryable: true
    });
  }
  current.count += 1;
}

export async function POST(request: Request) {
  let input: z.infer<typeof requestSchema>;
  try {
    assertWithinRateLimit(request);
    input = requestSchema.parse(await request.json());
    assertPromptAllowed(input.message);
    assertCantonSelectionMatchesPrompt(input.message, input.selectedCantons, input.selectionMode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse({
        code: "INVALID_REQUEST",
        message: error.issues[0]?.message ?? "Ungültiger Request.",
        suggestions: ["Prüfe Frage und Kantonsauswahl."],
        retryable: false,
        field: error.issues[0]?.path.join(".")
      }, 400);
    }
    const detail = toAgentError(error, "INVALID_REQUEST");
    return errorResponse(detail, detail.code === "RATE_LIMITED" ? 429 : 400);
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
        stage("planning", "running", "Die Frage wird einem erlaubten SIMAP-Analysetyp zugeordnet.");
        let source: PlannerSource = "openrouter";
        let analyticsPlan;
        try {
          const draft = await OpenRouterAnalyticsPlanner(input.message, input.selectedCantons);
          analyticsPlan = normalizeAnalyticsPlan(draft, input.message, input.selectedCantons);
        } catch (error) {
          if (error instanceof AgentWorkflowError) throw error;
          source = "fallback";
          analyticsPlan = createFallbackAnalyticsPlan(input.message);
        }
        send({ type: "plan", plan: analyticsPlan.plan, reason: analyticsPlan.reason });
        stage("planning", "complete", source === "openrouter" ? "Validierter Analyseplan erstellt." : "Sicherer Regel-Fallback erstellt.");

        stage("guard", "running", "Der Analyseplan wird in parameterisiertes Read-only-SQL kompiliert.");
        const compiled = compileAnalyticsQuery(analyticsPlan, input.selectedCantons);
        const safeSql = assertSafeSelectQuery(compiled.sql);
        send({ type: "sql", sql: safeSql, source });
        stage("guard", "complete", "Query-Template, Tabellen, Spalten und Limit wurden freigegeben.");

        stage("query", "running", "Supabase wertet die passenden Datensätze aus.");
        let rows;
        try {
          rows = await runReadonlyQuery(safeSql, compiled.params);
        } catch {
          throw new AgentWorkflowError({
            code: "QUERY_FAILED",
            message: "Die freigegebene Supabase-Abfrage konnte nicht ausgeführt werden.",
            suggestions: ["Versuche es erneut oder reduziere Zeitraum und Kantonsauswahl."],
            retryable: true
          });
        }
        send({ type: "data", rowCount: rows.length, columns: rows[0] ? Object.keys(rows[0]) : [] });
        if (!rows.length) {
          throw new AgentWorkflowError({
            code: "NO_DATA",
            message: "Für diese Kombination aus Frage, Zeitraum und Kantonen wurden keine Daten gefunden.",
            suggestions: ["Wähle weitere Kantone.", "Erweitere den Zeitraum.", "Prüfe, ob Zuschlagsdaten vorhanden sind."],
            retryable: false
          });
        }
        stage("query", "complete", `${rows.length} aggregierte Ergebniszeilen geladen.`);

        stage("charts", "running", "DeepSeek und Gemini visualisieren ausschließlich die validierten Ergebnisse.");
        const commonChartInput = { analyticsPlan, selectedCantons: input.selectedCantons, rows };
        const chartAPromise = OpenRouterChartAgent({
          ...commonChartInput, model: CHART_MODEL_A, modelLabel: "DeepSeek V4 Flash",
          perspective: "Wähle eine klare, managementorientierte Darstellung und priorisiere schnelle Vergleichbarkeit."
        });
        const chartBPromise = OpenRouterChartAgent({
          ...commonChartInput, model: CHART_MODEL_B, modelLabel: "Gemini 3.1 Flash Lite",
          perspective: "Erzeuge eine kreative Alternative: Treemap für Ranglisten, Area für Zeitreihen oder Pie für kleine Verteilungen."
        });
        let chartA;
        let chartB;
        try {
          [chartA, chartB] = await Promise.all([chartAPromise, chartBPromise]);
        } catch {
          throw new AgentWorkflowError({
            code: "MODEL_UNAVAILABLE",
            message: "Mindestens ein Diagramm-Modell ist derzeit nicht verfügbar.",
            suggestions: ["Versuche die Analyse später erneut."],
            retryable: true
          });
        }
        if (rows.length > 1 && chartA.chartType === chartB.chartType) {
          chartB = await OpenRouterChartAgent({
            ...commonChartInput, model: CHART_MODEL_B, modelLabel: "Gemini 3.1 Flash Lite",
            perspective: "Erzeuge eine fachlich korrekte Alternative zum vorhandenen Diagramm.",
            forbiddenChartTypes: [chartA.chartType]
          });
        }
        send({ type: "candidate", slot: "chartA", candidate: chartA });
        send({ type: "candidate", slot: "chartB", candidate: chartB });
        stage("charts", "complete", "Beide Diagrammvorschläge sind bereit.");

        const result: AgentChatResponse = {
          userMessage: input.message,
          plan: analyticsPlan.plan,
          sql: safeSql,
          reason: analyticsPlan.reason,
          expectedChartType: analyticsPlan.expectedChartType,
          source,
          analyticsPlan,
          selectedCantons: input.selectedCantons,
          rows, chartA, chartB,
          totalLatencyMs: Date.now() - startedAt
        };
        send({ type: "complete", result });
      } catch (error) {
        stage(activeStage, "error");
        send({ type: "error", stage: activeStage, error: toAgentError(error) });
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
