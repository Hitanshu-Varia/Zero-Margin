// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title SpanMathLib — the deterministic 16-scenario SPAN-style margin grid.
/// @notice Pure integer math only: no floating point, no storage, no events,
/// no external calls. Rounding rules (Section 4.3/6.1): margin requirements
/// and the protocol fee round UP, credits round DOWN, and every signed PnL
/// division uses floor toward negative infinity, so a loss is never
/// understated by truncation toward zero.
library SpanMathLib {
    // ── Parameters (Section 4.2) ─────────────────────────────────────
    uint256 internal constant BPS = 10_000;
    uint256 internal constant BPS3 = 10_000 * 10_000 * 10_000; // B^3
    uint256 internal constant GAMMA_LP_BPS = 5_000; // γ
    uint256 internal constant BASIS_HAIRCUT_BPS = 500; // h
    uint256 internal constant MAINT_MARGIN_RATIO_BPS = 7_500; // m
    uint256 internal constant ISOLATED_SHORT_IM_BPS = 5_000; // α
    uint256 internal constant ISOLATED_LIQ_PENALTY_BPS = 1_000; // π
    uint256 internal constant NETTED_UNWIND_FEE_BPS = 5; // φ

    int256 internal constant MIN_SHOCK_BPS = -3_000;
    int256 internal constant MAX_SHOCK_BPS = 2_000;

    /// The eight price shocks of the grid, in bps.
    int256 internal constant SHOCK_0_BPS = -3_000;
    int256 internal constant SHOCK_1_BPS = -2_000;
    int256 internal constant SHOCK_2_BPS = -1_000;
    int256 internal constant SHOCK_3_BPS = -500;
    int256 internal constant SHOCK_4_BPS = 0;
    int256 internal constant SHOCK_5_BPS = 500;
    int256 internal constant SHOCK_6_BPS = 1_000;
    int256 internal constant SHOCK_7_BPS = 2_000;
    uint256 internal constant VOL_1_BPS = 150;

    struct SpanResult {
        uint256 isolatedInitialMarginUsdc;
        uint256 worstScenarioLossUsdc;
        uint8 worstScenarioIndex; // 0..15, index = priceShock × 2 + volState
        uint256 basisHaircutUsdc;
        uint256 netInitialMarginUsdc;
        uint256 netMaintenanceMarginUsdc;
        int256[16] scenarioNetPnlUsdc;
        uint256 capitalSavingsBps;
    }

    struct UnwindPreview {
        uint256 lpLossUsdc;
        uint256 shortGainUsdc;
        uint256 nettedOffsetUsdc;
        uint256 protocolFeeUsdc;
        uint256 traderMarginUsedUsdc;
        uint256 remainingEquityUsdc;
        uint256 badDebtUsdc;
    }

    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        return (a + b - 1) / b;
    }

    /// Signed floor division: rounds toward negative infinity, b > 0.
    function signedFloorDiv(int256 a, int256 b) internal pure returns (int256) {
        if (a >= 0) return a / b;
        return -((-a + b - 1) / b);
    }

    /// 1. LP impermanent-loss convexity penalty: floor(N_LP × γ × |δ|² / (2 × B³)).
    function impermanentLossUsdc(uint256 lpNotionalUsdc, uint256 priceShockAbsBps)
        internal
        pure
        returns (uint256)
    {
        uint256 d2 = priceShockAbsBps * priceShockAbsBps;
        return (lpNotionalUsdc * GAMMA_LP_BPS * d2) / (2 * BPS3);
    }

    /// Floor(N_LP × ν / B) — the volatility haircut term, a positive loss.
    function volatilityLossUsdc(uint256 lpNotionalUsdc, uint256 volShockBps)
        internal
        pure
        returns (uint256)
    {
        return (lpNotionalUsdc * volShockBps) / BPS;
    }

    /// Signed LP leg PnL: lp_delta − IL − vol.
    function lpNetPnlUsdc(uint256 lpNotionalUsdc, int256 priceShockBps, uint256 volShockBps)
        internal
        pure
        returns (int256)
    {
        int256 lpDelta = signedFloorDiv(int256(lpNotionalUsdc) * priceShockBps, int256(BPS));
        uint256 abs = priceShockBps < 0 ? uint256(-priceShockBps) : uint256(priceShockBps);
        return lpDelta - int256(impermanentLossUsdc(lpNotionalUsdc, abs)) - int256(volatilityLossUsdc(lpNotionalUsdc, volShockBps));
    }

    /// Signed short leg PnL: −floor_signed(N_S × δ / B).
    function shortNetPnlUsdc(uint256 shortNotionalUsdc, int256 priceShockBps)
        internal
        pure
        returns (int256)
    {
        return -signedFloorDiv(int256(shortNotionalUsdc) * priceShockBps, int256(BPS));
    }

    /// 3. The full grid, exactly the TS engine's sum-of-legs expansion.
    function evaluateSpan16(uint256 lpNotionalUsdc, uint256 shortNotionalUsdc)
        internal
        pure
        returns (SpanResult memory s)
    {
        int256 worst = type(int256).max;

        // per-shock invariants hoisted out of the volatility loop
        for (uint256 k; k < 8; ++k) {
            int256 shock =
                k == 0 ? SHOCK_0_BPS : k == 1 ? SHOCK_1_BPS : k == 2 ? SHOCK_2_BPS : k == 3 ? SHOCK_3_BPS : k == 4 ? SHOCK_4_BPS : k == 5 ? SHOCK_5_BPS : k == 6 ? SHOCK_6_BPS : SHOCK_7_BPS;
            uint256 absShock = shock < 0 ? uint256(-shock) : uint256(shock);
            int256 lpDelta = signedFloorDiv(int256(lpNotionalUsdc) * shock, int256(BPS));
            int256 shortNet = -signedFloorDiv(int256(shortNotionalUsdc) * shock, int256(BPS));
            int256 lessVolZero =
                lpDelta - int256(impermanentLossUsdc(lpNotionalUsdc, absShock));

            int256 net0 = lessVolZero + shortNet; // ν = 0
            int256 net1 =
                (lessVolZero - int256(volatilityLossUsdc(lpNotionalUsdc, VOL_1_BPS))) + shortNet; // ν = 150

            uint256 idx = k * 2;
            s.scenarioNetPnlUsdc[idx] = net0;
            s.scenarioNetPnlUsdc[idx + 1] = net1;
            if (net0 < worst) {
                worst = net0;
                s.worstScenarioIndex = uint8(idx);
            }
            if (net1 < worst) {
                worst = net1;
                s.worstScenarioIndex = uint8(idx + 1);
            }
        }

        // L_SPAN = max(0, −NetPnL(s))
        s.worstScenarioLossUsdc = worst < 0 ? uint256(-worst) : 0;

        // H_basis = ceil(min(N_LP, N_S) × h / B)
        uint256 matched = lpNotionalUsdc < shortNotionalUsdc ? lpNotionalUsdc : shortNotionalUsdc;
        s.basisHaircutUsdc = ceilDiv(matched * BASIS_HAIRCUT_BPS, BPS);

        s.netInitialMarginUsdc = s.worstScenarioLossUsdc + s.basisHaircutUsdc;
        s.netMaintenanceMarginUsdc = ceilDiv(s.netInitialMarginUsdc * MAINT_MARGIN_RATIO_BPS, BPS);

        // 4. IM_isolated = N_LP + ceil(N_S × α / B)
        s.isolatedInitialMarginUsdc =
            lpNotionalUsdc +
            ceilDiv(shortNotionalUsdc * ISOLATED_SHORT_IM_BPS, BPS);

        s.capitalSavingsBps = capitalSavingsBps(s.isolatedInitialMarginUsdc, s.netInitialMarginUsdc);
    }

    /// 6. The cross-leg waterfall for one (δ, ν). Exactly one leg can net a gain.
    function previewShockUnwind(uint256 lpNotionalUsdc, uint256 shortNotionalUsdc, uint256 postedMarginUsdc, int256 priceShockBps, uint256 volShockBps)
        internal
        pure
        returns (UnwindPreview memory p)
    {
        int256 lpNet = lpNetPnlUsdc(lpNotionalUsdc, priceShockBps, volShockBps);
        int256 shortNet = shortNetPnlUsdc(shortNotionalUsdc, priceShockBps);

        if (lpNet < 0 && shortNet >= 0) {
            p.lpLossUsdc = uint256(-(lpNet));
            p.shortGainUsdc = uint256(shortNet);
        } else if (shortNet < 0 && lpNet >= 0) {
            // the short leg is the one losing; the LP gain nets nothing more
            p.lpLossUsdc = uint256(-(shortNet));
            p.shortGainUsdc = uint256(lpNet);
        } else if (lpNet < 0 && shortNet < 0) {
            // both legs lose against each other: they cannot fully offset
            p.lpLossUsdc = uint256(-(lpNet)) + uint256(-(shortNet));
            p.shortGainUsdc = 0;
        } else {
            p.lpLossUsdc = 0;
            p.shortGainUsdc = uint256(shortNet) + uint256(lpNet);
        }

        // netted = min(short_gain, lp_loss)
        p.nettedOffsetUsdc = p.shortGainUsdc < p.lpLossUsdc ? p.shortGainUsdc : p.lpLossUsdc;
        // fee = ceil(N_LP × φ / B)
        p.protocolFeeUsdc = ceilDiv(lpNotionalUsdc * NETTED_UNWIND_FEE_BPS, BPS);
        uint256 residual = p.lpLossUsdc - p.nettedOffsetUsdc;
        uint256 required = residual + p.protocolFeeUsdc;
        uint256 excess = p.shortGainUsdc - p.nettedOffsetUsdc;
        uint256 available = postedMarginUsdc + excess;

        if (available >= required) {
            p.traderMarginUsedUsdc = required;
            p.remainingEquityUsdc = available - required;
            p.badDebtUsdc = 0;
        } else {
            p.traderMarginUsedUsdc = available;
            p.remainingEquityUsdc = 0;
            p.badDebtUsdc = required - available;
        }
    }

    /// Withdrawal guard math, conservative: the book is not marked to market.
    function previewWithdrawal(uint256 lpNotionalUsdc, uint256 shortNotionalUsdc, uint256 postedMarginUsdc, uint256 withdrawnUsd)
        internal
        pure
        returns (uint256 postEquityUsdc, uint256 requiredInitialMarginUsdc, uint256 remainingLpUsdc)
    {
        remainingLpUsdc = lpNotionalUsdc > withdrawnUsd ? lpNotionalUsdc - withdrawnUsd : 0;
        postEquityUsdc = postedMarginUsdc;
        requiredInitialMarginUsdc = evaluateSpan16(remainingLpUsdc, shortNotionalUsdc).netInitialMarginUsdc;
    }

    /// 5. Capital savings in bps, truncated; isolatedIm == 0 maps to 0.
    function capitalSavingsBps(uint256 isolatedIm, uint256 netIm) internal pure returns (uint256) {
        if (isolatedIm == 0) return 0;
        return ((isolatedIm - netIm) * BPS) / isolatedIm;
    }

    /// The 10% isolated liquidation penalty on LP notional.
    function liquidationPenaltyUsdc(uint256 lpNotionalUsdc) internal pure returns (uint256) {
        return (lpNotionalUsdc * ISOLATED_LIQ_PENALTY_BPS) / BPS;
    }
}
