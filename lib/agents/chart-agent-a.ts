import { ChartAgentResult, SqlRow } from "@/lib/agents/types";

function firstKey(row: SqlRow | undefined, fallback: string) {
  return row ? Object.keys(row)[0] ?? fallback : fallback;
}

function numericKey(row: SqlRow | undefined, fallback: string) {
  if (!row) return fallback;
  return Object.keys(row).find((key) => typeof row[key] === "number") ?? fallback;
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
  const yKey = numericKey(firstRow, "contract_count");
  const hasTimeFields = Boolean(firstRow && "year" in firstRow && "month" in firstRow);

  return {
    title: hasTimeFields ? "Contracts Over Time" : "Top SIMAP Segments",
    chartType: hasTimeFields ? "line" : "bar",
    xKey: hasTimeFields ? "period" : xKey,
    yKey,
    description: "A clear management-friendly view of the main aggregated result.",
    whyInteresting: "This chart highlights the strongest pattern in the SQL result without adding unnecessary complexity.",
    data: hasTimeFields
      ? rows.map((row) => ({
          ...row,
          period: `${row.year}-${String(row.month).padStart(2, "0")}`
        }))
      : rows
  };
}

