"use client";
import { useEffect, useState } from "react";

/**
 * Wraps children and fades them in on mount — matches the dashboard's
 * staggered reveal. Fires once per navigation (component re-mounts).
 *
 * Usage:
 *   <PageFade>
 *     <PageFade.Item>Header</PageFade.Item>
 *     <PageFade.Item>Card 1</PageFade.Item>
 *     <PageFade.Item>Card 2</PageFade.Item>
 *   </PageFade>
 *
 * Or, for simple pages, just wrap:
 *   <PageFade>...page content...</PageFade>   // single fade, no stagger
 */

const STAGGER = 95;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/** Applies the fade to any element; `i` sets the stagger order. */
export function pageFadeStyle(visible: boolean, i = 0): React.CSSProperties {
  return {
    opacity:    visible ? 1 : 0,
    transform:  visible ? "none" : "translateY(16px) scale(0.985)",
    filter:     visible ? "none" : "blur(7px)",
    transition:
      "opacity 0.72s cubic-bezier(.22,.61,.36,1), transform 0.78s cubic-bezier(.22,.61,.36,1), filter 0.72s ease",
    transitionDelay: visible ? `${i * STAGGER}ms` : "0ms",
    willChange: "opacity, transform, filter",
  };
}

/** Hook returning `fade(i)` — wire your top-level children with fade(0), fade(1)… */
export function usePageFade() {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduced) { setVisible(true); return; }
    const t = window.setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [reduced]);

  return { fade: (i = 0) => pageFadeStyle(visible, i), visible, reduced };
}
