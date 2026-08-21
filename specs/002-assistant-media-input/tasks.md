---

description: "Actionable task list for multimodal persona assistant input"
---

# Tasks: Multimodal Persona Assistant Input

**Input**: Design documents from /specs/002-assistant-media-input/

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included because the feature specification defines mandatory user scenarios, measurable acceptance criteria, privacy guarantees, and browser validation requirements.

**Organization**: Tasks are grouped by user story. Shared domain, storage, model, and lifecycle work is completed in the Foundational phase before story-specific UI flows.

## Phase 1: Setup (Shared Test Infrastructure)

**Purpose**: Establish deterministic media fixtures and fake-provider behavior without adding runtime dependencies.

- [X] T001 [P] Add valid, empty, corrupt, and mixed image/audio Blob fixtures with accessible metadata helpers in tests/fixtures/mediaFixtures.ts
- [X] T002 [P] Extend the fake model adapter/session to report independent modality capabilities, capture ordered structured inputs, return measurement data, and simulate provider/resource rejection in tests/fixtures/fakeLanguageModel.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the privacy, persistence, provider, and queue boundaries required by every media user story.

**CRITICAL**: No user story implementation can begin until this phase is complete.

- [X] T003 Define MediaPart, MediaCapability, MediaHistoryRepresentation, media lifecycle states, and media-specific error/ownership fields in src/features/assistant/types.ts
- [X] T004 Implement the page-local EphemeralMediaStore keyed by submission/turn and owner window ID, with exact Blob retention, retry eligibility, owner checks, and explicit release reasons in src/features/assistant/storage/ephemeralMediaStore.ts
- [X] T005 Extend the provider-neutral LocalModelAdapter and LocalModelSession contracts for capability snapshots, structured text/image/audio input, aggregate measurement, and media-session invalidation in src/features/assistant/model/modelAdapter.ts
- [X] T006 Map provider-neutral MediaPart values to ordered Chrome Prompt API content arrays, independently probe text+image and text+audio availability, and normalize unsupported/resource failures at the adapter boundary in src/features/assistant/model/browserLanguageModel.ts
- [X] T007 Implement bounded local image-thumbnail derivation and audio identity/metadata extraction with accessible fallback text, without changing the source Blob sent to the model, in src/features/assistant/storage/mediaHistory.ts
- [X] T008 Add the media-history table, indexes, and schema upgrade to the Dexie database in src/features/assistant/storage/database.ts
- [X] T009 Extend repository inputs, snapshots, queue claims, media-history records, owner cleanup, and deletion transactions in src/features/assistant/storage/repository.ts and src/features/assistant/storage/dexieRepository.ts
- [X] T010 Mirror media-history, owner-aware queue, reattachment, temporary-mode, and deletion behavior in src/features/assistant/storage/memoryRepository.ts and src/features/assistant/storage/repositoryFallback.ts
- [X] T011 Update prompt reconstruction and compaction to retain text plus optional accessible media labels only, excluding source Blobs, thumbnails, object URLs, and native media values in src/features/assistant/context/prompt.ts and src/features/assistant/context/compaction.ts
- [X] T012 Invalidate any native session after a media-bearing turn is terminal, stopped, failed, or replaced for retry, then rebuild text-only context in src/features/assistant/model/modelSessionCache.ts and src/features/assistant/AssistantWorkspace.tsx
- [X] T013 Add owner-aware queue processing, reload/owner-loss reattachment transitions, immutable retry turn creation, and raw-media release hooks to src/features/assistant/AssistantWorkspace.tsx and src/features/assistant/reducer.ts
- [X] T014 [P] Add unit coverage for adapter content mapping, capability probes, media representation invariants, repository deletion, owner claims, context reconstruction, compaction, and session invalidation in tests/unit/assistant/mediaFoundation.test.ts

**Checkpoint**: The domain and persistence boundaries cannot serialize raw media, fake-provider inputs are observable, and a media turn cannot be claimed without its page-local owner.

---

## Phase 3: User Story 1 - Ask About an Image (Priority: P1) 🎯 MVP

**Goal**: Let an image-capable local model analyze a selected image for one turn, show a reviewable preview, and return to text-only follow-up context.

**Independent Test**: In an image-capable fake-model profile, attach an image with and without text, verify the exact image is sent once and acknowledged immediately, remove a staged image without changing drafted text, ask a text-only follow-up, and reattach the image as a new turn.

### Tests for User Story 1

