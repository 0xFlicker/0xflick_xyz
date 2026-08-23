---

description: "Dependency-ordered implementation tasks for the portable browser-local AI fallback"
---

# Tasks: Portable Browser-Local AI Fallback

**Input**: Design documents from `/specs/003-portable-ai-fallback/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the feature's independent-test scenarios, measurable success criteria, privacy boundary, concurrency contract, and real-runtime acceptance rule. Write each story's tests before its implementation tasks and make the deterministic tests fail against the preceding layer.

**Organization**: Tasks are grouped by user story so each phase leaves one independently testable product increment. Real runtime evidence is separate from fake-model, production-build, and browser-UI evidence.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes different files and does not depend on an incomplete task in the same phase.
- **[Story]**: Maps the task to User Story 1–4 in `spec.md`.
- Every task names the file or files it must change or verify.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin the maintained runtime and establish deterministic portable-runtime fixtures before production implementation.

- [X] T001 Add exact `@huggingface/transformers` 4.2.0 to `package.json` and resolve its immutable dependency graph in `yarn.lock`
- [X] T002 [P] Extend the multi-model fake adapter and add an attempt-tagged fake portable worker with controllable progress, readiness, streaming, stop, context limits, failure, and late-event behavior in `tests/fixtures/fakeLanguageModel.ts` and `tests/fixtures/fakePortableWorker.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the model identity, worker protocol, storage schema, repository, controller, and retained-session boundaries required by every user story.

**CRITICAL**: No user story implementation begins until this phase is complete.

### Foundational tests

- [X] T003 [P] Add failing tests for stable catalog identities, structural offering without device allowlists, capability binding, and runtime identity normalization in `tests/unit/assistant/modelFoundation.test.ts`
- [X] T004 [P] Add failing tests for Dexie v2-to-v3 rewriting, required model-bound session/turn/context fields, boundary indexes, and equivalent temporary-repository initial assignment in `tests/unit/assistant/dexieRepository.test.ts` and `tests/unit/assistant/memoryRepository.test.ts`
- [X] T005 [P] Add failing retained-session tests for model key, pinned runtime, active revision, context revision, history, personality, and prompt-version mismatch disposal in `tests/unit/assistant/modelSessionCache.test.ts`

### Foundational implementation

- [X] T006 Define `ModelKey`, `LocalModelDescriptor`, `ModelAssetSnapshot`, runtime identity, session selection fields, pending request, `ModelBoundary`, and model-bound turn/context types in `src/features/assistant/types.ts` and version/cache/lock identities in `src/features/assistant/constants.ts`
- [X] T007 [P] Extend `LocalModelAdapter` and `LocalModelSession` with required model/runtime identity and model-bound capabilities while preserving provider-neutral measure/stream/stop/destroy semantics in `src/features/assistant/model/modelAdapter.ts`
- [X] T008 [P] Define and validate the versioned `inspect`, `prepare`, `healthCheck`, `measure`, `generate`, `interrupt`, and `dispose` command/event envelopes in `src/features/assistant/model/portableWorkerProtocol.ts`
- [X] T009 Implement the ordered native, pinned SmolLM2 360M q4 WebGPU, and pinned SmolLM2 135M q4 WASM descriptors with structural API checks only in `src/features/assistant/model/modelCatalog.ts`
- [X] T010 Bind the existing Prompt API adapter's availability, capabilities, sessions, and normalized errors to the `browser-prompt-api` runtime identity in `src/features/assistant/model/browserLanguageModel.ts` and `src/features/assistant/model/errorMapping.ts`
- [X] T011 Add Dexie database version 3, the `modelBoundaries` table/indexes, and a single upgrade transaction that rewrites existing native sessions, turns, and contexts to required revision-zero model identity in `src/features/assistant/storage/database.ts`
- [X] T012 Extend repository contracts and saved/temporary/fallback implementations to hydrate model state, atomically create a session and first model-bound turn, load boundaries, and delete boundaries with their session in `src/features/assistant/storage/repository.ts`, `src/features/assistant/storage/dexieRepository.ts`, `src/features/assistant/storage/memoryRepository.ts`, and `src/features/assistant/storage/repositoryFallback.ts`
- [X] T013 Add model/runtime identity and active selection revision to retained-session matching, candidate adoption, and idempotent disposal in `src/features/assistant/model/modelSessionCache.ts`
- [X] T014 Replace the reducer's single Chrome environment with per-option discovery/readiness plus active and pending model state in `src/features/assistant/reducer.ts`
- [X] T015 Add a model controller that discovers catalog entries, owns one page-local adapter/worker candidate, exposes active/pending capabilities, and destroys stale runtimes without implementing hidden fallback in `src/features/assistant/model/modelController.ts`

