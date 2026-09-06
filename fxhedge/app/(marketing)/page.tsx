"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Phone3D } from "@/components/phone-3d";
import { ThemeToggle } from "@/components/theme-toggle";
import { HalalFlowLogo } from "@/components/halalflow-logo";

const features = [
  {
    title: "True cost visibility",
    desc:  "See the real gap between the mid market rate and what you actually pay. That gap is your provider's margin, and it comes straight out of your bottom line.",
  },
  {
    title: "Provider comparison",
    desc:  "Wise, Instarem, Deutsche Bank and Western Union ranked by what your supplier actually receives, not the headline rate. One view, real numbers.",
  },
  {
    title: "Islamic finance options",
    desc:  "Explore murabaha, wa'd and natural hedges alongside conventional solutions, grounded in cited scholarly sources so you can make an informed choice.",
  },
];

const stats = [
  { value: "4+",     label: "FX providers compared"   },
  { value: "$12k",   label: "Avg invoice amount"       },
  { value: "$767",   label: "Avg saving vs worst rate" },
  { value: "100%",   label: "Halal finance coverage"   },
];

export default function LandingPage() {
  const [liveValue, setLiveValue] = useState("$0");
  const [mounted, setMounted]     = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => setMounted(true), []);

  // Trigger the .in animations on mount + IntersectionObserver for .sr-fade
  useEffect(() => {
    requestAnimationFrame(() => document.body.classList.add("in"));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("show");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".sr-fade").forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });

    return () => { io.disconnect(); document.body.classList.remove("in"); };
  }, []);

  // Theme-aware tokens for one-off overlays / gradients that need translucency
  const topGlow      = isDark ? "rgba(34,197,94,0.24)"  : "rgba(22,163,74,0.12)";
  const orbGreen     = isDark ? "rgba(34,197,94,0.17)"  : "rgba(22,163,74,0.10)";
  const orbSecondary = isDark ? "rgba(99,102,241,0.12)" : "rgba(180,165,120,0.14)"; // indigo dark → warm sand light
  const grainOpacity = isDark ? 0.04 : 0.02;
  const ghostBg      = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const ghostBorder  = isDark ? "rgba(255,255,255,0.20)" : "rgba(10,10,10,0.15)";
  const liveCardBg   = isDark ? "rgba(16,16,16,0.85)"   : "rgba(255,255,255,0.92)";
  const featureBg    = isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)";
  const featureBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.08)";

  return (
    <div
      className="min-h-full"
      style={{ background: "var(--color-surface)", color: "var(--color-fg)" }}
    >

      {/* ── Announcement banner ────────────────────────────────── */}
      <div
        className="relative z-40 text-center text-[13px] py-[9px] px-4 text-white"
        style={{ background: "linear-gradient(90deg, #16A34A 0%, #22C55E 55%, #4ADE80 100%)" }}
      >
        <a href="#features" className="inline-flex items-center gap-2 font-medium group">
          <span>New. Halal finance comparison is now live</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </a>
      </div>

      {/* ── Sticky nav ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          borderColor: "var(--color-border)",
          background:  isDark ? "rgba(5,5,5,0.60)" : "rgba(245,239,228,0.75)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-serif text-[22px] text-[var(--color-fg)]">
            <HalalFlowLogo size={26} />
            HalalFlow
          </Link>
          <nav className="hidden sm:flex items-center gap-8">
            <a href="#features" className="text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors">Features</a>
            <a href="#how"      className="text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors">How it works</a>
            <a href="#pricing"  className="text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors">Pricing</a>
            <a href="#contact"  className="text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors">Log in</Link>
            <Link
              href="/signup"
              className="rounded-full px-5 py-[9px] text-sm font-semibold transition-[opacity,box-shadow,scale] duration-200 active:scale-[0.96]"
              style={{
                background: "linear-gradient(135deg, #16A34A, #4ADE80)",
                boxShadow:  "0 0 22px rgba(34,197,94,.35)",
                color:      "#04120A",
              }}
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 pb-11">
        {/* Top green glow */}
        <div
          className="absolute inset-x-0 top-0 h-[60vh] pointer-events-none"
          style={{ background: `radial-gradient(ellipse 78% 62% at 50% -6%, ${topGlow}, transparent 68%)` }}
        />
        {/* Ambient orbs */}
        <div
          className="orb-a absolute pointer-events-none rounded-full"
          style={{ right: "-6%", top: "12%", width: 640, height: 640, filter: "blur(90px)", background: `radial-gradient(circle, ${orbGreen}, transparent 70%)` }}
        />
        <div
          className="orb-b absolute pointer-events-none rounded-full"
          style={{ left: "2%", bottom: 0, width: 460, height: 460, filter: "blur(90px)", background: `radial-gradient(circle, ${orbSecondary}, transparent 70%)` }}
        />
        {/* Grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: grainOpacity,
            backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")`,
          }}
        />

        <div className="relative z-10 mx-auto max-w-[1180px] px-6 grid gap-9 items-center lg:grid-cols-[1.05fr_0.95fr] lg:gap-3">

          {/* Left: copy */}
          <div>
            <h1
              className="lp-reveal lp-d1 font-serif font-normal m-0 leading-[1.03] text-[var(--color-fg)]"
              style={{ fontSize: "clamp(2.55rem, 6vw, 4.5rem)", letterSpacing: "-0.01em", maxWidth: "15ch" }}
            >
              Stop losing margin to hidden FX costs.
            </h1>

            <p
              className="lp-reveal lp-d2 mt-6 text-[var(--color-muted-fg)]"
              style={{ fontSize: "clamp(1rem, 2.4vw, 1.16rem)", maxWidth: "48ch" }}
            >
              HalalFlow helps Muslim owned businesses see what a transfer really costs, compare every major provider by what your supplier actually receives, and explore halal compliant alternatives, all in one place.
            </p>

            <div className="lp-reveal lp-d3 mt-[34px] flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full px-[30px] py-[14px] text-[14.5px] font-semibold transition-[opacity,box-shadow,scale] duration-200 active:scale-[0.96]"
                style={{
                  background: "linear-gradient(135deg, #16A34A, #4ADE80)",
                  boxShadow:  "0 0 22px rgba(34,197,94,.35)",
                  color:      "#04120A",
                }}
              >
                Start for free
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border px-[30px] py-[14px] text-[14.5px] font-semibold transition-[color,border-color,background-color,scale] duration-200 active:scale-[0.96]"
                style={{
                  borderColor: ghostBorder,
                  background:  ghostBg,
                  color:       "var(--color-fg)",
                }}
              >
                See live demo <span className="ml-2 inline-block">▸</span>
              </Link>
            </div>

            <p className="lp-reveal lp-d4 mt-5 text-xs text-[var(--color-muted-fg)] opacity-70">
              No card required · No money moved · Not financial advice
            </p>
          </div>

          {/* Right: 3D phone + live-card */}
          <div className="relative min-h-[600px]">
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-[74px] w-[240px] h-14 z-0"
              style={{ borderRadius: "50%", background: `radial-gradient(ellipse, ${isDark ? "rgba(0,0,0,0.55)" : "rgba(10,10,10,0.15)"}, transparent 70%)`, filter: "blur(20px)" }}
              aria-hidden="true"
            />
            <Phone3D onLiveValueChange={setLiveValue} theme={isDark ? "dark" : "light"} />

            {/* Live card overlay */}
            <div
              className="lp-live-card absolute bottom-[26px] z-20 w-[232px] rounded-[18px] p-[15px] border"
              style={{
                left: 0,
                borderColor: "var(--color-border)",
                background:  liveCardBg,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxShadow: isDark
                  ? "0 30px 60px -24px rgba(0,0,0,.8)"
                  : "0 30px 60px -24px rgba(10,10,10,0.25)",
              }}
            >
              <div className="flex items-center gap-[7px] text-[10.5px] text-[var(--color-muted-fg)] mb-0.5">
                <span
                  className="lp-live-dot h-1.5 w-1.5 rounded-full"
                  style={{ background: "#22C55E", boxShadow: "0 0 8px #22C55E" }}
                />
                Realized savings · last 90 days
              </div>
              <div className="text-xs text-[var(--color-fg)] mb-2.5">Across 14 transfers</div>

              <svg className="w-full h-14 block" viewBox="0 0 220 56" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="rgba(34,197,94,.35)" />
                    <stop offset="1" stopColor="rgba(34,197,94,0)"   />
                  </linearGradient>
                  <linearGradient id="sl" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0" stopColor="#16A34A" />
                    <stop offset="1" stopColor="#4ADE80" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,44 L18,40 L40,42 L64,32 L88,36 L112,24 L138,28 L162,16 L188,20 L214,6 L214,56 L0,56 Z"
                  fill="url(#sg)"
                />
                <path
                  className="lp-spark-line"
                  d="M0,44 L18,40 L40,42 L64,32 L88,36 L112,24 L138,28 L162,16 L188,20 L214,6"
                  fill="none"
                  stroke="url(#sl)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                />
              </svg>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-mono text-[22px] text-[var(--color-fg)]" style={{ letterSpacing: "-0.02em" }}>{liveValue}</span>
                <span className="text-[11px]" style={{ color: "#22C55E" }}>↑ $505 this month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────── */}
      <div
        className="border-y"
        style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
      >
        <div className="mx-auto max-w-[1180px] px-6 grid grid-cols-2 sm:grid-cols-4 gap-px">
          {stats.map((s) => (
            <div key={s.label} className="sr-fade flex flex-col items-center px-3.5 py-[30px]">
              <span className="font-mono text-2xl text-[var(--color-fg)]">{s.value}</span>
              <span className="mt-1.5 text-center text-[11.5px] text-[var(--color-muted-fg)]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-[88px]">
        <div className="mx-auto max-w-[1180px] px-6">
          <h2 className="sr-fade font-serif font-normal m-0 text-[var(--color-fg)]" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)" }}>
            What HalalFlow does
          </h2>
          <p className="sr-fade mt-3.5 max-w-lg text-[15px] text-[var(--color-muted-fg)]">
            The visibility small businesses deserve before every international payment. Nothing predicted, nothing moved.
          </p>

          <div className="mt-11 grid grid-cols-1 md:grid-cols-3 gap-[18px]">
            {features.map((f) => (
              <div
                key={f.title}
                className="sr-fade rounded-[18px] border p-6 transition-[border-color,transform,background-color] duration-300 hover:-translate-y-[3px]"
                style={{ borderColor: featureBorder, background: featureBg }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,.5)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = featureBorder)}
              >
                <div
                  className="w-7 h-1 rounded-full mb-[18px]"
                  style={{ background: "linear-gradient(90deg, #16A34A, #4ADE80)" }}
                />
                <h3 className="text-base m-0 mb-2 font-semibold text-[var(--color-fg)]">{f.title}</h3>
                <p className="text-[13.5px] text-[var(--color-muted-fg)] m-0 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA strip ──────────────────────────────────────────── */}
      <section
        id="pricing"
        className="relative overflow-hidden border-t py-20 text-center"
        style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
      >
        <div
          className="absolute inset-x-0 bottom-[-40%] h-[70%] pointer-events-none"
          style={{ background: `radial-gradient(ellipse 60% 100% at 50% 100%, ${isDark ? "rgba(34,197,94,0.20)" : "rgba(22,163,74,0.10)"}, transparent 70%)` }}
        />
        <div className="wrap relative mx-auto max-w-[1180px] px-6">
          <h2 className="sr-fade font-serif font-normal m-0 text-[var(--color-fg)]" style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)" }}>
            See your real FX cost in minutes.
          </h2>
          <p className="sr-fade mt-3.5 text-[var(--color-muted-fg)]">Free to use. No card required. Real rates, real providers.</p>
          <Link
            href="/signup"
            className="sr-fade mt-[30px] inline-block rounded-full px-[30px] py-[14px] text-[14.5px] font-semibold transition-[opacity,scale] duration-200 active:scale-[0.96]"
            style={{
              background: "linear-gradient(135deg, #16A34A, #4ADE80)",
              boxShadow:  "0 0 22px rgba(34,197,94,.35)",
              color:      "#04120A",
            }}
          >
            Start for free
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer id="contact" className="border-t" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <div className="mx-auto max-w-[1180px] px-6 flex flex-col sm:flex-row justify-between items-center gap-4 py-[34px]">
          <div>
            <div className="text-[13px] font-medium text-[var(--color-fg)]">Contact</div>
            <a href="mailto:hello@halalflow.com" className="text-[13px] hover:opacity-80 transition-opacity" style={{ color: "var(--color-primary)" }}>
              hello@halalflow.com
            </a>
          </div>
          <p className="text-center text-[11.5px] text-[var(--color-muted-fg)] max-w-[44ch]">
            HalalFlow never moves money and never predicts exchange rates. General education only, not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
