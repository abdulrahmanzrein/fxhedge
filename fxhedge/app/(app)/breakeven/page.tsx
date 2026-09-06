"use client";
import { useState, useEffect } from "react";
import { currencySymbol } from "@/lib/fixtures";
import { useAppData } from "@/hooks/use-app-data";
import { usePageFade } from "@/components/page-fade";

interface BreakevenData {
  break_even_rate: number;
  cushion_pct: number;
  verdict: "comfortable" | "watch" | "danger";
  verdict_reason: string;
  today_rate: number;
  today_rate_source: string;
  hist_windows: number;
}

interface HedgeMatch {
  currency: string;
  netted_amount: number;
  suggestion: string;
}
interface HedgeData {
  matches: HedgeMatch[];
  unmatched: { currency: string; amount: number; label: string }[];
  summary: string;
  disclaimer: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[var(--color-muted)] ${className ?? ""}`} />;
}

const VERDICT = {
  comfortable: { color: "#3DD68C", bg: "rgba(61,214,140,0.12)", label: "Comfortable" },
  watch:       { color: "#FACC15", bg: "rgba(250,204,21,0.12)",  label: "Watch"       },
  danger:      { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "Danger"      },
};

export default function BreakevenPage() {
  const d = useAppData();
  const sym = currencySymbol(d.toCurrency);
  const pair = `${d.fromCurrency}-${d.toCurrency}`;
  const { fade } = usePageFade();
  const [be, setBe]       = useState<BreakevenData | null>(null);
  const [hedge, setHedge] = useState<HedgeData | null>(null);
  const [beErr, setBeErr] = useState(false);

  useEffect(() => {
    if (d.loading) return;
    const revenue = 18000;

    fetch(`/api/breakeven?invoice=${d.invoiceAmount}&revenue=${revenue}&pair=${pair}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setBe)
      .catch(() => setBeErr(true));

    fetch("/api/natural-hedge")
      .then((r) => r.ok ? r.json() : null)
      .then((h) => h && setHedge(h))
      .catch(() => {});
  }, [d.loading, pair, d.invoiceAmount]);

  const v = be ? VERDICT[be.verdict] : null;

  return (
    <div className="space-y-8">
      <div style={fade(0)}>
        <h1 className="font-serif text-3xl font-normal text-[var(--color-fg)]">Breakeven &amp; hedge</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          How much rate movement can you absorb before this deal loses money?
        </p>
      </div>

      {/* Breakeven cushion */}
      {beErr ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6" style={fade(1)}>
          <p className="text-sm text-[var(--color-muted-fg)]">Could not load breakeven data. Check your connection and refresh.</p>
        </div>
      ) : !be ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6" style={fade(1)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--color-muted-fg)] mb-2">Breakeven cushion</p>
              <p className="font-money text-5xl font-bold leading-none tabular" style={{ color: v!.color }}>
                {be.cushion_pct.toFixed(1)}%
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
                Breakeven rate: <span className="font-money font-semibold text-[var(--color-fg)] tabular">{be.break_even_rate.toFixed(4)}</span>
                {" "}· Today: <span className="font-money font-semibold text-[var(--color-fg)] tabular">{be.today_rate.toFixed(4)}</span>
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ color: v!.color, background: v!.bg }}
            >
              {v!.label}
            </span>
          </div>
          <p className="mt-4 text-sm text-[var(--color-muted-fg)] leading-relaxed">{be.verdict_reason}</p>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Breakeven rate", value: be.break_even_rate.toFixed(4) },
              { label: "Today's rate",   value: be.today_rate.toFixed(4)      },
              { label: "Historical windows", value: be.hist_windows.toLocaleString() },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--color-border)] p-4">
                <p className="text-xs text-[var(--color-muted-fg)] mb-1">{s.label}</p>
                <p className="font-money font-semibold text-[var(--color-fg)] tabular">{s.value}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-[var(--color-muted-fg)]">Source: {be.today_rate_source}</p>
        </div>
      )}

      {/* How to read it */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6" style={fade(2)}>
        <h2 className="font-semibold text-[var(--color-fg)] mb-3">How to read this</h2>
        <div className="space-y-3 text-sm text-[var(--color-muted-fg)] leading-relaxed">
          <p>
            The <strong className="text-[var(--color-fg)]">breakeven rate</strong> is the worst{" "}
            {d.fromCurrency}/{d.toCurrency} rate at which you still cover your costs. If{" "}
            {d.fromCurrency} strengthens past this point, the invoice costs more than you earn on the sale.
          </p>
          <p>
            The <strong className="text-[var(--color-fg)]">cushion</strong> is how far today's rate can move before you hit that breakeven. A larger cushion means more breathing room.
          </p>
          <div className="flex flex-col gap-2 mt-3">
            {Object.entries(VERDICT).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ color: v.color, background: v.bg }}>{v.label}</span>
                <span>
                  {k === "comfortable" && "Cushion exceeds the historical 95th percentile move. You have real buffer."}
                  {k === "watch"       && "Cushion is below the worst typical move. Monitor before the due date."}
                  {k === "danger"      && "Cushion is near zero. Any adverse move puts the deal in the red."}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Natural hedge detector */}
      {hedge && hedge.matches.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6" style={fade(3)}>
          <h2 className="font-semibold text-[var(--color-fg)] mb-1">Natural hedge detector</h2>
          <p className="text-sm text-[var(--color-muted-fg)] mb-4">{hedge.summary}</p>
          <div className="space-y-3">
            {hedge.matches.map((m) => (
              <div key={m.currency} className="rounded-xl border border-[var(--color-border)] p-4">
                <p className="font-semibold text-[var(--color-fg)] text-sm">
                  <span className="font-money tabular">{m.netted_amount.toLocaleString()} {m.currency}</span> offsets opposite flows
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted-fg)]">{m.suggestion}</p>
              </div>
            ))}
          </div>
          {hedge.unmatched.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[var(--color-muted-fg)] mb-2">Unmatched flows</p>
              <div className="space-y-1">
                {hedge.unmatched.map((u) => (
                  <p key={u.label} className="text-xs text-[var(--color-muted-fg)]">
                    {u.label}: <span className="font-money tabular">{u.amount.toLocaleString()} {u.currency}</span>. No offsetting flow found.
                  </p>
                ))}
              </div>
            </div>
          )}
          <p className="mt-4 text-xs text-[var(--color-muted-fg)] italic">{hedge.disclaimer}</p>
        </div>
      )}

      <p className="text-xs text-[var(--color-muted-fg)]">
        HalalFlow never moves money and never predicts exchange rates. This is education only, not financial advice.
      </p>
    </div>
  );
}
