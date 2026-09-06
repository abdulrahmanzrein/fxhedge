import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnProfile, upsertProfile } from "@/lib/auth";
import type { Profile } from "@/types";

/**
 * GET /api/profile — the signed-in user's business profile (null if none yet).
 * PUT /api/profile — upsert it. Ownership enforced by auth; only whitelisted
 * fields are accepted.
 */
export async function GET() {
  const profile = await getOwnProfile();
  if (!profile) {
    return NextResponse.json<Profile | null>(null);
  }
  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const str = (v: unknown, max = 120) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
  const num = (v: unknown, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
  };

  const patch = {
    business_name: str(body.business_name),
    business_type: str(body.business_type),
    home_currency: str(body.home_currency, 3)?.toUpperCase(),
    supplier_currency: str(body.supplier_currency, 3)?.toUpperCase(),
    invoice_amount: num(body.invoice_amount, 1, 1_000_000_000),
    target_margin: num(body.target_margin, -100, 1000),
    days_until_due: num(body.days_until_due, 1, 3650),
  };

  const { error } = await upsertProfile(user.id, patch);
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
