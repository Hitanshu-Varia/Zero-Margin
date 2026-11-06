// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @dev The short hedge leg. In the hackathon build it is a pre-funded demo
/// adapter; the same interface is what a live venue would implement.
interface IShortHedgeAdapter {
    /// Push `gainUsdc` of USDC from the adapter's reserve into the Aqua
    /// virtual balance of `maker` at `app` for `strategyHash`.
    function realizeGainToAqua(address maker, address app, bytes32 strategyHash, uint256 gainUsdc) external returns (uint256);

    /// Accept the LP leg's settled loss so the demo economy closes.
    function receiveLpLoss(uint256 lossUsdc) external;
}
