"use client";

import { useEffect, useRef, useState } from "react";
import { formatUsdcWhole } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Live notional editor: the terminal's book inputs. Defaults resolve from
 * the deployed app (the live book when active) and stay user-editable —
 * every figure on the page recomputes from whatever is in these fields.
 * No book onchain? The spec demo book (GV-01) seeds the fields, labeled as
 * the seeded preview, with a one-click path to open a real book.
 */
export function NotionalEditor({
  onNotionals,
}: {
  onNotionals: (n: { lp: bigint; short: bigint; posted: bigint }) => void;
}) {
  const [lp, setLp] = useState<string | null>(null);
  const [short, setShort] = useState<string | null>(null);
  const [posted, setPosted] = useState<string | null>(null);
  const [active, setActive] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/app/state", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        const body = await res.json();
        if (!alive) return;
        if (body.ok && body.onchain.isActive) {
          setLp(String(BigInt(body.onchain.lpNotionalUsdc) / 1_000_000n));
          setShort(String(BigInt(body.onchain.shortNotionalUsdc) / 1_000_000n));
          setPosted(String(BigInt(body.onchain.postedMarginUsdc) / 1_000_000n));
          setActive(true);
        } else {
          // seeded preview: the spec's GV-01 amounts, set by whoever authored the demo seeds
          setLp("100000");
          setShort("95000");
          setPosted("25000");
          setActive(false);
        }
      } catch {
        if (alive) setError("live read failed; seeded GV-01 values are editable previews");
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  // resolve the strings into base units and push upward on every change
  useEffect(() => {
    if (lp === null || short === null || posted === null) return;
    const toBase = (v: string, field: string): bigint | null => {
      try {
        const n = BigInt(v === "" ? "0" : v.replace(/[^0-9]/g, ""));
        return n * 1_000_000n;
      } catch {
        setError(`${field} is not an amount`);
        return null;
      }
    };
    const a = toBase(lp, "LP notional");
    const b = toBase(short, "Hedge notional");
    const c = toBase(posted, "Posted margin");
    if (a === null || b === null || c === null) return;
    onNotionals({ lp: a, short: b, posted: c });
  }, [lp, short, posted, onNotionals]);

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    hint?: string,
    isHot = false,
  ) => (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-dim">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => set(e.target.value)}
        aria-label={label}
        className={cn(
          "w-full rounded-field border bg-surface px-3 py-2 text-end font-mono text-[13px] tabular-nums outline-none",
          isHot ? "border-saffron" : "border-line",
        )}
        style={{ minWidth: 110 }}
      />
      {hint && <span className="font-mono text-[10px] text-dim">{hint}</span>}
    </label>
  );

  return (
    <div className="mt-3">
      <div className="grid grid-cols-3 gap-3">
        {field(
          "LP notional, $",
          lp ?? "",
          setLp,
          active === null ? "…" : active ? "live book onchain" : "seeded preview, editable",
          active === true,
        )}
        {field("Hedge notional, $", short ?? "", setShort)}
        {field("Posted margin, $", posted ?? "", setPosted)}
      </div>
      {error && <p aria-live="polite" className="mt-1.5 font-mono text-[11px] text-down">{error}</p>}
      <p className="mt-1.5 font-pretty text-[11px] leading-relaxed text-dim">
        every figure on this page recomputes from these three amounts at render;
        what fills them first is the live onchain book, and what you type is a
        live preview of that exact book.
      </p>
    </div>
  );
}
