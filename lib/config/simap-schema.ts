export const SIMAP_TABLES = ["public.archive", "public.projects"] as const;

export type SimapTable = (typeof SIMAP_TABLES)[number];

export const DEFAULT_SIMAP_TABLE: SimapTable = "public.archive";
export const CURRENT_PROJECTS_TABLE: SimapTable = "public.projects";

export const ALLOWED_COLUMNS = [
  "id",
  "simap_project_id",
  "simap_publication_id",
  "project_number",
  "publication_number",
  "title_de",
  "description_de",
  "publication_date",
  "submission_deadline",
  "award_decision_date",
  "proc_office_name_de",
  "proc_office_city",
  "proc_office_canton",
  "canton",
  "city",
  "postal_code",
  "pub_type",
  "project_type",
  "project_subtype",
  "process_type",
  "order_type",
  "lots_type",
  "cpv_code_main",
  "winner_name",
  "winner_city",
  "winner_canton",
  "award_amount",
  "award_currency",
  "number_of_submissions",
  "lots_count",
  "construction_type",
  "construction_category"
] as const;

export function quoteTableName(table: SimapTable) {
  return table
    .split(".")
    .map((part) => `"${part.replaceAll('"', '""')}"`)
    .join(".");
}
