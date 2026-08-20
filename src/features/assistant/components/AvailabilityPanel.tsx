import type { EnvironmentState } from "@/features/assistant/types";

interface AvailabilityPanelProps {
  environment: EnvironmentState;
  onPrepare: () => void;
  onRetry: () => void;
  onStopWaiting: () => void;
}

const actionClass =
  "mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-950";

export function AvailabilityPanel({
  environment,
  onPrepare,
  onRetry,
  onStopWaiting,
}: AvailabilityPanelProps) {
  return (
    <section className="rounded-[1.4rem] border border-zinc-200 bg-white px-5 py-5 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
      {environment.status === "checking" ? (
        <>
          <h2 className="font-semibold text-zinc-950 dark:text-white">Checking this browser…</h2>
          <p className="mt-1">Looking for Chrome’s on-device AI and an eligible local model.</p>
        </>
      ) : null}

      {environment.status === "unavailable" ? (
        <>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">On-device AI is not available here</h2>
          <p className="mt-2 leading-6">
            This demo requires a secure page in a supported version of Chrome, an eligible device, enough free storage and memory, and a model Chrome can download successfully.
          </p>
          <p className="mt-2">No cloud or synthetic fallback will answer in its place.</p>
          <button className={actionClass} onClick={onRetry} type="button">Retry detection</button>
        </>
      ) : null}

      {environment.status === "downloadable" ? (
        <>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">Prepare private AI on this device</h2>
          <p className="mt-2 leading-6">
            Chrome needs a substantial model download. It can use storage, memory, processing power, and time. Use an unmetered connection and keep this page open.
          </p>
          <button className={actionClass} onClick={onPrepare} type="button">Prepare on this device</button>
        </>
      ) : null}

      {environment.status === "downloading" ? (
        <>
          <h2 className="font-semibold text-zinc-950 dark:text-white">Chrome is downloading the on-device model</h2>
          {environment.fraction === null ? (
            <div className="mt-3">
              <progress
                aria-label="Model download progress"
                className="h-2 w-full accent-cyan-600"
                max={1}
              />
              <p className="mt-2 leading-6">
                This can take several minutes. Chrome may continue if you leave this page.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <progress
                aria-label="Model download progress"
                className="h-2 w-full accent-cyan-600"
                max={1}
                value={environment.fraction}
              />
              <p className="mt-1 text-xs">{Math.floor(environment.fraction * 100)}% downloaded</p>
              <p className="mt-2 leading-6">Chrome may continue if you leave this page.</p>
            </div>
          )}
          <button className={actionClass} onClick={onStopWaiting} type="button">Stop waiting</button>
        </>
      ) : null}

      {environment.status === "preparing" ? (
        <>
          <h2 className="font-semibold text-zinc-950 dark:text-white">Getting the model ready</h2>
          <p className="mt-2">The download is complete. Chrome is loading the local model into memory.</p>
          <button className={actionClass} onClick={onStopWaiting} type="button">Stop waiting</button>
        </>
      ) : null}

      {environment.status === "failed" ? (
        <>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
            {environment.code === "aborted" ? "Stopped waiting on this page" : "The local model needs attention"}
          </h2>
          <p className="mt-2 leading-6">
            {environment.code === "aborted"
              ? "Chrome may continue downloading or preparing its shared model. This page only stopped waiting for it."
              : environment.code === "operation_failed"
                ? "Chrome could not start its local model. Retry detection; if Chrome reports it ready but this repeats, restart Chrome and try again."
                : "Chrome could not complete this local AI step. Your saved browser history, if any, has not been removed."}
          </p>
          <button className={actionClass} onClick={onRetry} type="button">Retry detection</button>
        </>
      ) : null}
    </section>
  );
}