**Checkpoint**: Model identity is required throughout the current assistant path, the v3 repository can bind an initial turn to one runtime, and fake catalog/worker behavior is observable before portable inference is connected.

---

## Phase 3: User Story 1 - Attempt a Local Turn on This Device (Priority: P1) MVP

**Goal**: Let a visitor explicitly prepare an offered portable model, pass a real local readiness generation, and complete or stop a private text turn without application timeouts.

**Independent Test**: In controlled WASM/WebGPU profiles, confirm preparation, observe measured or indeterminate progress for any duration, require non-whitespace readiness, submit a unique text prompt, receive non-whitespace terminal output or stop partial output, and verify no conversation-derived value enters a request.

### Tests for User Story 1

- [X] T016 [P] [US1] Add failing worker-client tests for protocol validation, aggregate/indeterminate progress, non-whitespace readiness, exact tokenizer measurement, streaming deltas, cooperative stop, worker disposal, and stale-event rejection in `tests/unit/assistant/portableWorkerClient.test.ts`
- [X] T017 [P] [US1] Add failing asset tests for pinned file enumeration, exact metadata totals, incomplete/evicted cache detection, retry reuse, quota failure, and readiness not equaling download completion in `tests/unit/assistant/modelAssets.test.ts`
- [X] T018 [P] [US1] Add failing component tests for explicit download consent, active preparation/checking states, stop-waiting, concise failures, text-only capability, and absence of elapsed-time failure in `tests/component/assistant/availability-portable.test.tsx`
- [X] T019 [P] [US1] Add failing browser coverage for a fake portable local turn, long-running preparation/generation, stop with partial output, unavailable-all-models behavior, and request URL/header/body privacy canaries in `tests/e2e/assistant-portable-privacy.spec.ts`

### Implementation for User Story 1

- [X] T020 [P] [US1] Implement ModelRegistry file metadata, dedicated Cache API namespace inspection, aggregate progress mapping, partial-cache reconciliation, and readiness input isolation in `src/features/assistant/model/modelAssets.ts`
- [X] T021 [P] [US1] Implement the dedicated Transformers.js module worker with pinned device/dtype loading, single-thread WASM, chat-template tokenization, fixed content-free health check, `TextStreamer`, `InterruptableStoppingCriteria`, and idempotent disposal in `src/features/assistant/model/portableModel.worker.ts`
- [X] T022 [US1] Implement the worker client as a provider-neutral portable adapter/session with attempt identity, progress, exact measurement, incremental output, stop, fatal worker recovery, and no load-time cancellation promise in `src/features/assistant/model/portableLanguageModel.ts`
- [X] T023 [US1] Implement blank-chat strongest-offered draft selection, explicit portable preparation, readiness gating, stopped-wait detachment, and active capability publication in `src/features/assistant/model/modelController.ts` and `src/features/assistant/reducer.ts`
- [X] T024 [P] [US1] Add the model preparation/health-check confirmation and progress surface with model, backend, aggregate/approximate size, capability warning, stop, retry, and accessible status in `src/features/assistant/components/ModelPreparationDialog.tsx` and `src/features/assistant/components/AvailabilityPanel.tsx`
- [X] T025 [US1] Route initial text acceptance, queue claim, context measurement, streaming checkpoints, terminal states, explicit stop, and session-cache ownership through the selected adapter while preserving accepted-turn model identity in `src/features/assistant/AssistantWorkspace.tsx`
- [X] T026 [US1] Disable image/audio staging and send for a portable text-only active model while preserving existing native multimodal controls and visible historical media in `src/features/assistant/components/Composer.tsx` and `src/features/assistant/components/Transcript.tsx`
- [X] T027 [US1] Add provider-neutral preparing/checking/generating/interrupted/resource/storage/runtime copy with concise next actions and no internal diagnostic dump in `src/features/assistant/components/ActivityStatus.tsx` and `src/features/assistant/model/errorMapping.ts`
- [X] T028 [US1] Make durable turn-attempt compare-and-swap the correctness authority when Web Locks are unavailable, reject stale checkpoints, and expose explicit retry/takeover instead of timer-driven orphan recovery in `src/features/assistant/storage/dexieRepository.ts` and `src/features/assistant/AssistantWorkspace.tsx`
- [X] T029 [US1] Execute the exact pinned SmolLM2 135M q4 WASM preparation, readiness, non-empty turn, stop, reload/cache-reuse, and no-egress acceptance and record the separate real-runtime evidence in `specs/003-portable-ai-fallback/quickstart.md`

