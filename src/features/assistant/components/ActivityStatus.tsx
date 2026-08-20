import type { AssistantState } from "@/features/assistant/types";
import { markdownToPlainText } from "@/features/assistant/content/markdownToPlainText";

interface ActivityStatusProps {
  completedResponse: string | null;
  state: AssistantState;
}

function environmentText(state: AssistantState["environment"]): string {
  switch (state.status) {
    case "checking":
      return "Checking this browser";
    case "unavailable":
      return "On-device AI unavailable";
    case "downloadable":
      return "Model preparation required";
    case "downloading":
      return state.fraction === null
        ? "Chrome is downloading the model"
        : `Downloading model ${Math.floor(state.fraction * 100)}%`;
    case "preparing":
      return "Getting the model ready";
    case "ready":
      return "On-device AI ready";
    case "failed":
      return "On-device AI needs attention";
  }
}

function workText(state: AssistantState["work"]): string | null {
  switch (state.status) {
    case "idle":
      return null;
    case "queued":
      return "Response queued";
    case "checking_context":
      return "Preparing your message";
    case "compacting":
      return "Making room for this conversation";
    case "generating":
      return state.hasContent ? "Response started" : "Generating response";
    case "completed":
      return "Response complete";
    case "stopped":
      return "Response stopped";
    case "failed":
      return "Response failed";
  }
}

export function ActivityStatus({ completedResponse, state }: ActivityStatusProps) {
  const work = workText(state.work);
  const completedResponseText = completedResponse
    ? markdownToPlainText(completedResponse)
    : null;
  const completionAnnouncement =
    state.work.status === "completed" && completedResponseText
      ? `Response complete. ${completedResponseText}`
      : null;
  const storage =
    state.storage.status === "temporary"
      ? "Not saved"
      : state.storage.status === "deletion_unverified"
        ? "Deletion not verified"
        : null;
  return (
    <div
      aria-atomic="true"
      className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-zinc-500 dark:text-zinc-400"
      role="status"
    >
      <span aria-hidden={completionAnnouncement ? "true" : undefined}>
        {work ?? environmentText(state.environment)}
      </span>
      {completionAnnouncement ? (
        <span className="sr-only">{completionAnnouncement}</span>
      ) : null}
      {storage ? <span>· {storage}</span> : null}
    </div>
  );
}
