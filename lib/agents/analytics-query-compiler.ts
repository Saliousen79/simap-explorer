import { AnalyticsPlan, CantonCode, CompiledAnalyticsQuery, SqlValue } from "@/lib/agents/types";
import { quoteTableName } from "@/lib/config/simap-schema";

const LIMITS: Record<AnalyticsPlan["intent"], number> = {
  trend: 240,
  winner_ranking: 50,
  office_ranking: 50,
  order_type_analysis: 30,
  procedure_comparison: 30,
  cpv_analysis: 50,
  current_projects: 100,
  canton_comparison: 26
};

function addParam(params: SqlValue[], value: SqlValue, cast?: string) {
  params.push(value);
  return `$${params.length}${cast ? `::${cast}` : ""}`;
}

function buildWhere(plan: AnalyticsPlan, cantons: CantonCode[], params: SqlValue[], extra: string[] = []) {
  const conditions = [...extra];
  const { yearFrom, yearTo, dateField, orderTypes, processTypes, pubTypes } = plan.filters;
  if (yearFrom) conditions.push(`${dateField} >= ${addParam(params, `${yearFrom}-01-01`, "date")}`);
  if (yearTo) conditions.push(`${dateField} < ${addParam(params, `${yearTo + 1}-01-01`, "date")}`);
  if (cantons.length) conditions.push(`canton = ANY(${addParam(params, cantons, "text[]")})`);
  if (orderTypes.length) conditions.push(`order_type = ANY(${addParam(params, orderTypes, "text[]")})`);
  if (processTypes.length) conditions.push(`process_type = ANY(${addParam(params, processTypes, "text[]")})`);
  if (pubTypes.length) conditions.push(`pub_type = ANY(${addParam(params, pubTypes, "text[]")})`);
  return conditions.length ? `\nWHERE ${conditions.join(" AND ")}` : "";
}

function timeDimension(plan: AnalyticsPlan) {
  const dimension = plan.dimensions.find((item) => item === "month" || item === "quarter" || item === "year") ?? "month";
  const unit = dimension === "quarter" ? "quarter" : dimension === "year" ? "year" : "month";
  const format = dimension === "quarter" ? "YYYY-\"Q\"Q" : dimension === "year" ? "YYYY" : "YYYY-MM";
  return `to_char(date_trunc('${unit}', ${plan.filters.dateField}), '${format}') AS period`;
}

function orderMetric(plan: AnalyticsPlan, allowed: string[], fallback: string) {
  return allowed.includes(plan.sort.key) ? plan.sort.key : fallback;
}

export function compileAnalyticsQuery(plan: AnalyticsPlan, selectedCantons: CantonCode[]): CompiledAnalyticsQuery {
  const params: SqlValue[] = [];
  const table = quoteTableName(plan.table);
  const limit = Math.min(plan.limit, LIMITS[plan.intent], 1000);
  let sql: string;
  const needsAwardAmount = plan.metrics.includes("total_award_amount") || plan.sort.key === "total_award_amount";

  switch (plan.intent) {
    case "trend":
      sql = `SELECT ${timeDimension(plan)}, COUNT(id)::int AS contract_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${table}${buildWhere(plan, selectedCantons, params)}\nGROUP BY period\nORDER BY period ASC\nLIMIT ${limit}`;
      break;
    case "winner_ranking":
      sql = `SELECT winner_name, COUNT(id)::int AS award_count${needsAwardAmount ? ", COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount" : ""}\nFROM ${table}${buildWhere(plan, selectedCantons, params, ["winner_name IS NOT NULL"])}\nGROUP BY winner_name\nORDER BY ${orderMetric(plan, ["award_count", "total_award_amount"], "award_count")} DESC\nLIMIT ${limit}`;
      break;
    case "office_ranking":
      sql = `SELECT proc_office_name_de, COUNT(id)::int AS contract_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${table}${buildWhere(plan, selectedCantons, params, ["proc_office_name_de IS NOT NULL"])}\nGROUP BY proc_office_name_de\nORDER BY ${orderMetric(plan, ["contract_count", "total_award_amount"], "contract_count")} DESC\nLIMIT ${limit}`;
      break;
    case "order_type_analysis":
      sql = `SELECT order_type, COUNT(id)::int AS contract_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${table}${buildWhere(plan, selectedCantons, params, ["order_type IS NOT NULL"])}\nGROUP BY order_type\nORDER BY ${orderMetric(plan, ["contract_count", "total_award_amount"], "contract_count")} DESC\nLIMIT ${limit}`;
      break;
    case "procedure_comparison":
      sql = `SELECT process_type, COUNT(id)::int AS contract_count, ROUND(AVG(number_of_submissions), 2)::numeric AS avg_submissions\nFROM ${table}${buildWhere(plan, selectedCantons, params, ["process_type IS NOT NULL"])}\nGROUP BY process_type\nORDER BY ${orderMetric(plan, ["contract_count", "avg_submissions"], "contract_count")} DESC\nLIMIT ${limit}`;
      break;
    case "cpv_analysis":
      sql = `SELECT cpv_code_main, COUNT(id)::int AS contract_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${table}${buildWhere(plan, selectedCantons, params, ["cpv_code_main IS NOT NULL"])}\nGROUP BY cpv_code_main\nORDER BY ${orderMetric(plan, ["contract_count", "total_award_amount"], "contract_count")} DESC\nLIMIT ${limit}`;
      break;
    case "current_projects":
      sql = `SELECT publication_date::text AS publication_date, title_de, canton, proc_office_name_de, submission_deadline::text AS submission_deadline\nFROM ${table}${buildWhere(plan, selectedCantons, params)}\nORDER BY publication_date DESC\nLIMIT ${limit}`;
      break;
    case "canton_comparison":
      sql = `SELECT canton, COUNT(id)::int AS contract_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${table}${buildWhere(plan, selectedCantons, params, ["canton IS NOT NULL"])}\nGROUP BY canton\nORDER BY ${orderMetric(plan, ["contract_count", "total_award_amount"], "contract_count")} DESC\nLIMIT ${limit}`;
      break;
  }

  return { sql, params };
}
