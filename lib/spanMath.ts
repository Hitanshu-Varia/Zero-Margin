/**
 * SpanMath — the TypeScript mirror of SpanMathLib.sol.
 *
 * Every function is deterministic BigInt fixed-point math in USDC base
 * units (1e6 = $1.00). No floating-point arithmetic exists in this file.
 * Margin requirements round up (ceilDiv); credits round down
 * (truncating division). The golden vectors in /proof are computed by
 * these functions at run time, never stored as display strings.
 *
 * Spec reference: agent/Agent.md §4.3 (formulas), §4.7 (golden vectors).
 */

export const BPS = 10_000n;
export const BPS3 = 1_000_000_000_000n; // B³ = 10^12

/** LP convexity factor γ = 5,000 bps (0.50). */
export const GAMMA_LP_BPS = 5_000n;
/** Cross-venue basis haircut h = 500 bps. */
export const BASIS_HAIRCUT_BPS = 500n;
/** Maintenance margin ratio m = 7,500 bps of net initial margin. */
export const MAINT_MARGIN_RATIO_BPS = 7_500n;
/** Isolated initial margin α = 5,000 bps for the short leg. */
export const ISOLATED_SHORT_IM_BPS = 5_000n;
/** Isolated liquidation penalty π = 1,000 bps of LP notional. */
export const ISOLATED_LIQ_PENALTY_BPS = 1_000n;
/** Atomic unwind fee φ = 5 bps of LP notional. */
export const NETTED_UNWIND_FEE_BPS = 5n;

/** The eight price shocks of the SPAN-style grid, in bps. */
export const PRICE_SHOCKS_BPS: readonly bigint[] = [
  -3_000n, -2_000n, -1_000n, -500n, 0n, 500n, 1_000n, 2_000n,
];
/** The two volatility states of the grid, in bps. */
export const VOL_SHOCKS_BPS: readonly bigint[] = [0n, 150n];

/** Demo volatility state ν = 150 bps. */
export const DEMO_VOL_SHOCK_BPS = 150n;
/** Demo entry price: $3,000 per WETH. */
export const DEMO_ENTRY_PRICE_USDC = 3_000_000_000n;

export const MIN_SHOCK_BPS = -3_000n;
export const MAX_SHOCK_BPS = 2_000n;
/** Isolated maintenance margin: 5,000 bps of the posted margin. */
export const ISOLATED_MAINT_RATIO_BPS = 5_000n;

export interface SpanResult {
  isolatedInitialMarginUsdc: bigint;
  worstScenarioLossUsdc: bigint;
  worstScenarioIndex: number;
  basisHaircutUsdc: bigint;
  netInitialMarginUsdc: bigint;
  netMaintenanceMarginUsdc: bigint;
  /** Net PnL for each grid cell, index = priceShock × 2 + volState. */
  scenarioNetPnlUsdc: bigint[];
  capitalSavingsBps: bigint;
}

export interface UnwindPreview {
  lpLossUsdc: bigint;
  shortGainUsdc: bigint;
  nettedOffsetUsdc: bigint;
  protocolFeeUsdc: bigint;
  traderMarginUsedUsdc: bigint;
  remainingEquityUsdc: bigint;
  badDebtUsdc: bigint;
}

export function ceilDiv(a: bigint, b: bigint): bigint {
  if (a === 0n) return 0n;
  return (a + b - 1n) / b;
}

/** Floor division for signed values. Rounds toward negative infinity. */
export function signedFloorDiv(a: bigint, b: bigint): bigint {
  if (a >= 0n) return a / b;
  return -((-a + b - 1n) / b);
}

/** Floor-rounding absolute version for positive operands. */
function floorDiv(a: bigint, b: bigint): bigint {
  return a / b;
}

/** LP impermanent-loss convexity penalty, always a positive loss. */
export function impermanentLossUsdc(
  lpNotionalUsdc: bigint,
  priceShockAbsBps: bigint,
): bigint {
  const d2 = priceShockAbsBps * priceShockAbsBps;
  return floorDiv(lpNotionalUsdc * GAMMA_LP_BPS * d2, 2n * BPS3);
}

/** Volatility haircut term: floor(N_LP × ν / B). */
export function volatilityLossUsdc(
  lpNotionalUsdc: bigint,
  volShockBps: bigint,
): bigint {
  return floorDiv(lpNotionalUsdc * volShockBps, BPS);
}

/** Signed LP leg PnL at a price shock: delta − convexity loss − vol loss. */
export function lpNetPnlUsdc(
  lpNotionalUsdc: bigint,
  priceShockBps: bigint,
  volShockBps: bigint,
): bigint {
  const lpDelta = signedFloorDiv(lpNotionalUsdc * priceShockBps, BPS);
  const il = impermanentLossUsdc(lpNotionalUsdc, priceShockBps < 0n ? -priceShockBps : priceShockBps);
  const vol = volatilityLossUsdc(lpNotionalUsdc, volShockBps);
  return lpDelta - il - vol;
}

