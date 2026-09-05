import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

/**
 * Auth helpers — the only interface Dev 2's screens should call.
 * All functions are server-side (Server Components / Route Handlers).
 */

export async function signUp(email: string, password: string, name?: string) {
  const supabase = await createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: name ? { data: { name } } : undefined,
  });
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = await createClient();
  return supabase.auth.signOut();
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

export async function getOwnProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getProfile(user.id);
}

export async function upsertProfile(
  userId: string,
  data: Partial<
    Pick<
      Profile,
      | "business_name"
      | "business_type"
      | "home_currency"
      | "supplier_currency"
      | "invoice_amount"
      | "target_margin"
      | "days_until_due"
    >
  >,
) {
  const supabase = await createClient();
  return supabase
    .from("profiles")
    .upsert({ user_id: userId, ...data, updated_at: new Date().toISOString() });
}
