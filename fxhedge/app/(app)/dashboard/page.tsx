import { SAMPLE, MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const profile = MOCK_PROFILE;
  const firstName = profile.business_name?.split(" ")[0] ?? "there";
  const toCur = profile.home_currency;
  const sym = currencySymbol(toCur);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-fg)]">
          Assalamu alaikum, {firstName}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          {profile.business_name} · {SAMPLE.pair} · invoice {sym}{profile.invoice_amount.toLocaleString()} due in {profile.days_until_due} days
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Best rate today"
          value={`${sym}${SAMPLE.bestProvider.received.toLocaleString()}`}
          delta="via Wise"
          positive
          subtext="Mid-market rate"
        />
        <KpiCard
          label="Worst provider cost"
          value={`${sym}${SAMPLE.worstProvider.received.toLocaleString()}`}
          delta="via PayPal"
          positive={false}
          subtext="Hidden markup included"
        />
        <KpiCard
          label="Saving vs worst"
          value={`${sym}${SAMPLE.savingVsWorst.toLocaleString()}`}
          delta="choose Wise"
          positive
          subtext="Switch provider to save"
        />
        <KpiCard
          label="Margin at risk (−5%)"
          value={`${sym}${Math.abs(SAMPLE.marginAtRiskMinus5pct).toLocaleString()}`}
          delta="if EUR rises 5%"
          positive={false}
          subtext="Exposure estimate"
        />
      </div>

      {/* Active scenario */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--color-fg)]">Active scenario</h2>
            <Badge variant="muted">{SAMPLE.pair}</Badge>
          </div>
          <div className="space-y-3">
            {[
              ["ECB rate today",       SAMPLE.ecbRateToday.toFixed(4)],
              ["ECB rate (invoice day)", SAMPLE.ecbRateInvoiceDay.toFixed(4)],
              ["True cost today",      `${sym}${SAMPLE.trueCostToday.toLocaleString()}`],
              ["Margin today",         `${SAMPLE.marginToday}%`],
              ["Drift (21 days)",      `${SAMPLE.driftTodayPct}%`],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-[var(--color-muted-fg)]">{label}</span>
                <span className="font-money font-semibold text-[var(--color-fg)]">{val}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[var(--color-muted-fg)] italic">{SAMPLE.decisionReason}</p>
        </div>

        {/* Providers */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="font-semibold text-[var(--color-fg)] mb-4">Top providers</h2>
          <div className="space-y-3">
            {SAMPLE.providers.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-muted-fg)] w-4">{i + 1}.</span>
                  <span className="text-[var(--color-fg)]">{p.name}</span>
                  {p.midMarket && <Badge variant="success" className="text-[10px] px-1.5">mid-market</Badge>}
                </div>
                <span className="font-money font-semibold text-[var(--color-fg)]">
                  {sym}{p.received.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
