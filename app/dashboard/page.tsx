import { Panel } from "@/components/Panel";
import { CountUp } from "@/components/motion/CountUp";
import { StatusChip } from "@/components/Badge";
import { StressChart } from "@/components/dashboard/StressChart";
import { ScenarioGrid } from "@/components/desk/ScenarioGrid";
import {
  DEMO_BOOK,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  evaluateSpan16,
  isolatedAccountAtShock,
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
const crashIsolated = isolatedAccountAtShock(
  DEMO_ISOLATED_BOOK.lpNotionalUsdc,
  DEMO_ISOLATED_BOOK.postedMarginUsdc,
  -3_000n,
  DEMO_VOL_SHOCK_BPS,
);
const hedgeRatio = (DEMO_BOOK.shortNotionalUsdc * 10_000n) / DEMO_BOOK.lpNotionalUsdc;
const maintShare = (span.netMaintenanceMarginUsdc * 10_000n) / span.netInitialMarginUsdc;

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
            {formatUsdcWhole(DEMO_BOOK.lpNotionalUsdc)} v4 LP against a{" "}
            {formatUsdcWhole(DEMO_BOOK.shortNotionalUsdc)} short hedge, cross-margined on one grid.
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
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="lift rounded-panel border border-line bg-surface p-5">
          <p className="text-[12px] text-dim">Equity after settlement</p>
          <p className="mt-2 font-mono text-[22px] tabular-nums text-up">
            <CountUp final={crash.remainingEquityUsdc} variant="usdcWhole" />
          </p>
          <p className="mt-1 text-[11px] text-dim">−30% replay, {formatUsdcWhole(DEMO_BOOK.postedMarginUsdc)} posted</p>
        </div>
        <div className="lift rounded-panel border border-line bg-surface p-5">
          <p className="text-[12px] text-dim">Collateral unlocked</p>
          <p className="mt-2 font-mono text-[22px] tabular-nums text-saffron">
            <CountUp final={span.capitalSavingsBps} variant="percent" />
          </p>
          <p className="mt-1 text-[11px] text-dim">
            {formatUsdcWhole(span.isolatedInitialMarginUsdc)} → {formatUsdcWhole(span.netInitialMarginUsdc)}
          </p>
        </div>
        <div className="lift rounded-panel border border-line bg-surface p-5">
          <p className="text-[12px] text-dim">Book health</p>
          <p className="mt-2 font-mono text-[22px] tabular-nums">
            {formatPercentFromBps((crash.remainingEquityUsdc * 10_000n) / span.netInitialMarginUsdc, 0)}
          </p>
          <p className="mt-1 text-[11px] text-dim">equity ÷ net IM after settle</p>
        </div>
        <div className="lift rounded-panel border border-line bg-surface p-5">
          <p className="text-[12px] text-dim">Bad debt in envelope</p>
          <p className="mt-2 font-mono text-[22px] tabular-nums">
            {formatUsdcWhole(0n)}
          </p>
          <p className="mt-1 text-[11px] text-dim">shock grid spans −30% to +20%</p>
        </div>
      </div>

      {/* Chart + risk monitor */}
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel label="Equity under price stress">
          <StressChart />
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel label="Risk settings">
            <div className="flex flex-col gap-4 p-5 pt-4">
              <ROW label="Hedge ratio" value={formatPercentFromBps(hedgeRatio, 0)} pct={Number(hedgeRatio) / 10_000} />
              <ROW label="Maintenance share" value={formatPercentFromBps(maintShare, 0)} pct={Number(maintShare) / 10_000} />
              <ROW label="Basis haircut" value={formatUsdcWhole(span.basisHaircutUsdc)} pct={0.5} />
            </div>
          </Panel>
          <Panel label="16-scenario grid">
            <div className="p-5 pt-4">
              <ScenarioGrid values={span.scenarioNetPnlUsdc} />
              <p className="mt-3 text-[11px] text-dim">
                Net PnL per cell; the worst cell loses {formatUsdcWhole(span.worstScenarioLossUsdc)}.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      {/* Books + activity */}
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel label="Books">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-line">
                <th className="px-5 py-2.5 text-start text-[11px] font-normal text-dim">Book</th>
                <th className="px-3 py-2.5 text-end text-[11px] font-normal text-dim">LP notional</th>
                <th className="px-3 py-2.5 text-end text-[11px] font-normal text-dim">Hedge</th>
                <th className="px-3 py-2.5 text-end text-[11px] font-normal text-dim">Net IM</th>
                <th className="px-5 py-2.5 text-end text-[11px] font-normal text-dim">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[12px] tabular-nums">
              <tr className="border-b border-line last:border-0">
                <td className="px-5 py-3 text-start font-sans text-[13px] text-text">WETH/USDC v4, netted</td>
                <td className="px-3 py-3 text-end">{formatUsdcWhole(DEMO_BOOK.lpNotionalUsdc)}</td>
                <td className="px-3 py-3 text-end text-up">{formatUsdcWhole(DEMO_BOOK.shortNotionalUsdc)}</td>
                <td className="px-3 py-3 text-end">{formatUsdcWhole(span.netInitialMarginUsdc)}</td>
                <td className="px-5 py-3 text-end"><StatusChip tone="cobalt">settled</StatusChip></td>
              </tr>
              <tr className="last:border-0">
                <td className="px-5 py-3 text-start font-sans text-[13px] text-muted">WETH/USDC v4, isolated</td>
                <td className="px-3 py-3 text-end">{formatUsdcWhole(DEMO_ISOLATED_BOOK.lpNotionalUsdc)}</td>
                <td className="px-3 py-3 text-end text-dim">none</td>
                <td className="px-3 py-3 text-end">{formatUsdcWhole(DEMO_ISOLATED_BOOK.postedMarginUsdc)}</td>
                <td className="px-5 py-3 text-end"><StatusChip tone="down">liquidated</StatusChip></td>
              </tr>
            </tbody>
          </table>
        </Panel>

        <Panel label="Activity">
          <ol className="px-5 py-4">
            {[
              { event: "BookUnwound", at: "T−00:41", tone: "cobalt" as const, detail: `settled −3,000 bps, returned ${formatUsdcWhole(crash.remainingEquityUsdc)}` },
              { event: "SpanMarginBreach", at: "T−01:12", tone: "down" as const, detail: `withdrawal guard reverted, required ${formatUsdcWhole(span.netInitialMarginUsdc)}` },
              { event: "BookOpened", at: "T−02:18", tone: "up" as const, detail: `net IM ${formatUsdcWhole(span.netInitialMarginUsdc)}, savings ${formatBps(span.capitalSavingsBps)}` },
              { event: "KeeperSet", at: "T−02:19", tone: "muted" as const, detail: "unwind authorization scoped to the demo keeper" },
            ].map((ev) => (
              <li key={ev.event} className="border-b border-line last:border-0 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`text-[13px] ${toneClass(ev.tone)}`}>{ev.event}</span>
                  <span className="font-mono text-[11px] tabular-nums text-dim">{ev.at}</span>
                </div>
                <span className="mt-0.5 block font-mono text-[11px] text-dim">{ev.detail}</span>
              </li>
            ))}
          </ol>
          <div className="border-t border-line px-5 py-2.5 text-[11px] text-dim">
            Every amount is recomputed from the span engine at render.
          </div>
        </Panel>
      </div>
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

function ROW({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-muted">{label}</span>
        <span className="font-mono text-[12px] tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full rounded-full bg-saffron"
          style={{ width: `${Math.max(2, Math.min(100, pct * 100))}%` }}
        />
      </div>
    </div>
  );
}
