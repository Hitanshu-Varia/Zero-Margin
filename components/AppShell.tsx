"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/terminal", label: "Terminal", icon: "terminal" },
  { href: "/replay", label: "Replay", icon: "pulse" },
  { href: "/arkiv", label: "Attestations", icon: "layers" },
  { href: "/proof", label: "Proof", icon: "shield" },
] as const;

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "grid":
      return (
        <svg {...common} className={className}>
          <rect x="1.5" y="1.5" width="5" height="5" rx="1.2" />
          <rect x="9.5" y="1.5" width="5" height="5" rx="1.2" />
          <rect x="1.5" y="9.5" width="5" height="5" rx="1.2" />
          <rect x="9.5" y="9.5" width="5" height="5" rx="1.2" />
        </svg>
      );
    case "terminal":
      return (
        <svg {...common} className={className}>
          <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
          <path d="M4.5 6l2.2 2L4.5 10M8.5 10.5h3" />
        </svg>
      );
    case "pulse":
      return (
        <svg {...common} className={className}>
          <path d="M1.5 8.5h3l2-5 3 9 2-4h3" />
        </svg>
      );
    case "layers":
      return (
        <svg {...common} className={className}>
          <path d="M8 1.8L14 5 8 8.2 2 5 8 1.8z" />
          <path d="M2 8.4L8 11.6 14 8.4M2 11.4L8 14.6 14 11.4" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common} className={className}>
          <path d="M8 1.5l5.5 2v4c0 3.2-2.3 5.6-5.5 7-3.2-1.4-5.5-3.8-5.5-7v-4l5.5-2z" />
          <path d="M5.8 8l1.6 1.6 3-3.2" />
        </svg>
      );
    default:
      return null;
  }
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {nav.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={pathname === item.href ? "page" : undefined}
          className="nav-item"
        >
          <Icon name={item.icon} />
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/**
 * Application shell: persistent sidebar on desktop, drawer on mobile,
 * and a topbar with the command bar and wallet pill. The landing route
 * renders its own marketing chrome instead of the app frame.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh">
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        aria-label="Sidebar"
        className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex"
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-line px-5">
          <span
            aria-hidden="true"
            className="grid h-6 w-6 place-items-center rounded-[8px] bg-cobalt text-background"
          >
            <span className="font-mono text-[13px] font-bold leading-none">Z</span>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">ZeroMargin</span>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-3 py-4">
          <div>
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-dim">
              Sections
            </p>
            <NavLinks pathname={pathname} />
          </div>
        </div>

        <div className="border-t border-line px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-dim">
              <span aria-hidden="true" className="pulse-dot h-[6px] w-[6px] rounded-full bg-chain" />
              BASE·8453
            </span>
            <span className="font-mono text-[11px] text-dim">v0.1.0</span>
          </div>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-dim">
            simulation · every figure computed locally
          </p>
        </div>
      </aside>

      {/* ── Topbar ──────────────────────────────────────────── */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 md:px-6">
            {/* Mobile brand + drawer */}
            <button
              type="button"
              aria-expanded={drawerOpen}
              aria-controls="drawer"
              onClick={() => setDrawerOpen((v) => !v)}
              className="nav-item lg:hidden"
            >
              <Icon name="grid" />
              <span className="text-[13px]">Menu</span>
            </button>
            <a
              href="/"
              className="flex items-center gap-2 lg:hidden focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span
                aria-hidden="true"
                className="grid h-6 w-6 place-items-center rounded-[8px] bg-cobalt text-background"
              >
                <span className="font-mono text-[13px] font-bold leading-none">Z</span>
              </span>
              <span className="text-[14px] font-semibold tracking-tight">ZeroMargin</span>
            </a>

            {/* Command bar */}
            <button
              type="button"
              className="group ml-auto hidden h-9 w-72 items-center gap-2 rounded-field border border-line bg-surface px-3 text-left transition-colors duration-120 hover:border-line-strong md:flex xl:w-96"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
              <span className="text-[13px] text-dim group-hover:text-muted">Search books, vectors, scenarios</span>
              <kbd className="ml-auto rounded-[6px] border border-line bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-dim">
                /
              </kbd>
            </button>

            {/* Wallet pill */}
            <button
              type="button"
              className="ml-auto flex h-9 items-center gap-2 rounded-chip border border-line bg-surface-raised px-3 transition-colors duration-120 hover:border-line-strong md:ml-0"
            >
              <span aria-hidden="true" className="pulse-dot h-[7px] w-[7px] rounded-full bg-up" />
              <span className="font-mono text-[12px] text-muted">0.7fa3…c41d</span>
            </button>
          </div>
        </header>

        <main className="min-w-0">{children}</main>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 md:px-6">
            <span className="font-mono text-[11px] text-dim">
              A hackathon prototype, not audited; settle against the demo adapter
            </span>
            <span className="ml-auto font-mono text-[11px] text-dim">
              USDC base units · 1e6 = $1.00
            </span>
          </div>
        </footer>
      </div>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      {drawerOpen && (
        <div id="drawer" className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-line bg-surface p-3">
            <div className="mb-4 flex items-center justify-between px-2 pt-2">
              <span className="text-[14px] font-semibold">Navigate</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-[8px] border border-line px-2 py-1 font-mono text-[11px] text-muted"
              >
                esc
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            <p className="mt-6 px-3 font-mono text-[10px] leading-relaxed text-dim">
              BASE·8453 · every figure computed locally by the span engine
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
