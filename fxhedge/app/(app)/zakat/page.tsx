"use client";

import { useState } from "react";
import { ZakatHoldingList } from "@/components/zakat-holding-list";
import { ZakatResultCard } from "@/components/zakat-result-card";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { computeZakat, NISAB_GOLD_GRAMS } from "@/lib/zakat";
import type { MadhhabMethod, ZakatHolding, ZakatResult } from "@/types/zakat";

type RatesPayload = {
  rates: Record<string, number>;
  home: string;
  sources: Record<string, string>;
  rate_date: string;
};

export default function ZakatPage() {
  const [home, setHome] = useState("CAD");
  const [goldPrice, setGoldPrice] = useState(105);
  const [method, setMethod] = useState<MadhhabMethod>("aaoifi");
  const [holdings, setHoldings] = useState<ZakatHolding[]>([]);
  const [result, setResult] = useState<ZakatResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function compute() {
    setError(null);
    setLoading(true);
    try {
      const foreign = [...new Set(holdings.map((h) => h.currency).filter((c) => c !== home))];
      let rates: Record<string, number> = { [home]: 1 };
      if (foreign.length > 0) {
        const res = await fetch(`/api/zakat/rates?currencies=${foreign.join(",")}&home=${home}`);
        if (!res.ok) throw new Error(`Could not fetch live rates (${res.status})`);
        const data: RatesPayload = await res.json();
        rates = data.rates;
      }
      setResult(computeZakat(holdings, method, rates, goldPrice, home));
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Zakat calculator</h1>
        <p className="text-sm text-muted">
          Your zakat is 2.5% of what your business truly holds — and for
          importers, that value moves with the exchange rate every day. Foreign
          holdings are valued at today&apos;s live reference rate.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
        <ZakatHoldingList holdings={holdings} onChange={setHoldings} homeCurrency={home} />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Home currency
            <select
              className="rounded-[10px] border border-line bg-canvas px-2 py-1.5 text-sm text-primary"
              value={home}
              onChange={(e) => setHome(e.target.value)}
            >
              {["CAD", "USD", "EUR", "GBP", "AED"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Gold price per gram ({home}) <span className="text-[10px] text-faint">user-entered</span>
            <Input
              type="number"
              min={1}
              step="0.01"
              value={goldPrice}
              onChange={(e) => setGoldPrice(Number(e.target.value) || 0)}
            />
            <span className="text-[10px]">nisab = {NISAB_GOLD_GRAMS}g of gold</span>
          </label>
          <div className="flex flex-col gap-1 text-xs text-muted">
            Method
            <PillTabs
              tabs={[
                { id: "aaoifi", label: "AAOIFI view" },
                { id: "hanafi", label: "Hanafi view" },
              ]}
              active={method}
              onChange={(id) => {
                setMethod(id as MadhhabMethod);
                setResult(null);
              }}
            />
          </div>
        </div>

        <div className="no-print flex items-center gap-3">
          <Button
            type="button"
            onClick={compute}
            disabled={loading || holdings.length === 0}
          >
            {loading ? "Fetching live rates…" : "Compute my zakat"}
          </Button>
          {result && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.print()}
            >
              Print scholar summary
            </Button>
          )}
        </div>
        {error && (
          <p role="alert" className="rounded-[10px] bg-negative-soft p-3 text-sm text-negative">
            {error}
          </p>
        )}
      </section>

      {result && <ZakatResultCard result={result} home={home} />}
    </div>
  );
}
