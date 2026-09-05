import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-[var(--color-primary)] text-white",
        outline:  "border border-[var(--color-border)] text-[var(--color-fg)]",
        success:  "bg-[var(--color-positive-muted)] text-[var(--color-positive)]",
        warning:  "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
        danger:   "bg-[var(--color-destructive-muted)] text-[var(--color-negative)]",
        muted:    "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
