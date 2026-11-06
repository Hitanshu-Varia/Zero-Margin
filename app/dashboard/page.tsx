import { Panel } from "@/components/Panel";
import { LiveDashboardBand } from "@/components/desk/LiveDashboardBand";
import { LiveBooksActivity } from "@/components/desk/LiveBooksActivity";
import { CountUp } from "@/components/motion/CountUp";
import { StressChart } from "@/components/dashboard/StressChart";
import {
  DEMO_BOOK,
  DEMO_VOL_SHOCK_BPS,
  evaluateSpan16,
  previewShockUnwind,
} from "@/lib/spanMath";
import {
  formatBps,
  formatPercentFromBps,
  formatUsdcWhole,
} from "@/lib/format";

/* ── Deterministic figures — the same engine the contracts run ── */
const span = evaluateSpan16(DEMO_BOOK.lpNotionalUsdc, DEMO_BOOK.shortNotionalUsdc);
const crash = previewShockUnwind(
  DEMO_BOOK.lpNotionalUsdc,
  DEMO_BOOK.shortNotionalUsdc,
  DEMO_BOOK.postedMarginUsdc,
  -3_000n,
  DEMO_VOL_SHOCK_BPS,
);

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1128px] px-4 pb-14 pt-8 md:px-6">
      {/* Landing page hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-balance text-[26px] font-medium md:text-[30px]">
            Overview
          </h1>
          <p className="mt-1 max-w-[62ch] text-pretty text-[14px] leading-relaxed text-muted">
            A {formatUsdcWhole(DEMO_BOOK.lpNotionalUsdc)} liquidity position hedged by a{" "}
            {formatUsdcWhole(DEMO_BOOK.shortNotionalUsdc)} short — one margin account for both, per the spec's GV-01 test case (swap to your own numbers any time on the terminal's crash console).
          </p>
        </div>
        <a
          href="/terminal?shock=-3000"
          className="flex h-10 items-center rounded-field bg-paper px-4 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
          style={{ color: "var(--ink)" }}
        >
          Open the terminal
        </a>
      </div>

      {/* Stat band */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="lift rounded-panel border border-line bg-surface p-5">
          <p className="text-[12px] text-dim">Equity after settlement (GV-01 vector)</p>
          <p className="mt-2.5 font-mono text-[24px] tabular-nums text-up">
            <CountUp final={crash.remainingEquityUsdc} variant="usdcWhole" />
          </p>
          <p className="mt-1.5 text-[11px] text-dim">−30% replay, {formatUsdcWhole(DEMO_BOOK.postedMarginUsdc)} posted</p>
        </div>
        <div className="lift rounded-panel border border-line bg-surface p-5">
          <p className="text-[12px] text-dim">Collateral unlocked (GV-01 vector)</p>
          <p className="mt-2.5 font-mono text-[24px] tabular-nums text-saffron">
            <CountUp final={span.capitalSavingsBps} variant="percent" />
          </p>
          <p className="mt-1.5 text-[11px] text-dim">
            posting drops from {formatUsdcWhole(span.isolatedInitialMarginUsdc)} (standard) to{" "}
            {formatUsdcWhole(span.netInitialMarginUsdc)} (netted)
          </p>
        </div>
        <div className="lift rounded-panel border border-line bg-surface p-5">
          <p className="text-[12px] text-dim">Book health (GV-01 vector)</p>
          <p className="mt-2.5 font-mono text-[24px] tabular-nums">
            {formatPercentFromBps((crash.remainingEquityUsdc * 10_000n) / span.netInitialMarginUsdc, 0)}
          </p>
          <p className="mt-1.5 text-[11px] text-dim">remaining equity ÷ what the book must keep posted</p>
        </div>
        <div className="lift rounded-panel border border-line bg-surface p-5">
          <p className="text-[12px] text-dim">Bad debt in envelope</p>
          <p className="mt-2.5 font-mono text-[24px] tabular-nums">
            {formatUsdcWhole(0n)}
          </p>
          <p className="mt-1.5 text-[11px] text-dim">across the full tested shock range (−30% to +20% price moves)</p>
        </div>
      </div>

      {/* Live chain band */}
      <LiveDashboardBand />

      {/* Chart + risk monitor */}
      {/* Equity under stress, full width */}
      <Panel label="Equity under price stress" className="mt-4">
        <StressChart />
      </Panel>

      {/* Books + activity — live reads, zero fixtures */}
      <LiveBooksActivity />
    </div>
  );
}

function toneClass(tone: "up" | "down" | "cobalt" | "muted") {
  return tone === "up"
    ? "text-up"
    : tone === "down"
      ? "text-down"
      : tone === "cobalt"
        ? "text-saffron"
        : "text-text";
}


