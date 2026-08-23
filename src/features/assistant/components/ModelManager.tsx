"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";

import { ConfirmationDialog } from "@/features/assistant/components/ConfirmationDialog";
import type { LocalModelOption, ModelKey } from "@/features/assistant/types";

interface ModelManagerProps {
  onClose: () => void;
  onRemove: (modelKey: ModelKey) => void;
  open: boolean;
  options: LocalModelOption[];
}

function sizeLabel(bytes: number | null | undefined): string {
  return bytes ? `About ${Math.round(bytes / 1_000_000)} MB` : "Size unavailable";
}

export function ModelManager({ onClose, onRemove, open, options }: ModelManagerProps) {
  const [removing, setRemoving] = useState<LocalModelOption | null>(null);
  const portable = options.filter((option) => option.descriptor.kind === "portable");
  return (
    <>
      <Dialog className="fixed inset-0 z-50" onClose={onClose} open={open}>
        <DialogBackdrop className="fixed inset-0 bg-zinc-950/45 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            <DialogTitle className="text-xl font-semibold">Downloaded models</DialogTitle>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Model files are stored separately from chats. Removing one does not delete or rewrite a conversation.
            </p>
            <div className="mt-5 space-y-3">
              {portable.map((option) => {
                const installed = option.asset.state === "ready" || option.asset.loadedBytes !== null && option.asset.loadedBytes > 0;
                return (
                  <section className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10" key={option.descriptor.key}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{option.descriptor.displayName}</h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          {option.descriptor.executionName} · {sizeLabel(option.asset.expectedBytes ?? option.descriptor.approximateWeightBytes)}
                        </p>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300" role="status">
                          {option.asset.state === "missing"
                            ? "Files missing or evicted"
                            : option.asset.state === "removing"
                              ? "Removing…"
                              : installed
                                ? "Installed"
                                : "Not installed"}
                        </p>
                      </div>
                      {installed ? (
                        <button
                          className="rounded-full border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-400/30 dark:text-red-300"
                          disabled={option.asset.state === "removing"}
                          onClick={() => setRemoving(option)}
                          type="button"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button className="rounded-full px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" onClick={onClose} type="button">Close</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      <ConfirmationDialog
        confirmLabel="Remove model"
        description={`Remove ${removing?.descriptor.displayName ?? "this model"} files from this browser? Chats and model boundaries remain. If it is active, you must confirm another model before sending.`}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) onRemove(removing.descriptor.key);
          setRemoving(null);
        }}
        open={removing !== null}
        title="Remove downloaded model?"
      />
    </>
  );
}
