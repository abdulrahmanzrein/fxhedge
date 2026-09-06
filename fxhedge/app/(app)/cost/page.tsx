"use client";
import { MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
import { useCountUp } from "@/hooks/use-count-up";
import { useAppData } from "@/hooks/use-app-data";
import { usePageFade } from "@/components/page-fade";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[var(--color-muted)] ${className ?? ""}`} />;
}

// Green → yellow → orange → red — best to worst
const SLICE_COLORS = ["#10B981", "#F59E0B", "#EA580C", "#EF4444"];

const DESCRIPTIONS: Record<string, string> = {
  Wise:            "Real mid market rate with a transparent flat fee. Best for small businesses.",
  Instarem:        "Regulated remittance provider. Small spread on top of mid market.",
  "Deutsche Bank": "Traditional bank wire. Bakes the FX spread into the exchange rate.",
  "Western Union": "Retail remittance service. Widest spread of the tested providers.",
  PayPal:          "Consumer payment platform. Adds a large FX conversion margin.",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      className="rounded-xl border px-4 py-3 shadow-lg max-w-[240px]"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
        <span className="font-semibold text-sm text-[var(--color-fg)]">{p.name}</span>
      </div>
      <p className="font-money font-bold text-lg tabular text-[var(--color-fg)] mb-1">
        {p.sym}{p.received.toLocaleString()}
      </p>
      <p className="text-xs" style={{ color: p.color }}>
        Loses {p.sym}{p.markup.toLocaleString()} vs mid market
      </p>
      <p className="mt-2 text-xs text-[var(--color-muted-fg)] leading-relaxed">
        {p.description}
      </p>
    </div>
  );
}

export default function CostPage() {
  const sym = currencySymbol(MOCK_PROFILE.home_currency);
  const d   = useAppData();
  const { fade } = usePageFade();

  const totalMarkupTarget = d.providers.reduce(
    (sum, p) => sum + Math.max(0, d.trueCostToday - p.received),
    0,
  );
  const totalMarkup = useCountUp(totalMarkupTarget, 1500);
  const bestReceivedCount = useCountUp(d.bestProvider.received, 1400, 0, 200);

  if (d.loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-10 w-96" />
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const slices = d.providers.map((p, i) => ({
    name: p.name,
    received: p.received,
    markup: Math.max(1, d.trueCostToday - p.received), // min 1 so the slice is visible
    color: SLICE_COLORS[i % SLICE_COLORS.length],
    description: DESCRIPTIONS[p.name] ?? "Provider quote from Wise Comparison API.",
    sym,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div style={fade(0)}>
        <div
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-primary)" }}
        >
          Cost breakdown
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-normal text-[var(--color-fg)] mt-2">
          Where your money actually goes.
        </h1>
        <p className="text-[var(--color-muted-fg)] mt-2 max-w-2xl">
          Hover any slice to see the provider&apos;s cut. Bigger slices mean more of your margin lost to FX spread. Every dollar in red is money that never reaches your supplier.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Donut chart */}
        <div
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 relative"
          style={fade(1)}
        >
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
            Provider spread breakdown
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
            {sym}{d.invoiceAmount.toLocaleString()} EUR invoice · ECB {d.ecbRateToday.toFixed(4)}
          </p>

          <div className="relative h-80 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="markup"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={2}
                  strokeWidth={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {slices.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs font-medium text-[var(--color-muted-fg)] uppercase tracking-wider">
                Total spread lost
              </p>
              <p
                className="font-money font-bold text-3xl tabular mt-1 leading-none"
                style={{ color: "#f87171" }}
              >
                {sym}{totalMarkup.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-[var(--color-muted-fg)]">across all providers</p>
            </div>
          </div>
        </div>

        {/* Legend + best case */}
        <div
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 flex flex-col"
          style={fade(2)}
        >
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
            Best case: {d.bestProvider.name}
          </div>
          <p className="mt-2 font-money font-bold text-3xl tabular text-[var(--color-fg)] leading-none">
            {sym}{bestReceivedCount.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-[var(--color-muted-fg)]">
            reaches your supplier · {sym}{Math.max(0, d.trueCostToday - d.bestProvider.received).toLocaleString()} spread vs mid market
          </p>

          <div className="mt-6 border-t border-[var(--color-border)] pt-5 flex-1">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)] mb-3">
              Legend
            </div>
            <ul className="space-y-3">
              {slices.map((s) => {
                const pct = ((s.markup / totalMarkupTarget) * 100).toFixed(1);
                return (
                  <li key={s.name} className="flex items-start gap-3">
                    <span
                      className="h-3 w-3 rounded-sm shrink-0 mt-1"
                      style={{ background: s.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-[var(--color-fg)]">{s.name}</span>
                        <span className="font-money tabular text-[var(--color-fg)]">
                          {sym}{s.markup.toLocaleString()}
                          <span className="text-[var(--color-muted-fg)] text-xs ml-1">({pct}%)</span>
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-muted-fg)] leading-relaxed mt-0.5">
                        {s.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Cost snapshot cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={fade(3)}>
        <SnapshotCard label="Invoice amount" value={`${currencySymbol(MOCK_PROFILE.supplier_currency)}${d.invoiceAmount.toLocaleString()}`} note="your input" />
        <SnapshotCard label="True mid market cost" value={`${sym}${d.trueCostToday.toLocaleString()}`} note={`ECB rate ${d.ecbRateToday.toFixed(4)}`} />
        <SnapshotCard label={`Saving with ${d.bestProvider.name}`} value={`${sym}${d.savingVsWorst.toLocaleString()}`} note={`vs ${d.worstProvider.name}`} positive />
      </div>

      <p className="text-xs text-[var(--color-muted-fg)]">
        FX markup is the difference between the ECB mid market rate and what your supplier actually receives. HalalFlow never moves money.
      </p>
    </div>
  );
}

function SnapshotCard({
  label, value, note, positive,
}: {
  label: string; value: string; note: string; positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">{label}</p>
      <p
        className="mt-2 font-money font-bold text-2xl tabular leading-none"
        style={{ color: positive ? "#3DD68C" : "var(--color-fg)" }}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-[var(--color-muted-fg)]">{note}</p>
    </div>
  );
}
