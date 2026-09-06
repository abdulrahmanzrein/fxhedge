"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/app/(auth)/actions";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  GitCompare,
  TrendingUp,
  Shield,
  Scale,
  LogOut,
  Menu,
} from "lucide-react";
import { useState, useRef, useEffect, forwardRef } from "react";

const workspaceNav = [
  { href: "/dashboard",  label: "Dashboard",          icon: LayoutDashboard },
  { href: "/transfer",   label: "New transfer",        icon: ArrowLeftRight  },
  { href: "/cost",       label: "Cost breakdown",      icon: BarChart2       },
  { href: "/compare",    label: "Compare providers",   icon: GitCompare      },
  { href: "/risk",       label: "Risk explorer",       icon: TrendingUp      },
];

const faithNav = [
  { href: "/sharia",   label: "Sharia options",      icon: Shield },
  { href: "/reflect",  label: "The weight of riba",  icon: Scale  },
];

const NavItem = forwardRef<
  HTMLAnchorElement,
  {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    onClick?: () => void;
  }
>(function NavItem({ href, label, icon: Icon, onClick }, ref) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      ref={ref}
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-[color,background-color,border-color,scale] duration-150 active:scale-[0.96] ${
        active
          ? "bg-[var(--color-primary)] font-medium text-white"
          : "text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]"
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
});

function Sidebar({
  onNav,
  firstItemRef,
}: {
  onNav?: () => void;
  firstItemRef?: React.Ref<HTMLAnchorElement>;
}) {
  return (
    <div className="flex h-full flex-col py-4">
      <div className="px-4 mb-6">
        <Link href="/" className="font-serif text-xl font-semibold text-[var(--color-fg)] hover:opacity-80 transition-opacity">
          Hedged
        </Link>
      </div>
      <div className="flex-1 space-y-5 px-2">
        <nav aria-label="Workspace">
          <p aria-hidden="true" className="mb-1 px-3 text-xs uppercase tracking-widest text-[var(--color-muted-fg)]">
            Workspace
          </p>
          <div className="space-y-1">
            {workspaceNav.map((item, i) => (
              <NavItem
                key={item.href}
                {...item}
                onClick={onNav}
                ref={i === 0 ? firstItemRef : undefined}
              />
            ))}
          </div>
        </nav>
        <nav aria-label="Faith and finance">
          <p aria-hidden="true" className="mb-1 px-3 text-xs uppercase tracking-widest text-[var(--color-muted-fg)]">
            Faith &amp; finance
          </p>
          <div className="space-y-1">
            {faithNav.map(item => (
              <NavItem key={item.href} {...item} onClick={onNav} />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  initials = "?",
}: {
  children: React.ReactNode;
  initials?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstNavRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (mobileOpen) {
      firstNavRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeSidebar();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function closeSidebar() {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <div className="flex h-full bg-[var(--color-surface)]">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:z-50 focus-visible:left-4 focus-visible:top-4 focus-visible:rounded-md focus-visible:bg-[var(--color-card)] focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-[var(--color-fg)] focus-visible:shadow-md focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden min-[920px]:flex w-[248px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)]">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="min-[920px]:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <aside
            id="mobile-sidebar"
            className="relative z-50 w-[248px] border-r border-[var(--color-border)] bg-[var(--color-card)]"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <Sidebar onNav={closeSidebar} firstItemRef={firstNavRef} />
          </aside>
        </div>
      )}

      {/* Main content — inert when sidebar is open on mobile */}
      <div
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — React 19 types inert as boolean but HTML spec accepts ""
        inert={mobileOpen ? "" : undefined}
        className="flex min-w-0 flex-1 flex-col"
      >
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4">
          <button
            ref={menuButtonRef}
            className="min-[920px]:hidden transition-[opacity,scale] duration-150 active:scale-[0.96]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            aria-controls="mobile-sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)] transition-[color,background-color,border-color,scale] duration-150 active:scale-[0.96]"
            >
              <LogOut size={16} />
            </button>
          </form>
          <div
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white"
          >
            {initials.slice(0, 2).toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1180px] px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
