"use client";

import { BigButton } from "./BigButton";
import { Modal } from "./Modal";

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
    <Modal onDismiss={onCancel}>
      <div className="text-center">
        <h3 className="text-2xl font-black">{title}</h3>
        {message ? <p className="mt-2 text-sm opacity-70">{message}</p> : null}
        <div className="mt-5 flex flex-col gap-3">
          <BigButton
            onClick={onConfirm}
            variant="danger"
            className="py-4 text-lg"
          >
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
    </Modal>
  );
}
