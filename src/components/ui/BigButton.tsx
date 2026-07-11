"use client";

import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-background active:brightness-90 shadow-lg shadow-accent/20",
  secondary:
    "bg-surface text-foreground border border-white/15 active:bg-white/10",
  danger: "bg-danger text-background active:brightness-90",
};

export function BigButton({
  onClick,
  variant = "primary",
  className = "",
  children,
}: Readonly<{
  onClick: () => void;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl font-bold transition-transform active:scale-[0.98] select-none ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
