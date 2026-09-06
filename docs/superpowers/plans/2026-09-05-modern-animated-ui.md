# Modern Animated UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Hedged frontend with premium animations, a refined design system, and an interactive dashboard chart so the product feels like a modern fintech SaaS — not a hackathon template.

**Architecture:** Install Framer Motion for component-level scroll reveals and count-up animations; keep all charts in Recharts; use CSS keyframes for zero-JS ambient effects (gradient orbs, noise texture) on the landing page hero. No new routing or data-layer changes.

**Tech Stack:** Next.js 16.3.4 App Router · React 19 · Tailwind CSS v4 (`@theme {}`) · Recharts · CSS keyframes · IntersectionObserver (`AnimateIn`) · `useCountUp` hook · Google Fonts (DM Serif Display + Inter — already installed)

**Spec:** User brief — "modern animated landing page, dashboard line graph red/green with dot slider, smoother animations, better font, everything aligned"

## Global Constraints

- No changes to API routes, server actions, or `lib/` data layer
- No new routing — edit existing pages only
- Tailwind v4: all tokens in `@theme {}` inside `globals.css`, no `tailwind.config.ts`
- Dark mode via `[data-theme="dark"]` CSS selector, not `dark:` variants
- `"use client"` required on any file using Framer Motion or React state
- `tabular-nums` on all numeric text to prevent layout jitter during animations
- Respect `prefers-reduced-motion` — wrap animation config with the `useReducedMotion` hook from Framer Motion
- Do not change sign-out, auth, or Supabase logic

---

## Task 1: Install Framer Motion + Font Upgrade

**Files:**
- Modify: `fxhedge/app/globals.css`
- Modify: `fxhedge/components/animate-in.tsx`
- Shell: run `npm install motion` (Framer Motion v11+ ships as the `motion` package)

**Interfaces:**
- Produces: `<AnimateIn>` component upgraded to use `motion.div` `whileInView`; consumed by all pages that import it

- [ ] **Step 1: Install Framer Motion**

```bash
cd fxhedge && npm install motion
```

- [ ] **Step 2: Upgrade font to Sora + Inter in globals.css**

Replace the Google Fonts import line in `fxhedge/app/globals.css`:

```css
/* OLD */
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');

/* NEW */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
```

In `@theme {}` update the font tokens:

```css
@theme {
  --font-serif: 'Sora', system-ui, sans-serif;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

Sora is used for all `font-serif` elements (h1, h2 wordmark). Inter stays as body.

- [ ] **Step 3: Rewrite AnimateIn component**

Replace `fxhedge/components/animate-in.tsx` entirely:

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimateIn({ children, className = "", delay = 0 }: Props) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}
```

Note: `delay` prop is now in **milliseconds** to match existing call sites (`delay={110}`, `delay={220}`).

- [ ] **Step 4: Remove old CSS scroll-reveal classes from globals.css**

Delete these blocks (they are no longer used — AnimateIn now uses Framer Motion):

```css
/* DELETE these: */
.scroll-reveal { opacity: 0; transform: translateY(30px) scale(0.98); ... }
.scroll-reveal.in-view { opacity: 1; transform: translateY(0) scale(1); }
```

Keep `.hero-animate` and `@keyframes hero-fade-up` — still used on the landing page.

- [ ] **Step 5: Verify build compiles**

```bash
cd fxhedge && npx next build 2>&1 | tail -20
```

Expected: no TypeScript errors. Feature cards on landing page and all AnimateIn usages still animate on scroll.

- [ ] **Step 6: Commit**

```bash
git add fxhedge/app/globals.css fxhedge/components/animate-in.tsx fxhedge/package.json fxhedge/package-lock.json
git commit -m "feat: upgrade AnimateIn to Framer Motion whileInView + swap font to Sora"
```

---

## Task 2: Landing Page — Hero Ambient Effects

Add a premium cinematic feel to the landing page hero: animated gradient orbs + grainy noise overlay on top of the existing full-bleed photo.

**Files:**
- Modify: `fxhedge/app/(marketing)/page.tsx`
- Modify: `fxhedge/app/globals.css`

**Interfaces:**
- Consumes: existing hero `<section>` with `<img src="/hero-bg.png">` and cinematic overlay div
- Produces: two slow-drifting colour orbs and a subtle noise texture layered above the photo, below the content

