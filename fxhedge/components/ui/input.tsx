import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

/** Input — recessed well: darker than the card it sits on. */
export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "tnum w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-sm text-primary placeholder:text-faint",
        className,
      )}
      {...props}
    />
  );
}
