// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {PortfolioMarginHook} from "../src/PortfolioMarginHook.sol";
import {SpanMathLib} from "../src/SpanMathLib.sol";
import {ClearingAquaApp} from "../src/ClearingAquaApp.sol";
import {ShortHedgeAdapter} from "../src/ShortHedgeAdapter.sol";
import {IAqua} from "../src/interfaces/IAqua.sol";
import {IClearingMarginEngine} from "../src/interfaces/IClearingMarginEngine.sol";
import {IPoolManager, PoolId} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";
import {MockAqua, MockUSDC} from "./mocks/MockAqua.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// The hook's guard behavior, driven by a mock pool manager: GV-04 unsafe
/// withdrawal reverts SpanMarginBreach(12,000e6, 16,500e6); a safe removal
/// passes; only the pool manager may call; the mined address low bits are
/// exactly 0x240 (BEFORE_REMOVE_LIQUIDITY | AFTER_SWAP).
contract PortfolioMarginHookTest is Test {
    // 0x240 = BEFORE_REMOVE_LIQUIDITY_FLAG(1<<9) | AFTER_SWAP_FLAG(1<<6)
    uint160 internal constant REQUIRED_FLAGS = 0x240;
    address internal CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    ClearingAquaApp internal app;
    ShortHedgeAdapter internal adapter;
    HookFixture internal manager;
    PortfolioMarginHook internal hook;
    IERC20 internal usdc;
    address internal volatileToken; // WETH stand-in, 18 decimals
    bytes32 internal constant STRATEGY = keccak256("GUARD-STRATEGY-04");
    address internal trader = makeAddr("gv04-trader");

    event SpanMarginBreach(address trader, uint256 postWithdrawalEquityUsdc, uint256 requiredInitialMarginUsdc);

    function setUp() public {
        MockUSDC token = new MockUSDC(address(this));
        usdc = IERC20(address(token));
        MockWETH weth = new MockWETH();
        volatileToken = address(weth);
        manager = new HookFixture();
        manager.setBook(bookIdentity());

        // predicted addresses, standard fixture order:
        address appAddress = computeAppAddress();
        adapter = new ShortHedgeAdapter(IAqua(address(manager.aqua)), address(token), appAddress, address(this));
        token.approve(address(adapter), 200_000e6);
        adapter.fundReserve(100_000e6);

        app = new ClearingAquaApp(
            IAqua(address(manager.aqua)),
            address(token),
            address(adapter),
            feeKeeper(),
            bookIdentity().poolId,
            3_000e6
        );
        assertEquals(address(app), appAddress);

        PoolKey memory poolKey = bookIdentity().poolKey;
        hook = new PortfolioMarginHook(IClearingMarginEngine(address(app)), IPoolManager(address(manager)), poolKey, volatileToken);
        app.setHook(address(hook));

        // GV-04's prestate: the trader shipped 12,000e6 (above 10,000e6 IM of the full book)
        address[] memory tks = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        tks[0] = address(usdc);
        amounts[0] = 12_000e6;
        vm.startPrank(trader);
        token.transfer(trader, 12_000e6);
        token.approve(address(manager.aqua), 12_000e6);
        manager.aqua.ship(address(app), STRATEGY, tks, amounts);
        app.openBook(100_000e6, 95_000e6, 12_000e6, STRATEGY);
        vm.stopPrank();
    }

    function identityPoolKey() internal pure returns (PoolKey memory) {
        return PoolKey({
            currency0: Currency.wrap(address(1)),
            currency1: Currency.wrap(address(typical)),
            fee: uint24(0x800000 | 500),
            tickSpacing: int24(60),
            hooks: IHooks(address(0))
        });
    }
}
