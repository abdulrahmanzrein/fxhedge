"use client";
import { buildVerdict } from "@/lib/verdict";
import type { AppData } from "@/hooks/use-app-data";

const TONE: Record<string, string> = {
  good: "var(--color-primary)",
  warn: "var(--color-warning)",
  neutral: "var(--color-muted-fg)",
};

export function VerdictStrip({ d }: { d: AppData }) {
  const worstCaseExtra = d.trueCostToday * (d.worst5pctMove / 100);
  const v = buildVerdict({
    decision: d.decision,
    savingVsWorst: d.savingVsWorst,
    worstCaseExtra,
    bestProvider: d.bestProvider.name,
    worstProvider: d.worstProvider.name,
  });

  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4"
      aria-label="Summary"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-[7px] h-2 w-2 shrink-0 rounded-full"
          style={{ background: TONE[v.tone] }}
        />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-[var(--color-fg)]">
            {v.headline}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted-fg)]">
            {v.detail}
          </p>
        </div>
      </div>
    </section>
  );
}
