/**
 * Environment resolution for the web terminal.
 *
 * Every figure the UI shows is honest about where it came from, so the
 * mode label is validated here once and consumed everywhere. Secrets are
 * never read into NEXT_PUBLIC_* and never logged — env.ts returns only
 * booleans and verified identifiers.
 */
import "server-only";

export type EngineMode = "LOCAL" | "LIVE-FORK" | "SEPOLIA" | "CACHE" | "ERROR";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function isAddress(value: string | undefined): boolean {
  return !!value && ADDRESS_RE.test(value);
}

function isHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export interface EnvState {
  mode: EngineMode;
  chainId: number;
  problems: string[];
  /** All env values below are non-secret identifiers, safe to display. */
  display: {
    mode: EngineMode;
    chainId: number;
    arkivMode: "live" | "cache";
    arkivSchema: string;
  };
  forkReady: boolean;
  arkivReady: boolean;
}

/**
 * Resolve the engine mode:
 *  - NEXT_PUBLIC_MODE=LOCAL (default) runs the deterministic engine in-process.
 *  - NEXT_PUBLIC_MODE=LIVE-FORK additionally points the settlement adapters at a
 *    Base mainnet fork; it stays dormant until every required address and RPC
 *    is present, and surfaces a validation problem otherwise.
 */
export function resolveEnv(search: Record<string, string | undefined>): EnvState {
  const problems: string[] = [];
  const rawMode = (search.NEXT_PUBLIC_MODE ?? "LOCAL").toUpperCase();
  const chainRaw = search.NEXT_PUBLIC_CHAIN_ID ?? "31337";
  const chainId = Number.isInteger(Number(chainRaw)) && Number(chainRaw) > 0 ? Number(chainRaw) : 0;
  if (chainId === 0) problems.push("NEXT_PUBLIC_CHAIN_ID is not a positive integer");

  let mode: EngineMode = "LOCAL";
  if (rawMode === "LIVE-FORK") {
    const rpcOk = isHttpUrl(search.BASE_MAINNET_RPC_URL);
    const aquaOk = isAddress(search.AQUA_REGISTRY_ADDRESS);
    const poolOk = isAddress(search.UNISWAP_V4_POOL_MANAGER_BASE);
    const usdcOk = isAddress(search.BASE_USDC_ADDRESS);
    const wethOk = isAddress(search.BASE_WETH_ADDRESS);
    if (!rpcOk) problems.push("LIVE-FORK requires BASE_MAINNET_RPC_URL");
    if (!aquaOk) problems.push("LIVE-FORK requires AQUA_REGISTRY_ADDRESS");
    if (!poolOk) problems.push("LIVE-FORK requires UNISWAP_V4_POOL_MANAGER_BASE");
    if (!usdcOk) problems.push("LIVE-FORK requires BASE_USDC_ADDRESS");
    if (!wethOk) problems.push("LIVE-FORK requires BASE_WETH_ADDRESS");
    mode = problems.length === 0 ? "LIVE-FORK" : "ERROR";
    if (search.DEMO_PRIVATE_KEY === undefined) {
      problems.push("LIVE-FORK requires DEMO_PRIVATE_KEY for the demo burner");
    }
  } else if (rawMode === "SEPOLIA") {
    mode = "SEPOLIA";
  } else if (rawMode !== "LOCAL") {
    problems.push("NEXT_PUBLIC_MODE must be one of LOCAL, LIVE-FORK, SEPOLIA");
  }

  const arkivMode = (search.ARKIV_MODE ?? "cache").toLowerCase() === "live" ? "live" : "cache";
  let arkivReady = false;
  if (arkivMode === "live") {
    const rpcOk = isHttpUrl(search.ARKIV_RPC_URL);
    const keyOk = !!search.ARKIV_ACCESS_KEY;
    if (!rpcOk) problems.push("ARKIV_MODE=live requires ARKIV_RPC_URL");
    if (!keyOk) problems.push("ARKIV_MODE=live requires ARKIV_ACCESS_KEY");
    arkivReady = problems.length === 0;
  } else if (arkivMode === "cache" && rawMode !== "LIVE-FORK") {
    arkivReady = true;
  }

  return {
    mode,
    chainId: chainId || 31337,
    problems,
    display: {
      mode,
      chainId: chainId || 31337,
      arkivMode,
      arkivSchema: search.ARKIV_SCHEMA ?? "zeromargin.span_attestations",
    },
    forkReady: mode === "LIVE-FORK",
    arkivReady,
  };
}
