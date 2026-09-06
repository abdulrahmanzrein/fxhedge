"use client";
import Link from "next/link";
import { useState } from "react";
import { MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { useCountUp } from "@/hooks/use-count-up";
import { useAppData } from "@/hooks/use-app-data";
import {
  AreaChart, Area,
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine, ReferenceDot,
} from "recharts";
import { ArrowRight, Bot, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

type SelectedPoint = { day: string; rate: number; cost: number; diff: number };

const PROVIDER_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899"];

// Synthetic margin-history data (best vs worst vs mid provider % over years).
// Kept as static because the risk API only returns aggregate stats, not per-year series.
const marginData = [
  { q: "2018", best:  9, worst: -3,   mid: 4 },
  { q: "2019", best: 11, worst: -1,   mid: 6 },
  { q: "2020", best:  7, worst: -8,   mid: 2 },
  { q: "2021", best: 12, worst:  0,   mid: 7 },
  { q: "2022", best: 10, worst: -4,   mid: 5 },
  { q: "2023", best:  8, worst: -2,   mid: 4 },
  { q: "2024", best: 11, worst: -6.9, mid: 3 },
];

function RateTooltip({ active, payload, label, threshold }: any) {
  if (!active || !payload?.length) return null;
  const rate = payload[0]?.value as number;
  const above = rate >= threshold;
  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-xs shadow-lg"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)", minWidth: 130 }}
    >
      <p className="text-[10px] mb-1" style={{ color: "var(--color-muted-fg)" }}>{label}</p>
      <p className="font-money font-bold text-sm tabular" style={{ color: above ? "#3DD68C" : "#f87171" }}>
        {rate.toFixed(4)}
      </p>
      <p className="text-[10px]" style={{ color: "var(--color-muted-fg)" }}>EUR/CAD rate</p>
    </div>
  );
}

function MarginTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-xs shadow-lg"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <p className="text-[10px] mb-1.5" style={{ color: "var(--color-muted-fg)" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="tabular" style={{ color: p.color || p.stroke }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Best",  color: "#10B981" },
    { label: "Mid",   color: "#6366F1" },
    { label: "Worst", color: "#F43F5E" },
  ];
  return (
    <div className="flex items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)]">
          <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[var(--color-muted)] ${className ?? ""}`} />;
}

export default function DashboardPage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);
  const d   = useAppData();
  const [selected, setSelected] = useState<SelectedPoint | null>(null);

  const trueCost   = useCountUp(d.trueCostToday, 1500);
  const bestNet    = useCountUp(d.bestProvider.received, 1600, 0, 100);

  const THRESHOLD = d.ecbRateInvoiceDay;
  const currentRate = d.rateHistory.length
    ? d.rateHistory[d.rateHistory.length - 1].rate
    : d.ecbRateToday;
  const isFavorable = currentRate >= THRESHOLD;
  const rateColor = isFavorable ? "#3DD68C" : "#f87171";

  function handleChartClick(state: any) {
    const p = state?.activePayload?.[0]?.payload as { day: string; rate: number } | undefined;
    if (!p) return;
    const cost = Math.round(d.invoiceAmount * p.rate);
    const diff = cost - d.trueCostToday;
    setSelected({ day: p.day, rate: p.rate, cost, diff });
  }

  if (d.loading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-24" />
        <div className="grid lg:grid-cols-2 gap-5">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const chartData = d.rateHistory.length > 0 ? d.rateHistory : [{ day: "—", rate: d.ecbRateToday }];
  const first = MOCK_PROFILE.business_name.split(" ")[0];

  return (
    <div className="flex flex-col gap-5">

      {/* Greeting */}
      <div className="hero-animate">
        <div
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-primary)" }}
        >
          Active scenario · {MOCK_PROFILE.supplier_currency}-{MOCK_PROFILE.home_currency}
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-normal text-[var(--color-fg)] mt-2">
          Dashboard
        </h1>
        <p className="text-[var(--color-muted-fg)] mt-2 max-w-2xl">
          Assalamu alaikum, {first}. Happy to see you again — here&apos;s the update on your{" "}
          {sym}{d.invoiceAmount.toLocaleString()} invoice, {MOCK_PROFILE.days_until_due} days on terms.
        </p>
      </div>

      {/* Top row */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Invoice exposure (true cost) */}
        <div className="hero-animate rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
              Invoice exposure (true cost)
            </div>
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1"
              style={{ color: "#3DD68C", background: "rgba(61,214,140,0.12)" }}
            >
              <TrendingDown className="h-3.5 w-3.5" /> {d.driftTodayPct}%
            </span>
          </div>
          <div className="mt-3 font-money text-4xl font-bold tabular text-[var(--color-fg)] leading-none">
            {sym}{trueCost.toLocaleString()}
          </div>
          <p className="text-xs text-[var(--color-muted-fg)] mt-2">
            CAD at ECB mid market · {MOCK_PROFILE.supplier_currency}/{MOCK_PROFILE.home_currency} {d.ecbRateToday.toFixed(4)}
          </p>

          <div className="mt-5 border-t border-[var(--color-border)] pt-4">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)] mb-3">
              Received by provider
            </div>
            <ul className="space-y-2.5">
              {d.providers.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: PROVIDER_COLORS[i % PROVIDER_COLORS.length] }}
                    />
                    <span className="text-[var(--color-fg)]">{p.name}</span>
                  </span>
                  <span className="font-money tabular text-[var(--color-fg)]">
                    {sym}{p.received.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Best provider net + interactive rate chart */}
        <div className="hero-animate rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6" style={{ animationDelay: "0.18s" }}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
              Best provider net received
            </div>
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1"
              style={{
                color: isFavorable ? "#3DD68C" : "#f87171",
                background: isFavorable ? "rgba(61,214,140,0.12)" : "rgba(248,113,113,0.12)",
              }}
            >
              {isFavorable ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {" "}{isFavorable ? "Favorable" : "Costly"}
            </span>
          </div>
          <div className="mt-3 font-money text-4xl font-bold tabular text-[var(--color-fg)] leading-none">
            {sym}{bestNet.toLocaleString()}
          </div>
          <p className="text-xs text-[var(--color-muted-fg)] mt-2">
            {d.bestProvider.name} · mid market · no hidden spread
          </p>

          <div className="h-44 mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 6, right: 8, bottom: 0, left: -28 }}
                onClick={handleChartClick}
                style={{ cursor: "crosshair" }}
              >
                <defs>
                  <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={rateColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={rateColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.toFixed(3)}
                />
                <Tooltip content={<RateTooltip threshold={THRESHOLD} />} />
                <ReferenceLine y={THRESHOLD} stroke="var(--color-muted-fg)" strokeDasharray="4 3" strokeOpacity={0.4} />
                {selected && (
                  <ReferenceDot
                    x={selected.day}
                    y={selected.rate}
                    r={6}
                    fill={selected.rate >= THRESHOLD ? "#3DD68C" : "#f87171"}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={rateColor}
                  strokeWidth={2}
                  fill="url(#rateFill)"
                  dot={false}
                  activeDot={{ r: 5, fill: rateColor, stroke: "var(--color-card)", strokeWidth: 2, cursor: "pointer" }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {selected ? (
            <div
              className="mt-3 rounded-xl border p-3.5"
              style={{
                borderColor: selected.rate >= THRESHOLD ? "rgba(61,214,140,0.25)" : "rgba(248,113,113,0.25)",
                background:  selected.rate >= THRESHOLD ? "rgba(61,214,140,0.05)" : "rgba(248,113,113,0.05)",
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-semibold text-sm text-[var(--color-fg)]">
                  {selected.day} · rate {selected.rate.toFixed(4)}
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                >✕</button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted-fg)]">Invoice cost</span>
                <span className="font-money font-bold tabular text-[var(--color-fg)]">
                  {sym}{selected.cost.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-[var(--color-muted-fg)]">vs today</span>
                <span
                  className="font-money font-bold tabular"
                  style={{ color: selected.diff > 0 ? "#f87171" : "#3DD68C" }}
                >
                  {selected.diff > 0
                    ? `+${sym}${selected.diff.toLocaleString()} more`
                    : `−${sym}${Math.abs(selected.diff).toLocaleString()} less`}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-[var(--color-muted-fg)]">
              ↑ Click any point on the chart to see your invoice cost at that rate
            </p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Margin history */}
        <div className="hero-animate rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6" style={{ animationDelay: "0.26s" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
                Margin history
              </div>
              <div className="text-lg font-semibold text-[var(--color-fg)] mt-1">Best vs worst vs mid (%)</div>
            </div>
            <Legend />
          </div>
          <div className="h-56 mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginData} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="q" tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<MarginTooltip />} />
                <Line type="monotone" dataKey="best"  name="Best"  stroke="#10B981" strokeWidth={2} dot={false} animationDuration={900} />
                <Line type="monotone" dataKey="mid"   name="Mid"   stroke="#6366F1" strokeWidth={2} dot={false} animationDuration={900} />
                <Line type="monotone" dataKey="worst" name="Worst" stroke="#F43F5E" strokeWidth={2} dot={false} animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Amanah AI Advisor */}
        <div
          className="hero-animate relative rounded-2xl p-[1.5px] overflow-hidden"
          style={{ animationDelay: "0.34s", background: "linear-gradient(135deg, #3B82F6, #D946EF, #3B82F6)" }}
        >
          <div className="rounded-[14px] bg-[var(--color-card)]/95 p-6 h-full flex flex-col">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.15)", color: "var(--color-primary)" }}
              >
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                  Amanah AI Advisor
                </div>
                <div className="text-lg font-semibold text-[var(--color-fg)]">Hedge smarter, the halal way</div>
              </div>
            </div>
            <p className="text-[var(--color-muted-fg)] mt-4 flex-1 text-sm leading-relaxed">
              Get automated margin protection, real-time rate insights, and personalized Sharia-aligned
              hedging advice — grounded in cited sources, not a fatwa.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <Link
                href="/ask"
                className="h-10 inline-flex items-center gap-2 rounded-lg px-4 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: "var(--color-primary)" }}
              >
                <Sparkles className="h-4 w-4" /> Try Now
              </Link>
              <Link
                href="/risk"
                className="h-10 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-muted)] transition-colors"
              >
                See risk <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
