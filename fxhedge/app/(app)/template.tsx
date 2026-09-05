"use client";

import { FadeUp } from "@/components/motion";

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <FadeUp>{children}</FadeUp>;
}
