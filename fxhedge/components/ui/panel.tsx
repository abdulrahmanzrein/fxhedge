import { cn } from "@/lib/cn";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type PanelTag = "div" | "section" | "article" | "aside";

/**
 * Panel — THE layout primitive. Every screen is panels on canvas.
 * Elevation by lighter surface, hairline border, 16px radius, no shadow.
 * `as` keeps semantic tags (section/article); other div props pass through
 * (aria-label etc.).
 */
export function Panel({
  children,
  className,
  as: Tag = "div",
  ...rest
}: Omit<ComponentPropsWithoutRef<"div">, "children" | "className"> & {
  children: ReactNode;
  className?: string;
  as?: PanelTag;
}) {
  return (
    <Tag className={cn("rounded-2xl border border-line bg-surface", className)} {...rest}>
      {children}
    </Tag>
  );
}
