"use client";

import { useActionState, useState } from "react";
import { loginAction, signUpAction } from "@/app/(auth)/actions";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Tab = "login" | "signup";

/**
 * AuthForm — login/signup share one form; the tab toggle is PillTabs.
 * Server actions come from app/(auth)/actions.ts (Supabase via lib/auth).
 */
export function AuthForm({ defaultTab = "login" }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  const [loginState, loginDispatch, loginPending] = useActionState(
    loginAction,
    undefined,
  );
  const [signUpState, signUpDispatch, signUpPending] = useActionState(
    signUpAction,
    undefined,
  );

  const action = tab === "login" ? loginDispatch : signUpDispatch;
  const state = tab === "login" ? loginState : signUpState;
  const pending = tab === "login" ? loginPending : signUpPending;

  return (
    <div className="w-full">
      <div className="mb-6">
        <PillTabs
          tabs={[
            { id: "login", label: "Sign in" },
            { id: "signup", label: "Sign up" },
          ]}
          active={tab}
          onChange={(id) => setTab(id as Tab)}
          id="auth-tabs-indicator"
        />
      </div>

      <form action={action} className="flex flex-col gap-4">
        {tab === "signup" && (
          <div>
            <label
              htmlFor="auth-name"
              className="mb-1 block text-xs text-muted"
            >
              Full name
            </label>
            <Input
              id="auth-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Aisha Al-Farsi"
            />
          </div>
        )}
        <div>
          <label htmlFor="auth-email" className="mb-1 block text-xs text-muted">
            Email
          </label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@business.com"
          />
        </div>
        <div>
          <label
            htmlFor="auth-password"
            className="mb-1 block text-xs text-muted"
          >
            Password
          </label>
          <Input
            id="auth-password"
            name="password"
            type="password"
            required
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-xs text-negative">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full py-2.5">
          {pending ? "Loading…" : tab === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
