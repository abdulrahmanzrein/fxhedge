import { NextResponse } from "next/server";
import { SUGGESTED_QUESTIONS } from "@/lib/assistant/prompt";

/** GET /api/suggested — starter questions for the chat chips. */
export async function GET() {
  return NextResponse.json({ questions: SUGGESTED_QUESTIONS });
}
