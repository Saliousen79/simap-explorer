/**
 * OpenRouter-Client
 * =================
 *
 * Zentrale Funktion für alle LLM-Aufrufe in der Pipeline. Planner und beide
 * Chart-Agenten nutzen denselben Client – so ist die Kommunikation mit den
 * Modellen an EINER Stelle gebündelt (KISS).
 *
 * OpenRouter ist ein Router/OpenAI-kompatibler Proxy: über denselben Endpoint
 * erreicht man viele Modelle (DeepSeek, Gemini, …). Welches Modell genutzt
 * wird, steuert der Aufrufer über das `model`-Feld.
 *
 * Schlüsselprinzip "structured completion":
 *  Wir verlangen eine Antwort im JSON-Schema (response_format: json_schema,
 *  strict: true). Das Modell darf NUR JSON gemäss Schema zurückgeben – keinen
 *  Freitext, keinen Code, keine Markdown-Erklärungen. Damit ist die Rückgabe
 *  direkt als getyptes Objekt weiterverarbeitbar und nicht anfällig für
 *  Parse-Fehler oder versteckte Anweisungen.
 *
 * Security: der API-Key steht nur serverseitig (process.env), niemals im
 * Client-Bundle. Er wird hier als Bearer-Header gesendet.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

export interface StructuredCompletionOptions {
  model: string;
  system: string;
  prompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/** Hat der Server einen OpenRouter-Key konfiguriert? (für Feature-Checks) */
export function hasOpenRouterKey() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

/**
 * Ruft ein LLM auf und gibt ein streng schema-validiertes JSON-Objekt zurück.
 * Wirft bei fehlendem Key, HTTP-Fehler, leerer Antwort oder ungültigem JSON.
 */
export async function createStructuredCompletion<T>({
  model,
  system,
  prompt,
  schemaName,
  schema,
  temperature = 0.2,
  maxTokens = 1800,
  timeoutMs = 30_000
}: StructuredCompletionOptions): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY ist nicht konfiguriert.");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // HTTP-Referer + X-Title identifizieren die App bei OpenRouter (optional, aber guter Stil).
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "SIMAP Explorer"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
      // Das Herzstück: strikte JSON-Schema-Antwort. Das Modell kann nur
      // strukturieren, nicht frei plaudern.
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema }
      }
    }),
    signal: AbortSignal.timeout(timeoutMs) // harte 30s-Grenze, damit Vercel-60s nicht voll ausgeschöpft werden
  });

  const payload = (await response.json()) as OpenRouterResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenRouter request failed (${response.status}).`);
  }

  // choices[0].message.content ist der JSON-String des Modells.
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter hat keine strukturierte Antwort geliefert.");
  }

  // Da strict-json_schema erzwungen war, ist content gültiges JSON.
  // Falls nicht (Modell-Fehlverhalten), sauber werfen statt still falsch liefern.
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("OpenRouter hat ungültiges JSON geliefert.");
  }
}