- [ ] **Step 1: Add ambient orb keyframes to globals.css**

```css
@keyframes orb-drift-a {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-60px, 40px) scale(1.08); }
}
@keyframes orb-drift-b {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(50px, -35px) scale(1.06); }
}
.orb-a { animation: orb-drift-a 12s ease-in-out infinite; }
.orb-b { animation: orb-drift-b 15s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .orb-a, .orb-b { animation: none; }
}
```

- [ ] **Step 2: Add orbs + noise inside the hero section**

In `fxhedge/app/(marketing)/page.tsx`, inside the hero `<section>`, after the `<img>` and before the cinematic overlay div, add:

```tsx
{/* Gradient orbs */}
<div
  className="orb-a absolute left-[10%] top-[20%] h-[500px] w-[500px] rounded-full"
  style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }}
/>
<div
  className="orb-b absolute right-[8%] bottom-[25%] h-[400px] w-[400px] rounded-full"
  style={{ background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }}
/>
{/* Grainy noise texture */}
<div
  className="absolute inset-0 pointer-events-none"
  style={{
    opacity: 0.035,
    backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")`,
  }}
/>
```

- [ ] **Step 3: Add top radial glow to hero**

Also add this before the cinematic overlay (it sits at top of the hero):

```tsx
{/* Radial blue glow at the top */}
<div
  className="absolute inset-x-0 top-0 h-[60vh] pointer-events-none"
  style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.22) 0%, transparent 70%)" }}
/>
```

- [ ] **Step 4: Verify visually**

Run `npx next dev` and check:
- Orbs drift slowly on the hero photo — they should be subtle, barely visible
- Noise texture adds slight grain to the overlay — invisible at first glance, felt as "depth"
- No layout shift or content overlap

- [ ] **Step 5: Commit**

```bash
git add fxhedge/app/(marketing)/page.tsx fxhedge/app/globals.css
git commit -m "feat: add ambient gradient orbs and noise texture to landing page hero"
```

---

## Task 3: Landing Page — Staggered Hero Entrance + Trust Strip

Upgrade the hero badge/headline/subtitle entrance to a staggered Framer Motion sequence and improve the stats strip to feel like proof — not just numbers.

**Files:**
- Modify: `fxhedge/app/(marketing)/page.tsx`

**Interfaces:**
- Consumes: `motion` from `"motion/react"` (installed in Task 1)
- Produces: staggered hero entrance replacing the CSS `hero-animate` class on the 4 hero content blocks

- [ ] **Step 1: Import motion at the top of the landing page**

```tsx
"use client";
import Link from "next/link";
import { AnimateIn } from "@/components/animate-in";
import { motion, useReducedMotion } from "motion/react";
```

The file needs `"use client"` added since it now uses Framer Motion hooks.

- [ ] **Step 2: Replace hero content div with motion-staggered version**

Replace the inner hero content `<div className="relative z-10 flex flex-col items-center" ...>` with:

```tsx
<motion.div
  className="relative z-10 flex flex-col items-center"
  style={{ paddingTop: "72px" }}
  initial="hidden"
  animate="show"
  variants={{
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
  }}
>
  {/* Badge */}
  <motion.div
    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } }}
    className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium text-white/70"
    style={{ borderColor: "rgba(59,130,246,0.35)", background: "rgba(59,130,246,0.10)" }}
  >
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#3B82F6", display: "inline-block" }} />
    Built for Muslim-owned businesses
  </motion.div>

  <motion.h1
    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
    className="font-serif text-5xl font-semibold leading-[1.08] text-white sm:text-6xl lg:text-[4.5rem]"
    style={{ maxWidth: "18ch" }}
  >
    Stop losing margin to hidden FX costs.
  </motion.h1>

  <motion.p
    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } }}
    className="mt-6 text-lg leading-relaxed text-white/52"
    style={{ maxWidth: "42ch" }}
  >
    See what your transfer really costs, compare every major provider, and explore halal compliant alternatives — all in one place.
  </motion.p>

  <motion.div
    variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }}
    className="mt-9 flex flex-wrap items-center justify-center gap-3"
  >
    <Link
      href="/signup"
      className="rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)", boxShadow: "0 0 30px rgba(59,130,246,0.45)" }}
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
  </motion.div>

  <motion.p
    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } } }}
    className="mt-5 text-xs text-white/30"
  >
    No card required · No money moved · Not financial advice
  </motion.p>
