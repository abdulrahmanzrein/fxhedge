import { cn } from "@/lib/cn";
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
      className={cn("text-muted", className)}
      aria-hidden
    />
  );
}
