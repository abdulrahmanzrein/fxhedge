import { SAMPLE, MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { Badge } from "@/components/ui/badge";

export default function ComparePage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);
  const best = SAMPLE.bestProvider.received;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-fg)]">Compare providers</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Ranked by what your supplier receives · {SAMPLE.pair} · {sym}{SAMPLE.invoiceAmount.toLocaleString()}
        </p>
      </div>

      {/* Mid-market reference */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-fg)] mb-1">ECB mid-market reference</p>
          <p className="font-money text-2xl font-bold text-[var(--color-fg)]">{sym}{SAMPLE.trueCostToday.toLocaleString()}</p>
          <p className="text-xs text-[var(--color-muted-fg)] mt-1">Rate: {SAMPLE.ecbRateToday} · Source: Frankfurter API</p>
        </div>
        <Badge variant="success">Mid-market</Badge>
      </div>

      {/* Provider cards */}
      <div className="space-y-3">
        {SAMPLE.providers.map((provider, i) => {
          const diff = provider.received - best;
          const isFirst = i === 0;
          return (
            <div
              key={provider.name}
              className={`rounded-xl border bg-[var(--color-card)] p-5 flex items-center justify-between ${
                isFirst ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isFirst ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                  }`}
                >
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--color-fg)]">{provider.name}</span>
                    {provider.midMarket && <Badge variant="success">mid-market</Badge>}
                  </div>
                  {!isFirst && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {sym}{Math.abs(diff).toLocaleString()} less than best
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-money text-xl font-bold text-[var(--color-fg)]">
                  {sym}{provider.received.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--color-muted-fg)]">supplier receives</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-muted-fg)]">
        Data sourced from Wise Comparison API. Rates change frequently — always verify before transacting.
      </p>
    </div>
  );
}
