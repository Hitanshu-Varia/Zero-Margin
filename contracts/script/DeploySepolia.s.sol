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
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";

/// @dev Deploys the demo trio on a testnet where canonical Aqua is absent
/// (Base Sepolia per F-06): a local MockAqua plus a demo USDC, then the
/// deterministic adapter → app chain, then the mined hook. All addresses
/// print (FR-25). Requires `DEMO_PRIVATE_KEY` funded with testnet gas.
///
/// `make deploy-testnet`
contract DeploySepolia is Script {
    uint160 internal constant REQUIRED_FLAGS = 0x240;
    address internal CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function _consoleReport(address aqua, address usdc, address app, address adapter, address hook, address poolManager, bytes32 poolId) internal pure {
        console.log("MockAqua               ", aqua);
        console.log("DemoUSDC               ", usdc);
        console.log("ClearingAquaApp        ", app);
        console.log("ShortHedgeAdapter      ", adapter);
        console.log("PortfolioMarginHook    ", hook);
        console.log("POOL_MANAGER           ", poolManager);
        console.log("demo trader            ", "see broadcast receipts");

        console.log("demo strategy hash     ", vm.toString(keccak256("ZEROMARGIN-DEMO-STRATEGY")));
        console.log("pool id (app)          ", vm.toString(poolId));
    }

    function run() external returns (address aqua_, address demoUsdc_, address adapter_, address app_, address hook_, address trader_) {
        uint256 hedgeReserve = vm.envOr("DEMO_HEDGE_RESERVE_USDC", uint256(100_000e6));
        address demoTrader = vm.envOr("DEMO_TRADER", address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)); // anvil account 0 on setup

        vm.startBroadcast();

        // 1. the demo USDC and the local Aqua it moves through
        address broadcaster = msg.sender;
        MockUSDC demoUsdc = new MockUSDC(broadcaster);
        MockAqua aqua = new MockAqua(demoUsdc);

        // 2. deterministic chain: adapter → app, each at its next nonce
        address appAddress = vm.computeCreateAddress(broadcaster, vm.getNonce(broadcaster) + 1);
        ShortHedgeAdapter adapter = new ShortHedgeAdapter(IAqua(address(aqua)), address(demoUsdc), appAddress, broadcaster);
        IERC20(address(demoUsdc)).approve(address(adapter), hedgeReserve);
        adapter.fundReserve(hedgeReserve);

        // 3. mined hook + the app that owns it
        bytes32 poolId = keccak256("zeromargin.sepolia-demo-pool-1");
        (address hookAddress, bytes32 hookSalt) = HookMiner.find(
            CREATE2_DEPLOYER,
            REQUIRED_FLAGS,
            type(PortfolioMarginHook).creationCode,
            abi.encode(IClearingMarginEngine(appAddress), vm.envAddress("POOL_MANAGER_ADDRESS"), poolId, address(demoUsdc))
        );
        PortfolioMarginHook hook = new PortfolioMarginHook{salt: hookSalt}(
            IClearingMarginEngine(appAddress),
            IPoolManager(vm.envAddress("POOL_MANAGER_ADDRESS")),
            poolId,
            address(demoUsdc)
        );
        require(address(hook) == hookAddress, "CREATE2 mismatch: mined args drifted");

        ClearingAquaApp app = new ClearingAquaApp(
            IAqua(address(aqua)),
            address(demoUsdc),
            address(adapter),
            broadcaster, // fee collector for the demo
            poolId,
            3_000e6
        );
        app.setHook(address(hook));

        // 4. the demo trader's posted margin ships through the real Aqua path
        IERC20(address(demoUsdc)).transfer(demoTrader, 25_000e6);

        vm.stopBroadcast();

        vm.startPrank(demoTrader);
        IERC20(address(demoUsdc)).approve(address(aqua), 25_000e6);
        address[] memory tokens = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        tokens[0] = address(demoUsdc);
        amounts[0] = 25_000e6;
        aqua.ship(address(app), keccak256("ZEROMARGIN-DEMO-STRATEGY"), tokens, amounts);

        // open the demo book: real app state on testnet (GV-01 amounts)
        app.openBook(uint128(100_000e6), uint128(95_000e6), uint128(25_000e6), keccak256("ZEROMARGIN-DEMO-STRATEGY"));
        vm.stopPrank();

       _consoleReport(address(aqua), address(demoUsdc), address(app), address(adapter), address(hook), address(demoUsdc), poolId);

        aqua_ = address(aqua);
        demoUsdc_ = address(demoUsdc);
        adapter_ = address(adapter);
        app_ = address(app);
        hook_ = address(hook);
        trader_ = demoTrader;
    }
}
