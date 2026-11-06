// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @dev The 1inch Aqua virtual-balance surface used by this product, from the
/// spec's Sponsor integration rules (Section 8.1). Every signature must be
/// re-verified against the canonical registry with `cast interface` on the
/// fork; the addresses are the verified Section C.2 facts, not guesses.
interface IAqua {
    /// Move a virtual balance from the maker's wallet into the strategy.
    function ship(address app, bytes32 strategyHash, address[] calldata tokens, uint256[] calldata amounts) external;

    /// Push `amount` of `token` from the caller into the app's virtual balance for `maker`.
    function push(address maker, address app, bytes32 strategyHash, address token, uint256 amount) external;

    /// Pull `amount` of `token` out of the app's virtual balance back to the system.
    function pull(address maker, bytes32 strategyHash, address token, uint256 amount, address receiver) external;

    /// Park a strategy: virtual balances return to the maker and the slot seals.
    function dock(address app, bytes32 strategyHash, address[] calldata tokens) external;

    /// (balance, slotState) for one maker+app+strategy+token. count == 0xff means docked, 0 means inactive.
    function rawBalances(address maker, address app, bytes32 strategyHash, address token)
        external
        view
        returns (uint256 balance, uint8 count);
}
