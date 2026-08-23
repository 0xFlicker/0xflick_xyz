import type { LocalModelOption, ModelCatalogState } from "@/features/assistant/types";

interface AvailabilityPanelProps {
  catalog: ModelCatalogState;
  onPrepare: () => void;
  onRetry: () => void;
  onStopWaiting: () => void;
  option: LocalModelOption | null;
  requiresExplicitReplacement?: boolean;
}

const actionClass = "mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-950";

function failureText(option: LocalModelOption): string {
  switch (option.asset.failure) {
    case "storage_quota": return "This browser could not store the model. Free browser storage, then retry.";
    case "corrupt_assets": return "The model files are incomplete or damaged. Remove the model, then prepare it again.";
    case "resource_exhausted": return "This device could not keep the model running. Close other heavy pages or choose a smaller model.";
    case "runtime_terminated": return "The browser stopped the local model. Retry or choose another model.";
    case "unsupported_device":
    case "unsupported_input": return "This execution method could not run here. Choose another model.";
    case "aborted": return "This page stopped waiting. Installed files, if any, were kept.";
    default: return "This model could not become ready here. Retry or choose another model.";
  }
}

export function AvailabilityPanel({ catalog, onPrepare, onRetry, onStopWaiting, option, requiresExplicitReplacement = false }: AvailabilityPanelProps) {
  if (catalog.status === "checking") {
    return (
      <section className="rounded-[1.4rem] border border-zinc-200 bg-white px-5 py-5 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
        <h2 className="font-semibold text-zinc-950 dark:text-white">Checking local models…</h2>
        <p className="mt-1">Looking for on-device options this browser can attempt.</p>
      </section>
    );
  }
  if (catalog.status === "unavailable" || !option) {
    return (
      <section className="rounded-[1.4rem] border border-zinc-200 bg-white px-5 py-5 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">No local model can be offered here</h2>
        <p className="mt-2 leading-6">The required browser execution surfaces are unavailable. No cloud or synthetic model will answer in their place.</p>
        <button className={actionClass} onClick={onRetry} type="button">Retry detection</button>
      </section>
    );
  }
  const active = ["preparing", "loading", "checking"].includes(option.asset.state);
  return (
    <section className="rounded-[1.4rem] border border-zinc-200 bg-white px-5 py-5 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
      <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
        {requiresExplicitReplacement ? "Choose a model to continue" : active ? `Preparing ${option.descriptor.displayName}` : option.asset.state === "failed" || option.asset.state === "missing" ? `${option.descriptor.displayName} needs attention` : `Prepare ${option.descriptor.displayName}`}
      </h2>
      <p className="mt-2 leading-6">
        {requiresExplicitReplacement ? "The active model was removed. Confirm an available model before sending another message." : active ? option.asset.state === "checking" ? "Checking that this model can produce a real local answer." : "Model work is continuing on this device." : option.asset.state === "failed" || option.asset.state === "missing" ? failureText(option) : `${option.descriptor.displayName} runs with ${option.descriptor.executionName}. Preparation starts only after you confirm.`}
      </p>
      {active ? (
        <>
          <progress aria-label="Model preparation progress" className="mt-3 h-2 w-full accent-cyan-600" max={1} value={option.asset.progress ?? undefined} />
          <button className={actionClass} onClick={onStopWaiting} type="button">Stop waiting</button>
        </>
      ) : (
        <button className={actionClass} onClick={option.asset.state === "failed" ? onRetry : onPrepare} type="button">
          {option.asset.state === "failed" ? "Retry" : "Prepare this model"}
        </button>
      )}
    </section>
  );
}
