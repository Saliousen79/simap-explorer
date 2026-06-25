/**
 * Agenten-Pipeline des SIMAP Explorers
 * =====================================
 *
 * Diese Datei ist das Herzstück des Multi-Agenten-Setups. Eine Nutzerfrage
 * durchläuft vier Stufen, die streng getrennt sind:
 *
 *   1. Planung     – ein LLM (DeepSeek) klassifiziert die Frage in einen
 *                    validierten Analyseplan (Intent, Dimensionen, Kennzahl).
 *   2. Guard       – der Plan wird in parameterisiertes Read-only-SQL
 *                    kompiliert und vom SQL-Guard freigegeben.
 *   3. Abfrage     – Supabase führt das SQL gegen public.archive aus.
 *   4. Visualisierung – zwei LLMs (DeepSeek + Gemini) visualisieren
 *                    dieselben Ergebnisse unabhängig voneinander.
 *
 * Kommunikation zwischen den Agenten:
 *   Es gibt KEINE direkten LLM-zu-LLM-Gespräche. Stattdessen ist die Pipeline
 *   "data-flow"-basiert: Jede Stufe erzeugt ein JSON-Datentobjekt (Analyseplan,
 *   SQL, Ergebniszeilen, Chart-Konfiguration), das die nächste Stufe als
 *   Eingabe erhält. So bleibt jeder Schritt deterministisch, testbar und
 *   abschirmbar – ein Agent kann dem nächsten keine Anweisungen einschleusen,
 *   weil die Übergänge nur Daten enthalten (nie Prompt-Text als Befehl).
 *
 * Die Ergebnisse jeder Stufe werden über `emit` an den Client gestreamt
 * (NDJSON: ein JSON-Objekt pro Zeile), damit die UI die Stufen live anzeigen kann.
 */

import { compileAnalyticsQuery } from "@/lib/agents/analytics-query-compiler";
import { OpenRouterChartAgent } from "@/lib/agents/openrouter-chart-agent";
import { OpenRouterAnalyticsPlanner } from "@/lib/agents/openrouter-sql-agent";
import { ChartAgentA } from "@/lib/agents/chart-agent-a";
import { ChartAgentB } from "@/lib/agents/chart-agent-b";
import { createFallbackAnalyticsPlan, normalizeAnalyticsPlan } from "@/lib/agents/planner-sql-agent";
import {
  AgentChatResponse, AgentStreamEvent, AnalyticsPlan, CantonCode, ChartAgentResult,
  CompiledAnalyticsQuery, PlannerSource, SqlRow, WorkflowStage
} from "@/lib/agents/types";
import { runReadonlyQuery } from "@/lib/db/readonly-postgres";
import { AgentWorkflowError, toAgentError } from "@/lib/security/prompt-guard";
import { assertSafeSelectQuery } from "@/lib/security/sql-guard";

/** Modelle für die beiden Chart-Agenten (über Env-Variaben konfigurierbar). */
const CHART_MODEL_A = process.env.OPENROUTER_CHART_MODEL_A ?? "deepseek/deepseek-v4-flash";
const CHART_MODEL_B = process.env.OPENROUTER_CHART_MODEL_B ?? "google/gemini-3.1-flash-lite";

/**
 * Callback, mit dem die Pipeline ein Event an den Client streamt.
 * Ein Event = eine Zeile JSON (NDJSON). Siehe AgentStreamEvent in types.ts.
 */
export type PipelineEmitter = (event: AgentStreamEvent) => void;

/** Eingabe einer Analyseanfrage vom Client. */
export interface PipelineInput {
  message: string;
  selectedCantons: CantonCode[];
}

/** Aktuelle Stufe – wird bei einem Fehler zurückgemeldet, damit die UI weiss, wo es klemmte. */
function makeStageEmitter(emit: PipelineEmitter, onRunning: (stage: WorkflowStage) => void) {
  return (id: WorkflowStage, status: "running" | "complete" | "error", detail?: string) => {
    if (status === "running") onRunning(id);
    emit({ type: "stage", stage: id, status, detail });
  };
}

/**
 * Stufe 1 – Planung.
 * Der Planner (DeepSeek) liest die Nutzerfrage und gibt einen validierten
 * Analyseplan zurück. Fällt das LLM aus oder liefert es Ungültiges, springt
 * der regelbasierte Fallback ein (source = "fallback"), damit die Pipeline
 * nie wegen eines Modellfehlers komplett stehen bleibt.
 */
async function plan(input: PipelineInput): Promise<{ plan: AnalyticsPlan; source: PlannerSource }> {
  try {
    const draft = await OpenRouterAnalyticsPlanner(input.message, input.selectedCantons);
    // normalizeAnalyticsPlan misst das LLM-Ergebnis an festen Regeln und
    // erzwingt erlaubte Dimensionen/Metriken – das LLM darf nur innerhalb
    // dieses Rahmen entscheiden.
    return { plan: normalizeAnalyticsPlan(draft, input.message, input.selectedCantons), source: "openrouter" };
  } catch (error) {
    // AgentWorkflowError = gezielte Ablehnung (z. B.Unsupported-Topic), weiterwerfen.
    if (error instanceof AgentWorkflowError) throw error;
    return { plan: createFallbackAnalyticsPlan(input.message), source: "fallback" };
  }
}

