// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {ShortHedgeAdapter} from "../src/ShortHedgeAdapter.sol";
import {IAqua} from "../src/interfaces/IAqua.sol";
import {MockAqua, MockUSDC} from "./mocks/MockAqua.sol";

/// The adapter's reserve accounting and access control, including the
/// demo-economy identity: reserve == funded − gained + losses received.
contract ShortHedgeAdapterTest is Test {
    ShortHedgeAdapter internal adapter;
    MockAqua internal aqua;
    MockUSDC internal usdc;
    address internal app = makeAddr("clearing-app");
    address internal trader = makeAddr("trader");
    bytes32 internal constant STRATEGY = keccak256("ADAPTER-STRATEGY");

    function setUp() public {
        usdc = new MockUSDC(address(this));
        aqua = new MockAqua(usdc);
        // the adapter needs the app address; deploy app first is impossible here,
        // so the app placeholder is this test contract (IShortHedgeAdapter caller)
        adapter = new ShortHedgeAdapter(IAqua(address(aqua)), address(usdc), app, address(this));
        usdc.approve(address(adapter), 100_000e6);
        adapter.fundReserve(100_000e6); // reserve 100,000e6 ready to push
    }

    function test_PreviewShortGain_GV01() public view {
        assertEq(adapter.previewShortGainUsdc(95_000e6, int256(-3_000)), 28_500e6, "28,500e6 at minus 3,000");
        assertEq(adapter.previewShortGainUsdc(95_000e6, int256(0)), 0, "no gain at flat");
        assertEq(adapter.previewShortGainUsdc(95_000e6, int256(1_000)), 0, "no gain upward");
    }

    function test_RealizeGain_pushes_into_Aqua_exactly() public {
        vm.prank(app);
        uint256 gain = adapter.realizeGainToAqua(trader, app, STRATEGY, 28_500e6);
        assertEq(gain, 28_500e6);
        assertEq(adapter.reserveUsdc(), 100_000e6 - 28_500e6);
        assertEq(adapter.totalGainRealizedUsdc(), 28_500e6);
        (uint256 bal, uint8 count) = aqua.rawBalances(trader, app, STRATEGY, address(usdc));
        assertEq(bal, 28_500e6, "the virtual balance carries the gain");
        assertEq(count, uint8(1));
    }

    function test_RealizeGain_onlyApp() public {
        vm.expectRevert(abi.encodeWithSelector(ShortHedgeAdapter.NotApp.selector, address(this)));
        adapter.realizeGainToAqua(trader, app, STRATEGY, 28_500e6);
    }

    function test_ReceiveLpLoss_closes_the_economy() public {
        vm.prank(app);
        adapter.realizeGainToAqua(trader, app, STRATEGY, 28_500e6);
        assertEq(adapter.reserveUsdc(), 100_000e6 - 28_500e6);
        vm.prank(app);
        adapter.receiveLpLoss(33_750e6);
        assertEq(adapter.reserveUsdc(), 100_000e6 - 28_500e6 + 33_750e6);
        assertEq(adapter.totalLpLossReceivedUsdc(), 33_750e6);
        // the walk funds a second settle without a top-up
        vm.prank(app);
        adapter.realizeGainToAqua(trader, app, STRATEGY, 10_000e6);
        assertEq(adapter.reserveUsdc(), 100_000e6 - 38_500e6 + 33_750e6);
    }

    function test_ReceiveLpLoss_onlyApp() public {
        vm.expectRevert(abi.encodeWithSelector(ShortHedgeAdapter.NotApp.selector, address(this)));
        adapter.receiveLpLoss(33_750e6);
    }

    function test_ReserveGuard_reverts_overPush() public {
        ShortHedgeAdapter broke = new ShortHedgeAdapter(IAqua(address(aqua)), address(usdc), app, address(this));
        vm.expectRevert(abi.encodeWithSelector(ShortHedgeAdapter.InsufficientReserve.selector, 0, 28_500e6));
        vm.prank(app);
        broke.realizeGainToAqua(trader, app, STRATEGY, 28_500e6);
    }

    function test_FundAndWithdraw_ownerOnly() public {
        usdc.approve(address(adapter), 100_000e6);
        adapter.fundReserve(100_000e6);
        // setUp already funded 100,000e6; both walk in
        assertEq(adapter.reserveUsdc(), 200_000e6);
        vm.expectRevert(abi.encodeWithSelector(ShortHedgeAdapter.NotOwner.selector, trader));
        vm.prank(trader);
        adapter.withdrawReserve(100_000e6, trader);
        adapter.withdrawReserve(100_000e6, address(this));
        assertEq(adapter.reserveUsdc(), 100_000e6);
        // the round trip: this wallet minted 100M, funded twice (2×100k), got 100k back
        assertEq(usdc.balanceOf(address(this)), 100_000_000e6 - 100_000e6);
    }

    function test_ZeroAmounts_revert() public {
        vm.prank(app);
        vm.expectRevert(ShortHedgeAdapter.ZeroAmount.selector);
        adapter.realizeGainToAqua(trader, app, STRATEGY, 0);
        vm.prank(app);
        vm.expectRevert(ShortHedgeAdapter.ZeroAmount.selector);
        adapter.receiveLpLoss(0);
    }
}
