"use client";
import { useState, useEffect } from "react";
import { SAMPLE } from "@/lib/fixtures";
import { Badge } from "@/components/ui/badge";
import { usePageFade } from "@/components/page-fade";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot, CartesianGrid,
} from "recharts";

const decisionConfig = {
  pay_now:  { label: "Pay now",   variant: "success" as const },
  wait:     { label: "Wait",      variant: "warning" as const },
  marginal: { label: "Marginal",  variant: "muted"   as const },
};

// Hardcoded for SVG — CSS vars don't resolve inside SVG attribute strings
const LINE_COLOR = "#f87171";

type RatePoint = {
  date: string;   // "2024-09-05"
  rate: number;   // 1.4852
};

type SelectedPoint = RatePoint & {
  cost: number;
  diff: number;
};

export default function RiskPage() {
  const d = decisionConfig[SAMPLE.decision];
  const { fade } = usePageFade();
  const [rateData, setRateData]   = useState<RatePoint[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selected, setSelected]   = useState<SelectedPoint | null>(null);

  useEffect(() => {
    fetch(`/api/history?pair=EUR-CAD&years=1`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data: { rates: Record<string, number> }) => {
        const points: RatePoint[] = Object.entries(data.rates)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, rate]) => ({ date, rate }));
        setRateData(points);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  function handleChartClick(state: any) {
    const payload = state?.activePayload?.[0]?.payload as RatePoint | undefined;
    if (!payload) return;
    const cost = Math.round(SAMPLE.invoiceAmount * payload.rate);
    const diff = cost - SAMPLE.trueCostToday;
    setSelected({ ...payload, cost, diff });
  }

  const firstPoint   = rateData[0];
  const currentPoint = rateData[rateData.length - 1];

  const yearChangePct =
    firstPoint && currentPoint
      ? (((currentPoint.rate - firstPoint.rate) / firstPoint.rate) * 100).toFixed(2)
      : null;

  const rates  = rateData.map((p) => p.rate);
  const minRate = rates.length ? Math.min(...rates) * 0.997 : 1.4;
  const maxRate = rates.length ? Math.max(...rates) * 1.003 : 1.6;

  const xInterval = Math.max(1, Math.floor(rateData.length / 6));

  function fmtDate(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-CA", {
      month: "short",
      day:   "numeric",
    });
  }

  return (
    <div className="space-y-8">
      <div style={fade(0)}>
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-fg)]">Risk explorer</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          EUR/CAD live rate · past 12 months · ECB reference data
        </p>
      </div>

      {/* Chart (now above stats) */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5" style={fade(1)}>
        <figure>
          <h2 className="font-semibold text-[var(--color-fg)] mb-1">EUR/CAD exchange rate</h2>
          <p className="text-xs text-[var(--color-muted-fg)] mb-4">
            Click any point to see what your invoice would cost at that rate.
          </p>

          <figcaption className="sr-only">
            Area chart of EUR/CAD exchange rate over the past 12 months sourced from the ECB via
            Frankfurter. Click any point for an invoice cost scenario at that historical rate.
          </figcaption>

          <div className="h-72" aria-hidden="true">
            {loading && (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-[var(--color-muted-fg)]">Loading rate data…</p>
              </div>
            )}

            {!loading && fetchError && (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-[var(--color-muted-fg)]">
                  Could not load live rates. Check your connection and refresh.
                </p>
              </div>
            )}

            {!loading && !fetchError && (
              <ResponsiveContainer key={`chart-${rateData.length}`} width="100%" height="100%">
                <AreaChart
                  data={rateData}
                  margin={{ top: 8, right: 4, left: 0, bottom: 4 }}
                  onClick={handleChartClick}
                  style={{ cursor: "crosshair" }}
                >
                  <defs>
                    <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={LINE_COLOR} stopOpacity={0.32} />
                      <stop offset="95%" stopColor={LINE_COLOR} stopOpacity={0}    />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="var(--color-border)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--color-muted-fg)" }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                    interval={xInterval}
                    tickFormatter={(d) =>
                      new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short" })
                    }
                  />

                  <YAxis
                    width={52}
                    domain={[minRate, maxRate]}
                    tick={{ fontSize: 11, fill: "var(--color-muted-fg)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.toFixed(3)}
                  />

                  <Tooltip
                    contentStyle={{
                      background:   "var(--color-card)",
                      border:       "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize:     12,
                      color:        "var(--color-fg)",
                    }}
                    formatter={(v) => [(v as number).toFixed(4), "EUR/CAD"]}
                    labelFormatter={(d) =>
                      new Date(d + "T00:00:00").toLocaleDateString("en-CA", {
                        year: "numeric", month: "short", day: "numeric",
                      })
                    }
                  />

                  {/* Vertical line + dot at selected point */}
                  {selected && (
                    <>
                      <ReferenceLine
                        x={selected.date}
                        stroke="var(--color-muted-fg)"
                        strokeDasharray="4 2"
                        strokeOpacity={0.7}
                      />
                      <ReferenceDot
                        x={selected.date}
                        y={selected.rate}
                        r={6}
                        fill={LINE_COLOR}
                        stroke="var(--color-card)"
                        strokeWidth={2}
                      />
                    </>
                  )}

                  <Area
                    dataKey="rate"
                    stroke={LINE_COLOR}
                    strokeWidth={2}
                    fill="url(#rateGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: LINE_COLOR, stroke: "var(--color-card)", strokeWidth: 2 }}
                    animationDuration={1100}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Scenario panel */}
          {selected && (
            <div
              className="mt-5 rounded-lg border border-[var(--color-border)] p-4"
              role="region"
              aria-label={`Scenario: ${fmtDate(selected.date)}`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-sm text-[var(--color-fg)]">
                    {fmtDate(selected.date)} · rate {selected.rate.toFixed(4)}
                  </p>
                  <p className="text-xs mt-0.5 text-[var(--color-muted-fg)]">EUR/CAD on this date</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] shrink-0 transition-colors"
                  aria-label="Close scenario"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <p className="text-xs text-[var(--color-muted-fg)] mb-0.5">Invoice cost</p>
                  <p className="font-money font-bold text-[var(--color-fg)]">
                    CA${selected.cost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-fg)] mb-0.5">vs today</p>
                  <p
                    className="font-money font-bold text-sm"
                    style={{
                      color:
                        selected.diff > 0
                          ? LINE_COLOR
                          : selected.diff < 0
                          ? "var(--color-positive)"
                          : "var(--color-muted-fg)",
                    }}
                  >
                    {selected.diff > 0
                      ? `+CA$${selected.diff.toLocaleString()} more`
                      : selected.diff < 0
                      ? `−CA$${Math.abs(selected.diff).toLocaleString()} less`
                      : "No difference"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--color-fg)] leading-relaxed border-t border-[var(--color-border)] pt-3 mt-2">
                {selected.diff > 0
                  ? "The rate was higher on this date. Your invoice would have cost more CAD. If the rate climbs back here, locking in today could save you money."
                  : selected.diff < 0
                  ? "The rate was lower on this date. Your invoice would have been cheaper. This shows the downside range you're exposed to if EUR strengthens."
                  : "The rate on this date matches today's rate exactly."}
              </p>
            </div>
          )}

          {!selected && !loading && !fetchError && (
            <p className="mt-4 text-xs text-center text-[var(--color-muted-fg)]">
              ↑ Click any point on the chart to see the invoice cost at that rate
            </p>
          )}
        </figure>
      </div>

      {/* Stat cards (moved below the chart) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3" style={fade(2)}>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-fg)] mb-2">Current rate</p>
          <p className="font-money text-[30px] font-bold text-[var(--color-fg)] tabular">
            {currentPoint ? currentPoint.rate.toFixed(4) : SAMPLE.ecbRateToday}
          </p>
          <p className="text-xs text-[var(--color-muted-fg)] mt-1">EUR/CAD mid market</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-fg)] mb-2">Drift today</p>
          <p
            className="font-money text-[30px] font-bold tabular"
            style={{
              color: SAMPLE.driftTodayPct > 0
                ? "#3DD68C"
                : SAMPLE.driftTodayPct < 0
                ? "#f87171"
                : "var(--color-fg)",
            }}
          >
            {SAMPLE.driftTodayPct > 0 ? "+" : ""}{SAMPLE.driftTodayPct}%
          </p>
          <p className="text-xs text-[var(--color-muted-fg)] mt-1">
            {SAMPLE.driftTodayPct > 0 ? "In your favor" : SAMPLE.driftTodayPct < 0 ? "Against you" : "Flat"}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-fg)] mb-2">12 month change</p>
          <p
            className="font-money text-[30px] font-bold tabular"
            style={{
              color: yearChangePct === null
                ? "var(--color-fg)"
                : parseFloat(yearChangePct) > 0
                ? "#3DD68C"
                : parseFloat(yearChangePct) < 0
                ? "#f87171"
                : "var(--color-fg)",
            }}
          >
            {yearChangePct
              ? `${parseFloat(yearChangePct) > 0 ? "+" : ""}${yearChangePct}%`
              : "…"}
          </p>
          <p className="text-xs text-[var(--color-muted-fg)] mt-1">
            Since {firstPoint ? fmtDate(firstPoint.date) : "last year"}
          </p>
        </div>
      </div>

      {/* Decision */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5" style={fade(3)}>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-semibold text-[var(--color-fg)]">Pay now vs wait</h2>
          <Badge variant={d.variant}>{d.label}</Badge>
        </div>
        <p className="text-sm text-[var(--color-muted-fg)]">{SAMPLE.decisionReason}</p>
        <p className="mt-3 text-xs text-[var(--color-muted-fg)]">
          This is volatility analysis, not a prediction. HalalFlow never predicts exchange rates.
        </p>
      </div>
    </div>
  );
}
