import Link from "next/link";
import { SAMPLE } from "@/lib/fixtures";

export default function LandingPage() {
  return (
    <div className="min-h-full bg-[var(--color-surface)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-[1180px] mx-auto">
        <span className="font-serif text-xl font-semibold text-[var(--color-fg)]">Hedged</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-[1180px] mx-auto px-6 py-20 text-center">
        <h1 className="font-serif text-5xl font-semibold leading-tight text-[var(--color-fg)] mb-6 max-w-2xl mx-auto">
          Stop losing margin to hidden FX costs
        </h1>
        <p className="text-lg text-[var(--color-muted-fg)] mb-10 max-w-xl mx-auto">
          See your true exchange rate cost, compare providers side-by-side, and explore Islamic finance alternatives — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup" className="rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            Start for free
          </Link>
          <Link href="/dashboard" className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-3 text-sm font-semibold text-[var(--color-fg)] hover:bg-[var(--color-muted)] transition-colors">
            See live demo
          </Link>
        </div>

        {/* Live data preview card */}
        <div className="mt-16 mx-auto max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-left shadow-lg">
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-fg)] mb-1">Live example · {SAMPLE.pair}</p>
          <p className="font-serif text-2xl font-semibold text-[var(--color-fg)] mb-4">Aisha's Halal Imports</p>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--color-muted-fg)]">Best rate (Wise)</span>
            <span className="font-money font-bold text-[var(--color-fg)]">CA${SAMPLE.bestProvider.received.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--color-muted-fg)]">Worst rate (PayPal)</span>
            <span className="font-money font-bold text-red-500">CA${SAMPLE.worstProvider.received.toLocaleString()}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm font-semibold border-t border-[var(--color-border)] pt-3">
            <span className="text-[var(--color-fg)]">You could save</span>
            <span className="text-green-600 dark:text-green-400 font-money">CA${SAMPLE.savingVsWorst.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1180px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              title: "True cost visibility",
              desc: "See the ECB mid-market rate vs what you actually pay — no more hidden markups.",
            },
            {
              title: "Provider comparison",
              desc: "Wise, Instarem, Deutsche Bank, Western Union — ranked by what your supplier actually receives.",
            },
            {
              title: "Islamic finance options",
              desc: "Explore natural hedges, wa'd, and murabaha alongside conventional forwards — grounded in cited sources.",
            },
          ].map(f => (
            <div key={f.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              <h3 className="font-semibold text-[var(--color-fg)] mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--color-muted-fg)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] py-8 text-center text-xs text-[var(--color-muted-fg)]">
        Hedged never moves money and never predicts exchange rates. General education only — not financial advice.
      </footer>
    </div>
  );
}
