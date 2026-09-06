"use client";
import { useState } from "react";
import { MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { useCountUp } from "@/hooks/use-count-up";
import { useAppData } from "@/hooks/use-app-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

type SelectedPoint = { day: string; rate: number; cost: number; diff: number };

function CustomTooltip({ active, payload, label, threshold }: any) {
  if (!active || !payload?.length) return null;
  const rate = payload[0]?.value as number;
  const isAbove = rate >= threshold;
  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-xs shadow-lg"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)", minWidth: 120 }}
    >
      <p className="font-medium mb-1" style={{ color: "var(--color-muted-fg)" }}>{label}</p>
      <p className="font-money font-bold text-sm" style={{ color: isAbove ? "#3DD68C" : "#f87171" }}>
        {rate.toFixed(4)}
      </p>
      <p style={{ color: "var(--color-muted-fg)" }}>EUR/CAD rate</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-muted-fg)]">{label}</span>
      <span className="font-money text-sm font-semibold text-[var(--color-fg)] tabular">{value}</span>
    </div>
  );
}

function KpiCard({
  label, prefix, value, badge, badgePositive, delay = 0,
}: {
  label: string; prefix: string; value: number; badge: string; badgePositive: boolean; delay?: number;
}) {
  const animated = useCountUp(value, 1400, 0, delay);
  const color = badgePositive ? "#3DD68C" : "#f87171";
  const bg    = badgePositive ? "rgba(61,214,140,0.12)" : "rgba(248,113,113,0.12)";
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <p className="text-xs font-medium text-[var(--color-muted-fg)] mb-3">{label}</p>
      <p className="font-money text-2xl font-bold text-[var(--color-fg)] leading-none mb-2 tabular">
        {prefix}{animated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
        style={{ color, background: bg }}
      >
        {badgePositive ? "↑" : "↓"} {badge}
      </span>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[var(--color-muted)] ${className ?? ""}`} />;
}

export default function DashboardPage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);
  const d = useAppData();
  const [selected, setSelected] = useState<SelectedPoint | null>(null);
  const [range, setRange] = useState("1M");

  const bestReceived = useCountUp(d.bestProvider.received, 1500);
  const savings      = useCountUp(d.savingVsWorst, 1800);

  const THRESHOLD = d.ecbRateInvoiceDay;
  const currentRate = d.rateHistory.length
    ? d.rateHistory[d.rateHistory.length - 1].rate
    : d.ecbRateToday;
  const isRateFavorable = currentRate >= THRESHOLD;
  const lineColor  = isRateFavorable ? "#3DD68C" : "#f87171";
  const gradientId = isRateFavorable ? "greenGrad" : "redGrad";

  function handleChartClick(state: any) {
    const payload = state?.activePayload?.[0]?.payload as { day: string; rate: number } | undefined;
    if (!payload) return;
    const cost = Math.round(d.invoiceAmount * payload.rate);
    const diff = cost - d.trueCostToday;
    setSelected({ day: payload.day, rate: payload.rate, cost, diff });
  }

  if (d.loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-72 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          <Skeleton className="lg:col-span-2 h-80" />
          <Skeleton className="lg:col-span-3 h-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  const chartData = d.rateHistory.length > 0 ? d.rateHistory : [
    { day: "—", rate: d.ecbRateToday },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[var(--color-fg)]">
            Assalamu alaikum, {MOCK_PROFILE.business_name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
            {MOCK_PROFILE.business_name} · EUR to CAD · invoice due in {MOCK_PROFILE.days_until_due} days
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
          style={{
            borderColor: isRateFavorable ? "rgba(61,214,140,0.3)" : "rgba(248,113,113,0.3)",
            background:  isRateFavorable ? "rgba(61,214,140,0.08)" : "rgba(248,113,113,0.08)",
            color:       isRateFavorable ? "#3DD68C" : "#f87171",
          }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: isRateFavorable ? "#3DD68C" : "#f87171" }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: isRateFavorable ? "#3DD68C" : "#f87171" }} />
          </span>
          Rate is {isRateFavorable ? "favorable" : "costly"} today
        </div>
      </div>

      {/* Top row: hero metric + chart */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* Hero metric card */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-muted-fg)] mb-3">
              Best rate today via {d.bestProvider.name}
            </p>
            <p className="font-money text-5xl font-bold text-[var(--color-fg)] leading-none tabular">
              {sym}{bestReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(61,214,140,0.12)", color: "#3DD68C" }}
            >
              ↑ +{sym}{savings.toLocaleString(undefined, { maximumFractionDigits: 0 })} vs {d.worstProvider.name}
            </span>
          </div>

          {/* Provider distribution */}
          <div className="mt-6 space-y-3">
            <p className="text-xs font-medium text-[var(--color-muted-fg)]">Provider ranking</p>
            {d.providers.map((p, i) => {
              const pct = Math.round((p.received / d.bestProvider.received) * 100);
              const isWinner = i === 0;
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: isWinner ? "#3DD68C" : i === 1 ? "var(--color-primary)" : "var(--color-muted-fg)" }}
                      />
                      <span className="font-medium text-[var(--color-fg)]">{p.name}</span>
                    </div>
                    <span className="font-money font-semibold text-[var(--color-fg)] tabular">
                      {sym}{p.received.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--color-muted)" }}>
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: isWinner ? "#3DD68C" : i === 1 ? "var(--color-primary)" : "var(--color-border)",
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart card */}
        <div className="lg:col-span-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-[var(--color-fg)]">EUR/CAD Rate</p>
              <p className="text-xs text-[var(--color-muted-fg)] mt-0.5">
                Click any point to see your invoice cost at that rate
              </p>
            </div>
            <div className="flex gap-1.5">
              {["1W", "1M", "3M"].map((t) => (
                <button
                  key={t}
                  onClick={() => setRange(t)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={
                    range === t
                      ? { background: "var(--color-primary)", color: "#fff" }
                      : { background: "var(--color-muted)", color: "var(--color-muted-fg)" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                onClick={handleChartClick}
                style={{ cursor: "crosshair" }}
              >
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3DD68C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3DD68C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f87171" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => v.toFixed(3)}
                />
                <Tooltip content={<CustomTooltip threshold={THRESHOLD} />} />
                <ReferenceLine
                  y={THRESHOLD}
                  stroke="var(--color-muted-fg)"
                  strokeDasharray="4 3"
                  strokeOpacity={0.45}
                />
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
                  stroke={lineColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{ r: 5, fill: lineColor, stroke: "var(--color-card)", strokeWidth: 2, cursor: "pointer" }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {selected ? (
            <div
              className="mt-4 rounded-xl border p-4"
              style={{
                borderColor: selected.rate >= THRESHOLD ? "rgba(61,214,140,0.25)" : "rgba(248,113,113,0.25)",
                background:  selected.rate >= THRESHOLD ? "rgba(61,214,140,0.05)" : "rgba(248,113,113,0.05)",
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-sm text-[var(--color-fg)]">
                    {selected.day} · rate {selected.rate.toFixed(4)}
                  </p>
                  <p className="text-xs mt-0.5 text-[var(--color-muted-fg)]">EUR/CAD on this date</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors shrink-0"
                >✕</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[var(--color-muted-fg)] mb-0.5">Invoice cost</p>
                  <p className="font-money font-bold text-[var(--color-fg)] tabular">
                    {sym}{selected.cost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-fg)] mb-0.5">vs today</p>
                  <p className="font-money font-bold tabular" style={{ color: selected.diff > 0 ? "#f87171" : "#3DD68C" }}>
                    {selected.diff > 0
                      ? `+${sym}${selected.diff.toLocaleString()} more`
                      : `−${sym}${Math.abs(selected.diff).toLocaleString()} less`}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--color-muted-fg)] leading-relaxed border-t border-[var(--color-border)] pt-3">
                {selected.diff > 0
                  ? "The rate was higher here — your invoice would cost more CAD. Locking in today could save you money."
                  : "The rate was lower here — your invoice would have been cheaper. This is your downside if EUR strengthens."}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-[var(--color-muted-fg)]">
              ↑ Click any point to see your invoice cost at that rate
            </p>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="You could save" prefix={sym} value={d.savingVsWorst} badge={`Switch to ${d.bestProvider.name}`} badgePositive delay={0} />
        <KpiCard label="Worst provider"  prefix={sym} value={d.worstProvider.received} badge={`${d.worstProvider.name} — avoid`} badgePositive={false} delay={80} />
        <KpiCard label="Margin at risk"  prefix={sym} value={Math.abs(d.marginAtRiskMinus5pct)} badge="if EUR rises 5%" badgePositive={false} delay={160} />
      </div>

      {/* Rate snapshot */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="font-semibold text-[var(--color-fg)] mb-4">Rate snapshot</h2>
        <StatRow label="ECB mid market rate today"  value={d.ecbRateToday.toFixed(4)} />
        <StatRow label="ECB rate on invoice day"    value={d.ecbRateInvoiceDay.toFixed(4)} />
        <StatRow label={`True cost at today rate`}  value={`${sym}${d.trueCostToday.toLocaleString()}`} />
        <StatRow label="Source"                     value={d.rateSource} />
        <StatRow label="Drift over 21 days"         value={`${d.driftTodayPct}%`} />
        <p className="mt-4 text-xs italic text-[var(--color-muted-fg)]">{d.decisionReason}</p>
      </div>
    </div>
  );
}
