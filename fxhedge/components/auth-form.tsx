"use client";
import { useActionState, useState } from "react";
import { loginAction, signUpAction } from "@/app/(auth)/actions";

type Tab = "login" | "signup";

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

export function AuthForm({ defaultTab = "login" }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  const [loginState,  loginDispatch,  loginPending]  = useActionState(loginAction,  undefined);
  const [signUpState, signUpDispatch, signUpPending] = useActionState(signUpAction, undefined);

  const action  = tab === "login" ? loginDispatch  : signUpDispatch;
  const state   = tab === "login" ? loginState     : signUpState;
  const pending = tab === "login" ? loginPending   : signUpPending;

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mb-6 flex overflow-hidden rounded-lg border border-[var(--color-border)]" role="group" aria-label="Sign in or sign up">
        {(["login", "signup"] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-card)] text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form action={action} className="flex flex-col gap-4">
        {tab === "signup" && (
          <div>
            <label htmlFor="auth-name" className="block text-xs font-medium text-[var(--color-muted-fg)] mb-1">Full name</label>
            <input id="auth-name" name="name" type="text" autoComplete="name" placeholder="Aisha Al-Farsi" className={inputCls} />
          </div>
        )}
        <div>
          <label htmlFor="auth-email" className="block text-xs font-medium text-[var(--color-muted-fg)] mb-1">Email</label>
          <input id="auth-email" name="email" type="email" required autoComplete="email" placeholder="you@business.com" className={inputCls} />
        </div>
        <div>
          <label htmlFor="auth-password" className="block text-xs font-medium text-[var(--color-muted-fg)] mb-1">Password</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            required
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            className={inputCls}
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-xs text-[var(--color-negative)]">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-[opacity,scale] duration-150 active:scale-[0.96] disabled:opacity-60"
        >
          {pending ? "Loading…" : tab === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
