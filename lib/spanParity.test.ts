import { describe, expect, it } from "vitest";
import {
  DEMO_BOOK,
  evaluateSpan16,
  previewShockUnwind,
  previewWithdrawal,
  isolatedAccountAtShock,
} from "./spanMath";

const e6 = (n: number | bigint) => BigInt(n) * 1_000_000n;

/**
 * Golden vectors from the spec (§4.7). These are the exact integer
 * amounts the contracts must produce; the UI recomputes them from the
 * same engine, so a drift here is a build failure, not a bad display.
 */
describe("spanMath golden vectors", () => {
  it("GV-01 — $100,000 LP / $95,000 short", () => {
    const r = evaluateSpan16(e6(100_000), e6(95_000));
    expect(r.isolatedInitialMarginUsdc).toBe(e6(147_500));
    expect(r.worstScenarioLossUsdc).toBe(e6(5_250));
    expect(r.basisHaircutUsdc).toBe(e6(4_750));
    expect(r.netInitialMarginUsdc).toBe(e6(10_000));
    expect(r.netMaintenanceMarginUsdc).toBe(e6(7_500));
    expect(r.capitalSavingsBps).toBe(9_322n);
    expect(r.worstScenarioIndex).toBe(1); // δ = −3000, ν = 150
  });

  it("GV-02 — $100,000 LP / $80,000 short", () => {
    const r = evaluateSpan16(e6(100_000), e6(80_000));
    expect(r.isolatedInitialMarginUsdc).toBe(e6(140_000));
    expect(r.worstScenarioLossUsdc).toBe(e6(9_750));
    expect(r.basisHaircutUsdc).toBe(e6(4_000));
    expect(r.netInitialMarginUsdc).toBe(e6(13_750));
    expect(r.netMaintenanceMarginUsdc).toBe(10_312_500_000n); // 10,312.5e6
    expect(r.capitalSavingsBps).toBe(9_017n);
  });

  it("GV-03 — $100,000 LP, unhedged", () => {
    const r = evaluateSpan16(e6(100_000), 0n);
    expect(r.isolatedInitialMarginUsdc).toBe(e6(100_000));
    expect(r.worstScenarioLossUsdc).toBe(e6(33_750));
    expect(r.basisHaircutUsdc).toBe(0n);
    expect(r.netInitialMarginUsdc).toBe(e6(33_750));
    expect(r.netMaintenanceMarginUsdc).toBe(25_312_500_000n); // 25,312.5e6
    expect(r.capitalSavingsBps).toBe(6_625n);
  });

  it("GV-04 — withdrawal guard on $20,000 remaining LP / $95,000 short", () => {
    const r = evaluateSpan16(e6(20_000), e6(95_000));
    expect(r.isolatedInitialMarginUsdc).toBe(e6(67_500));
    expect(r.worstScenarioLossUsdc).toBe(e6(15_500));
    expect(r.basisHaircutUsdc).toBe(e6(1_000));
    expect(r.netInitialMarginUsdc).toBe(e6(16_500));
    expect(r.netMaintenanceMarginUsdc).toBe(e6(12_375));
    expect(r.capitalSavingsBps).toBe(7_555n);

    const w = previewWithdrawal(e6(100_000), e6(95_000), e6(12_000), e6(80_000));
    expect(w.postWithdrawalEquityUsdc).toBe(e6(12_000));
    expect(w.requiredInitialMarginUsdc).toBe(e6(16_500));
    expect(w.requiredInitialMarginUsdc > w.postWithdrawalEquityUsdc).toBe(
      true,
    ); // the hook reverts SpanMarginBreach
  });

  it("UNWIND-01 — the −30% crash waterfall", () => {
    const p = previewShockUnwind(
      e6(100_000),
      e6(95_000),
      e6(25_000),
      -3_000n,
      150n,
    );
    expect(p.lpLossUsdc).toBe(e6(33_750));
    expect(p.shortGainUsdc).toBe(e6(28_500));
    expect(p.nettedOffsetUsdc).toBe(e6(28_500));
    expect(p.protocolFeeUsdc).toBe(e6(50));
    expect(p.traderMarginUsedUsdc).toBe(e6(5_300));
    expect(p.remainingEquityUsdc).toBe(e6(19_700));
    expect(p.badDebtUsdc).toBe(0n);
  });

  it("rounding directions are conservative", () => {
    // Fee rounds up: $100,000.000001 of LP notional charges $50.000001,
    // never $50.000000. The protocol never undercharges.
    const fee = previewShockUnwind(
      100_000_000_001n,
      0n,
      0n,
      0n,
      0n,
    ).protocolFeeUsdc;
    expect(fee).toBe(50_000_001n); // ceil(1.00000000001e11 × 5 / 1e4)

    // A harsher crash than −30% still nets to zero bad debt at
    // posted ≥ IM_net is not required here; it is asserted inside the
    // tested envelope by the fuzz suite on the contract side.
    const p = previewShockUnwind(
      DEMO_BOOK.lpNotionalUsdc,
      DEMO_BOOK.shortNotionalUsdc,
      DEMO_BOOK.postedMarginUsdc,
      -3_000n,
      150n,
    );
    expect(p.badDebtUsdc).toBe(0n);
  });

  it("isolated account liquidates with the 10% penalty at −30%", () => {
    const s = isolatedAccountAtShock(
      e6(100_000),
      e6(25_000),
      -3_000n,
      150n,
    );
    expect(s.liquidated).toBe(true);
    expect(s.liquidationPenaltyUsdc).toBe(e6(10_000));
    expect(s.returnedToTraderUsdc).toBe(0n);
    expect(s.equityUsdc).toBe(0n);

    const calm = isolatedAccountAtShock(
      e6(100_000),
      e6(25_000),
      0n,
      150n,
    );
    expect(calm.liquidated).toBe(false);
    expect(calm.equityUsdc).toBe(e6(23_500)); // 25,000 − 1,500 vol haircut
  });
});
