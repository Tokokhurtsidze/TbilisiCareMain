import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-surface-elevated border border-line shadow-card p-5 ${className}`}
    >
      {children}
    </div>
  );
}
