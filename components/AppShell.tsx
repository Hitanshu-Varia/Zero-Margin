"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span
        aria-hidden="true"
        className="grid size-6 place-items-center rounded-[6px] bg-saffron text-[--ink]"
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
 * One header for the whole product: brand, centered primary nav,
 * engine-mode chip, single action. No sidebar, no fake controls.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-background/88">
        <div className="mx-auto w-full max-w-[1128px] px-4 pt-[env(safe-area-inset-top)] md:px-6">
          <div className="flex h-14 items-center gap-3">
            <Brand />
            <span
              title="LOCAL — every figure is computed from the deterministic span engine in this browser; no node is connected."
              className="ml-auto hidden cursor-help items-center gap-1.5 rounded-field border border-line bg-surface px-2 py-1 font-mono text-[10px] text-dim sm:flex"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-saffron" />
              LOCAL
            </span>
            <Link
              href="/dashboard"
              className="ml-auto flex h-9 shrink-0 items-center rounded-field bg-paper px-3.5 text-[13px] font-medium transition-transform duration-100 ease-out active:scale-[0.97] sm:ml-3"
              style={{ color: "var(--ink)" }}
            >
              Open the desk
            </Link>
          </div>
          <nav
            aria-label="Primary"
            className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-1 md:mx-auto md:max-w-max md:justify-center md:pb-0"
          >
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 shrink-0 items-center rounded-field px-3 text-[13px] transition-colors duration-100 hover:text-text",
                    active ? "bg-surface-raised text-text" : "text-muted",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="min-w-0 flex-1">{children}</main>

      <footer className="mt-2 border-t border-line">
        <div className="mx-auto flex w-full max-w-[1128px] flex-wrap items-baseline justify-between gap-4 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 md:px-6">
          <p className="max-w-[46ch] text-pretty text-[12px] leading-relaxed text-dim">
            A hackathon prototype; the code is tested, not audited. The short leg
            settles against a pre-funded demo adapter, and every figure is
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
