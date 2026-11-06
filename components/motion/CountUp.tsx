"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Counts a figure up to its final value on mount, over ~700ms with a
 * decelerating ease. Static under reduced motion. The caller supplies
 * value in text form plus a formatter, so BigInt formatting stays in
 * one place and the DOM never renders mid-flight nonsense.
 */
export function CountUp({
  final,
  format,
  duration = 0.7,
  className = "",
}: {
  final: bigint;
  format: (v: bigint) => string;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => (reduce ? final : 0n));

  useEffect(() => {
    if (reduce || final === 0n) {
      setDisplay(final);
      return;
    }
    const start = performance.now();
    const startValue = final > 0n ? final / 96n : 0n;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // decelerate: fast start, settle into the true figure
      const eased = 1 - (1 - t) ** 2.6;
      const v = startValue + ((final - startValue) * BigInt(Math.round(eased * 1000))) / 1000n;
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
