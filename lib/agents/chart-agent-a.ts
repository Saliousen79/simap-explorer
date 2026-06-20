import { ChartAgentResult, SqlRow } from "@/lib/agents/types";

function firstKey(row: SqlRow | undefined, fallback: string) {
  return row ? Object.keys(row)[0] ?? fallback : fallback;
}

function numericKey(row: SqlRow | undefined) {
  if (!row) return null;
  return Object.keys(row).find((key) => typeof row[key] === "number") ?? null;
}

/**
 * ChartAgentA
 *
 * Lecture concept:
 * This is one worker agent. It receives the SQL result and returns
 * a conservative chart configuration, not raw chart code.
 */
export function ChartAgentA(rows: SqlRow[]): ChartAgentResult {
  const firstRow = rows[0];
  const xKey = firstKey(firstRow, "label");
  const yKey = numericKey(firstRow);
  const hasTimeFields = Boolean(firstRow && "period" in firstRow);
  const chartType = !yKey ? "table" : hasTimeFields ? "line" : "bar";

  return {
    title: hasTimeFields ? "Contracts Over Time" : "Top SIMAP Segments",
    chartType,
    xKey: hasTimeFields ? "period" : xKey,
    yKey: yKey ?? "",
    series: yKey ? [{ key: yKey, label: yKey, type: hasTimeFields ? "line" : "bar", color: "#38bdf8" }] : [],
    stacked: false,
    showLegend: false,
    description: "A clear management-friendly view of the main aggregated result.",
    whyInteresting: "This chart highlights the strongest pattern in the SQL result without adding unnecessary complexity.",
    insights: ["Lokale Ersatzdarstellung auf Basis des Abfrageergebnisses.", "Für eine KI-Interpretation ist OpenRouter erforderlich."],
    caveat: "Diese lokale Darstellung enthält keine LLM-Interpretation.",
    model: "local",
    modelLabel: "Lokaler Fallback",
    latencyMs: 0,
    data: rows
  };
}