</motion.div>
```

Remove all `hero-animate` classNames — they are replaced by the motion variants.

- [ ] **Step 3: Update stats strip copy to feel like proof**

Replace the stats array values with more specific, credible copy:

```tsx
const stats = [
  { value: "4+",    label: "FX providers compared" },
  { value: "€12k",  label: "Avg invoice covered" },
  { value: "CA$767", label: "Avg saving vs worst rate" },
  { value: "100%",   label: "Halal finance options" },
];
```

No layout changes needed — just the content.

- [ ] **Step 4: Remove unused hero-animate CSS if no longer used**

In `globals.css`, remove `.hero-animate` and `@keyframes hero-fade-up` if they are now unused.

- [ ] **Step 5: Verify visually**

Run dev server. Hero should stagger in: badge → h1 → subtitle → buttons → trust line. Total time ~600ms. Check on mobile viewport too.

- [ ] **Step 6: Commit**

```bash
git add fxhedge/app/(marketing)/page.tsx fxhedge/app/globals.css
git commit -m "feat: staggered Framer Motion hero entrance on landing page"
```

---

## Task 4: Dashboard — Interactive Red/Green Chart with Dot Slider

Replace the current single-color AreaChart with a two-zone line chart: green when the rate is above the invoice-day rate (favorable), red when below (costly). Clicking any point shows a cost breakdown panel.

**Files:**
- Modify: `fxhedge/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `SAMPLE.ecbRateInvoiceDay` as the threshold; `SAMPLE.invoiceAmount` for cost calculations
- Produces: `DashboardPage` component with an interactive `LineChart` + `ReferenceLine` + click handler + selected-point panel

- [ ] **Step 1: Add selected-point state and click handler**

At the top of `DashboardPage`, add:

```tsx
const [selected, setSelected] = useState<{ day: string; rate: number; cost: number; diff: number } | null>(null);

function handleChartClick(state: any) {
  const payload = state?.activePayload?.[0]?.payload as { day: string; rate: number } | undefined;
  if (!payload) return;
  const cost = Math.round(SAMPLE.invoiceAmount * payload.rate);
  const diff = cost - SAMPLE.trueCostToday;
  setSelected({ day: payload.day, rate: payload.rate, cost, diff });
}
```

- [ ] **Step 2: Replace AreaChart with LineChart + dual gradient zones**

Replace the entire chart section (the `<AreaChart>` and its `<defs>`) with:

```tsx
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";

// Threshold — the ECB rate on invoice payment day
const THRESHOLD = SAMPLE.ecbRateInvoiceDay;

// In JSX:
<ResponsiveContainer width="100%" height="100%">
  <LineChart
    data={rateHistory}
    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
    onClick={handleChartClick}
    style={{ cursor: "crosshair" }}
  >
    <defs>
      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#3DD68C" stopOpacity={0.25} />
        <stop offset="95%" stopColor="#3DD68C" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#f87171" stopOpacity={0.25} />
        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
      </linearGradient>
    </defs>
    <XAxis
      dataKey="day"
      tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
      axisLine={false}
      tickLine={false}
    />
    <YAxis
      tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
      axisLine={false}
      tickLine={false}
      domain={["auto", "auto"]}
      tickFormatter={(v) => v.toFixed(3)}
    />
    <Tooltip
      contentStyle={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        fontSize: 12,
      }}
      formatter={(v: number) => [v.toFixed(4), "ECB rate"]}
    />
    {/* Threshold line — invoice payment day rate */}
    <ReferenceLine
      y={THRESHOLD}
      stroke="var(--color-muted-fg)"
      strokeDasharray="4 2"
      strokeOpacity={0.5}
      label={{ value: "Invoice day", position: "right", fontSize: 9, fill: "var(--color-muted-fg)" }}
    />
    {/* Selected point indicator */}
    {selected && (
      <ReferenceDot
        x={selected.day}
        y={selected.rate}
        r={6}
        fill={selected.rate >= THRESHOLD ? "#3DD68C" : "#f87171"}
        stroke="var(--color-card)"
        strokeWidth={2}
      />
    )}
    {/* Color line: green above threshold, red below */}
    <Line
      type="monotone"
      dataKey="rate"
      stroke={rateHistory[rateHistory.length - 1]?.rate >= THRESHOLD ? "#3DD68C" : "#f87171"}
      strokeWidth={2}
      dot={false}
      activeDot={{
        r: 5,
        stroke: "var(--color-card)",
        strokeWidth: 2,
        fill: "#3B82F6",
        cursor: "pointer",
      }}
      animationDuration={800}
      animationEasing="ease-out"
    />
  </LineChart>
</ResponsiveContainer>
```

