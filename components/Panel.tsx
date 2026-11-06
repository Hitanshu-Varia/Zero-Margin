import type { ReactNode } from "react";

/**
 * A flat data panel: hairline border, surface step, one header row with
 * a small amber index mark. No shadows, no glass — hierarchy comes from
 * borders and tones.
 */
export function Panel({
  label,
  meta,
  accent = false,
  children,
  className = "",
  bodyClassName = "",
}: {
  label?: string;
  meta?: ReactNode;
  accent?: boolean;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`rounded-panel border border-line bg-surface overflow-hidden ${className}`}
    >
      {(label || meta) && (
        <header className="flex flex-wrap items-center justify-between gap-2 gap-x-4 border-b border-line px-4 py-2.5">
          <h2 className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            <span
              aria-hidden="true"
              className={`h-[6px] w-[6px] shrink-0 ${accent ? "bg-amber" : "bg-line-strong"}`}
            />
            {label}
          </h2>
          {meta && <div className="text-[12px] text-dim">{meta}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/**
 * A labeled figure row inside a panel. `emphasis` lifts the value one
 * tone step; USDC base-unit components pass pre-formatted strings.
 */
export function Stat({
  label,
  value,
  tone = "text",
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "text" | "muted" | "up" | "down" | "amber";
  hint?: string;
}) {
  const toneClass =
    tone === "up"
      ? "text-up"
      : tone === "down"
        ? "text-down"
        : tone === "amber"
          ? "text-amber"
          : tone === "muted"
            ? "text-muted"
            : "text-text";
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2 rule-b last:border-b-0">
      <span className="text-[12px] uppercase tracking-wide text-muted flex items-center gap-1.5">
        {label}
        {hint && (
          <span
            title={hint}
            className="h-[5px] w-[5px] rounded-full border border-dim"
          />
        )}
      </span>
      <span className={`font-mono tabular-nums text-[13px] ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}
