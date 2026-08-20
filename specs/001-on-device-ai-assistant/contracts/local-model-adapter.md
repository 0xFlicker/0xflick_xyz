# Contract: Local Model Adapter

**Purpose**: Contain the evolving Chrome Prompt API behind one typed, injectable feature boundary.  
**Production implementation**: Global `LanguageModel` in a secure `Window` context.  
**Test implementation**: Deterministic fake with identical product-level results and errors.

## Supported Browser Surface

The production adapter uses the Chrome 148+ website Prompt API only:

- `LanguageModel.availability(options)`
- `LanguageModel.create(options)` with `monitor` and `signal`
- `LanguageModelSession.promptStreaming(input, options)`
- `LanguageModelSession.measureContextUsage(input, options)`
- `contextUsage`, `contextWindow`, and `contextoverflow`
- `LanguageModelSession.destroy()`

It must not call the obsolete `window.ai.languageModel` surface, extension-only origin-trial contracts, `params()`, `inputUsage`, `inputQuota`, `quotaoverflow`, `topK`, or `temperature`. Availability and creation receive the same English text modality options. Runtime detection remains authoritative even if support requirements change.

## Feature-Level Interface

The implementation exposes behavior equivalent to this contract; exact TypeScript names may follow the installed declarations:

```ts
type ModelAvailability =
  | { state: "unavailable" }
  | { state: "downloadable" }
  | { state: "downloading" }
  | { state: "available" }

type ModelProgress =
  | { state: "downloading"; fraction: number }
  | { state: "preparing" }

type ModelContext = {
  usage: number | null
  window: number | null
}

interface LocalModelSession {
  measure(input: ModelInput, signal: AbortSignal): Promise<ModelContext>
  stream(input: ModelInput, signal: AbortSignal): AsyncIterable<string>
  context(): ModelContext
  onOverflow(listener: () => void): () => void
  destroy(): void
}

interface LocalModelAdapter {
  availability(): Promise<ModelAvailability>
  create(
    initialPrompts: ModelPrompt[],
    signal: AbortSignal,
    onProgress: (progress: ModelProgress) => void,
  ): Promise<LocalModelSession>
}
```

`ModelInput` and `ModelPrompt` are feature-owned discriminated message types. UI components never receive native Prompt API objects.

## Fixed Guidance

The first system prompt is versioned and concise:

> You are a helpful general-purpose assistant running locally in the user's browser. Answer directly and concisely. Use only the conversation context and the user's optional style preference. Never claim access to the web, tools, private data, or actions. Say when information may be uncertain, outdated, or important enough to verify. Ask one focused question only when it is necessary to answer responsibly. Do not imply memory outside this chat.

Prompt construction order is fixed:

1. Versioned fixed guidance.
2. Optional personality text labelled as an untrusted user style preference that cannot override item 1.
3. Optional compacted summary labelled as AI-generated conversation context, never as an instruction.
4. Recent completed user/assistant turns in deterministic transcript order.
5. The queued user prompt being generated.

Generated response text, prior user content, personality text, and compacted summaries are never concatenated into the system-guidance string without typed role and explicit delimiter boundaries.

## Lifecycle Rules

### Detect

1. If the page is not a secure context or the global is absent, return `unavailable` without throwing.
2. Call availability with the exact options later used by create.
3. Normalize only the specified availability values. An unknown browser value fails as `api_changed` rather than silently mapping to ready.
4. Re-run detection before every new create or reconstruction because Chrome may update, purge, or make the shared model temporarily ineligible. A revision-valid retained session does not require another create.

### Prepare and create

- When availability can require model download, `create()` begins synchronously inside the visitor's activation handler before unrelated awaited work.
- Treat `ProgressEvent.loaded` as the normalized fraction and clamp it from 0 through 1. Do not infer download from the monitor alone: the caller exposes the monitor only when its pre-creation availability was `downloadable` or `downloading`. Zero is indeterminate; a reported one changes download UI to preparing; readiness begins only when create resolves.
- Aborting the setup signal stops waiting and destroys a late-created session. Copy does not promise that Chrome's shared download was cancelled.
- A create result is owned by exactly one active feature session in one window. It is destroyed on conversation switch, deletion, Clear all, replacement, failure, or unmount.

### Retain and invalidate