**Checkpoint**: User Story 1 works through the current assistant queue with the real 135M WASM pair, fake portable profiles, no hidden cloud path, no product timeout, and no conversation-content egress.

---

## Phase 4: User Story 2 - See and Choose Available Models (Priority: P2)

**Goal**: Show every offered model at the top-left, distinguish active from pending, and let the visitor confirm a ready or downloadable choice without hidden routing.

**Independent Test**: In a controlled three-option profile, verify native → 360M WebGPU → 135M WASM order, no incompatible entries, no automatic portable transfer, explicit preparation/switch confirmation, truthful active/pending state, and exactly one boundary after successful activation.

### Tests for User Story 2

- [X] T030 [P] [US2] Add failing repository tests for idle confirmation, monotonic request revision, matching failure/cancel, latest-only activation, same-model no-op, atomic active-model/context/history/boundary commit, and no boundary on failure in `tests/unit/assistant/modelSelection.test.ts`
- [X] T031 [P] [US2] Add failing component tests for top-left placement, catalog order, actual model/backend names, active versus pending state, prepared/unprepared confirmation, busy controls, and no response badges in `tests/component/assistant/modelSelector.test.tsx`
- [X] T032 [P] [US2] Add failing browser coverage for initial strongest choice, consent-before-transfer, ready and downloadable switches, readiness failure recommendation without activation, one durable boundary, and reopen rendering in `tests/e2e/assistant-model-selection.spec.ts`

### Implementation for User Story 2

- [X] T033 [US2] Implement repository operations for `confirmModelRequest`, matching pending-state updates, `cancelModelRequest`, and atomic latest-request activation with one `ModelBoundary` in `src/features/assistant/storage/repository.ts`, `src/features/assistant/storage/dexieRepository.ts`, and `src/features/assistant/storage/memoryRepository.ts`
- [X] T034 [US2] Implement candidate preparation/readiness ownership, same-model no-op, failure recommendation, prior-active preservation, and activation-only retained-session adoption in `src/features/assistant/model/modelController.ts`
- [X] T035 [P] [US2] Build the top-left catalog dropdown with actual model/execution names, active/pending/preparation states, keyboard operation, and model-management entry in `src/features/assistant/components/ModelSelector.tsx` and place it in `src/features/assistant/components/AssistantShell.tsx`
- [X] T036 [P] [US2] Render model boundaries after their preceding terminal turn, ordered by selection revision, without adding message provenance badges or model prompt content in `src/features/assistant/components/Transcript.tsx`
- [X] T037 [US2] Unify prepared switch, portable download, downgrade warning, recommended alternative, cancel, and focus-return behavior in `src/features/assistant/components/ModelPreparationDialog.tsx` and `src/features/assistant/components/ConfirmationDialog.tsx`
- [X] T038 [US2] Coordinate selector requests with prompt acceptance so queued/context-checking/compacting/claimed/streaming work returns `chat_busy`, pending intent preserves an unsent draft, and selection never submits or retries a prompt in `src/features/assistant/AssistantWorkspace.tsx`
- [X] T039 [US2] Generalize activity/context labels away from Chrome-only assumptions and show the active actual model state without verbose runtime diagnostics in `src/features/assistant/components/ActivityStatus.tsx`, `src/features/assistant/components/ContextDetails.tsx`, and `src/features/assistant/components/AvailabilityPanel.tsx`
- [X] T040 [US2] Execute the exact pinned SmolLM2 360M q4 WebGPU preparation and record either its current-environment readiness/turn result or its truthful terminal readiness failure with an available alternative; record the native Prompt API text/media regression as a separate evidence tier in `specs/003-portable-ai-fallback/quickstart.md`

