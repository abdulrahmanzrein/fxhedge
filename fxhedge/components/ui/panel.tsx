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
