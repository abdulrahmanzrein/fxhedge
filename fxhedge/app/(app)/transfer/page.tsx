"use client";
import { useState } from "react";
import { SAMPLE } from "@/lib/fixtures";

const PAIRS = ["EUR-CAD", "EUR-USD", "GBP-CAD", "USD-CAD", "GBP-USD"];

export default function TransferPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-fg)]">New transfer scenario</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Save a scenario to model your FX exposure · data goes to /api/scenarios
        </p>
      </div>

      <div className="max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Currency pair">
            <select className={inputCls} defaultValue={SAMPLE.pair}>
              {PAIRS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>

          <Field label="Invoice amount">
            <input type="number" min={1} required defaultValue={SAMPLE.invoiceAmount} className={inputCls} />
          </Field>

          <Field label="Revenue (home currency)">
            <input type="number" min={1} required defaultValue={SAMPLE.revenue} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Days until due">
              <input type="number" min={1} required defaultValue={SAMPLE.daysAgo} className={inputCls} />
            </Field>
            <Field label="Target margin (%)">
              <input type="number" min={0} max={100} required defaultValue={SAMPLE.targetMargin} className={inputCls} />
            </Field>
          </div>

          <Field label="Scenario label">
            <input type="text" placeholder="e.g. Q3 supplier invoice" className={inputCls} />
          </Field>

          <button
            type="submit"
            disabled={loading || saved}
            className="mt-2 w-full rounded-md bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saved ? "✓ Scenario saved" : loading ? "Saving…" : "Save scenario"}
          </button>

          {saved && (
            <p className="text-center text-xs text-green-600 dark:text-green-400">
              Saved! Swap fixtures for POST /api/scenarios when Dev 1 ships it.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-muted-fg)] mb-1">{label}</label>
      {children}
    </div>
  );
}
