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
  ["Attestations", "/arkiv"],
];

const FAQ: Array<[string, string]> = [
  [
    "Where do the margin savings come from?",
    "The short hedge and the LP leg lose money in opposite directions, so the engine nets their worst-case losses instead of charging for each leg separately. On the 95%-hedged book the grid's worst case is $5,250 plus a $4,750 basis haircut, which is $10,000 where isolated margin would demand $147,500.",
  ],
  [
    "Is this a liquidation insurance product?",
    "No. It is a margin engine. Settlement nets a short gain against an LP loss in one transaction for shocks inside the tested range, and normal margin rules apply everywhere else. Basis, venue, smart-contract, and oracle risk remain.",
  ],
  [
    "Can I withdraw LP liquidity whenever I want?",
    "Yes, as long as the post-withdrawal book still holds its net initial margin. A Uniswap v4 hook evaluates every liquidity removal against the surviving book and reverts with SpanMarginBreach when a withdrawal would leave it under-collateralized.",
  ],
  [
    "What happens when the crash is worse than −30%?",
    "The tested envelope covers to −3,000 bps. Deeper shocks fall outside the grid, so the engine posts exactly the margin the grid requires rather than a fixed cushion. The golden vectors pin exact amounts, not ranges.",
  ],
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-8 px-4 md:px-8">
          <a href="/" className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-ring">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-[3px] bg-text text-background"
            >
              <span className="font-mono text-[13px] font-semibold leading-none">Z</span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">ZeroMargin</span>
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-5 md:flex">
            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-[13px] text-muted transition-colors duration-100 hover:text-text"
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href="/dashboard"
            className="ml-auto flex h-9 items-center rounded-field bg-paper px-4 text-[13px] font-medium text-background transition-colors duration-100 hover:bg-text"
          >
            Open the dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
        {/* ── Hero, left-set ───────────────────────────────── */}
        <section className="grid gap-10 pb-14 pt-14 md:pt-20 lg:grid-cols-[6fr_5fr] lg:gap-16">
          <div className="max-w-[62ch]">
            <h1 className="text-[36px] font-medium leading-[1.06] tracking-[-0.01em] md:text-[46px]">
              A flash crash is one
              transaction, not a liquidation.
            </h1>
            <p className="mt-5 max-w-[58ch] text-[16px] leading-[1.6] text-muted">
              ZeroMargin cross-margins a Uniswap v4 liquidity position against
              an offsetting short hedge inside one Aqua virtual balance. The
              worst case is netted on a 16-scenario grid, so the crash settles
              in a single transaction with no liquidation penalty and no
              floating-point surprises.
            </p>

            {/* The two-numeral settlement: the typographic moment */}
            <p className="mt-9 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[24px] font-medium tabular-nums tracking-tight md:text-[30px]">
              <span className="text-down line-through decoration-[1.5px] decoration-down/60">
                $147,500
              </span>
              <span className="text-[15px] text-dim">became</span>
              <span className="text-text">$10,000</span>
              <span className="text-[13px] text-dim">
                of locked collateral on GV-01 ({formatPercentFromBps(span.capitalSavingsBps)} less)
              </span>
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="/dashboard"
                className="flex h-10 items-center rounded-field bg-paper px-4 text-[14px] font-medium text-background transition-colors duration-100 hover:bg-text"
              >
                Open the dashboard
              </a>
              <a
                href="/terminal?shock=-3000"
                className="flex h-10 items-center rounded-field border border-rule-strong bg-surface px-4 text-[14px] text-muted transition-colors duration-100 hover:text-text"
              >
                Watch the −30% replay
              </a>
            </div>

            <dl className="mt-10 grid max-w-[580px] grid-cols-3 gap-6 border-t border-line pt-6">
              {[
                {
                  dt: "Settled equity at −30%",
                  dd: formatUsdcWhole(crash.remainingEquityUsdc),
                  note: "against null for the isolated desk",
                },
                {
                  dt: "Savings at an 80% hedge",
                  dd: formatPercentFromBps(span80.capitalSavingsBps),
                  note: "GV-02, net initial margin $13,750",
                },
                {
                  dt: "Bad debt in the envelope",
                  dd: "$0",
                  note: "16 scenarios, basis haircut 500 bps",
                },
              ].map((row) => (
                <div key={row.dt}>
                  <dt className="text-[12px] text-dim">{row.dt}</dt>
                  <dd className="mt-1.5 font-mono text-[17px] font-medium tabular-nums text-text">
                    {row.dd}
                  </dd>
                  <dd className="mt-1 text-[11px] leading-snug text-dim">{row.note}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The console inset: the one dark element on the page */}
          <div className="lg:pt-8">
            <HeroDemo />
          </div>
        </section>

        {/* ── Clause 1: how the engine works ─────────────────── */}
        <section className="border-t-2 border-text pb-16 pt-8">
          <div className="clause">
            <span className="clause-no" aria-hidden="true">§1</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] font-semibold tracking-tight">
                How the engine earns its margin cut
              </h2>
              <ol className="mt-6 max-w-[72ch]">
                {[
                  {
                    t: "Net the legs",
                    b: "Aqua holds the virtual balance. The app nets the grid's worst LP loss against the short gain and charges the difference plus a 500 bps basis haircut. Sixteen scenarios of pure BigInt arithmetic.",
                    link: ["The golden vectors", "/proof"],
                  },
                  {
                    t: "Guard the withdrawal",
                    b: "A Uniswap v4 hook at a mined address evaluates every liquidity removal against the surviving book, and reverts with SpanMarginBreach before the PoolManager can release collateral.",
                    link: ["The guard", "/proof"],
                  },
                  {
                    t: "Settle in one transaction",
                    b: "The unwind pushes the realized short gain into Aqua, pulls the netted amount plus margin from the same balance, and closes the book. Quote and execution share every branch by construction.",
                    link: ["Run the replay", "/terminal"],
                  },
                ].map((step, i, arr) => (
                  <li
                    key={step.t}
                    className={`grid gap-x-6 gap-y-1 py-5 md:grid-cols-[24px_1fr_auto] md:items-baseline ${
                      i < arr.length - 1 ? "border-b border-line" : ""
                    }`}
                  >
                    <span className="font-mono text-[12px] text-dim">{i + 1}.</span>
                    <span className="max-w-[56ch]">
                      <span className="text-[15px] font-medium">{step.t}</span>
                      <span className="mt-1 block text-[14px] leading-[1.6] text-muted">
                        {step.b}
                      </span>
                    </span>
                    <a
                      href={step.link[1]}
                      className="text-[13px] text-cobalt hover:underline"
                    >
                      {step.link[0]}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── Clause 2: the ledger, stated plain ─────────────── */}
        <section className="border-t-2 border-text pb-16 pt-8">
          <div className="clause">
            <span className="clause-no" aria-hidden="true">§2</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-[19px] font-semibold tracking-tight">
                  What the same crash pays out
                </h2>
                <span className="text-[12px] text-dim">
                  demo book: $100,000 LP hedged with a $95,000 short, $25,000 posted
                </span>
              </div>

              {/* Document table: printed ledger.
                  Both rows come from the engine at render time. */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b-2 border-text text-left">
                      {["Account", "Margin posted", "Loss at −30%", "Liquidation", "Returned"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={`px-3 pb-2 pt-1 text-[12px] font-medium text-dim ${i > 0 ? "text-right" : ""}`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="font-mono tabular-nums">
                    {[
                      {
                        name: "Isolated desk (unchanged margin practice)",
                        posted: formatUsdcWhole(DEMO_ISOLATED_BOOK.postedMarginUsdc),
                        loss: formatUsdcWhole(-crashIsolated.lpPnlUsdc),
                        pen: formatUsdcWhole(crashIsolated.liquidationPenaltyUsdc),
                        back: formatUsdcWhole(0n),
                        tone: "text-down",
                      },
                      {
                        name: "ZeroMargin book, hedged and netted",
                        posted: formatUsdcWhole(DEMO_BOOK.postedMarginUsdc),
                        loss: formatUsdcWhole(crash.lpLossUsdc),
                        pen: "none",
                        back: formatUsdcWhole(crash.remainingEquityUsdc),
                        tone: "text-up",
                      },
                    ].map((r) => (
                      <tr key={r.name} className="border-b border-line">
                        <td className="px-3 py-3 font-sans text-[13px] text-text">{r.name}</td>
                        <td className="px-3 py-3 text-right">{r.posted}</td>
                        <td className="px-3 py-3 text-right">{r.loss}</td>
                        <td className={`px-3 py-3 text-right ${r.tone}`}>{r.pen}</td>
                        <td className={`px-3 py-3 text-right ${r.tone}`}>{r.back}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[12px] text-dim">
                Every row above is computed from the same engine at render time;
                parity failure means the build breaks, not the display.
              </p>
            </div>
          </div>
        </section>

        {/* ── Clause 3: answers ─────────────────────────────── */}
        <section className="border-t-2 border-text pb-16 pt-8">
          <div className="clause">
            <span className="clause-no" aria-hidden="true">§3</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] font-semibold tracking-tight">
                Common questions
              </h2>
              <div className="mt-6">
                {FAQ.map(([q, a], i, arr) => (
                  <details
                    key={q}
                    className={`group ${i < arr.length - 1 ? "border-b border-line" : ""}`}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-[14px] font-medium text-text [&::-webkit-details-marker]:hidden">
                      {q}
                      <span
                        aria-hidden="true"
                        className="font-mono text-[14px] text-dim transition-transform duration-100 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-[64ch] pb-4 text-[13px] leading-[1.65] text-muted">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Closing band, the second dark tie-in ──────────── */}
        <section className="pb-20 pt-2">
          <div className="flex flex-col items-start justify-between gap-6 rounded-panel bg-text px-8 py-8 text-surface md:flex-row md:items-center md:px-10">
            <div className="max-w-[52ch]">
              <h2 className="text-[19px] font-semibold tracking-tight text-surface">
                Open the books and drag the crash yourself
              </h2>
              <p className="mt-2 text-[14px] leading-[1.6] text-surface/70">
                The dashboard replays every shock you care about, and the
                terminal settles them line by line.
              </p>
            </div>
            <a
              href="/dashboard"
              className="flex h-10 shrink-0 items-center rounded-field bg-surface px-5 text-[14px] font-medium text-text transition-colors duration-100 hover:bg-surface-raised"
            >
              Open the dashboard
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-baseline justify-between gap-2 px-4 py-6 md:px-8">
          <span className="text-[12px] text-dim">
            A hackathon prototype, not audited; the short leg settles against a
            pre-funded demo adapter.
          </span>
          <span className="font-mono text-[11px] tabular-nums text-dim">
            USDC base units (1e6 = $1.00)
          </span>
        </div>
      </footer>
    </div>
  );
}
