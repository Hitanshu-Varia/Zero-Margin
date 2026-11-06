"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Fade-and-rise once, when the block first scrolls into view.
 * Transform and opacity only; reduced motion renders it visible.
 */
export function RevealOnView({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const node = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setSeen(true);
      return;
    }
    const el = node.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <div
      ref={node}
      style={{ transitionDelay: `${delay}ms`, transitionTimingFunction: "var(--ease-out)" }}
      className={cn(
        "transition-[opacity,transform] duration-500 will-change-[opacity,transform]",
        seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
