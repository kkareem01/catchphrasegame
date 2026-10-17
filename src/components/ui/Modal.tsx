"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Bottom sheet on phones (thumb-reachable), centred card on wider screens.
 * Backdrop tap and Escape dismiss — always the safe choice.
 */
export function Modal({
  title,
  onDismiss,
  children,
}: Readonly<{ title: string; onDismiss: () => void; children: ReactNode }>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onDismiss}
    >
      <div
        className="animate-sheet-up max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-surface px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-2xl sm:rounded-3xl sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20 sm:hidden" />
        <h3 className="text-center font-display text-2xl">{title}</h3>
        {children}
      </div>
    </div>
  );
}
