import Link from "next/link";
import { AnimateIn } from "@/components/animate-in";

const features = [
  {
    title: "True cost visibility",
    desc: "See the real gap between the mid market rate and what you actually pay. That gap is your provider's margin, and it comes directly out of your bottom line.",
  },
  {
    title: "Provider comparison",
    desc: "Wise, Instarem, Deutsche Bank, Western Union ranked by what your supplier actually receives — not the headline rate. One view, real numbers.",
  },
  {
    title: "Islamic finance options",
    desc: "Explore murabaha, wa'd, and natural hedges alongside conventional solutions, grounded in cited scholarly sources so you can make an informed choice.",
  },
];

const stats = [
  { value: "4+",   label: "FX providers compared"    },
  { value: "€12k", label: "Avg invoice amount saved"  },
  { value: "CA$767",label: "Avg saving vs worst rate"  },
  { value: "100%",  label: "Halal finance coverage"    },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">

      {/* ── Sticky nav ────────────────────────────────────────── */}
      <header
        className="fixed inset-x-0 top-0 z-30 border-b border-white/8"
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(4,6,18,0.55)" }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-xl font-normal text-white transition-opacity hover:opacity-70">
            Hedged
          </Link>
          <div className="hidden items-center gap-8 sm:flex">
            <a href="#features" className="text-sm text-white/55 transition-colors hover:text-white">Features</a>
            <a href="#contact"  className="text-sm text-white/55 transition-colors hover:text-white">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"  className="text-sm font-medium text-white/60 transition-colors hover:text-white">Log in</Link>
            <Link
              href="/signup"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)" }}
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Full-bleed photo */}
        <img
          src="/hero-bg.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "55% center" }}
        />
        {/* Cinematic overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(4,6,18,0.80) 0%, rgba(4,6,18,0.55) 45%, rgba(4,6,18,0.78) 85%, rgba(4,6,18,0.97) 100%)",
          }}
        />
        {/* Radial blue glow at top */}
        <div
          className="absolute inset-x-0 top-0 h-[55vh] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 75% 55% at 50% 0%, rgba(59,130,246,0.20) 0%, transparent 70%)" }}
        />
        {/* Ambient gradient orbs */}
        <div
          className="orb-a absolute pointer-events-none"
          style={{ left: "8%", top: "18%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(72px)" }}
        />
        <div
          className="orb-b absolute pointer-events-none"
          style={{ right: "6%", bottom: "22%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(90px)" }}
        />
        {/* Grainy noise texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.032,
            backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center" style={{ paddingTop: "72px" }}>
          {/* Badge */}
          <div
            className="hero-animate mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium text-white/70"
            style={{ borderColor: "rgba(59,130,246,0.35)", background: "rgba(59,130,246,0.10)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#3B82F6", display: "inline-block" }} />
            Built for Muslim-owned businesses
          </div>

          <h1
            className="hero-animate font-serif text-5xl font-normal leading-[1.08] text-white sm:text-6xl lg:text-[4.5rem]"
            style={{ maxWidth: "18ch", animationDelay: "0.1s" }}
          >
            Stop losing margin to hidden FX costs.
          </h1>

          <p
            className="hero-animate mt-6 text-lg leading-relaxed text-white/52"
            style={{ maxWidth: "42ch", animationDelay: "0.2s" }}
          >
            See what your transfer really costs, compare every major provider, and explore halal compliant alternatives — all in one place.
          </p>

          <div
            className="hero-animate mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              href="/signup"
              className="rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
                boxShadow: "0 0 30px rgba(59,130,246,0.45)",
              }}
            >
              Start for free
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-medium text-white/75 transition-all hover:border-white/40 hover:text-white"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              See live demo
            </Link>
          </div>

          <p className="hero-animate mt-5 text-xs text-white/30" style={{ animationDelay: "0.4s" }}>
            No card required · No money moved · Not financial advice
          </p>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────── */}
      <div className="border-y border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-px px-6 py-0 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center px-4 py-8">
              <p className="font-money text-2xl font-bold text-[var(--color-fg)]">{s.value}</p>
              <p className="mt-1 text-center text-xs text-[var(--color-muted-fg)]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="bg-[var(--color-surface)]">
        <div className="mx-auto max-w-[1180px] px-6 py-20">
          <AnimateIn>
            <h2 className="font-serif text-3xl font-normal text-[var(--color-fg)]">What we do</h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-[var(--color-muted-fg)]">
              Hedged gives small businesses the visibility they deserve before every international payment.
            </p>
          </AnimateIn>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {features.map((f, i) => (
              <AnimateIn key={f.title} delay={i * 110}>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition-shadow duration-300 hover:shadow-md">
                  <div className="mb-5 h-1 w-7 rounded-full" style={{ background: "var(--color-primary)" }} />
                  <h3 className="font-semibold text-[var(--color-fg)]">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-fg)]">{f.desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA strip ─────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <AnimateIn>
          <div className="mx-auto max-w-[1180px] px-6 py-20 text-center">
            <h2 className="font-serif text-3xl font-normal text-[var(--color-fg)]">
              See your real FX cost in minutes.
            </h2>
            <p className="mt-3 text-[var(--color-muted-fg)]">
              Free to use. No card required. Real rates, real providers.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              Start for free
            </Link>
          </div>
        </AnimateIn>
      </section>

      {/* ── Contact + Footer ──────────────────────────────────── */}
      <footer id="contact" className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div>
            <p className="text-sm font-medium text-[var(--color-fg)]">Contact</p>
            <a
              href="mailto:hello@hedged.com"
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--color-primary)" }}
            >
              hello@hedged.com
            </a>
          </div>
          <p className="text-center text-xs text-[var(--color-muted-fg)]">
            Hedged never moves money and never predicts exchange rates. General education only, not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