**Checkpoint**: User Story 2 independently exposes all offered models, protects download consent, keeps failed targets inactive, and records only successful model-change boundaries.

---

## Phase 5: User Story 3 - Continue One Chat Across Model Changes (Priority: P3)

**Goal**: Preserve visible history and the newest useful text context across confirmed switches while guaranteeing latest-confirmed-wins, no replay, and cross-window convergence.

**Independent Test**: Build a native conversation, confirm a downgrade, exercise successful and failed source compaction, race two window confirmations and prompt acceptance, reopen with ready/unready/removed models, and verify whole-turn target-fit context, one winning boundary, no media/model-boundary prompt content, and zero accepted-prompt replay.

### Tests for User Story 3

- [X] T041 [P] [US3] Add failing context tests for exact target chat-template measurement, output reservation, newest complete-turn fitting, current-prompt protection, successful source compaction, failed-compaction silent fallback, and required-content overflow in `tests/unit/assistant/modelContextSwitch.test.ts`
- [X] T042 [P] [US3] Add failing repository concurrency tests for slow A then later B confirmation, newer failure not reviving A, prompt-versus-selection races, stale completion, delete/Clear-all epochs, and one expected-revision reopen winner in `tests/unit/assistant/modelSelection.test.ts` and `tests/unit/assistant/dexieRepository.test.ts`
- [X] T043 [P] [US3] Add failing prompt/session tests proving boundaries, raw media, thumbnails, object URLs, and attachment labels never enter portable reconstruction and every model/revision mismatch destroys retained state in `tests/unit/assistant/prompt.test.ts` and `tests/unit/assistant/modelSessionCache.test.ts`
- [X] T044 [P] [US3] Add failing browser coverage for two-window latest-confirmed convergence, busy rejection, prompt race, external-unavailable reopen fallback, downloadable-only reopen, no-Web-Lock CAS, and zero replay in `tests/e2e/assistant-concurrency.spec.ts` and `tests/e2e/assistant-model-selection.spec.ts`

### Implementation for User Story 3

