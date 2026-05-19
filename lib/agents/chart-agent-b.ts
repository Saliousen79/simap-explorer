import { ChartAgentResult, SqlRow } from "@/lib/agents/types";

function dimensionKey(row: SqlRow | undefined, fallback: string) {
  if (!row) return fallback;
  return Object.keys(row).find((key) => typeof row[key] !== "number") ?? fallback;
}

function valueKey(row: SqlRow | undefined, fallback: string) {
  if (!row) return fallback;
  return (
    Object.keys(row).find((key) => key.includes("value") && typeof row[key] === "number") ??
    Object.keys(row).find((key) => typeof row[key] === "number") ??
    fallback
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
  const yKey = valueKey(firstRow, "total_estimated_value");
  const hasTimeFields = Boolean(firstRow && "year" in firstRow && "month" in firstRow);

  return {
    title: hasTimeFields ? "Estimated Value Trend" : "Value Perspective",
    chartType: hasTimeFields ? "area" : "table",
    xKey: hasTimeFields ? "period" : xKey,
    yKey,
    description: "An alternative view that focuses on estimated value instead of only counting records.",
    whyInteresting: "This helps compare activity volume with financial importance, which can lead to a different BI conclusion.",
    data: hasTimeFields
      ? rows.map((row) => ({
          ...row,
          period: `${row.year}-${String(row.month).padStart(2, "0")}`
        }))
      : rows
  };
}

