"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEMO_BOOK,
  DEMO_ISOLATED_BOOK,
  evaluateSpan16,
  isolatedAccountAtShock,
  previewShockUnwind,
} from "@/lib/spanMath";
import {
  formatShock,
  formatPercentFromBps,
  formatSignedUsdc,
  formatUsdcWhole,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { ShockCompass } from "@/components/desk/ShockCompass";

const span = evaluateSpan16(DEMO_BOOK.lpNotionalUsdc, DEMO_BOOK.shortNotionalUsdc);

/* The crash the demo replays everywhere. */
const CRASH = -3_000n;
const crash = previewShockUnwind(
  DEMO_BOOK.lpNotionalUsdc,
  DEMO_BOOK.shortNotionalUsdc,
  DEMO_BOOK.postedMarginUsdc,
  CRASH,
  150n,
);
const crashIsolated = isolatedAccountAtShock(
  DEMO_ISOLATED_BOOK.lpNotionalUsdc,
  DEMO_ISOLATED_BOOK.postedMarginUsdc,
  CRASH,
  150n,
);

/** One crash, both desks rendered side by side. */
export function LandingStage() {
  const section = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const waterfall = [
    { label: "LP loss", value: crash.lpLossUsdc, signed: true },
    { label: "Short gain, netted", value: -crash.nettedOffsetUsdc, signed: true },
    { label: "Unwind fee", value: -crash.protocolFeeUsdc, signed: true },
  ];

  return (
    <div
      ref={section}
      className={cn("drift-field", !playing && "drift-paused")}
    >
      {/* ── Statement + instrument ─────────────────────────── */}
      <section className="mx-auto grid w-full max-w-[1128px] items-center gap-10 px-4 pb-10 pt-10 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)] md:gap-12 md:px-6 md:pb-14 md:pt-14">
        <div className="min-w-0">
          <h1 className="rise max-w-[24ch] text-balance text-[32px] font-medium leading-[1.05] md:text-[46px]">
            The crash settles in one transaction.
          </h1>
          <p className="mt-4 max-w-[52ch] text-pretty text-[15px] leading-relaxed text-muted">
            ZeroMargin cross-margins a Uniswap v4 LP with its offsetting short
            hedge on one SPAN-style grid, so the same book posts a fraction of
            the collateral and rides out the shock intact.
          </p>

          <p className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[26px] font-medium tabular-nums md:text-[30px]">
            <span className="text-down line-through decoration-[1.5px] decoration-down/50">
              {formatUsdcWhole(span.isolatedInitialMarginUsdc)}
            </span>
            <span className="text-[13px] font-normal text-dim">becomes</span>
            <span className="text-[var(--saffron)]">
              {formatUsdcWhole(span.netInitialMarginUsdc)}
            </span>
          </p>
          <p className="mt-1.5 text-[12px] text-dim">
            locked initial margin on the 95%-hedged golden vector,{" "}
            {formatPercentFromBps(span.capitalSavingsBps)} less
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="/dashboard"
              className="flex h-10 items-center rounded-field bg-paper px-4 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
              style={{ color: "var(--ink)" }}
            >
              Open the desk
            </a>
            <a
              href="/terminal?shock=-3000"
              className="flex h-10 items-center rounded-field border border-line-strong bg-surface px-4 text-[14px] text-muted transition-colors duration-100 hover:text-text"
            >
              Run the −30% replay
            </a>
          </div>
        </div>

        <ShockCompass className="rise justify-self-center" />
      </section>

      {/* ── One crash, two desks ───────────────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 pb-10 md:px-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* netted: the book that comes back */}
          <div className="lift rounded-panel border border-line bg-surface p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] text-muted">ZeroMargin book</p>
              <p className="font-mono text-[11px] tabular-nums text-dim">
                {formatShock(CRASH)} bps
              </p>
            </div>
            <p className="mt-4 font-mono text-[44px] font-medium leading-none tabular-nums text-up md:text-[52px]">
              {formatUsdcWhole(crash.remainingEquityUsdc)}
            </p>
            <p className="mt-2 text-[13px] text-muted">
              returned to the trader, no liquidation penalty inside the tested
              grid
            </p>
            <dl className="mt-5 border-t border-line pt-4">
              {waterfall.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 py-1.5"
                >
                  <dt className="text-[13px] text-dim">{row.label}</dt>
                  <dd className="font-mono text-[13px] tabular-nums text-text">
                    {formatSignedUsdc(row.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* isolated: the same book under standard margin practice */}
          <div className="lift rounded-panel border border-line bg-surface p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] text-muted">Isolated desk</p>
              <p className="font-mono text-[11px] tabular-nums text-dim">
                margin practice unchanged
              </p>
            </div>
            <p className="mt-4 font-mono text-[44px] font-medium leading-none tabular-nums text-down md:text-[52px]">
              {formatUsdcWhole(crashIsolated.returnedToTraderUsdc)}
            </p>
            <p className="mt-2 text-[13px] text-muted">
              returned to the trader, the account is liquidated at the same mark
            </p>
            <dl className="mt-5 border-t border-line pt-4">
              <div className="flex items-baseline justify-between gap-4 py-1.5">
                <dt className="text-[13px] text-dim">LP leg result</dt>
                <dd className="font-mono text-[13px] tabular-nums text-text">
                  {formatSignedUsdc(crashIsolated.lpPnlUsdc)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-1.5">
                <dt className="text-[13px] text-dim">Liquidation penalty</dt>
                <dd className="font-mono text-[13px] tabular-nums text-down">
                  −{formatUsdcWhole(crashIsolated.liquidationPenaltyUsdc)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <p className="mt-3 text-center text-[12px] text-dim">
          both sides carry the same {formatUsdcWhole(DEMO_BOOK.postedMarginUsdc)}{" "}
          of margin and meet the same {formatShock(CRASH)} bps mark
        </p>
      </section>

      {/* ── How the desk holds ─────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 pb-6 md:px-6">
        <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-3">
          {[
            {
              n: 1,
              t: "Net the legs",
              d: "The grid nets the hedge's worst-case gain against the LP's worst-case loss and charges the difference plus a 5% haircut on matched basis.",
              href: "/proof",
              link: "Read the vectors",
            },
            {
              n: 2,
              t: "Guard liquidity",
              d: "A Uniswap v4 hook re-runs the grid before any withdrawal and reverts with a breach error when collateral could leave underposted.",
              href: "/proof",
              link: "See the guard",
            },
            {
              n: 3,
              t: "Settle in one transaction",
              d: "The unwind pushes the short's gain into the same virtual balance that pays the LP deficit, so the quote is the execution.",
              href: "/terminal",
              link: "Open the terminal",
            },
          ].map((step) => (
            <div key={step.n} className="bg-surface p-6">
              <p className="font-mono text-[12px] text-dim">{step.n}</p>
              <h2 className="mt-3 text-[16px] font-medium">{step.t}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {step.d}
              </p>
              <a
                href={step.href}
                className="mt-4 inline-block text-[13px] text-saffron hover:underline"
              >
                {step.link}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 pb-16 pt-4 md:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-panel border border-line bg-surface px-6 py-7 md:flex-row md:items-center md:px-8">
          <div className="max-w-[52ch]">
            <h2 className="text-[17px] font-medium">
              Drag the crash yourself
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              The terminal quotes every shock line by line and settles the
              −30% replay in one transaction.
            </p>
          </div>
          <a
            href="/terminal"
            className="flex h-10 shrink-0 items-center rounded-field bg-paper px-5 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
            style={{ color: "var(--ink)" }}
          >
            Open the terminal
          </a>
        </div>
      </section>
    </div>
  );
}
