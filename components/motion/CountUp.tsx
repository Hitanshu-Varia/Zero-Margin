"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  formatUsdc,
  formatUsdcWhole,
  formatPercentFromBps,
  formatBps,
} from "@/lib/format";

const formatters = {
  usdc: formatUsdc,
  usdcWhole: formatUsdcWhole,
  percent: formatPercentFromBps,
  bps: formatBps,
} as const;

export type CountUpFormat = keyof typeof formatters;

/**
 * Counts a figure up to its final value on mount, over ~700ms with a
 * decelerating ease, and renders its final state instantly under
 * reduced motion. Formatting stays inside the client boundary via the
 * `variant` prop, so BigInt math stays on the server that owns it.
 */
export function CountUp({
  final,
  variant = "usdcWhole",
  duration = 0.7,
  className = "",
}: {
  final: bigint;
  variant?: CountUpFormat;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const format = formatters[variant];
  const [display, setDisplay] = useState(() => (reduce ? final : 0n));

  useEffect(() => {
    if (reduce || final === 0n) {
      setDisplay(final);
      return;
    }
    const start = performance.now();
    // start from a fiftieth of the figure so longer counts still read fast
    const startActivity = final > 0n ? final / 50n : 0n;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - (1 - t) ** 2.6;
      const v = startActivity + ((final - startActivity) * BigInt(Math.round(eased * 1000))) / 1000n;
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(final);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [final, duration, reduce]);

  return (
    <span className={className} aria-label={format(final)}>
      {format(display)}
    </span>
  );
}
