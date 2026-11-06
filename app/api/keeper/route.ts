/**
 * POST /api/keeper — real onchain open/settle from the server wallet
 * (the burner in .env.local). Operates on the deployed app on Base Sepolia:
 *   op "open"    → aqua.ship + app.openBook at GV-01 amounts
 *   op "unwind"  → app.unwind(trader, shock), returns the real tx hash
 * Every path is honest: when the environment lacks a funded key or the app
 * address, the route degrades with `degraded: true` and the reason named.
 */
import { NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const CHAIN = baseSepolia;

const writeAbi = [{
  name: "openBook",
  type: "function" as const,
  stateMutability: "nonpayable",
  inputs: [
    { name: "lpNotionalUsdc", type: "uint128" },
    { name: "shortNotionalUsdc", type: "uint128" },
    { name: "postedMarginUsdc", type: "uint128" },
    { name: "aquaStrategyHash", type: "bytes32" },
  ],
  outputs: [],
}, {
  name: "unwind",
  type: "function" as const,
  stateMutability: "nonpayable",
  inputs: [
    { name: "trader", type: "address" },
    { name: "priceShockBps", type: "int256" },
  ],
  outputs: [],
}];

const erc20Abi = [{
  name: "approve",
  type: "function" as const,
  stateMutability: "nonpayable",
  inputs: [
    { name: "spender", type: "address" },
    { name: "amount", type: "uint256" },
  ],
  outputs: [{ name: "", type: "bool" }],
}];

const aquaAbi = [{
  name: "ship",
  type: "function" as const,
  stateMutability: "nonpayable",
  inputs: [
    { name: "app", type: "address" },
    { name: "strategyHash", type: "bytes32" },
    { name: "tokens", type: "address[]" },
    { name: "amounts", type: "uint256[]" },
  ],
  outputs: [],
}];

export async function POST(request: Request) {
  let body: { op?: string; shock?: number; postedMarginUsdc?: number };
  try {
    body = (await request.json()) as { op?: string; shock?: number; postedMarginUsdc?: number };
  } catch {
    return NextResponse.json({ ok: false, degraded: true, problems: ["body must be JSON"] }, { status: 400 });
  }

  const privateKey = process.env.DEMO_PRIVATE_KEY ?? "";
  const appAddress = process.env.NEXT_PUBLIC_APP_ADDRESS ?? "";
  const aquaAddress = process.env.NEXT_PUBLIC_AQUA_ADDRESS ?? "";
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "";
  const strategyHash = process.env.NEXT_PUBLIC_STRATEGY_HASH ?? "ZEROMARGIN-DEMO-STRATEGY";

  const missing: string[] = [];
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey) || privateKey === `0x${"0".repeat(64)}`) missing.push("DEMO_PRIVATE_KEY");
  if (!/^0x[0-9a-fA-F]{40}$/.test(appAddress)) missing.push("NEXT_PUBLIC_APP_ADDRESS");
  if (!/^0x[0-9a-fA-F]{40}$/.test(aquaAddress)) missing.push("NEXT_PUBLIC_AQUA_ADDRESS");
  if (!/^0x[0-9a-fA-F]{40}$/.test(usdcAddress)) missing.push("NEXT_PUBLIC_USDC_ADDRESS");
  if (missing.length > 0) {
    return NextResponse.json({
      ok: false,
      degraded: true,
      problems: [`onchain execution disabled; missing ${missing.join(", ")} in .env.local`],
    }, { status: 200 });
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const wallet = createWalletClient({ account, chain: CHAIN, transport: http(SEPOLIA_RPC) });

  const shock = Number.isFinite(body.shock) ? Number(body.shock) : -3000;

  try {
    if (body.op === "unwind") {
      const tx = await wallet.writeContract({
        address: appAddress as `0x${string}`,
        abi: writeAbi,
        functionName: "unwind",
        args: [account.address as `0x${string}`, BigInt(shock)],
      });
      return NextResponse.json({
        ok: true,
        source: "onchain",
        op: "unwind",
        tx,
        explorer: `https://sepolia.basescan.org/tx/${tx}`,
      });
    }

    if (body.op === "open") {
      const posted = Number.isFinite(body.postedMarginUsdc) ? Math.trunc(body.postedMarginUsdc!!) : 25_000;
      // 1. approve (idempotent), 2. ship (a strategy may already be active —
      //    the deploy seed shipped it; AlreadyActive is benign), 3. open
      try {
        await wallet.writeContract({
          address: usdcAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [aquaAddress as `0x${string}`, BigInt(posted) * 1_000_000n],
        });
      } catch { /* an active approval already stands */ }
      try {
        await wallet.writeContract({
          address: aquaAddress as `0x${string}`,
          abi: aquaAbi,
          functionName: "ship",
          args: [appAddress as `0x${string}`, toHash(strategyHash), [usdcAddress as `0x${string}`], [BigInt(posted) * 1_000_000n]],
        });
      } catch (err) {
        const sig = (err as { cause?: { signature?: string } }).cause?.signature;
        if (sig !== "0xda0c994b") throw err; // the strategy was already shipped by the seed run
      }
      const open = await wallet.writeContract({
        address: appAddress as `0x${string}`,
        abi: writeAbi,
        functionName: "openBook",
        args: [
          100_000n * 1_000_000n,
          95_000n * 1_000_000n,
          BigInt(posted) * 1_000_000n,
          toHash(strategyHash),
        ],
      });
      return NextResponse.json({
        ok: true,
        source: "onchain",
        op: "open",
        txs: { open },
        explorer: `https://sepolia.basescan.org/tx/${open}`,
      });
    }

    return NextResponse.json({ ok: false, degraded: true, problems: [`unknown op ${body.op ?? ""}`] }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const details = (err as { details?: string; cause?: { message?: string; details?: string } }).cause?.details ?? (err as { details?: string }).details ?? "";
    const fundedHint = /balance|gas/i.test(message) ? "the burner has no Sepolia gas; fund it and retry" : message.slice(0, 220);
    return NextResponse.json({
      ok: false,
      degraded: false,
      problems: [`broadcast failed: ${fundedHint}`, `raw: ${details.slice(0, 220)}`],
    }, { status: 200 });
  }
}

function toHash(text: string): `0x${string}` {
  // ALWAYS hex, never raw ASCII — the "0xZEROMARGIN…" string was invalid.
  const ascii = Buffer.from(text, "utf8").toString("hex").padEnd(64, "0");
  return `0x${ascii}` as `0x${string}`;
}
