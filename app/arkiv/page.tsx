import type { Metadata } from "next";
import { Num } from "@/components/Num";
import { Panel } from "@/components/Panel";
import { ModeBadge, StatusChip } from "@/components/Badge";
import { QueryBlock } from "@/components/QueryBlock";
import { ATTESTATIONS, KEEPER_QUERY, type Attestation } from "@/lib/attestations";
import { formatBps, formatPercentFromBps, formatUsdcWhole } from "@/lib/format";

export const metadata: Metadata = {
  title: "Arkiv attestations",
};

function RatioCell({ attestation }: { attestation: Attestation }) {
  const pct = attestation.marginRatioBps;
  const eligible = attestation.status === "UNWIND_ELIGIBLE";
  // scale: 250% reads full-width, below 100% reads in the red zone
  const width = Number((pct * 100n) / 25_000n);
  return (
    <div className="flex items-center justify-end gap-2.5">
      <div
        role="img"
        aria-label={`Margin ratio ${formatPercentFromBps(pct, 0)}`}
        className="relative hidden h-[4px] w-20 overflow-hidden rounded-full bg-line md:block"
      >
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 rounded-full ${eligible ? "bg-down" : "bg-up"}`}
          style={{ width: `${Math.min(100, width)}%` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-[1px] bg-cobalt"
          style={{ left: "40%" }}
        />
      </div>
      <Num tone={eligible ? "down" : "text"} size="xs">
        {formatPercentFromBps(pct, 0)}
      </Num>
    </div>
  );
}

export default function ArkivPage() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight">
            Arkiv risk attestations
          </h1>
          <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-muted">
            Wallet-owned risk summaries written to Arkiv Rabdi, expiring
            300 seconds after each write — 150 blocks at 2 seconds per
            block. A keeper reads them for discovery only; the contract
            recomputes the margin before any settlement moves a sat of
            collateral.
          </p>
        </div>
        <ModeBadge
          variant="cache"
          title="CACHE"
          description="Arkiv Rabdi is unreachable from this preview, so the inspector serves entities computed from the same engine and rendered from the local cache shape. The live writer replaces this feed on a funded testnet wallet."
        />
      </div>

      <QueryBlock query={KEEPER_QUERY} />

      <Panel className="mt-4" label="span_attestations — 3 entities in cache window" accent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-raised text-left">
                {["portfolio", "status", "margin ratio", "LP / short", "net IM", "equity", "ttl"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2 text-[11px] font-medium text-dim ${i > 1 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {ATTESTATIONS.map((a) => (
                <tr key={a.portfolioId} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-mono text-[13px]">{a.portfolioId}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-dim">
                      {a.trader}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip tone={a.status === "UNWIND_ELIGIBLE" ? "down" : "up"}>
                      {a.status === "UNWIND_ELIGIBLE" ? "unwind eligible" : "active hedged"}
                    </StatusChip>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RatioCell attestation={a} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-[13px] text-muted">
                    {formatUsdcWhole(a.lpNotionalUsdc)} /{" "}
                    {formatUsdcWhole(a.shortNotionalUsdc)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Num tone="cobalt" size="xs">
                      {formatUsdcWhole(a.netInitialMarginUsdc)}
                    </Num>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Num size="xs">{formatUsdcWhole(a.equityUsdc)}</Num>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Num size="xs" tone={a.remainingTtlSeconds < 60 ? "down" : "muted"}>
                      T−{a.remainingTtlSeconds}s
                    </Num>
                    <div className="mt-0.5 font-mono text-[11px] text-dim">
                      wrote {a.updatedAtLabel}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-5 max-w-3xl font-mono text-[12px] leading-relaxed text-dim">
        schema fields: portfolioId str · trader addr · status str ·
        marginRatioBps i32 · notionals dec · equityUsdc dec · ttl
        ExpirationTime.fromMinutes(5) · the cobalt tick marks 100%
        coverage; left of it, the book is UNWIND_ELIGIBLE
      </p>
    </main>
  );
}
