import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

/**
 * GET  /api/profile — the signed-in user's business profile.
 * PUT  /api/profile — create or update it.
 *
 * RLS (auth.uid() = user_id) enforces ownership; the service-role key is
 * never used here. A profile row is created by the on_auth_user_created
 * trigger at signup, so this is normally an update.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json(data as Profile | null);
}

interface ProfileInput {
  business_name?: unknown;
  business_type?: unknown;
  home_currency?: unknown;
  supplier_currency?: unknown;
  invoice_amount?: unknown;
  target_margin?: unknown;
  days_until_due?: unknown;
}

function parseProfileInput(body: ProfileInput) {
  const text = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
  const code = (v: unknown) =>
    typeof v === "string" && /^[A-Za-z]{3}$/.test(v.trim()) ? v.trim().toUpperCase() : null;

  const home = code(body.home_currency);
  const supplier = code(body.supplier_currency);
  const amount = Number(body.invoice_amount);
  const margin = Number(body.target_margin);
  const days = Number(body.days_until_due);

  if (!home || !supplier) return null;
  if (home === supplier) return null;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return null;
  if (!Number.isFinite(margin) || margin < 0 || margin > 100) return null;
  if (!Number.isFinite(days) || days < 0 || days > 365) return null;

  return {
    business_name: text(body.business_name, 120),
    business_type: text(body.business_type, 120),
    home_currency: home,
    supplier_currency: supplier,
    invoice_amount: amount,
    target_margin: margin,
    days_until_due: Math.round(days),
  };
}

export async function PUT(request: NextRequest) {
  let body: ProfileInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseProfileInput(body);
  if (!parsed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid profile: need two different 3-letter currencies, invoice_amount > 0, target_margin 0-100, days_until_due 0-365",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, ...parsed, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json(data as Profile);
}