- [X] T015 [P] [US1] Add image capability, exact Blob content, optional-text, removal, retry, and text-only-follow-up unit tests in tests/unit/assistant/mediaFoundation.test.ts
- [X] T016 [P] [US1] Add keyboard/component tests for image picker visibility, preview metadata, removal, send acknowledgement, validation failure, and accessible status text in tests/component/assistant/media.test.tsx
- [X] T017 [P] [US1] Add browser coverage for image one-shot generation, transcript preview, later text-only follow-up, reload reattachment, and no media network egress in tests/e2e/assistant-media.spec.ts

### Implementation for User Story 1

- [X] T018 [US1] Add capability-gated multiple image file selection, staged source ownership, preview metadata, removal, and preserve-draft behavior to src/features/assistant/components/Composer.tsx
- [X] T019 [US1] Add the dedicated current-turn image preview and terminal bounded-thumbnail renderer with accessible fallback text in src/features/assistant/components/MediaAttachment.tsx
- [X] T020 [US1] Render image attachments distinctly from generated assistant content and preserve temporary-mode “Not saved” disclosure in src/features/assistant/components/Transcript.tsx
- [X] T021 [US1] Pass selected image parts with optional text through acceptance, measurement, queueing, streaming, and retry while creating a new immutable retry turn in src/features/assistant/AssistantWorkspace.tsx
- [X] T022 [US1] Verify image history labels/thumbnails are excluded from follow-up model input and compaction while the terminal user message remains visible in src/features/assistant/context/prompt.ts and src/features/assistant/context/compaction.ts

**Checkpoint**: User Story 1 works independently with a fake image-capable model and can be validated in owner-controlled Chrome without audio support.

---

## Phase 4: User Story 2 - Ask About Audio (Priority: P2)

**Goal**: Reuse the one-shot flow for audio files, with local playback when decodable and identity/metadata history when playback or source replay is unavailable.

**Independent Test**: In an audio-capable fake-model profile, select an audio item, verify identity and optional playback, send it with and without text, handle preview failure without blocking model acceptance, then confirm later text turns require reattachment.

### Tests for User Story 2

- [X] T023 [P] [US2] Add audio capability, exact audio Blob content, metadata, playback limitation, mixed-input, retry, and text-only-follow-up unit tests in tests/unit/assistant/audioMedia.test.ts
- [X] T024 [P] [US2] Add keyboard/component tests for audio selection, playback controls, identity fallback, removal, provider rejection, and accessible duration/status text in tests/component/assistant/composer-audio.test.tsx
- [X] T025 [P] [US2] Add browser coverage for audio one-shot generation, local playback fallback, text-only follow-up, reload reattachment, and no media network egress in tests/e2e/assistant-media.spec.ts

### Implementation for User Story 2

- [X] T026 [US2] Extend the composer and MediaAttachment renderer with audio file selection, local playback when decoding permits, identity metadata, and preview-failure fallback in src/features/assistant/components/Composer.tsx and src/features/assistant/components/MediaAttachment.tsx
- [X] T027 [US2] Persist labelled audio history representations and render them without an audio source replay control in src/features/assistant/storage/mediaHistory.ts and src/features/assistant/components/Transcript.tsx
- [X] T028 [US2] Extend workspace submission, measurement, streaming, retry, stop, and session invalidation to support audio and accepted mixed image/audio content arrays in src/features/assistant/AssistantWorkspace.tsx
- [X] T029 [US2] Add audio-specific normalized errors and recovery copy for unreadable, unsupported, context-limited, and provider-rejected input in src/features/assistant/model/errorMapping.ts and src/features/assistant/components/ActivityStatus.tsx

**Checkpoint**: User Stories 1 and 2 both support their respective modality without replaying raw media into later turns; mixed input is accepted only when the provider accepts it.

---

## Phase 5: User Story 3 - See Only Capabilities That Work (Priority: P3)

**Goal**: Keep controls truthful as model capabilities change, without imposing arbitrary attachment count, byte, dimension, duration, or combination limits.

**Independent Test**: Exercise text-only, image-only, audio-only, and mixed-capable fake profiles; verify only supported actions are exposed, capability loss blocks send without discarding staged items, and provider/resource limits are reported without product-limit messaging.

### Tests for User Story 3

- [X] T030 [P] [US3] Add capability-profile and capability-change unit tests for independent text/image/audio probes and send-time rechecks in tests/unit/assistant/browserLanguageModel.test.ts
- [X] T031 [P] [US3] Add component tests for modality-specific controls, stale staged attachments, provider rejection, measurement failure, and accessible capability status in tests/component/assistant/availability-media.test.tsx
- [ ] T032 [P] [US3] Add browser coverage for text-only, image-only, audio-only, mixed-capable, capability-loss, and provider-limit profiles in tests/e2e/assistant-capabilities.spec.ts

### Implementation for User Story 3

