"use client";

import type { ReactNode } from "react";

/** Full-screen overlay card. Backdrop tap dismisses (the safe choice). */
export function Modal({
  onDismiss,
  children,
}: Readonly<{ onDismiss: () => void; children: ReactNode }>) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      role="dialog"
      aria-modal="true"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
