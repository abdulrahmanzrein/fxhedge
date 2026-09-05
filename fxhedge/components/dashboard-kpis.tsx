"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { Kpi } from "@/components/ui/kpi";
import type { FXRate, RiskResult } from "@/types";

/**
 * DashboardKpis — the quiet row under the chart: today's rate, the worst
 * 21-day move on record, and where the number comes from. Kpi's value is
 * a ReactNode, so the server-independent fetches animate in place.
 */
export function DashboardKpis({ pair }: { pair: string }) {
  const [fx, setFx] = useState<FXRate | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`/api/fx?pair=${pair}&days_ago=0`).then((r) =>
        r.ok ? (r.json() as Promise<FXRate>) : Promise.reject(new Error(`HTTP ${r.status}`)),
      ),
      fetch(`/api/risk?pair=${pair}&days_ago=21&years=10`).then((r) =>
        r.ok ? (r.json() as Promise<RiskResult>) : Promise.reject(new Error(`HTTP ${r.status}`)),
      ),
    ])
      .then(([rate, riskResult]) => {
        if (!alive) return;
        setFx(rate);
        setRisk(riskResult);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [pair]);

  if (failed) return null; // the chart card already reports data problems

  const [from, to] = pair.split("-");

  return (
    <Panel className="grid gap-6 p-6 sm:grid-cols-3">
      <Kpi
        label="Today's rate"
        value={fx ? fx.rate.toFixed(4) : "—"}
        sub={fx ? fx.source : undefined}
      />
      <Kpi
        label="Worst 21-day move"
        value={risk ? `${risk.worst_5pct_move.toFixed(1)}%` : "—"}
        sub={risk ? `${risk.hist_windows} windows on record` : undefined}
      />
      <Kpi
        label={`${from}/${to} source`}
        value={fx ? fx.source.split(" / ")[0] : "—"}
        sub={fx ? `as of ${fx.fetched_at.slice(0, 10)}` : undefined}
      />
    </Panel>
  );
}
