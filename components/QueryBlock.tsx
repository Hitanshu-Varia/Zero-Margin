"use client";

import { useState } from "react";

/**
 * The runnable keeper query as a single copyable string. One click or
 * one Enter copies it; the button confirms for a beat after copying.
 */
export function QueryBlock({ query }: { query: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-panel border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="text-[12px] uppercase tracking-[0.08em] text-muted">
          <span aria-hidden="true" className="mr-2 inline-block h-[6px] w-[6px] bg-gold align-middle" />
          Keeper query — runnable on Rabdi 7794095
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-field border border-line-strong bg-surface-raised px-2.5 py-1 font-mono text-[11px] text-muted transition-colors duration-100 hover:border-gold-dim hover:text-gold"
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-muted">
        <code>{query}</code>
      </pre>
    </div>
  );
}
