"use client";

import { cn } from "@/lib/cn";
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
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-sm transition-[background-color,transform] duration-150",
        VARIANT[variant],
        className,
      )}
      {...props}
    />
  );
}