/**
 * Stufe 2 – Guard.
 * Kompiliert den Plan zu parameterisiertem SQL ($1, $2, ... als Bind-Variablen)
 * und lässt den SQL-Guard prüfen: nur SELECT, nur erlaubte Tabellen/Spalten,
 * LIMIT <= 1000, keine Schreib- oder Systembefehle.
 */
function guard(plan: AnalyticsPlan, cantons: CantonCode[]): CompiledAnalyticsQuery {
  const compiled = compileAnalyticsQuery(plan, cantons);
  assertSafeSelectQuery(compiled.sql); // wirft bei Regelverletzung
  return compiled;
}

/**
 * Stufe 3 – Abfrage.
 * Führt das freigegebene SQL gegen Supabase aus. Die Verbindung nutzt eine
 * Read-only-Role, daher ist die Datenbank selbst die letzte Sicherheitsschicht.
 * Leere Ergebnismenge = fachlicher Fehler (NO_DATA), kein technischer.
 */
async function query(compiled: CompiledAnalyticsQuery): Promise<SqlRow[]> {
  let rows: SqlRow[];
  try {
    rows = await runReadonlyQuery(compiled.sql, compiled.params);
  } catch (error) {
    // Konkretes, hilfreiches Mapping: fehlt die DB-URL (z. B. auf Vercel nicht
    // gesetzt), erhält der Nutzer eine klare Setup-Anweisung statt eines
    // kryptischen Verbindungsfehlers.
    const message = error instanceof Error ? error.message : "";
    // Den wahren Datenbankfehler serverseitig protokollieren, damit ein
    // Timeout/Verbindungsabbruch nachvollziehbar bleibt. Die Nutzermeldung
    // bleibt absichtlich generisch (keine internen Details nach aussen).
    console.error("[pipeline] Supabase query failed:", message, { sql: compiled.sql, params: compiled.params });
    if (message.includes("DATABASE_READONLY_URL")) {
      throw new AgentWorkflowError({
        code: "QUERY_FAILED",
        message: "Die Datenbank-Verbindung ist auf Vercel nicht konfiguriert.",
        suggestions: ["Setze DATABASE_READONLY_URL in den Vercel Environment Variables für Production und deploye erneut."],
        retryable: false
      });
    }
    // Typische Zeitlimit-Symptome lesbare Hinweise zuordnen.
    const looksLikeTimeout = /timeout|timed out|ETIMEDOUT|canceling statement|connection terminated|ECONNRESET/i.test(message);
    throw new AgentWorkflowError({
      code: "QUERY_FAILED",
      message: "Die freigegebene Supabase-Abfrage konnte nicht ausgeführt werden.",
      suggestions: looksLikeTimeout
        ? ["Die Abfrage lief in ein Zeitlimit. Versuche es erneut oder reduziere Zeitraum und Kantonsauswahl."]
        : ["Versuche es erneut oder reduziere Zeitraum und Kantonsauswahl."],
      retryable: true
    });
  }
  if (!rows.length) {
    throw new AgentWorkflowError({
      code: "NO_DATA",
      message: "Für diese Kombination aus Frage, Zeitraum und Kantonen wurden keine Daten gefunden.",
      suggestions: ["Wähle weitere Kantone.", "Erweitere den Zeitraum.", "Prüfe, ob Zuschlagsdaten vorhanden sind."],
      retryable: false
    });
  }
  return rows;
}

/**
 * Stufe 4 – Visualisierung (Multi-Agenten-Setup).
 * Beide Chart-Agenten bekommen IDENTISCHE Eingaben (gleicher Plan, gleiche
 * Kantone, gleiche Zeilen) und arbeiten völlig unabhängig. Das ist bewusst
 * parallel (Promise.allSettled), nicht sequenziell – sie brauchen einander nicht.
 *
 * Fällt ein Modell aus, übernimmt der zugehörige lokale Fallback-Agent
 * (ChartAgentA/B) die Darstellung, statt die ganze Analyse abzubrechen.
 *
 * Liefern beide zufällig denselben Diagrammtyp, wird Agent B einmal neu
 * angefragt mit dem Typ von A als "verboten" – so bekommt der Nutzer wirklich
 * zwei verschiedene Perspektiven.
 */
