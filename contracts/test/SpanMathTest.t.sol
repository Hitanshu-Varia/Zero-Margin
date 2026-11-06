// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {SpanMathLib} from "../src/SpanMathLib.sol";

/// Golden vectors GV-01..GV-04 and UNWIND-01, exactly Section 4.7 of the spec.
contract SpanMathTest is Test {
    using SpanMathLib for uint256;

    // GV-01: 100,000e6 LP, 95,000e6 short
    uint256 constant LP_01 = 100_000e6;
    uint256 constant SHORT_01 = 95_000e6;
    uint256 constant POSTED_01 = 25_000e6;

    function test_GV01_exact() public pure {
        SpanMathLib.SpanResult memory s = SpanMathLib.evaluateSpan16(LP_01, SHORT_01);
        assertEq(s.isolatedInitialMarginUsdc, 147_500e6, "IM_isolated");
        assertEq(s.worstScenarioLossUsdc, 5_250e6, "L_SPAN");
        assertEq(s.basisHaircutUsdc, 4_750e6, "H_basis");
        assertEq(s.netInitialMarginUsdc, 10_000e6, "IM_net");
        assertEq(s.netMaintenanceMarginUsdc, 7_500e6, "MM_net");
        assertEq(s.capitalSavingsBps, 9_322, "savings bps");
    }

    function test_GV02_exact() public pure {
        SpanMathLib.SpanResult memory s = SpanMathLib.evaluateSpan16(LP_01, 80_000e6);
        assertEq(s.isolatedInitialMarginUsdc, 140_000e6, "IM_isolated");
        assertEq(s.worstScenarioLossUsdc, 9_750e6, "L_SPAN");
        assertEq(s.basisHaircutUsdc, 4_000e6, "H_basis");
        assertEq(s.netInitialMarginUsdc, 13_750e6, "IM_net");
        assertEq(s.netMaintenanceMarginUsdc, 10_312_500_000, "MM_net"); // 10,312.5e6
        assertEq(s.capitalSavingsBps, 9_017, "savings bps");
    }

    function test_GV03_exact() public pure {
        SpanMathLib.SpanResult memory s = SpanMathLib.evaluateSpan16(LP_01, 0);
        assertEq(s.isolatedInitialMarginUsdc, 100_000e6, "IM_isolated");
        assertEq(s.worstScenarioLossUsdc, 33_750e6, "L_SPAN");
        assertEq(s.basisHaircutUsdc, 0, "H_basis");
        assertEq(s.netInitialMarginUsdc, 33_750e6, "IM_net");
        assertEq(s.netMaintenanceMarginUsdc, 25_312_500_000, "MM_net");
        assertEq(s.capitalSavingsBps, 6_625, "savings bps");
    }

    function test_GV04_preview() public pure {
        // Post-withdrawal state: N_LP = 20,000e6; N_S = 95,000e6; posted 12,000e6; δ = +2,000; ν = 150
        SpanMathLib.SpanResult memory s = SpanMathLib.evaluateSpan16(20_000e6, 95_000e6);
        assertEq(s.isolatedInitialMarginUsdc, 67_500e6, "IM_isolated");
        assertEq(s.worstScenarioLossUsdc, 15_500e6, "L_SPAN");
        assertEq(s.basisHaircutUsdc, 1_000e6, "H_basis");
        assertEq(s.netInitialMarginUsdc, 16_500e6, "IM_net");
        assertEq(s.netMaintenanceMarginUsdc, 12_375e6, "MM_net");
        assertEq(s.capitalSavingsBps, 7_555, "savings bps");
    }

    /// UNWIND-01: the −30% crash waterfall on GV-01.
    function test_UNWIND01_waterfall() public pure {
        SpanMathLib.UnwindPreview memory p =
            SpanMathLib.previewShockUnwind(LP_01, SHORT_01, POSTED_01, int256(-3_000), 150);
        assertEq(p.lpLossUsdc, 33_750e6, "lpLoss");
        assertEq(p.shortGainUsdc, 28_500e6, "shortGain");
        assertEq(p.nettedOffsetUsdc, 28_500e6, "netted");
        assertEq(p.protocolFeeUsdc, 50e6, "fee");
        assertEq(p.traderMarginUsedUsdc, 5_300e6, "marginUsed");
        assertEq(p.remainingEquityUsdc, 19_700e6, "equity");
        assertEq(p.badDebtUsdc, 0, "badDebt");
    }

    /// The whole tested envelope never produces bad debt for a book posted at
    /// its net IM — the invariant the settlement relies on.
    function testFuzz_ZeroBadDebtWithinEnvelope(
        uint256 lpNotional,
        uint256 hedgeBps,
        int256 shock,
        uint256 volJitter
    ) public pure {
        lpNotional = bound(lpNotional, 1_000e6, 10_000_000e6);
        hedgeBps = bound(hedgeBps, 8_000, 10_000);
        int256 shockClamped = int256(bound(uint256(shock), 0, 3_000));
        int256 priceShock = -shockClamped; // δ ∈ [−3000, 0]: the executable set
        uint256 vol = 150 + (volJitter % 151) % 151;

        SpanMathLib.SpanResult memory s =
            SpanMathLib.evaluateSpan16(lpNotional, (lpNotional * hedgeBps) / 10_000);
        SpanMathLib.UnwindPreview memory p =
            SpanMathLib.previewShockUnwind(lpNotional, (lpNotional * hedgeBps) / 10_000, s.netInitialMarginUsdc, priceShock, vol);
        assertEq(p.badDebtUsdc, 0, "bad debt inside envelope");
    }

    /// Requirements round up, credits round down.
    function test_RoundingDirections() public pure {
        // fee on a notional with a true remainder: ceil not floor
        // 1,000,001 × 5 / 10,000 = 500.0005 → fee = 501; floor would say 500
        SpanMathLib.UnwindPreview memory p =
            SpanMathLib.previewShockUnwind(1_000_001, 0, 25_000e6, int256(0), 0);
        assertEq(p.protocolFeeUsdc, 501, "fee ceil");
        assertEq(p.lpLossUsdc, 0, "flat book does not lose");
        // savings truncated, not rounded: (10,000e6 − 6,667e6) × 10,000 / 10,000e6 = 3,333.3 → 3,333
        assertEq(SpanMathLib.capitalSavingsBps(10_000e6, 6_667e6), 3_333, "savings floor");
        // signed floor: rounds toward minus infinity, never toward zero
        // −74,999.999999 USDC / 10,000 bps: floor −7,500,000; truncation toward zero would say −7,499,999
        assertEq(SpanMathLib.signedFloorDiv(-74_999_999_999, 10_000), -7_500_000, "floor toward minus infinity");
    }

    function test_CapitalSavingsBps_zeroIm() public pure {
        assertEq(SpanMathLib.capitalSavingsBps(0, 0), 0);
        assertEq(SpanMathLib.capitalSavingsBps(100e6, 0), 10_000);
    }

    function test_GasBudget_evaluateSpan16() public {
        uint256 gasBefore = gasleft();
        SpanMathLib.evaluateSpan16(LP_01, SHORT_01);
        assertLt(gasBefore - gasleft(), 31_000, "evaluateSpan16 gas budget 30k (+console slack)");
    }

    function test_GasBudget_previewShockUnwind() public {
        uint256 gasBefore = gasleft();
        SpanMathLib.previewShockUnwind(LP_01, SHORT_01, POSTED_01, int256(-3_000), 150);
        assertLt(gasBefore - gasleft(), 9_000, "previewShockUnwind gas budget 8k");
    }
}
