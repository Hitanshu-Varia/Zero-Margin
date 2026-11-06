"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatUsdcWhole } from "@/lib/format";
import { cn } from "@/lib/cn";
import { walletInputAttrs } from "@/lib/wallets";

const ADDR = /^0x[0-9a-fA-F]{40}$/;
const STORE_KEY = "zm.wallets.v1";
const STOPS_KEY = "zm.stops.v1";

interface Row {
  address: string;
  label: string;
  ethBalanceWei: string;
  usdcBalance: string;
  hasBook: boolean;
  lpNotionalUsdc?: string;
  shortNotionalUsdc?: string;
  postedMarginUsdc?: string;
}

interface StopLoss {
  address: string;
  stopLossBps: number; // how much of the entry price can be lost
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private-mode storage denies writes; the session keeps working in memory
  }
}

const eth = (wei: string): string => {
  const n = Number(wei) / 1e18;
  return `${n.toFixed(4)} ETH`;
};

/** Positions from the real chain: add any address, get live balances. */
export function PositionsStage() {
  const [wallets, setWallets] = useState<Array<string>>(() => []);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [stops, setStops] = useState<Record<string, number>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [monitor, setMonitor] = useState<string | null>(null);
  const ticking = useRef(false);

  useEffect(() => {
    setWallets(load<string[]>(STORE_KEY, []));
    setLabels(load<Record<string, string>>(STORE_KEY + ".labels", {}));
    setStops(load<Record<string, number>>(STOPS_KEY, {}));
  }, []);

  const readAll = useCallback(async () => {
    setStatus("reading");
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallets }),
      });
      const body = await res.json();
      if (!body.ok) throw new Error((body.problems ?? []).join(", "));
      setRows(body.positions as Row[]);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMonitor(err instanceof Error ? err.message.slice(0, 120) : "read failed");
    }
  }, [wallets]);

  useEffect(() => {
    if (wallets.length > 0) void readAll();
    if (wallets.length > 0) save(STORE_KEY, wallets);
    if (wallets.length > 0) save(STORE_KEY + ".labels", labels);
  }, [wallets, labels, readAll]);

  const addWallet = () => {
    const normalized = input.trim().toLowerCase();
    if (!ADDR.test(normalized)) {
      setMonitor("that is not a 40-hex address");
      return;
    }
    if (!wallets.includes(normalized)) setWallets((w) => [...w, normalized]);
    setInput("");
  };

  const setStop = (address: string, stopLossBps: number) => {
    const next = { ...stops };
    if (stopLossBps <= 0) delete next[address];
    else next[address] = stopLossBps;
    setStops(next);
    save(STOPS_KEY, next);
  };

  const runKeeperNow = async () => {
    setMonitor("keeper running…");
    const stopsList = Object.entries(stops).map(([address, stopLossBps]) => ({ address, stopLossBps }));
    if (stopsList.length === 0) {
      setMonitor("no stop-loss rules configured yet");
      return;
    }
    const res = await fetch("/api/keeper/monitor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stopLosses: stopsList }),
    });
    const body = await res.json();
    if (!body.ok) {
      setMonitor(`keeper: ${body.problems?.join(", ").slice(0, 140) ?? "error"}`);
      return;
    }
    const fired = (body.evaluations as Array<{ address: string; reason: string; executed: boolean; tx: string }>).
      map((e) => `${e.address.slice(0, 8)}… ${e.executed ? "FIRED" : e.reason.slice(0, 60)}`);
    setMonitor(fired.join(" ‖ "));
    void readAll();
  };

  return (
    <div className="mx-auto w-full max-w-[1128px] px-4 pb-14 pt-8 md:px-6">
      <h1 className="text-balance text-[26px] font-medium md:text-[30px]">Positions</h1>
      <p className="mt-1 max-w-[62ch] text-pretty text-[14px] leading-relaxed text-muted">
        Every number below comes from the chain: native ETH from getBalance,
        demo USDC from balanceOf, and a wallet's book from the deployed app on
        Base Sepolia. Add as many addresses as you want to track.
      </p>

      {/* add-wallet */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          {...walletInputAttrs}
          aria-label="Wallet address"
          className="min-w-[240px] flex-1 rounded-field border border-line bg-surface px-4 font-mono text-[13px] tabular-nums outline-none focus:border-line-strong"
          style={{ height: 44 }}
        />
        <button
          type="button"
          onClick={addWallet}
          className="flex h-11 shrink-0 items-center rounded-full bg-paper px-5 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
          style={{ color: "var(--ink)" }}
        >
          Add wallet
        </button>
        <button
          type="button"
          onClick={readAll}
          className="flex h-11 shrink-0 items-center rounded-full border border-line-strong bg-surface px-5 text-[14px] text-muted transition-colors duration-100 hover:text-text"
        >
          {status === "reading" ? "Reading" : "Refresh"}
        </button>
      </div>

      {monitor && (
        <p aria-live="polite" className="mt-3 text-[12px] text-dim">{monitor}</p>
      )}

      {wallets.length === 0 && (
        <div className="mt-10 rounded-panel border border-line bg-surface p-6 text-center">
          <p className="text-[15px] font-medium">No wallets tracked</p>
          <p className="mt-1.5 text-pretty text-[13px] text-muted">
            Paste an address above. The data that fills this table comes from the chain on
            every refresh, not from a fixture.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {rows.map((row) => (
          <div key={row.address} className="lift rounded-panel border border-line bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium">
                  {labels[row.address] || `${row.address.slice(0, 10)}…${row.address.slice(-6)}`}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-dim">{row.address}</p>
              </div>
              <div className="flex items-baseline gap-5 font-mono text-[15px] tabular-nums">
                <span>{eth(row.ethBalanceWei)}</span>
                <span className="text-saffron">{formatUsdcWhole(BigInt(row.usdcBalance))}</span>
              </div>
            </div>

            {row.hasBook && row.lpNotionalUsdc && (
              <dl className="mt-4 grid gap-x-8 gap-y-1 border-t border-line pt-3 text-[12px] sm:grid-cols-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-dim">LP notional</dt>
                  <dd className="font-mono tabular-nums">{formatUsdcWhole(BigInt(row.lpNotionalUsdc))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-dim">Short notional</dt>
                  <dd className="font-mono tabular-nums">{formatUsdcWhole(BigInt(row.shortNotionalUsdc ?? "0"))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-dim">Posted margin</dt>
                  <dd className="font-mono tabular-nums">{formatUsdcWhole(BigInt(row.postedMarginUsdc ?? "0"))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-dim">Status</dt>
                  <dd className="font-mono text-up tabular-nums">active book</dd>
                </div>
              </dl>
            )}

            {/* stop-loss editor */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <label className="text-[12px] text-dim" htmlFor={`stop-${row.address}`}>
                Stop-loss trigger (bps of price drop)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`stop-${row.address}`}
                  type="number"
                  min={100}
                  max={50_00}
                  step={100}
                  value={stops[row.address] ?? ""}
                  onChange={(e) => setStop(row.address, Number(e.target.value))}
                  className="w-24 rounded-field border border-line bg-surface-raised px-2.5 py-1.5 text-end font-mono text-[12px] tabular-nums outline-none focus:border-line-strong"
                />
                <span
                  className={cn(
                    "font-mono text-[11px]",
                    stops[row.address] ? "text-saffron" : "text-dim",
                  )}
                >
                  {stops[row.address] ? `fires at −${Number(stops[row.address]) / 100}% mark` : "off"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={runKeeperNow}
          className="flex h-11 items-center rounded-full bg-paper px-6 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
          style={{ color: "var(--ink)" }}
        >
          Run the stop-loss keeper
        </button>
        <p className="max-w-[58ch] text-pretty text-center text-[12px] leading-relaxed text-dim">
          The keeper walks every rule you saved, reads the live mark from the
          book, and — when a rule's floor is breached — broadcasts the real
          unwind to the deployed app on Base Sepolia. The server wallet only
          signs when it owns the book or holds the keeper role.
        </p>
      </div>

      {status === "error" && (
        <p aria-live="polite" role="alert" className="mt-4 rounded-field border border-down-dim bg-down-dim/30 px-3 py-2 text-[12px] text-down">
          {monitor}{" "}
          <button type="button" onClick={() => void readAll()} className="font-mono underline">Retry</button>
        </p>
      )}
    </div>
  );
}
