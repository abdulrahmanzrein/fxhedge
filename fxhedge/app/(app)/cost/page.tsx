"use client";
import { SAMPLE, MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { useCountUp } from "@/hooks/use-count-up";

interface Row {
  label: string;
  value: number;
  source: string;
  isRate?: boolean;
  highlight?: boolean;
}

function AnimatedCell({ value, sym, isRate, delay }: { value: number; sym: string; isRate?: boolean; delay: number }) {
  const animated = useCountUp(isRate ? 0 : value, 1300, isRate ? 4 : 0, delay);
  if (isRate) return <span>{value.toFixed(4)}</span>;
  return (
    <span>
      {value < 100 ? value.toFixed(4) : `${sym}${animated.toLocaleString()}`}
    </span>
  );
}

export default function CostPage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);

  const rows: Row[] = [
    {
      label: "Invoice amount (EUR)",
      value: SAMPLE.invoiceAmount,
      source: "Your input",
    },
    {
      label: "ECB mid market rate",
      value: SAMPLE.ecbRateToday,
      source: "ECB / Frankfurter API",
      isRate: true,
    },
    {
      label: "True cost at mid market",
      value: SAMPLE.trueCostToday,
      source: "Invoice × ECB rate",
      highlight: true,
    },
    {
      label: "Best provider (Wise)",
      value: SAMPLE.bestProvider.received,
      source: "Wise Comparison API",
    },
    {
      label: "Worst provider (PayPal)",
      value: SAMPLE.worstProvider.received,
      source: "Wise Comparison API",
    },
    {
      label: "Provider markup",
      value: SAMPLE.trueCostToday - SAMPLE.worstProvider.received,
      source: "True cost vs worst provider",
    },
    {
      label: "Saving by switching",
      value: SAMPLE.savingVsWorst,
      source: "Best vs worst provider",
      highlight: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-normal text-[var(--color-fg)]">Cost breakdown</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Every value labeled by source · {sym}{SAMPLE.invoiceAmount.toLocaleString()} invoice · EUR to CAD
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
                  className={`border-b border-[var(--color-border)] last:border-0 ${
                    row.highlight ? "bg-[var(--color-muted)]/40" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-medium text-[var(--color-fg)]">{row.label}</td>
                  <td className="px-5 py-4 text-right font-money font-semibold text-[var(--color-fg)]">
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