/** Signed short leg PnL: gain on a downward shock, loss on an upward one. */
export function shortNetPnlUsdc(
  shortNotionalUsdc: bigint,
  priceShockBps: bigint,
): bigint {
  return signedFloorDiv(-shortNotionalUsdc * priceShockBps, BPS);
}

/** Section 4.3 formula 1: the 16-scenario SPAN-style grid. */
export function evaluateSpan16(
  lpNotionalUsdc: bigint,
  shortNotionalUsdc: bigint,
): SpanResult {
  const scenarioNetPnlUsdc: bigint[] = new Array(16).fill(0n);
  let worstScenarioLossUsdc = 0n;
  let worstScenarioIndex = 0;

  for (let k = 0; k < PRICE_SHOCKS_BPS.length; k++) {
    for (let m = 0; m < VOL_SHOCKS_BPS.length; m++) {
      const priceShock = PRICE_SHOCKS_BPS[k];
      const volShock = VOL_SHOCKS_BPS[m];
      const jointDelta = (lpNotionalUsdc - shortNotionalUsdc) * priceShock;
      const delta = signedFloorDiv(jointDelta, BPS);
      const il = impermanentLossUsdc(lpNotionalUsdc, priceShock < 0n ? -priceShock : priceShock);
      const vol = volatilityLossUsdc(lpNotionalUsdc, volShock);
      const netPnl = delta - il - vol;
      const idx = k * 2 + m;
      scenarioNetPnlUsdc[idx] = netPnl;
      if (-netPnl > worstScenarioLossUsdc) {
        worstScenarioLossUsdc = -netPnl;
        worstScenarioIndex = idx;
      }
    }
  }

  const matched = lpNotionalUsdc < shortNotionalUsdc ? lpNotionalUsdc : shortNotionalUsdc;
  const basisHaircutUsdc = ceilDiv(matched * BASIS_HAIRCUT_BPS, BPS);
  const netInitialMarginUsdc = worstScenarioLossUsdc + basisHaircutUsdc;
  const netMaintenanceMarginUsdc = ceilDiv(
    netInitialMarginUsdc * MAINT_MARGIN_RATIO_BPS,
    BPS,
  );
  const isolatedShortIm = ceilDiv(shortNotionalUsdc * ISOLATED_SHORT_IM_BPS, BPS);
  const isolatedInitialMarginUsdc = lpNotionalUsdc + isolatedShortIm;
  const capitalSavingsBps =
    isolatedInitialMarginUsdc === 0n
      ? 0n
      : floorDiv(
          (isolatedInitialMarginUsdc - netInitialMarginUsdc) * BPS,
          isolatedInitialMarginUsdc,
        );

  return {
    isolatedInitialMarginUsdc,
    worstScenarioLossUsdc,
    worstScenarioIndex,
    basisHaircutUsdc,
    netInitialMarginUsdc,
    netMaintenanceMarginUsdc,
    scenarioNetPnlUsdc,
    capitalSavingsBps,
  };
}

/** Section 4.3 formula 6: the cross-leg settlement waterfall. */
export function previewShockUnwind(
  lpNotionalUsdc: bigint,
  shortNotionalUsdc: bigint,
  postedMarginUsdc: bigint,
  priceShockBps: bigint,
  volShockBps: bigint,
): UnwindPreview {
  const lpNet = lpNetPnlUsdc(lpNotionalUsdc, priceShockBps, volShockBps);
  const shortNet = shortNetPnlUsdc(shortNotionalUsdc, priceShockBps);

  let lpLossUsdc = 0n;
  let shortGainUsdc = 0n;

  if (lpNet < 0n && shortNet >= 0n) {
    lpLossUsdc = -lpNet;
    shortGainUsdc = shortNet;
  } else if (shortNet < 0n && lpNet >= 0n) {
    lpLossUsdc = -shortNet;
    shortGainUsdc = lpNet;
  } else if (lpNet < 0n && shortNet < 0n) {
    lpLossUsdc = -lpNet - shortNet;
    shortGainUsdc = 0n;
  } else {
    lpLossUsdc = 0n;
    shortGainUsdc = lpNet + shortNet;
  }

  const nettedOffsetUsdc =
    shortGainUsdc < lpLossUsdc ? shortGainUsdc : lpLossUsdc;
  const protocolFeeUsdc = ceilDiv(lpNotionalUsdc * NETTED_UNWIND_FEE_BPS, BPS);
  const residualUsdc = lpLossUsdc - nettedOffsetUsdc;
  const requiredUsdc = residualUsdc + protocolFeeUsdc;
  const availableUsdc = postedMarginUsdc + (shortGainUsdc - nettedOffsetUsdc);

  let traderMarginUsedUsdc: bigint;
  let remainingEquityUsdc: bigint;
  let badDebtUsdc: bigint;

  if (availableUsdc >= requiredUsdc) {
    traderMarginUsedUsdc = requiredUsdc;
    remainingEquityUsdc = availableUsdc - requiredUsdc;
    badDebtUsdc = 0n;
  } else {
    traderMarginUsedUsdc = availableUsdc;
    remainingEquityUsdc = 0n;
    badDebtUsdc = requiredUsdc - availableUsdc;
  }

  return {
    lpLossUsdc,
    shortGainUsdc,
    nettedOffsetUsdc,
    protocolFeeUsdc,
    traderMarginUsedUsdc,
    remainingEquityUsdc,
    badDebtUsdc,
  };
}

