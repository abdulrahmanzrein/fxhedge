"use client";

import { SAMPLE, MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { AnimatedNumber } from "@/components/motion";
import { Panel } from "@/components/ui/panel";
import { clsx } from "clsx";

function ProviderCard({
  provider,
  index,
  best,
  sym,
}: {
  provider: (typeof SAMPLE.providers)[number];
  index: number;
  best: number;
  sym: string;
}) {
  const diff = provider.received - best;
  const pct = Math.round((provider.received / best) * 100);
  const isFirst = index === 0;

  return (
    <Panel
      className={clsx("overflow-hidden", isFirst && "border-accent")}
      as="article"
    >
      <div className="flex items-center justify-between p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-primary">{provider.name}</span>
            {provider.midMarket && (
              <span className="rounded-full bg-positive-soft px-2 py-0.5 text-[10px] font-semibold text-positive">
                mid market
              </span>
            )}
            {isFirst && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-canvas">
                Best
              </span>
            )}
          </div>
          {!isFirst && (
            <p className="tnum mt-0.5 text-xs text-negative">
              {sym}
              {Math.abs(diff).toLocaleString()} less than best
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="tnum text-xl font-semibold tracking-tight text-primary">
            <AnimatedNumber
              value={provider.received}
              format={(n) => `${sym}${Math.round(n).toLocaleString()}`}
            />
          </p>
          <p className="text-xs text-muted">supplier receives</p>
        </div>
      </div>

      {/* Relative value bar — the rank, quantified */}
      <div className="h-1 bg-surface-offset">
        <div
          className={clsx("h-1 transition-all duration-700", isFirst ? "bg-positive" : "bg-accent opacity-45")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Panel>
  );
}

/**
 * Compare providers — ranked by what the supplier actually receives,
 * against the ECB mid market reference. Fixture data until /api/providers
 * is wired; the ranking logic is already the real contract.
 */
export default function ComparePage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);
  const best = SAMPLE.bestProvider.received;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">
          Compare providers
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ranked by what your supplier receives · {sym}
          {SAMPLE.invoiceAmount.toLocaleString()} · {SAMPLE.from} to{" "}
          {SAMPLE.to}
        </p>
      </header>

      {/* ECB reference */}
      <Panel className="flex items-center justify-between p-5">
        <div>
          <p className="mb-1 text-xs text-muted">
            ECB mid market reference — what your invoice costs with zero markup
          </p>
          <p className="tnum text-2xl font-semibold tracking-tight text-primary">
            <AnimatedNumber
              value={SAMPLE.trueCostToday}
              format={(n) => `${sym}${Math.round(n).toLocaleString()}`}
            />
          </p>
          <p className="tnum mt-1 text-xs text-muted">
            Rate {SAMPLE.ecbRateToday} · Source: Frankfurter API
          </p>
        </div>
        <span className="rounded-full bg-positive-soft px-3 py-1 text-xs font-semibold text-positive">
          Best possible
        </span>
      </Panel>

      {/* Provider cards */}
      <div className="space-y-3">
        {SAMPLE.providers.map((provider, i) => (
          <ProviderCard
            key={provider.name}
            provider={provider}
            index={i}
            best={best}
            sym={sym}
          />
        ))}
      </div>

      <p className="text-xs text-muted">
        Rates sourced from the Wise Comparison API. Rates change frequently —
        always verify before transacting.
      </p>
    </div>
  );
}
