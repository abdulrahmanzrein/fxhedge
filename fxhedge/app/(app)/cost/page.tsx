import { SAMPLE, MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { Badge } from "@/components/ui/badge";

interface WaterfallRow {
  label: string;
  value: number;
  source: string;
  highlight?: boolean;
}

export default function CostPage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);

  const rows: WaterfallRow[] = [
    {
      label: "Invoice amount (EUR)",
      value: SAMPLE.invoiceAmount,
      source: "Your input",
    },
    {
      label: "ECB mid-market rate",
      value: SAMPLE.ecbRateToday,
      source: "ECB / Frankfurter API",
    },
    {
      label: "True cost at mid-market",
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
      label: "Markup (worst vs mid-market)",
      value: SAMPLE.trueCostToday - SAMPLE.worstProvider.received,
      source: "True cost − worst provider",
    },
    {
      label: "Saving (best vs worst)",
      value: SAMPLE.savingVsWorst,
      source: "Best − worst provider",
      highlight: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-fg)]">Cost breakdown</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Every value labeled by source · {SAMPLE.pair} · {sym}{SAMPLE.invoiceAmount.toLocaleString()} invoice
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left">
              <th className="px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-muted-fg)] font-medium">Component</th>
              <th className="px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-muted-fg)] font-medium text-right">Value</th>
              <th className="px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-muted-fg)] font-medium">Source</th>
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
                <td className="px-5 py-4 text-[var(--color-fg)] font-medium">{row.label}</td>
                <td className="px-5 py-4 text-right font-money font-semibold text-[var(--color-fg)]">
                  {row.value < 100 ? row.value.toFixed(4) : `${sym}${row.value.toLocaleString()}`}
                </td>
                <td className="px-5 py-4">
                  <Badge variant="outline" className="text-xs">{row.source}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--color-muted-fg)]">
        FX markup = difference between the mid-market rate and what you actually pay. Hedged never moves money.
      </p>
    </div>
  );
}
