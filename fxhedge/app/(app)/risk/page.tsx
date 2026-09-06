"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SAMPLE } from "@/lib/fixtures";
import { Panel } from "@/components/ui/panel";
import { Kpi } from "@/components/ui/kpi";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { X } from "lucide-react";
import { clsx } from "clsx";

type RatePoint = { date: string; rate: number };
type SelectedPoint = RatePoint & { cost: number; diff: number };

const decisionChip = {
  pay_now: "bg-positive-soft text-positive",
  wait: "bg-negative-soft text-negative",
  marginal: "bg-warning-soft text-warning",
} as const;

const DECISION_LABEL: Record<string, string> = {
  pay_now: "Pay now",
  wait: "Wait",
  marginal: "Marginal",
};

/**
 * Risk explorer — EUR/CAD over the past 12 months. Click any point to see
 * what the invoice would have cost at that rate. Magnitudes, never
 * predictions: the data line stays white; brass is reserved for UI accent.
 */
export default function RiskPage() {
  const [rateData, setRateData] = useState<RatePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selected, setSelected] = useState<SelectedPoint | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/history?pair=EUR-CAD&years=1")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ rates: Record<string, number> }>;
      })
      .then((data) => {
        if (!alive) return;
        const points = Object.entries(data.rates)
          .map(([date, rate]) => ({ date, rate }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setRateData(points);
      })
      .catch(() => {
        if (alive) setFetchError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function handleChartClick(state: unknown) {
    const payload = (state as { activePayload?: { payload?: RatePoint }[] } | null)
      ?.activePayload?.[0]?.payload;
    if (!payload) return;
    const cost = Math.round(SAMPLE.invoiceAmount * payload.rate);
    const diff = cost - SAMPLE.trueCostToday;
    setSelected({ ...payload, cost, diff });
  }

  const firstPoint = rateData[0];
  const currentPoint = rateData[rateData.length - 1];

  const yearChangePct =
    firstPoint && currentPoint
      ? ((currentPoint.rate - firstPoint.rate) / firstPoint.rate) * 100
      : null;

  const [minRate, maxRate] = useMemo(() => {
    const rates = rateData.map((p) => p.rate);
    if (!rates.length) return [1.4, 1.6] as const;
    return [Math.min(...rates) * 0.997, Math.max(...rates) * 1.003] as const;
  }, [rateData]);

  function fmtDate(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">
          Risk explorer
        </h1>
        <p className="mt-1 text-sm text-muted">
          EUR/CAD over the past 12 months · ECB reference data
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <Kpi
            label="Current rate"
            value={currentPoint ? currentPoint.rate.toFixed(4) : SAMPLE.ecbRateToday}
            sub="EUR/CAD mid-market"
          />
        </Panel>
        <Panel className="p-5">
          <Kpi
            label="Drift today"
            value={`${SAMPLE.driftTodayPct}%`}
            sub="Slightly in your favor"
          />
        </Panel>
        <Panel className="p-5">
          <Kpi
            label="12-month change"
            tone={
              yearChangePct === null ? "neutral" : yearChangePct > 0 ? "negative" : "positive"
            }
            value={
              yearChangePct === null
                ? "—"
                : `${yearChangePct > 0 ? "+" : ""}${yearChangePct.toFixed(2)}%`
            }
            sub={firstPoint ? `Since ${fmtDate(firstPoint.date)}` : "Since last year"}
          />
        </Panel>
      </div>

      {/* Chart */}
      <Panel className="p-5">
        <figure className="m-0">
          <h2 className="font-semibold text-primary">EUR/CAD exchange rate</h2>
          <p className="mb-4 text-xs text-muted">
            Click any point to see what your invoice would cost at that rate.
          </p>

          <figcaption className="sr-only">
            Area chart of EUR/CAD over the past 12 months, sourced from the ECB.
            Click any point for an invoice cost scenario at that historical rate.
          </figcaption>

          <div className="h-72" aria-hidden="true">
            {loading && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted">Loading rate data…</p>
              </div>
            )}
            {!loading && fetchError && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted">
                  Could not load live rates. Check your connection and refresh.
                </p>
              </div>
            )}
            {!loading && !fetchError && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={rateData}
                  margin={{ top: 8, right: 4, left: 0, bottom: 4 }}
                  onClick={handleChartClick}
                  style={{ cursor: "crosshair" }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={48}
                    tickFormatter={(d: string) =>
                      new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                      })
                    }
                  />
                  <YAxis
                    width={52}
                    domain={[minRate, maxRate]}
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v.toFixed(3)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-offset)",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--text-primary)",
                    }}
                    formatter={(value) => [
                      <span key="v" className="tnum">
                        {Number(value).toFixed(4)}
                      </span>,
                      "EUR/CAD",
                    ]}
                    labelFormatter={(d) =>
                      new Date(String(d) + "T00:00:00").toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  {/* Vertical line + dot at the selected point */}
                  {selected && (
                    <>
                      <ReferenceLine
                        x={selected.date}
                        stroke="var(--text-muted)"
                        strokeDasharray="4 2"
                        strokeOpacity={0.7}
                      />
                      <ReferenceDot
                        x={selected.date}
                        y={selected.rate}
                        r={5}
                        fill="var(--text-primary)"
                        stroke="var(--surface)"
                        strokeWidth={2}
                      />
                    </>
                  )}
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--text-primary)"
                    strokeWidth={1.5}
                    fill="rgba(255,255,255,0.04)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "var(--text-primary)",
                      stroke: "var(--surface)",
                      strokeWidth: 2,
                    }}
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Scenario panel */}
          {selected && (
            <Panel
              className="mt-5 p-4"
              as="section"
              aria-label={`Scenario: ${fmtDate(selected.date)}`}
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="tnum text-sm font-semibold text-primary">
                    {fmtDate(selected.date)} · rate {selected.rate.toFixed(4)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">EUR/CAD on this date</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelected(null)}
                  aria-label="Close scenario"
                  className="px-2 py-2"
                >
                  <Icon icon={X} size={14} />
                </Button>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="mb-0.5 text-xs text-muted">Invoice cost</p>
                  <p className="tnum font-semibold text-primary">
                    CA${selected.cost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-xs text-muted">vs today</p>
                  <p
                    className={clsx(
                      "tnum text-sm font-semibold",
                      selected.diff > 0
                        ? "text-negative"
                        : selected.diff < 0
                          ? "text-positive"
                          : "text-muted",
                    )}
                  >
                    {selected.diff > 0
                      ? `+CA$${selected.diff.toLocaleString()} more`
                      : selected.diff < 0
                        ? `−CA$${Math.abs(selected.diff).toLocaleString()} less`
                        : "No difference"}
                  </p>
                </div>
              </div>

              <p className="mt-2 border-t border-line pt-3 text-xs leading-relaxed text-muted">
                {selected.diff > 0
                  ? "The rate was higher on this date — your invoice would have cost more CAD. If the rate climbs back here, locking in today could save you money."
                  : selected.diff < 0
                    ? "The rate was lower on this date — your invoice would have been cheaper. This is the downside range you're exposed to if EUR strengthens."
                    : "The rate on this date matches today's rate exactly."}
              </p>
            </Panel>
          )}

          {!selected && !loading && !fetchError && (
            <p className="mt-4 text-center text-xs text-muted">
              Click any point on the chart to see the invoice cost at that rate
            </p>
          )}
        </figure>
      </Panel>

      {/* Decision */}
      <Panel className="p-5">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-semibold text-primary">Pay now vs wait</h2>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              decisionChip[SAMPLE.decision],
            )}
          >
            {DECISION_LABEL[SAMPLE.decision] ?? SAMPLE.decision}
          </span>
        </div>
        <p className="text-sm text-muted">{SAMPLE.decisionReason}</p>
        <p className="mt-3 text-xs text-muted">
          This is volatility analysis, not a prediction. Hedged never predicts
          exchange rates.
        </p>
      </Panel>
    </div>
  );
}
