// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {SpanMathLib} from "./SpanMathLib.sol";
import {IAqua} from "./interfaces/IAqua.sol";
import {IClearingMarginEngine} from "./interfaces/IClearingMarginEngine.sol";
import {IShortHedgeAdapter} from "./interfaces/IShortHedgeAdapter.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ClearingAquaApp — a custom 1inch AquaApp that nets an LP plus a short hedge.
/// @notice The trader ships a virtual USDC balance to this app, opens a book,
/// and the crash settles both legs from the same virtual balance: quote ==
/// execution. The app holds no token custody outside the settle call.
contract ClearingAquaApp is IClearingMarginEngine, ReentrancyGuard {
    using SpanMathLib for uint256;
    using SafeERC20 for IERC20;

    // ── Immutables ───────────────────────────────────────────────────
    IAqua public immutable AQUA;
    address public immutable USDC;
    address public immutable HEDGE_ADAPTER;
    address public immutable FEE_COLLECTOR;
    bytes32 public immutable POOL_ID;
    uint64 public immutable INITIAL_MARK_PRICE_USDC;

    // ── Parameter constants (Section 4.2) ────────────────────────────
    uint256 internal constant MIN_LP_NOTIONAL_USDC = 1_000e6;
    uint256 internal constant MAX_LP_NOTIONAL_USDC = 10_000_000e6;
    uint256 internal constant MAX_HEDGE_RATIO_BPS = 10_000;
    int256 internal constant MIN_SHOCK_BPS = -3_000;
    int256 internal constant MAX_SHOCK_BPS = 2_000;
    uint64 internal constant MIN_MARK_PRICE_USDC = 1e6;
    uint64 internal constant MAX_MARK_PRICE_USDC = 1_000_000e6;

    // ── Structs ──────────────────────────────────────────────────────
    struct PositionBook {
        uint128 lpNotionalUsdc;
        uint128 shortNotionalUsdc;
        uint128 postedMarginUsdc;
        uint64 entrySpotPriceUsdc;
        uint64 lastUpdateTimestamp;
        bytes32 aquaStrategyHash;
        bool isActive;
    }

    // ── State ────────────────────────────────────────────────────────
    address public owner;
    address public hook; // set exactly once
    uint64 public markPriceUsdc;
    mapping(address => PositionBook) public books;
    mapping(address => mapping(address => bool)) public keepers;
    uint256 public totalBadDebtUsdc;
    uint256 public totalFeesUsdc;
    uint256 public totalLpLossSettledUsdc;

    // ── Events ───────────────────────────────────────────────────────
    event BookOpened(address indexed trader, bytes32 indexed aquaStrategyHash, uint128 lpNotionalUsdc, uint128 shortNotionalUsdc, uint128 postedMarginUsdc, uint256 netInitialMarginUsdc);
    event BookUnwound(address indexed trader, bytes32 indexed aquaStrategyHash, int256 priceShockBps, uint256 lpLossUsdc, uint256 shortGainUsdc, uint256 nettedOffsetUsdc, uint256 protocolFeeUsdc, uint256 traderMarginUsedUsdc, uint256 remainingEquityUsdc, uint256 badDebtUsdc);
    event MarginAdded(address indexed trader, uint256 amountUsdc, uint256 newPostedMarginUsdc);
    event KeeperSet(address indexed trader, address indexed keeper, bool allowed);
    event BookClosed(address indexed trader, bytes32 indexed aquaStrategyHash);
    event BadDebtRealized(address indexed trader, uint256 amountUsdc);
    event MarkPriceUpdated(bytes32 indexed poolId, uint64 newSpotPriceUsdc, address indexed hook);
    event FeeCollected(address indexed trader, uint256 amountUsdc);
    event LpLossSettled(address indexed trader, uint256 amountUsdc);
    event HookSet(address indexed hook);
    event OwnershipRenounced(address indexed previousOwner);

    // ── Errors ───────────────────────────────────────────────────────
    error BookAlreadyActive();
    error InvalidNotional();
    error OverHedged();
    error InsufficientPostedMargin(uint128 posted, uint256 required);
    error StrategyInactive();
    error StrategyDocked();
    error InsufficientAquaBalance(uint256 have, uint256 want);
    error BookNotActive(address trader);
    error ShockOutOfRange(int256 shock);
    error UnsupportedShockDirection(int256 shock);
    error NotAuthorized(address caller);
    error NotHook(address caller);
    error HookAlreadySet();
    error ZeroAddress();
    error PriceOutOfBounds(uint64 price);
    error BookStillActive(address trader);
    error NoActiveBook(address trader);
    error ZeroAmount();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized(msg.sender);
        _;
    }

    constructor(
        IAqua aqua,
        address usdc,
        address hedgeAdapter,
        address feeCollector,
        bytes32 poolId,
        uint64 initialMarkPriceUsdc
    ) {
        if (address(aqua) == address(0) || usdc == address(0) || hedgeAdapter == address(0) || feeCollector == address(0))
            revert ZeroAddress();
        if (initialMarkPriceUsdc < MIN_MARK_PRICE_USDC || initialMarkPriceUsdc > MAX_MARK_PRICE_USDC)
            revert PriceOutOfBounds(initialMarkPriceUsdc);
        AQUA = aqua;
        USDC = usdc;
        HEDGE_ADAPTER = hedgeAdapter;
        FEE_COLLECTOR = feeCollector;
        POOL_ID = poolId;
        INITIAL_MARK_PRICE_USDC = initialMarkPriceUsdc;
        markPriceUsdc = initialMarkPriceUsdc;
        owner = msg.sender;
    }

    // ── Admin: one hook, then renounce ───────────────────────────────
    function setHook(address hook_) external onlyOwner {
        if (hook != address(0)) revert HookAlreadySet();
        if (hook_ == address(0)) revert ZeroAddress();
        hook = hook_;
        emit HookSet(hook_);
    }

    function renounceOwnership() external onlyOwner {
        address previous = owner;
        owner = address(0);
        emit OwnershipRenounced(previous);
    }

    // ── books: open / quote / settle ─────────────────────────────────
    /// Open a cross-margined book. The trader must have shipped `posted`
    /// into the Aqua strategy for this app; no token ever transfers here.
    function openBook(uint128 lpNotionalUsdc, uint128 shortNotionalUsdc, uint128 postedMarginUsdc, bytes32 aquaStrategyHash)
        external
        returns (SpanMathLib.SpanResult memory span)
    {
        if (books[msg.sender].isActive) revert BookAlreadyActive();
        if (lpNotionalUsdc < MIN_LP_NOTIONAL_USDC || lpNotionalUsdc > MAX_LP_NOTIONAL_USDC)
            revert InvalidNotional();
        if (uint256(shortNotionalUsdc) * MAX_HEDGE_RATIO_BPS / SpanMathLib.BPS > lpNotionalUsdc)
            revert OverHedged();

        span = SpanMathLib.evaluateSpan16(lpNotionalUsdc, shortNotionalUsdc);
        if (postedMarginUsdc < span.netInitialMarginUsdc)
            revert InsufficientPostedMargin(postedMarginUsdc, span.netInitialMarginUsdc);

        (uint256 bal, uint8 count) = AQUA.rawBalances(msg.sender, address(this), aquaStrategyHash, USDC);
        if (count == 0) revert StrategyInactive();
        if (count == 0xff) revert StrategyDocked();
        if (bal < postedMarginUsdc) revert InsufficientAquaBalance(bal, postedMarginUsdc);

        books[msg.sender] = PositionBook({
            lpNotionalUsdc: lpNotionalUsdc,
            shortNotionalUsdc: shortNotionalUsdc,
            postedMarginUsdc: postedMarginUsdc,
            entrySpotPriceUsdc: markPriceUsdc,
            lastUpdateTimestamp: uint64(block.timestamp),
            aquaStrategyHash: aquaStrategyHash,
            isActive: true
        });
        emit BookOpened(msg.sender, aquaStrategyHash, lpNotionalUsdc, shortNotionalUsdc, postedMarginUsdc, span.netInitialMarginUsdc);
    }

    /// Pure view openBook for the UI quote path.
    function quoteOpen(uint128 lpNotionalUsdc, uint128 shortNotionalUsdc, uint128 postedMarginUsdc)
        external
        pure
        returns (SpanMathLib.SpanResult memory span, bool acceptable, uint256 requiredMarginUsdc)
    {
        span = SpanMathLib.evaluateSpan16(lpNotionalUsdc, shortNotionalUsdc);
        bool bounds = lpNotionalUsdc >= MIN_LP_NOTIONAL_USDC && lpNotionalUsdc <= MAX_LP_NOTIONAL_USDC;
        bool notOverHedged = uint256(shortNotionalUsdc) * MAX_HEDGE_RATIO_BPS / SpanMathLib.BPS <= lpNotionalUsdc;
        bool posted = postedMarginUsdc >= span.netInitialMarginUsdc;
        acceptable = bounds && notOverHedged && posted;
        requiredMarginUsdc = span.netInitialMarginUsdc;
    }

    function quoteUnwind(address trader, int256 priceShockBps)
        external
        view
        returns (SpanMathLib.UnwindPreview memory)
    {
        PositionBook memory b = books[trader];
        if (!b.isActive) revert BookNotActive(trader);
        if (priceShockBps < MIN_SHOCK_BPS || priceShockBps > MAX_SHOCK_BPS) revert ShockOutOfRange(priceShockBps);
        return SpanMathLib.previewShockUnwind(b.lpNotionalUsdc, b.shortNotionalUsdc, b.postedMarginUsdc, priceShockBps, SpanMathLib.VOL_1_BPS);
    }

    /// The atomic dual-leg settlement. Only the trader or an authorized
    /// keeper. Downward shocks only — the hedge must gain so the adapter
    /// can push it in. Marks the book inactive before any external call.
    function unwind(address trader, int256 priceShockBps)
        external
        nonReentrant
        returns (SpanMathLib.UnwindPreview memory prev, bytes32 orderHash)
    {
        if (msg.sender != trader && !keepers[trader][msg.sender]) revert NotAuthorized(msg.sender);
        if (priceShockBps < MIN_SHOCK_BPS || priceShockBps > MAX_SHOCK_BPS) revert ShockOutOfRange(priceShockBps);
        if (priceShockBps > 0) revert UnsupportedShockDirection(priceShockBps);
        PositionBook storage b = books[trader];
        if (!b.isActive) revert BookNotActive(trader);

        prev = SpanMathLib.previewShockUnwind(b.lpNotionalUsdc, b.shortNotionalUsdc, b.postedMarginUsdc, priceShockBps, SpanMathLib.VOL_1_BPS);
        b.lastUpdateTimestamp = uint64(block.timestamp);

        // 1. The hedge leg: the adapter pushes its gain into the virtual balance.
        IShortHedgeAdapter(HEDGE_ADAPTER).realizeGainToAqua(trader, address(this), b.aquaStrategyHash, prev.shortGainUsdc);

        // 2. Verify the settle amount actually sits on the virtual balance
        //    (posted + push - already charged), then pull lp_loss + fee in
        //    and route the loss back out to the adapter.
        uint256 pulled = prev.lpLossUsdc + prev.protocolFeeUsdc;
        AQUA.pull(trader, b.aquaStrategyHash, USDC, pulled, address(this));

        if (prev.badDebtUsdc == 0 && prev.protocolFeeUsdc > 0) {
            IERC20(USDC).safeTransfer(FEE_COLLECTOR, prev.protocolFeeUsdc);
            totalFeesUsdc += prev.protocolFeeUsdc;
            emit FeeCollected(trader, prev.protocolFeeUsdc);
        } else if (prev.badDebtUsdc > 0) {
            totalBadDebtUsdc += prev.badDebtUsdc;
            emit BadDebtRealized(trader, prev.badDebtUsdc);
        }

        // the LP leg's loss is debited; the demo adapter is the counterparty
        // that physically receives those tokens (§6.4)
        IERC20(USDC).safeTransfer(HEDGE_ADAPTER, prev.lpLossUsdc);

        IShortHedgeAdapter(HEDGE_ADAPTER).receiveLpLoss(prev.lpLossUsdc);
        totalLpLossSettledUsdc += prev.lpLossUsdc;
        emit LpLossSettled(trader, prev.lpLossUsdc);

        b.isActive = false;
        orderHash = keccak256(
            abi.encode(trader, b.aquaStrategyHash, priceShockBps, prev.lpLossUsdc, prev.shortGainUsdc, prev.protocolFeeUsdc)
        );
        emit BookUnwound(
            trader,
            b.aquaStrategyHash,
            priceShockBps,
            prev.lpLossUsdc,
            prev.shortGainUsdc,
            prev.nettedOffsetUsdc,
            prev.protocolFeeUsdc,
            prev.traderMarginUsedUsdc,
            prev.remainingEquityUsdc,
            prev.badDebtUsdc
        );
    }

    function addMargin(uint256 amountUsdc) external {
        PositionBook storage b = books[msg.sender];
        if (!b.isActive) revert BookNotActive(msg.sender);
        if (amountUsdc == 0) revert ZeroAmount();
        (uint256 bal, uint8 count) = AQUA.rawBalances(msg.sender, address(this), b.aquaStrategyHash, USDC);
        if (count == 0) revert StrategyInactive();
        if (count == 0xff) revert StrategyDocked();
        if (bal < uint256(b.postedMarginUsdc) + amountUsdc)
            revert InsufficientAquaBalance(bal, uint256(b.postedMarginUsdc) + amountUsdc);
        b.postedMarginUsdc = uint128(b.postedMarginUsdc + amountUsdc);
        b.lastUpdateTimestamp = uint64(block.timestamp);
        emit MarginAdded(msg.sender, amountUsdc, b.postedMarginUsdc);
    }

    function setKeeper(address keeper, bool allowed) external {
        if (keeper == address(0)) revert ZeroAddress();
        keepers[msg.sender][keeper] = allowed;
        emit KeeperSet(msg.sender, keeper, allowed);
    }

    /// The hook's conservative guard: beforeRemoveLiquidity must pass this.
    function previewEquityAfterWithdrawal(address trader, uint256 withdrawnUsd)
        external
        view
        returns (uint256 postEquityUsdc, uint256 requiredInitialMarginUsdc, bool isActive)
    {
        PositionBook memory b = books[trader];
        if (!b.isActive) return (0, 0, false);
        (postEquityUsdc, requiredInitialMarginUsdc, ) =
            SpanMathLib.previewWithdrawal(b.lpNotionalUsdc, b.shortNotionalUsdc, b.postedMarginUsdc, withdrawnUsd);
        isActive = true;
    }

    function bookEntryPrice(address trader) external view returns (uint64) {
        return books[trader].entrySpotPriceUsdc;
    }

    function updateMarkPrice(bytes32 poolId, uint64 newSpotPriceUsdc) external {
        if (msg.sender != hook) revert NotHook(msg.sender);
        if (poolId != POOL_ID) revert ShockOutOfRange(int256(0) - 1);
        if (newSpotPriceUsdc < MIN_MARK_PRICE_USDC || newSpotPriceUsdc > MAX_MARK_PRICE_USDC)
            revert PriceOutOfBounds(newSpotPriceUsdc);
        markPriceUsdc = newSpotPriceUsdc;
        emit MarkPriceUpdated(poolId, newSpotPriceUsdc, msg.sender);
    }

    function closeBook() external nonReentrant {
        PositionBook storage b = books[msg.sender];
        if (b.isActive) revert BookStillActive(msg.sender);
        if (b.lpNotionalUsdc == 0) revert NoActiveBook(msg.sender);
        address[] memory tokens = new address[](1);
        tokens[0] = USDC;
        AQUA.dock(address(this), b.aquaStrategyHash, tokens);
        (, uint8 count) = AQUA.rawBalances(msg.sender, address(this), b.aquaStrategyHash, USDC);
        if (count != 0xff) revert StrategyDocked();
        emit BookClosed(msg.sender, b.aquaStrategyHash);
        delete books[msg.sender];
    }

}
