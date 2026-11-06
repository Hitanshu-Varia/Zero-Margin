import type { Metadata } from "next";
import { Num } from "@/components/Num";
import { Panel, Stat, KpiCard } from "@/components/Panel";
import { StatusChip } from "@/components/Badge";
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

/* ── Equity sweep: +2,000 bps down to −3,000 bps ────────────── */
const SWEEP_STEP = 100n;
const SWEEP: Array<{
  shock: bigint;
  isolatedEquity: bigint;
  isolatedLiquidated: boolean;
  bookEquity: bigint;
}> = [];
{
  let shock = 2_000n;
  const step = SWEEP_STEP;
  while (shock >= -3_000n) {
    const iso = isolatedAccountAtShock(
      DEMO_ISOLATED_BOOK.lpNotionalUsdc,
      DEMO_ISOLATED_BOOK.postedMarginUsdc,
      shock,
      DEMO_VOL_SHOCK_BPS,
    );
    const book = previewShockUnwind(
      DEMO_BOOK.lpNotionalUsdc,
      DEMO_BOOK.shortNotionalUsdc,
      DEMO_BOOK.postedMarginUsdc,
      shock,
      DEMO_VOL_SHOCK_BPS,
    );
    SWEEP.push({
      shock,
      isolatedEquity: iso.equityUsdc,
      isolatedLiquidated: iso.liquidated,
      bookEquity: book.remainingEquityUsdc,
    });
    shock -= step;
  }
}
const liquidationFromShock = SWEEP.filter((s) => s.isolatedLiquidated)[0]?.shock;

/* ── Equity-under-stress chart geometry ─────────────────────── */
const CH = { W: 740, H: 240, TICK_H: 210, PAD_L: 8, PAD_R: 14 };
const Y_MAX = 26_000_000_000n;
const X_MIN = 2_000n;
const X_MAX = -3_000n;

function cx(shock: bigint): number {
  const t = Number((X_MIN - shock) * 1000n / (X_MIN - X_MAX)) / 1000;
  return chSafe(2 + t * (CH.W - 2 - CH.PAD_R));
}
function cy(eq: bigint): number {
  const t = Number((eq * 1000n) / Y_MAX) / 1000;
  return chSafe(CH.TICK_H - Math.min(1, Math.max(0, t)) * CH.TICK_H);
}
function chSafe(v: number): number {
  return Math.max(0, Math.min(CH.W, v));
}

