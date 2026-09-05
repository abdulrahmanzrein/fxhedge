interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  subtext?: string;
}

export function KpiCard({ label, value, delta, positive, subtext }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-muted-fg)]">{label}</p>
      <p className="font-money mb-2 text-[30px] font-bold leading-none text-[var(--color-fg)]">{value}</p>
      {delta && (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            positive
              ? "bg-[var(--color-positive-muted)] text-[var(--color-positive)]"
              : "bg-[var(--color-destructive-muted)] text-[var(--color-negative)]"
          }`}
        >
          {delta}
        </span>
      )}
      {subtext && <p className="mt-1 text-xs text-[var(--color-muted-fg)]">{subtext}</p>}
    </div>
  );
}
