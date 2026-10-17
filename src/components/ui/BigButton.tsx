"use client";

import type { ReactNode } from "react";

type Variant = "primary" | "go" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "btn-accent",
  go: "btn-go",
  secondary: "btn-ghost",
  danger: "btn-danger",
};

/** Chunky arcade button with a physical press-down. */
export function BigButton({
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  children,
}: Readonly<{
  onClick: () => void;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-3d select-none rounded-2xl font-extrabold ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
