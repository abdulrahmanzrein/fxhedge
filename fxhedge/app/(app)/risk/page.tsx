"use client";
import { SAMPLE } from "@/lib/fixtures";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const decisionConfig = {
  pay_now:  { label: "Pay now",   variant: "success" as const,  color: "#22c55e" },
  wait:     { label: "Wait",      variant: "warning" as const,  color: "#eab308" },
  marginal: { label: "Marginal",  variant: "muted"   as const,  color: "#6b7280" },
};

// Synthetic histogram data (normal distribution approximation for EUR-CAD 21-day moves)
const histogramData = [
  { bucket: "−9%", count: 12 },
  { bucket: "−7%", count: 38 },
  { bucket: "−5%", count: 95 },
  { bucket: "−3%", count: 210 },
  { bucket: "−1%", count: 480 },
  { bucket: "0%",  count: 520 },
  { bucket: "+1%", count: 470 },
  { bucket: "+3%", count: 205 },
  { bucket: "+5%", count: 90 },
  { bucket: "+7%", count: 35 },
  { bucket: "+9%", count: 10 },
];

export default function RiskPage() {
  const d = decisionConfig[SAMPLE.decision];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-fg)]">Risk explorer</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Historical move distribution · {SAMPLE.pair} · {SAMPLE.histWindows.toLocaleString()} 21-day windows since 2015
        </p>
      </div>

      {/* 3 stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-fg)] mb-2">Drift today</p>
          <p className="font-money text-[30px] font-bold text-[var(--color-fg)]">{SAMPLE.driftTodayPct}%</p>
          <p className="text-xs text-[var(--color-muted-fg)] mt-1">Slightly in your favor</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-fg)] mb-2">Worst 5% move</p>
          <p className="font-money text-[30px] font-bold text-[var(--color-fg)]">{SAMPLE.worst5pctMove}%</p>
          <p className="text-xs text-[var(--color-muted-fg)] mt-1">1-in-20 chance against you</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-fg)] mb-2">Worst on record</p>
          <p className="font-money text-[30px] font-bold text-[var(--color-fg)]">{SAMPLE.worstOnRecord}%</p>
          <p className="text-xs text-[var(--color-muted-fg)] mt-1">Since 2015</p>
        </div>
      </div>

      {/* Histogram */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="font-semibold text-[var(--color-fg)] mb-4">Historical 21-day move distribution</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
              />
              <ReferenceLine x="0%" stroke="var(--color-primary)" strokeDasharray="4 2" />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decision */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-semibold text-[var(--color-fg)]">Pay-now vs wait</h2>
          <Badge variant={d.variant}>{d.label}</Badge>
        </div>
        <p className="text-sm text-[var(--color-muted-fg)]">{SAMPLE.decisionReason}</p>
        <p className="mt-3 text-xs text-[var(--color-muted-fg)]">
          This is volatility analysis, not a prediction. Hedged never predicts exchange rates.
        </p>
      </div>
    </div>
  );
}
