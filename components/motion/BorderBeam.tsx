import type { ReactNode } from "react";

/**
 * The 21st.dev signature: an accent beam that chases the card border.
 * The beam is a conic-gradient ring painted by `.border-beam::after`
 * (see globals), animated by --beam-angle. It is decorative only, which
 * is why the reduced-motion gate stops it globally. Reserve for ONE
 * card per view.
 */
export function BorderBeam({
  children,
  className = "",
  duration = 8,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <div
      className={`border-beam ${className}`}
      style={{ ["--beam-duration" as never]: `${duration}s` }}
    >
      {children}
    </div>
  );
}
