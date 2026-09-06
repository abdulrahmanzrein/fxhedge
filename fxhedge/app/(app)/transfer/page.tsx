"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInvoice, type Invoice } from "@/hooks/use-invoice";
import { currencySymbol } from "@/lib/fixtures";
import { ArrowRight, Clock, Trash2 } from "lucide-react";

const CURRENCIES = ["EUR", "USD", "GBP", "CAD", "AUD", "SGD"];

function fmtWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function TransferPage() {
  const router = useRouter();
  const { recent, setCurrent, removeRecent, ready } = useInvoice();

  const [from,   setFrom]   = useState("EUR");
  const [to,     setTo]     = useState("CAD");
  const [amount, setAmount] = useState(12000);
  const [days,   setDays]   = useState(21);
  const [label,  setLabel]  = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (from === to || amount <= 0) return;
    const inv: Invoice = {
      id:     newId(),
      amount, from, to, days,
      label:  label.trim() || `${from}→${to} invoice`,
      savedAt: new Date().toISOString(),
    };
    setCurrent(inv);
    router.push("/dashboard");
  }

  function pickRecent(inv: Invoice) {
    setCurrent(inv);
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="hero-animate">
        <div
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-primary)" }}
        >
          New transfer
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-normal text-[var(--color-fg)] mt-2">
          What&apos;s your next payment?
        </h1>
        <p className="text-[var(--color-muted-fg)] mt-2 max-w-2xl">
          Enter an upcoming supplier invoice — we&apos;ll break down providers, rates, and hedging options on the dashboard.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">

        {/* Form */}
        <form
          onSubmit={submit}
          className="hero-animate lg:col-span-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 flex flex-col gap-5"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="From currency" htmlFor="from-cur">
              <select
                id="from-cur"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputCls}
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="To currency" htmlFor="to-cur">
              <select
                id="to-cur"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputCls}
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <Field label={`Invoice amount (${currencySymbol(from)}${from})`} htmlFor="inv-amt">
            <input
              id="inv-amt"
              type="number"
              min={1}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className={inputCls + " tabular"}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Days until due" htmlFor="inv-days">
              <input
                id="inv-days"
                type="number"
                min={0}
                max={365}
                required
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className={inputCls + " tabular"}
              />
            </Field>
            <Field label="Label (optional)" htmlFor="inv-label">
              <input
                id="inv-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Q3 supplier invoice"
                className={inputCls}
              />
            </Field>
          </div>

          {from === to && (
            <p className="text-xs" style={{ color: "#f87171" }}>Pick two different currencies.</p>
          )}

          <button
            type="submit"
            disabled={from === to || amount <= 0}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-[opacity,scale] duration-150 active:scale-[0.96] hover:opacity-90 disabled:opacity-40 disabled:active:scale-100"
            style={{ background: "var(--color-primary)" }}
          >
            Analyze on dashboard <ArrowRight size={16} />
          </button>
        </form>

        {/* Recent invoices */}
        <div
          className="hero-animate lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6"
          style={{ animationDelay: "0.18s" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "var(--color-muted-fg)" }} />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
                Recent invoices
              </span>
            </div>
            {ready && recent.length > 0 && (
              <span className="text-xs text-[var(--color-muted-fg)] tabular">{recent.length} saved</span>
            )}
          </div>

          {!ready ? (
            <ul className="space-y-2">
              {[0, 1, 2].map((i) => (
                <li key={i} className="animate-pulse h-16 rounded-xl bg-[var(--color-muted)]" />
              ))}
            </ul>
          ) : recent.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-[var(--color-muted-fg)]">No recent invoices yet.</p>
              <p className="text-xs text-[var(--color-muted-fg)] mt-1">
                Analyze one on the left and it&apos;ll appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((inv) => (
                <li key={inv.id}>
                  <div
                    className="group flex items-center gap-1 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => pickRecent(inv)}
                      className="flex-1 min-w-0 text-left p-3 rounded-xl transition-[opacity,scale] duration-150 active:scale-[0.985]"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-semibold tabular rounded-md px-1.5 py-0.5"
                          style={{ background: "var(--color-muted)", color: "var(--color-muted-fg)" }}
                        >
                          {inv.from}→{inv.to}
                        </span>
                        <span className="text-sm font-medium text-[var(--color-fg)] truncate">
                          {inv.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted-fg)]">
                        <span className="font-money tabular">
                          {currencySymbol(inv.from)}{inv.amount.toLocaleString()}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular">{inv.days}d due</span>
                        <span aria-hidden="true">·</span>
                        <span>{fmtWhen(inv.savedAt)}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecent(inv.id)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity mr-2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-muted)]"
                      aria-label={`Remove ${inv.label}`}
                    >
                      <Trash2 size={14} style={{ color: "var(--color-muted-fg)" }} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

function Field({
  label, htmlFor, children,
}: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-[var(--color-muted-fg)] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
