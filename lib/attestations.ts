/**
 * Demo risk attestations, computed by the span engine at request time.
 *
 * Each row mirrors a real Arkiv `zeromargin.span_attestations` entity:
 * writer-owned, indexed by status and marginRatioBps, expiring 300
 * seconds after the write (150 Rabdi blocks at 2s/block). The statuses
 * below are not labels — each is derived from the engine-derived margin
 * ratio threshold: `UNWIND_ELIGIBLE` requires equity below net initial
 * margin (ratio < 10,000 bps).
 */
import {
  DEMO_BOOK,
  DEMO_VOL_SHOCK_BPS,
  evaluateSpan16,
  previewShockUnwind,
} from "./spanMath";

export interface Attestation {
  portfolioId: string;
  trader: string;
  status: "ACTIVE_HEDGED" | "UNWIND_ELIGIBLE";
  marginRatioBps: bigint;
  lpNotionalUsdc: bigint;
  shortNotionalUsdc: bigint;
  postedMarginUsdc: bigint;
  netInitialMarginUsdc: bigint;
  netMaintenanceMarginUsdc: bigint;
  equityUsdc: bigint;
  aquaStrategyHash: string;
  updatedAtLabel: string;
  remainingTtlSeconds: number;
}

/** floor(equity × B / IM_net), 0 when IM_net is 0. */
function marginRatioBps(equity: bigint, netInitialMargin: bigint): bigint {
  if (netInitialMargin === 0n) return 0n;
  return (equity * 10_000n) / netInitialMargin;
}

const span = evaluateSpan16(DEMO_BOOK.lpNotionalUsdc, DEMO_BOOK.shortNotionalUsdc);
const settledAt = previewShockUnwind(
  DEMO_BOOK.lpNotionalUsdc,
  DEMO_BOOK.shortNotionalUsdc,
  DEMO_BOOK.postedMarginUsdc,
  -3_000n,
  DEMO_VOL_SHOCK_BPS,
);

const e6 = (n: number) => BigInt(n) * 1_000_000n;

 /** GV-04: the post-withdrawal state the hook guard protects. */
const guardStateEquity = e6(12_000);
const guardStateRequired = e6(16_500);

export const ATTESTATIONS: Attestation[] = [
  {
    portfolioId: "GV-01-OPEN",
    trader: "0x7fa3…c41d (demo burner)",
    aquaStrategyHash: "0x" + "a3c41d".padStart(64, "0"),
    status: "ACTIVE_HEDGED",
    marginRatioBps: marginRatioBps(DEMO_BOOK.postedMarginUsdc, span.netInitialMarginUsdc),
    lpNotionalUsdc: DEMO_BOOK.lpNotionalUsdc,
    shortNotionalUsdc: DEMO_BOOK.shortNotionalUsdc,
    postedMarginUsdc: DEMO_BOOK.postedMarginUsdc,
    netInitialMarginUsdc: span.netInitialMarginUsdc,
    netMaintenanceMarginUsdc: span.netMaintenanceMarginUsdc,
    equityUsdc: DEMO_BOOK.postedMarginUsdc,
    updatedAtLabel: "T−262s",
    remainingTtlSeconds: 38,
  },
  {
    portfolioId: "UNWIND-01-SETTLED",
    trader: "0x7fa3…c41d (demo burner)",
    aquaStrategyHash: "0x" + "b41d00".padStart(64, "0"),
    status: "ACTIVE_HEDGED",
    marginRatioBps: marginRatioBps(settledAt.remainingEquityUsdc, span.netInitialMarginUsdc),
    lpNotionalUsdc: DEMO_BOOK.lpNotionalUsdc,
    shortNotionalUsdc: DEMO_BOOK.shortNotionalUsdc,
    postedMarginUsdc: settledAt.remainingEquityUsdc,
    netInitialMarginUsdc: span.netInitialMarginUsdc,
    netMaintenanceMarginUsdc: span.netMaintenanceMarginUsdc,
    equityUsdc: settledAt.remainingEquityUsdc,
    updatedAtLabel: "T−41s",
    remainingTtlSeconds: 259,
  },
  {
    portfolioId: "GV-04-WITHDRAWAL-GUARD",
    trader: "0x7fa3…c41d (demo burner)",
    aquaStrategyHash: "0x" + "c4d04".padStart(64, "0"),
    status:
      marginRatioBps(guardStateEquity, guardStateRequired) < 10_000n
        ? "UNWIND_ELIGIBLE"
        : "ACTIVE_HEDGED",
    marginRatioBps: marginRatioBps(guardStateEquity, guardStateRequired),
    lpNotionalUsdc: e6(20_000),
    shortNotionalUsdc: DEMO_BOOK.shortNotionalUsdc,
    postedMarginUsdc: guardStateEquity,
    netInitialMarginUsdc: guardStateRequired,
    netMaintenanceMarginUsdc: (guardStateRequired * 7_500n + 9_999n) / 10_000n,
    equityUsdc: guardStateEquity,
    updatedAtLabel: "T−9s",
    remainingTtlSeconds: 291,
  },
];

export const KEEPER_QUERY =
  "arkiv.schema = str('zeromargin.span_attestations') AND status = str('UNWIND_ELIGIBLE') AND marginRatioBps < i32(10000) ORDER BY $key ASC";
