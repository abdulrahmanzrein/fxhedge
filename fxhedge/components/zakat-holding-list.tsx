"use client";

import type { ZakatHolding } from "@/types/zakat";

const KINDS: { value: ZakatHolding["kind"]; label: string }[] = [
  { value: "cash_home", label: "Cash (home currency)" },
  { value: "cash_foreign", label: "Cash (foreign account)" },
  { value: "receivable", label: "Receivable (owed to you)" },
  { value: "inventory", label: "Inventory (resale stock)" },
  { value: "liability", label: "Liability (you owe)" },
];

const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AED", "TRY"];

export function ZakatHoldingList({
  holdings,
  onChange,
  homeCurrency,
}: {
  holdings: ZakatHolding[];
  onChange: (next: ZakatHolding[]) => void;
  homeCurrency: string;
}) {
  function update(id: string, patch: Partial<ZakatHolding>) {
    onChange(holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  function addRow() {
    onChange([
      ...holdings,
      {
        id: crypto.randomUUID(),
        kind: "cash_home",
        label: "",
        amount: 0,
        currency: homeCurrency,
        due_days: 0,
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {holdings.map((h) => (
          <div
            key={h.id}
            className="grid grid-cols-2 gap-2 rounded-md border border-border bg-surface-2 p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center"
          >
            <input
              aria-label="Label"
              className="w-full rounded-sm border border-border bg-surface px-2 py-1.5 text-sm"
              placeholder="e.g. EUR customer invoice"
              value={h.label}
              onChange={(e) => update(h.id, { label: e.target.value })}
            />
            <select
              aria-label="Asset type"
              className="w-full rounded-sm border border-border bg-surface px-2 py-1.5 text-sm"
              value={h.kind}
              onChange={(e) => update(h.id, { kind: e.target.value as ZakatHolding["kind"] })}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <select
                aria-label="Currency"
                className="rounded-sm border border-border bg-surface px-1.5 py-1.5 text-sm"
                value={h.currency}
                onChange={(e) => update(h.id, { currency: e.target.value })}
              >
                {[homeCurrency, ...CURRENCIES.filter((c) => c !== homeCurrency)].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                aria-label="Amount"
                type="number"
                min={0}
                className="w-full rounded-sm border border-border bg-surface px-2 py-1.5 text-sm [font-feature-settings:'tnum'_1,'lnum'_1]"
                value={h.amount || ""}
                onChange={(e) => update(h.id, { amount: Number(e.target.value) || 0 })}
              />
            </div>
            {h.kind === "receivable" ? (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <label className="flex items-center gap-1">
                  due
                  <input
                    aria-label="Days until due"
                    type="number"
                    min={0}
                    className="w-16 rounded-sm border border-border bg-surface px-1.5 py-1 [font-feature-settings:'tnum'_1,'lnum'_1]"
                    value={h.due_days ?? 0}
                    onChange={(e) => update(h.id, { due_days: Number(e.target.value) || 0 })}
                  />
                  d
                </label>
                <label className="flex items-center gap-1">
                  <input
                    aria-label="Doubtful debt"
                    type="checkbox"
                    checked={!!h.doubtful}
                    onChange={(e) => update(h.id, { doubtful: e.target.checked })}
                  />
                  doubtful
                </label>
              </div>
            ) : (
              <span className="hidden text-xs text-text-faint md:block" />
            )}
            <button
              type="button"
              aria-label={`Remove ${h.label || "row"}`}
              className="no-print justify-self-end rounded-sm px-2 py-1 text-sm text-error hover:bg-surface-offset"
              onClick={() => onChange(holdings.filter((x) => x.id !== h.id))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="no-print w-fit rounded-sm border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-highlight"
      >
        + Add holding
      </button>
    </div>
  );
}
