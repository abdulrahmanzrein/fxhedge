# Hedged Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Hedged design system — a dark, ledger-calm fintech UI (Linear/Mercury tier) — as tokens + primitives + motion layer, prove it on a real dashboard screen, and retro-fit the four existing cards so nothing on `main` looks templated.

**Architecture:** One `@theme` token block in `app/globals.css` (Tailwind v4, CSS-first — no config file) defines the entire visual system: a 3-step surface scale, hairline borders, semantic money colors, and one brass accent. `components/ui/*` holds five primitives (Panel, KPI, PillTabs, Button, Input) built only from those tokens. A thin motion layer (`components/motion.tsx`) wraps the `motion` package with two shared spring presets, an `AnimatedNumber` ticker (money glides to its value), and reduced-motion respect; a `template.tsx` gives every route change the same fade-up enter. Every screen is "panels on canvas" — one layout primitive repeated.

**Tech Stack:** Next.js 16.3.4 (App Router), React 19, Tailwind CSS v4 (`@theme`), `motion` (Framer Motion successor), `next/font` (Google), recharts 3 (already installed).

**Spec:** This plan is self-contained; research sources it argues from:
- Anthropic `frontend-design` skill (installed at `.agents/skills/frontend-design/`): distinct identity, spend boldness in one place, motion answers actions only.
- Adrian Krebs' 16-pattern AI-slop audit (1,590 pages): the avoid-list in Global Constraints.
- Aniq-UI dark dashboard spec: surface scale, off-white text, desaturated accents, tabular numerals, 6–8% gridlines.
- User's reference screenshot: near-black charcoal canvas, glassy rounded card with hairline border, white line chart, pill tabs with animated indicator, quiet sidebar, tabular money.

---

## Global Constraints

Every task implicitly includes these. They are the taste gate — violations are review-rejection reasons.

