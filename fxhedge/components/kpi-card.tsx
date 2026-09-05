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
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {delta}
        </span>
      )}
      {subtext && <p className="mt-1 text-xs text-[var(--color-muted-fg)]">{subtext}</p>}
    </div>
  );
}
