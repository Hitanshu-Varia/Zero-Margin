"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEMO_BOOK,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  PRICE_SHOCKS_BPS,
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
import { CountUp } from "@/components/motion/CountUp";
import { RevealOnView } from "@/components/motion/RevealOnView";

const span = evaluateSpan16(DEMO_BOOK.lpNotionalUsdc, DEMO_BOOK.shortNotionalUsdc);

/* The crash the demo replays everywhere. */
const CRASH = -3_000n;
const crash = previewShockUnwind(
  DEMO_BOOK.lpNotionalUsdc,
  DEMO_BOOK.shortNotionalUsdc,
  DEMO_BOOK.postedMarginUsdc,
  CRASH,
  DEMO_VOL_SHOCK_BPS,
);
const crashIsolated = isolatedAccountAtShock(
  DEMO_ISOLATED_BOOK.lpNotionalUsdc,
  DEMO_ISOLATED_BOOK.postedMarginUsdc,
  CRASH,
  DEMO_VOL_SHOCK_BPS,
);

/* The eight shocks, quoted live for the ticker. */
const TICKER = PRICE_SHOCKS_BPS.map((shock) => {
  const q = previewShockUnwind(
    DEMO_BOOK.lpNotionalUsdc,
    DEMO_BOOK.shortNotionalUsdc,
    DEMO_BOOK.postedMarginUsdc,
    shock,
    DEMO_VOL_SHOCK_BPS,
  );
  return `${formatShock(shock)} bps settles for ${formatUsdcWhole(q.remainingEquityUsdc)}`;
});

const FAQ: Array<[string, string]> = [
  [
    "Where do the margin savings come from?",
    "The two legs lose money in opposite directions, so the grid nets their worst cases instead of charging for each alone. On the 95%-hedged book that is $10,000 where isolated margin wants $147,500.",
  ],
  [
    "Can I withdraw LP liquidity whenever I want?",
    "Yes, while the surviving book holds its net initial margin. A Uniswap v4 hook checks every removal and reverts with SpanMarginBreach before collateral can leave under-collateralized.",
  ],
  [
    "What happens beyond a −30% crash?",
    "The tested envelope ends at −3,000 bps. Deeper shocks fall outside the grid, so the engine posts exactly what the grid requires rather than a fixed cushion. The golden vectors pin exact amounts.",
  ],
];

const STEPS = [
  {
    n: "01",
    t: "Net the legs",
    d: "The grid nets the hedge's worst-case gain against the LP's worst-case loss and charges the difference plus a haircut on matched basis.",
    href: "/proof",
    link: "Read the vectors",
  },
  {
    n: "02",
    t: "Guard liquidity",
    d: "A Uniswap v4 hook re-runs the grid before any withdrawal and reverts with a breach error when collateral could leave underposted.",
    href: "/proof",
    link: "See the guard",
  },
  {
    n: "03",
    t: "Settle atomically",
    d: "The unwind pushes the short's gain into the same virtual balance that pays the LP deficit, so the quote is the execution.",
    href: "/terminal",
    link: "Open the terminal",
  },
];

const waterfall = [
  { label: "LP loss", value: crash.lpLossUsdc },
  { label: "Short gain, netted", value: -crash.nettedOffsetUsdc },
  { label: "Unwind fee", value: -crash.protocolFeeUsdc },
];

