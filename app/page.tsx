import type { Metadata } from "next";
import {
  DEMO_BOOK,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  evaluateSpan16,
  isolatedAccountAtShock,
  previewShockUnwind,
} from "@/lib/spanMath";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { Num } from "@/components/Num";
import {
  formatPercentFromBps,
  formatUsdcWhole,
} from "@/lib/format";

export const metadata: Metadata = {
  title: {
    default: "ZeroMargin — settle the crash, keep the LP",
    template: "%s — ZeroMargin",
  },
};

const e6 = (n: number) => BigInt(n) * 1_000_000n;
const span = evaluateSpan16(DEMO_BOOK.lpNotionalUsdc, DEMO_BOOK.shortNotionalUsdc);
const crash = previewShockUnwind(
  DEMO_BOOK.lpNotionalUsdc,
  DEMO_BOOK.shortNotionalUsdc,
  DEMO_BOOK.postedMarginUsdc,
  -3_000n,
  DEMO_VOL_SHOCK_BPS,
);
const crashIsolated = isolatedAccountAtShock(
  DEMO_ISOLATED_BOOK.lpNotionalUsdc,
  DEMO_ISOLATED_BOOK.postedMarginUsdc,
  -3_000n,
  DEMO_VOL_SHOCK_BPS,
);
const span80 = evaluateSpan16(e6(100_000), e6(80_000));

const links = [
  ["Dashboard", "/dashboard"],
  ["Terminal", "/terminal"],
  ["Replay", "/replay"],
  ["Proof", "/proof"],
];

const FAQ: Array<[string, string]> = [
  [
    "Where do the margin savings come from?",
    "The short hedge and the LP leg lose money in opposite directions, so the engine nets their worst-case losses instead of charging you for each leg separately. On the $95,000-hedged book the grid's worst case is $5,250 plus a $4,750 basis haircut — $10,000 instead of $147,500 of isolated margin.",
  ],
  [
    "Is this a liquidation insurance product?",
    "No. It is a margin engine. Settlement nets a short gain against an LP loss in one transaction for shocks inside the tested range (−3,000 to 0 bps here, +2,000 bps on the grid); outside it, normal margin rules apply. Basis, venue, smart-contract, and oracle risk remain.",
  ],
  [
    "Can I withdraw LP liquidity whenever I want?",
    "Yes, as long as the post-withdrawal book still holds its net initial margin. A Uniswap v4 hook at a mined hook address evaluates the surviving book on every removal and reverts with SpanMarginBreach when the withdrawal would leave it under-collateralized.",
  ],
  [
    "What happens when the crash is worse than −30%?",
    "The grid covers to −3,000 bps. Deeper shocks fall outside the tested envelope, and the engine posts exactly the margin the grid requires rather than a fixed cushion. The golden vectors pin exact amounts, not ranges.",
  ],
];

