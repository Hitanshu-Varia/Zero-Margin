import type { ReactNode } from "react";

type BadgeVariant = "local" | "fork" | "cache" | "error" | "status";

const variantClass: Record<BadgeVariant, string> = {
  local:
    "border-amber-dim bg-amber-dim/40 text-amber",
  fork: "border-up-dim bg-up-dim/40 text-up",
  cache: "border-chain-dim bg-chain-dim/40 text-chain",
  error: "border-down-dim bg-down-dim/40 text-down",
  status: "border-line-strong bg-surface-raised text-muted",
};

/**
 * Horizontal mode badge. Every badge is focusable and paired with a
 * description that states exactly what is live and what is simulated.
 */
export function ModeBadge({
  variant,
  title,
  description,
  className = "",
}: {
  variant: BadgeVariant;
  title: string;
  description: ReactNode;
  className?: string;
}) {
  const id = `badge-desc-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <span className={`relative group inline-flex ${className}`}>
      <button
        type="button"
        aria-describedby={id}
        className={`cursor-help rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-[0.06em] transition-colors duration-100 hover:border-line-strong ${variantClass[variant]}`}
      >
        {title}
      </button>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-64 rounded-field border border-line-strong bg-surface-raised p-2.5 text-[12px] font-sans normal-case leading-snug text-muted opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {description}
      </span>
    </span>
  );
}

/** Plain status chip: OPEN / AT RISK / SETTLED and similar. */
export function StatusChip({
  children,
  tone = "status",
}: {
  children: ReactNode;
  tone?: "status" | "up" | "down" | "amber";
}) {
  const toneKey: BadgeVariant =
    tone === "up" ? "fork" : tone === "down" ? "error" : tone === "amber" ? "local" : "status";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-[0.06em] uppercase ${
        variantClass[toneKey]
      }`}
    >
      <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-current" />
      {children}
    </span>
  );
}
