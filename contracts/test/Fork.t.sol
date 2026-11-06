// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {SpanMathLib} from "../src/SpanMathLib.sol";
import {ClearingAquaApp} from "../src/ClearingAquaApp.sol";
import {ShortHedgeAdapter} from "../src/ShortHedgeAdapter.sol";
import {IAqua} from "../src/interfaces/IAqua.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Real onchain fork test against canonical Base + canonical Aqua (FR-10, T-07).
/// Gate: needs `BASE_MAINNET_RPC_URL` (the public https://mainnet.base.org works
/// without credentials) or `--rpc-url http://localhost:8545` against a live anvil
/// fork. Assert the F-06 code sizes first, then mint real USDC through Circle's
/// governance path (masterMinter → configureMinter → mint) and drive the open /
/// push / pull flow against the canonical Aqua registry.
contract AquaForkTest is Test {
    IAqua internal constant AQUA = IAqua(0x1111113CCf1426A8E30e2bfF5E005d929bF6a90a);
    address internal constant POOL_MANAGER = 0x498581fF718922c3f8e6A244956aF099B2652b2b;
    address internal constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    uint256 internal constant EXPECTED_AQUA_SIZE = 5_619; // F-06
    uint256 internal constant EXPECTED_POOL_MANAGER_SIZE = 24_009; // F-06

    address internal masterMinter;
    address internal trader = makeAddr("fork-trader");
    address internal feeCollector = makeAddr("fork-fee-collector");
    bytes32 internal constant STRATEGY = keccak256("FORK-STRATEGY-01");

    function setUp() public {
        // The Base fork is opt-in: foundry 1.7.1's op-revm panics on post-
        // Isthmus Base ("Missing operator fee scalar for isthmus L1 Block"),
        // so `make fork-test` sets BASE_MAINNET_RPC_URL once upstream has
        // that fix; everything else in make test runs fork-free and skips.
        string memory url = vm.envOr("BASE_MAINNET_RPC_URL", string(""));
        if (bytes(url).length == 0) {
            vm.skip(true);
            return;
        }
        vm.createSelectFork(url);
        masterMinter = fetchMasterMinter();
    }

    function fetchMasterMinter() internal returns (address) {
        (bool ok, bytes memory ret) = USDC.call(abi.encodeWithSignature("masterMinter()"));
        require(ok && ret.length == 32, "masterMinter() call failed on the fork");
        return address(uint160(uint256(bytes32(ret))));
    }

    /// F-06: canonical code sizes at the pinned block.
    function test_CanonicalCodeSizes() public view {
        assertTrue(address(USDC).code.length > 0, "USDC exists on the fork");
        assertEq(address(AQUA).code.length, EXPECTED_AQUA_SIZE, "Aqua registry 5,619 bytes");
        assertEq(POOL_MANAGER.code.length, EXPECTED_POOL_MANAGER_SIZE, "PoolManager 24,009 bytes");
        assertTrue(masterMinter != address(0), "masterMinter governance exists");
    }

    /// The full GV-01 flow through canonical Aqua, revealed by its own events (T-07).
    function test_CanonicalAqua_ShipPushPull() public {
        // Circle's governance path: masterMinter → configureMinter → mint
        vm.prank(masterMinter);
        (bool okCfg, ) = USDC.call(abi.encodeWithSignature("configureMinter(address,uint256)", address(this), 1_000_000_000e6));
        require(okCfg, "configureMinter rejected; this is fork-gated governance");
        (bool okM1, ) = USDC.call(abi.encodeWithSignature("mint(address,uint256)", address(trader), 25_000e6));
        require(okM1, "mint to trader rejected");
        (bool okM2, ) = USDC.call(abi.encodeWithSignature("mint(address,uint256)", address(this), 100_000e6));
        require(okM2, "mint to broadcaster rejected");

        // deploy the trio with the canonical registry bound end to end;
        // chain: adapter (with the predicted app) → hook not needed here → app
        address appAddress = vm.computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);
        ShortHedgeAdapter adapter = new ShortHedgeAdapter(AQUA, USDC, appAddress, address(this));
        IERC20(USDC).approve(address(adapter), 100_000e6);
        adapter.fundReserve(100_000e6);
        ClearingAquaApp app = new ClearingAquaApp(AQUA, USDC, address(adapter), feeCollector, bytes32(uint256(1)), 3_000e6);
        require(address(app) == appAddress, "fork deployment drifted off the predicted address");

        // trader ships the posted margin through canonical ship
        address[] memory tokens = new address[](1);
        tokens[0] = USDC;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 25_000e6;
        vm.startPrank(trader);
        IERC20(USDC).approve(address(AQUA), 25_000e6);
        AQUA.ship(address(app), STRATEGY, tokens, amounts);
        vm.stopPrank();

        (uint256 bal, uint8 count) = AQUA.rawBalances(trader, address(app), STRATEGY, USDC);
        assertEq(bal, 25_000e6, "canonical rawBalances after ship (FR-10)");
        assertEq(count, uint8(1), "strategy active");

        SpanMathLib.UnwindPreview memory q =
            SpanMathLib.previewShockUnwind(100_000e6, 95_000e6, 25_000e6, int256(-3_000), SpanMathLib.VOL_1_BPS);
        assertEq(q.remainingEquityUsdc, 19_700e6, "UNWIND-01 preview on the canonical fork");

        // the adapter pushes the hedge gain into Aqua; the canonical event is
        // the maker-facing proof of real token transfer (T-07).
        vm.recordLogs();
        vm.prank(address(app));
        try adapter.realizeGainToAqua(trader, address(app), STRATEGY, 28_500e6) {
            Vm.Log[] memory logs = vm.getRecordedLogs();
            bool sawPushed = false;
            bytes32 pushedTopic = keccak256("Pushed(address,address,address,address,uint256)");
            for (uint256 i; i < logs.length; ++i) {
                if (logs[i].emitter == address(AQUA) && logs[i].topics.length > 3 && logs[i].topics[0] == pushedTopic) {
                    sawPushed = true;
                }
            }
            assertTrue(sawPushed, "canonical Aqua emitted no Pushed for the 28,500e6 hedge leg");
        } catch (bytes memory reason) {
            console.log("canonical Aqua push selector mismatch on the fork; re-run `cast interface` once the ABI is verified (C.6-1)");
            console.logBytes(reason);
            revert("canonical Aqua push ABI mismatch; needs the C.6 verify step; not a silent skip");
        }
    }
}
