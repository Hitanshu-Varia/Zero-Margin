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
import {
  HeroPlate,
  PlateReturn,
  PlatePenalty,
  PlateTwoStacks,
  PlateVault,
} from "@/components/desk/Plates";

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
    "Where does the margin saving come from?",
    "It comes entirely from netting. The LP loses money when the price moves; the short hedge makes money in the same moves. Instead of charging each account for its own worst case, the grid charges the portfolio for the worst case of the pair, plus a haircut on matched basis. On the 95%-hedged demo book that is $10,000 of initial margin instead of $147,500.",
  ],
  [
    "Can I withdraw my LP liquidity at any time?",
    "Yes, as long as the book can still pay its worst case. A Uniswap v4 hook re-runs the grid from the block's actual state before every removal, and reverts with SpanMarginBreach if the withdrawal would leave the book underposted. No keeper or manual review is needed.",
  ],
  [
    "What happens in deeper crashes than −30%?",
    "The tested grid ends at −3,000 bps. Inside the grid the engine posts exactly what the scenarios require. Deeper shocks are outside the tested envelope, so we make no claim about them; the golden vectors on the proof page pin the exact amounts.",
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

const FIGURES = [
  {
    Plate: PlateReturn,
    label: "Returned after −30%",
    caption: "of $25,000 posted, on the netted book",
    value: () => crash.remainingEquityUsdc,
    tone: "text-up",
  },
  {
    Plate: PlatePenalty,
    label: "Penalty in the same crash",
    caption: "charged to the isolated desk",
    value: () => crashIsolated.liquidationPenaltyUsdc,
    tone: "text-down",
  },
  {
    Plate: PlateTwoStacks,
    label: "Initial margin required",
    caption: "netted, where isolated wants $147,500",
    value: () => span.netInitialMarginUsdc,
    tone: "text-saffron",
  },
  {
    Plate: PlateVault,
    label: "Bad debt across the grid",
    caption: "shocks from −3,000 to +2,000 bps",
    value: () => 0n,
    tone: "",
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
      {/* ── Statement + product visual ────────────────────── */}
      <section className="mx-auto grid w-full max-w-[1128px] items-center gap-10 px-4 pb-12 pt-12 md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:gap-8 md:px-6 md:pb-16 md:pt-20">
        <div className="rise min-w-0">
          <h1 className="text-balance text-[36px] font-medium leading-[1.05] md:text-[52px]">
            The crash settles in one transaction.
          </h1>
          <p className="mt-5 max-w-[54ch] text-pretty text-[15px] leading-relaxed text-muted md:text-[16px]">
            ZeroMargin cross-margins a Uniswap v4 LP with its offsetting short
            hedge on one SPAN-style grid, so the same book posts a fraction of
            the collateral and rides out the shock intact.
          </p>

          <p className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[26px] font-medium tabular-nums md:text-[30px]">
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
              className="flex h-11 items-center rounded-full bg-paper px-6 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
              style={{ color: "var(--ink)" }}
            >
              Open the desk
            </a>
            <a
              href="/terminal?shock=-3000"
              className="flex h-11 items-center rounded-full border border-line-strong bg-surface px-6 text-[14px] text-muted transition-colors duration-100 hover:text-text"
            >
              Run the −30% replay
            </a>
          </div>
        </div>

        {/* the product, drawn */}
        <RevealOnView delay={120}>
          <figure className="rounded-panel border border-line bg-surface p-4 md:p-6">
            <HeroPlate className="h-auto w-full" />
            <figcaption className="mt-3 text-center text-[12px] text-dim">
              both legs arrive in one netted vault, and the crash is paid from
              the balance between them
            </figcaption>
          </figure>
        </RevealOnView>
      </section>

      {/* ── Live settlement ticker ────────────────────────── */}
      <section className="border-y border-line bg-surface/60">
        <div className={cn("overflow-hidden py-3", !moving && "marquee-paused")}>
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

      {/* ── The result, four drawn figures ────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {FIGURES.map(({ Plate, label, caption, value, tone }, i) => (
            <RevealOnView key={label} delay={i * 80}>
              <div className="lift h-full overflow-hidden rounded-panel border border-line bg-surface">
                <div className="bg-background/40">
                  <Plate className="mx-auto h-auto w-full max-w-[300px]" />
                </div>
                <div className="p-6">
                  <p className="text-[13px] font-medium">{label}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-dim">{caption}</p>
                  <p className={`mt-4 font-mono text-[22px] font-medium tabular-nums ${tone}`}>
                    <CountUp final={value()} />
                  </p>
                </div>
              </div>
            </RevealOnView>
          ))}
        </div>
      </section>

      {/* ── How the desk holds ────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 pb-6 md:px-6">
        <RevealOnView>
          <h2 className="text-center text-balance text-[26px] font-medium md:text-[32px]">
            One grid watches the book from open to settlement.
          </h2>
        </RevealOnView>
        <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <RevealOnView key={step.n} delay={i * 80}>
              <div className="lift flex h-full flex-col rounded-panel border border-line bg-surface p-7">
                <p className="font-mono text-[12px] text-dim">{step.n}</p>
                <h3 className="mt-4 text-[17px] font-medium">{step.t}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">
                  {step.d}
                </p>
                <a
                  href={step.href}
                  className="mt-6 inline-flex w-fit items-center text-[13px] text-saffron hover:underline"
                >
                  {step.link}
                </a>
              </div>
            </RevealOnView>
          ))}
        </div>
      </section>

      {/* ── One crash, two desks ──────────────────────────── */}
      <section className="mx-auto w-full max-w-[1128px] px-4 py-16 md:px-6 md:py-24">
        <RevealOnView>
          <h2 className="text-balance text-[26px] font-medium md:text-[32px]">
            The same crash, the same margin, two outcomes.
          </h2>
          <p className="mt-2 max-w-[60ch] text-pretty text-[14px] text-muted">
            {formatUsdcWhole(DEMO_BOOK.postedMarginUsdc)} posted on both sides.
            The only difference is the netting.
          </p>
        </RevealOnView>

        <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-8">
          <RevealOnView>
            <div className="lift h-full rounded-panel border border-line bg-surface p-6 md:p-8">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] text-muted">ZeroMargin book</p>
                <p className="font-mono text-[11px] tabular-nums text-dim">
                  {formatShock(CRASH)} bps
                </p>
              </div>
              <p className="mt-4 font-mono text-[44px] font-medium leading-none tabular-nums text-up md:text-[56px]">
                {formatUsdcWhole(crash.remainingEquityUsdc)}
              </p>
              <p className="mt-2 text-[13px] text-muted">
                returned to the trader, no liquidation penalty inside the tested grid
              </p>
              <dl className="mt-6 border-t border-line pt-5">
                {waterfall.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 py-2"
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
            <div className="lift h-full rounded-panel border border-line bg-surface p-6 md:p-8">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] text-muted">Isolated desk</p>
                <p className="font-mono text-[11px] tabular-nums text-dim">
                  margin practice unchanged
                </p>
              </div>
              <p className="mt-4 font-mono text-[44px] font-medium leading-none tabular-nums text-down md:text-[56px]">
                {formatUsdcWhole(crashIsolated.returnedToTraderUsdc)}
              </p>
              <p className="mt-2 text-[13px] text-muted">
                returned to the trader, the account is liquidated at the same mark
              </p>
              <dl className="mt-6 border-t border-line pt-5">
                <div className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="text-[13px] text-dim">LP leg result</dt>
                  <dd className="font-mono text-[13px] tabular-nums text-text">
                    {formatSignedUsdc(crashIsolated.lpPnlUsdc)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2">
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
      <section className="mx-auto w-full max-w-[820px] px-4 pb-16 md:px-6">
        <RevealOnView>
          <h2 className="text-center text-balance text-[26px] font-medium md:text-[32px]">
            Frequently asked questions
          </h2>
        </RevealOnView>
        <RevealOnView delay={80}>
          <div className="mt-10 overflow-hidden rounded-panel border border-line bg-surface">
            {FAQ.map(([q, a], i, arr) => (
              <details
                key={q}
                className={`group ${i < arr.length - 1 ? "border-b border-line" : ""}`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-[15px] font-medium text-text transition-colors duration-100 hover:bg-surface-raised/50 md:px-8 [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-line font-mono text-[14px] leading-none text-dim transition-transform duration-150 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[68ch] px-6 pb-6 text-pretty text-[14px] leading-relaxed text-muted md:px-8 md:pe-24">
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
              className="flex h-11 shrink-0 items-center rounded-full bg-paper px-6 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
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