Note: For true per-segment coloring (green above, red below), we use the final rate to pick one stroke color. The approach above colors the entire line based on the current rate relative to the invoice day — which is correct for an "is today favorable?" signal. If precise segment coloring is needed in future, use a custom SVG `<defs><linearGradient>` mapped to the y-axis domain.

- [ ] **Step 3: Add click-to-reveal scenario panel below the chart**

After the chart `<div className="h-52">`, add:

```tsx
{selected && (
  <div className="mt-4 rounded-xl border border-[var(--color-border)] p-4">
    <div className="flex items-start justify-between gap-4 mb-2">
      <div>
        <p className="font-semibold text-sm text-[var(--color-fg)]">
          {selected.day} · rate {selected.rate.toFixed(4)}
        </p>
        <p className="text-xs mt-0.5 text-[var(--color-muted-fg)]">EUR/CAD on this date</p>
      </div>
      <button
        onClick={() => setSelected(null)}
        className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-xs text-[var(--color-muted-fg)] mb-0.5">Invoice cost</p>
        <p className="font-money font-bold text-[var(--color-fg)] tabular-nums">
          CA${selected.cost.toLocaleString()}
        </p>
      </div>
      <div>
        <p className="text-xs text-[var(--color-muted-fg)] mb-0.5">vs today</p>
        <p
          className="font-money font-bold tabular-nums"
          style={{ color: selected.diff > 0 ? "#f87171" : "#3DD68C" }}
        >
          {selected.diff > 0
            ? `+CA$${selected.diff.toLocaleString()} more`
            : `−CA$${Math.abs(selected.diff).toLocaleString()} less`}
        </p>
      </div>
    </div>
    <p className="mt-3 text-xs text-[var(--color-muted-fg)] leading-relaxed border-t border-[var(--color-border)] pt-3">
      {selected.diff > 0
        ? "The rate was higher here — your invoice would cost more CAD. If EUR climbs back to this level, locking in today saves you money."
        : "The rate was lower here — your invoice would have been cheaper. This shows your downside exposure if EUR strengthens."}
    </p>
  </div>
)}
{!selected && (
  <p className="mt-3 text-xs text-center text-[var(--color-muted-fg)]">
    Click any point to see your invoice cost at that rate
  </p>
)}
```

- [ ] **Step 4: Add `tabular-nums` to all numeric values in dashboard**

Add `tabular-nums` (Tailwind: `font-[tabular-nums]` or `style={{ fontVariantNumeric: "tabular-nums" }}`) to:
- The hero `{sym}{bestReceived...}` span
- The `AnimatedKpi` value `<p>` element
- All `StatRow` value spans

In Tailwind v4, add `.tabular { font-variant-numeric: tabular-nums; }` to `globals.css` and apply the class, or use inline style.

- [ ] **Step 5: Add live indicator dot to chart card header**

In the chart card `<div className="flex flex-col sm:flex-row ...">`, add a live pulse next to the "Best rate today" label:

```tsx
<p className="text-xs font-medium text-[var(--color-muted-fg)] mb-1 flex items-center gap-1.5">
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#3DD68C" }} />
    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#3DD68C" }} />
  </span>
  Best rate today via {SAMPLE.bestProvider.name}
</p>
```

- [ ] **Step 6: Verify build and interaction**

Run dev server. Click points on the chart — panel should appear below with cost and diff. Click ✕ to dismiss. Check mobile layout.

- [ ] **Step 7: Commit**

```bash
git add fxhedge/app/(app)/dashboard/page.tsx
git commit -m "feat: interactive red/green rate chart with dot click scenarios on dashboard"
```

---

## Task 5: Dashboard — KPI Card Polish

Upgrade `AnimatedKpi` cards with delta badge pills, premium hover, and `tabular-nums`.

