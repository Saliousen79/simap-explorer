import { createStructuredCompletion } from "@/lib/ai/openrouter";
import { ALLOWED_COLUMNS } from "@/lib/config/simap-schema";
import { PlannerSQLResult } from "@/lib/agents/types";

const SQL_MODEL = process.env.OPENROUTER_SQL_MODEL ?? "deepseek/deepseek-v4-flash";

const plannerSchema = {
  type: "object",
  additionalProperties: false,
  required: ["plan", "sql", "reason", "expectedChartType"],
  properties: {
    plan: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
    sql: { type: "string" },
    reason: { type: "string" },
    expectedChartType: {
      type: "string",
      enum: ["bar", "line", "area", "pie", "scatter", "composed", "table"]
    }
  }
};

export async function OpenRouterSQLAgent(userPrompt: string): Promise<PlannerSQLResult> {
  const columns = ALLOWED_COLUMNS.join(", ");
  return createStructuredCompletion<PlannerSQLResult>({
    model: SQL_MODEL,
    schemaName: "simap_sql_plan",
    schema: plannerSchema,
    temperature: 0.1,
    system: `Du bist ein PostgreSQL-BI-Planer für Schweizer SIMAP-Daten. Erzeuge genau eine sichere SELECT-Abfrage.\n\nTabellen:\n- public.archive: vollständiges historisches Archiv\n- public.projects: aktuelle Projekte und Fristen\n\nErlaubte Spalten: ${columns}\n\nRegeln:\n- Verwende nur die beiden genannten Tabellen und erlaubten Spalten.\n- Kein SELECT *, keine Unterabfragen, CTEs oder schreibenden Befehle.\n- Aggregationen dürfen alle passenden Datenbankzeilen auswerten.\n- Das Resultat muss mit LIMIT 1000 oder kleiner begrenzt sein.\n- Verwende nur COUNT, SUM, AVG, MIN, MAX, ROUND, COALESCE, date_trunc und to_char.\n- Geldbeträge stammen aus award_amount und können NULL sein.\n- Antworte auf Deutsch und ausschließlich im vorgegebenen JSON-Schema.`,
    prompt: `Nutzerfrage: ${userPrompt}`
  });
}
