"use client";

import { SAMPLE, MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { AnimatedNumber } from "@/components/motion";
import { Panel } from "@/components/ui/panel";

interface Row {
  label: string;
  value: number;
  source: string;
  isRate?: boolean;
  highlight?: boolean;
}

function AnimatedCell({
  value,
  sym,
  isRate,
}: {
  value: number;
  sym: string;
  isRate?: boolean;
}) {
  if (isRate) {
    return <AnimatedNumber value={value} format={(n) => n.toFixed(4)} />;
  }
  return (
    <AnimatedNumber
      value={value}
      format={(n) => `${sym}${Math.round(n).toLocaleString()}`}
    />
  );
}

/**
 * Cost breakdown — every value labeled by its source. Fixture data for now;
 * the /api/providers comparison feed replaces the provider rows when wired.
 */
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
      label: `Best provider (${SAMPLE.bestProvider.name})`,
      value: SAMPLE.bestProvider.received,
      source: "Wise Comparison API",
    },
    {
      label: `Worst provider (${SAMPLE.worstProvider.name})`,
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
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">
          Cost breakdown
        </h1>
        <p className="mt-1 text-sm text-muted">
          Every value labeled by source · {sym}
          {SAMPLE.invoiceAmount.toLocaleString()} invoice ·{" "}
          {SAMPLE.from} to {SAMPLE.to}
        </p>
      </header>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tnum w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted">
                  Component
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted">
                  Value
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className={`border-b border-line last:border-0 ${
                    row.highlight ? "bg-surface-offset/40" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-medium text-primary">
                    {row.label}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-primary">
                    <AnimatedCell
                      value={row.value}
                      sym={sym}
                      isRate={row.isRate}
                    />
                  </td>
                  <td className="px-5 py-4 text-xs text-muted">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="text-xs text-muted">
        FX markup is the difference between the mid market rate and what you
        actually pay. Hedged never moves money.
      </p>
    </div>
  );
}
