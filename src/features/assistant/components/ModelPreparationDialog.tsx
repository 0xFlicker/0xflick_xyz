"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

import type {
  LocalModelDescriptor,
  ModelAssetSnapshot,
} from "@/features/assistant/types";

interface ModelPreparationDialogProps {
  descriptor: LocalModelDescriptor;
  onClose: () => void;
  onConfirm: () => void;
  onStop?: () => void;
  open: boolean;
  snapshot: ModelAssetSnapshot | null;
  downgrade?: boolean;
  requiresPreparation?: boolean;
}

function approximateSize(bytes: number | undefined): string {
  if (!bytes) return "an unknown download size";
  return `about ${Math.round(bytes / 1_000_000)} MB`;
}

function activeState(snapshot: ModelAssetSnapshot): string {
  switch (snapshot.state) {
    case "preparing":
      return "Preparing the model on this device…";
    case "loading":
      return "Loading the model on this device…";
    case "checking":
      return "Checking that the model can answer locally…";
    case "removing":
      return "Removing the model from this browser…";
    case "failed":
      return "This model could not become ready on this device.";
    case "missing":
      return "The browser no longer has this model's files.";
    case "ready":
      return "This model is ready on this device.";
    case "unprepared":
      return "This model has not been prepared on this device.";
  }
}

export function ModelPreparationDialog({
  descriptor,
  onClose,
  onConfirm,
  onStop,
  open,
  snapshot,
  downgrade = true,
  requiresPreparation = true,
}: ModelPreparationDialogProps) {
  const active =
    snapshot?.state === "preparing" ||
    snapshot?.state === "loading" ||
    snapshot?.state === "checking";
  return (
    <Dialog className="fixed inset-0 z-50" onClose={active ? () => undefined : onClose} open={open}>
      <DialogBackdrop className="fixed inset-0 bg-zinc-950/45 backdrop-blur-sm data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
          <DialogTitle className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {snapshot
              ? "Prepare local model"
              : requiresPreparation
                ? `Prepare ${descriptor.displayName}?`
                : `Switch to ${descriptor.displayName}?`}
          </DialogTitle>
          {snapshot ? (
            <div className="mt-4" role="status">
              <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                {activeState(snapshot)}
              </p>
              {snapshot.progress !== null ? (
                <>
                  <progress
                    aria-label={`${descriptor.displayName} preparation progress`}
                    className="mt-3 h-2 w-full accent-cyan-600"
                    max={1}
                    value={snapshot.progress}
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {Math.floor(snapshot.progress * 100)}% complete
                  </p>
                </>
              ) : active ? (
                <div
                  aria-hidden="true"
                  className="mt-4 h-1.5 w-full animate-pulse rounded-full bg-cyan-500/40"
                />
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              <p>
                {requiresPreparation ? "Download and prepare" : "Use"} {descriptor.displayName} with {descriptor.executionName}{requiresPreparation ? ` (${approximateSize(descriptor.approximateWeightBytes)}). Its files stay in this browser for reuse.` : "."}
              </p>
              {downgrade ? (
                <p>Switching to a less performant model may reduce answer quality and conversation memory.</p>
              ) : null}
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            {!active ? (
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-zinc-200 dark:hover:bg-white/10"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
            ) : null}
            {active && onStop ? (
              <button
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/20 dark:text-zinc-100 dark:hover:bg-white/10"
                onClick={onStop}
                type="button"
              >
                Stop waiting
              </button>
            ) : snapshot === null ? (
              <button
                className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-cyan-600 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:bg-cyan-500 dark:text-zinc-950"
                onClick={onConfirm}
                type="button"
              >
                {requiresPreparation ? "Download and prepare" : "Switch model"}
              </button>
            ) : null}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