- [X] T045 [P] [US3] Replace the fixed recent-turn policy with target-tokenizer capacity packing that reserves required content/output and drops only whole oldest completed turns in `src/features/assistant/context/contextManager.ts`
- [X] T046 [P] [US3] Split compaction into one source-model candidate summary and target-model measurement/fit, holding candidate context until activation wins and keeping downgrade failure silent in `src/features/assistant/context/compaction.ts`
- [X] T047 [US3] Exclude model boundaries and every persisted media representation, including attachment labels, from portable reconstruction while retaining completed text exchanges and visible transcript media in `src/features/assistant/context/prompt.ts`
- [X] T048 [US3] Enforce latest-confirmed revision, captured epoch/history/model identity, matching owner release, stale-candidate rejection, atomic context activation, and expected-active-revision reopen CAS in `src/features/assistant/storage/dexieRepository.ts` and `src/features/assistant/storage/memoryRepository.ts`
- [X] T049 [US3] Reconcile live repository subscriptions across windows, destroy losing candidates/retained sessions, perform at most one already-ready external-unavailability reopen fallback, and never auto-prepare or chain fallback in `src/features/assistant/storage/useRepositoryQuery.ts`, `src/features/assistant/model/modelController.ts`, and `src/features/assistant/AssistantWorkspace.tsx`
- [X] T050 [US3] Replace blanket startup media-owner interruption and unsafe unlocked queue processing with owner/attempt-aware observation, explicit stale-attempt recovery, and compare-and-swap terminalization in `src/features/assistant/storage/dexieRepository.ts`, `src/features/assistant/storage/memoryRepository.ts`, and `src/features/assistant/AssistantWorkspace.tsx`
- [X] T051 [US3] Invalidate native multimodal and portable retained sessions at every committed boundary while preserving immutable terminal/partial output and explicit-retry-only behavior in `src/features/assistant/model/modelSessionCache.ts` and `src/features/assistant/AssistantWorkspace.tsx`
- [X] T052 [US3] Show only the brief downgrade quality/memory warning, busy/pending state, and durable boundary while suppressing compaction diagnostics and per-response labels in `src/features/assistant/components/ModelPreparationDialog.tsx`, `src/features/assistant/components/ActivityStatus.tsx`, and `src/features/assistant/components/Transcript.tsx`

**Checkpoint**: User Story 3 preserves visible history, fits target context truthfully, converges across windows by confirmation order, and cannot replay or silently reroute an accepted turn.

---

## Phase 6: User Story 4 - Manage Models Separately From Conversations (Priority: P4)

**Goal**: Reuse browser-retained model assets across conversation deletion and remove an installed model without rewriting chats or silently selecting a replacement.

**Independent Test**: Prepare a portable model, create a chat, Clear all assistant data and verify the model remains cached, then remove inactive and active models and verify exact cache deletion, preserved chat provenance, explicit-replacement blocking, cross-window cache convergence, and no fallback/replay.

### Tests for User Story 4

- [X] T053 [P] [US4] Add failing asset tests for model-specific prepare/remove locking, exact pinned-file deletion, shared-file preservation, resident-runtime disposal notification, external eviction, persistent-storage denial, and post-remove reinspection in `tests/unit/assistant/modelAssets.test.ts`
- [X] T054 [P] [US4] Add failing repository/component tests for intentional active-model removal, durable `requiresExplicitReplacement`, clear-all/model-cache separation, preserved boundaries, removal confirmation, and accessible focus/status in `tests/unit/assistant/modelSelection.test.ts` and `tests/component/assistant/modelManager.test.tsx`
- [X] T055 [P] [US4] Add failing browser coverage for cache reuse after conversation Clear all, inactive/active removal, reopen suppression, separate confirmation scopes, and cross-window asset invalidation in `tests/e2e/assistant-model-assets.spec.ts`

### Implementation for User Story 4

- [X] T056 [P] [US4] Add model-specific prepare/remove Web Locks where available, BroadcastChannel invalidation-only events, `navigator.storage.persist()` after consent, exact ModelRegistry clearing, and authoritative reinspection in `src/features/assistant/model/modelAssets.ts`
- [X] T057 [P] [US4] Build the installed-model manager with exact model/backend/size state, separately confirmed removal, progress/failure actions, keyboard operation, and focus restoration in `src/features/assistant/components/ModelManager.tsx`
- [X] T058 [US4] Persist intentional active-model removal as `requiresExplicitReplacement`, preserve session/turn/context/boundary records, and clear the flag only after a later confirmed activation in `src/features/assistant/storage/repository.ts`, `src/features/assistant/storage/dexieRepository.ts`, and `src/features/assistant/storage/memoryRepository.ts`
- [X] T059 [US4] Dispose page-owned runtimes, invalidate other windows, block the next turn, suppress reopen fallback, and require a newly confirmed model after active removal in `src/features/assistant/model/modelController.ts` and `src/features/assistant/AssistantWorkspace.tsx`
- [X] T060 [US4] Keep Clear all assistant data scoped to Dexie/memory conversations, settings, summaries, media history, pending intents, and boundaries without calling model asset deletion in `src/features/assistant/storage/dexieRepository.ts`, `src/features/assistant/storage/memoryRepository.ts`, and `src/features/assistant/components/SettingsDialog.tsx`
- [X] T061 [US4] Integrate model management separately from Clear all and show concise installed, missing/evicted, removing, removed, and explicit-replacement states in `src/features/assistant/components/ModelSelector.tsx`, `src/features/assistant/components/AvailabilityPanel.tsx`, and `src/features/assistant/components/ActivityStatus.tsx`

