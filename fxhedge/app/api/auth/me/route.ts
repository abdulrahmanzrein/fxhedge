import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/auth/me — current user + profile (PRD FR-8 auth contract). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email },
    profile,
  });
}
