"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  Calculator,
  Home,
  Moon,
  NotebookPen,
  Scale,
  ScrollText,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/transfer", label: "Transfer", icon: ArrowLeftRight },
  { href: "/cost", label: "Cost", icon: Calculator },
  { href: "/compare", label: "Compare", icon: Scale },
  { href: "/risk", label: "Risk", icon: Activity },
  { href: "/zakat", label: "Zakat", icon: Moon },
  { href: "/sharia", label: "Sharia", icon: ScrollText },
  { href: "/reflect", label: "Reflect", icon: NotebookPen },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.user?.email) setEmail(d.user.email);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {/* Desktop sidebar — quiet by design */}
      <aside className="hidden w-62 shrink-0 flex-col border-r border-line lg:flex">
        <div className="px-5 py-6 font-semibold tracking-tight">Hedged</div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex items-center gap-2.5 rounded-[10px] bg-surface-offset px-3 py-2 text-sm text-primary"
                    : "flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-muted hover:text-primary"
                }
              >
                <Icon icon={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-5 py-4 text-xs text-faint">
          <p className="truncate text-muted">{email ?? "Signed in"}</p>
        </div>
      </aside>

      {/* Mobile top bar — same links inline, no hamburger library */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <span className="font-semibold tracking-tight">Hedged</span>
        <nav className="flex items-center gap-3 overflow-x-auto text-sm text-muted">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname?.startsWith(item.href) ? "text-primary" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
