"use client";
import { useState, useEffect } from "react";

export function useCountUp(
  target: number,
  duration = 1400,
  decimals = 0,
  delay = 0,
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = performance.now();

      function easeOutExpo(t: number) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      }

      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setValue(parseFloat((easeOutExpo(progress) * target).toFixed(decimals)));
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }, delay);

    return () => clearTimeout(timeout);
  }, [target, duration, decimals, delay]);

  return value;
}
