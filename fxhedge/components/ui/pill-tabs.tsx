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
  id = "pill-tabs-indicator",
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  /** Unique when two instances share a page (layoutId must not collide). */
  id?: string;
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
                layoutId={id}
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
