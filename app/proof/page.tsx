import type { Metadata } from "next";
import { Num } from "@/components/Num";
import { Panel, Stat } from "@/components/Panel";
import { StatusChip } from "@/components/Badge";
import {
  DEMO_VOL_SHOCK_BPS,
  evaluateSpan16,
  previewWithdrawal,
} from "@/lib/spanMath";
import { formatBps, formatPercentFromBps, formatUsdcWhole } from "@/lib/format";

export const metadata: Metadata = {
  title: "Proof",
};

const e6 = (n: number) => BigInt(n) * 1_000_000n;

interface VectorRow {
  id: string;
  book: string;
  lp: bigint;
  short: bigint;
}

const VECTORS: VectorRow[] = [
  { id: "GV-01", book: "$100,000 LP · $95,000 short (the demo book)", lp: e6(100_000), short: e6(95_000) },
  { id: "GV-02", book: "$100,000 LP · $80,000 short", lp: e6(100_000), short: e6(80_000) },
  { id: "GV-03", book: "$100,000 LP · unhedged", lp: e6(100_000), short: e6(0) },
];

/** GV-04 — the post-withdrawal state the hook guard protects. */
const guard = previewWithdrawal(e6(100_000), e6(95_000), e6(12_000), e6(80_000));

export default function ProofPage() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-6">
      <div className="mb-5">
        <h1 className="text-[20px] font-medium tracking-tight">Proof</h1>
        <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-muted">
          Golden vectors, the withdrawal guard, and the stated limits.
          Every number in the table is recomputed from the engine at page
          load — a parity failure in <code className="font-mono text-amber">lib/spanMath.ts</code>{" "}
          fails the vitest suite, not the display.
        </p>
      </div>

      {/* Golden vectors */}
      <Panel label="Golden vectors — SPAN-style grid, ν = 150 bps" accent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-raised text-left">
                <th className="px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-dim">
                  Vector
                </th>
                <th className="px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-dim">
                  Book
                </th>
                <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-dim">
                  Isolated IM
                </th>
                <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-dim">
                  Net IM
                </th>
                <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-dim">
                  Savings
                </th>
              </tr>
            </thead>
            <tbody>
              {VECTORS.map((v) => {
                const s = evaluateSpan16(v.lp, v.short);
                return (
                  <tr key={v.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3 font-mono text-[13px] text-amber">
                      {v.id}
                    </td>
                    <td className="px-4 py-3 text-muted">{v.book}</td>
                    <td className="px-4 py-3 text-right">
                      <Num tone="muted" size="xs">
                        {formatUsdcWhole(s.isolatedInitialMarginUsdc)}
                      </Num>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Num tone="text" size="xs">
                        {formatUsdcWhole(s.netInitialMarginUsdc)}
                      </Num>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Num tone="amber" size="xs">
                        {formatBps(s.capitalSavingsBps)} ·{" "}
                        {formatPercentFromBps(s.capitalSavingsBps)}
                      </Num>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-2.5 font-mono text-[11px] text-dim">
          parameters: γ 5,000 bps · basis h 500 bps · maintenance ratio
          7,500 bps · isolated short α 5,000 bps · fee φ 5 bps
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-[5fr_4fr]">
        {/* Withdrawal guard */}
        <Panel label="Withdrawal guard — v4 hook, beforeRemoveLiquidity">
          <div className="px-4 pb-4 pt-3.5">
            <p className="text-[14px] leading-relaxed text-muted">
              The owner of the GV-01 book withdraws $80,000 of LP
              notional. The engine evaluates the surviving book and the
              PoolManager call reverts on the unsafe branch:
            </p>
            <div className="mt-3 overflow-hidden rounded-field border border-down-dim bg-down-dim/25 px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <StatusChip tone="down">span margin breach</StatusChip>
                <span className="font-mono text-[11px] text-dim">
                  tx reverted · pool state unchanged
                </span>
              </div>
              <pre className="mt-2 overflow-x-auto font-mono text-[12px] leading-relaxed text-muted">
{`SpanMarginBreach(
  trader:      0x7fa3…c41d,
  postEquity:  ${formatUsdcWhole(guard.postWithdrawalEquityUsdc)},
  requiredIM:  ${formatUsdcWhole(guard.requiredInitialMarginUsdc)},
)`}
              </pre>
            </div>
            <div className="rule-t mt-4">
              <Stat
                label="Post-withdrawal equity"
                tone="down"
                value={formatUsdcWhole(guard.postWithdrawalEquityUsdc)}
              />
              <Stat
                label="Required initial margin"
                tone="amber"
                value={formatUsdcWhole(guard.requiredInitialMarginUsdc)}
              />
              <Stat
                label="Shortfall"
                tone="down"
                value={formatUsdcWhole(
                  guard.requiredInitialMarginUsdc - guard.postWithdrawalEquityUsdc,
                )}
              />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-dim">
              The branch is the GV-04 vector: the unwind at δ = +2,000 bps
              would realize bad debt, so the withdrawal is refused before
              it can happen. The mark used for the valuation is the more
              conservative of spot and entry.
            </p>
          </div>
        </Panel>

        {/* Sponsor proof + limitations */}
        <div className="flex flex-col gap-4">
          <Panel label="Sponsor proof points">
            <div className="rule-t">
              <Stat
                label="1inch · Aqua"
                value={
                  <span className="text-muted">
                    ship 25,000e6 · push 28,500e6 · pull 33,800e6
                  </span>
                }
              />
              <Stat
                label="Uniswap v4"
                value={
                  <span className="text-muted">
                    mined hook address · PoolManager call
                  </span>
                }
              />
              <Stat
                label="Arkiv · Rabdi"
                value={
                  <span className="text-muted">
                    live entity · 300 s ttl · runnable query
                  </span>
                }
              />
            </div>
            <p className="px-4 py-3 font-mono text-[11px] leading-relaxed text-dim">
              where each appears: the terminal ledger (ship, push, pull on
              a fork), the guard panel (hook revert), /arkiv (entity
              table and query string)
            </p>
          </Panel>

          <Panel label="Stated limits">
            <ul className="space-y-2 px-4 py-3.5">
              {[
                [
                  "not audited",
                  "the contracts are tested, not audited; basis, venue, smart-contract, and oracle risk remain",
                ],
                [
                  "demo hedge adapter",
                  "the short leg settles against a pre-funded demo reserve, not a live venue",
                ],
                [
                  "downward shocks only",
                  "the atomic unwind executes for shocks in [−3,000, 0] bps; upward shocks are preview-only",
                ],
                [
                  "router withdrawals",
                  "a withdrawal through a router is not identified by the guard; direct PoolManager calls only",
                ],
                [
                  "single-asset scope",
                  "one WETH/USDC LP plus one WETH short; multi-asset correlation is out of scope",
                ],
                [
                  "SPAN-style, simplified",
                  "a 16-scenario grid, not a production SPAN algorithm",
                ],
              ].map(([term, body]) => (
                <li key={term} className="flex gap-2.5">
                  <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-amber" />
                  <span className="text-[13px] leading-relaxed text-muted">
                    <span className="font-mono text-amber">{term}</span> —{" "}
                    {body}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <p className="mt-5 font-mono text-[11px] text-dim">
        observed ν = {Number(DEMO_VOL_SHOCK_BPS)} bps across every vector ·
        vectors recomputed at build time from lib/spanMath.ts
      </p>
    </main>
  );
}
