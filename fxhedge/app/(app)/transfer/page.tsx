"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAIRS = ["EUR-CAD", "EUR-USD", "GBP-CAD", "USD-CAD", "GBP-USD"];

/**
 * New transfer scenario — saves to POST /api/scenarios (Supabase, RLS-owned).
 * On success the natural-hedge + breakeven engines pick it up automatically.
 */
export default function TransferPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const data = new FormData(e.currentTarget);
    const payload = {
      pair: String(data.get("pair") ?? ""),
      amount: Number(data.get("amount")),
      revenue: Number(data.get("revenue")),
      days_ago: Number(data.get("days_ago")),
      target_margin: Number(data.get("target_margin")),
      label: String(data.get("label") ?? ""),
    };

    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Could not save the scenario. Try again.");
      } else {
        setSaved(true);
        e.currentTarget.reset();
        setTimeout(() => setSaved(false), 4000);
      }
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">
          New transfer scenario
        </h1>
        <p className="mt-1 text-sm text-muted">
          Saved scenarios feed the natural hedge and break-even engines.
        </p>
      </header>

      <Panel className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Currency pair</span>
            <select
              name="pair"
              required
              defaultValue={PAIRS[0]}
              className="w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-sm text-primary"
            >
              {PAIRS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-muted">
              Invoice amount (supplier currency)
            </span>
            <Input
              name="amount"
              type="number"
              min={1}
              step="any"
              required
              placeholder="12000"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-muted">
              Revenue (home currency)
            </span>
            <Input
              name="revenue"
              type="number"
              min={0}
              step="any"
              required
              placeholder="18000"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">
                Days until due
              </span>
              <Input name="days_ago" type="number" min={1} max={3650} required defaultValue={21} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">
                Target margin (%)
              </span>
              <Input name="target_margin" type="number" min={0} max={100} step="any" required defaultValue={10} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-muted">
              Scenario label <span className="text-faint">(optional)</span>
            </span>
            <Input name="label" type="text" placeholder="e.g. Q3 supplier invoice" />
          </label>

          {error && (
            <p role="alert" className="text-xs text-negative">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full py-2.5">
            {loading ? "Saving…" : "Save scenario"}
          </Button>

          {/* Live region — always in DOM so screen readers pick up updates */}
          <div role="status" aria-live="polite" aria-atomic="true" className="min-h-[1.25rem]">
            {saved && (
              <p className="text-center text-xs text-positive">
                Scenario saved — it now feeds your hedge and break-even cards.
              </p>
            )}
          </div>
        </form>
      </Panel>
    </div>
  );
}
