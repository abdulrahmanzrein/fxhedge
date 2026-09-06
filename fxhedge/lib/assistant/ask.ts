import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ASSISTANT_SYSTEM_PROMPT } from "./prompt";

/**
 * lib/assistant/ask.ts — server-side Claude call (PRD FR-6).
 * The API key NEVER reaches the client. Guardrails live in the prompt.
 */

// Cheapest model in the current lineup ($1/$5 per MTok), which is what this
// assistant needs: it answers from the system prompt, not from reasoning.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

/**
 * A cost ceiling, not a length target. Answers run ~1k tokens; this caps a
 * runaway generation without ever truncating a normal one.
 */
const MAX_TOKENS = 2048;

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

  const client = new Anthropic({ apiKey });

  let response: Anthropic.Message;
  try {
    // The SDK retries 429s and 5xx on its own (2 attempts), so there is no
    // hand-rolled backoff loop here.
    response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: ASSISTANT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: question + contextBlock }],
    });
  } catch (err) {
    // Server-side only, and split by cause: a rejected key and a quota wall are
    // indistinguishable at the UI, and we have already lost an afternoon to
    // exactly that ambiguity once.
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[askAssistant] Anthropic key rejected", err.message);
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error("[askAssistant] Anthropic rate limited", err.message);
    } else if (err instanceof Anthropic.APIConnectionError) {
      // Subclasses APIError, so it has to be caught before the general case.
      console.error("[askAssistant] Anthropic unreachable", err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error("[askAssistant] Anthropic error", err.status, err.message);
    } else {
      console.error("[askAssistant] unexpected failure", err);
    }
    throw new AssistantUnavailableError(
      "The assistant could not be reached. For Islamic-finance questions about your payment, please consult a qualified Sharia advisor.",
    );
  }

  if (response.stop_reason === "refusal") {
    throw new AssistantUnavailableError(
      "That question could not be answered. Please rephrase it, or consult a qualified Sharia advisor.",
    );
  }

  const answer = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  if (!answer) {
    throw new AssistantUnavailableError(
      "The assistant returned an empty response. Please consult a qualified Sharia advisor.",
    );
  }
  return { answer, model: MODEL };
}