/** Withdrawal guard: equity and required IM after LP notional is removed. */
export function previewWithdrawal(
  lpNotionalUsdc: bigint,
  shortNotionalUsdc: bigint,
  postedMarginUsdc: bigint,
  withdrawnUsd: bigint,
): {
  postWithdrawalEquityUsdc: bigint;
  requiredInitialMarginUsdc: bigint;
  remainingLpUsdc: bigint;
} {
  const remainingLpUsdc =
    lpNotionalUsdc > withdrawnUsd ? lpNotionalUsdc - withdrawnUsd : 0n;
  const requiredInitialMarginUsdc = evaluateSpan16(
    remainingLpUsdc,
    shortNotionalUsdc,
  ).netInitialMarginUsdc;
  return {
    postWithdrawalEquityUsdc: postedMarginUsdc,
    requiredInitialMarginUsdc,
    remainingLpUsdc,
  };
}

/**
 * The isolated-account model for the split screen: a margin account
 * holding the LP leg alone, posted margin P against a leveraged entry,
 * maintained at a ratio of P. A breach liquidates the whole position and
 * applies the 10% notional penalty; the trader receives what remains
 * after the penalty, and receives nothing when equity is exhausted.
 */
export interface IsolatedAccountState {
  postedMarginUsdc: bigint;
  lpPnlUsdc: bigint;
  equityUsdc: bigint;
  maintenanceMarginUsdc: bigint;
  liquidated: boolean;
  liquidationPenaltyUsdc: bigint;
  returnedToTraderUsdc: bigint;
  breachMarginBps: bigint;
}

export function isolatedAccountAtShock(
  lpNotionalUsdc: bigint,
  postedMarginUsdc: bigint,
  priceShockBps: bigint,
  volShockBps: bigint,
): IsolatedAccountState {
  const lpPnlUsdc = lpNetPnlUsdc(lpNotionalUsdc, priceShockBps, volShockBps);
  const rawEquity = postedMarginUsdc + lpPnlUsdc;
  const maintenanceMarginUsdc = ceilDiv(
    postedMarginUsdc * ISOLATED_MAINT_RATIO_BPS,
    BPS,
  );

  const breach =
    lpPnlUsdc < 0n && rawEquity < maintenanceMarginUsdc ? true : false;
  const liquidationPenaltyUsdc = breach
    ? floorDiv(lpNotionalUsdc * ISOLATED_LIQ_PENALTY_BPS, BPS)
    : 0n;
  const returnedToTraderUsdc = breach
    ? rawEquity - liquidationPenaltyUsdc
    : rawEquity;
  const equityUsdc = breach
    ? returnedToTraderUsdc > 0n
      ? returnedToTraderUsdc
      : 0n
    : rawEquity;

  const denominator = maintenanceMarginUsdc;
  const breachMarginBps = breach
    ? 0n
    : denominator === 0n
      ? 0n
      : floorDiv(rawEquity * BPS, denominator);

  return {
    postedMarginUsdc,
    lpPnlUsdc,
    equityUsdc,
    maintenanceMarginUsdc,
    liquidated: breach,
    liquidationPenaltyUsdc,
    returnedToTraderUsdc,
    breachMarginBps,
  };
}

/** The demo book: $100,000 LP, $95,000 short, $25,000 posted (GV-01). */
export const DEMO_BOOK = {
  lpNotionalUsdc: 100_000_000_000n,
  shortNotionalUsdc: 95_000_000_000n,
  postedMarginUsdc: 25_000_000_000n,
} as const;

/** Isolated counterpart of the demo book for the left panel. */
export const DEMO_ISOLATED_BOOK = {
  lpNotionalUsdc: 100_000_000_000n,
  postedMarginUsdc: 25_000_000_000n,
} as const;
