/**
 * API-Route /api/agent/chat
 * =========================
 *
 * HTTP-Einstiegspunkt der Agenten-Pipeline. Diese Datei ist bewusst SCHLANK
 * (KISS): sie kümmert sich nur um HTTP – Request-Validierung, Rate-Limit und
 * NDJSON-Streaming – und delegiert die gesamte Agenten-Logik an
 * runAgentPipeline (lib/agents/pipeline.ts).
 *
 * Streaming-Protokoll: Antwort ist "application/x-ndjson" – ein JSON-Objekt
 * pro Zeile. Jede Stufe der Pipeline schickt Events (stage, plan, sql, data,
 * candidate, complete, error), die der Client live anzeigt.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgentPipeline } from "@/lib/agents/pipeline";
import {
  AgentError, CANTON_CODES, cantonCodeSchema
} from "@/lib/agents/types";
import {
  AgentWorkflowError, assertCantonSelectionMatchesPrompt, assertPromptAllowed, toAgentError
} from "@/lib/security/prompt-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

// Einfaches In-Memory-Rate-Limit (pro IP, 15 Anfragen / 5 Min).
// Hinweis: auf Vercel-Serverless wirkt dies nur pro Instanz – für ein
// Studienprojekt ausreichend; für echte Skalierung würde man Redis nutzen.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 15;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

// Validierung des Request-Bodies: Frage + Kantonsauswahl + Modus.
const requestSchema = z.object({
  message: z.string().trim().min(3, "Die Frage muss mindestens 3 Zeichen enthalten.").max(800, "Die Frage darf höchstens 800 Zeichen enthalten."),
  selectedCantons: z.array(cantonCodeSchema).max(CANTON_CODES.length),
  selectionMode: z.enum(["all", "specific"])
}).strict().superRefine((value, context) => {
  if (value.selectionMode === "all" && value.selectedCantons.length) {
    context.addIssue({ code: "custom", path: ["selectedCantons"], message: "Bei 'Ganze Schweiz' dürfen keine einzelnen Kantone übertragen werden." });
  }
  if (value.selectionMode === "specific" && !value.selectedCantons.length) {
    context.addIssue({ code: "custom", path: ["selectedCantons"], message: "Wähle mindestens einen Kanton oder 'Ganze Schweiz'." });
  }
  if (new Set(value.selectedCantons).size !== value.selectedCantons.length) {
    context.addIssue({ code: "custom", path: ["selectedCantons"], message: "Kantone dürfen nicht doppelt vorkommen." });
  }
});

function errorResponse(error: AgentError, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Prüft, ob die IP noch im erlaubten Fenster liegt, sonst RATE_LIMITED. */
function assertWithinRateLimit(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  if (current.count >= RATE_LIMIT_REQUESTS) {
    throw new AgentWorkflowError({
      code: "RATE_LIMITED",
      message: "Zu viele Analyseanfragen in kurzer Zeit.",
      suggestions: ["Warte einige Minuten und versuche es erneut."],
      retryable: true
    });
  }
  current.count += 1;
}

export async function POST(request: Request) {
  // 1) Request-Validierung + Guardrails (Prompt-Guard, Kantons-Konsistenz).
  //    Diese Checks laufen VOR der Pipeline, um ungültige Anfragen früh abzuweisen.
  let input: z.infer<typeof requestSchema>;
  try {
    assertWithinRateLimit(request);
    input = requestSchema.parse(await request.json());
    assertPromptAllowed(input.message);
    assertCantonSelectionMatchesPrompt(input.message, input.selectedCantons, input.selectionMode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse({
        code: "INVALID_REQUEST",
        message: error.issues[0]?.message ?? "Ungültiger Request.",
        suggestions: ["Prüfe Frage und Kantonsauswahl."],
        retryable: false,
        field: error.issues[0]?.path.join(".")
      }, 400);
    }
    const detail = toAgentError(error, "INVALID_REQUEST");
    return errorResponse(detail, detail.code === "RATE_LIMITED" ? 429 : 400);
  }

  // 2) Streaming-Antwort aufbauen und Pipeline starten.
  //    runAgentPipeline schreibt Events als NDJSON-Zeilen in den Stream.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await runAgentPipeline(
          { message: input.message, selectedCantons: input.selectedCantons },
          emit as Parameters<typeof runAgentPipeline>[1]
        );
      } catch (error) {
        // Sicherheitsnetz: Pipeline fängt eigene Fehler, aber falls hier noch
        // etwas durchrutscht, nicht den Stream korrumpieren.
        emit({ type: "error", error: toAgentError(error) });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
