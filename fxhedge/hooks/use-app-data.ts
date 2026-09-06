"use client";
import { useState, useEffect } from "react";
import { MOCK_PROFILE, SAMPLE } from "@/lib/fixtures";
import type { FXRate, ProviderQuote, RiskResult } from "@/types";

export interface AppData {
  loading: boolean;
  error: boolean;
  // FX
  ecbRateToday: number;
  ecbRateInvoiceDay: number;
  rateSource: string;
  // Cost
  invoiceAmount: number;
  trueCostToday: number;
  // Providers
  providers: ProviderQuote[];
  bestProvider: ProviderQuote;
  worstProvider: ProviderQuote;
  savingVsWorst: number;
  // Risk
  driftTodayPct: number;
  worst5pctMove: number;
  histWindows: number;
  marginAtRiskMinus5pct: number;
  decision: "pay_now" | "wait" | "marginal";
  decisionReason: string;
  // Rate history for chart
  rateHistory: { day: string; rate: number }[];
}

const FALLBACK: AppData = {
  loading: false,
  error: true,
  ecbRateToday: SAMPLE.ecbRateToday,
  ecbRateInvoiceDay: SAMPLE.ecbRateInvoiceDay,
  rateSource: "ECB / Frankfurter",
  invoiceAmount: MOCK_PROFILE.invoice_amount,
  trueCostToday: SAMPLE.trueCostToday,
  providers: SAMPLE.providers.map((p) => ({ name: p.name, received: p.received, mid_market: !!p.midMarket })),
  bestProvider: { name: SAMPLE.bestProvider.name, received: SAMPLE.bestProvider.received, mid_market: true },
  worstProvider: { name: SAMPLE.worstProvider.name, received: SAMPLE.worstProvider.received, mid_market: false },
  savingVsWorst: SAMPLE.savingVsWorst,
  driftTodayPct: SAMPLE.driftTodayPct,
  worst5pctMove: SAMPLE.worst5pctMove,
  histWindows: SAMPLE.histWindows,
  marginAtRiskMinus5pct: SAMPLE.marginAtRiskMinus5pct,
  decision: SAMPLE.decision,
  decisionReason: SAMPLE.decisionReason,
  rateHistory: [],
};

function shortDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function useAppData(): AppData {
  const [data, setData] = useState<AppData>({ ...FALLBACK, loading: true, error: false });

  useEffect(() => {
    const inv  = MOCK_PROFILE.invoice_amount;
    const from = MOCK_PROFILE.supplier_currency;
    const to   = MOCK_PROFILE.home_currency;
    const days = MOCK_PROFILE.days_until_due;

    async function load() {
      try {
        const [fxRes, provRes, riskRes, histRes] = await Promise.all([
          fetch(`/api/fx?pair=${from}-${to}&days_ago=${days}`),
          fetch(`/api/providers?from=${from}&to=${to}&amount=${inv}`),
          fetch(`/api/risk?pair=${from}-${to}&days_ago=${days}&years=10`),
          fetch(`/api/history?pair=${from}-${to}&years=1`),
        ]);

        if (!fxRes.ok || !provRes.ok || !riskRes.ok) throw new Error("API error");

        const fx: FXRate         = await fxRes.json();
        const providers: ProviderQuote[] = await provRes.json();
        const risk: RiskResult   = await riskRes.json();

        const trueCostToday = Math.round(inv * fx.rate);
        const best  = providers[0];
        const worst = providers[providers.length - 1];
        const saving = best ? Math.round(best.received - worst.received) : 0;
        const margin5pct = -(inv * fx.rate * 0.05);

        let rateHistory: { day: string; rate: number }[] = [];
        if (histRes.ok) {
          const hist: { rates: Record<string, number> } = await histRes.json();
          const all = Object.entries(hist.rates)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, rate]) => ({ day: shortDay(date), rate }));
          // Show the last ~60 trading days on the dashboard chart
          rateHistory = all.slice(-60);
        }

        setData({
          loading: false,
          error: false,
          ecbRateToday: fx.rate,
          ecbRateInvoiceDay: fx.rate_invoice_day,
          rateSource: fx.source,
          invoiceAmount: inv,
          trueCostToday,
          providers,
          bestProvider: best ?? FALLBACK.bestProvider,
          worstProvider: worst ?? FALLBACK.worstProvider,
          savingVsWorst: saving,
          driftTodayPct: risk.drift_today_pct,
          worst5pctMove: risk.worst_5pct_move,
          histWindows: risk.hist_windows,
          marginAtRiskMinus5pct: Math.round(margin5pct),
          decision: risk.decision,
          decisionReason: risk.decision_reason,
          rateHistory,
        });
      } catch {
        setData(FALLBACK);
      }
    }

    load();
  }, []);

  return data;
}
