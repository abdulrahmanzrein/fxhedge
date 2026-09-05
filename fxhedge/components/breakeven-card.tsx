"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { Kpi } from "@/components/ui/kpi";
import { AnimatedNumber } from "@/components/motion";

interface BreakevenPayload {
  break_even_rate: number;
  cushion_pct: number;
  verdict: "comfortable" | "watch" | "danger";
  verdict_reason: string;
  today_rate: number;
  today_rate_source: string;
  hist_windows: number;
  history_5pct: number;
}

// ui-context.md: never color alone — every verdict carries a text label.
// Pill background = the matching -soft token, text = full-saturation token.
const VERDICT_STYLE: Record<
  BreakevenPayload["verdict"],
  { pill: string; label: string }
> = {
  comfortable: { pill: "bg-positive-soft text-positive", label: "Comfortable" },
  watch: { pill: "bg-warning-soft text-warning", label: "Watch" },
  danger: { pill: "bg-negative-soft text-negative", label: "Danger" },
};

export function BreakevenCard({
  invoice,
  revenue,
  pair = "EUR-CAD",
}: {
  invoice: number;
  revenue: number;
  pair?: string;
}) {
  const [data, setData] = useState<BreakevenPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/breakeven?invoice=${invoice}&revenue=${revenue}&pair=${pair}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [invoice, revenue, pair]);

  if (error)
    return (
      <Panel className="p-6 text-sm text-error">
        Could not load your cushion: {error}
      </Panel>
    );
  if (!data)
    return (
      <Panel className="p-6 text-sm text-muted">Loading your cushion…</Panel>
    );

  const style = VERDICT_STYLE[data.verdict];

  return (
    <Panel
      as="section"
      aria-label="Break-even cushion"
      className="flex flex-col gap-3 p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <Kpi
          label="Break-even cushion"
          value={
            <AnimatedNumber
              value={data.cushion_pct}
              format={(n) => `${n.toFixed(1)}%`}
            />
          }
          sub={
            <>
              break-even {data.break_even_rate.toFixed(4)} · today{" "}
              {data.today_rate.toFixed(4)}{" "}
              <span className="rounded-full bg-surface-offset px-1.5 py-0.5 text-[10px] text-muted">
                live
              </span>
            </>
          }
        />
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.pill}`}
        >
          {style.label}
        </span>
      </div>
      <p className="text-sm text-muted">{data.verdict_reason}</p>
    </Panel>
  );
}
