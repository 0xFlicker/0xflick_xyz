"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

import { PERSONALITY_LIMIT } from "@/features/assistant/constants";
import type {
  MutationResult,
  PersonalitySetting,
} from "@/features/assistant/types";

interface SettingsDialogProps {
  onSave: (text: string) => Promise<MutationResult>;
  personality: PersonalitySetting;
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function SettingsDialog({ onSave, personality }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(personality.text);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const count = codePointLength(draft);
  const overLimit = count > PERSONALITY_LIMIT;

  async function save(): Promise<void> {
    if (overLimit || status === "saving") return;
    setStatus("saving");
    const result = await onSave(draft);
    setStatus(result.ok ? "saved" : "failed");
  }

  return (
    <>
      <button
        aria-label="Settings"
        className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/10 dark:hover:bg-white/10"
        onClick={() => {
          setDraft(personality.text);
          setStatus("idle");
          setOpen(true);
        }}
        type="button"
      >
        <span className="hidden sm:inline">Settings</span>
        <span aria-hidden="true" className="sm:hidden">⚙</span>
      </button>
      <Dialog className="fixed inset-0 z-50" onClose={setOpen} open={open}>
        <DialogBackdrop className="fixed inset-0 bg-zinc-950/45 backdrop-blur-sm data-[closed]:opacity-0" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Assistant settings
            </DialogTitle>
            <DialogDescription className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Add an optional style or response preference. It applies globally to later turns, cannot grant tools or live data, and never changes earlier messages.
            </DialogDescription>
            <label className="mt-5 block text-sm font-semibold" htmlFor="assistant-personality">
              Personality preference
            </label>
            <textarea
              aria-describedby="assistant-personality-count assistant-personality-error"
              className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/10"
              id="assistant-personality"
              onChange={(event) => {
                setDraft(event.target.value);
                setStatus("idle");
              }}
              value={draft}
            />
            <div className="mt-2 flex items-start justify-between gap-4 text-xs">
              <p
                className={overLimit ? "font-semibold text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}
                id="assistant-personality-count"
              >
                {count.toLocaleString("en-US")} / {PERSONALITY_LIMIT.toLocaleString("en-US")}
              </p>
              <button
                className="font-semibold text-zinc-600 underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-zinc-300"
                onClick={() => {
                  setDraft("");
                  setStatus("idle");
                }}
                type="button"
              >
                Clear field
              </button>
            </div>
            <div className="mt-3 min-h-6 text-sm" id="assistant-personality-error">
              {overLimit ? (
                <p className="font-medium text-red-600 dark:text-red-400" role="alert">
                  Shorten this preference to 1,000 characters before saving.
                </p>
              ) : status === "saved" ? (
                <p className="font-medium text-emerald-700 dark:text-emerald-300" role="status">
                  Preference saved
                </p>
              ) : status === "failed" ? (
                <p className="font-medium text-red-600 dark:text-red-400" role="alert">
                  The preference was not saved. Your prior value is unchanged.
                </p>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:bg-white/10"
                onClick={() => setOpen(false)}
                type="button"
              >
                Close settings
              </button>
              <button
                className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                disabled={overLimit || status === "saving"}
                onClick={() => void save()}
                type="button"
              >
                {status === "saving" ? "Saving preference" : "Save preference"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
