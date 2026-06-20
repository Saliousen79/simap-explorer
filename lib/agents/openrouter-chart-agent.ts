import { createStructuredCompletion } from "@/lib/ai/openrouter";
import { ChartAgentResult, ChartSeries, ChartType, SqlRow } from "@/lib/agents/types";

interface ChartDraft {
  title: string;
  chartType: ChartType;
  xKey: string;
  series: ChartSeries[];
  stacked: boolean;
  showLegend: boolean;
  description: string;
  whyInteresting: string;
  insights: string[];
  caveat: string;
}

const COLORS = ["#38bdf8", "#818cf8", "#34d399", "#f59e0b"];

const chartSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title", "chartType", "xKey", "series", "stacked", "showLegend",
    "description", "whyInteresting", "insights", "caveat"
  ],
  properties: {
    title: { type: "string" },
    chartType: { type: "string", enum: ["bar", "line", "area", "pie", "scatter", "composed", "table"] },
    xKey: { type: "string" },
    series: {
      type: "array",
      minItems: 0,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "type", "color"],
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          type: { type: "string", enum: ["bar", "line", "area"] },
          color: { type: "string" }
        }
      }
    },
    stacked: { type: "boolean" },
    showLegend: { type: "boolean" },
    description: { type: "string" },
    whyInteresting: { type: "string" },
    insights: { type: "array", minItems: 2, maxItems: 3, items: { type: "string" } },
    caveat: { type: "string" }
  }
};

function validateDraft(draft: ChartDraft, rows: SqlRow[]) {
  if (!rows.length) return;
  const keys = new Set(Object.keys(rows[0]));
  if (draft.chartType !== "table" && !keys.has(draft.xKey)) {
    throw new Error(`Ungültige X-Achse: ${draft.xKey}`);
  }
  if (draft.chartType !== "table" && draft.series.length === 0) {
    throw new Error("Ein Diagramm benötigt mindestens eine Datenreihe.");
  }
  for (const series of draft.series) {
    if (!keys.has(series.key)) throw new Error(`Unbekannte Datenreihe: ${series.key}`);
    if (!rows.some((row) => typeof row[series.key] === "number")) {
      throw new Error(`Datenreihe ist nicht numerisch: ${series.key}`);
    }
  }
  if (draft.chartType === "pie" && draft.series.length !== 1) {
    throw new Error("Ein Kreisdiagramm benötigt genau eine Datenreihe.");
  }
  if (draft.chartType === "scatter" && draft.series.length !== 1) {
    throw new Error("Ein Streudiagramm benötigt genau eine Y-Datenreihe.");
  }
}

export async function OpenRouterChartAgent({
  model,
  modelLabel,
  perspective,
  userPrompt,
  sql,
  rows
}: {
  model: string;
  modelLabel: string;
  perspective: string;
  userPrompt: string;
  sql: string;
  rows: SqlRow[];
}): Promise<ChartAgentResult> {
  const startedAt = Date.now();
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const draft = await createStructuredCompletion<ChartDraft>({
        model,
        schemaName: "simap_chart_candidate",
        schema: chartSchema,
        temperature: 0.35,
        system: `Du bist ein BI-Visualisierungsagent. ${perspective}\nErzeuge ausschließlich eine deklarative Chart-Konfiguration im JSON-Schema, niemals React-, JavaScript-, SVG- oder SQL-Code. Verwende nur vorhandene Spalten. Formuliere alle Texte auf Deutsch. Insights müssen konkret aus den gelieferten Daten ableitbar sein. Erwähne im Caveat Einschränkungen wie fehlende award_amount-Werte oder kleine Gruppen. Farben müssen sechsstellige Hex-Werte sein. Nutze bevorzugt: ${COLORS.join(", ")}.${lastError ? `\nDie vorige Antwort war ungültig: ${lastError}` : ""}`,
        prompt: `Nutzerfrage: ${userPrompt}\nSQL: ${sql}\nSpalten: ${columns.join(", ")}\nZeilen (${rows.length}): ${JSON.stringify(rows)}`,
        maxTokens: 2200
      });

      validateDraft(draft, rows);
      for (const series of draft.series) {
        if (!/^#[0-9a-f]{6}$/i.test(series.color)) throw new Error(`Ungültige Farbe: ${series.color}`);
      }
      if (draft.chartType === "scatter" && !rows.some((row) => typeof row[draft.xKey] === "number")) {
        throw new Error("Die X-Achse eines Streudiagramms muss numerisch sein.");
      }
      return {
        ...draft,
        yKey: draft.series[0]?.key ?? "",
        model,
        modelLabel,
        latencyMs: Date.now() - startedAt,
        data: rows
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unbekannter Validierungsfehler";
    }
  }

  throw new Error(`${modelLabel} konnte keine gültige Diagrammkonfiguration erzeugen: ${lastError}`);
}
