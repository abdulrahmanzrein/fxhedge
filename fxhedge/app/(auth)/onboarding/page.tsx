"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD", "SGD", "AED", "SAR"];
const BUSINESS_TYPES = [
  "Halal grocery importer",
  "Clothing & textiles importer",
  "Electronics importer",
  "Food & beverage distributor",
  "Wholesale trader",
  "Other",
];

/**
 * Step 2 of 2 — the business profile. Persists via PUT /api/profile
 * (upsert into `profiles`); the dashboard reads the same row.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData(e.currentTarget);
    const payload = {
      business_name: String(data.get("business_name") ?? ""),
      business_type: String(data.get("business_type") ?? ""),
      home_currency: String(data.get("home_currency") ?? ""),
      supplier_currency: String(data.get("supplier_currency") ?? ""),
      invoice_amount: Number(data.get("invoice_amount")),
      target_margin: Number(data.get("target_margin")),
      days_until_due: Number(data.get("days_until_due")),
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Could not save your profile. Try again.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Could not reach the server. Check your connection.");
      setLoading(false);
    }
  }

  const selectCls =
    "w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-sm text-primary";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-16">
      <Link
        href="/"
        className="font-display text-2xl font-semibold tracking-tight text-primary"
      >
        Hedged
      </Link>
      <Panel className="mt-8 w-full max-w-md p-8">
        <h1 className="text-xl font-semibold text-primary">
          Tell us about your business
        </h1>
        <p className="mb-6 text-sm text-muted">Step 2 of 2 — business profile</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Business name</span>
            <Input
              name="business_name"
              type="text"
              required
              autoComplete="organization"
              placeholder="Aisha's Halal Imports"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-muted">Business type</span>
            <select name="business_type" required defaultValue="" className={selectCls}>
              <option value="" disabled>
                Select a type…
              </option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">Home currency</span>
              <select name="home_currency" required defaultValue="CAD" className={selectCls}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">
                Supplier currency
              </span>
              <select name="supplier_currency" required defaultValue="EUR" className={selectCls}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-muted">
              Invoice amount (supplier currency)
            </span>
            <Input
              name="invoice_amount"
              type="number"
              required
              min={1}
              step="any"
              placeholder="12000"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">
                Target margin (%)
              </span>
              <Input
                name="target_margin"
                type="number"
                required
                min={0}
                max={100}
                step="any"
                placeholder="10"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">
                Days until due
              </span>
              <Input
                name="days_until_due"
                type="number"
                required
                min={1}
                max={3650}
                placeholder="21"
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="text-xs text-negative">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full py-2.5">
            {loading ? "Saving…" : "Go to dashboard →"}
          </Button>
        </form>
      </Panel>
    </main>
  );
}
