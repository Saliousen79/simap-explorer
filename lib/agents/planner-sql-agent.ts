import { ALLOWED_COLUMNS, SIMAP_TABLE } from "@/lib/config/simap-schema";
import { PlannerSQLResult } from "@/lib/agents/types";

const PLAN = [
  "Understand the user question",
  "Choose relevant SIMAP fields",
  "Generate an aggregated SQL query",
  "Send the result to two chart agents"
];

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function tableName() {
  return quoteIdentifier(SIMAP_TABLE);
}

function hasColumn(column: (typeof ALLOWED_COLUMNS)[number]) {
  return ALLOWED_COLUMNS.includes(column);
}

/**
 * PlannerSQLAgent
 *
 * Lecture concept:
 * This is a simplified Director Agent.
 * It plans the analysis and creates the SQL query,
 * but it does not decide which chart the user must keep.
 */
export function PlannerSQLAgent(userPrompt: string): PlannerSQLResult {
  const prompt = userPrompt.toLowerCase();

  if ((prompt.includes("trend") || prompt.includes("zeit") || prompt.includes("monat")) && hasColumn("year") && hasColumn("month")) {
    return {
      plan: PLAN,
      sql: `SELECT year, month, COUNT(id)::int AS contract_count, COALESCE(SUM(estimated_value), 0)::numeric AS total_estimated_value
FROM ${tableName()}
GROUP BY year, month
ORDER BY year, month
LIMIT 120`,
      reason: "The query groups SIMAP records by year and month, so the result can show how procurement activity changes over time.",
      expectedChartType: "line"
    };
  }

  if ((prompt.includes("verfahren") || prompt.includes("procedure")) && hasColumn("procedure_type")) {
    return {
      plan: PLAN,
      sql: `SELECT procedure_type, COUNT(id)::int AS contract_count, COALESCE(SUM(estimated_value), 0)::numeric AS total_estimated_value
FROM ${tableName()}
WHERE procedure_type IS NOT NULL
GROUP BY procedure_type
ORDER BY contract_count DESC
LIMIT 15`,
      reason: "The query compares procedure types by number of awards and value, which answers questions about procurement process patterns.",
      expectedChartType: "bar"
    };
  }

  if ((prompt.includes("kategorie") || prompt.includes("category") || prompt.includes("branche")) && hasColumn("category")) {
    return {
      plan: PLAN,
      sql: `SELECT category, COUNT(id)::int AS contract_count, COALESCE(SUM(estimated_value), 0)::numeric AS total_estimated_value
FROM ${tableName()}
WHERE category IS NOT NULL
GROUP BY category
ORDER BY contract_count DESC
LIMIT 15`,
      reason: "The query aggregates contracts by category, making it suitable for comparing the most active procurement areas.",
      expectedChartType: "bar"
    };
  }

  if ((prompt.includes("auftraggeber") || prompt.includes("authority") || prompt.includes("stelle")) && hasColumn("contracting_authority")) {
    return {
      plan: PLAN,
      sql: `SELECT contracting_authority, COUNT(id)::int AS contract_count, COALESCE(SUM(estimated_value), 0)::numeric AS total_estimated_value
FROM ${tableName()}
WHERE contracting_authority IS NOT NULL
GROUP BY contracting_authority
ORDER BY contract_count DESC
LIMIT 15`,
      reason: "The query ranks contracting authorities by activity and value, which helps identify the largest public buyers.",
      expectedChartType: "table"
    };
  }

  return {
    plan: PLAN,
    sql: `SELECT canton, COUNT(id)::int AS contract_count, COALESCE(SUM(estimated_value), 0)::numeric AS total_estimated_value
FROM ${tableName()}
WHERE canton IS NOT NULL
GROUP BY canton
ORDER BY contract_count DESC
LIMIT 15`,
    reason: "The query aggregates SIMAP records by canton, giving a compact overview of regional procurement activity.",
    expectedChartType: "bar"
  };
}

