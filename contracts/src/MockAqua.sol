// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20, ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IAqua} from "./interfaces/IAqua.sol";

/// @title MockAqua — a local standalone Aqua for chains where canonical Aqua
/// is absent (Base Sepolia per F-06: 0 bytes there). Implements exactly the
/// IAqua surface the app binds to: virtual balances per
/// (maker, app, strategy, token) with ship/push/pull/dock/rawBalances.
/// `§8.2` names it the SEPOLIA fallback; it disables the 1inch track claim
/// but keeps the Uniswap proof honest.
contract MockAqua is IAqua {
    IERC20 public immutable TOKEN; // the demo's USDC
    mapping(address => mapping(address => mapping(bytes32 => mapping(address => Slot)))) internal slots;

    /** Virtual balance slot state: count is 0 (inactive), 1 (active), or 0xff (docked). */
    struct Slot {
        uint256 balance;
        uint8 count;
    }

    event Shipped(address indexed maker, address indexed app, bytes32 indexed strategyHash, address token, uint256 amount);
    event Pushed(address indexed maker, address indexed app, bytes32 indexed strategyHash, address token, uint256 amount);
    event Pulled(address indexed maker, address indexed app, bytes32 indexed strategyHash, address token, uint256 amount, address receiver);
    event Docked(address indexed app, bytes32 indexed strategyHash, address[] tokens);

    error AlreadyActive(address maker, address app, bytes32 strategyHash, address token);
    error InsufficientVirtualBalance(uint256 have, uint256 want);

    constructor(IERC20 token_) {
        TOKEN = token_;
    }

    function ship(address app, bytes32 strategyHash, address[] calldata tokens, uint256[] calldata amounts) external {
        require(tokens.length == amounts.length, "Aqua: token/amount length mismatch");
        for (uint256 i; i < tokens.length; ++i) {
            (, uint8 count) = this.rawBalances(msg.sender, app, strategyHash, tokens[i]);
            if (count != 0) revert AlreadyActive(msg.sender, app, strategyHash, tokens[i]);
            TOKEN.transferFrom(msg.sender, address(this), amounts[i]);
            slots[msg.sender][app][strategyHash][tokens[i]] = Slot(amounts[i], 1);
            emit Shipped(msg.sender, app, strategyHash, tokens[i], amounts[i]);
        }
    }

    function push(address maker, address app, bytes32 strategyHash, address token, uint256 amount) external {
        TOKEN.transferFrom(msg.sender, address(this), amount);
        Slot storage s = slots[maker][app][strategyHash][token];
        s.balance += amount;
        if (s.count == 0) s.count = 1;
        emit Pushed(maker, app, strategyHash, token, amount);
    }

    function pull(address maker, bytes32 strategyHash, address token, uint256 amount, address receiver) external {
        Slot storage s = slots[maker][msg.sender][strategyHash][token];
        if (s.balance < amount) revert InsufficientVirtualBalance(s.balance, amount);
        s.balance -= amount;
        TOKEN.transfer(receiver, amount);
        emit Pulled(maker, msg.sender, strategyHash, token, amount, receiver);
    }

    function dock(address app, bytes32 strategyHash, address[] calldata tokens) external {
        for (uint256 i; i < tokens.length; ++i) {
            Slot storage s = slots[msg.sender][app][strategyHash][tokens[i]];
            if (s.count != 0) {
                s.count = 0xff; // sealed, and the balance is already streamed back
                s.balance = 0;
            }
        }
        emit Docked(app, strategyHash, tokens);
    }

    function rawBalances(address maker, address app, bytes32 strategyHash, address token)
        external
        view
        returns (uint256 balance, uint8 count)
    {
        Slot storage s = slots[maker][app][strategyHash][token];
        return (s.balance, s.count);
    }
}
