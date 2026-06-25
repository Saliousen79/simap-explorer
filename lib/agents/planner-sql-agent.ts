import { AgentWorkflowError } from "@/lib/security/prompt-guard";
import { AnalyticsIntent, AnalyticsPlan, CantonCode } from "@/lib/agents/types";

const PLAN = [
  "Frage einem erlaubten SIMAP-Analysetyp zuordnen",
  "Zeitraum und Kennzahl validieren",
  "Verbindliche Kantonsauswahl anwenden",
  "Parameterisierte Read-only-Abfrage kompilieren"
];

const INTENT_LIMITS: Record<AnalyticsIntent, number> = {
  trend: 240,
  winner_ranking: 15,
  office_ranking: 15,
  procedure_comparison: 20,
  cpv_analysis: 20,
  current_projects: 20,
  canton_comparison: 26
};

function normalized(prompt: string) {
  return prompt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function includesAny(prompt: string, terms: string[]) {
  return terms.some((term) => prompt.includes(term));
}

function extractYears(prompt: string) {
  const years = Array.from(prompt.matchAll(/\b(19\d{2}|20\d{2}|2100)\b/g), (match) => Number(match[1]));
  if (!years.length) return { yearFrom: null, yearTo: null };
  return { yearFrom: Math.min(...years), yearTo: Math.max(...years) };
}

export function wantsCantonComparison(prompt: string) {
  const text = normalized(prompt);
  return includesAny(text, ["vergleich", "vergleiche", "gegenuber", "je kanton", "nach kanton", "zwischen den kantonen"]);
}

function detectIntent(prompt: string): AnalyticsIntent | null {
  const text = normalized(prompt);
  if (includesAny(text, ["aktuell", "offen", "neueste", "projekt", "frist"])) return "current_projects";
  if (includesAny(text, ["trend", "entwicklung", "zeitreihe", "monat", "quartal", "jahrlich", "jährlich"])) return "trend";
  if (includesAny(text, ["gewinner", "gewonn", "winner", "anbieter", "auftragnehmer", "zuschlagsempfanger", "unternehmen", "firma", "firmen"])) return "winner_ranking";
  if (includesAny(text, ["auftraggeber", "vergabestelle", "beschaffungsstelle"])) return "office_ranking";
  if (includesAny(text, ["verfahren", "procedure", "angebot", "submission"])) return "procedure_comparison";
  if (includesAny(text, ["cpv", "branche", "kategorie", "sektor"])) return "cpv_analysis";
  if (includesAny(text, ["kanton", "kantone", "vergabe", "ausschreibung", "simap", "auftrag", "volumen"])) return "canton_comparison";
  return null;
}

function defaultsFor(intent: AnalyticsIntent) {
  switch (intent) {
    case "trend": return { dimensions: ["month"] as const, metrics: ["contract_count", "total_award_amount"] as const, chart: "line" as const };
    case "winner_ranking": return { dimensions: ["winner_name"] as const, metrics: ["award_count"] as const, chart: "bar" as const };
    case "office_ranking": return { dimensions: ["proc_office_name_de"] as const, metrics: ["contract_count", "total_award_amount"] as const, chart: "bar" as const };
    case "procedure_comparison": return { dimensions: ["process_type"] as const, metrics: ["contract_count", "avg_submissions"] as const, chart: "bar" as const };
    case "cpv_analysis": return { dimensions: ["cpv_code_main"] as const, metrics: ["contract_count", "total_award_amount"] as const, chart: "treemap" as const };
    case "current_projects": return { dimensions: ["publication_date", "title_de", "submission_deadline"] as const, metrics: [] as const, chart: "table" as const };
    case "canton_comparison": return { dimensions: ["canton"] as const, metrics: ["contract_count", "total_award_amount"] as const, chart: "bar" as const };
  }
}

export function createFallbackAnalyticsPlan(userPrompt: string): AnalyticsPlan {
  const intent = detectIntent(userPrompt);
  if (!intent) {
    throw new AgentWorkflowError({
      code: "UNSUPPORTED_TOPIC",
      message: "Die Frage gehört nicht zu den unterstützten SIMAP-Analysen.",
      suggestions: ["Frage nach Vergabetrends, Gewinnern, Vergabestellen, Verfahren, CPV-Branchen oder Kantonen."],
      retryable: false,
      field: "message"
    });
  }
  const defaults = defaultsFor(intent);
  const years = extractYears(userPrompt);
  const text = normalized(userPrompt);
  return {
    supported: true,
    unsupportedReason: "",
    intent,
    table: intent === "current_projects" ? "public.projects" : "public.archive",
    dimensions: [...defaults.dimensions],
    metrics: [...defaults.metrics],
    filters: {
      ...years,
      dateField: includesAny(text, ["zuschlagsdatum", "entscheidungsdatum", "zuschlagsjahr"]) ? "award_decision_date" : "publication_date",
      orderTypes: [], processTypes: [], pubTypes: []
    },
    sort: { key: defaults.metrics[0] ?? "publication_date", direction: intent === "trend" ? "asc" : "desc" },
    limit: INTENT_LIMITS[intent],
    plan: PLAN,
    reason: "Die Frage wurde einem freigegebenen SIMAP-Analysetyp zugeordnet.",
    expectedChartType: defaults.chart
  };
}

export function normalizeAnalyticsPlan(draft: AnalyticsPlan, userPrompt: string, selectedCantons: CantonCode[]): AnalyticsPlan {
  if (!draft.supported) {
    throw new AgentWorkflowError({
      code: "UNSUPPORTED_TOPIC",
      message: draft.unsupportedReason || "Diese Frage kann mit den freigegebenen SIMAP-Daten nicht beantwortet werden.",
      suggestions: ["Frage nach Vergabetrends, Gewinnern, Vergabestellen, Verfahren, CPV-Branchen oder Kantonen."],
      retryable: false,
      field: "message"
    });
  }

  let intent = draft.intent;
  if (selectedCantons.length > 1 && wantsCantonComparison(userPrompt)) intent = "canton_comparison";
  const fallback = createFallbackAnalyticsPlan(userPrompt);
  const defaults = defaultsFor(intent);
  const years = extractYears(userPrompt);
  const timeDimension = draft.dimensions.find((item) => item === "month" || item === "quarter" || item === "year");

  return {
    ...fallback,
    supported: true,
    intent,
    table: intent === "current_projects" ? "public.projects" : "public.archive",
    dimensions: intent === "trend" && timeDimension ? [timeDimension] : [...defaults.dimensions],
    metrics: [...defaults.metrics],
    filters: {
      ...fallback.filters,
      ...years,
      orderTypes: [], processTypes: [], pubTypes: []
    },
    sort: { key: defaults.metrics[0] ?? "publication_date", direction: intent === "trend" ? "asc" : "desc" },
    limit: Math.min(draft.limit, INTENT_LIMITS[intent]),
    plan: draft.plan,
    reason: draft.reason,
    expectedChartType: defaults.chart
  };
}
