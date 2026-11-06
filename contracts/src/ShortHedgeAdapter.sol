// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAqua} from "./interfaces/IAqua.sol";

/// @title ShortHedgeAdapter — the pre-funded demo counterparty for the hedge leg.
/// @notice It pays the short's realized gain into Aqua by pushing from its
/// USDC reserve, and it receives the LP leg's settled loss so the closed demo
/// economy balances. Not a live venue; the README says so explicitly.
contract ShortHedgeAdapter {
    using SafeERC20 for IERC20;

    IAqua public immutable AQUA;
    address public immutable USDC;
    address public immutable APP;
    address public immutable OWNER;

    uint256 public reserveUsdc;
    uint256 public totalGainRealizedUsdc;
    uint256 public totalLpLossReceivedUsdc;

    event ShortGainRealizedToAqua(address indexed maker, address indexed app, bytes32 indexed strategyHash, uint256 amountUsdc);
    event LpLossReceived(address indexed app, uint256 amountUsdc);
    event ReserveFunded(address indexed funder, uint256 amountUsdc);
    event ReserveWithdrawn(address indexed owner, address indexed to, uint256 amountUsdc);

    error NotApp(address caller);
    error NotOwner(address caller);
    error InsufficientReserve(uint256 have, uint256 want);
    error ZeroAmount();
    error ZeroAddress();

    modifier onlyApp() {
        if (msg.sender != APP) revert NotApp(msg.sender);
        _;
    }

    modifier onlyOwnerM() {
        if (msg.sender != OWNER) revert NotOwner(msg.sender);
        _;
    }

    constructor(IAqua aqua, address usdc, address app, address owner_) {
        if (address(aqua) == address(0) || usdc == address(0) || app == address(0) || owner_ == address(0))
            revert ZeroAddress();
        AQUA = aqua;
        USDC = usdc;
        APP = app;
        OWNER = owner_;
    }

    function previewShortGainUsdc(uint256 shortNotionalUsdc, int256 priceShockBps)
        external
        pure
        returns (uint256)
    {
        if (priceShockBps >= 0) return 0;
        return (shortNotionalUsdc * uint256(-priceShockBps)) / 10_000;
    }

    /// Only the app; only inside the settle. Pushes exactly `gainUsdc`.
    function realizeGainToAqua(address maker, address app, bytes32 strategyHash, uint256 gainUsdc)
        external
        onlyApp
        returns (uint256)
    {
        if (app != APP) revert NotApp(app);
        if (gainUsdc == 0) revert ZeroAmount();
        if (gainUsdc > reserveUsdc) revert InsufficientReserve(reserveUsdc, gainUsdc);

        reserveUsdc -= gainUsdc;
        IERC20(USDC).safeIncreaseAllowance(address(AQUA), gainUsdc);
        AQUA.push(maker, APP, strategyHash, USDC, gainUsdc);
        totalGainRealizedUsdc += gainUsdc;
        emit ShortGainRealizedToAqua(maker, APP, strategyHash, gainUsdc);
        return gainUsdc;
    }

    function receiveLpLoss(uint256 lossUsdc) external onlyApp {
        if (lossUsdc == 0) revert ZeroAmount();
        reserveUsdc += lossUsdc;
        totalLpLossReceivedUsdc += lossUsdc;
        emit LpLossReceived(APP, lossUsdc);
    }

    function fundReserve(uint256 amountUsdc) external onlyOwnerM {
        if (amountUsdc == 0) revert ZeroAmount();
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), amountUsdc);
        reserveUsdc += amountUsdc;
        emit ReserveFunded(msg.sender, amountUsdc);
    }

    function withdrawReserve(uint256 amountUsdc, address to) external onlyOwnerM {
        if (amountUsdc == 0 || to == address(0)) revert ZeroAddress();
        if (amountUsdc > reserveUsdc) revert InsufficientReserve(reserveUsdc, amountUsdc);
        reserveUsdc -= amountUsdc;
        IERC20(USDC).safeTransfer(to, amountUsdc);
        emit ReserveWithdrawn(OWNER, to, amountUsdc);
    }
}
