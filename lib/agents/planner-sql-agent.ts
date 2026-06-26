import { AgentWorkflowError } from "@/lib/security/prompt-guard";
import { AnalyticsIntent, AnalyticsMetric, AnalyticsPlan, CantonCode } from "@/lib/agents/types";

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
  order_type_analysis: 20,
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

function clampYear(value: number) {
  return Math.min(2100, Math.max(1990, value));
}

function extractYears(prompt: string) {
  const explicit = Array.from(prompt.matchAll(/\b(19\d{2}|20\d{2}|2100)\b/g), (match) => Number(match[1]));
  if (explicit.length) {
    return { yearFrom: clampYear(Math.min(...explicit)), yearTo: clampYear(Math.max(...explicit)) };
  }
  return extractRelativeYears(prompt);
}

// Relative Zeitangaben wie "in den letzten 6 Jahren", "seit 5 Jahren" oder
// "letztes Jahr" enthalten keine explizite Jahreszahl. Ohne diese Erkennung
// würde die kompilierte Query ohne Datumsfilter laufen und das gesamte Archiv
// aggregieren – das führte zu QUERY_FAILED (Timeout auf dem Serverless-Backend).
function extractRelativeYears(prompt: string) {
  const text = normalized(prompt);
  const currentYear = new Date().getFullYear();

  const since = text.match(/\bseit\s+(\d{1,2})\s+jahr/);
  if (since) {
    const years = Number(since[1]);
    if (years > 0 && years <= 100) {
      return { yearFrom: clampYear(currentYear - years), yearTo: clampYear(currentYear) };
    }
  }

  const last = text.match(/\bletzt\w*\s+(\d{1,2})\s+jahr/);
  if (last) {
    const years = Number(last[1]);
    if (years > 0 && years <= 100) {
      // inkl. aktuellem (ggf. unvollständigem) Jahr => N Kalenderjahre.
      return { yearFrom: clampYear(currentYear - years + 1), yearTo: clampYear(currentYear) };
    }
  }

  if (/\bletzt\w*\s+jahr\b/.test(text)) {
    return { yearFrom: clampYear(currentYear - 1), yearTo: clampYear(currentYear - 1) };
  }

  return { yearFrom: null, yearTo: null };
}

export function wantsCantonComparison(prompt: string) {
  const text = normalized(prompt);
  return includesAny(text, ["vergleich", "vergleiche", "gegenuber", "je kanton", "nach kanton", "zwischen den kantonen"]);
}

function wantsAwardAmount(prompt: string) {
  const text = normalized(prompt);
  return includesAny(text, [
    "auftragsvolumen",
    "volumen",
    "betrag",
    "summe",
    "wert",
    "chf",
    "franken",
    "geld",
    "teuer",
    "hochste auftragsvolumen",
    "hochstes auftragsvolumen",
    "meistes auftragsvolumen"
  ]);
}

function detectIntent(prompt: string): AnalyticsIntent | null {
  const text = normalized(prompt);
  if (includesAny(text, ["aktuell", "offen", "neueste", "projekt", "frist"])) return "current_projects";
  if (includesAny(text, ["trend", "entwicklung", "zeitreihe", "monat", "quartal", "jahrlich", "jährlich"])) return "trend";
  if (includesAny(text, ["gewinner", "gewonn", "winner", "anbieter", "auftragnehmer", "zuschlagsempfanger", "unternehmen", "firma", "firmen"])) return "winner_ranking";
  if (includesAny(text, ["auftraggeber", "vergabestelle", "beschaffungsstelle"])) return "office_ranking";
  if (includesAny(text, ["auftragsart", "auftragsarten", "auftragstyp", "auftragstypen", "order type", "order types"])) return "order_type_analysis";
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
    case "order_type_analysis": return { dimensions: ["order_type"] as const, metrics: ["contract_count", "total_award_amount"] as const, chart: "bar" as const };
    case "procedure_comparison": return { dimensions: ["process_type"] as const, metrics: ["contract_count", "avg_submissions"] as const, chart: "bar" as const };
    case "cpv_analysis": return { dimensions: ["cpv_code_main"] as const, metrics: ["contract_count", "total_award_amount"] as const, chart: "treemap" as const };
    case "current_projects": return { dimensions: ["publication_date", "title_de", "submission_deadline"] as const, metrics: [] as const, chart: "table" as const };
    case "canton_comparison": return { dimensions: ["canton"] as const, metrics: ["contract_count", "total_award_amount"] as const, chart: "bar" as const };
  }
}

function metricsForPrompt(intent: AnalyticsIntent, userPrompt: string): AnalyticsMetric[] {
  if (!wantsAwardAmount(userPrompt)) return [...defaultsFor(intent).metrics];

  switch (intent) {
    case "winner_ranking":
      return ["total_award_amount", "award_count"];
    case "office_ranking":
    case "order_type_analysis":
    case "cpv_analysis":
    case "canton_comparison":
      return ["total_award_amount", "contract_count"];
    default:
      return [...defaultsFor(intent).metrics];
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
  const metrics = metricsForPrompt(intent, userPrompt);
  return {
    supported: true,
    unsupportedReason: "",
    intent,
    table: intent === "current_projects" ? "public.projects" : "public.archive",
    dimensions: [...defaults.dimensions],
    metrics,
    filters: {
      ...years,
      dateField: includesAny(text, ["zuschlagsdatum", "entscheidungsdatum", "zuschlagsjahr"]) ? "award_decision_date" : "publication_date",
      orderTypes: [], processTypes: [], pubTypes: []
    },
    sort: { key: metrics[0] ?? "publication_date", direction: intent === "trend" ? "asc" : "desc" },
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
  const metrics = metricsForPrompt(intent, userPrompt);

  return {
    ...fallback,
    supported: true,
    intent,
    table: intent === "current_projects" ? "public.projects" : "public.archive",
    dimensions: intent === "trend" && timeDimension ? [timeDimension] : [...defaults.dimensions],
    metrics,
    filters: {
      ...fallback.filters,
      ...years,
      orderTypes: [], processTypes: [], pubTypes: []
    },
    sort: { key: metrics[0] ?? "publication_date", direction: intent === "trend" ? "asc" : "desc" },
    limit: Math.min(draft.limit, INTENT_LIMITS[intent]),
    plan: draft.plan,
    reason: draft.reason,
    expectedChartType: defaults.chart
  };
}