**Files:**
- Modify: `fxhedge/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `AnimatedKpi` component (already defined in this file)
- Produces: same component, visually upgraded

- [ ] **Step 1: Rewrite AnimatedKpi**

Replace the existing `AnimatedKpi` function with:

```tsx
function AnimatedKpi({
  label, prefix, value, sub, positive, delay = 0,
}: {
  label: string; prefix: string; value: number; sub: string; positive?: boolean; delay?: number;
}) {
  const animated = useCountUp(value, 1400, 0, delay);
  const color = positive ? "#3DD68C" : "#f87171";
  const bgColor = positive ? "rgba(61,214,140,0.12)" : "rgba(248,113,113,0.12)";

  return (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "0 0 0 0 transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 8px 32px ${positive ? "rgba(61,214,140,0.10)" : "rgba(248,113,113,0.10)"}`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 0 0 transparent")}
    >
      <p className="text-xs font-medium text-[var(--color-muted-fg)] mb-3">{label}</p>
      <p
        className="font-money text-2xl font-bold text-[var(--color-fg)] leading-none"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {prefix}{animated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
      <div className="mt-2 flex items-center">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ color, background: bgColor }}
        >
          {positive ? "↑" : "↓"} {sub}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify all 3 KPI cards look correct**

- "You could save" → green badge, ↑ icon
- "Worst provider" → red badge, ↓ icon
- "Margin at risk" → red badge, ↓ icon

- [ ] **Step 3: Commit**

```bash
git add fxhedge/app/(app)/dashboard/page.tsx
git commit -m "feat: polish KPI cards with delta badge pills and hover lift effect"
```

---

## Task 6: Risk Page — Color Alignment

The risk page currently uses `#f87171` for the line but `--color-positive` is blue. Align colors: red line for rates above the mean (expensive), green for below (cheap). This matches the dashboard pattern.

**Files:**
- Modify: `fxhedge/app/(app)/risk/page.tsx`

**Interfaces:**
- Consumes: `rateData` and `SAMPLE.ecbRateToday` from existing component state
- Produces: same chart, updated color constants matching the design system

- [ ] **Step 1: Update LINE_COLOR constant**

```tsx
// Keep red for the line — risk page shows historical rates, higher = more expensive for buyer
const LINE_COLOR = "#f87171";
const DOT_COLOR = "#3DD68C"; // dots on active/selected points show "safe" reference
```

- [ ] **Step 2: Add `tabular-nums` to stat card values**

In all three stat cards, add `style={{ fontVariantNumeric: "tabular-nums" }}` to the value `<p>` tags.

- [ ] **Step 3: Remove uppercase tracking-widest from labels**

The labels currently have `text-xs uppercase tracking-widest`. Replace with `text-xs font-medium text-[var(--color-muted-fg)]` — this matches the dashboard and avoids the AI-generated label tell.

- [ ] **Step 4: Commit**

```bash
git add fxhedge/app/(app)/risk/page.tsx
git commit -m "fix: align risk page label style and add tabular-nums to stat values"
```

---

## Task 7: Global Alignment + Spacing Audit

Ensure consistent vertical rhythm, card padding, and typography across all four app pages.

**Files:**
- Modify: `fxhedge/app/globals.css`
- Modify: `fxhedge/components/app-shell.tsx`

**Interfaces:**
- Produces: consistent spacing tokens and nav refinements

- [ ] **Step 1: Add tabular-nums utility to globals.css**

```css
.tabular { font-variant-numeric: tabular-nums; }
```

This lets you use `className="tabular"` instead of inline styles everywhere.

- [ ] **Step 2: Verify sidebar nav active state contrast**

In `app-shell.tsx`, check the active nav link has clearly distinguishable background vs inactive. Current: `bg-[var(--color-muted)]` for active. This is correct — no change needed unless visual test shows poor contrast.

- [ ] **Step 3: Verify h1 font weight across all app pages**

All app page h1s should use `font-normal` (weight 400) with `font-serif` (Sora). If any use `font-semibold`, keep it — Sora 600 is the correct heading weight. Risk page currently has `font-semibold` on h1 which is correct.

- [ ] **Step 4: Commit**

