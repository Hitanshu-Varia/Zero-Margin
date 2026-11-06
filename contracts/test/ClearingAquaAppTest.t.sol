// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SpanMathLib} from "../src/SpanMathLib.sol";
import {ClearingAquaApp} from "../src/ClearingAquaApp.sol";
import {ShortHedgeAdapter} from "../src/ShortHedgeAdapter.sol";
import {IAqua} from "../src/interfaces/IAqua.sol";
import {MockAqua, MockUSDC} from "./mocks/MockAqua.sol";

/// The full demo book flow against the real app contract, offline via MockAqua.
/// Golden vectors asserted at each step (Section 4.7, 4.8).
contract ClearingAquaAppTest is Test {
    ClearingAquaApp internal app;
    ShortHedgeAdapter internal adapter;
    MockAqua internal aqua;
    IERC20 internal usdc;

    address internal trader = makeAddr("trader");
    address internal keeper = makeAddr("keeper");
    address internal feeCollector = makeAddr("fee-collector");
    bytes32 internal constant STRATEGY = keccak256("GOLDEN-STRATEGY-01");

    function setUp() public {
        MockUSDC token = new MockUSDC(address(this));
        usdc = IERC20(address(token));
        aqua = new MockAqua(token);

        // predict the app address so the adapter can bind to it immutably
        address appAddress = computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);
        adapter = new ShortHedgeAdapter(IAqua(address(aqua)), address(token), appAddress, address(this));
        token.approve(address(adapter), 100_000e6);
        adapter.fundReserve(100_000e6);

        app = new ClearingAquaApp(
            IAqua(address(aqua)),
            address(token),
            address(adapter),
            feeCollector,
            bytes32(uint256(1)),
            3_000e6
        );

        // fund: the trader ships 25,000e6 into the strategy
        token.transfer(trader, 50_000e6);
        address[] memory tokens = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        tokens[0] = address(token);
        amounts[0] = 25_000e6;
        vm.startPrank(trader);
        token.approve(address(aqua), 25_000e6);
        aqua.ship(address(app), STRATEGY, tokens, amounts);
        vm.stopPrank();
    }

    function test_GV01_openBook_exact() public {
        SpanMathLib.SpanResult memory span;
        vm.startPrank(trader);
        span = app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);
        vm.stopPrank();

        assertEq(span.isolatedInitialMarginUsdc, 147_500e6);
        assertEq(span.netInitialMarginUsdc, 10_000e6);
        assertEq(book().lpNotionalUsdc, 100_000e6);
        assertEq(uint256(book().entrySpotPriceUsdc), 3_000e6);
    }

    function test_BookAlreadyActive_reverts() public {
        vm.startPrank(trader);
        app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);
        vm.expectRevert(ClearingAquaApp.BookAlreadyActive.selector);
        app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);
        vm.stopPrank();
    }

    function test_OverHedged_reverts() public {
        vm.expectRevert(ClearingAquaApp.OverHedged.selector);
        vm.prank(trader);
        app.openBook(100_000e6, 101_000e6, 25_000e6, STRATEGY);
    }

    function test_InsufficientPostedMargin_reverts() public {
        vm.expectRevert(abi.encodeWithSelector(ClearingAquaApp.InsufficientPostedMargin.selector, 9_999e6, 10_000e6));
        vm.prank(trader);
        app.openBook(100_000e6, 95_000e6, 9_999e6, STRATEGY);
    }

    function test_InsufficientAquaBalance_reverts() public {
        vm.expectRevert(abi.encodeWithSelector(ClearingAquaApp.InsufficientAquaBalance.selector, 25_000e6, 26_000e6));
        vm.prank(trader);
        app.openBook(100_000e6, 95_000e6, 26_000e6, STRATEGY);
    }

    /// quoteOpen returns the same span openBook commits without changing state.
    function test_QuoteOpenMatchesOpen() public {
        (SpanMathLib.SpanResult memory spanQ, bool acceptable, ) = app.quoteOpen(100_000e6, 95_000e6, 25_000e6);
        assertTrue(acceptable);
        assertEq(spanQ.netInitialMarginUsdc, 10_000e6);
        SpanMathLib.SpanResult memory spanO;
        vm.prank(trader);
        spanO = app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);
        assertEq(vm.toString(spanO.netInitialMarginUsdc), vm.toString(spanQ.netInitialMarginUsdc));
        assertEq(vm.toString(spanO.basisHaircutUsdc), vm.toString(spanQ.basisHaircutUsdc));
    }

    /// FR-04: quoteUnwind == unwind result, bit for bit.
    function test_QuoteUnwindMatchesUnwind() public {
        vm.prank(trader);
        app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);

        SpanMathLib.UnwindPreview memory preview = app.quoteUnwind(trader, int256(-3_000));
        vm.prank(trader);
        (SpanMathLib.UnwindPreview memory executed, ) = app.unwind(trader, int256(-3_000));

        assertEq(vm.toString(executed.lpLossUsdc), vm.toString(preview.lpLossUsdc));
        assertEq(vm.toString(executed.shortGainUsdc), vm.toString(preview.shortGainUsdc));
        assertEq(vm.toString(executed.remainingEquityUsdc), vm.toString(preview.remainingEquityUsdc));
        assertEq(vm.toString(executed.badDebtUsdc), vm.toString(preview.badDebtUsdc));
    }

    function test_UNWIND01_settlement_moves_exact_money() public {
        vm.prank(trader);
        app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);
        uint256 reserveBefore = adapter.reserveUsdc();

        vm.expectEmit(true, true, true, true);
        emit ClearingAquaApp.BookUnwound(trader, STRATEGY, int256(-3_000), 33_750e6, 28_500e6, 28_500e6, 50e6, 5_300e6, 19_700e6, 0);
        vm.prank(trader);
        (SpanMathLib.UnwindPreview memory prev, ) = app.unwind(trader, int256(-3_000));

        // the book is dead; the walk is exact
        assertTrue(!book().isActive);
        assertEq(prev.traderMarginUsedUsdc, 5_300e6);
        assertEq(prev.remainingEquityUsdc, 19_700e6);
        assertEq(prev.badDebtUsdc, 0);
        // adapter paid out the 28,500e6 push and received back 33,750e6: net +5,250e6
        assertEq(adapter.reserveUsdc() - reserveBefore, 5_250e6);
        assertEq(adapter.totalGainRealizedUsdc(), 28_500e6);
        assertEq(adapter.totalLpLossReceivedUsdc(), 33_750e6);
        // fee collector got exactly the 50e6 unwind fee
        assertEq(usdc.balanceOf(feeCollector), 50e6);
        // the trader's tokens stay where they were: the equity walks as a
        // virtual balance at Aqua, which reads 25,000 − 5,300 + ... = 19,700e6
        (uint256 bal, uint8 count) = aqua.rawBalances(trader, address(app), STRATEGY, address(usdc));
        assertEq(bal, 19_700e6);
        assertEq(count, uint8(1));
        assertEq(usdc.balanceOf(trader), 25_000e6);
    }

    function test_UnsupportedShockDirection_reverts_on_positive_shock() public {
        vm.prank(trader);
        app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);
        vm.expectRevert(abi.encodeWithSelector(ClearingAquaApp.UnsupportedShockDirection.selector, int256(1_000)));
        vm.prank(trader);
        app.unwind(trader, int256(1_000));
    }

    function test_UnauthorizedUnwind_reverts() public {
        vm.prank(trader);
        app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);
        vm.expectRevert(abi.encodeWithSelector(ClearingAquaApp.NotAuthorized.selector, address(keeper)));
        vm.prank(keeper);
        app.unwind(trader, int256(-3_000));
    }

    function test_Keeper_authorization_is_set_by_the_owner_only() public {
        vm.prank(trader);
        app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);
        vm.prank(trader);
        app.setKeeper(keeper, true);
        vm.prank(keeper);
        SpanMathLib.UnwindPreview memory unused;
        (unused, ) = app.unwind(trader, int256(-3_000));
        assertTrue(!book().isActive);
    }

    /// I13: the app holds no USDC after any settle.
    function test_AppHoldsNoTokensAfterUnwind() public {
        vm.prank(trader);
        app.openBook(100_000e6, 95_000e6, 25_000e6, STRATEGY);
        vm.prank(trader);
        app.unwind(trader, int256(-3_000));
        assertEq(usdc.balanceOf(address(app)), 0);
    }

    function book() internal view returns (ClearingAquaApp.PositionBook memory) {
        (uint128 lpNotional, uint128 shortNotional, uint128 postedMargin, uint64 entrySpot, uint64 lastTs, bytes32 hash, bool active) = app.books(trader);
        return ClearingAquaApp.PositionBook(lpNotional, shortNotional, postedMargin, entrySpot, lastTs, hash, active);
    }
}
