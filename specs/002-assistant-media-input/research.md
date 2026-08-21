# Research: Multimodal Persona Assistant Input

**Feature**: 002-assistant-media-input
**Date**: 2026-08-20

## Question 1: What shape should image and audio input take?

**Decision**: Keep a provider-neutral MediaPart in the feature domain and map it to an ordered Prompt API content array only inside browserLanguageModel.ts. Preserve the selected source as a Blob at the feature boundary; do not make thumbnails, object URLs, or decoded/transcoded copies the model input.

**Evidence**:

- The official Chrome Prompt API multimodal documentation describes text, image, and audio as ordered content parts in one user message. Images may be image/canvas/video data or a Blob; audio may be an AudioBuffer, buffer view, ArrayBuffer, or Blob.
- The installed @types/dom-chromium-ai package models LanguageModelMessage.content and the image/audio types, but its value union is narrower than the current documentation in some cases. This is an adapter typing concern, not a reason to change the feature boundary.
- Existing src/features/assistant/types.ts and model/modelAdapter.ts currently expose text-only strings. A provider-native type leaking into those domain types would couple UI, persistence, and tests to a changing browser API.

**Alternatives rejected**:

- Persisting a File or provider-native value in a message: violates the raw-media lifecycle and cannot be reliably serialized.
- Sending a thumbnail or audio metadata as a substitute for the selected source: changes the user’s requested analysis.
- Adding a conversion dependency: unnecessary and would alter bytes before the provider sees them.

## Question 2: How can the feature avoid arbitrary attachment limits?

**Decision**: Probe availability independently for text-only, text+image, and text+audio. Do not invent product caps for attachment count, bytes, dimensions, duration, or mixed combinations. The selected model/environment is authoritative through capability responses, measureContextUsage(), native rejection, and local resource failures.

**Evidence**:

- Prompt API expectedInputs reports supported input modalities, not a portable maximum attachment count, byte size, image dimension, audio duration, or complete combination matrix.
- The specification’s prompt validation is aggregate/implementation-defined; unsupported combinations may reject with NotSupportedError.
- measureContextUsage() is the available aggregate usage signal and must receive the same structured content shape used for prompting.

**Implementation consequence**: A picker may stage multiple image/audio files. The send path rechecks capability and measurement, then reports the provider’s actionable error while preserving eligible staged content for correction/retry. “Multiple” is not a hidden product limit; it is bounded only by the model/browser/resource behavior observed at send time.

## Question 3: Can a media-bearing native session be reused?

**Decision**: No. Destroy a native session after a media-bearing turn terminalizes, stops, fails, or is replaced for retry. Rebuild the next session from persisted text-only reconstruction plus non-model media labels.

**Evidence**:

- The existing assistant intentionally retains and reuses a native session for text continuity (src/features/assistant/model/modelSessionCache.ts). Prompting a native session appends content to that session’s internal context.
- Excluding raw media from context/prompt.ts and context/compaction.ts does not remove raw media already retained by the browser session.
- Session destruction is therefore required to make the replay/compaction guarantee true rather than merely a serialization convention.

**Alternatives rejected**:

- Reusing the session and trusting app-level reconstruction: hidden provider state could still contain source bytes.
- Replaying raw media into every later session: conflicts with one-shot input and increases privacy/resource exposure.

## Question 4: Where can raw media live while a queued turn is pending?

**Decision**: Use a page-local EphemeralMediaStore keyed by submission/turn and owner window ID. Existing per-session Web Locks continue to serialize queue work, but only the owner page may claim a media turn. If that page reloads or closes before the turn is accepted, the persisted turn becomes interrupted/requires_reattach; a new attachment creates a new turn.

**Evidence**:

- Existing queue processing allows any window to claim the oldest queued turn under a per-session Web Lock (src/features/assistant/storage/* and AssistantWorkspace.tsx).
- Raw Blobs in one document cannot be reconstructed by another document, and BroadcastChannel would not make durable source storage safe.
- The clarified product rule says media survives in memory for a valid retry, but after reload or when the text/media pair is no longer submittable it becomes undiscoverable and must be reattached.

**Alternatives rejected**:

- IndexedDB raw-media storage: would make media durable and replayable, contrary to the clarified one-shot/privacy boundary.
- Letting another window claim the turn and send only text: silently drops user input.
- Broadcasting raw bytes between windows: increases exposure and still fails after all owners close.

## Question 5: What should durable history retain?

**Decision**: Add a separate media-history record. For images, derive a bounded small thumbnail locally plus accessible text metadata. For audio, retain a labelled identity and available metadata such as MIME type, byte length, and duration when measurable; do not persist an audio source or waveform. Temporary mode keeps the same representations in memory and visibly marks them as not saved.

**Evidence**:

- The clarified requirement allows a tiny thumbnail/label for text history but explicitly excludes feeding media into future turns.
- A separate table makes deletion, size accounting, and the “no raw source in messages/turns” invariant auditable.
- Image decode can fail; the representation must fall back to accessible metadata rather than claim a preview that was not generated.

**Alternatives rejected**:

- Persisting original media: violates one-shot storage semantics and creates unnecessary privacy/capacity risk.
- Storing only a generic “image attached” string: loses useful history context and does not satisfy the requested tiny preview/identity behavior.
- Storing audio waveform data: adds derived media that has no current replay use.

## Question 6: What existing code and tests are the integration surface?

**Decision**: Extend the existing assistant modules and test harness; add no runtime dependency.

**Relevant local surfaces**:

- Domain/orchestration: src/features/assistant/types.ts, AssistantWorkspace.tsx, reducer.ts.
- Model boundary: src/features/assistant/model/modelAdapter.ts, browserLanguageModel.ts, modelSessionCache.ts, errorMapping.ts.
- Context: src/features/assistant/context/prompt.ts, compaction.ts, contextManager.ts.
- Storage: src/features/assistant/storage/database.ts, repository.ts, dexieRepository.ts, memoryRepository.ts, repositoryFallback.ts.
- UI: components/Composer.tsx, Transcript.tsx, plus a dedicated media attachment renderer (generated-content rendering remains separate).
- Existing deterministic coverage: tests/unit/assistant/*, tests/component/assistant/*, tests/fixtures/fakeLanguageModel.ts, and tests/e2e/assistant-*.spec.ts.

**Verification decision**: Fake-model tests prove content shape, privacy, lifecycle, and queue ownership deterministically. Owner-controlled secure Chrome tests are additionally required for real capability variability, audio/GPU availability, native measurement, and provider rejection. One evidence tier must not be presented as the other.

## Sources

- [Chrome Prompt API multimodal capabilities](https://developer.chrome.com/docs/ai/prompt-api#multimodal-capabilities)
- [Prompt API content-type availability](https://webmachinelearning.github.io/prompt-api/#language-model-content-type-availability)
- [Prompt API prompt validation and canonicalization](https://webmachinelearning.github.io/prompt-api/#validate-and-canonicalize-a-prompt)

All technical-context unknowns are resolved for planning. Runtime model limits remain intentionally provider/environment-authoritative rather than converted into arbitrary product constants.
