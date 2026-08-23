import { markdownToPlainText } from "@/features/assistant/content/markdownToPlainText";
import type { AssistantState, LocalModelOption } from "@/features/assistant/types";

interface ActivityStatusProps {
  completedResponse: string | null;
  model: LocalModelOption | null;
  state: AssistantState;
}

function modelText(state: AssistantState["models"], model: LocalModelOption | null): string {
  if (state.status === "checking") return "Checking local models";
  if (state.status === "unavailable" || !model) return "Local AI unavailable";
  if (state.status === "failed") return "Local AI needs attention";
  const name = model.descriptor.displayName;
  switch (model.asset.state) {
    case "ready": return `${name} ready`;
    case "preparing": return `Preparing ${name}`;
    case "loading": return `Loading ${name}`;
    case "checking": return `Checking ${name}`;
    case "failed": return `${name} needs attention`;
    case "missing": return `${name} files missing`;
    case "removing": return `Removing ${name}`;
    case "unprepared": return `${name} preparation required`;
  }
}

function workText(state: AssistantState["work"]): string | null {
  switch (state.status) {
    case "idle": return null;
    case "queued": return "Response queued";
    case "checking_context": return "Preparing your message";
    case "compacting": return "Making room for this conversation";
    case "generating": return state.hasContent ? "Response started" : "Generating locally";
    case "completed": return "Response complete";
    case "stopped": return "Response stopped";
    case "failed": return "Response failed";
  }
}

export function ActivityStatus({ completedResponse, model, state }: ActivityStatusProps) {
  const work = workText(state.work);
  const completedResponseText = completedResponse ? markdownToPlainText(completedResponse) : null;
  const completionAnnouncement = state.work.status === "completed" && completedResponseText ? `Response complete. ${completedResponseText}` : null;
  const storage = state.storage.status === "temporary" ? "Not saved" : state.storage.status === "deletion_unverified" ? "Deletion not verified" : null;
  return (
    <div aria-atomic="true" className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-zinc-500 dark:text-zinc-400" role="status">
      <span aria-hidden={completionAnnouncement ? "true" : undefined}>{work ?? modelText(state.models, model)}</span>
      {completionAnnouncement ? <span className="sr-only">{completionAnnouncement}</span> : null}
      {storage ? <span>· {storage}</span> : null}
    </div>
  );
}
