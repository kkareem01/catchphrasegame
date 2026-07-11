"use client";

import { BigButton } from "./BigButton";

/** Full-screen modal confirmation. Backdrop tap cancels (the safe choice). */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Keep Playing",
  onConfirm,
  onCancel,
}: Readonly<{
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-surface p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-black">{title}</h3>
        {message ? (
          <p className="mt-2 text-sm opacity-70">{message}</p>
        ) : null}
        <div className="mt-5 flex flex-col gap-3">
          <BigButton onClick={onConfirm} variant="danger" className="py-4 text-lg">
            {confirmLabel}
          </BigButton>
          <BigButton
            onClick={onCancel}
            variant="secondary"
            className="py-4 text-lg"
          >
            {cancelLabel}
          </BigButton>
        </div>
      </div>
    </div>
  );
}
