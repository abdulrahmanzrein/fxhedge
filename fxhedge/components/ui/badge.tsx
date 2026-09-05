import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-[var(--color-primary)] text-white",
        outline:  "border border-[var(--color-border)] text-[var(--color-fg)]",
        success:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        warning:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        danger:   "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
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
