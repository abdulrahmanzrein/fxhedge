import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Scenario } from "@/types";

/**
 * GET  /api/scenarios — list the signed-in user's saved scenarios.
 * POST /api/scenarios — create one. RLS (auth.uid()) enforces ownership;
 * the service-role key is never used here.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json(data as Scenario[]);
}

interface ScenarioInput {
  label?: unknown;
  amount?: unknown;
  pair?: unknown;
  revenue?: unknown;
  days_ago?: unknown;
  target_margin?: unknown;
}

function parseScenarioInput(body: ScenarioInput) {
  const amount = Number(body.amount);
  const revenue = Number(body.revenue);
  const daysAgo = Number(body.days_ago ?? 21);
  const targetMargin = Number(body.target_margin ?? 10);
  const pair = typeof body.pair === "string" ? body.pair.trim().toUpperCase() : "";

  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!Number.isFinite(revenue) || revenue < 0) return null;
  if (!Number.isFinite(daysAgo) || daysAgo < 0 || daysAgo > 3650) return null;
  if (!Number.isFinite(targetMargin) || targetMargin < -100 || targetMargin > 1000)
    return null;
  if (!/^[A-Z]{3}-[A-Z]{3}$/.test(pair) || pair.slice(0, 3) === pair.slice(4))
    return null;

  return {
    label: typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 120) : "Primary invoice",
    amount,
    pair,
    revenue,
    days_ago: Math.round(daysAgo),
    target_margin: targetMargin,
  };
}

export async function POST(request: NextRequest) {
  let body: ScenarioInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseScenarioInput(body);
  if (!parsed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid scenario: need amount>0, revenue>=0, days_ago 0-3650, target_margin -100..1000, pair like EUR-CAD",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("scenarios")
    .insert({ ...parsed, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json(data as Scenario, { status: 201 });
}
