"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-brand-soft text-brand hover:bg-brand-soft/80 disabled:opacity-50",
  ghost:
    "bg-transparent text-ink-primary hover:bg-surface-subtle disabled:opacity-50",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-50",
};

const sizes = {
  sm: "h-10 px-3 text-sm",
  md: "h-12 px-5 text-base",
  lg: "h-14 px-6 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, children, className = "", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <span className="animate-pulse">…</span> : children}
    </button>
  );
});
