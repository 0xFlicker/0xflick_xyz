"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

interface ConfirmationDialogProps {
  confirmLabel: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}

export function ConfirmationDialog({
  confirmLabel,
  description,
  onClose,
  onConfirm,
  open,
  title,
}: ConfirmationDialogProps) {
  return (
    <Dialog className="fixed inset-0 z-50" onClose={onClose} open={open}>
      <DialogBackdrop className="fixed inset-0 bg-zinc-950/45 backdrop-blur-sm data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
          <DialogTitle className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {title}
          </DialogTitle>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{description}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-zinc-200 dark:hover:bg-white/10"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              onClick={onConfirm}
              type="button"
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