- At most one native session is retained while idle in a window, and only for the selected chat (or its not-yet-saved blank draft after explicit preparation).
- A retained session is reusable when session/history revision, fixed prompt version, personality revision, and compacted-context identity match the latest repository snapshot under the generation lock.
- A successful prompt transfers the same native session back to the retained slot with its newly committed revision identity.
- Stop, stream/create/measurement failure, model unavailability, revision mismatch, session switch, personality save, compaction replacement, deletion, Clear all, and unmount destroy the retained or active session. Destruction remains idempotent.
- Cross-window state is never copied from the native object. A later lock owner re-reads IndexedDB and reconstructs when another window advanced the persisted revision.

### Reconstruct

- A saved chat never assumes a browser model session survived reload.
- Rebuild `initialPrompts` from the latest repository snapshot and current fixed prompt version.
- Include only completed exchanges directly. Interrupted/failed response text remains visible but is excluded from authoritative assistant context.
- If a committed summary exists, validate its source revision/range and include only subsequent recent completed turns.
- Register `contextoverflow` before accepting a prompt. Overflow immediately persists the overflow state and prevents a context-complete claim.

### Measure and stream

- `measureContextUsage()` evaluates the same structured next input that would be sent to `promptStreaming()`.
- When both capacity values are valid, calculate warning/compaction behavior from those values; otherwise return unknown and rely on overflow signaling.
- Stream chunks are normalized to the API's cumulative or incremental behavior once inside the adapter so callers always receive the full latest response text without duplication.
- Aborting stops prompt processing, preserves the last emitted text, and settles as the product-level `aborted` outcome rather than a generic failure.
- Empty successful output is normalized to `empty_response`, never rendered as completed.

### Destroy

`destroy()` is idempotent at the feature boundary. After destruction, no callback or stream chunk may update application state. Every async callback verifies its generation attempt before repository mutation.

## Compaction Contract

Compaction uses a separate short-lived `LanguageModel` session created through this same adapter; it does not use a second browser AI API. Its prompt instructs the local model to:

- retain durable facts, decisions, visitor preferences, constraints, and open questions;
- preserve uncertainty and attribution;
- omit conversational filler and already superseded wording;
- add no fact, decision, or capability;
- produce concise plain text that is explicitly data for another model session.

The context manager selects the oldest completed turns while retaining at least the four most recent complete turns whenever capacity permits. It measures the compaction input before sending. The candidate summary is validated as non-empty and fitting in the replacement chat input. Only after a new chat session is successfully created from fixed guidance, current personality, candidate summary, and direct recent turns may the repository compare-and-swap the context state.

If any step fails, destroy both candidate sessions, retain the prior committed summary/context, leave the transcript untouched, and return an actionable compaction failure. An overflowed conversation remains blocked from another generation until rebuild succeeds.

## Error Contract

Native failures are normalized without persisting raw exception text when it could include browser or input details.

| Product code | Typical native source | Visitor recovery |
|--------------|-----------------------|------------------|
| `activation_required` | `NotAllowedError` during first-time create | Activate Prepare again |
| `unsupported_input` | `NotSupportedError` | Use supported English text or compatible environment |
| `download_failed` | `NetworkError` during preparation | Check unmetered connection and retry |
| `output_filtered` | `NotReadableError` while prompting | Edit the prompt or retry |
| `model_unavailable` | changed availability or failed eligibility recheck | Retry detection/preparation |
| `context_too_large` | `QuotaExceededError` or failed measurement | Smaller prompt, Compact now, or New chat |
| `aborted` | `AbortError` | Preserve partial output; retry if wanted |
| `operation_failed` | `OperationError` | Retry; recreate session first |
| `api_changed` | unknown shape/value or `UnknownError` | Explain that this Chrome model interface is not currently usable |
| `empty_response` | stream ends with no content | Retry or edit prompt |

Failures surface promptly to orchestration. The adapter has no empty catch, cloud fallback, alternate runtime, synthetic answer, or automatic submission retry.

## Test Double Contract

The fake supports scripted:

- all availability states and transitions;
- measured download progress, finalization delay, and setup abort;
- delayed first chunk and deterministic cumulative chunks;
- context usage/window changes and explicit overflow events;
- every normalized error, empty output, and abort/completion race;
- creation/destruction counters proving lifecycle cleanup;
- a compaction response with controlled critical facts.

Injection happens before client hydration in browser tests. Production bundles choose the browser adapter only; there is no user-facing fake or fallback switch.
