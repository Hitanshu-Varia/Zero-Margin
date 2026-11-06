// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @dev The surface the v4 hook drives on the margin engine. Kept tight so
/// the hook stays stateless and never calls into more than this.
interface IClearingMarginEngine {
    /// (postEquity, requiredInitialMargin, isActive) for the withdrawal guard.
    function previewEquityAfterWithdrawal(address trader, uint256 withdrawnUsd)
        external
        view
        returns (uint256 postEquityUsdc, uint256 requiredInitialMarginUsdc, bool isActive);

    /// Only the hook calls this; it validates poolId and bounds itself.
    function updateMarkPrice(bytes32 poolId, uint64 newSpotPriceUsdc) external;

    /// The entry price the book was opened at, for conservative valuation.
    function bookEntryPrice(address trader) external view returns (uint64);
}
