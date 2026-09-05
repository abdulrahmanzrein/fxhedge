import { NextResponse, type NextRequest } from "next/server";
import { askAssistant, AssistantUnavailableError } from "@/lib/assistant/ask";
import type { ChatAnswer } from "@/types";

/**
 * POST /api/ask  { question, amount?, pair?, margin_at_risk? }
 * Returns ChatAnswer (types/index.ts). Server-side Claude only.
 */
export async function POST(request: NextRequest) {
  let body: {
    question?: unknown;
    amount?: unknown;
    pair?: unknown;
    margin_at_risk?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 2000) {
    return NextResponse.json(
      { ok: false, error: "question is required (max 2000 chars)" },
      { status: 400 },
    );
  }

  const context = {
    amount: typeof body.amount === "number" ? body.amount : undefined,
    pair: typeof body.pair === "string" ? body.pair : undefined,
    margin_at_risk:
      typeof body.margin_at_risk === "number" ? body.margin_at_risk : undefined,
  };

  try {
    const { answer, model } = await askAssistant(question, context);
    const payload: ChatAnswer = { answer, model };
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof AssistantUnavailableError) {
      const payload: ChatAnswer = { answer: "", error: true };
      return NextResponse.json(payload, { status: 503 });
    }
    const payload: ChatAnswer = { answer: "", error: true };
    return NextResponse.json(payload, { status: 500 });
  }
}
