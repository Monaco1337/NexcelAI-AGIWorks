/**
 * KI-Anbieter-Abstraktion.
 *
 * Zwei Implementierungen:
 *  - `OpenAIProvider` — nutzt `OPENAI_API_KEY` (Standard).
 *  - `OfflineProvider` — deterministischer Stub für Tests und für die
 *    Nutzung ohne API-Key: liefert einen leeren Ergebnisrahmen und
 *    kennzeichnet den Run mit `provider = "offline"`.
 *
 * Wichtig: Der Provider gibt IMMER `{ text, tokensIn, tokensOut }` zurück.
 * Interpretation als JSON (falls gefordert) macht der Workflow.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  temperature: number;
  messages: ChatMessage[];
  /** Wenn true, wird `response_format: {"type":"json_object"}` gesetzt. */
  jsonMode?: boolean;
  /** Optionales Sicherheitsnetz gegen zu lange Antworten. */
  maxOutputTokens?: number;
}

export interface ChatResponse {
  text: string;
  tokensIn: number | null;
  tokensOut: number | null;
  provider: "openai" | "offline";
  model: string;
}

export interface AIProvider {
  name: "openai" | "offline";
  chat(req: ChatRequest): Promise<ChatResponse>;
}

/* -------------------------------------------------------------------------- */
/*  OpenAI                                                                     */
/* -------------------------------------------------------------------------- */

class OpenAIProvider implements AIProvider {
  name = "openai" as const;
  constructor(private apiKey: string) {}

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const url = "https://api.openai.com/v1/chat/completions";
    const body = {
      model: req.model,
      temperature: req.temperature,
      messages: req.messages,
      max_tokens: req.maxOutputTokens,
      response_format: req.jsonMode ? { type: "json_object" } : undefined,
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    return {
      text,
      tokensIn: data.usage?.prompt_tokens ?? null,
      tokensOut: data.usage?.completion_tokens ?? null,
      provider: "openai",
      model: req.model,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Offline (Fallback)                                                          */
/* -------------------------------------------------------------------------- */

class OfflineProvider implements AIProvider {
  name = "offline" as const;
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const skeleton = req.jsonMode
      ? JSON.stringify(
          {
            status: "offline_stub",
            note:
              "OPENAI_API_KEY nicht gesetzt. Kein AI-Provider verfügbar. Trage OPENAI_API_KEY in die Env ein, um echte Ergebnisse zu erhalten.",
          },
          null,
          2
        )
      : "OPENAI_API_KEY nicht gesetzt. Es wurde ein Offline-Stub erzeugt.";
    return {
      text: skeleton,
      tokensIn: null,
      tokensOut: null,
      provider: "offline",
      model: req.model,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Factory                                                                    */
/* -------------------------------------------------------------------------- */

export function getAiProvider(): AIProvider {
  const key = (process.env.OPENAI_API_KEY ?? "").trim();
  if (key.length > 0) return new OpenAIProvider(key);
  return new OfflineProvider();
}