**Checkpoint**: User Story 4 preserves every record outside the confirmed deletion scope and never turns model removal into automatic fallback or prompt replay.

---

## Phase 7: Polish and Cross-Cutting Verification

**Purpose**: Validate accessibility, failure clarity, worker packaging, privacy, extended execution, exact runtime pairs, and every requirement without introducing device gates.

- [X] T062 [P] Add keyboard, focus, screen-reader announcement, narrow/mobile overflow, and no-token-delta-spam coverage for selector, preparation, manager, boundary, stop, and failure states in `tests/component/assistant/modelSelector.test.tsx`, `tests/component/assistant/modelManager.test.tsx`, and `tests/e2e/assistant-accessibility.spec.ts`
- [X] T063 [P] Add production-worker bundle and runtime-asset loading coverage plus request URL/header/body/log canaries for preparation versus post-readiness inference in `tests/e2e/assistant-portable-privacy.spec.ts` and `tests/e2e/assistant-lifecycle.spec.ts`
- [X] T064 Reconcile storage quota, missing/evicted/corrupt assets, unsupported operator/device, browser termination, resource exhaustion, interruption, and stale/superseded attempts into concise stable actions in `src/features/assistant/model/errorMapping.ts`, `src/features/assistant/components/ActivityStatus.tsx`, and `src/features/assistant/components/AvailabilityPanel.tsx`
- [X] T065 Run `yarn lint`, `yarn typecheck`, `yarn validate:content`, and `yarn test:content`; resolve all feature-related failures in `src/features/assistant/`, `tests/`, and `specs/003-portable-ai-fallback/quickstart.md`
- [X] T066 Run `yarn test:assistant`, `yarn build`, and `yarn test:e2e:assistant`; resolve feature-related deterministic, worker-build, desktop, and narrow/mobile failures in `tests/unit/assistant/`, `tests/component/assistant/`, `tests/e2e/`, and `src/features/assistant/`
- [X] T067 Execute 20 portable privacy turns across both tiers and controlled profiles, representative confirmed model changes, 10 extended operations lasting at least ten minutes, exact 135M WASM/360M WebGPU/native regressions, and record evidence-tier results without ecosystem support claims in `specs/003-portable-ai-fallback/quickstart.md`
- [X] T068 Review the implementation against FR-001–FR-041, SC-001–SC-010, all four contracts, the two documented constitution exceptions, and the no-device-gate/no-client-timeout decisions; remove stale single-model, Chrome-only, hidden fallback, replay, or media-label prompt paths in `src/features/assistant/AssistantWorkspace.tsx`, `src/features/assistant/reducer.ts`, `src/features/assistant/context/prompt.ts`, and `specs/003-portable-ai-fallback/tasks.md`

---

## Dependencies and Execution Order

### Phase dependencies

- **Phase 1 — Setup**: No dependencies; T002 can proceed alongside dependency installation.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks every user story. Write T003–T005 before T006–T015.
- **Phase 3 — US1**: Depends on the complete foundation and is the MVP. Write T016–T019 before T020–T029.
- **Phase 4 — US2**: Depends on US1's working portable adapter/controller because it exposes and changes those real options. Write T030–T032 before T033–T040.
- **Phase 5 — US3**: Depends on US2's selection/boundary transaction. Write T041–T044 before T045–T052.
- **Phase 6 — US4**: Depends on the catalog/selection foundation and may begin after US2; coordinate active-removal work with US3 if both phases run concurrently. Write T053–T055 before T056–T061.
- **Phase 7 — Polish**: Depends on all stories selected for delivery and precedes any completion claim.

