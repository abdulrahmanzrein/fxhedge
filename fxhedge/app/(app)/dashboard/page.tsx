"use client";
import { SAMPLE, MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { useCountUp } from "@/hooks/use-count-up";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const rateHistory = [
  { day: "Aug 15", rate: 1.571 },
  { day: "Aug 17", rate: 1.583 },
  { day: "Aug 19", rate: 1.578 },
  { day: "Aug 21", rate: 1.592 },
  { day: "Aug 23", rate: 1.605 },
  { day: "Aug 25", rate: 1.598 },
  { day: "Aug 27", rate: 1.612 },
  { day: "Aug 29", rate: 1.608 },
  { day: "Aug 31", rate: 1.597 },
  { day: "Sep 1",  rate: 1.601 },
  { day: "Sep 2",  rate: 1.604 },
  { day: "Sep 3",  rate: 1.600 },
  { day: "Sep 4",  rate: 1.603 },
  { day: "Sep 5",  rate: 1.604 },
];

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-muted-fg)]">{label}</span>
      <span className="font-money text-sm font-semibold text-[var(--color-fg)]">{value}</span>
    </div>
  );
}

function AnimatedKpi({
  label,
  prefix,
  value,
  sub,
  positive,
  delay = 0,
}: {
  label: string;
  prefix: string;
  value: number;
  sub: string;
  positive?: boolean;
  delay?: number;
}) {
  const animated = useCountUp(value, 1600 + delay);
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <p className="text-xs font-medium text-[var(--color-muted-fg)] mb-3">{label}</p>
      <p className="font-money text-2xl font-bold text-[var(--color-fg)] leading-none">
        {prefix}{animated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
      <p
        className="mt-2 text-xs font-medium"
        style={{ color: positive ? "var(--color-positive)" : "var(--color-negative)" }}
      >
        {sub}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);

  const bestReceived   = useCountUp(SAMPLE.bestProvider.received,  1500);
  const savings        = useCountUp(SAMPLE.savingVsWorst,           1800);
  const marginAtRisk   = useCountUp(Math.abs(SAMPLE.marginAtRiskMinus5pct), 1700);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-normal text-[var(--color-fg)]">
          Assalamu alaikum, {MOCK_PROFILE.business_name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          {MOCK_PROFILE.business_name} · EUR to CAD · invoice due in {MOCK_PROFILE.days_until_due} days
        </p>
      </div>

      {/* Hero metric + chart */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-[var(--color-muted-fg)] mb-1">
              Best rate today via {SAMPLE.bestProvider.name}
            </p>
            <p className="font-money text-5xl font-bold text-[var(--color-fg)] leading-none">
              {sym}{bestReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p
              className="mt-2 text-sm font-medium"
              style={{ color: "var(--color-positive)" }}
            >
              +{sym}{savings.toLocaleString(undefined, { maximumFractionDigits: 0 })} vs PayPal
            </p>
          </div>

          <div className="flex gap-2 text-xs">
            {["1W", "1M", "3M"].map((t, i) => (
              <button
                key={t}
                className="rounded-md px-3 py-1.5 font-medium transition-colors"
                style={
                  i === 1
                    ? { background: "var(--color-primary)", color: "#fff" }
                    : { background: "var(--color-muted)", color: "var(--color-muted-fg)" }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rateHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v) => v.toFixed(3)}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(v: number) => [v.toFixed(4), "ECB rate"]}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#rateGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AnimatedKpi
          label="You could save"
          prefix={sym}
          value={SAMPLE.savingVsWorst}
          sub="Switch to Wise"
          positive
          delay={0}
        />
        <AnimatedKpi
          label="Worst provider"
          prefix={sym}
          value={SAMPLE.worstProvider.received}
          sub="PayPal — avoid"
          positive={false}
          delay={100}
        />
        <AnimatedKpi
          label="Margin at risk"
          prefix={sym}
          value={Math.abs(SAMPLE.marginAtRiskMinus5pct)}
          sub="if EUR rises 5%"
          positive={false}
          delay={200}
        />
      </div>

      {/* Scenario + providers */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="font-semibold text-[var(--color-fg)] mb-4">Rate snapshot</h2>
          <StatRow label="ECB mid market rate today"  value={SAMPLE.ecbRateToday.toFixed(4)} />
          <StatRow label="ECB rate on invoice day"    value={SAMPLE.ecbRateInvoiceDay.toFixed(4)} />
          <StatRow label="True cost at today rate"    value={`${sym}${SAMPLE.trueCostToday.toLocaleString()}`} />
          <StatRow label="Margin today"               value={`${SAMPLE.marginToday}%`} />
          <StatRow label="Drift over 21 days"         value={`${SAMPLE.driftTodayPct}%`} />
          <p className="mt-4 text-xs italic text-[var(--color-muted-fg)]">
            {SAMPLE.decisionReason}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="font-semibold text-[var(--color-fg)] mb-4">Provider ranking</h2>
          <div className="space-y-3">
            {SAMPLE.providers.map((p, i) => {
              const pct = Math.round((p.received / SAMPLE.bestProvider.received) * 100);
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-muted-fg)] w-4 text-xs">{i + 1}</span>
                      <span className="font-medium text-[var(--color-fg)]">{p.name}</span>
                    </div>
                    <span className="font-money font-semibold text-[var(--color-fg)]">
                      {sym}{p.received.toLocaleString()}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full"
                    style={{ background: "var(--color-muted)" }}
                  >
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: i === 0 ? "var(--color-positive)" : "var(--color-primary)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
