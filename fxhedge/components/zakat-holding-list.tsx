"use client";

import { Plus, X } from "lucide-react";
import type { ZakatHolding } from "@/types/zakat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const KINDS: { value: ZakatHolding["kind"]; label: string }[] = [
  { value: "cash_home", label: "Cash (home currency)" },
  { value: "cash_foreign", label: "Cash (foreign account)" },
  { value: "receivable", label: "Receivable (owed to you)" },
  { value: "inventory", label: "Inventory (resale stock)" },
  { value: "liability", label: "Liability (you owe)" },
];

const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AED", "TRY"];

const FIELD_CLASS =
  "w-full rounded-[10px] border border-line bg-canvas px-2 py-1.5 text-sm text-primary";

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
            className="grid grid-cols-2 gap-2 rounded-[10px] border border-line bg-surface-offset p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center"
          >
            <Input
              aria-label="Label"
              placeholder="e.g. EUR customer invoice"
              value={h.label}
              onChange={(e) => update(h.id, { label: e.target.value })}
            />
            <select
              aria-label="Asset type"
              className={FIELD_CLASS}
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
                className={`${FIELD_CLASS} w-auto flex-1`}
                value={h.currency}
                onChange={(e) => update(h.id, { currency: e.target.value })}
              >
                {[homeCurrency, ...CURRENCIES.filter((c) => c !== homeCurrency)].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Input
                aria-label="Amount"
                type="number"
                min={0}
                value={h.amount || ""}
                onChange={(e) => update(h.id, { amount: Number(e.target.value) || 0 })}
              />
            </div>
            {h.kind === "receivable" ? (
              <div className="flex items-center gap-2 text-xs text-muted">
                <label className="flex items-center gap-1">
                  due
                  <Input
                    aria-label="Days until due"
                    type="number"
                    min={0}
                    className="w-16"
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
              <span className="hidden text-xs text-faint md:block" />
            )}
            <Button
              type="button"
              variant="ghost"
              aria-label={`Remove ${h.label || "row"}`}
              className="no-print h-8 w-8 justify-self-end p-0"
              onClick={() => onChange(holdings.filter((x) => x.id !== h.id))}
            >
              <Icon icon={X} className="text-muted hover:text-negative" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="no-print w-fit"
        onClick={addRow}
      >
        <Icon icon={Plus} />
        Add holding
      </Button>
    </div>
  );
}
