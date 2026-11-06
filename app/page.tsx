import type { Metadata } from "next";
import {
  DEMO_BOOK,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  evaluateSpan16,
  isolatedAccountAtShock,
  previewShockUnwind,
} from "@/lib/spanMath";
import { RiskSurface } from "@/components/landing/RiskSurface";
import { BorderBeam } from "@/components/motion/BorderBeam";
import {
  formatPercentFromBps,
  formatUsdcWhole,
} from "@/lib/format";

export const metadata: Metadata = {
  title: {
    default: "ZeroMargin — the crash settles in one transaction",
    template: "%s — ZeroMargin",
  },
};

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

const links = [
  ["Dashboard", "/dashboard"],
  ["Terminal", "/terminal"],
  ["Replay", "/replay"],
  ["Proof", "/proof"],
];

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

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-8 px-4 md:px-8">
          <a href="/" className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-ring">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-[7px] bg-cobalt text-white"
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
            className="ml-auto flex h-9 items-center rounded-field bg-paper px-4 text-[13px] font-medium text-white transition-colors duration-100 hover:bg-cobalt/90"
          >
            Open the dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
        {/* ── Hero: the risk surface is the first screen ─────── */}
        <section className="grid gap-8 pb-12 pt-12 md:pt-16 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <h1 className="text-[34px] font-medium leading-[1.06] tracking-[-0.01em] md:text-[42px]">
              The crash settles in one transaction.
            </h1>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-[1.6] text-muted">
              A cross-margined book nets its hedge against its LP and survives
              the fall.
            </p>

            <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[20px] font-medium tabular-nums tracking-tight md:text-[24px]">
              <span className="text-down line-through decoration-[1.5px] decoration-down/60">
                $147,500
              </span>
              <span className="text-[13px] text-dim">became</span>
              <span className="text-text">$10,000</span>
            </p>
            <p className="mt-1.5 text-[12px] text-dim">
              locked collateral on GV-01, {formatPercentFromBps(span.capitalSavingsBps)} less
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="/dashboard"
                className="flex h-10 items-center rounded-field bg-paper px-4 text-[14px] font-medium text-white transition-colors duration-100 hover:bg-cobalt/90"
              >
                Open the dashboard
              </a>
              <a
                href="/terminal?shock=-3000"
                className="flex h-10 items-center rounded-field border border-line-strong bg-surface px-4 text-[14px] text-muted transition-colors duration-100 hover:text-text"
              >
                Watch the replay
              </a>
            </div>
          </div>

          {/* The signature: the product's own grid, drawn to scale */}
          <div className="min-w-0">
            <RiskSurface />
            <p className="mt-2 text-center text-[11px] text-dim">
              sixteen scenarios of the demo book, extruded by net PnL; the
              scanner sweeps on load and answers where you stop it
            </p>
          </div>
        </section>

        {/* ── The settlement receipt ──────────────────────────── */}
        <section className="border-t border-line pb-14 pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
              What the same crash pays out
            </h2>
            <span className="text-[12px] text-dim">
              demo book, $100,000 LP hedged with a $95,000 short, $25,000 posted
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b-2 border-line-strong text-left">
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
                    name: "Isolated desk, unchanged margin practice",
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
                    <td className="px-3 py-3 text-[13px] text-text">{r.name}</td>
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
            every row is computed from the engine at render time
          </p>
        </section>

        {/* ── The mechanism ──────────────────────────────────── */}
        <section className="border-t border-line pb-14 pt-10">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
            Three steps, one book
          </h2>
          <ol className="mt-6 max-w-[68ch]">
            {[
              {
                t: "Net the legs",
                b: "The grid nets the worst LP loss against the short gain and charges the difference plus a 500 bps basis haircut.",
                link: ["The golden vectors", "/proof"],
              },
              {
                t: "Guard the withdrawal",
                b: "A Uniswap v4 hook checks every liquidity removal against the surviving book and reverts before collateral can leave.",
                link: ["The guard", "/proof"],
              },
              {
                t: "Settle in one transaction",
                b: "The unwind pushes the short gain into Aqua, pulls the netted amount, and closes the book. Quote equals execution.",
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
                <span className="min-w-0 max-w-[52ch]">
                  <span className="text-[15px] font-medium">{step.t}</span>
                  <span className="mt-1 block text-[14px] leading-[1.6] text-muted">
                    {step.b}
                  </span>
                </span>
                <a href={step.link[1]} className="text-[13px] text-cobalt hover:underline">
                  {step.link[0]}
                </a>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Questions ──────────────────────────────────────── */}
        <section className="border-t border-line pb-14 pt-10">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
            Common questions
          </h2>
          <div className="mt-4">
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
                <p className="max-w-[62ch] pb-4 text-[13px] leading-[1.65] text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Closing band, the one framed object ────────────── */}
        <section className="pb-16">
          <BorderBeam duration={9}>
            <div className="flex flex-col items-start justify-between gap-5 rounded-panel border border-cobalt/30 bg-cobalt-dim px-8 py-7 md:flex-row md:items-center md:px-10">
              <div className="max-w-[48ch]">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
                  Open the books and drag the crash yourself
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-muted">
                  The terminal settles every shock line by line.
                </p>
              </div>
              <a
                href="/dashboard"
                className="flex h-10 shrink-0 items-center rounded-field bg-paper px-5 text-[14px] font-medium text-white transition-colors duration-100 hover:bg-cobalt/90"
              >
                Open the dashboard
              </a>
            </div>
          </BorderBeam>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-baseline justify-between gap-2 px-4 py-6 md:px-8">
          <span className="text-[12px] text-dim">
            A hackathon prototype, not audited; settle against the demo adapter.
          </span>
          <span className="font-mono text-[11px] tabular-nums text-dim">
            USDC base units (1e6 = $1.00)
          </span>
        </div>
      </footer>
    </div>
  );
}
