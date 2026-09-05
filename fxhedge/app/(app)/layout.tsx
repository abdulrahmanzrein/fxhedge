import { AppShell } from "@/components/app-shell";
import { MOCK_PROFILE } from "@/lib/fixtures";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const initials = (MOCK_PROFILE.business_name ?? "?")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2);

  return <AppShell initials={initials}>{children}</AppShell>;
}
