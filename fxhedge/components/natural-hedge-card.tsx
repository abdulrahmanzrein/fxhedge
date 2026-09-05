"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";

interface HedgeMatch {
  currency: string;
  netted_amount: number;
  suggestion: string;
}
interface HedgePayload {
  matches: HedgeMatch[];
  unmatched: { currency: string; amount: number; label: string }[];
  summary: string;
  disclaimer: string;
}

export function NaturalHedgeCard() {
  const [data, setData] = useState<HedgePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/natural-hedge")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  if (error)
    return (
      <Panel className="p-6 text-sm text-error">
        Could not scan for natural hedges: {error}
      </Panel>
    );
  if (!data) return null; // stays invisible until scenarios exist

  return (
    <Panel
      as="section"
      aria-label="Natural hedge detector"
      className="flex flex-col gap-3 p-6"
    >
      <div>
        <p className="text-sm text-muted">Natural hedge detector</p>
        <p className="text-sm font-medium">{data.summary}</p>
      </div>
      {data.matches.map((m) => (
        <div
          key={m.currency}
          className="rounded-[10px] border border-line bg-surface-offset p-3 text-sm"
        >
          <span className="tnum font-semibold">
            {m.netted_amount.toLocaleString()} {m.currency}
          </span>{" "}
          nets against opposite flows — {m.suggestion}
        </div>
      ))}
      {data.unmatched.length > 0 && (
        <ul className="list-inside list-disc text-xs text-muted">
          {data.unmatched.map((u) => (
            <li key={u.label}>
              {u.label}:{" "}
              <span className="tnum">
                {u.amount.toLocaleString()} {u.currency}
              </span>{" "}
              — no offsetting flow
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-faint">{data.disclaimer}</p>
    </Panel>
  );
}
