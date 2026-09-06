"use client";
import { MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { useCountUp } from "@/hooks/use-count-up";
import { useAppData } from "@/hooks/use-app-data";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[var(--color-muted)] ${className ?? ""}`} />;
}

function AnimatedCell({ value, sym, isRate, delay }: { value: number; sym: string; isRate?: boolean; delay: number }) {
  const animated = useCountUp(isRate ? 0 : value, 1300, isRate ? 4 : 0, delay);
  if (isRate) return <span>{value.toFixed(4)}</span>;
  return (
    <span>{value < 100 ? value.toFixed(4) : `${sym}${animated.toLocaleString()}`}</span>
  );
}

export default function CostPage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);
  const d   = useAppData();

  if (d.loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const rows = [
    { label: "Invoice amount (EUR)",  value: d.invoiceAmount,                         source: "Your profile",          isRate: false, highlight: false },
    { label: "ECB mid market rate",   value: d.ecbRateToday,                          source: d.rateSource,            isRate: true,  highlight: false },
    { label: "True cost at mid market", value: d.trueCostToday,                       source: "Invoice × ECB rate",    isRate: false, highlight: true  },
    { label: `Best provider (${d.bestProvider.name})`, value: d.bestProvider.received, source: "Wise Comparison API",  isRate: false, highlight: false },
    { label: `Worst provider (${d.worstProvider.name})`, value: d.worstProvider.received, source: "Wise Comparison API", isRate: false, highlight: false },
    { label: "Provider markup",       value: d.trueCostToday - d.worstProvider.received, source: "True cost vs worst",  isRate: false, highlight: false },
    { label: "Saving by switching",   value: d.savingVsWorst,                         source: "Best vs worst provider", isRate: false, highlight: true  },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-normal text-[var(--color-fg)]">Cost breakdown</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Every value labeled by source · {sym}{d.invoiceAmount.toLocaleString()} invoice · EUR to CAD
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left">
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-muted-fg)]">Component</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[var(--color-muted-fg)]">Value</th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-muted-fg)]">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-[var(--color-border)] last:border-0 ${row.highlight ? "bg-[var(--color-muted)]/40" : ""}`}
                >
                  <td className="px-5 py-4 font-medium text-[var(--color-fg)]">{row.label}</td>
                  <td className="px-5 py-4 text-right font-money font-semibold text-[var(--color-fg)] tabular">
                    <AnimatedCell value={row.value} sym={sym} isRate={row.isRate} delay={i * 80} />
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--color-muted-fg)]">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[var(--color-muted-fg)]">
        FX markup is the difference between the mid market rate and what you actually pay. Hedged never moves money.
      </p>
    </div>
  );
}
