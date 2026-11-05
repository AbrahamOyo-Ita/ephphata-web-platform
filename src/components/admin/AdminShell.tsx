"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  QrCode,
  HeartHandshake,
  Send,
  HandHeart,
  Timer,
  FileText,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Search,
  Bell,
  ExternalLink,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { can, ROLE_LABELS, type Permission } from "@/lib/permissions";
import { initials } from "@/lib/format";
import { CommandPalette } from "./CommandPalette";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  permission: Permission;
  badgeKey?: "volunteers" | "prayer";
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard.view" },
      { label: "Events", href: "/admin/events", icon: CalendarDays, permission: "events.view" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Registrations", href: "/admin/registrations", icon: Users, permission: "registrations.view" },
      { label: "Check-in", href: "/admin/checkin", icon: QrCode, permission: "checkin.operate" },
      { label: "Volunteers", href: "/admin/volunteers", icon: HandHeart, permission: "volunteers.view", badgeKey: "volunteers" },
      { label: "Programme", href: "/admin/programme", icon: Timer, permission: "programme.view" },
    ],
  },
  {
    section: "Community",
    items: [
      { label: "Prayer", href: "/admin/prayer", icon: HeartHandshake, permission: "prayer.view", badgeKey: "prayer" },
      { label: "Audience", href: "/admin/audience", icon: Users, permission: "audience.view" },
      { label: "Communications", href: "/admin/communications", icon: Send, permission: "communications.view" },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "Content", href: "/admin/content", icon: FileText, permission: "content.view" },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "analytics.view" },
      { label: "Team", href: "/admin/team", icon: ShieldCheck, permission: "team.manage" },
      { label: "Audit log", href: "/admin/audit", icon: FileText, permission: "audit.view" },
      { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
    ],
  },
];

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // The login route lives under /admin but must not render the shell.
  const isLogin = pathname === "/admin/login";

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (isLogin) return <>{children}</>;

  const visibleNav = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(user.role, item.permission)),
  })).filter((group) => group.items.length > 0);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const SidebarContent = (
    <>
      <div className="flex h-[60px] items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xs bg-ink-900">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-white" aria-hidden="true">
              <path d="M4 12a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M20 12a8 8 0 0 1-16 0" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity=".45" />
              <circle cx="12" cy="12" r="2.2" fill="currentColor" />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink-900">EPHAPHATA</span>
            <span className="mt-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Operations
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="grid h-8 w-8 place-items-center rounded-xs text-ink-400 hover:bg-ink-900/5 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Operations" className="flex-1 overflow-y-auto px-2.5 pb-4">
        {visibleNav.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="mb-1.5 px-2.5 text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-ink-300">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-2.5 rounded-xs px-2.5 py-2 text-[0.8125rem] font-medium transition-colors duration-200 ${
                        active
                          ? "bg-ink-900 text-white"
                          : "text-ink-600 hover:bg-ink-900/[0.045] hover:text-ink-900"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-ink-400 group-hover:text-ink-600"}`}
                        strokeWidth={2}
                      />
                      <span className="truncate">{item.label}</span>
                      <ChevronRight
                        className={`ml-auto h-3.5 w-3.5 shrink-0 transition-colors duration-200 ${
                          active ? "opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-900/[0.07] p-2.5">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xs px-2.5 py-2 text-[0.8125rem] font-medium text-ink-500 transition-colors hover:bg-ink-900/[0.045] hover:text-ink-900"
        >
          <ExternalLink className="h-4 w-4 text-ink-400" strokeWidth={2} />
          View public site
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-[100svh] bg-paper-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] flex-col border-r border-ink-900/[0.07] bg-white lg:flex">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[60] overflow-hidden lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-ink-900/40 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[264px] flex-col bg-white transition-transform duration-400 ease-snap ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {SidebarContent}
        </aside>
      </div>

      {/* Main column */}
      <div className="lg:pl-[228px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-ink-900/[0.09] bg-white">
          <div className="flex h-[60px] items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid h-9 w-9 place-items-center rounded-xs text-ink-600 hover:bg-ink-900/5 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search trigger */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="group flex h-9 flex-1 max-w-[320px] items-center gap-2 rounded-xs border border-ink-900/10 bg-paper-50 px-3 text-left transition-colors hover:border-ink-900/25 hover:bg-white"
            >
              <Search className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
              <span className="text-[0.8125rem] text-ink-400">Search...</span>
              <kbd className="ml-auto hidden rounded border border-ink-900/15 bg-white px-1.5 py-0.5 font-sans text-[0.5625rem] font-semibold text-ink-400 sm:block">
                ⌘K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Notifications"
                className="relative grid h-9 w-9 place-items-center rounded-xs text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
              >
                <Bell className="h-4 w-4" strokeWidth={2} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-xs bg-flame-500" />
              </button>

              <div className="mx-1 h-6 w-px bg-ink-900/10" />

              {/* User menu */}
              <div className="flex items-center gap-2.5 rounded-xs px-1.5 py-1">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xs bg-ink-900 text-[0.625rem] font-bold text-white">
                  {initials(user.fullName)}
                </span>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-[0.75rem] font-semibold leading-tight text-ink-900">
                    {user.fullName}
                  </p>
                  <p className="truncate text-[0.625rem] leading-tight text-ink-400">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                aria-label="Sign out"
                className="grid h-9 w-9 place-items-center rounded-xs text-ink-400 transition-colors hover:bg-danger/[0.07] hover:text-danger"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        nav={visibleNav.flatMap((g) => g.items)}
      />
    </div>
  );
}