export function LandingStage() {
  const page = useRef<HTMLDivElement>(null);
  const [moving, setMoving] = useState(true);

  useEffect(() => {
    const node = page.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setMoving(entry.isIntersecting),
      { threshold: 0.02 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={page}>
      {/* ── Statement hero ────────────────────────────────── */}
      <section className="drift-field relative overflow-clip">
        <div className="mx-auto w-full max-w-[1128px] px-4 pb-12 pt-16 md:px-6 md:pb-16 md:pt-24">
          <div className="rise max-w-[760px]">
            <h1 className="text-balance text-[36px] font-medium leading-[1.04] md:text-[60px]">
              The crash settles in one transaction.
            </h1>
            <p className="mt-5 max-w-[58ch] text-pretty text-[15px] leading-relaxed text-muted md:text-[17px]">
              ZeroMargin cross-margins a Uniswap v4 LP with its offsetting
              short hedge on one SPAN-style grid, so the same book posts a
              fraction of the collateral and rides out the shock intact.
            </p>

            <p className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[26px] font-medium tabular-nums md:text-[32px]">
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

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="/dashboard"
                className="flex h-11 items-center rounded-field bg-paper px-5 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
                style={{ color: "var(--ink)" }}
              >
                Open the desk
              </a>
              <a
                href="/terminal?shock=-3000"
                className="flex h-11 items-center rounded-field border border-line-strong bg-surface px-5 text-[14px] text-muted transition-colors duration-100 hover:text-text"
              >
                Run the −30% replay
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live settlement ticker ────────────────────────── */}
      <section className="border-y border-line bg-surface/60">
        <div
          className={cn(
            "overflow-hidden py-3",
            !moving && "marquee-paused",
          )}
          aria-hidden="true"
        >
          <div className="marquee">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center gap-3 pe-3">
                {TICKER.map((line, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-[12px] tabular-nums text-muted"
                  >
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-saffron" />
                    {line}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The result, in four figures ───────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RevealOnView>
            <div className="lift h-full rounded-panel border border-line bg-surface p-6">
              <p className="text-[12px] text-dim">Returned after −30%</p>
              <p className="mt-3 font-mono text-[30px] tabular-nums text-up md:text-[34px]">
                <CountUp final={crash.remainingEquityUsdc} />
              </p>
              <p className="mt-2 text-[12px] text-dim">
                of {formatUsdcWhole(DEMO_BOOK.postedMarginUsdc)} posted, no penalty
              </p>
            </div>
          </RevealOnView>
          <RevealOnView delay={70}>
            <div className="lift h-full rounded-panel border border-line bg-surface p-6">
              <p className="text-[12px] text-dim">Liquidation penalty in the same crash</p>
              <p className="mt-3 font-mono text-[30px] tabular-nums text-down md:text-[34px]">
                <CountUp final={crashIsolated.liquidationPenaltyUsdc} />
              </p>
              <p className="mt-2 text-[12px] text-dim">
                charged to the isolated desk, which returns{" "}
                {formatUsdcWhole(crashIsolated.returnedToTraderUsdc)}
              </p>
            </div>
          </RevealOnView>
          <RevealOnView delay={140}>
            <div className="lift h-full rounded-panel border border-line bg-surface p-6">
              <p className="text-[12px] text-dim">Initial margin required</p>
              <p className="mt-3 font-mono text-[30px] tabular-nums text-[var(--saffron)] md:text-[34px]">
                <CountUp final={span.netInitialMarginUsdc} />
              </p>
              <p className="mt-2 text-[12px] text-dim">
                where isolated margin wants{" "}
                {formatUsdcWhole(span.isolatedInitialMarginUsdc)}
              </p>
            </div>
          </RevealOnView>
          <RevealOnView delay={210}>
            <div className="lift h-full rounded-panel border border-line bg-surface p-6">
              <p className="text-[12px] text-dim">Bad debt across the grid</p>
              <p className="mt-3 font-mono text-[30px] tabular-nums md:text-[34px]">
                {formatUsdcWhole(0n)}
              </p>
              <p className="mt-2 text-[12px] text-dim">
                shocks from −3,000 to +2,000 bps
              </p>
            </div>
          </RevealOnView>
        </div>
      </section>

      {/* ── How the desk holds ────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 pb-6 md:px-6">
        <RevealOnView>
          <h2 className="text-center text-balance text-[24px] font-medium md:text-[30px]">
            One grid watches the book from open to settlement.
          </h2>
        </RevealOnView>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <RevealOnView key={step.n} delay={i * 80}>
              <div className="lift flex h-full flex-col rounded-panel border border-line bg-surface p-6">
                <p className="font-mono text-[12px] text-dim">{step.n}</p>
                <h3 className="mt-4 text-[17px] font-medium">{step.t}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">
                  {step.d}
                </p>
                <a
                  href={step.href}
                  className="mt-5 inline-flex w-fit items-center text-[13px] text-saffron hover:underline"
                >
                  {step.link}
                </a>
              </div>
            </RevealOnView>
          ))}
        </div>
      </section>

      {/* ── One crash, two desks ──────────────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 py-12 md:px-6 md:py-16">
        <RevealOnView>
          <h2 className="text-balance text-[24px] font-medium md:text-[30px]">
            The same crash, the same margin, two outcomes.
          </h2>
          <p className="mt-2 max-w-[60ch] text-pretty text-[14px] text-muted">
            {formatUsdcWhole(DEMO_BOOK.postedMarginUsdc)} posted on both sides.
            The only difference is the netting.
          </p>
        </RevealOnView>

        <div className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <RevealOnView>
            <div className="lift h-full rounded-panel border border-line bg-surface p-6 md:p-7">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] text-muted">ZeroMargin book</p>
                <p className="font-mono text-[11px] tabular-nums text-dim">
                  {formatShock(CRASH)} bps
                </p>
              </div>
              <p className="mt-4 font-mono text-[44px] font-medium leading-none tabular-nums text-up md:text-[54px]">
                {formatUsdcWhole(crash.remainingEquityUsdc)}
              </p>
              <p className="mt-2 text-[13px] text-muted">
                returned to the trader, no liquidation penalty inside the tested grid
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
          </RevealOnView>

          <RevealOnView delay={90}>
            <div className="lift h-full rounded-panel border border-line bg-surface p-6 md:p-7">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] text-muted">Isolated desk</p>
                <p className="font-mono text-[11px] tabular-nums text-dim">
                  margin practice unchanged
                </p>
              </div>
              <p className="mt-4 font-mono text-[44px] font-medium leading-none tabular-nums text-down md:text-[54px]">
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
          </RevealOnView>
        </div>
      </section>

      {/* ── Questions ─────────────────────────────────────── */}
      <section className="mx-auto grid w-full max-w-[1128px] gap-8 px-4 pb-12 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:px-6">
        <RevealOnView>
          <h2 className="text-balance text-[24px] font-medium md:text-[30px]">
            Got questions? The grid has answers.
          </h2>
        </RevealOnView>
        <RevealOnView delay={80}>
          <div>
            {FAQ.map(([q, a], i, arr) => (
              <details
                key={q}
                className={`group ${i < arr.length - 1 ? "border-b border-line" : ""}`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-text [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden="true"
                    className="font-mono text-[15px] text-dim transition-transform duration-100 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-4 text-pretty text-[13px] leading-relaxed text-muted">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </RevealOnView>
      </section>

      {/* ── Closing ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 pb-16 md:px-6">
        <RevealOnView>
          <div className="flex flex-col items-start justify-between gap-6 rounded-panel border border-saffron/40 bg-saffron-dim px-6 py-8 md:flex-row md:items-center md:px-9">
            <div className="max-w-[48ch]">
              <h2 className="text-[20px] font-medium md:text-[24px]">
                Settle the −30% crash in one transaction.
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                The terminal quotes every shock line by line and proves the
                golden vectors.
              </p>
            </div>
            <a
              href="/terminal"
              className="flex h-11 shrink-0 items-center rounded-field bg-paper px-6 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
              style={{ color: "var(--ink)" }}
            >
              Open the terminal
            </a>
          </div>
        </RevealOnView>
      </section>
    </div>
  );
}
