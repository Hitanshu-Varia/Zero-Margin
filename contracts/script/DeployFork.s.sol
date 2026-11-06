// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {ClearingAquaApp} from "../src/ClearingAquaApp.sol";
import {PortfolioMarginHook} from "../src/PortfolioMarginHook.sol";
import {ShortHedgeAdapter} from "../src/ShortHedgeAdapter.sol";
import {IAqua} from "../src/interfaces/IAqua.sol";
import {IClearingMarginEngine} from "../src/interfaces/IClearingMarginEngine.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";

/// @dev Deploys the demo trio, wires the one-time hook grant, renounces
/// ownership, and funds the hedge reserve from the broadcaster. All deploy
/// addresses and constructor arguments print (FR-25). The pool key is
/// initialized separately by the fork harness against the mined hook, and
/// DEMO_POOL_ID is the id that pool gets.
///
/// `forge script script/DeployFork.s.sol --fork-url $BASE_MAINNET_RPC_URL --broadcast`
contract DeployFork is Script {
    uint160 internal constant REQUIRED_FLAGS = 0x240;
    address internal CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external returns (address adapter_, address app_, address hook_) {
        IAqua aqua = IAqua(vm.envAddress("AQUA_REGISTRY_ADDRESS"));
        IPoolManager poolManager = IPoolManager(vm.envAddress("UNISWAP_V4_POOL_MANAGER_BASE"));
        address usdc = vm.envAddress("BASE_USDC_ADDRESS");
        address weth = vm.envAddress("BASE_WETH_ADDRESS");
        uint256 hedgeReserve = vm.envOr("DEMO_HEDGE_RESERVE_USDC", uint256(100_000e6));

        vm.startBroadcast();

        // deterministic chain: adapter → hook → app, each predicted via nonce
        // the app is deployed directly beneath the hook; the adapter binds after

        ShortHedgeAdapter adapter = new ShortHedgeAdapter(aqua, usdc, address(1), msg.sender);
        IERC20(usdc).approve(address(adapter), hedgeReserve);
        adapter.fundReserve(hedgeReserve);

        bytes32 poolId = vm.envBytes32("DEMO_POOL_ID");
        (address hookAddress, bytes32 hookSalt) = HookMiner.find(
            CREATE2_DEPLOYER,
            REQUIRED_FLAGS,
            type(PortfolioMarginHook).creationCode,
            abi.encode(poolManager, poolId, weth, msg.sender)
        );
        PortfolioMarginHook hook = new PortfolioMarginHook{salt: hookSalt}(
            poolManager,
            poolId,
            weth,
            msg.sender
        );
        require(address(hook) == hookAddress, "CREATE2 mismatch: constructor args drifted from the mined args");

        ClearingAquaApp app = new ClearingAquaApp(
            aqua,
            usdc,
            address(adapter),
            msg.sender, // the broadcaster is also the fee collector for the demo
            poolId,
            uint64(vm.envOr("INITIAL_MARK_PRICE_USDC", uint256(3_000e6)))
        );
        adapter.bindApp(address(app));
        app.setHook(address(hook));
        hook.setEngine(IClearingMarginEngine(address(app)));
        app.renounceOwnership();
        hook.renounceOwnership();

        vm.stopBroadcast();

        console.log("AQUA_REGISTRY        ", address(aqua));
        console.log("POOL_MANAGER         ", address(poolManager));
        console.log("USDC                 ", usdc);
        console.log("ClearingAquaApp      ", address(app));
        console.log("PortfolioMarginHook  ", address(hook));
        console.log("ShortHedgeAdapter    ", address(adapter));
        console.log("fee collector        ", msg.sender);
        console.log("hedge reserve funded ", hedgeReserve);

        adapter_ = address(adapter);
        app_ = address(app);
        hook_ = address(hook);
    }
}
