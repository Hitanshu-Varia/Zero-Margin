"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/terminal", label: "Settlement terminal", icon: "terminal" },
  { href: "/replay", label: "Basis replay", icon: "pulse" },
  { href: "/arkiv", label: "Attestations", icon: "layers" },
  { href: "/proof", label: "Proof sheet", icon: "shield" },
] as const;

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/terminal": "Settlement terminal",
  "/replay": "Basis replay",
  "/arkiv": "Attestations",
  "/proof": "Proof sheet",
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "grid":
      return (
        <svg {...common} className={className}>
          <rect x="1.5" y="1.5" width="5.2" height="5.2" rx="1.4" />
          <rect x="9.3" y="1.5" width="5.2" height="5.2" rx="1.4" />
          <rect x="1.5" y="9.3" width="5.2" height="5.2" rx="1.4" />
          <rect x="9.3" y="9.3" width="5.2" height="5.2" rx="1.4" />
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
    case "search":
      return (
        <svg {...common} className={className}>
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common} className={className}>
          <path d="M6 4l4 4-4 4" />
        </svg>
      );
    default:
      return null;
  }
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const active = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className="nav-item"
          >
            <Icon name={item.icon} />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-ring">
      <span
        aria-hidden="true"
        className="grid h-6 w-6 place-items-center rounded-[7px] bg-cobalt text-white"
      >
        <span className="font-mono text-[13px] font-semibold leading-none">Z</span>
      </span>
      {!compact && (
        <span className="text-[14px] font-semibold tracking-[-0.01em]">
          ZeroMargin
        </span>
      )}
    </a>
  );
}

/**
 * Application chrome: sidebar with grouped sections, a topbar holding
 * the page breadcrumb, command bar, network chip, primary action, and
 * wallet pill. Landing (/) renders its own marketing frame.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname === "/") {
    return <>{children}</>;
  }

  const title = pageTitles[pathname] ?? "ZeroMargin";

  return (
    <div className="min-h-dvh">
      {/* Sidebar */}
      <aside
        aria-label="Sidebar"
        className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col border-r border-line bg-surface lg:flex"
      >
        <div className="flex h-[52px] items-center gap-2 border-b border-line px-4">
          <Brand />
          <span className="ml-auto rounded-chip border border-line px-1.5 py-0.5 font-mono text-[10px] text-dim">
            v0.1.0
          </span>
        </div>

        <div className="flex flex-1 flex-col px-3 py-4">
          <p className="group-label">Trading</p>
          <NavLinks pathname={pathname} />
        </div>

        <div className="border-t border-line px-3 py-3">
          <div className="flex items-center gap-2 rounded-field border border-line bg-surface-raised px-2.5 py-2">
            <span aria-hidden="true" className="pulse-dot h-[6px] w-[6px] rounded-full bg-up" />
            <span className="text-[12px] font-medium text-muted">Base mainnet</span>
            <span className="ml-auto font-mono text-[10px] text-dim">4453</span>
          </div>
          <p className="px-1 pt-2 text-[11px] leading-snug text-dim">
            Simulation — every figure is computed locally by the span engine.
          </p>
        </div>
      </aside>

      {/* Topbar + content */}
      <div className="lg:pl-[224px]">
        <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur">
          <div className="flex h-[52px] items-center gap-3 px-4 md:px-6">
            <button
              type="button"
              aria-expanded={drawerOpen}
              aria-controls="drawer"
              onClick={() => setDrawerOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-field border border-line text-muted lg:hidden"
            >
              <span aria-hidden="true" className="text-[14px] leading-none">≡</span>
            </button>

            {/* breadcrumb */}
            <a href="/dashboard" className="flex items-center gap-1.5 text-[13px] text-dim">
              <span className="hidden sm:inline">ZeroMargin</span>
              <Icon name="chevron" className="hidden sm:inline" />
              <span className="font-medium text-text">{title}</span>
            </a>

            {/* command bar */}
            <button
              type="button"
              className="group ml-auto hidden h-9 items-center gap-2 rounded-field border border-line bg-surface px-3 text-left transition-colors duration-100 hover:border-line-strong md:flex xl:w-80"
            >
              <Icon name="search" />
              <span className="text-[13px] text-dim group-hover:text-muted">
                Search books, vectors, scenarios
              </span>
              <kbd className="ml-auto rounded-[5px] border border-line bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-dim">
                /
              </kbd>
            </button>

            <button
              type="button"
              className="ml-auto hidden h-9 items-center rounded-field bg-paper px-3.5 text-[13px] font-medium text-white transition-colors duration-100 hover:bg-cobalt/90 md:ml-3 lg:flex"
            >
              New settlement
            </button>

            {/* wallet pill */}
            <button
              type="button"
              className="flex h-9 shrink-0 items-center gap-2 rounded-field border border-line bg-surface px-2 transition-colors duration-100 hover:border-line-strong"
            >
              <span
                aria-hidden="true"
                className="grid h-6 w-6 place-items-center rounded-full bg-cobalt-dim font-mono text-[10px] font-medium text-cobalt"
              >
                ZM
              </span>
              <span className="hidden font-mono text-[12px] text-muted sm:inline">
                0.7fa3…c41d
              </span>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="text-dim">
                <path d="M4 6.5L8 10.5 12 6.5" />
              </svg>
            </button>
          </div>
        </header>

        <main className="min-w-0">{children}</main>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-baseline justify-between gap-2 px-4 py-5 md:px-6">
            <span className="text-[12px] text-dim">
              A hackathon prototype, not audited; settle against the demo adapter.
            </span>
            <span className="font-mono text-[11px] tabular-nums text-dim">
              USDC base units (1e6 = $1.00)
            </span>
          </div>
        </footer>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div id="drawer" className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[260px] border-r border-line bg-surface p-3 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between px-1 pt-1 pb-3 border-b border-line">
              <Brand />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-[6px] border border-line px-2 py-1 font-mono text-[10px] text-muted"
              >
                esc
              </button>
            </div>
            <p className="group-label">Trading</p>
            <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            <div className="mt-4 flex items-center gap-2 rounded-field border border-line bg-surface-raised px-2.5 py-2">
              <span aria-hidden="true" className="pulse-dot h-[6px] w-[6px] rounded-full bg-up" />
              <span className="text-[12px] font-medium text-muted">Base mainnet</span>
              <span className="ml-auto font-mono text-[10px] text-dim">4453</span>
            </div>
            <p className="px-1 pt-3 text-[11px] leading-snug text-dim">
              Simulation — every figure is computed locally by the span engine.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
