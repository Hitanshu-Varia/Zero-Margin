"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/terminal", label: "Terminal" },
  { href: "/replay", label: "Replay" },
  { href: "/arkiv", label: "Attestations" },
  { href: "/proof", label: "Proof" },
] as const;

interface Health {
  status: string;
  mode: string;
  chainId: number;
  problems: string[];
}

/** The mode chip is the product's honesty layer: it names what is live. */
function ModeChip() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/health")
        .then(async (res) => {
          if (!res.ok) throw new Error(`api ${res.status}`);
          const body = await res.json();
          if (!alive) return;
          setHealth(body as Health);
        })
        .catch(() => {
          if (alive) setHealth(null);
        });
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const mode = health?.mode ?? "SELF";
  const title =
    health === null
      ? "SELF — the API layer has not answered yet; the page runs figures from the local deterministic engine."
      : health.problems.length > 0
        ? `DEGRADED — ${health.problems.join("; ")}`
        : `${mode} — every figure is computed from the deterministic span engine in this deployment; chain id ${health.chainId}. No node is connected in this mode.`;

  return (
    <span
      title={title}
      className={cn(
        "hidden cursor-help items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] sm:flex",
        health === null ? "border-line text-dim" : health.problems.length > 0 ? "border-down-dim bg-down-dim/30 text-down" : "border-line bg-surface text-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          health === null ? "bg-dim" : health.problems.length > 0 ? "bg-down" : "bg-saffron",
        )}
      />
      {mode}
    </span>
  );
}

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span
        aria-hidden="true"
        className="grid size-6 place-items-center rounded-[6px] bg-saffron"
      >
        <span className="font-mono text-[12px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
          Z
        </span>
      </span>
      <span className="text-[15px] font-semibold">ZeroMargin</span>
    </Link>
  );
}

/**
 * One compact header: brand, a truly centered segmented nav, engine
 * mode chip, one action. The mobile row is a slim scrolling strip.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-background/92">
        <div className="relative mx-auto flex h-14 w-full max-w-[1128px] items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] md:px-6">
          <Brand />

          {/* the nav, dead-centered regardless of brand/right widths */}
          <nav
            aria-label="Primary"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full border border-line bg-surface p-1 md:flex"
          >
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center rounded-full px-4 text-[13px] transition-colors duration-100",
                    active ? "bg-surface-raised text-text" : "text-muted hover:text-text",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <ModeChip />
            <Link
              href="/dashboard"
              className="flex h-9 shrink-0 items-center rounded-full bg-paper px-4 text-[13px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
              style={{ color: "var(--ink)" }}
            >
              Open the desk
            </Link>
          </div>
        </div>

        {/* mobile: one slim chip strip */}
        <nav
          aria-label="Primary"
          className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2 pt-0.5 md:hidden"
        >
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 shrink-0 items-center rounded-full border px-3 text-[12px]",
                  active
                    ? "border-line-strong bg-surface-raised text-text"
                    : "border-line text-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="min-w-0 flex-1">{children}</main>

      <footer className="mt-2 border-t border-line">
        <div className="mx-auto flex w-full max-w-[1128px] flex-wrap items-baseline justify-between gap-4 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 md:px-6">
          <p className="max-w-[46ch] text-pretty text-[12px] leading-relaxed text-dim">
            A hackathon prototype; the code is tested, not audited. The short
            leg settles against a pre-funded demo adapter, and every figure is
            computed locally by the span engine.
          </p>
          <p className="font-mono text-[11px] tabular-nums text-dim">
            USDC base units, 1e6 = $1.00
          </p>
        </div>
      </footer>
    </div>
  );
}
