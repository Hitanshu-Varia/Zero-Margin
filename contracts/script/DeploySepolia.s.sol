// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {ClearingAquaApp} from "../src/ClearingAquaApp.sol";
import {PortfolioMarginHook} from "../src/PortfolioMarginHook.sol";
import {ShortHedgeAdapter} from "../src/ShortHedgeAdapter.sol";
import {MockAqua} from "../src/MockAqua.sol";
import {MockUSDC} from "../../test/mocks/MockAqua.sol";
import {IAqua} from "../src/interfaces/IAqua.sol";
import {IClearingMarginEngine} from "../src/interfaces/IClearingMarginEngine.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";

/// @dev Deploys the demo trio on a testnet where canonical Aqua is absent
/// (Base Sepolia per F-06): a local MockAqua plus a demo USDC, the mined
/// hook, then the app and the adapter is bound once to the app. All
/// addresses print (FR-25). Requires `DEMO_PRIVATE_KEY` funded with gas.
///
/// `make deploy-testnet`
contract DeploySepolia is Script {
    uint160 internal constant REQUIRED_FLAGS = 0x240;
    address internal CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external returns (address aqua_, address demoUsdc_, address adapter_, address app_, address hook_, address trader_) {
        address broadcaster = msg.sender;
        uint256 hedgeReserve = vm.envOr("DEMO_HEDGE_RESERVE_USDC", uint256(100_000e6));
        address demoTrader = broadcaster; // the book belongs to the keeper wallet
        bytes32 poolId = keccak256("zeromargin.sepolia-demo-pool-1");

        vm.startBroadcast();

        // 1. demo USDC + local Aqua
        MockUSDC demoUsdc = new MockUSDC(broadcaster);
        MockAqua aqua = new MockAqua(demoUsdc);

        // 2. mined hook with no engine yet (circular binding avoided)
        (address hookAddress, bytes32 hookSalt) = HookMiner.find(
            CREATE2_DEPLOYER,
            REQUIRED_FLAGS,
            type(PortfolioMarginHook).creationCode,
            abi.encode(IPoolManager(vm.envAddress("POOL_MANAGER_ADDRESS")), poolId, address(demoUsdc), broadcaster)
        );
        PortfolioMarginHook hook = new PortfolioMarginHook{salt: hookSalt}(
            IPoolManager(vm.envAddress("POOL_MANAGER_ADDRESS")),
            poolId,
            address(demoUsdc),
            broadcaster
        );
        require(address(hook) == hookAddress, "CREATE2 mismatch: mined args drifted");

        // 3. adapter (placeholder app at address(1) until bindApp), then the app
        ShortHedgeAdapter adapter = new ShortHedgeAdapter(IAqua(address(aqua)), address(demoUsdc), address(1), broadcaster);
        ClearingAquaApp app = new ClearingAquaApp(
            IAqua(address(aqua)),
            address(demoUsdc),
            address(adapter),
            broadcaster, // fee collector for the demo
            poolId,
            3_000e6
        );

        // 4. one-time bindings, then ownership is renounced
        app.setHook(address(hook));
        hook.setEngine(IClearingMarginEngine(address(app)));
        adapter.bindApp(address(app));
        app.renounceOwnership();
        hook.renounceOwnership();

        // 5. fund the adapter's reserve from the broadcaster's own USDC
        IERC20(address(demoUsdc)).approve(address(adapter), hedgeReserve);
        adapter.fundReserve(hedgeReserve);

        // 6. ship the margin and open the real GV-01 book for the keeper wallet
        IERC20(address(demoUsdc)).approve(address(aqua), 25_000e6);
        bytes32 demoStrategy = keccak256("ZEROMARGIN-DEMO-STRATEGY");
        address[] memory tokens = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        tokens[0] = address(demoUsdc);
        amounts[0] = 25_000e6;
        aqua.ship(address(app), demoStrategy, tokens, amounts);
        app.openBook(uint128(100_000e6), uint128(95_000e6), uint128(25_000e6), demoStrategy);

        vm.stopBroadcast();

        console.log("MockAqua               ", address(aqua));
        console.log("DemoUSDC               ", address(demoUsdc));
        console.log("ClearingAquaApp        ", address(app));
        console.log("ShortHedgeAdapter      ", address(adapter));
        console.log("PortfolioMarginHook    ", address(hook));
        console.log("demo trader            ", demoTrader);

        aqua_ = address(aqua);
        demoUsdc_ = address(demoUsdc);
        adapter_ = address(adapter);
        app_ = address(app);
        hook_ = address(hook);
        trader_ = demoTrader;
    }
}