function linePath(select: (s: (typeof SWEEP)[number]) => bigint): string {
  return SWEEP.map((s, i) => {
    const x = cx(s.shock);
    const y = cy(select(s));
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

const bookPathG = linePath((s) => s.bookEquity);
const isolatedPathG = linePath((s) => s.isolatedEquity);
const areaPathG =
  linePath((s) => s.bookEquity) +
  ` L${cx(-3_000n).toFixed(1)},${cy(0n).toFixed(1)} L${cx(2_000n).toFixed(1)},${cy(0n).toFixed(1)} Z`;

const Y_TICKS = [26_000, 20_000, 15_000, 10_000, 5_000].map((v) => ({
  v: BigInt(v) * 1_000_000n,
  label: formatUsdcCompact(BigInt(v) * 1_000_000n),
}));

/** Events derived from the engine, newest first. */
const EVENTS: Array<{ event: string; detail: string; ts: string; tone: "up" | "down" | "gold" | "muted" }> = [
  {
    event: "BookUnwound",
    detail: `settled ±0 liquidation at −3,000 bps · equity ${formatUsdcWhole(crash.remainingEquityUsdc)}`,
    ts: "T−00:41",
    tone: "gold",
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
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-dim">
              Overview
            </p>
            <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight">
              <span className="gold-gradient">One virtual balance</span>, both legs
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
            value={<span className="gold-gradient">{formatUsdc(crash.remainingEquityUsdc)}</span>}
            caption={
              <span className="text-dim">
                −30% replay · no liquidation penalty
              </span>
            }
          />
          <KpiCard
            label="Collateral unlocked"
            value={formatPercentFromBps(span.capitalSavingsBps)}
            valueClass="text-gold"
            caption={
              <span className="text-dim">
                {formatUsdcWhole(span.isolatedInitialMarginUsdc)} → {formatUsdcWhole(span.netInitialMarginUsdc)} on GV-01
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
            <div className="px-5 pb-4 pt-4">
              <div className="mb-3 flex items-center gap-5 text-[12px] text-muted">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-[2px] w-5 rounded-full bg-gold" />
                  ZeroMargin book
                </span>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-[2px] w-5 rounded-full bg-line-strong" />
                  Isolated LP account
                </span>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-down-dim" />
                  Liquidation zone from{" "}
                  {liquidationFromShock ? formatPercentFromBps(-liquidationFromShock, 0) : "—"}
                </span>
              </div>
              <svg
                viewBox={`0 0 ${CH.W} ${CH.H}`}
                className="w-full"
                role="img"
                aria-label={`Equity of both accounts as price falls from +20 to -30 percent: the isolated account liquidates and returns nothing below the ${liquidationFromShock ? formatPercentFromBps(-liquidationFromShock, 0) : ""} mark, while the ZeroMargin book settles smoothly to ${formatUsdcWhole(crash.remainingEquityUsdc)} with no penalty`}
              >
                {Y_TICKS.map((t) => (
                  <g key={t.label}>
                    <line
                      x1={0}
                      x2={CH.W}
                      y1={cy(t.v)}
                      y2={cy(t.v)}
                      stroke="var(--line)"
                      strokeWidth="1"
                    />
                    <text
                      x={CH.PAD_L}
                      y={cy(t.v) - 4}
                      fill="var(--text-dim)"
                      fontSize="10"
                      fontFamily="var(--font-data), monospace"
                    >
                      {t.label}
                    </text>
                  </g>
                ))}

                {/* liquidation zone band */}
                {liquidationFromShock && (
                  <rect
                    x={cx(liquidationFromShock)}
                    y={0}
                    width={CH.W - cx(liquidationFromShock)}
                    height={CH.TICK_H + 14}
                    fill="var(--red-dim)"
                    opacity="0.45"
                  />
                )}

                {/* isolated (dies at the band) */}
                <path d={isolatedPathG} fill="none" stroke="var(--line-strong)" strokeWidth="2" />

                {/* area + gold line */}
                <path d={areaPathG} fill="var(--gold-dim)" opacity="0.35" />
                <path d={bookPathG} fill="none" stroke="var(--gold)" strokeWidth="2.5" />

                {/* crash marker */}
                <line
                  x1={cx(-3_000n)}
                  x2={cx(-3_000n)}
                  y1={cy(e6(25_000))}
                  y2={cy(0n)}
                  stroke="var(--text-dim)"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                />
                <circle cx={cx(-3_000n)} cy={cy(crash.remainingEquityUsdc)} r="4" fill="var(--gold)" />
                <circle cx={cx(-3_000n)} cy={cy(crashIsolated.equityUsdc)} r="4" fill="var(--red)" />

                {/* x axis */}
                <line
                  x1={0}
                  x2={CH.W}
                  y1={CH.TICK_H + 14}
                  y2={CH.TICK_H + 14}
                  stroke="var(--line-strong)"
                />
                {[
                  { s: 2_000n, t: "+20%" },
                  { s: 0n, t: "0%" },
                  { s: -1_000n, t: "−10%" },
                  { s: -2_000n, t: "−20%" },
                  { s: -3_000n, t: "−30%" },
                ].map((tick) => (
                  <text
                    key={tick.t}
                    x={cx(tick.s)}
                    y={CH.TICK_H + 28}
                    textAnchor={
                      tick.s === X_MIN ? "start" : tick.s === X_MAX ? "end" : "middle"
                    }
                    fill="var(--text-dim)"
                    fontSize="10"
                    fontFamily="var(--font-data), monospace"
                  >
                    {tick.t}
                  </text>
                ))}
              </svg>
            </div>
          </Panel>

          <Panel label="Risk monitor">
            <div className="px-5 py-2">
              <Gauge
                label="Margin ratio at settlement"
                displayText={formatPercentFromBps((crash.remainingEquityUsdc * 10_000n) / span.netInitialMarginUsdc, 0)}
                fillPct={Number((crash.remainingEquityUsdc * 10000n) / span.netInitialMarginUsdc) / 400}
                tone="gold"
                note="equity ÷ net IM after the −30% settle"
              />
              <Gauge
                label="Hedge ratio"
                displayText={formatPercentFromBps(hedgeRatio, 0)}
                fillPct={Number(hedgeRatio) / 10_000}
                tone="gold"
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
                  tone="gold"
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
                        className={`px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-dim ${i > 0 ? "text-right" : ""}`}
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
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[13px] text-gold">
                      {formatUsdcWhole(span.netInitialMarginUsdc)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <MarginRatioBar
                        pctBps={(crash.remainingEquityUsdc * 10_000n) / span.netInitialMarginUsdc}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusChip tone="gold">settled</StatusChip>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a
                        href="/terminal?shock=-3000"
                        className="text-[13px] text-muted transition-colors duration-120 hover:text-gold"
                      >
                        inspect →
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
                        className="text-[13px] text-muted transition-colors duration-120 hover:text-gold"
                      >
                        inspect →
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
                            : ev.tone === "gold"
                              ? "text-gold"
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
  tone: "gold" | "up" | "down" | "muted";
  note: string;
}) {
  const fill =
    tone === "gold"
      ? "bg-gold"
      : tone === "up"
        ? "bg-up"
        : tone === "down"
          ? "bg-down"
          : "bg-muted/50";
  const textTone =
    tone === "muted" ? "text-muted" : tone === "gold" ? "text-gold" : tone === "up" ? "text-up" : "text-down";
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
            className="h-full rounded-full bg-gold"
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