### User story dependencies

- **US1 (P1)**: Foundation only. Delivers the smallest real private portable text turn and is independently shippable as the MVP.
- **US2 (P2)**: Uses US1's portable runtime but remains independently testable with a controlled three-option catalog.
- **US3 (P3)**: Uses US2's confirmed activation/boundary path and adds target-fit continuity, reopen behavior, and deterministic cross-window ordering.
- **US4 (P4)**: Uses US2's catalog/activation path; model removal can be implemented in parallel with most US3 context work after repository write ownership is coordinated.

### Within each story

- Write the story tests first and verify they fail against the prior checkpoint.
- Implement domain/storage/runtime services before React integration that consumes them.
- Re-run the focused story tests before the real-runtime checkpoint.
- Treat fake runtime, production build, real model/backend, and observed-device evidence as separate tiers.
- Never use answer quality, token speed, latency, browser family, RAM, or GPU vendor as a release admission rule.

## Parallel Execution Examples

### User Story 1

```text
Task: "T016 portable worker-client contract tests"
Task: "T017 model asset/cache tests"
Task: "T018 preparation component tests"
Task: "T019 portable privacy browser tests"

After tests and foundation:
Task: "T020 model asset manager"
Task: "T021 portable worker"
Task: "T024 preparation UI"
```

### User Story 2

```text
Task: "T030 selection repository tests"
Task: "T031 selector component tests"
Task: "T032 selector browser tests"

After the selection contract is stable:
Task: "T035 model selector and shell placement"
Task: "T036 transcript boundaries"
```

### User Story 3

```text
Task: "T041 target-fit context tests"
Task: "T042 repository concurrency tests"
Task: "T043 prompt/session privacy tests"
Task: "T044 multi-window browser tests"

After tests:
Task: "T045 whole-turn context packing"
Task: "T046 source/target compaction split"
```

### User Story 4

```text
Task: "T053 model asset removal tests"
Task: "T054 removal repository/component tests"
Task: "T055 model asset browser tests"

After tests:
Task: "T056 model asset lifecycle"
Task: "T057 model manager UI"
```

## Implementation Strategy

### MVP first — User Story 1

1. Complete Phase 1 and Phase 2.
2. Complete US1 tests and implementation through T029.
3. Stop and validate fake portable profiles, production worker build, exact 135M WASM readiness/turn/stop/cache reuse, and no-egress behavior.
4. Do not begin multi-model switching until the weakest shipped local path genuinely works end to end.

### Incremental delivery

1. Add US2 model visibility and confirmed choice; prove 360M WebGPU and native regression.
2. Add US3 context continuity, latest-confirmed convergence, reopen behavior, and no replay.
3. Add US4 independent model storage/removal and deletion-scope proof.
4. Complete Phase 7 evidence and requirement audit before claiming implementation complete.

### Parallel team strategy

1. Complete Setup and Foundational tasks together.
2. Deliver US1 as one integrated runtime path.
3. After US2 establishes activation, split US3 context/concurrency and US4 asset-management work across disjoint files where marked `[P]`.
4. Rejoin for `AssistantWorkspace.tsx`, repository transaction, and final browser evidence tasks.

## Notes

- `[P]` tasks do not share an incomplete dependency or active write target.
- Story labels trace every implementation/test task to one specification story.
- Model asset downloads may continue or leave completed cache entries after the visitor stops waiting; UI/durable state ignores detached late events and never claims network cancellation.
- The active model changes only through initial assignment, confirmed activation, or the narrow already-ready reopen exception.
- A catalog entry cannot claim ready until it produces real non-whitespace local output on the current device.
- No task may add a client-side inference timeout, device allowlist, performance gate, cloud fallback, prompt replay, current-prompt truncation, per-response model badge, or conversation/model deletion cascade.
