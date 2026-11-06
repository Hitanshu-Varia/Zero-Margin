import type { Metadata } from "next";
import { Num } from "@/components/Num";
import { Panel, Stat, KpiCard } from "@/components/Panel";
import { StatusChip } from "@/components/Badge";
import { StressChart } from "@/components/dashboard/StressChart";
import {
  DEMO_BOOK,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  evaluateSpan16,
  isolatedAccountAtShock,
  previewShockUnwind,
} from "@/lib/spanMath";
import { computeBasisStats, BASIS_ROWS } from "@/lib/replayData";
import {
  formatUsdc,
  formatUsdcWhole,
  formatUsdcCompact,
  formatPercentFromBps,
  formatBps,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

const e6 = (n: number) => BigInt(n) * 1_000_000n;

/* ── Deterministic figures for the overview ─────────────────── */
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
const basisStats = computeBasisStats(BASIS_ROWS);

/** Events derived from the engine, newest first. */
const EVENTS: Array<{ event: string; detail: string; ts: string; tone: "up" | "down" | "cobalt" | "muted" }> = [
  {
    event: "BookUnwound",
    detail: `settled ±0 liquidation at −3,000 bps · equity ${formatUsdcWhole(crash.remainingEquityUsdc)}`,
    ts: "T−00:41",
    tone: "cobalt",
  },
  {
    event: "MarginAdded",
    detail: `$5,000 pushed to the Aqua strategy · posted ${formatUsdcWhole(e6(25))}`,
    ts: "T−02:17",
    tone: "muted",
  },
  {
    event: "BookOpened",
    detail: `net IM ${formatUsdcWhole(span.netInitialMarginUsdc)} · savings ${formatBps(span.capitalSavingsBps)}`,
    ts: "T−02:18",
    tone: "up",
  },
  {
    event: "KeeperSet",
    detail: "keep-watch authorized for unwind calls only",
    ts: "T−02:19",
    tone: "muted",
  },
];

export default function DashboardPage() {
  const hedgeRatio = (DEMO_BOOK.shortNotionalUsdc * 10_000n) / DEMO_BOOK.lpNotionalUsdc;
  const maintShare = (span.netMaintenanceMarginUsdc * 10_000n) / span.netInitialMarginUsdc;
  const haircutCoversWorst = basisStats.maxBps < 500;

  return (
    <div className="ambient-glow">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-14 pt-7 md:px-6">
        {/* Page head */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[12px] text-dim">
              At a glance
            </p>
            <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight">
              <span className="cobalt-lead">One virtual balance</span>, both legs
              settled
            </h1>
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-muted">
              The demo book: a $100,000 WETH/USDC v4 LP hedged with a $95,000
              short, cross-margined by the 16-scenario grid.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href="/terminal?shock=-3000"
              className="flex h-10 items-center gap-2 rounded-field bg-paper px-4 text-[14px] font-medium text-background transition-transform duration-120 hover:-translate-y-px"
            >
              Replay the −30% crash
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 2.5v11M3.5 9L8 13.5 12.5 9" />
              </svg>
            </a>
            <a
              href="/proof"
              className="flex h-10 items-center rounded-field border border-line-strong bg-surface px-4 text-[14px] text-muted transition-colors duration-120 hover:text-text"
            >
              Proof
            </a>
          </div>
        </div>

        {/* KPI rail */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Book equity — settled"
            value={<span className="cobalt-lead">{formatUsdc(crash.remainingEquityUsdc)}</span>}
            caption={
              <span className="text-dim">
                −30% replay · no liquidation penalty
              </span>
            }
          />
          <KpiCard
            label="Collateral unlocked"
            value={formatPercentFromBps(span.capitalSavingsBps)}
            valueClass="text-cobalt"
            caption={
              <span className="text-dim">
                from {formatUsdcWhole(span.isolatedInitialMarginUsdc)} down to {formatUsdcWhole(span.netInitialMarginUsdc)} on GV-01
              </span>
            }
          />
          <KpiCard
            label="Net initial margin"
            value={formatUsdcWhole(span.netInitialMarginUsdc)}
            caption={
              <span className="text-dim">
                maintenance {formatUsdcWhole(span.netMaintenanceMarginUsdc)} · worst case + haircut
              </span>
            }
          />
          <KpiCard
            label="Bad debt in envelope"
            value={formatUsdcWhole(0n)}
            valueClass="text-up"
            caption={
              <span className="text-dim">
                shocks [−3,000, +2,000] bps · hedged 80–100%
              </span>
            }
          />
        </div>

        {/* Chart + risk monitor */}
        <div className="mt-3 grid gap-3 xl:grid-cols-[8fr_4fr]">
          <Panel
            label="Equity under price stress"
            accent
            meta={
              <span className="font-mono text-[11px]">
                sweep +2,000 → −3,000 bps · ν 150
              </span>
            }
          >
            <StressChart />
          </Panel>

          <Panel label="Risk monitor">
            <div className="px-5 py-2">
              <Gauge
                label="Margin ratio at settlement"
                displayText={formatPercentFromBps((crash.remainingEquityUsdc * 10_000n) / span.netInitialMarginUsdc, 0)}
                fillPct={Number((crash.remainingEquityUsdc * 10000n) / span.netInitialMarginUsdc) / 400}
                tone="cobalt"
                note="equity ÷ net IM after the −30% settle"
              />
              <Gauge
                label="Hedge ratio"
                displayText={formatPercentFromBps(hedgeRatio, 0)}
                fillPct={Number(hedgeRatio) / 10_000}
                tone="cobalt"
                note="$95,000 short against the LP leg"
              />
              <Gauge
                label="Haircut vs worst spike"
                displayText={`500 bps / ${basisStats.maxBps.toFixed(0)} bps`}
                fillPct={basisStats.maxBps / 500}
                tone={haircutCoversWorst ? "up" : "down"}
                note="30-day observed peak inside the buffer"
              />
              <Gauge
                label="Maintenance share"
                displayText={formatPercentFromBps(maintShare, 0)}
                fillPct={Number(maintShare) / 10_000}
                tone="muted"
                note="MM_net as a share of IM_net · 7,500 bps"
              />
              <div className="rule-t mt-4">
                <Stat
                  label="Worst-case loss L_SPAN"
                  value={formatUsdcWhole(span.worstScenarioLossUsdc)}
                  tone="down"
                />
                <Stat
                  label="Basis haircut on matched notional"
                  value={formatUsdcWhole(span.basisHaircutUsdc)}
                  tone="cobalt"
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* Positions + activity */}
        <div className="mt-3 grid gap-3 xl:grid-cols-[8fr_4fr]">
          <Panel label="Books on the engine">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface-raised text-left">
                    {[
                      "Book",
                      "LP notional",
                      "Hedge",
                      "Net IM",
                      "Margin ratio",
                      "Status",
                      "",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-2.5 text-[12px] font-medium text-dim ${i > 0 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line last:border-b-0 transition-colors duration-120 hover:bg-surface-raised/60">
                    <td className="px-4 py-3.5">
                      <div className="text-[13px] font-medium">WETH/USDC v4 · hooked</div>
                      <div className="mt-0.5 font-mono text-[11px] text-dim">
                        0.7fa3…c41d · demo burner
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[13px]">
                      {formatUsdcWhole(DEMO_BOOK.lpNotionalUsdc)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[13px] text-up">
                      {formatUsdcWhole(DEMO_BOOK.shortNotionalUsdc)} short
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[13px] text-cobalt">
                      {formatUsdcWhole(span.netInitialMarginUsdc)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <MarginRatioBar
                        pctBps={(crash.remainingEquityUsdc * 10_000n) / span.netInitialMarginUsdc}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusChip tone="cobalt">settled</StatusChip>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a
                        href="/terminal?shock=-3000"
                        className="text-[13px] text-muted transition-colors duration-120 hover:text-cobalt"
                      >
                        inspect
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-line last:border-b-0 transition-colors duration-120 hover:bg-surface-raised/60">
                    <td className="px-4 py-3.5">
                      <div className="text-[13px] font-medium text-muted">WETH/USDC v4 · isolated</div>
                      <div className="mt-0.5 font-mono text-[11px] text-dim">
                        benchmark account · no hedge
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[13px] text-muted">
                      {formatUsdcWhole(DEMO_ISOLATED_BOOK.lpNotionalUsdc)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[13px] text-dim">
                      none
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[13px] text-muted">
                      {formatUsdcWhole(DEMO_ISOLATED_BOOK.postedMarginUsdc)} posted
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <MarginRatioBar pctBps={0n} liquidated />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusChip tone="down">liquidated</StatusChip>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a
                        href="/terminal?shock=-3000"
                        className="text-[13px] text-muted transition-colors duration-120 hover:text-cobalt"
                      >
                        inspect
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel label="Engine activity — demo burner">
            <ol className="px-5 py-2">
              {EVENTS.map((ev) => (
                <li key={ev.ts} className="flex gap-3 rule-b last:border-b-0 py-3">
                  <span className="mt-1 font-mono text-[10px] text-dim">{ev.ts}</span>
                  <span className="min-w-0">
                    <span
                      className={`font-mono text-[11px] tracking-wide ${
                        ev.tone === "down"
                          ? "text-down"
                          : ev.tone === "up"
                            ? "text-up"
                            : ev.tone === "cobalt"
                              ? "text-cobalt"
                              : "text-muted"
                      }`}
                    >
                      {ev.event}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted">
                      {ev.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="border-t border-line px-5 py-3 text-[12px] text-dim">
              Every event recomputed from the same engine; the table shows the
              demo script, frozen in time.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Gauge({
  label,
  displayText,
  fillPct,
  tone,
  note,
}: {
  label: string;
  displayText: string;
  fillPct: number;
  tone: "cobalt" | "up" | "down" | "muted";
  note: string;
}) {
  const fill =
    tone === "cobalt"
      ? "bg-cobalt"
      : tone === "up"
        ? "bg-up"
        : tone === "down"
          ? "bg-down"
          : "bg-muted/50";
  const textTone =
    tone === "muted" ? "text-muted" : tone === "cobalt" ? "text-cobalt" : tone === "up" ? "text-up" : "text-down";
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-muted">{label}</span>
        <span className={`font-mono text-[13px] tabular-nums ${textTone}`}>
          {displayText}
        </span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${displayText}`}
        className="mt-2 h-[4px] overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          aria-hidden="true"
          className={`h-full rounded-full ${fill}`}
          style={{ width: `${Math.max(2, Math.min(100, fillPct * 100))}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-dim">{note}</p>
    </div>
  );
}

function MarginRatioBar({ pctBps, liquidated = false }: { pctBps: bigint; liquidated?: boolean }) {
  const pct = Number(pctBps) / 10_000;
  return (
    <div className="flex items-center justify-end gap-2.5">
      <div
        role="img"
        aria-label={
          liquidated
            ? "Liquidated: no remaining margin"
            : `Margin ratio ${formatPercentFromBps(pctBps, 0)}`
        }
        className="hidden h-[4px] w-20 overflow-hidden rounded-full bg-surface-raised md:block"
      >
        {liquidated ? (
          <div aria-hidden="true" className="h-full w-full rounded-full bg-down-dim" />
        ) : (
          <div
            aria-hidden="true"
            className="h-full rounded-full bg-cobalt"
            style={{ width: `${Math.max(2, Math.min(100, pct * 100))}%` }}
          />
        )}
      </div>
      <Num size="xs" tone={liquidated ? "down" : "text"}>
        {liquidated ? "0%" : formatPercentFromBps(pctBps, 0)}
      </Num>
    </div>
  );
}
