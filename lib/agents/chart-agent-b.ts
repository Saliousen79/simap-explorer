import { ChartAgentResult, SqlRow } from "@/lib/agents/types";

function dimensionKey(row: SqlRow | undefined, fallback: string) {
  if (!row) return fallback;
  return Object.keys(row).find((key) => typeof row[key] !== "number") ?? fallback;
}

function valueKey(row: SqlRow | undefined) {
  if (!row) return null;
  return (
    Object.keys(row).find((key) => (key.includes("amount") || key.includes("value")) && typeof row[key] === "number") ??
    Object.keys(row).find((key) => typeof row[key] === "number") ??
    null
  );
}

/**
 * ChartAgentB
 *
 * Lecture concept:
 * This is a second worker agent. It uses the same SQL result as Agent A,
 * but suggests a different analytical perspective for the human to compare.
 */
export function ChartAgentB(rows: SqlRow[]): ChartAgentResult {
  const firstRow = rows[0];
  const xKey = dimensionKey(firstRow, "label");
  const yKey = valueKey(firstRow);
  const hasTimeFields = Boolean(firstRow && "period" in firstRow);

  return {
    title: hasTimeFields ? "Estimated Value Trend" : "Value Perspective",
    chartType: hasTimeFields && yKey ? "area" : "table",
    xKey: hasTimeFields ? "period" : xKey,
    yKey: yKey ?? "",
    series: yKey ? [{ key: yKey, label: yKey, type: hasTimeFields ? "area" : "bar", color: "#818cf8" }] : [],
    stacked: false,
    showLegend: false,
    description: "An alternative view that focuses on estimated value instead of only counting records.",
    whyInteresting: "This helps compare activity volume with financial importance, which can lead to a different BI conclusion.",
    insights: ["Lokale Ersatzdarstellung mit Fokus auf finanzielle Kennzahlen.", "Für eine KI-Interpretation ist OpenRouter erforderlich."],
    caveat: "Diese lokale Darstellung enthält keine LLM-Interpretation.",
    model: "local",
    modelLabel: "Lokaler Fallback",
    latencyMs: 0,
    data: rows
  };
}
