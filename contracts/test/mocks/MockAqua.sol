// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20, ERC20 as OZERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Test token: canonical 6-decimal USDC clone.
contract MockUSDC is OZERC20 {
    constructor(address mintTo) OZERC20("USDC", "USDC") {
        _mint(mintTo, 100_000_000e6);
    }
}

import {IAqua} from "../../src/interfaces/IAqua.sol";

/// A minimal Aqua behavior model: virtual balances per (maker, app, strategy,
/// token) with ship/push/pull/dock/rawBalances, plus balance accounting the
/// app's invariant tests rely on.
contract MockAqua is IAqua {
    struct Slot {
        uint256 balance;
        uint8 count; // 0 inactive, 1 active, 0xff docked
    }

    mapping(address => mapping(address => mapping(bytes32 => mapping(address => Slot)))) public slots;
    IERC20 public immutable USDC;

    event Shipped(address indexed maker, address indexed app, bytes32 indexed strategy, address token, uint256 amount);
    event Pushed(address indexed maker, address indexed app, bytes32 indexed strategy, address token, uint256 amount);
    event Pulled(address indexed maker, address indexed app, bytes32 indexed strategy, address token, uint256 amount, address receiver);
    event Docked(address indexed app, bytes32 indexed strategy, address[] tokens);

    constructor(IERC20 usdc) {
        USDC = usdc;
    }

    function ship(address app, bytes32 strategyHash, address[] calldata tokens, uint256[] calldata amounts) external {
        require(tokens.length == amounts.length);
        for (uint256 i; i < tokens.length; ++i) {
            (, uint8 count) = this.rawBalances(msg.sender, app, strategyHash, tokens[i]);
            require(count == 0, "already active");
            USDC.transferFrom(msg.sender, address(this), amounts[i]);
            slots[msg.sender][app][strategyHash][tokens[i]] = Slot(amounts[i], 1);
            emit Shipped(msg.sender, app, strategyHash, tokens[i], amounts[i]);
        }
    }

    function push(address maker, address app, bytes32 strategyHash, address token, uint256 amount) external {
        // canonical Aqua: push moves the caller's tokens into the vault and
        // credits the maker's virtual balance with them
        USDC.transferFrom(msg.sender, address(this), amount);
        Slot storage s = slots[maker][app][strategyHash][token];
        s.balance += amount;
        if (s.count == 0) s.count = 1;
        emit Pushed(maker, app, strategyHash, token, amount);
    }

    function pull(address maker, bytes32 strategyHash, address token, uint256 amount, address receiver) external {
        // the caller is the app that owns the virtual balance view
        Slot storage s = slots[maker][msg.sender][strategyHash][token];
        require(s.balance >= amount, "insufficient virtual balance");
        s.balance -= amount;
        USDC.transfer(receiver, amount);
        emit Pulled(maker, msg.sender, strategyHash, token, amount, receiver);
    }

    function dock(address app, bytes32 strategyHash, address[] calldata tokens) external {
        // the trader that drove the app (mock simplification; real Aqua
        // carries maker identity on the strategy itself)
        address maker = tx.origin;
        for (uint256 i; i < tokens.length; ++i) {
            Slot storage s = slots[maker][app][strategyHash][tokens[i]];
            if (s.count != 0) {
                s.count = 0xff; // sealed; the balance is already streamed back
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
