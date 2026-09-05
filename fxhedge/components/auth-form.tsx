"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "login" | "signup";

interface AuthFormProps {
  defaultTab?: Tab;
}

export function AuthForm({ defaultTab = "login" }: AuthFormProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // mock: redirect to dashboard until Dev 1 ships auth
    await new Promise(r => setTimeout(r, 600));
    router.push(tab === "signup" ? "/onboarding" : "/dashboard");
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Tabs */}
      <div className="flex mb-6 border border-[var(--color-border)] rounded-lg overflow-hidden">
        {(["login", "signup"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {tab === "signup" && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-fg)] mb-1">Full name</label>
            <input
              type="text"
              required
              placeholder="Aisha Al-Farsi"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted-fg)] mb-1">Email</label>
          <input
            type="email"
            required
            placeholder="you@business.com"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted-fg)] mb-1">Password</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Loading…" : tab === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
