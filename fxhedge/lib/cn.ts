import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Class merge helper — clsx + tailwind-merge so overrides actually win. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
