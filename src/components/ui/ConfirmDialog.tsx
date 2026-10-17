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
    <Modal title={title} onDismiss={onCancel}>
      <div className="text-center">
        {message ? <p className="mt-2 text-muted">{message}</p> : null}
        <div className="mt-6 flex flex-col gap-4">
          <BigButton onClick={onCancel} className="py-4 text-lg">
            {cancelLabel}
          </BigButton>
          <BigButton onClick={onConfirm} variant="danger" className="py-4 text-lg">
            {confirmLabel}
          </BigButton>
        </div>
      </div>
    </Modal>
  );
}
