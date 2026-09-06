import "server-only";
import { ASSISTANT_SYSTEM_PROMPT } from "./prompt";

/**
 * lib/assistant/ask.ts — server-side Gemini call (PRD FR-6).
 * The API key NEVER reaches the client. Guardrails live in the prompt.
 */

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * maxOutputTokens covers reasoning AND the reply, so an unbounded think can eat
 * the whole budget and truncate the answer mid-sentence. Cap the thinking and
 * leave the rest for prose.
 */
const MAX_TOKENS = 2048;
const THINKING_BUDGET = 512;

export interface AskContext {
  amount?: number;
  pair?: string;
  margin_at_risk?: number;
}

export interface AskResult {
  answer: string;
  model: string;
}

export class AssistantUnavailableError extends Error {}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

export async function askAssistant(
  question: string,
  context?: AskContext,
): Promise<AskResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("PASTE")) {
    // FR-6 honest fallback: never appear broken, never fake an answer.
    throw new AssistantUnavailableError(
      "The assistant is unavailable right now. For Islamic-finance questions about your payment, please consult a qualified Sharia advisor.",
    );
  }

  const contextBlock = context?.amount
    ? `\n\n[The user's current deal: ${context.pair ?? "currency pair"} payment of ${context.amount}, margin at risk ${context.margin_at_risk ?? "n/a"}. You may reference it if relevant.]`
    : "";

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: ASSISTANT_SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: question + contextBlock }] }],
    generationConfig: {
      maxOutputTokens: MAX_TOKENS,
      thinkingConfig: { thinkingBudget: THINKING_BUDGET },
    },
  });

  const call = () =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body,
    });

  let res = await call();
  // Flash models return 429/503 under load often enough to matter; one retry
  // turns most of those into an answer instead of a dead end.
  if (res.status === 429 || res.status === 503) {
    await new Promise((r) => setTimeout(r, 1200));
    res = await call();
  }

  if (!res.ok) {
    // Server-side only. Surfaces a wrong model id or a rejected key, which are
    // otherwise indistinguishable from any other outage at the UI.
    const detail = await res.text().catch(() => "");
    console.error("[askAssistant] Gemini error", res.status, detail.slice(0, 400));
    throw new AssistantUnavailableError(
      "The assistant could not be reached. For Islamic-finance questions about your payment, please consult a qualified Sharia advisor.",
    );
  }

  const json = (await res.json()) as GeminiResponse;

  const blocked = json.promptFeedback?.blockReason;
  if (blocked) {
    throw new AssistantUnavailableError(
      "That question could not be answered. Please rephrase it, or consult a qualified Sharia advisor.",
    );
  }

  const answer = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!answer) {
    throw new AssistantUnavailableError(
      "The assistant returned an empty response. Please consult a qualified Sharia advisor.",
    );
  }
  return { answer, model: MODEL };
}