- [X] T033 [US3] Expose independent image/audio availability and refresh capability snapshots after preparation, model replacement, failure retry, and environment changes in src/features/assistant/model/browserLanguageModel.ts and src/features/assistant/AssistantWorkspace.tsx
- [X] T034 [US3] Gate attachment actions by current modality capability while keeping staged items removable/reviewable after a capability change in src/features/assistant/components/Composer.tsx and src/features/assistant/components/AvailabilityPanel.tsx
- [X] T035 [US3] Recheck every selected modality and combination during measurement/send, preserve eligible source for correction, and map native/resource limits without arbitrary product caps in src/features/assistant/AssistantWorkspace.tsx and src/features/assistant/model/errorMapping.ts
- [X] T036 [US3] Add clear accessible recovery states for unsupported input, model unavailability, context pressure, GPU/storage limitations, and provider rejection in src/features/assistant/components/ActivityStatus.tsx and src/features/assistant/components/Composer.tsx

**Checkpoint**: Capability controls are truthful in all four controlled profiles and no product-defined attachment limit is introduced.

---

## Phase 6: User Story 4 - Retain and Remove Local Media Safely (Priority: P4)

**Goal**: Preserve only bounded history representations, reconcile local sessions safely, and delete media with the owning conversation in durable and temporary modes.

**Independent Test**: Send image and audio in durable and temporary repositories, reload and reopen the conversation, exercise two-window owner loss, delete one session, clear all, and inspect network/log spies for zero media egress.

### Tests for User Story 4

- [X] T037 [P] [US4] Add Dexie and memory repository tests for media-history hydration, schema upgrade, session deletion, clear-all, temporary mode, unreadable thumbnails, and orphan cleanup in tests/unit/assistant/dexieRepository.test.ts and tests/unit/assistant/mediaFoundation.test.ts
- [X] T038 [P] [US4] Add component tests for durable thumbnail/audio identity, “Not saved” temporary history, deletion state, reattachment-required status, and keyboard/screen-reader operation in tests/component/assistant/media.test.tsx and tests/component/assistant/composer-audio.test.tsx
- [ ] T039 [P] [US4] Add browser coverage for durable reload, temporary close/reload behavior, cross-window ownership, deletion, clear-all, and zero media network requests in tests/e2e/assistant-media-persistence.spec.ts

### Implementation for User Story 4

- [X] T040 [US4] Hydrate media-history representations with conversation snapshots and render bounded image/audio records after reload without source-byte reconstruction in src/features/assistant/storage/dexieRepository.ts and src/features/assistant/components/Transcript.tsx
- [X] T041 [US4] Make owner disappearance/reload transition queued media turns to interrupted/requires-reattach while retaining text/history and preventing another window from sending incomplete input in src/features/assistant/storage/dexieRepository.ts, src/features/assistant/storage/memoryRepository.ts, and src/features/assistant/AssistantWorkspace.tsx
- [X] T042 [US4] Include media-history records in verified session deletion, Clear all, tombstone cleanup, and active ephemeral release transactions in src/features/assistant/storage/dexieRepository.ts, src/features/assistant/storage/memoryRepository.ts, and src/features/assistant/AssistantWorkspace.tsx
- [X] T043 [US4] Add explicit local-only and temporary-mode disclosures for media representations without placing source bytes, metadata, object URLs, or filenames in requests, URLs, analytics, or diagnostics in src/features/assistant/components/Transcript.tsx and src/features/assistant/components/ActivityStatus.tsx
- [X] T044 [US4] Complete media attachment keyboard focus, screen-reader labels, status announcements, narrow-layout overflow, and generated-content separation in src/features/assistant/components/MediaAttachment.tsx, src/features/assistant/components/Composer.tsx, and src/features/assistant/components/Transcript.tsx

**Checkpoint**: Durable and temporary history, reload/owner reconciliation, deletion, privacy, and accessibility behavior are independently verifiable.

---

## Phase 7: Polish and Cross-Cutting Verification

**Purpose**: Validate the complete feature against the plan, constitution, and real browser/provider boundary.

