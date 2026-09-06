"use client";
import { MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { useCountUp } from "@/hooks/use-count-up";
import { useAppData } from "@/hooks/use-app-data";

const providerMeta: Record<string, { domain: string; bg: string }> = {
  Wise:            { domain: "wise.com",          bg: "#00B9A0" },
  Instarem:        { domain: "instarem.com",       bg: "#6B21A8" },
  "Deutsche Bank": { domain: "db.com",             bg: "#0018A8" },
  "Western Union": { domain: "westernunion.com",   bg: "#FDBB30" },
  PayPal:          { domain: "paypal.com",         bg: "#003087" },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[var(--color-muted)] ${className ?? ""}`} />;
}

function ProviderCard({
  provider,
  index,
  best,
  sym,
}: {
  provider: { name: string; received: number; mid_market: boolean };
  index: number;
  best: number;
  sym: string;
}) {
  const received = useCountUp(provider.received, 1400, 0, index * 120);
  const diff = provider.received - best;
  const pct  = Math.round((provider.received / best) * 100);
  const isFirst = index === 0;
  const meta = providerMeta[provider.name];

  return (
    <div
      className="overflow-hidden rounded-2xl border bg-[var(--color-card)]"
      style={{ borderColor: isFirst ? "var(--color-primary)" : "var(--color-border)" }}
    >
      <div className="flex items-center justify-between p-5">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{ background: meta?.bg ?? "var(--color-muted)" }}
          >
            {meta && (
              <img
                src={`https://www.google.com/s2/favicons?domain=${meta.domain}&sz=128`}
                alt={provider.name}
                width={32}
                height={32}
                className="object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[var(--color-fg)]">{provider.name}</span>
              {provider.mid_market && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "rgba(61,214,140,0.12)", color: "#3DD68C" }}
                >
                  mid market
                </span>
              )}
              {isFirst && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ background: "var(--color-primary)" }}
                >
                  Best
                </span>
              )}
            </div>
            {!isFirst && (
              <p className="mt-0.5 text-xs" style={{ color: "#f87171" }}>
                {sym}{Math.abs(diff).toLocaleString()} less than best
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-money text-xl font-bold text-[var(--color-fg)] tabular">
            {sym}{received.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--color-muted-fg)]">supplier receives</p>
        </div>
      </div>

      <div className="h-1" style={{ background: "var(--color-muted)" }}>
        <div
          className="h-1 transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: isFirst ? "#3DD68C" : "var(--color-primary)",
            opacity: isFirst ? 1 : 0.45,
          }}
        />
      </div>
    </div>
  );
}

function RefValue({ value, delay = 0 }: { value: number; delay?: number }) {
  const animated = useCountUp(value, 1200, 0, delay);
  return (
    <span className="font-money text-2xl font-bold text-[var(--color-fg)] tabular">
      ${animated.toLocaleString()}
    </span>
  );
}

export default function ComparePage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);
  const d   = useAppData();
  const best = d.bestProvider.received;

  if (d.loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-24 rounded-2xl" />
        <div className="space-y-3">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-normal text-[var(--color-fg)]">Compare providers</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Ranked by what your supplier receives · {sym}{d.invoiceAmount.toLocaleString()} · EUR to CAD
        </p>
      </div>

      {/* ECB reference */}
      <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div>
          <p className="mb-1 text-xs font-medium text-[var(--color-muted-fg)]">ECB mid market reference rate</p>
          <RefValue value={d.trueCostToday} />
          <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
            Rate: {d.ecbRateToday.toFixed(4)} · Source: {d.rateSource}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "rgba(61,214,140,0.12)", color: "#3DD68C" }}
        >
          Best possible
        </span>
      </div>

      {/* Provider cards */}
      <div className="space-y-3">
        {d.providers.map((provider, i) => (
          <ProviderCard key={provider.name} provider={provider} index={i} best={best} sym={sym} />
        ))}
      </div>

      <p className="text-xs text-[var(--color-muted-fg)]">
        Rates sourced from Wise Comparison API. Rates change frequently — always verify before transacting.
      </p>
    </div>
  );
}
