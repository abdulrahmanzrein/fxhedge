"use client";
import { useEffect, useState } from "react";
import { MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { useCountUp } from "@/hooks/use-count-up";
import { useAppData } from "@/hooks/use-app-data";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[var(--color-muted)] ${className ?? ""}`} />;
}

function AnimatedBar({ width, color, delay = 0 }: { width: string; color: string; delay?: number }) {
  const [w, setW] = useState("0%");
  useEffect(() => {
    const t = setTimeout(() => setW(width), 60 + delay);
    return () => clearTimeout(t);
  }, [width, delay]);
  return (
    <div
      className="h-full rounded-full"
      style={{ width: w, background: color, transition: "width 800ms cubic-bezier(0.16, 1, 0.3, 1)" }}
    />
  );
}

export default function ComparePage() {
  const sym  = currencySymbol(MOCK_PROFILE.home_currency);
  const symF = currencySymbol(MOCK_PROFILE.supplier_currency);
  const d    = useAppData();

  const mid   = d.trueCostToday;
  const midCount = useCountUp(mid, 1400);

  if (d.loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-10 w-96 mb-3" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const ranked = [...d.providers].sort((a, b) => b.received - a.received);
  const max = Math.max(mid, ...ranked.map((p) => p.received));
  const min = Math.min(...ranked.map((p) => p.received));
  const widthFor = (v: number) => `${30 + ((v - min) / ((max - min) || 1)) * 70}%`;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="hero-animate">
        <div
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-primary)" }}
        >
          Compare providers
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-normal text-[var(--color-fg)] mt-2">
          Ranked by what you actually receive.
        </h1>
        <p className="text-[var(--color-muted-fg)] mt-2 max-w-2xl">
          The mid market bar is the ECB reference rate — what the money is truly worth today. Every bar below it is a provider taking a cut.
        </p>
      </div>

      {/* True mid-market card */}
      <div
        className="hero-animate rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
              True mid market
            </div>
            <div className="mt-2 font-money text-3xl font-bold tabular text-[var(--color-fg)] leading-none">
              {sym}{midCount.toLocaleString()}
            </div>
          </div>
          <div className="text-right text-sm text-[var(--color-muted-fg)] shrink-0">
            <p className="tabular">
              ECB {MOCK_PROFILE.supplier_currency}/{MOCK_PROFILE.home_currency} = {d.ecbRateToday.toFixed(4)}
            </p>
            <p className="tabular">
              {symF}{d.invoiceAmount.toLocaleString()} invoice
            </p>
          </div>
        </div>
        <div
          className="mt-4 h-3 rounded-full overflow-hidden"
          style={{ background: "rgba(59,130,246,0.15)" }}
        >
          <AnimatedBar width={widthFor(mid)} color="var(--color-primary)" />
        </div>
      </div>

      {/* Providers ranked */}
      <div
        className="hero-animate rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6"
        style={{ animationDelay: "0.18s" }}
      >
        <h2 className="font-serif text-2xl font-normal text-[var(--color-fg)]">Providers, ranked</h2>
        <ul className="mt-5 flex flex-col gap-5">
          {ranked.map((p, i) => {
            const gap = mid - p.received;
            const isMid = p.mid_market;
            return (
              <li key={p.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-[var(--color-muted-fg)] tabular w-5">{i + 1}.</span>
                    <span className="font-medium text-[var(--color-fg)]">{p.name}</span>
                    {isMid && (
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 border"
                        style={{ color: "#3DD68C", borderColor: "rgba(61,214,140,0.3)" }}
                      >
                        mid market
                      </span>
                    )}
                  </span>
                  <span className="font-money tabular font-medium text-[var(--color-fg)]">
                    {sym}{p.received.toLocaleString()}
                  </span>
                </div>
                <div
                  className="relative h-3 rounded-full overflow-hidden"
                  style={{ background: "var(--color-muted)" }}
                >
                  <AnimatedBar
                    width={widthFor(p.received)}
                    color={isMid ? "#3DD68C" : "var(--color-primary)"}
                    delay={i * 60}
                  />
                </div>
                <div className="text-xs text-[var(--color-muted-fg)]">
                  {gap > 0 ? (
                    <>
                      Hidden cost vs mid market:{" "}
                      <span className="font-money tabular" style={{ color: "#f87171" }}>
                        −{sym}{gap.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "#3DD68C" }}>At mid market — no hidden spread.</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-[var(--color-muted-fg)]">
        Rates sourced from Wise Comparison API. Rates change frequently — always verify before transacting.
      </p>
    </div>
  );
}