async function visualize(
  plan: AnalyticsPlan,
  cantons: CantonCode[],
  rows: SqlRow[]
): Promise<{ chartA: ChartAgentResult; chartB: ChartAgentResult; usedFallback: boolean }> {
  const commonInput = { analyticsPlan: plan, selectedCantons: cantons, rows };

  // Beide Agenten gleichzeitig starten; allSettled, damit ein Ausfall nicht
  // den anderen mitreisst.
  const [a, b] = await Promise.allSettled([
    OpenRouterChartAgent({
      ...commonInput, model: CHART_MODEL_A, modelLabel: "DeepSeek V4 Flash",
      perspective: "Wähle eine klare, managementorientierte Darstellung und priorisiere schnelle Vergleichbarkeit."
    }),
    OpenRouterChartAgent({
      ...commonInput, model: CHART_MODEL_B, modelLabel: "Gemini 3.1 Flash Lite",
      perspective: "Erzeuge eine kreative Alternative: Treemap für Ranglisten, Area für Zeitreihen oder Pie für kleine Verteilungen."
    })
  ]);

  // Pro Slot: LLM-Ergebnis nehmen, sonst lokalen Fallback.
  const chartA = a.status === "fulfilled" ? a.value : { ...ChartAgentA(rows), model: "local-fallback", modelLabel: "Lokaler Fallback (A)" };
  let chartB = b.status === "fulfilled" ? b.value : { ...ChartAgentB(rows), model: "local-fallback", modelLabel: "Lokaler Fallback (B)" };

  // Bei identischem Typ: B nochmal neu mit verbotenem Typ von A, damit die
  // Perspektiven verschieden bleiben. Schlägt das fehl, bleibt der Fallback.
  if (rows.length > 1 && chartA.chartType === chartB.chartType) {
    try {
      chartB = await OpenRouterChartAgent({
        ...commonInput, model: CHART_MODEL_B, modelLabel: "Gemini 3.1 Flash Lite",
        perspective: "Erzeuge eine fachlich korrekte Alternative zum vorhandenen Diagramm.",
        forbiddenChartTypes: [chartA.chartType]
      });
    } catch {
      chartB = { ...ChartAgentB(rows), model: "local-fallback", modelLabel: "Lokaler Fallback (B)" };
    }
  }

  const usedFallback = chartA.model === "local-fallback" || chartB.model === "local-fallback";
  return { chartA, chartB, usedFallback };
}

/**
 * Run – führt alle vier Stufen nacheinander aus und streamt jeden Fortschritt.
 *
 * Das ist die einzige Funktion, die die Route direkt aufruft. Sie orchestriert
 * die Reihenfolge und die Events, die eigentliche Logik steckt in den
 * Stufen-Funktionen oben. Bei einem Fehler wird die gerade aktive Stufe als
 * "error" markiert und ein AgentError-Event gesendet.
 */
export async function runAgentPipeline(input: PipelineInput, emit: PipelineEmitter): Promise<void> {
  const startedAt = Date.now();
  let activeStage: WorkflowStage = "planning";
  const stage = makeStageEmitter(emit, (id) => { activeStage = id; });

  try {
    // Stufe 1: Planung -------------------------------------------------
    stage("planning", "running", "Die Frage wird einem erlaubten SIMAP-Analysetyp zugeordnet.");
    const { plan: analyticsPlan, source } = await plan(input);
    emit({ type: "plan", plan: analyticsPlan.plan, reason: analyticsPlan.reason });
    stage("planning", "complete", source === "openrouter" ? "Validierter Analyseplan erstellt." : "Sicherer Regel-Fallback erstellt.");

    // Stufe 2: Guard ---------------------------------------------------
    stage("guard", "running", "Der Analyseplan wird in parameterisiertes Read-only-SQL kompiliert.");
    const compiled = guard(analyticsPlan, input.selectedCantons);
    emit({ type: "sql", sql: compiled.sql, source });
    stage("guard", "complete", "Query-Template, Tabellen, Spalten und Limit wurden freigegeben.");

    // Stufe 3: Abfrage -------------------------------------------------
    stage("query", "running", "Supabase wertet die passenden Datensätze aus.");
    const rows = await query(compiled);
    emit({ type: "data", rowCount: rows.length, columns: rows[0] ? Object.keys(rows[0]) : [] });
    stage("query", "complete", `${rows.length} aggregierte Ergebniszeilen geladen.`);

    // Stufe 4: Visualisierung (zwei Agenten) ---------------------------
    stage("charts", "running", "DeepSeek und Gemini visualisieren ausschließlich die validierten Ergebnisse.");
    const { chartA, chartB, usedFallback } = await visualize(analyticsPlan, input.selectedCantons, rows);
    emit({ type: "candidate", slot: "chartA", candidate: chartA });
    emit({ type: "candidate", slot: "chartB", candidate: chartB });
    stage("charts", "complete", usedFallback
      ? "Diagramme bereit – mindestens ein LLM-Modell war nicht erreichbar, lokale Ersatzdarstellung aktiv."
      : "Beide Diagrammvorschläge sind bereit.");

    // Abschluss: vollständiges Ergebnisobjekt an den Client -----------
    const result: AgentChatResponse = {
      userMessage: input.message,
      plan: analyticsPlan.plan,
      sql: compiled.sql,
      reason: analyticsPlan.reason,
      expectedChartType: analyticsPlan.expectedChartType,
      source,
      analyticsPlan,
      selectedCantons: input.selectedCantons,
      rows, chartA, chartB,
      totalLatencyMs: Date.now() - startedAt
    };
    emit({ type: "complete", result });
  } catch (error) {
    stage(activeStage, "error");
    emit({ type: "error", stage: activeStage, error: toAgentError(error) });
  }
}
