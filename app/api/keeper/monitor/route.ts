/**
 * POST /api/keeper/monitor — the real stop-loss keeper.
 * For every wallet with an equity floor it reads the live book from the
 * deployed app on Base Sepolia, computes what the engine's own settlement
 * would leave the trader with at the tested shock (−3,000 bps), and when
 * that surviving equity falls below the user's floor it executes the real
 * `unwind` signed by the server wallet (which owns the demo book or holds
 * the keeper role). Body: { stops: [{ address, floorUsdc }] } — floor in
 * whole USDC dollars.
 */
import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, type Chain } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { previewShockUnwind } from "@/lib/spanMath";
import { DEMO_BOOK, DEMO_VOL_SHOCK_BPS } from "@/lib/spanMath";

const SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const APP = (process.env.NEXT_PUBLIC_APP_ADDRESS ?? "0xB69b36B9bE40fa8848b1E29A17fCF9Fc316CE875") as `0x${string}`;
const CHAIN = baseSepolia as Chain;

interface Evaluation {
  address: string;
  hasBook: boolean;
  floorUsdc: number;
  kept: boolean;
  fired: boolean;
  reason: string;
  tx: string | null;
  remainingEquityUsdc: string;
}

const readAbi = [{
  name: "books",
  type: "function" as const,
  stateMutability: "view",
  inputs: [{ name: "", type: "address" }],
  outputs: [
    { name: "lpNotionalUsdc", type: "uint128" },
    { name: "shortNotionalUsdc", type: "uint128" },
    { name: "postedMarginUsdc", type: "uint128" },
    { name: "entrySpotPriceUsdc", type: "uint64" },
    { name: "lastUpdateTimestamp", type: "uint64" },
    { name: "aquaStrategyHash", type: "bytes32" },
    { name: "isActive", type: "bool" },
  ],
}, {
  name: "markPriceUsdc",
  type: "function" as const,
  stateMutability: "view",
  inputs: [],
  outputs: [{ name: "", type: "uint64" }],
}];

const writeAbi = [{
  name: "unwind",
  type: "function" as const,
  stateMutability: "nonpayable",
  inputs: [
    { name: "trader", type: "address" },
    { name: "priceShockBps", type: "int256" },
  ],
  outputs: [],
}];

export async function POST(request: Request) {
  let body: { stops?: unknown };
  try {
    body = (await request.json()) as { stops?: unknown };
  } catch {
    return NextResponse.json({ ok: false, problems: ["body must be JSON"] }, { status: 400 });
  }

  const privateKey = process.env.DEMO_PRIVATE_KEY ?? "";
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey) || privateKey === `0x${"0".repeat(64)}`) {
    return NextResponse.json({
      ok: false,
      problems: [
        "server keeper wallet is not configured: paste a real burner private key into .env.local (DEMO_PRIVATE_KEY) to enable real stop-loss execution",
      ],
    }, { status: 200 });
  }

  const stops = (Array.isArray(body.stops) ? body.stops : []).filter(
    (s): s is { address: string; floorUsdc: number } =>
      !!s && typeof s === "object" &&
      /^(0x)?[0-9a-fA-F]{40}$/.test(String((s as { address?: unknown }).address ?? "")) &&
      Number.isFinite(Number((s as { floorUsdc?: unknown }).floorUsdc ?? (s as { stopLossBps?: unknown }).stopLossBps)),
  ).map((s) => ({
    address: String(s.address).toLowerCase().replace(/^0x/, ""),
    floorUsdc: Math.trunc(Number(s.floorUsdc ?? (s as unknown as { stopLossBps: number }).stopLossBps ?? 0)),
  })) as Array<{ address: string; floorUsdc: number }>;

  if (stops.length === 0) {
    return NextResponse.json({ ok: true, evaluations: [], problems: ["no stop-loss floors supplied"] });
  }

  const client = createPublicClient({
    chain: CHAIN,
    transport: http(SEPOLIA_RPC),
  });

  const wallet = createWalletClient({
    account: privateKeyToAccount(privateKey as `0x${string}`),
    chain: CHAIN,
    transport: http(SEPOLIA_RPC),
  });

  const mark = await client.readContract({ address: APP, abi: readAbi, functionName: "markPriceUsdc" });
  const markUsdc = BigInt(String(mark));

  const evaluations: Evaluation[] = [];

  for (const stop of stops.slice(0, 20)) {
    const normalized = (`0x${stop.address}`) as `0x${string}`;
    try {
      const book = (await client.readContract({
        address: APP,
        abi: readAbi,
        functionName: "books",
        args: [normalized],
      })) as [bigint, bigint, bigint, bigint, bigint, `0x${string}`, boolean];
      const [lpNotional, shortNotional, posted] = book;
      if (!book[6] || posted === 0n || lpNotional === 0n) {
        evaluations.push({
          address: normalized,
          hasBook: false,
          floorUsdc: stop.floorUsdc,
          kept: false,
          fired: false,
          reason: "no active book on the app for this address",
          tx: null,
          remainingEquityUsdc: "0",
        });
        continue;
      }

      // engine math mirrors the deployed SpanMathLib exactly (BigInt parity),
      // at the same tested shock the terminal replays
      const q = previewShockUnwind(lpNotional, shortNotional, posted, -3_000n, DEMO_VOL_SHOCK_BPS);

      if (q.badDebtUsdc === 0n && q.remainingEquityUsdc >= BigInt(stop.floorUsdc) * 1_000_000n) {
        evaluations.push({
          address: normalized,
          hasBook: true,
          floorUsdc: stop.floorUsdc,
          kept: true,
          fired: false,
          reason: `surviving equity ${q.remainingEquityUsdc} >= floor ${stop.floorUsdc}e6; kept`,
          tx: null,
          remainingEquityUsdc: q.remainingEquityUsdc.toString(),
        });
        continue;
      }

      // stop fires: the real unwind broadcast from the server wallet
      try {
        const tx = await wallet.writeContract({
          address: APP,
          abi: writeAbi,
          functionName: "unwind",
          args: [normalized, -3_000n],
        });
        evaluations.push({
          address: normalized,
          hasBook: true,
          floorUsdc: stop.floorUsdc,
          kept: false,
          fired: true,
          reason: q.badDebtUsdc > 0n
            ? `surviving equity would leave ${q.remainingEquityUsdc}${q.badDebtUsdc > 0n ? ` with ${q.badDebtUsdc} bad debt` : ""} < floor ${stop.floorUsdc}e6; unwind broadcast`
            : `surviving equity ${q.remainingEquityUsdc} < floor ${stop.floorUsdc}e6; unwind broadcast`,
          tx,
          remainingEquityUsdc: q.remainingEquityUsdc.toString(),
        });
      } catch (err) {
        evaluations.push({
          address: normalized,
          hasBook: true,
          floorUsdc: stop.floorUsdc,
          kept: false,
          fired: false,
          reason: `stop fired but the broadcast failed: ${err instanceof Error ? err.message.slice(0, 140) : String(err)}`,
          tx: null,
          remainingEquityUsdc: q.remainingEquityUsdc.toString(),
        });
      }
    } catch (err) {
      evaluations.push({
        address: normalized,
        hasBook: false,
        floorUsdc: stop.floorUsdc,
        kept: false,
        fired: false,
        reason: `onchain read failed: ${err instanceof Error ? err.message.slice(0, 140) : String(err)}`,
        tx: null,
        remainingEquityUsdc: "0",
      });
    }
  }

  return NextResponse.json({ ok: true, source: "onchain", mark: markUsdc.toString(), evaluations });
}
