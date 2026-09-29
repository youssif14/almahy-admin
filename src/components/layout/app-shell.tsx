"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, Briefcase, LogOut, Menu, Plus, X } from "lucide-react";
import type { SessionUser } from "@/types";
import { SessionProvider } from "@/components/session-context";
import { ROLE_LABELS, can } from "@/lib/auth/permissions";
import { api } from "@/lib/api/client";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/cases", label: "Cases", icon: Briefcase },
];

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => setOpen(false), [pathname]); // close the drawer after navigating

  async function signOut() {
    setSigningOut(true);
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors",
              active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className={cn("size-4", active && "text-[#c9a45c]")} aria-hidden />
            {label}
          </Link>
        );
      })}
      {can(user.role, "case:create") && (
        <Link
          href="/cases/new"
          className="mt-4 flex items-center justify-center gap-2 rounded-control border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/5"
        >
          <Plus className="size-4" aria-hidden /> New case
        </Link>
      )}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-ink px-4 py-5">
      <Link href="/dashboard" className="px-3 font-serif text-2xl text-white">
        Almahy
        <span className="block font-sans text-xs text-white/50">Case Desk</span>
      </Link>
      <div className="mt-8 flex-1">{nav}</div>
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-2">
          <span className="grid size-9 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white" aria-hidden>
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white">{user.name}</p>
            <p className="text-xs text-white/55">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="rounded p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <SessionProvider user={user}>
      <a href="#main" className="sr-only z-50 rounded bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
        <aside className="sticky top-0 hidden h-dvh lg:block">{sidebar}</aside>

        {/* Mobile top bar + drawer */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
          <Link href="/dashboard" className="font-serif text-xl text-white">
            Almahy
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded p-2 text-white"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <Menu className="size-5" />
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" id="mobile-nav"
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
            <button type="button" className="absolute inset-0 animate-fade bg-ink/50" aria-label="Close menu" onClick={() => setOpen(false)} />
            <div className="relative h-full w-72 max-w-[85vw] animate-pop">
              {sidebar}
              <button type="button" autoFocus onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded p-2 text-white/70" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
          </div>
        )}

        <main id="main" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-3xl leading-tight text-ink">{title}</h1>
        {description && <div className="mt-1 text-sm text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
