# Implementation Plan: Multimodal Persona Assistant Input

**Branch**: `002-assistant-media-input` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-assistant-media-input/spec.md`

## Summary

Add image and audio attachments to the browser-local persona assistant when the selected Chrome Prompt API model accepts those modalities. A submission carries the exact selected media only through the active turn and any eligible retry. The raw `Blob` values remain in page memory, never enter IndexedDB, replay, compaction, logs, URLs, or network requests. Durable history stores only a bounded image thumbnail or an audio identity/accessibility representation. Native multimodal sessions are discarded after a media-bearing turn so a later text-only session cannot retain media in hidden model context. Queue ownership binds a media turn to the page that owns its raw bytes; a reload or owner loss makes the turn require reattachment rather than allowing another window to send an incomplete request.

The implementation extends the existing assistant domain types, model adapter, workspace/composer, context reconstruction and compaction, and Dexie/memory repositories. It adds a dedicated media-history record and an ephemeral media store, while keeping the existing terminal-turn immutability, per-session Web Lock, temporary-mode, privacy, and accessibility contracts.

## Technical Context

**Language/Version**: TypeScript (strict), React 18, Next.js 14 App Router
**Primary Dependencies**: Existing `dexie`, `@types/dom-chromium-ai`, `fake-indexeddb`, Vitest, Playwright; no new runtime dependency
**Storage**: Dexie/IndexedDB for text and bounded media-history representations; in-memory repository for temporary mode/tests; page-local in-memory raw-media store for the current submission and retry only
**Testing**: `yarn lint`, `yarn typecheck`, `yarn validate:content`, `yarn test:content`, `yarn test:assistant`, `yarn build`, `yarn test:e2e:assistant`; real owner-Mac Chrome Prompt API acceptance for image/audio capability and provider rejection behavior
**Target Platform**: Secure-context desktop Chrome with the browser Prompt API (currently validated against the project’s Chrome 148+ target); model availability, GPU, storage, and hardware remain runtime-dependent
**Project Type**: Next.js web application with an existing browser-local assistant feature under `src/features/assistant/`
**Performance Goals**: Attachment selection and staged preview remain local and responsive; submit acknowledgement is immediate; thumbnail derivation is bounded and asynchronous; model generation remains provider-dependent
**Constraints**: No cloud upload, remote media URL, analytics/logging of media, camera/microphone/screen capture, media generation, automatic media conversion, or arbitrary product caps on count/bytes/dimensions/duration/combination. Native capability, measurement, rejection, and local resource limits are authoritative. Raw media is undiscoverable after the text becomes unsubmitable with it or after page reload.
**Scale/Scope**: Support as many attachments and combinations as the selected model/environment reliably accepts; do not add a product-defined maximum. Persist one bounded history representation per accepted attachment and delete it with its owning session/message.

## Constitution Check

*Gates evaluated before design; rechecked after Phase 1 below.*

### Before design

- **I. Product/Architecture Fit**: PASS — extends the existing browser-local assistant and Chrome Prompt API boundary without adding a server or cloud dependency.
- **II. Simplicity and Scope**: PASS — one-shot media plus retry is the smallest end-to-end behavior matching the clarified requirements; no speculative media library or durable raw-media store.
- **III. Modularity**: PASS — domain media types, native adapter mapping, ephemeral ownership, durable history, and UI rendering remain separate concerns.
- **IV. Privacy and Data Minimization**: PASS — raw bytes are page-local only; durable history contains bounded, user-visible representations rather than source media.
- **V. Accessibility and Failure Clarity**: PASS — attachment state, provider rejection, reattachment, and temporary-mode behavior are announced with accessible text and actionable controls.
- **Technical delivery**: PASS — existing dependencies and test harnesses are reused; no migration compatibility layer or feature flag is introduced.

## Project Structure

### Documentation (this feature)

```text
specs/002-assistant-media-input/
├── plan.md                         # This implementation plan
├── research.md                     # Phase 0 decisions and evidence
├── data-model.md                   # Phase 1 entities, schema, and lifecycles
├── quickstart.md                   # Deterministic and real-browser verification
├── contracts/
│   ├── media-model-adapter.md      # Prompt API/capability boundary
│   ├── media-persistence.md        # Repository and queue ownership boundary
│   └── media-workspace.md          # UI and user-flow boundary
└── checklists/requirements.md      # Existing requirements validation
```

### Source Code

```text
src/features/assistant/
├── types.ts                        # Domain media parts, capabilities, and references
├── AssistantWorkspace.tsx          # Submit/retry/reload/queue lifecycle orchestration
├── components/Composer.tsx         # Picker, staged attachments, capability/error states
├── components/Transcript.tsx       # Durable thumbnail/audio identity rendering
├── components/MediaAttachment.tsx  # Dedicated accessible media-history/current-turn view
├── context/prompt.ts               # Text-only reconstruction after terminal media turns
├── context/compaction.ts           # Text-only summaries with media labels only
├── model/modelAdapter.ts           # Provider-neutral multimodal adapter contract
├── model/browserLanguageModel.ts   # Chrome Prompt API capability/content mapping
├── model/modelSessionCache.ts      # Session invalidation after media-bearing turns
├── storage/database.ts             # Dexie schema/version and media-history table
├── storage/repository.ts           # Repository interfaces and ownership operations
├── storage/dexieRepository.ts      # IndexedDB implementation and deletion transactions
├── storage/memoryRepository.ts    # Temporary-mode/test implementation
└── storage/ephemeralMediaStore.ts # Page-local raw Blob ownership and retry eligibility

