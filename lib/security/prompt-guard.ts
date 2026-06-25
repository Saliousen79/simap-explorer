import { AgentError, CantonCode } from "@/lib/agents/types";
import { cantonNames, extractMentionedCantons } from "@/lib/config/cantons";

const INJECTION_PATTERNS = [
  /ignore (all|any|the|previous)/i,
  /ignoriere (alle|die|vorherigen)/i,
  /(system|developer)[ -]?prompt/i,
  /(api|secret|service)[ -]?key/i,
  /zeige.*(anweisung|prompt|geheimnis|passwort)/i,
  /(?:drop|delete|update|insert|alter|truncate)\s+(?:table|from|into|public)/i
];

export class AgentWorkflowError extends Error {
  constructor(public readonly detail: AgentError) {
    super(detail.message);
  }
}

export function assertPromptAllowed(prompt: string) {
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(prompt))) {
    throw new AgentWorkflowError({
      code: "UNSUPPORTED_TOPIC",
      message: "Diese Anfrage versucht, Systemregeln oder geschützte Konfigurationen zu beeinflussen.",
      suggestions: ["Formuliere eine fachliche Frage zu Vergaben, Gewinnern, Trends oder Verfahren."],
      retryable: false,
      field: "message"
    });
  }
}

export function assertCantonSelectionMatchesPrompt(prompt: string, selectedCantons: CantonCode[], mode: "all" | "specific") {
  const mentioned = extractMentionedCantons(prompt);
  if (!mentioned.length) return;
  if (mode === "all") {
    throw new AgentWorkflowError({
      code: "FILTER_CONFLICT",
      message: `Die Frage nennt ${cantonNames(mentioned).join(", ")}, auf der Karte ist jedoch die ganze Schweiz ausgewählt.`,
      suggestions: ["Wähle die genannten Kantone auf der Karte oder entferne sie aus der Frage."],
      retryable: false,
      field: "selectedCantons"
    });
  }
  const conflicts = mentioned.filter((code) => !selectedCantons.includes(code));
  if (!conflicts.length) return;

  throw new AgentWorkflowError({
    code: "FILTER_CONFLICT",
    message: `Die Frage nennt ${cantonNames(conflicts).join(", ")}, ausgewählt sind jedoch ${cantonNames(selectedCantons).join(", ")}.`,
    suggestions: ["Passe die Kartenauswahl an oder entferne den abweichenden Kanton aus der Frage."],
    retryable: false,
    field: "selectedCantons"
  });
}

export function toAgentError(error: unknown, fallbackCode: AgentError["code"] = "PLAN_REJECTED"): AgentError {
  if (error instanceof AgentWorkflowError) return error.detail;
  return {
    code: fallbackCode,
    message: error instanceof Error ? error.message : "Die Analyse konnte nicht ausgeführt werden.",
    suggestions: ["Versuche eine klarere SIMAP-Frage mit Zeitraum, Kennzahl und gewünschter Gruppierung."],
    retryable: fallbackCode === "MODEL_UNAVAILABLE" || fallbackCode === "QUERY_FAILED"
  };
}
