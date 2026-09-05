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