tests/
├── unit/assistant/                  # Adapter, context, storage, and fake-model tests
├── components/assistant/            # Composer/transcript accessibility and flow tests
└── e2e/assistant-media.spec.ts      # Browser-local multimodal and reload/ownership flows
```

## Phase 0: Research and Decisions

The unknowns are resolved in [research.md](research.md). The implementation must follow these decisions:

1. Use ordered native Prompt API content arrays at the adapter boundary; keep provider-native values out of UI and persistence types.
2. Probe text-only, text+image, and text+audio availability independently. Do not infer a complete combination matrix from one aggregate probe. Let runtime measurement and native rejection enforce model/environment limits; product code adds no arbitrary attachment cap.
3. Preserve the selected bytes as a `Blob` at the feature boundary. If the installed Chromium declaration is narrower than the official API, isolate a small local type augmentation/adapter cast and verify the actual Chrome value path; do not silently transcode or resize the model input.
4. Store raw media in a page-local `EphemeralMediaStore` keyed by turn/submission and owner window ID. Existing per-session Web Locks still serialize work, but a queued media turn is claimable only by the page that can provide its raw bytes.
5. Destroy a native session after a media-bearing turn is terminal, stopped, failed, or replaced for retry, then rebuild future context from persisted text and media-history references only. This prevents raw content retained inside a reused native session from violating replay/compaction privacy.
6. Persist a separate bounded media-history representation: a small locally-derived image thumbnail or an audio label plus accessible metadata. Never persist source bytes, object URLs, or a representation as model input.

## Phase 1: Design and Implementation Plan

### 1. Domain and provider boundary

- Extend assistant domain types with `MediaPart` (`kind`, exact source `Blob`, MIME type, filename/accessible label, measured metadata), `MediaCapability`, and `MediaHistoryRepresentation` references. Keep `AcceptPromptInput` and persisted messages explicit about optional media rather than overloading text.
- Add adapter methods for independent capability snapshots, ordered content-array construction, aggregate context measurement, streaming, and normalized unsupported/resource errors. Map image and audio values only in `browserLanguageModel.ts`; do not expose `LanguageModelMessageValue` to React or repositories.
- Add tests using a fake model that captures the exact ordered content array and reports independent modality capabilities, aggregate usage, and native rejection. Include multiple attachments and mixed image/audio cases without a product cap.

### 2. Ephemeral media and turn lifecycle

- Add `ephemeralMediaStore.ts` with an owner/window identifier, turn/submission key, exact selected `Blob`s, and retry eligibility. It exposes no serialization or URL export API.
- On submit, persist text, media kinds, history-representation metadata, and owner identity; place raw parts in the page-local store before queue processing. A retry creates a new immutable turn and reuses raw parts only while the prior owner still has an eligible in-memory attempt.
- On terminalization, cancellation that makes the text/media pair unsubmitable, stop, provider failure, or successful replacement, revoke any local preview URLs and release raw parts according to the lifecycle in [data-model.md](data-model.md). Keep them only when the UI explicitly offers a still-valid retry.
- On reload/owner loss, mark an unprocessed media turn `requires_reattach`/interrupted with its text and history representation intact; do not let another window claim it without new raw media. A reattachment creates a new turn rather than mutating the old one.

### 3. Native session lifecycle and context safety

- Extend `AssistantWorkspace.tsx` submit/retry orchestration to pass structured media only for the active turn.
- Include expected input modality identity in `modelSessionCache.ts`. A session that receives media is invalidated after stop, failure, terminal completion, or retry; subsequent text-only turns create a fresh session from `buildReconstructionPrompts`.
- Update `context/prompt.ts` and `context/compaction.ts` so replay/compaction includes text plus an accessible media label/metadata only when useful to explain the historical turn; it never includes a thumbnail or source media value as a model content part.
- Add tests asserting that reconstruction and compaction never contain raw bytes, object URLs, or native image/audio values, and that a reused session cannot carry media across a later text-only turn.

### 4. Persistence and deletion

- Add a Dexie schema version containing a dedicated `mediaHistory`/`mediaRepresentations` table with indexes for session, turn, message, and creation order. Store thumbnail blobs only for images; store audio identity/accessibility metadata without source audio. Mirror the same records in the memory repository.
- Extend repository transactions for enqueue/claim/finish, session deletion, clear-all, tombstones, and temporary-mode warning state. Deleting a session removes all related history representations atomically; no raw-media table or durable blob store is added.
- Preserve the existing queue’s per-session Web Lock and add owner-aware claim checks/lease cleanup. Add deterministic tests for concurrent windows, owner disappearance, reattachment, deletion, and temporary mode.

### 5. Composer, transcript, and accessibility

- Add a native file picker with image/audio accept hints and multiple selection. Capability state must disable only unsupported modality actions, while stale staged attachments remain removable and are rechecked at send time.
- Show current-turn previews and labels without sending a thumbnail in place of the selected source. Expose file name/type/size and, when available, dimensions or duration through accessible text; announce provider rejection, local resource failure, and reattachment requirements with recovery actions.
- Render durable history through a dedicated `MediaAttachment` component. Image thumbnails are bounded history previews with text fallback; audio is a labelled identity/metadata row, not an audio source replay control. Temporary-mode history is memory-only and visibly marked “Not saved.”
- Keep generated assistant content rendering unchanged; do not treat user attachments as generated media.

### 6. Verification

- Add unit/component/e2e coverage described in [quickstart.md](quickstart.md), including no-egress assertions and exact content-array capture.
- Run deterministic local checks and a production-like build. On an owner-controlled secure Chrome machine, verify capability variability, image/audio acceptance, mixed attachments, provider rejection, GPU/storage unavailability, retry, reload/reattach, and cross-window ownership. Record native acceptance separately from fake-model test results.

## Phase 1 Artifacts

- [research.md](research.md)
- [data-model.md](data-model.md)
- [contracts/media-model-adapter.md](contracts/media-model-adapter.md)
- [contracts/media-persistence.md](contracts/media-persistence.md)
- [contracts/media-workspace.md](contracts/media-workspace.md)
- [quickstart.md](quickstart.md)

## Constitution Check (post-design)

- **I. Product/Architecture Fit**: PASS — all provider-specific behavior is isolated in the existing model adapter and the feature remains browser-local.
- **II. Simplicity and Scope**: PASS — page-memory source media, one bounded history record, and owner-aware queue handling directly implement the clarified lifecycle; no durable media library, capture pipeline, or arbitrary limits.
- **III. Modularity**: PASS — persistence, ephemeral ownership, native mapping, session invalidation, context, and rendering have explicit boundaries and contracts.
- **IV. Privacy and Data Minimization**: PASS — source bytes cannot enter repository/replay/compaction/network paths; history representation is intentionally lossy and bounded.
- **V. Accessibility and Failure Clarity**: PASS — every unsupported, unavailable, interrupted, or reattachment state has visible and accessible explanation plus a recovery path.
- **Technical delivery**: PASS — uses current dependencies and test commands; schema upgrade is additive for existing local data with no dual-write compatibility path.

## Complexity Tracking

No constitution violations or speculative complexity. The additional media-history table is required to keep bounded previews/labels separately deletable and to guarantee that raw media is never stored in message or turn records. The owner-aware queue state is required because the existing multi-window queue can otherwise claim a turn whose source bytes exist only in another page’s memory.
