"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/ui/panel";
import { Kpi } from "@/components/ui/kpi";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/motion";
import type { FXRate } from "@/types";

interface HistoryPayload {
  pair: string;
  rates: Record<string, number>;
  count: number;
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * FxChartCard — the hero moment: a white line sweeping once across the
 * recent history of the pair, with the live rate gliding into place.
 * Data line stays white; brass is reserved for UI accent, never for data.
 */
export function FxChartCard({ pair, days = 90 }: { pair: string; days?: number }) {
  const [series, setSeries] = useState<{ date: string; rate: number }[]>([]);
  const [fx, setFx] = useState<FXRate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setError(null);

    const years = Math.max(1, Math.ceil(days / 365.25));
    const historyPromise = fetch(`/api/history?pair=${pair}&years=${years}`).then(
      (r) => (r.ok ? (r.json() as Promise<HistoryPayload>) : Promise.reject(new Error(`HTTP ${r.status}`))),
    );
    const fxPromise = fetch(`/api/fx?pair=${pair}&days_ago=0`).then((r) =>
      r.ok ? (r.json() as Promise<FXRate>) : Promise.reject(new Error(`HTTP ${r.status}`)),
    );

    Promise.all([historyPromise, fxPromise])
      .then(([history, rate]) => {
        if (!alive) return;
        const points = Object.entries(history.rates)
          .map(([date, rate]) => ({ date, rate }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-days);
        setSeries(points);
        setFx(rate);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Unknown error");
      });

    return () => {
      alive = false;
    };
  }, [pair, days, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const [from, to] = useMemo(() => pair.split("-"), [pair]);

  if (error)
    return (
      <Panel className="flex items-center justify-between gap-4 p-6">
        <p className="text-sm text-muted">Couldn&apos;t load history. The rate service returned an error.</p>
        <Button variant="secondary" onClick={retry}>
          Retry
        </Button>
      </Panel>
    );

  const loading = series.length === 0;

  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between gap-4">
        <Kpi
          label={`${from} → ${to}`}
          value={
            loading ? (
              <span className="inline-block h-9 w-40 animate-pulse rounded-md bg-surface-offset" />
            ) : (
              <AnimatedNumber
                value={fx?.rate ?? 0}
                format={(n) => n.toFixed(4)}
              />
            )
          }
          sub={fx ? `${fx.source} · ${fx.fetched_at.slice(0, 10)}` : undefined}
        />
      </div>

      {loading ? (
        <div className="mt-6 h-56 w-full animate-pulse rounded-[10px] bg-surface-offset" />
      ) : (
        <div className="mt-6 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={dayLabel}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={48}
              />
              <YAxis hide domain={["auto", "auto"]} />
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
                  "Rate",
                ]}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="var(--text-primary)"
                strokeWidth={1.5}
                fill="rgba(255,255,255,0.04)"
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
