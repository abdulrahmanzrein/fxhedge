"use client";

import { useEffect, useState } from "react";

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
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-error">
        Could not scan for natural hedges: {error}
      </div>
    );
  if (!data) return null; // stays invisible until scenarios exist

  return (
    <section
      aria-label="Natural hedge detector"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted">
          Natural hedge detector
        </p>
        <p className="text-sm font-medium">{data.summary}</p>
      </div>
      {data.matches.map((m) => (
        <div
          key={m.currency}
          className="rounded-md border border-border bg-surface-2 p-3 text-sm"
        >
          <span className="font-semibold [font-feature-settings:'tnum'_1,'lnum'_1]">
            {m.netted_amount.toLocaleString()} {m.currency}
          </span>{" "}
          nets against opposite flows — {m.suggestion}
        </div>
      ))}
      {data.unmatched.length > 0 && (
        <ul className="list-inside list-disc text-xs text-text-muted">
          {data.unmatched.map((u) => (
            <li key={u.label}>
              {u.label}: {u.amount.toLocaleString()} {u.currency} — no offsetting flow
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-text-faint">{data.disclaimer}</p>
    </section>
  );
}