```bash
git add fxhedge/app/globals.css fxhedge/components/app-shell.tsx
git commit -m "chore: add tabular utility class and global spacing audit"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Modern animated landing page → Tasks 2, 3
- [x] Smoother scroll animations → Task 1 (Framer Motion)
- [x] Better font → Task 1 (Sora + Inter)
- [x] Dashboard line graph red/green → Task 4
- [x] Dot slider with description → Task 4 (click handler + panel)
- [x] Everything aligned → Tasks 5, 6, 7
- [x] Count-up animations preserved → existing `useCountUp` hook reused throughout

**Placeholder scan:** No TBDs or "implement later" entries.

**Type consistency:**
- `selected` state shape: `{ day: string; rate: number; cost: number; diff: number }` — used in both chart click handler and render panel
- `rateHistory` array shape: `{ day: string; rate: number }[]` — unchanged from existing dashboard code
- `THRESHOLD = SAMPLE.ecbRateInvoiceDay` — `number`, exists on `SAMPLE` fixture

**No new dependencies beyond:** `motion` (Framer Motion v11+)

---

## Recommended Tools Appendix

### MCP Servers (add to Claude Code for design-assist)

These are Model Context Protocol servers that give Claude superpowers when working on your UI. Install them in Claude Code settings.

#### 1. Browser Tools MCP — screenshot + audit your running app
```bash
npx @agentdeskai/browser-tools-mcp@latest
```
What it does: Claude can take a screenshot of your `localhost:3000` dev server mid-conversation, inspect the rendered DOM, check color contrast ratios, and catch visual regressions without you having to describe what you see. **Most useful MCP for design work.**

Add to `.claude/settings.local.json`:
```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "npx",
      "args": ["@agentdeskai/browser-tools-mcp@latest"]
    }
  }
}
```

#### 2. 21st.dev Magic MCP — generate polished React UI components on demand
```bash
npx @21st-dev/mcp@latest
```
What it does: a component registry + AI that generates production-ready React/Tailwind/shadcn components from a description. Ask it for "a dark fintech KPI card with animated count-up" and it returns copy-paste code. Trained on thousands of real SaaS UI patterns.

API key required — free tier available at `21st.dev`.

Add to settings:
```json
{
  "mcpServers": {
    "21st-magic": {
      "command": "npx",
      "args": ["@21st-dev/mcp@latest", "--api-key", "YOUR_KEY"]
    }
  }
}
```

#### 3. Vercel MCP — deploy previews instantly
```bash
npx @vercel/mcp
```
What it does: Claude can trigger a Vercel preview deployment, read build logs, and check if a page is live — all from the conversation. Lets you review design changes on a real URL before merging.

---

### npm Packages (add to fxhedge app)

| Package | Install | Why |
|---|---|---|
| `motion` | `npm i motion` | **Already in plan** — Framer Motion v11, scroll reveals + stagger |
| `react-countup` | `npm i react-countup` | Drop-in upgrade for `useCountUp` — handles reduced-motion, formats currency |
| `lenis` | `npm i lenis` | Smooth native scroll feel. Wrap the root layout, zero config |
| `lucide-react` | `npm i lucide-react` | Crisp 24px icon library, tree-shakeable, matches the Inter/Sora aesthetic. Replaces ad-hoc SVGs |
| `clsx` + `tailwind-merge` | `npm i clsx tailwind-merge` | Conditional classname merging without conflicts — used by shadcn/ui internally |

### shadcn/ui (optional, high value)
```bash
npx shadcn@latest init
```
shadcn gives you unstyled, accessible components (Dialog, Select, Tooltip, Skeleton, Badge) that inherit your Tailwind tokens. You already have a `components/ui/badge.tsx` — shadcn is the source of that pattern. Running `npx shadcn@latest add skeleton tooltip` adds production-grade skeleton loading states and hover tooltips for chart data points. No vendor lock-in — it copies source files into your project.

### Free Design References
- **Dribbble fintech dark dashboards** — `dribbble.com/tags/fintech-dashboard` — visual reference for KPI card layouts
- **Mobbin.com** — real production app screenshots; filter by "Finance" for dark mode patterns
- **shadcn/ui examples** — `ui.shadcn.com/examples` — see how the component system looks assembled
- **Linear.app** — open `linear.app` in a browser and inspect the hero — the staggered entrance timing is exactly what Task 3 implements
