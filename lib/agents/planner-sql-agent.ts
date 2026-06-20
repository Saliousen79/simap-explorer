import {
  CURRENT_PROJECTS_TABLE,
  DEFAULT_SIMAP_TABLE,
  quoteTableName
} from "@/lib/config/simap-schema";
import { PlannerSQLResult } from "@/lib/agents/types";

const PLAN = [
  "Frage und Filter erkennen",
  "Passende SIMAP-Tabelle wählen",
  "Read-only-Aggregation erstellen",
  "Zwei Diagrammvarianten erzeugen"
];

const CANTONS = new Set([
  "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU",
  "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR",
  "VD", "VS", "ZG", "ZH"
]);

function extractFilters(prompt: string) {
  const yearMatch = prompt.match(/\b(20\d{2})\b/);
  const cantonMatch = prompt.toUpperCase().match(/\b[A-Z]{2}\b/g)?.find((value) => CANTONS.has(value));
  return { year: yearMatch ? Number(yearMatch[1]) : null, canton: cantonMatch ?? null };
}

function archiveWhere(year: number | null, canton: string | null, extra?: string) {
  const conditions: string[] = [];
  if (year) conditions.push(`publication_date >= DATE '${year}-01-01'`, `publication_date < DATE '${year + 1}-01-01'`);
  if (canton) conditions.push(`canton = '${canton}'`);
  if (extra) conditions.push(extra);
  return conditions.length ? `\nWHERE ${conditions.join(" AND ")}` : "";
}

function result(sql: string, reason: string, expectedChartType: PlannerSQLResult["expectedChartType"]): PlannerSQLResult {
  return { plan: PLAN, sql, reason, expectedChartType };
}

export function PlannerSQLAgent(userPrompt: string): PlannerSQLResult {
  const prompt = userPrompt.toLowerCase();
  const { year, canton } = extractFilters(userPrompt);
  const archive = quoteTableName(DEFAULT_SIMAP_TABLE);
  const projects = quoteTableName(CURRENT_PROJECTS_TABLE);

  if (prompt.includes("aktuell") || prompt.includes("offen") || prompt.includes("neueste") || prompt.includes("projekt")) {
    return result(
      `SELECT publication_date::text AS publication_date, title_de, canton, proc_office_name_de, submission_deadline::text AS submission_deadline\nFROM ${projects}${archiveWhere(year, canton)}\nORDER BY publication_date DESC\nLIMIT 20`,
      "Die Abfrage zeigt die neuesten Projekte mit Vergabestelle und Eingabefrist.",
      "table"
    );
  }

  if (prompt.includes("trend") || prompt.includes("zeit") || prompt.includes("monat")) {
    return result(
      `SELECT to_char(date_trunc('month', publication_date), 'YYYY-MM') AS period, COUNT(id)::int AS contract_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${archive}${archiveWhere(year, canton)}\nGROUP BY period\nORDER BY period\nLIMIT 120`,
      "Die Publikationen werden monatlich aggregiert; Zuschlagsvolumen berücksichtigt nur vorhandene Beträge.",
      "line"
    );
  }

  if (prompt.includes("verfahren") || prompt.includes("procedure") || prompt.includes("angebot")) {
    return result(
      `SELECT process_type, COUNT(id)::int AS contract_count, ROUND(AVG(number_of_submissions), 2)::numeric AS avg_submissions\nFROM ${archive}${archiveWhere(year, canton, "process_type IS NOT NULL")}\nGROUP BY process_type\nORDER BY contract_count DESC\nLIMIT 15`,
      "Die Abfrage vergleicht Vergabeverfahren nach Publikationszahl und durchschnittlicher Anzahl Angebote.",
      "bar"
    );
  }

  if (prompt.includes("gewinner") || prompt.includes("winner") || prompt.includes("anbieter")) {
    return result(
      `SELECT winner_name, COUNT(id)::int AS award_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${archive}${archiveWhere(year, canton, "winner_name IS NOT NULL")}\nGROUP BY winner_name\nORDER BY award_count DESC\nLIMIT 15`,
      "Die Abfrage zeigt die häufigsten Zuschlagsempfänger und ihr dokumentiertes Zuschlagsvolumen.",
      "bar"
    );
  }

  if (prompt.includes("auftraggeber") || prompt.includes("vergabestelle") || prompt.includes("stelle")) {
    return result(
      `SELECT proc_office_name_de, COUNT(id)::int AS publication_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${archive}${archiveWhere(year, canton, "proc_office_name_de IS NOT NULL")}\nGROUP BY proc_office_name_de\nORDER BY publication_count DESC\nLIMIT 15`,
      "Die Abfrage ordnet Vergabestellen nach Aktivität und dokumentiertem Zuschlagsvolumen.",
      "table"
    );
  }

  if (prompt.includes("cpv") || prompt.includes("branche") || prompt.includes("kategorie")) {
    return result(
      `SELECT cpv_code_main, COUNT(id)::int AS contract_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${archive}${archiveWhere(year, canton, "cpv_code_main IS NOT NULL")}\nGROUP BY cpv_code_main\nORDER BY contract_count DESC\nLIMIT 15`,
      "Die Abfrage gruppiert Publikationen nach dem Haupt-CPV-Code.",
      "bar"
    );
  }

  return result(
    `SELECT canton, COUNT(id)::int AS contract_count, COALESCE(SUM(award_amount), 0)::numeric AS total_award_amount\nFROM ${archive}${archiveWhere(year, canton, "canton IS NOT NULL")}\nGROUP BY canton\nORDER BY contract_count DESC\nLIMIT 26`,
    "Die Standardanalyse vergleicht Kantone nach Publikationszahl und dokumentiertem Zuschlagsvolumen.",
    "bar"
  );
}
