"use client";

import { useRef } from "react";

import type { LocalModelOption, ModelKey } from "@/features/assistant/types";

interface ModelSelectorProps {
  busy: boolean;
  onManage: () => void;
  onSelect: (modelKey: ModelKey) => void;
  options: LocalModelOption[];
  selectedModelKey: ModelKey | null;
}

function stateLabel(option: LocalModelOption): string {
  if (option.active) return "Active";
  if (option.pending) return "Pending";
  switch (option.asset.state) {
    case "ready": return "Ready";
    case "preparing":
    case "loading":
    case "checking": return "Preparing";
    case "failed": return "Needs attention";
    case "missing": return "Missing";
    case "removing": return "Removing";
    case "unprepared": return option.descriptor.kind === "portable" ? "Preparation required" : "Available";
  }
}

export function ModelSelector({ busy, onManage, onSelect, options, selectedModelKey }: ModelSelectorProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selected = options.find((option) => option.descriptor.key === selectedModelKey) ?? options[0] ?? null;
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-4 sm:px-8 lg:px-12" data-assistant-model-selector>
      <details
        className="group relative min-w-0"
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !detailsRef.current?.open) return;
          event.preventDefault();
          detailsRef.current.removeAttribute("open");
          detailsRef.current.querySelector("summary")?.focus();
        }}
        ref={detailsRef}
      >
        <summary className="flex max-w-full cursor-pointer list-none items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-white/10">
          <span className="truncate">{selected ? `${selected.descriptor.displayName} · ${selected.descriptor.executionName}` : "Choose a local model"}</span>
          <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="absolute left-0 top-full z-40 mt-2 w-[min(23rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900">
          {options.map((option) => (
            <button
              aria-current={option.active ? "true" : undefined}
              className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:bg-white/10"
              disabled={busy || option.asset.state === "removing"}
              key={option.descriptor.key}
              onClick={() => {
                detailsRef.current?.removeAttribute("open");
                onSelect(option.descriptor.key);
              }}
              type="button"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-white">{option.descriptor.displayName}</span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{option.descriptor.executionName}</span>
              </span>
              <span className="shrink-0 text-[0.68rem] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{stateLabel(option)}</span>
            </button>
          ))}
          <div className="mt-1 border-t border-zinc-200 pt-1 dark:border-white/10">
            <button
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:bg-white/10"
              onClick={() => {
                detailsRef.current?.removeAttribute("open");
                onManage();
              }}
              type="button"
            >
              Manage downloaded models
            </button>
          </div>
        </div>
      </details>
      {busy ? <span className="text-xs text-zinc-500">Finish the current response to change models.</span> : null}
    </div>
  );
}
