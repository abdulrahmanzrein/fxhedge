import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectNaturalHedges, type CurrencyFlow } from "@/lib/natural-hedge";

/**
 * GET /api/natural-hedge
 * Reads the signed-in user's saved scenarios and looks for same-currency
 * opposite flows (a EUR payable + a EUR receivable = net them, skip FX).
 * Read-only, RLS-enforced, suggestion-only — we never execute anything.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: scenarios, error } = await supabase
    .from("scenarios")
    .select("id, amount, pair, label")
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // A scenario "EUR-CAD" with an invoice due = outgoing EUR.
  // A scenario marked as incoming (label convention "[in]") = incoming EUR.
  // (Keep it honest and simple: direction comes from a label prefix until
  // a dedicated column exists. Documented for Dev 2 + the demo.)
  const flows: CurrencyFlow[] = (scenarios ?? []).map((s) => ({
    id: s.id,
    currency: s.pair.slice(0, 3),
    amount: Number(s.amount),
    direction: s.label?.startsWith("[in]") ? "incoming" : "outgoing",
    label: s.label ?? "Scenario",
  }));

  return NextResponse.json(detectNaturalHedges(flows));
}
