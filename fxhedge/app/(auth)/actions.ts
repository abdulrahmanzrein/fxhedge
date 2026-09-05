"use server";
import { signIn, signUp } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(_: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  try {
    const { error } = await signIn(email, password);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Login failed. Please try again." };
  }
  redirect("/dashboard");
}

export async function signUpAction(_: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  try {
    const { error } = await signUp(email, password, name || undefined);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sign up failed. Please try again." };
  }
  redirect("/onboarding");
}