export default function LandingPage() {
  return (
    <div className="ambient-glow">
      {/* ── Marketing nav ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-6 px-4 md:px-8">
          <a href="/" className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-ring">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-[8px] bg-gold text-background"
            >
              <span className="font-mono text-[14px] font-bold leading-none">Z</span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">ZeroMargin</span>
          </a>
          <nav aria-label="Marketing" className="hidden items-center gap-5 md:flex">
            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-[13px] text-muted transition-colors duration-120 hover:text-text"
              >
                {label}
              </a>
            ))}
            <a
              href="/arkiv"
              className="text-[13px] text-muted transition-colors duration-120 hover:text-text"
            >
              Attestations
            </a>
          </nav>
          <a
            href="/dashboard"
            className="ml-auto flex h-9 items-center rounded-field bg-paper px-4 text-[13px] font-medium text-background transition-transform duration-120 hover:-translate-y-px"
          >
            Open dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="pb-16 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mx-auto flex w-fit items-center gap-2 rounded-chip border border-line bg-surface px-3 py-1.5 text-[12px] text-muted">
              <span aria-hidden="true" className="pulse-dot h-[6px] w-[6px] rounded-full bg-up" />
              Golden vectors pinned to the base unit
            </p>
            <h1 className="mt-5 text-[38px] font-semibold leading-[1.08] tracking-tight md:text-[54px]">
              A flash crash is one transaction, not a{" "}
              <span className="gold-gradient">liquidation</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">
              ZeroMargin cross-margins a Uniswap v4 LP against an offsetting
              short hedge inside one 1inch Aqua virtual balance. The worst
              case is netted on a SPAN-style grid — $147,500 of isolated
              margin becomes $10,000 — and settlement pulls both legs home
              atomically with no liquidation penalty inside the envelope.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
              <a
                href="/dashboard"
                className="flex h-11 items-center rounded-field bg-paper px-5 text-[14px] font-medium text-background transition-transform duration-120 hover:-translate-y-px"
              >
                Open the dashboard
              </a>
              <a
                href="/terminal?shock=-3000"
                className="flex h-11 items-center rounded-field border border-line-strong bg-surface px-5 text-[14px] text-muted transition-colors duration-120 hover:text-text"
              >
                Watch the −30% replay →
              </a>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-4xl">
            <HeroDemo />
            <p className="mt-3 text-center font-mono text-[11px] text-dim">
              demo book: $100,000 LP · $95,000 short · $25,000 posted · the
              auto-play sweeps entry to −30% every few seconds
            </p>
          </div>
        </section>

        {/* ── Numbers strip ─────────────────────────────────── */}
        <section className="rule-t rule-b py-8">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {[
              {
                dt: "Margin cut on GV-01",
                dd: (
                  <>
                    <Num size="lg" tone="gold" className="block">{formatPercentFromBps(span.capitalSavingsBps)}</Num>
                    <span className="text-[12px] text-dim">$147,500 → $10,000</span>
                  </>
                ),
              },
              {
                dt: "Equity after −30% crash",
                dd: (
                  <>
                    <Num size="lg" tone="gold" className="block">{formatUsdcWhole(crash.remainingEquityUsdc)}</Num>
                    <span className="text-[12px] text-dim">
                      from ${formatUsdcWhole(crashIsolated.equityUsdc)} isolated · $50 fee
                    </span>
                  </>
                ),
              },
              {
                dt: "Savings at an 80% hedge",
                dd: (
                  <>
                    <Num size="lg" className="block">{formatPercentFromBps(span80.capitalSavingsBps)}</Num>
                    <span className="text-[12px] text-dim">GV-02 · net IM $13,750</span>
                  </>
                ),
              },
              {
                dt: "Bad debt in the envelope",
                dd: (
                  <>
                    <Num size="lg" tone="up" className="block">$0</Num>
                    <span className="text-[12px] text-dim">fuzz-tested, 16 scenarios · basis 500 bps</span>
                  </>
                ),
              },
            ].map((item, i) => (
              <div key={i} className={i > 0 ? "xl:border-l xl:border-line xl:pl-6" : ""}>
                <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-dim">
                  {item.dt}
                </dt>
                <dd className="mt-2 space-y-1">{item.dd}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── How it works ──────────────────────────────────── */}
        <section className="py-16 md:py-20">
          <h2 className="text-[24px] font-semibold tracking-tight">
            Three contracts, one book
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
            The risk grid is deterministic fixed-point math. The same code
            prices the margin on entry, guards the withdrawal, and settles
            the crash — quotes and execution share every branch.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Net the legs",
                body: "Aqua holds the virtual balance; the app nets the grid's worst LP loss against the short gain and charges the difference plus a 500 bps basis haircut. 16 scenarios, zero floats.",
                link: ["See the math", "/proof"],
              },
              {
                step: "02",
                title: "Guard the withdrawal",
                body: "A mined-address v4 hook evaluates every liquidity removal against the surviving book and reverts SpanMarginBreach before the PoolManager can release collateral.",
                link: ["See the guard", "/proof"],
              },
              {
                step: "03",
                title: "Settle in one transaction",
                body: "unwind() pushes the realized short gain into Aqua, pulls the netted plus margin from the same balance, and closes the book — quote equals execution, by construction.",
                link: ["Run the replay", "/terminal"],
              },
            ].map((card) => (
              <article
                key={card.step}
                className="group rounded-panel border border-line bg-surface p-6 transition-colors duration-120 hover:border-line-strong"
              >
                <p className="font-mono text-[11px] tracking-[0.14em] text-gold">{card.step}</p>
                <h3 className="mt-3 text-[17px] font-semibold">{card.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{card.body}</p>
                <a
                  href={card.link[1]}
                  className="mt-4 inline-block text-[13px] text-dim transition-colors duration-120 group-hover:text-gold"
                >
                  {card.link[0]} →
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* ── The ledger of a crash ─────────────────────────── */}
        <section className="pb-16 md:pb-20">
          <div className="grid gap-3 overflow-hidden rounded-panel border border-line bg-surface md:grid-cols-[5fr_6fr]">
            <div className="p-8 md:p-10">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-dim">
                The ledger of the crash
              </p>
              <h2 className="mt-3 text-[24px] font-semibold leading-snug tracking-tight">
                The isolated desk loses its whole margin.
                <br />
                The hedged book keeps{" "}
                <span className="gold-gradient">$19,700</span>.
              </h2>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted">
                Same crash, same book, same block. The isolated account pays a
                10% penalty and returns zero. ZeroMargin nets{" "}
                {formatUsdcWhole(crash.nettedOffsetUsdc)} of short gain against{" "}
                {formatUsdcWhole(crash.lpLossUsdc)} of LP loss, pays the{" "}
                {formatUsdcWhole(crash.protocolFeeUsdc)} fee, and settles in
                one transaction with bad debt at $0.
              </p>
              <a
                href="/terminal?shock=-3000"
                className="mt-6 inline-flex h-10 items-center rounded-field border border-line-strong bg-surface-raised px-4 text-[13px] text-muted transition-colors duration-120 hover:text-text"
              >
                Inspect every line →
              </a>
            </div>
            <div className="flex items-end">
              {/* crash ledger bars */}
              <div className="flex w-full items-end gap-6 px-6 pb-8">
                <BarPair
                  label="Isolated"
                  values={[
                    { h: 100, cls: "bg-line-strong", tag: formatUsdcWhole(DEMO_ISOLATED_BOOK.postedMarginUsdc) },
                    { h: 4, cls: "bg-down", tag: formatUsdcWhole(0n) },
                  ]}
                />
                <BarPair
                  label="ZeroMargin"
                  values={[
                    { h: 100, cls: "bg-line-strong", tag: formatUsdcWhole(DEMO_BOOK.postedMarginUsdc) },
                    {
                      h: 79,
                      cls: "bg-gold",
                      tag: formatUsdcWhole(crash.remainingEquityUsdc),
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────── */}
        <section className="pb-20">
          <h2 className="text-[24px] font-semibold tracking-tight">Questions, answered exactly</h2>
          <div className="mt-6 space-y-2.5">
            {FAQ.map(([q, a]) => (
              <details
                key={q}
                className="group rounded-panel border border-line bg-surface open:border-line-strong"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[14px] font-medium text-text [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden="true"
                    className="font-mono text-[13px] text-dim transition-transform duration-120 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────── */}
        <section className="pb-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-panel border border-gold-dim bg-gold-dim/20 p-8 md:flex-row md:items-center md:p-10">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight">
                Open the books and drag the crash yourself
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
                Every figure runs from the committed engine. Drag, replay,
                verify the vectors, then read the limits.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="/dashboard"
                className="flex h-11 items-center rounded-field bg-paper px-5 text-[14px] font-medium text-background transition-transform duration-120 hover:-translate-y-px"
              >
                Open the dashboard
              </a>
              <a
                href="/proof"
                className="flex h-11 items-center rounded-field border border-line-strong bg-surface px-5 text-[14px] text-muted transition-colors duration-120 hover:text-text"
              >
                Read the limits
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 md:px-8">
          <span className="font-mono text-[11px] text-dim">
            ZeroMargin · hackathon prototype · not audited · demo hedge adapter
          </span>
          <span className="ml-auto font-mono text-[11px] text-dim">
            USDC base units · 1e6 = $1.00
          </span>
        </div>
      </footer>
    </div>
  );
}

function BarPair({
  label,
  values,
}: {
  label: string;
  values: Array<{ h: number; cls: string; tag: string }>;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="flex h-44 w-full items-end justify-center gap-2">
        {values.map((bar, i) => (
          <div key={i} className="flex h-full w-10 flex-col items-center justify-end gap-1.5 md:w-14">
            <span className="font-mono text-[10px] tabular-nums text-dim">{bar.tag}</span>
            <div
              aria-hidden="true"
              className={`w-full rounded-t-[6px] ${bar.cls}`}
              style={{ height: `${bar.h}%` }}
            />
          </div>
        ))}
      </div>
      <p className="text-[12px] font-medium text-muted">{label}</p>
    </div>
  );
}