- [X] T045 [P] Update the feature quickstart with the final test names, evidence-tier separation, and owner-Chrome acceptance notes in specs/002-assistant-media-input/quickstart.md
- [X] T046 [P] Add focused assertions to existing assistant context, concurrency, lifecycle, privacy, persistence, accessibility, and conversation suites for media invariants in tests/unit/assistant/, tests/component/assistant/, and tests/e2e/
- [X] T047 Run yarn lint and yarn typecheck and resolve all media-related TypeScript, accessibility, and lint failures in src/features/assistant/ and tests/
- [X] T048 Run yarn validate:content, yarn test:content, yarn test:assistant, and yarn build and record results against specs/002-assistant-media-input/quickstart.md
- [ ] T049 Execute the real secure-context Chrome acceptance matrix for image/audio capability variability, model/resource limits, mixed input, retry, reload/reattach, cross-window ownership, compaction, deletion, and no-egress behavior and record provider evidence in specs/002-assistant-media-input/quickstart.md
- [X] T050 Review the completed implementation against every FR-001–FR-034, success criterion, contract, and constitution gate; remove stale paths or silent fallbacks before implementation handoff in specs/002-assistant-media-input/plan.md and specs/002-assistant-media-input/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 tasks T001–T002 have no code dependencies and can run in parallel.
- Phase 2 depends on Phase 1 fixtures where tests are added; T003–T013 establish the shared domain, model, storage, context, and lifecycle path. T014 can run after the corresponding foundation interfaces exist.
- User Story 1 depends on the complete Foundational phase and is the MVP increment.
- User Story 2 depends on the shared foundation and the image attachment UI established by User Story 1 because Composer, Transcript, and MediaAttachment are shared files.
- User Story 3 depends on the shared model boundary and the attachment UI; capability tests can begin after T006, but integration tasks must follow the story flows.
- User Story 4 depends on the completed media flows so durable reload/deletion tests cover both modalities.
- Phase 7 depends on the stories selected for delivery and must precede any completion claim.

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only; no audio implementation is required for its independent acceptance.
- **US2 (P2)**: Depends on Phase 2 and the shared image attachment shell from US1; audio remains independently testable with a fake audio-capable model.
- **US3 (P3)**: Depends on Phase 2; its provider/capability implementation touches shared Composer/workspace files and should be integrated after or coordinated with US1/US2.
- **US4 (P4)**: Depends on US1 and US2 for complete durable-history coverage, and on US3 for capability-loss/reload edge cases.

### Within Each User Story

- Write the story tests before implementation and make them fail against the text-only baseline.
- Complete domain/provider/storage work before UI integration that consumes it.
- Keep each story’s checkpoint independently runnable with the fake model before moving to the next priority.

## Parallel Execution Examples

### User Story 1

After Phase 2, T015, T016, and T017 can run in parallel because they target unit, component, and browser test files. T018 and T019 can then proceed in parallel on Composer and the dedicated renderer; T020–T022 integrate the shared transcript/workspace/context path sequentially.

### User Story 2

After the US1 shared attachment shell exists, T023, T024, and T025 can run in parallel. T026 and T027 touch separate UI/history concerns and can be parallelized; T028 and T029 should follow the shared workspace/provider integration order.

### User Story 3

T030, T031, and T032 can run in parallel as capability tests. T033 and T035 require the adapter/workspace boundary and should be coordinated; T034 and T036 can proceed in parallel once the capability state shape is settled.

### User Story 4

T037, T038, and T039 can run in parallel. T040 and T041 touch hydration/ownership paths and should be coordinated; T042–T044 can proceed after deletion and owner-state semantics are stable.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 test fixtures.
2. Complete Phase 2 shared media boundary, page-memory store, adapter, schema, context, and session lifecycle.
3. Complete Phase 3 image story.
4. Stop at the US1 checkpoint and validate fake-model behavior plus the image-capable Chrome path.

### Incremental Delivery

1. Add US2 audio using the same one-shot and history contracts.
2. Add US3 capability truthfulness and provider-authoritative limits.
3. Add US4 durable/temporary reconciliation, deletion, privacy, and accessibility hardening.
4. Run Phase 7 checks and real-browser acceptance before claiming completion.

### Notes

- [P] means the task can be performed in parallel without modifying an incomplete dependency or the same file as another active task.
- Story labels trace tasks to the four user stories in spec.md.
- The only durable media data is a bounded history representation; raw selected Blobs remain page-local and are released after retry/unsubmitability/reload rules.
- No task may add an arbitrary attachment count, byte, dimension, duration, or mixed-combination limit.

## Phase 8: Convergence

- [ ] T051 [HIGH] Execute the real secure-context Chrome/provider acceptance matrix for native image/audio capability, model/resource limits, mixed input, retry, reload/reattach, compaction, deletion, and no-egress behavior per T049, FR-001–FR-034, and SC-004/SC-008 (partial)
- [ ] T052 [MEDIUM] Add Playwright coverage for text-only, image-only, audio-only, and mixed-capable runtime capability profiles per T032 and SC-001 (partial)
- [ ] T053 [MEDIUM] Add Playwright coverage for durable media reload, temporary close/reload, cross-window ownership, deletion/Clear all, and zero media egress per T039 and SC-006/SC-007 (partial)
