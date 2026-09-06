"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function suppressTransitions() {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none !important}";
  document.head.appendChild(style);
  document.body.getBoundingClientRect();
  requestAnimationFrame(() => style.remove());
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-9 w-9" aria-hidden />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => {
        suppressTransitions();
        setTheme(isDark ? "light" : "dark");
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-9 w-9 flex items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-muted)] hover:border-[var(--color-primary)]/40 transition-[background-color,border-color,scale] duration-150 active:scale-[0.96]"
    >
      <span className="relative h-4 w-4">
        <Sun
          size={16}
          className={`absolute inset-0 transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
            isDark
              ? "opacity-100 scale-100 blur-0"
              : "opacity-0 scale-[0.25] blur-[4px]"
          }`}
        />
        <Moon
          size={16}
          className={`absolute inset-0 transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
            isDark
              ? "opacity-0 scale-[0.25] blur-[4px]"
              : "opacity-100 scale-100 blur-0"
          }`}
        />
      </span>
    </button>
  );
}
