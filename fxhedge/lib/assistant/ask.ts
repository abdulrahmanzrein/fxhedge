import "server-only";
import { ASSISTANT_SYSTEM_PROMPT } from "./prompt";

/**
 * lib/assistant/ask.ts — server-side Claude call (PRD FR-6).
 * The API key NEVER reaches the client. Guardrails live in the prompt.
 */

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 900;

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

export async function askAssistant(
  question: string,
  context?: AskContext,
): Promise<AskResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("PASTE")) {
    // FR-6 honest fallback: never appear broken, never fake an answer.
    throw new AssistantUnavailableError(
      "The assistant is unavailable right now. For Islamic-finance questions about your payment, please consult a qualified Sharia advisor.",
    );
  }

  const contextBlock = context?.amount
    ? `\n\n[The user's current deal: ${context.pair ?? "currency pair"} payment of ${context.amount}, margin at risk ${context.margin_at_risk ?? "n/a"}. You may reference it if relevant.]`
    : "";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: ASSISTANT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: question + contextBlock }],
    }),
  });

  if (!res.ok) {
    throw new AssistantUnavailableError(
      "The assistant could not be reached. For Islamic-finance questions about your payment, please consult a qualified Sharia advisor.",
    );
  }

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const answer = (json.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n")
    .trim();

  if (!answer) {
    throw new AssistantUnavailableError(
      "The assistant returned an empty response. Please consult a qualified Sharia advisor.",
    );
  }
  return { answer, model: MODEL };
}
