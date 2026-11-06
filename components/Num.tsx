import type { ReactNode } from "react";

type Tone = "text" | "muted" | "dim" | "up" | "down" | "gold";
type Size = "xs" | "sm" | "md" | "lg" | "hero";

const toneClass: Record<Tone, string> = {
  text: "text-text",
  muted: "text-muted",
  dim: "text-dim",
  up: "text-up",
  down: "text-down",
  gold: "text-gold",
};

const sizeClass: Record<Size, string> = {
  xs: "text-[11px]",
  sm: "text-[13px]",
  md: "text-[14px]",
  lg: "text-[18px] font-medium",
  hero: "text-[34px] md:text-[38px] leading-none tracking-tight font-medium",
};

/**
 * A mono figure. Every monetary value, ratio, and basis point in the
 * product renders through this so columns align on tabular numerals.
 */
export function Num({
  children,
  tone = "text",
  size = "sm",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={`font-mono tabular-nums ${toneClass[tone]} ${sizeClass[size]} ${className}`}
    >
      {children}
    </span>
  );
}