**The slop avoid-list (Krebs' 16 tells — we trigger ZERO of them):**
- No Inter/Space Grotesk/Instrument Serif/Geist as the identity font. (Geist Mono may survive only if replaced — this plan replaces both.)
- No purple/lavender accents, no "VibeCode Purple", no acid-green-on-black.
- No gradient washes on components (cards, buttons, banners); no colored glows/box-shadows; no glassmorphism/`backdrop-blur`. The ONE allowed gradient is the ambient canvas layer in `globals.css` (body::before — designed darkness: a ~5% brass radial above the fold + a vertical lightness drift, fixed, behind all content).
- No colored left/top border stripes on cards.
- No identical icon-topped feature-card grids, no numbered 1-2-3 step decorations (zakat's 3 steps are a real sequence — allowed there only).
- No ALL-CAPS section labels/eyebrows; no middle-dot meta strings; no "→" appended to buttons/links.
- No emoji icons anywhere in chrome; icons are `lucide-react` at 16px, muted.
- Body text ≥ 4.5:1 contrast (WCAG AA); large text/essential UI ≥ 3:1.

**The dark-surface rules (Aniq spec):**
- Elevation = lighter surfaces, never shadows. Exactly 3 surfaces: `canvas #0B0E13` → `surface #11151C` → `surface-offset #171C24`. Nothing else.
- Text: `#E6E8EB` primary / `#9AA3AE` muted — never pure white, never below `#9AA3AE` for readable text.
- Semantic money colors tuned for dark: positive `#22C55E`, negative `#EF4444`, warning `#EAB308`. Color is NEVER the only cue — every red/green number carries a sign, arrow, or text label (existing `ui-context.md` invariant).
- Hairlines, not stripes: row/card separation is 1px `rgba(255,255,255,0.08)` — never zebra fills, never colored edges.
- All money/metric numerals are tabular: the `.tnum` utility (`font-variant-numeric: tabular-nums`) on every KPI, table column, and rate.

**Identity decisions (the "one strong opinion" — spend boldness HERE only):**
1. **The accent is brass `#D4AF6E`** — chosen because nisab is priced in gold, so the accent is the product's own theology made visible. One accent on any screen; it recolors via one token.
2. **The signature element is the KPI block:** a huge tabular numeral with a small muted label, living inside a Panel. Every screen repeats this one primitive.
3. **Motion budget: one orchestrated reveal per page-load** (staggered fade-up of panels, 40ms stagger) + transitions that answer user actions (tab slide, hover, press). Nothing loops, nothing floats, nothing parallaxing. Springs only: `SPRING = { type: "spring", stiffness: 400, damping: 34 }` for indicators, `EASE = [0.16, 1, 0.3, 1]` (easeOutExpo) for entrances. Entrances ≤ 240ms.
4. **Dark-only with an ambient gradient canvas.** One theme, deliberately — a dashboard a trader leaves open overnight. No `prefers-color-scheme` flip (delete the existing one). The canvas is never flat black: it carries the ambient gradient so the page reads as designed darkness (Linear/Vercel move).
5. **Copy is sentence-case, plain verbs, active voice** ("Save scenario", not "Submit"; errors state the fix, never apologize).

**Platform constraints:**
- Tailwind v4 CSS-first: all tokens live in `@theme` inside `app/globals.css`. No `tailwind.config.ts` may be created.
- `npm` is the package manager. Verify with `npx tsc --noEmit` + `npm run build` + `npm test` (62 tests must stay green).
- The dev server may already be running on port 3000 — visual checks use `curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/<route>`; if nothing listens, start `npx next dev -p PORT` detached (`(nohup npx next dev -p PORT > /tmp/dev.log 2>&1 &)`) and give it 5s.
- Existing card components (`breakeven-card`, `natural-hedge-card`, `zakat-*`) reference token classes (`bg-surface`, `text-text-muted`, `border-border`, `bg-primary-highlight`, `text-warning`, `text-error`, `bg-surface-offset`, `text-text-faint`, `border-divider`, `text-primary`). Task 1's token names MUST satisfy all of these — grep before renaming anything.
- `middleware.ts` already gates `/dashboard` — no auth work in this plan.
- Keep the existing `@media print` block in `globals.css` working (zakat scholar summary).

---

### Task 1: Token foundation — rewrite `globals.css`

**Files:**
- Modify: `fxhedge/app/globals.css` (full rewrite, ~120 lines)
- Test: none (CSS) — verification is build + a grep audit

**Interfaces:**
- Produces: Tailwind color utilities `bg-canvas`, `bg-surface`, `bg-surface-offset`, `text-primary`, `text-secondary`, `text-muted`, `text-faint`, `text-positive`, `text-negative`, `text-warning`, `text-accent`, `border-line`, `border-line-strong`, `bg-accent`, `bg-accent-soft`, `bg-positive-soft`, `bg-negative-soft`, `bg-warning-soft`; font utilities `font-sans`, `font-mono`; utility classes `.tnum`, `.panel-glow`; compat aliases `bg-primary-highlight`, `border-divider`, `text-text-muted`, `text-text-faint`, `border-border` (so existing cards keep compiling).

- [ ] **Step 1: Grep the exact token classes in use (protect the contract)**

```bash
cd fxhedge && grep -rhoE "(bg|text|border)-[a-z-]+" components/ app/ | sort -u
```

The new `@theme` must cover every hit or alias it.

- [ ] **Step 2: Rewrite `app/globals.css` with exactly this content**

```css
@import "tailwindcss";

/* ---------------------------------------------------------------------------
   Hedged design tokens — dark-only, ledger-calm.
   Surfaces: canvas < surface < surface-offset. Elevation by lightness, no shadows.
   One accent (brass). Semantic money colors tuned for dark. Hairline borders.
--------------------------------------------------------------------------- */

:root {
  --canvas: #0b0e13;
  --surface: #11151c;
  --surface-offset: #171c24;

  --text-primary: #e6e8eb;
  --text-secondary: #b4bac2;
  --text-muted: #9aa3ae;
  --text-faint: rgba(230, 232, 235, 0.55);

  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.14);

  --accent: #d4af6e;
  --accent-strong: #e3c288;
  --accent-soft: rgba(212, 175, 110, 0.12);

  --positive: #22c55e;
  --negative: #ef4444;
  --warning: #eab308;
  --positive-soft: rgba(34, 197, 94, 0.12);
  --negative-soft: rgba(239, 68, 68, 0.12);
  --warning-soft: rgba(234, 179, 8, 0.12);

  /* compat aliases — existing cards reference these names */
  --background: var(--canvas);
  --foreground: var(--text-primary);
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-surface-offset: var(--surface-offset);

  --color-primary: var(--text-primary);
  --color-secondary: var(--text-secondary);
  --color-muted: var(--text-muted);
  --color-faint: var(--text-faint);

  --color-accent: var(--accent);
  --color-accent-strong: var(--accent-strong);
  --color-accent-soft: var(--accent-soft);

  --color-positive: var(--positive);
  --color-negative: var(--negative);
  --color-warning: var(--warning);
  --color-positive-soft: var(--positive-soft);
  --color-negative-soft: var(--negative-soft);
  --color-warning-soft: var(--warning-soft);

  --color-line: var(--line);
  --color-line-strong: var(--line-strong);

  /* compat aliases for pre-design-system cards */
  --color-border: var(--line);
  --color-divider: var(--line);
  --color-text-muted: var(--text-muted);
  --color-text-faint: var(--text-faint);
  --color-error: var(--negative);
  --color-warning: var(--warning);
  --color-primary-highlight: var(--accent-soft);
  --color-surface-offset: var(--surface-offset);
  --color-surface: var(--surface);
  --color-background: var(--canvas);
  --color-foreground: var(--text-primary);

  --font-sans: var(--font-app-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-app-mono), ui-monospace, monospace;

  --radius-panel: 16px;
  --radius-control: 10px;
}

html {
  background: var(--canvas);
  color: var(--text-primary);
  color-scheme: dark;
}

body {
  background: var(--canvas);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-feature-settings: "ss01" on; /* set per font in Task 2 if unsupported */
}

/* Ambient canvas — designed darkness, not flat black. One faint brass glow
   above the fold + a vertical lightness drift. Fixed, behind all content,
   pointer-transparent. The ONLY gradient in the codebase (components stay flat). */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(1100px 520px at 50% -8%, rgba(212, 175, 110, 0.05), transparent 62%),
    linear-gradient(180deg, #0d1117 0%, var(--canvas) 42%, #090c10 100%);
}

/* Every column of money aligns. */
.tnum {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* Focus ring: visible, brass, never removed. */
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media print {
  aside,
  .no-print {
    display: none !important;
  }
  main {
    max-width: none !important;
    margin: 0 !important;
  }
  body {
    background: white !important;
    color: black !important;
  }
  .zakat-summary {
    border: 1px solid #333 !important;
  }
}
```

Note what is deliberately ABSENT: the `@media (prefers-color-scheme: dark)` block (dark-only now) and the old `font-family: Arial` body rule.

- [ ] **Step 3: Verify nothing lost its colors**

```bash
cd fxhedge && npx tsc --noEmit && npm run build 2>&1 | tail -5
```

Expected: build passes (token classes resolve; class *names* unchanged for existing cards).

- [ ] **Step 4: Commit**

```bash
cd fxhedge && git add app/globals.css && git commit -m "feat(design): token foundation — surface scale, brass accent, hairlines"
```

---

### Task 2: Typography — Spline Sans + Spline Sans Mono via next/font

**Files:**
- Modify: `fxhedge/app/layout.tsx`

**Interfaces:**
- Produces: CSS vars `--font-app-sans`, `--font-app-mono` (consumed by Task 1's `@theme` `--font-sans`/`--font-mono`); real `<title>`/`<description>` metadata.

Why Spline Sans: designed by Google specifically for product UI, has true tabular figures, and is absent from Krebs' slop font list. Spline Sans Mono is its sibling — mono appears ONLY for real data columns (rates, amounts), never as decorative labels.

- [ ] **Step 1: Replace the font imports and metadata in `app/layout.tsx`**

Replace the entire file with:

```tsx
import type { Metadata } from "next";
import { Spline_Sans, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const appSans = Spline_Sans({
  variable: "--font-app-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const appMono = Spline_Sans_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Hedged — FX cost & risk for Muslim-owned businesses",
  description:
    "See the real cost of an international payment, the risk of waiting, and your zakat — computed on live reference rates.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${appSans.variable} ${appMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify fonts resolve and build passes**

```bash
cd fxhedge && npx tsc --noEmit && npm run build 2>&1 | tail -5
```

Expected: build passes; no `next/font` fetch errors (requires network — if the sandbox blocks Google Fonts, the build fails with a fetch error; in that case stop and report, do not fall back to system fonts).

- [ ] **Step 3: Visual check (dev server)**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

Expected `200`. Eyeball `view-source`: `font-family` on body should chain from `--font-app-sans`.

- [ ] **Step 4: Commit**

```bash
cd fxhedge && git add app/layout.tsx && git commit -m "feat(design): Spline Sans identity type + real metadata"
```

---

### Task 3: Motion layer — springs, reveal, reduced-motion

**Files:**
- Create: `fxhedge/components/motion.tsx`
- Modify: `fxhedge/package.json` (add `motion`)

**Interfaces:**
- Produces: `SPRING: Transition`, `EASE_OUT: Transition`, `FadeUp({ delay?, children, className? })`, `Stagger({ children, className? })` + `StaggerItem({ children, className? })`, `AnimatedNumber({ value, format?, className? })` — all `"use client"` exports later tasks import as `from "@/components/motion"`.

- [ ] **Step 1: Install motion**

```bash
cd fxhedge && npm install motion
```

Expected: `"motion": "^12.x"` in package.json dependencies.

- [ ] **Step 2: Create `components/motion.tsx` with exactly this content**

```tsx
"use client";

/**
 * Motion layer — the whole animation vocabulary of Hedged.
 * Budget (design-plan constraint): ONE orchestrated reveal per page load,
 * plus transitions that answer a user action. Nothing loops, nothing floats.
 * Every animation respects prefers-reduced-motion via useReducedMotion.
 */

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

export const SPRING: Transition = { type: "spring", stiffness: 400, damping: 34 };
export const EASE_OUT: Transition = { duration: 0.24, ease: [0.16, 1, 0.3, 1] };

const hidden = { opacity: 0, y: 10 };
const shown = { opacity: 1, y: 0 };

/** Single element fade-up on mount. Use for hero content, not lists. */
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : hidden}
      animate={shown}
      transition={{ ...EASE_OUT, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

/** Orchestrated page-load reveal: direct children fade up, 40ms apart. */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      animate="shown"
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: reduce ? 0 : 0.04 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{ hidden, shown }}
      transition={EASE_OUT}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedNumber — money glides to its value (the Robinhood-feel detail).
 * Counts up from 0 on first render, glides between values on refresh.
 * Under reduced motion: renders the final value instantly.
 */
export function AnimatedNumber({
  value,
  format = (n: number) => n.toFixed(2),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const current = useMotionValue(reduce ? value : 0);
  const [text, setText] = useState(() => format(reduce ? value : 0));

  useEffect(() => {
    const unsub = current.on("change", (v) => setText(format(v)));
    const controls = animate(current, value, reduce ? { duration: 0 } : SPRING);
    return () => {
      unsub();
      controls.stop();
    };
  }, [value, current, format, reduce]);

  return <span className={className}>{text}</span>;
}
```

- [ ] **Step 3: Verify**

```bash
cd fxhedge && npx tsc --noEmit && npm run build 2>&1 | tail -3
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd fxhedge && git add components/motion.tsx package.json package-lock.json && git commit -m "feat(design): motion layer — springs, staggered reveal, reduced-motion"
```

---

### Task 4: Primitives — Panel, KPI, PillTabs, Button, Input, Icon

**Files:**
- Create: `fxhedge/components/ui/panel.tsx`
- Create: `fxhedge/components/ui/kpi.tsx`
- Create: `fxhedge/components/ui/pill-tabs.tsx`
- Create: `fxhedge/components/ui/button.tsx`
- Create: `fxhedge/components/ui/input.tsx`
- Create: `fxhedge/components/ui/icon.tsx`
- Modify: `fxhedge/package.json` (add `lucide-react`)

**Interfaces:**
- Consumes: `SPRING` from `@/components/motion` (Task 3).
- Produces (all consumed by Tasks 5–6):
  - `Panel({ children, className?, as? })` — surface card: `rounded-[--radius-panel] border border-line bg-surface`
  - `Kpi({ label, value, sub?, tone? })` — tone: `"neutral" | "positive" | "negative" | "accent"`
  - `PillTabs({ tabs: { id: string; label: string }[], active, onChange })` — sliding indicator via `layoutId`
  - `Button({ variant: "primary" | "secondary" | "ghost", ...props })`
  - `Input(props: InputHTMLAttributes)` — recessed well: `bg-canvas border-line`
  - `Icon({ name: LucideIcon, size?, className? })` — thin wrapper so icon size/weight is consistent (16px default, `text-muted`)

- [ ] **Step 1: Install lucide-react**

```bash
cd fxhedge && npm install lucide-react
```

- [ ] **Step 2: `components/ui/panel.tsx`**

```tsx
import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Panel — THE layout primitive. Every screen is panels on canvas.
 * Elevation by lighter surface, hairline border, 16px radius, no shadow.
 */
export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-line bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: `components/ui/kpi.tsx` — the signature element**

```tsx
import { clsx } from "clsx";

const TONE_CLASS = {
  neutral: "text-primary",
  positive: "text-positive",
  negative: "text-negative",
  accent: "text-accent",
} as const;

/**
 * Kpi — the signature element: huge tabular numeral, small muted label.
 * Repeated everywhere; this repetition IS the visual identity.
 */
export function Kpi({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "positive" | "negative" | "accent";
}) {
  return (
    <div>
      <div className="text-sm text-muted">{label}</div>
      <div
        className={clsx(
          "tnum mt-1 text-3xl font-semibold tracking-tight",
          TONE_CLASS[tone],
        )}
      >
        {value}
      </div>
      {sub ? <div className="tnum mt-1 text-sm text-muted">{sub}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: `components/ui/pill-tabs.tsx` — the smooth touch**

```tsx
"use client";

import { motion } from "motion/react";
import { clsx } from "clsx";
import { SPRING } from "@/components/motion";

/**
 * PillTabs — segmented control with a spring-sliding indicator.
 * The one place motion is showy, because it answers a click.
 */
export function PillTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "relative rounded-full px-4 py-1.5 text-sm transition-colors",
              isActive ? "text-canvas" : "text-muted hover:text-primary",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="pill-tabs-indicator"
                transition={SPRING}
                className="absolute inset-0 rounded-full bg-accent"
              />
            )}
            <span className="relative z-10 font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

(If two PillTabs instances ever share a page, pass a unique `layoutId` via an optional `id` prop defaulting to `"pill-tabs-indicator"` — extend the signature then.)

- [ ] **Step 5: `components/ui/button.tsx`**

```tsx
"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

const VARIANT = {
  primary:
    "bg-accent text-canvas font-medium hover:bg-accent-strong active:scale-[0.98]",
  secondary:
    "border border-line bg-surface text-primary hover:bg-surface-offset active:scale-[0.98]",
  ghost: "text-muted hover:text-primary hover:bg-surface-offset",
} as const;

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-sm transition-[background-color,transform] duration-150",
        VARIANT[variant],
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 6: `components/ui/input.tsx`**

```tsx
import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

/** Input — recessed well: darker than the card it sits on. */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "tnum w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-faint",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 7: `components/ui/icon.tsx`**

```tsx
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

/** Icon — 16px, muted, stroke 1.75. Icons whisper; numbers talk. */
export function Icon({
  icon: Glyph,
  size = 16,
  className,
}: {
  icon: LucideIcon;
  size?: number;
  className?: string;
}) {
  return (
    <Glyph
      size={size}
      strokeWidth={1.75}
      className={clsx("text-muted", className)}
      aria-hidden
    />
  );
}
```

- [ ] **Step 8: Verify**

```bash
cd fxhedge && npx tsc --noEmit && npm run build 2>&1 | tail -3 && npm test 2>&1 | grep -E "Test Files|Tests "
```

Expected: clean build, 62 tests passing.

- [ ] **Step 9: Commit**

```bash
cd fxhedge && git add components/ui package.json package-lock.json && git commit -m "feat(design): primitives — Panel, Kpi, PillTabs, Button, Input, Icon"
```

---

### Task 5: Retro-fit the four existing cards

**Files:**
- Modify: `fxhedge/components/breakeven-card.tsx`
- Modify: `fxhedge/components/natural-hedge-card.tsx`
- Modify: `fxhedge/components/zakat-holding-list.tsx`
- Modify: `fxhedge/components/zakat-result-card.tsx`
- Test: existing vitest suite (must stay green — no logic changes)

**Interfaces:**
- Consumes: `Panel`, `Kpi`, `Button`, `Input`, `Icon` (Task 4); token classes (Task 1).

Rules for this task:
- **Zero logic changes** — fetch, props, and computed values stay byte-identical. Only markup/classes change.
- Wrap each card's root in `Panel`; replace ad-hoc `div` wrappers with `Kpi` where the card shows one big number (breakeven's rate/cushion, zakat result's amount due).
- Every money value gets `.tnum`. Every verdict keeps its text label (a11y invariant) — map `COMFORTABLE/WATCH/DANGER` styles to `positive/warning/negative` token classes; pill background = the matching `-soft` token, text = the full-saturation token.
- Buttons become `<Button variant="primary">` / `"secondary"`; inputs become `<Input>`.
- Replace any emoji or inline SVG icons with `<Icon icon={...}>` from lucide.
- Wrap each card's primary numeral (breakeven cushion %, zakat total due — read the exact field from the component's own payload type before wiring) in `<AnimatedNumber>` from `@/components/motion` so money glides to its value on load.
- Delete any remaining hardcoded hex (the `grep` audit in Step 1 must end at zero).

- [ ] **Step 1: Audit current hardcoded colors**

```bash
cd fxhedge && grep -rnE "#[0-9a-fA-F]{3,6}|text-zinc-|bg-zinc-|bg-black|bg-white" components/ | grep -v node_modules
```

Record every hit — each must be gone by Step 4.

- [ ] **Step 2: Retro-fit `breakeven-card.tsx` and `natural-hedge-card.tsx`**

Apply the rules above. The `VERDICT_STYLE` maps become:

```tsx
const VERDICT_STYLE: Record<
  BreakevenPayload["verdict"],
  { pill: string; label: string }
> = {
  comfortable: { pill: "bg-positive-soft text-positive", label: "Comfortable" },
  watch: { pill: "bg-warning-soft text-warning", label: "Watch" },
  danger: { pill: "bg-negative-soft text-negative", label: "Danger" },
};
```

Note: labels become sentence-case (`Comfortable`, not `COMFORTABLE`) per the no-all-caps constraint.

- [ ] **Step 3: Retro-fit `zakat-holding-list.tsx` and `zakat-result-card.tsx`**

Same rules. The zakat method toggle (AAOIFI/Hanafi) becomes `PillTabs` — it's the exact two-segment case the component was built for.

- [ ] **Step 4: Verify — suite green + audit zero**

```bash
cd fxhedge && npm test 2>&1 | grep -E "Test Files|Tests " && npx tsc --noEmit && grep -rnE "#[0-9a-fA-F]{3,6}|text-zinc-|bg-zinc-|bg-black|bg-white" components/ | grep -v node_modules | wc -l
```

Expected: 62+ tests passing, tsc clean, grep count `0`.

- [ ] **Step 5: Commit**

```bash
cd fxhedge && git add components && git commit -m "feat(design): retro-fit cards to primitives — zero logic changes"
```

---

### Task 6: The dashboard — proof screen (app shell + hero page)

**Files:**
- Create: `fxhedge/app/(app)/layout.tsx` — app shell (sidebar + content column)
- Create: `fxhedge/app/(app)/template.tsx` — route-enter transition
- Create: `fxhedge/components/app-sidebar.tsx`
- Create: `fxhedge/app/(app)/dashboard/page.tsx`
- Create: `fxhedge/components/fx-chart-card.tsx`

**Interfaces:**
- Consumes: all primitives (Task 4), `Stagger`/`FadeUp` (Task 3), existing route contract:
  - `GET /api/fx?pair=EUR-CAD` → `{ rate, source, ... }` (fields per `types/index.ts` — read the file before wiring; do not invent shapes)
  - `GET /api/history?pair=EUR-CAD&days=90` → `{ series: { date, rate }[] ... }`
  - `GET /api/breakeven?invoice=&revenue=&pair=` → payload already typed in `breakeven-card.tsx`
- Produces: the shell every future screen mounts in; `FxChartCard({ pair, days? })`.

- [ ] **Step 1: `components/app-sidebar.tsx`**

Nav: Home (`/dashboard`), Transfer (`/transfer`), Cost (`/cost`), Compare (`/compare`), Risk (`/risk`), Zakat (`/zakat`), Sharia (`/sharia`), Reflect (`/reflect`). Lucide icons (Home, ArrowLeftRight, Calculator, Scale, Activity, ScrollText, Moon). 248px wide, `border-r border-line`, brand wordmark "Hedged" in `font-semibold tracking-tight` at top, nav items `text-sm text-muted` with `bg-surface-offset text-primary` on active (use `usePathname`), user block pinned at bottom. Collapses to a top bar below `lg` (simple: `hidden lg:flex` sidebar + a mobile header row with the same links inline — no hamburger library).

- [ ] **Step 2: `app/(app)/layout.tsx`**

```tsx
import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <main className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
        {children}
      </main>
    </div>
  );
}
```

And `app/(app)/template.tsx` — App Router remounts templates on every navigation, so this gives every route change the same 240ms fade-up enter (the one orchestrated moment per page, per the motion budget):

```tsx
"use client";

import { FadeUp } from "@/components/motion";

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <FadeUp>{children}</FadeUp>;
}
```

- [ ] **Step 3: `components/fx-chart-card.tsx`**

Client component. Fetches `/api/history?pair=${pair}&days=${days}`; renders a recharts `AreaChart` inside a `Panel`:
- Line/accent: **white** (`var(--text-primary)`) at 1.5px with a fill of `rgba(255,255,255,0.04)` — matching the reference screenshot; brass is reserved for UI accent, not data.
- Gridlines: `stroke="rgba(255,255,255,0.06)"`, `vertical={false}`.
- Axis: date ticks `text-muted` 11px, `axisLine={false}` `tickLine={false}`.
- Tooltip: `contentStyle={{ background: "var(--surface-offset)", border: "1px solid var(--line)", borderRadius: 12 }}`, values with `.tnum`.
- Header row inside the panel: current rate as `Kpi` (label `EUR → CAD`, sub `source · rate_date` from the payload), loading skeleton = `bg-surface-offset` block at 8% white pulse — never a gray block.
- Empty/error state: one sentence in `text-muted` with the retry action ("Couldn't load history. Retry") — no apology, no spinner wall.
- Line draw-in on load: `<Area ... isAnimationActive animationDuration={700} animationEasing="ease-out" />` — the line sweeps left→right once, then never animates again.
- The hero rate numeral (the Kpi value) is wrapped in `AnimatedNumber` — it glides up on load and glides between refreshes. This is the Robinhood-feel detail.

- [ ] **Step 4: `app/(app)/dashboard/page.tsx`**

```tsx
import { Stagger, StaggerItem, FadeUp } from "@/components/motion";
import { Panel, Kpi } from "@/components/ui/panel"; // Panel from ui/panel
import { FxChartCard } from "@/components/fx-chart-card";
import { BreakevenCard } from "@/components/breakeven-card";
import { NaturalHedgeCard } from "@/components/natural-hedge-card";
```

Structure (one reveal, one column rhythm):
1. `Stagger` wrapping the page. `FadeUp` header row: `h1` "Good afternoon" + date, `text-2xl font-semibold tracking-tight`; right side a `Button variant="secondary"` linking `/transfer` labeled "New payment".
2. `StaggerItem` → hero `Panel` (p-6): `FxChartCard` content — the page's single bold element.
3. Grid `md:grid-cols-2 gap-4`: `StaggerItem` → `BreakevenCard` (invoice=12000, revenue=18000 — replace later with scenario data), `StaggerItem` → `NaturalHedgeCard`.
4. `StaggerItem` → row of three quiet `Kpi`s in one `Panel` (Today's rate / 21-day worst move / source label) — data from the same `/api/fx` call the chart already made if trivially shareable, else its own fetch.

Self-critique pass (required by the design skill): after building, check — is brass used on exactly ONE element class per screen (active nav + primary buttons + pill indicator)? Is any section playing two motions? Is there an all-caps label? Fix before committing.

- [ ] **Step 5: Verify**

```bash
cd fxhedge && npx tsc --noEmit && npm run build 2>&1 | tail -3 && npm test 2>&1 | grep -E "Test Files|Tests "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard
```

Expected: build clean, tests green, `/dashboard` returns `200` (or `307` → `/login` when unauthenticated — both acceptable; authenticate via the signup API if you want to see the page HTML).

- [ ] **Step 6: Screenshot critique**

Open `http://localhost:3000/dashboard` in Chrome, sign in, and review against the reference: surfaces read as 3 levels, money aligns in columns, one accent, chart gridlines barely there, sidebar quiet. Fix what jumps out, then commit.

- [ ] **Step 7: Commit**

```bash
cd fxhedge && git add app components && git commit -m "feat(design): app shell + dashboard — the proof screen"
```

---

### Task 7: Landing page — gradient canvas, geometric art, live-quote hero

**Files:**
- Modify: `fxhedge/app/page.tsx` (full replace — the create-next-app default goes away)
- Create: `fxhedge/components/landing/geometric-band.tsx`
- Create: `fxhedge/components/landing/capability-rows.tsx`
- Modify: `fxhedge/app/globals.css` (append one-shot draw-in CSS)

**Interfaces:**
- Consumes: `Panel`, `Button` (Task 4), `Stagger`/`StaggerItem`/`FadeUp` (Task 3), `FxChartCard({ pair, days? })` (Task 6) — the landing hero IS the real product quoting EUR/CAD live.
- Imagery policy (per Global Constraints): visuals are procedural SVG + live data. No stock photos, no AI-generated raster art, no external image service.

- [ ] **Step 1: `components/landing/geometric-band.tsx`**

```tsx
"use client";

/**
 * GeometricBand — an 8-point-star (khatam) girih lattice behind the hero.
 * Islamic geometry as texture: two overlapping squares per tile, drawn once
 * on load (one-shot CSS animation), then still. Whisper opacity.
 */
export function GeometricBand({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden
      width="100%"
      height="280"
      viewBox="0 0 560 280"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="khatam" width="56" height="56" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1">
            <rect x="16" y="16" width="24" height="24" className="khatam-draw" />
            <rect
              x="16"
              y="16"
              width="24"
              height="24"
              transform="rotate(45 28 28)"
              className="khatam-draw"
            />
          </g>
        </pattern>
      </defs>
      <rect width="560" height="280" fill="url(#khatam)" />
    </svg>
  );
}
```

- [ ] **Step 2: Append the one-shot draw CSS to `app/globals.css`**

```css
/* Khatam band — draws once on load, then stays still. */
.khatam-draw {
  stroke-dasharray: 96;
  stroke-dashoffset: 96;
  animation: khatam-draw 900ms ease-out 200ms forwards;
}
@keyframes khatam-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .khatam-draw {
    animation: none;
    stroke-dashoffset: 0;
  }
}
```

- [ ] **Step 3: `components/landing/capability-rows.tsx`**

NOT an icon-card grid (slop tell). One primitive — a ledger row — repeated three times:

```tsx
const ROWS = [
  {
    title: "See the real cost",
    body: "Provider rates, fees and markups from the live Wise Comparison API, ranked by what actually arrives.",
  },
  {
    title: "Know the risk of waiting",
    body: "25 years of ECB history behind a pay-now-or-wait verdict that reports magnitudes, never predictions.",
  },
  {
    title: "Zakat on live rates",
    body: "Your holdings valued at today's reference rate, with AAOIFI and Hanafi views shown side by side.",
  },
];

export function CapabilityRows() {
  return (
    <section className="mt-24">
      {ROWS.map((row) => (
        <div
          key={row.title}
          className="grid gap-2 border-t border-line py-6 md:grid-cols-[240px_1fr] md:gap-8"
        >
          <h3 className="font-medium text-primary">{row.title}</h3>
          <p className="leading-relaxed text-muted">{row.body}</p>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Replace `app/page.tsx`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { FxChartCard } from "@/components/fx-chart-card";
import { Stagger, StaggerItem, FadeUp } from "@/components/motion";
import { GeometricBand } from "@/components/landing/geometric-band";
import { CapabilityRows } from "@/components/landing/capability-rows";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <GeometricBand className="pointer-events-none absolute inset-x-0 top-0 -z-10" />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-semibold tracking-tight">Hedged</span>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Create account</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <Stagger className="pt-16 md:pt-24">
          <StaggerItem>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
              Your margin, protected from the exchange rate.
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Hedged shows the real cost of an international payment, the risk of
              waiting, and your zakat, computed on live central-bank reference rates.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-8 flex gap-3">
              <Link href="/signup">
                <Button>Create free account</Button>
              </Link>
              <a href="#live">
                <Button variant="secondary">See a live quote</Button>
              </a>
            </div>
          </StaggerItem>
          <StaggerItem className="mt-16">
            <div id="live">
              <FxChartCard pair="EUR-CAD" days={30} />
            </div>
          </StaggerItem>
        </Stagger>

        <CapabilityRows />

        <FadeUp className="mt-24">
          <Panel className="p-6">
            <p className="text-muted">
              Built ground-up for Muslim-owned businesses: riba-free by design, with
              the sharia reasoning shown, never hidden.
            </p>
            <Link href="/sharia" className="mt-2 inline-block text-accent">
              Read the sharia approach
            </Link>
          </Panel>
        </FadeUp>

        <footer className="mt-24 border-t border-line pt-6 text-sm text-faint">
          Educational tool. Rates are indicative, not bookable. Not financial or
          religious advice.
        </footer>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

```bash
cd fxhedge && npx tsc --noEmit && npm run build 2>&1 | tail -3 && \
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

Expected: build clean, `/` returns `200` with no auth redirect (it is public by design — middleware only gates protected prefixes).

- [ ] **Step 6: Screenshot critique**

Open `http://localhost:3000` in Chrome. Check: geometric band is texture, not wallpaper (barely there); the live chart is the hero moment; brass appears only on CTAs; gradient canvas reads as depth, not as a "gradient background". Fix what jumps out.

- [ ] **Step 7: Commit**

```bash
cd fxhedge && git add app/page.tsx app/globals.css components/landing && \
git commit -m "feat(design): landing page — ambient gradient, khatam band, live-quote hero"
```

---

### Task 8: Whole-plan verification + PR

**Files:** none new

- [ ] **Step 1: Full gate**

```bash
cd fxhedge && npm test 2>&1 | grep -E "Test Files|Tests " && npx tsc --noEmit && echo TSC_OK && npm run build 2>&1 | tail -3
```

Expected: all 62 tests green, tsc clean, production build succeeds.

- [ ] **Step 2: Slop audit (deterministic, Krebs-style)**

```bash
cd fxhedge && grep -rnE "backdrop-blur|blur-(xl|2xl|3xl)|shadow-(xl|2xl)" app components; \
grep -rn "Inter\|Space_Grotesk\|Instrument_Serif" app/layout.tsx; \
grep -rnE "#[0-9a-fA-F]{6}" app components | grep -v globals.css
```

```bash
cd fxhedge && grep -rnE "repeat:|repeat-|Infinity" app components | grep -v node_modules; \
grep -rniE "gradient" app components | grep -v globals.css
```

Expected: all five greps return nothing (gradients exist ONLY in the ambient canvas layer in globals.css — the last-but-one proves it, the last proves nothing loops — the motion budget holds).

- [ ] **Step 3: Push + open PR**

```bash
git checkout -b feat/design-system && git push -u origin feat/design-system && gh pr create --title "feat: design system — tokens, primitives, motion, dashboard" --body "Design system per docs/superpowers/plans/2026-09-05-design-system.md: token foundation, Spline Sans type, motion layer, 6 primitives, cards retro-fitted, dashboard proof screen. 62 tests green, slop-audit clean."
```

- [ ] **Step 4: Merge after review, delete branch, update `context/progress-tracker.md`**

---

## Self-Review (per writing-plans skill)

1. **Spec coverage:** reference screenshot → surface scale/chart/pills (Tasks 1, 4, 6) ✅; "sleek + smooth transitions" → spring PillTabs, stagger reveal (Tasks 3, 4) ✅; "not AI slop" → avoid-list enforced by audit greps (Task 7 Step 2) ✅; existing cards not left broken → token aliases + retro-fit task (Tasks 1, 5) ✅; Tailwind v4/React/Next stack honored (no new framework deps beyond `motion` + `lucide-react`) ✅.
2. **Placeholder scan:** all code blocks are complete files or exact diffs; no TBDs; every verification command has expected output. Dashboard props `invoice=12000, revenue=18000` are flagged as placeholder-for-now explicitly (scenario wiring is post-plan).
3. **Type consistency:** `SPRING`/`EASE_OUT` exported in Task 3, consumed in Task 4 PillTabs ✅; token names in Task 1 satisfy the grep contract listed in its Step 1 and the Global Constraints ✅; `Kpi` tone union matches retro-fit mapping in Task 5 ✅.
