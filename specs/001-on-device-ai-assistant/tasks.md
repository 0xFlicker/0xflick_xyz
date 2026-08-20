---

description: "Dependency-ordered implementation tasks for the on-device AI assistant"
---

# Tasks: On-Device AI Assistant

**Input**: Design documents from `/specs/001-on-device-ai-assistant/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Test tasks are included because the specification defines independent story tests, measurable automated quality gates, real-browser concurrency requirements, and a bounded real-model release evaluation. Within each story, write the listed tests first and confirm their intended assertions fail before implementation.

**Organization**: Setup and foundational phases establish only shared contracts and test infrastructure. Each later phase maps directly to one prioritized user story and ends at an independently testable checkpoint.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: May run in parallel after its stated prerequisites because it changes different files and does not depend on another incomplete task in the same group.
- **[Story]**: Maps the task to User Story 1–5 from `spec.md`.
- Every checklist item names the exact file or files it owns.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the selected libraries and deterministic test runners without changing product behavior.

- [X] T001 Add Dexie 4 (`dexie@^4`), react-markdown, remark-gfm, Prompt API types, Vitest/Testing Library/fake-indexeddb, Playwright, axe, and `test:assistant`/`test:e2e:assistant` scripts in package.json and yarn.lock
- [X] T002 [P] Configure strict jsdom unit/component tests, jest-dom matchers, fake IndexedDB cleanup, and the `@/*` alias in vitest.config.ts and tests/setup.ts
- [X] T003 [P] Configure production-build Chromium execution, desktop/narrow projects, trace/screenshot retention, and an existing-server option in playwright.config.ts

**Checkpoint**: Dependencies install and both assistant test commands discover an empty suite without configuration errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared type, state, repository, and model boundaries that every story uses.

**⚠️ CRITICAL**: No user-story implementation begins until T004–T009 are complete.

- [X] T004 Define UUID-branded identities, stored entities, repository snapshots/results, model inputs/results, and orthogonal environment/work/storage state unions in src/features/assistant/types.ts
- [X] T005 [P] Define schema/prompt versions, database and lock namespaces, 100-session and 1,000-code-point limits, 75%/80% context thresholds, and stream-checkpoint interval in src/features/assistant/constants.ts
- [X] T006 Define the injectable `LocalModelAdapter`/`LocalModelSession` interfaces without importing native browser objects into UI types in src/features/assistant/model/modelAdapter.ts
- [X] T007 [P] Define the durable/temporary `AssistantRepository` query, subscription, mutation, conflict, and cleanup contract in src/features/assistant/storage/repository.ts and src/features/assistant/storage/useRepositoryQuery.ts
- [X] T008 Implement exhaustive `useReducer` transitions for independent environment, generation/context work, and storage state groups in src/features/assistant/reducer.ts
- [X] T009 Implement a deterministic fake model with scripted availability, preparation, cumulative streaming, measurements, overflow, errors, abort races, and lifecycle counters in tests/fixtures/fakeLanguageModel.ts

**Checkpoint**: Shared contracts compile without `as any`, `as unknown`, legacy Prompt API types, browser-content logging, or a second production runtime.

---

## Phase 3: User Story 1 — Complete a Helpful Local Conversation (Priority: P1) 🎯 MVP Checkpoint

**Goal**: On a supported ready model, complete contextual streaming turns, Stop with partial output, copy a safe rendered answer, and start a separate in-page chat with truthful temporary storage.

**Independent Test**: Inject a ready fake model, open `/assistant`, submit two related multi-line prompts, verify the follow-up receives completed prior context, stop another response while preserving partial text, copy it, and start a new blank chat while the prior temporary chat remains selectable.

### Tests for User Story 1

- [X] T010 [P] [US1] Add failing fixed-guidance, typed-role ordering, completed-turn reconstruction, and excluded interrupted-output tests in tests/unit/assistant/prompt.test.ts
- [X] T011 [P] [US1] Add failing temporary-repository tests for prompt deduplication, deterministic turn order, stream checkpoints, first-terminal-write-wins, New chat, and preserved partial text in tests/unit/assistant/memoryRepository.test.ts
- [X] T012 [P] [US1] Add failing user-centered tests for multi-line Send, continuous status, two-turn context, Stop, retry, New chat, safe Markdown, and response copy feedback in tests/component/assistant/conversation.test.tsx
- [X] T013 [P] [US1] Add a failing direct-route ready-model flow that asserts no prompt content reaches page requests in tests/e2e/assistant.spec.ts

### Implementation for User Story 1

- [X] T014 [US1] Implement the versioned fixed system guidance, explicit untrusted delimiters, and reconstruction of completed direct turns in src/features/assistant/context/prompt.ts
- [X] T015 [US1] Implement page-lifetime session/turn/message storage, subscriptions, submission dedupe, stream checkpoints, terminal immutability, and blank-draft behavior in src/features/assistant/storage/memoryRepository.ts
- [X] T016 [US1] Implement the ready-model create, measure, cumulative-stream normalization, AbortSignal handling, overflow subscription, and idempotent destroy path using global `LanguageModel` in src/features/assistant/model/browserLanguageModel.ts
- [X] T017 [US1] Implement untrusted Markdown rendering with GFM, no raw HTML/images/resource loads, safe link transforms, bounded code/table overflow, and local clipboard feedback in src/features/assistant/components/MessageContent.tsx
- [X] T018 [P] [US1] Implement the labelled multi-line composer, explicit Send/Stop controls, Shift+Enter behavior, validation, and submission acknowledgment in src/features/assistant/components/Composer.tsx
- [X] T019 [P] [US1] Implement throttled lifecycle announcements, determinate/indeterminate progress semantics, and non-color state text in src/features/assistant/components/ActivityStatus.tsx
- [X] T020 [US1] Implement chronological stable-ID turn rendering, terminal labels, paused follow-scroll, and Jump to latest in src/features/assistant/components/Transcript.tsx
- [X] T021 [US1] Implement the full-viewport assistant frame, in-page session list, permanent four-part local-AI disclosure, Not saved warning, and portfolio return in src/features/assistant/components/AssistantShell.tsx
- [X] T022 [US1] Orchestrate the ready-model temporary repository, draft/session selection, prompt persistence-before-generation, streaming, Stop/session-switch interruption, retry, and model cleanup in src/features/assistant/AssistantWorkspace.tsx
- [X] T023 [US1] Add server metadata, themed takeover composition without `SiteShell`, and the client workspace entry at src/app/assistant/layout.tsx and src/app/assistant/page.tsx
- [X] T024 [P] [US1] Add the discoverable Assistant destination so the existing header, footer, and sitemap share one route source in src/lib/navigation.ts

**Checkpoint**: US1 passes its unit, component, and ready-model browser flow with a visible **Not saved** state. This is an engineering MVP checkpoint, not yet an honest public deployment because non-ready environments require US2.

---

## Phase 4: User Story 2 — Understand Preparation, Availability, and Failure (Priority: P2)

**Goal**: Every detectable Prompt API lifecycle and failure state names what is happening and offers an accurate next action without hosted or alternate-runtime fallback.

**Independent Test**: Script checking, downloadable, downloading, finalizing, ready, stopped, unavailable, purged-model, setup error, generation error, and empty-response states; verify state-specific copy/actions, prompt preservation, explicit activation, and the unchanged takeover shell.

### Tests for User Story 2

- [X] T025 [P] [US2] Add failing adapter tests for secure/global detection, exact English options, all availability values, activation-bound creation, progress/finalization, rechecks, normalized DOMException errors, empty output, and destroy cleanup in tests/unit/assistant/browserLanguageModel.test.ts
- [X] T026 [P] [US2] Add failing checking/consent/download/finalizing/unavailable/failure/retry/Stop-waiting component tests with one-second acknowledgments in tests/component/assistant/availability.test.tsx
- [X] T027 [P] [US2] Add failing fake lifecycle journeys proving unsupported takeover parity, no synthetic/cloud response, progress semantics, recovery, and preserved saved-session messaging in tests/e2e/assistant-lifecycle.spec.ts

### Implementation for User Story 2

- [X] T028 [P] [US2] Map supported DOMException names and unknown API changes to stable actionable product errors without persisting raw input-bearing exceptions in src/features/assistant/model/errorMapping.ts
- [X] T029 [US2] Extend authoritative secure-context/global availability, exact option reuse, activation-synchronous preparation, normalized download progress, finalization, late-create cleanup, and per-reconstruction rechecks in src/features/assistant/model/browserLanguageModel.ts
- [X] T030 [US2] Add exhaustive checking/downloadable/downloading/finalizing/ready/failed and setup-abort transitions with prompt-preserving recovery in src/features/assistant/reducer.ts
- [X] T031 [US2] Implement requirements, explicit consent, measured progress, finalization, unsupported details, Retry, Stop waiting, and portfolio return states in src/features/assistant/components/AvailabilityPanel.tsx
- [X] T032 [US2] Integrate detection, preparation from direct activation, stale-model re-preparation, generation/empty-response failures, and truthful recovery actions in src/features/assistant/AssistantWorkspace.tsx
- [X] T033 [US2] Keep availability, work, and storage feedback simultaneously understandable without announcing token chunks in src/features/assistant/components/ActivityStatus.tsx
- [X] T034 [US2] Replace conversation controls with `AvailabilityPanel` inside the same responsive frame whenever inference is unavailable while retaining disclosure and saved-history context in src/features/assistant/components/AssistantShell.tsx

**Checkpoint**: US1 + US2 form the minimum deployable local-assistant slice: ready users can converse and every other visitor receives an honest, actionable takeover experience.

---

## Phase 5: User Story 3 — Return to and Manage Local Chats (Priority: P3)

**Goal**: Persist and manage up to 100 browser-local sessions, converge multi-window turns through one generator, and make deletion/storage failures race-safe and truthful.

**Independent Test**: Create/reload/switch 100 titled sessions, block the 101st, submit simultaneous turns from two pages, close an owner mid-stream, delete during generation, Clear all during queued work, and simulate storage failures; verify deterministic exactly-once convergence, no resurrection, and explicit temporary mode.

### Tests for User Story 3

- [X] T035 [P] [US3] Add failing fake-IndexedDB tests for schema records/indexes, deterministic titles/recency, 100-session cap, atomic turns/checkpoints, epoch/tombstone guards, deletion scope, Clear all, and one-time persistence request in tests/unit/assistant/dexieRepository.test.ts
- [X] T036 [P] [US3] Add failing repository-parity and open/read/write/quota failure tests proving one-way page-lifetime temporary mode and no false persistence/deletion success in tests/unit/assistant/repositoryFallback.test.ts
- [X] T037 [P] [US3] Add failing session rail, reload selection, cap recovery, confirmation, Clear all, Not saved, deletion-unverified, and focus-restoration tests in tests/component/assistant/sessions.test.tsx
- [X] T038 [P] [US3] Add failing production-browser persistence, restart/reload, 100/101 cap, individual deletion, Clear all, and IndexedDB failure journeys in tests/e2e/assistant-persistence.spec.ts
- [X] T039 [P] [US3] Add failing two-page Web Lock ordering, exactly-once merge, Stop/completion race, owner-close recovery, deletion race, and Clear-all epoch tests in tests/e2e/assistant-concurrency.spec.ts

### Implementation for User Story 3

- [X] T040 [US3] Define the `flick-assistant` Dexie version-1 tables and coordination-only indexes for meta, sessions, turns, messages, context, settings, and tombstones in src/features/assistant/storage/database.ts
- [X] T041 [US3] Implement coherent initialization, live-query snapshots, deterministic title/recency queries, atomic prompt claims, 500 ms stream checkpoints, and first-terminal-write-wins operations in src/features/assistant/storage/dexieRepository.ts
- [X] T042 [US3] Implement transactional 100-session enforcement, scoped deletion, Clear-all epoch invalidation, tombstone checks, active-session repair, and one-time best-effort `navigator.storage.persist()` in src/features/assistant/storage/dexieRepository.ts
- [X] T043 [US3] Complete mutation parity, coherent-snapshot recovery, durable initialization, and irreversible per-page fallback selection across src/features/assistant/storage/memoryRepository.ts and src/features/assistant/storage/repository.ts
- [X] T044 [US3] Subscribe React to Dexie `liveQuery()` and memory snapshots with stable snapshot identity and leak-free switching in src/features/assistant/storage/useRepositoryQuery.ts
- [X] T045 [US3] Implement recency-ordered selection, duplicate-title disambiguation, New chat, cap-block deletion access, per-session delete, narrow drawer behavior, and portfolio navigation in src/features/assistant/components/SessionSidebar.tsx
- [X] T046 [P] [US3] Implement named delete/Clear-all dialogs with destructive scope, cancel behavior, keyboard containment, and deterministic focus restoration in src/features/assistant/components/ConfirmationDialog.tsx
- [X] T047 [US3] Integrate durable initialization, active-session restore, subscriptions, New/switch/delete/Clear-all flows, and current-view recovery into temporary mode in src/features/assistant/AssistantWorkspace.tsx
- [X] T048 [US3] Add per-session exclusive Web Lock queue processing, post-lock re-read, orphan interruption, deterministic `(promptCreatedAt, turnId)` claims, attempt/epoch/tombstone guards, and lock release cleanup in src/features/assistant/AssistantWorkspace.tsx
- [X] T049 [US3] Present best-effort history, persistent Not saved, page-lifetime scope, cap, storage failure, and deletion-unverified recovery without claiming success in src/features/assistant/components/AssistantShell.tsx

**Checkpoint**: US3 independently passes the 100-session, reload, storage-failure, two-window merge, and destructive-race scenarios; all assistant data remains local and terminal turns are never overwritten.

---

## Phase 6: User Story 4 — See and Control Conversation Context (Priority: P4)

**Goal**: Show measured or unknown context honestly, compact older complete turns manually or before 80%, preserve the transcript, and recover explicitly from overflow or failed compaction.

**Independent Test**: Drive a saved conversation below 75%, at 75%, and to a projected 80%; perform manual and automatic compaction, reload it, inspect summary/direct ranges, trigger overflow/failure/revision conflict, and verify transcript identity plus critical-fact follow-up behavior.

### Tests for User Story 4

- [X] T050 [P] [US4] Add failing threshold, unknown-capacity, recent-four-turn retention, summary/direct partition, prompt-fit, and overflow-block tests in tests/unit/assistant/contextManager.test.ts
- [X] T051 [P] [US4] Add failing candidate-summary, non-empty/fit validation, replacement-session-before-commit, revision-conflict rollback, and model cleanup tests in tests/unit/assistant/compaction.test.ts
- [X] T052 [P] [US4] Add failing visual/text meter, 75% warning, Compact now availability, inspectable ranges, compaction activity, and actionable failure tests in tests/component/assistant/context.test.tsx
- [X] T053 [P] [US4] Add failing manual/automatic compaction, unchanged-transcript, reload, unknown capacity, overflow rebuild, and critical-fact browser journeys in tests/e2e/assistant-context.spec.ts

### Implementation for User Story 4

- [X] T054 [US4] Implement measured percentage policy, 75% warning, projected-80% decision, direct-turn selection, unknown state, prompt fit, and overflow blocking in src/features/assistant/context/contextManager.ts
- [X] T055 [US4] Implement separate short-lived Prompt API summarization, durable-fact prompt, candidate validation, replacement-session validation, cleanup, and failure rollback in src/features/assistant/context/compaction.ts
- [X] T056 [US4] Implement context snapshot persistence and history/personality-revision compare-and-swap for durable and temporary repositories in src/features/assistant/storage/dexieRepository.ts and src/features/assistant/storage/memoryRepository.ts
- [X] T057 [US4] Implement accessible context meter/details with known/unknown usage, summary range/content labelling, direct recent range, compaction time, and overflow disclosure in src/features/assistant/components/ContextDetails.tsx
- [X] T058 [US4] Integrate before-turn measurement, manual/automatic compaction under the session lock, post-turn usage, overflow events, blocking failures, and reload reconstruction in src/features/assistant/AssistantWorkspace.tsx
- [X] T059 [US4] Surface normal/warning/compacting/compacted/overflowed state in the conversation header and throttled status region without changing the visible transcript in src/features/assistant/components/AssistantShell.tsx and src/features/assistant/components/ActivityStatus.tsx

**Checkpoint**: US4 passes normal/warning/compacted/unknown/overflow scenarios, persists a valid summary representation, and never deletes or silently excludes visible transcript messages while claiming complete context.

---

## Phase 7: User Story 5 — Set a Persistent Personality Preference (Priority: P5)

**Goal**: Save one global blank-by-default personality prefix through 1,000 Unicode code points, apply it only to future model input, and keep fixed transparency guidance dominant.

**Independent Test**: Save, edit, reload, exceed, clear, and Clear all the preference; compare controlled later prompts across sessions while confirming prior transcript text and permanent disclosures never change.

### Tests for User Story 5

- [X] T060 [P] [US5] Add failing Unicode 1,000/1,001 validation, prior-value preservation, fixed-guidance ordering, untrusted delimiter, revision, and future-turn-only tests in tests/unit/assistant/personality.test.ts
- [X] T061 [P] [US5] Add failing blank default, live code-point count, save/edit/over-limit/clear feedback, Escape, and focus-restoration tests in tests/component/assistant/settings.test.tsx
- [X] T062 [P] [US5] Add failing cross-session/reload influence, immutable prior transcript, fixed-disclosure, over-limit, clear, and Clear-all browser journeys in tests/e2e/assistant-settings.spec.ts

### Implementation for User Story 5

- [X] T063 [US5] Implement global setting reads, revisioned Unicode-aware saves, over-limit atomic rejection, blank clear, and Clear-all parity in src/features/assistant/storage/dexieRepository.ts and src/features/assistant/storage/memoryRepository.ts
- [X] T064 [US5] Implement the Headless UI personality settings dialog with explanatory boundaries, live count, inline validation, save/clear acknowledgment, and focus restoration in src/features/assistant/components/SettingsDialog.tsx
- [X] T065 [US5] Insert the saved preference as explicitly delimited untrusted style guidance after the fixed system prompt and before summary/direct turns in src/features/assistant/context/prompt.ts
- [X] T066 [US5] Integrate global setting subscription, save failures, later-turn model reconstruction, settings entry, and unchanged historical messages in src/features/assistant/AssistantWorkspace.tsx and src/features/assistant/components/AssistantShell.tsx

**Checkpoint**: US5 passes global persistence and limit tests; personality changes affect later prompts only and cannot remove or contradict fixed product disclosures/capability boundaries.

---

## Phase 8: Polish and Cross-Cutting Release Gates

**Purpose**: Prove the combined experience is safe, accessible, responsive, maintainable, and honestly evaluated on the bounded real environment.

- [X] T067 [P] Add hostile Markdown, unsafe scheme, image non-fetch, external-link activation, long URL/string/code/table overflow, and clipboard regression coverage in tests/component/assistant/messageContent.test.tsx
- [X] T068 [P] Add wide/compact/narrow, 200% reflow, keyboard-only, dialog focus, visible-focus, reduced-motion, live-status, and axe coverage in tests/e2e/assistant-accessibility.spec.ts
- [X] T069 [P] Add request/console observation proving prompt, response, title, personality, and summary markers never leave through site requests, analytics, logs, or generated resources in tests/e2e/assistant-privacy.spec.ts
- [X] T070 Refine responsive rail/drawer, transcript/composer sizing, safe-area behavior, overflow containment, reduced motion, contrast, focus, and status semantics across src/features/assistant/components/AssistantShell.tsx, src/features/assistant/components/SessionSidebar.tsx, src/features/assistant/components/Transcript.tsx, and src/features/assistant/components/Composer.tsx
- [X] T071 Check in the exact 20 quality prompts, supplied-text fixtures, ten compaction fact manifests, scoring fields, timing fields, and reviewer instructions in tests/fixtures/assistantEvaluation.ts and specs/001-on-device-ai-assistant/evaluation.md
- [X] T072 Run `yarn lint`, `yarn typecheck`, `yarn validate:content`, `yarn test:content`, `yarn test:assistant`, `yarn build`, and `yarn test:e2e:assistant`; record exact command outcomes and skipped-check reasons in specs/001-on-device-ai-assistant/validation.md
- [ ] T073 Exercise `/assistant` in real Chrome at representative desktop/narrow sizes with keyboard, screen reader, 200% zoom, reduced motion, navigation, overflow, dialogs, storage actions, and no-egress inspection; record evidence and limitations in specs/001-on-device-ai-assistant/validation.md
- [ ] T074 Run the owner-Mac Prompt API preparation check, fixed 20-prompt two-reviewer quality/timing run, and ten-case context-retention evaluation without substituting fake-model evidence in specs/001-on-device-ai-assistant/validation.md
- [ ] T075 Run the five-or-more-person usability, state-comprehension, disclosure-retention, and portfolio-impact study; record participant counts and bounded raw outcomes without generalizing support in specs/001-on-device-ai-assistant/validation.md
- [X] T076 Review src/features/assistant/, src/app/assistant/, tests/unit/assistant/, tests/component/assistant/, tests/e2e/assistant*.spec.ts, and tests/fixtures/ for duplicated state, obsolete/legacy Prompt API paths, silent catches, alternate runtimes, cloud/backend calls, assistant analytics, unsafe casts, and unverified claims; simplify or correct them before final validation

**Checkpoint**: All required automated checks and browser flows pass, manual limitations are recorded, and real-model/evaluator evidence satisfies SC-001–SC-012 before completion is claimed.

---

## Dependencies and Execution Order

### Phase Dependencies

```text
Phase 1 Setup
    ↓
Phase 2 Foundation
    ↓
US1 Ready Conversation ──────→ US2 Lifecycle Honesty
    │                              │
    └──────────────→ US3 Durable Local Chats
                           ├──────→ US4 Context Control
                           └──────→ US5 Personality
US1 + US2 + US3 + US4 + US5
    ↓
Phase 8 Release Gates
```

- **Phase 1** has no dependency.
- **Phase 2** depends on Phase 1 and blocks every user story. Within it, T004 precedes T006–T009; T005 and T007 may proceed in parallel after their required shared types are available.
- **US1** depends on Phase 2 and establishes the ready-model route, temporary repository, core conversation, and common shell.
- **US2** depends on US1's route/model/shell contracts and makes that route honest for every non-ready state. US1 + US2 is the minimum public deployment boundary.
- **US3** depends on US1 but is logically independent of US2's preparation UI. It replaces the page's repository selection from always-temporary to durable-when-healthy without adding a second model path.
- **US4** depends on US3 because context summaries and compare-and-swap state must persist and use the generation lock.
- **US5** depends on US3 for global storage and may proceed in parallel with US4 because the prompt/repository contracts already reserve personality revision and blank behavior.
- **Phase 8** depends on every story included in the intended release.

### User Story Independence

| Story | Independent proof after prerequisites | Shared dependency |
|-------|---------------------------------------|-------------------|
| US1 | Ready fake/real model completes contextual turns, Stop, copy, and New chat in temporary mode | Foundational contracts only |
| US2 | Every lifecycle/failure scenario renders correct action with no fallback | US1 takeover shell and model boundary |
| US3 | Persistence, cap, deletion, temporary failure, and cross-window races pass with a ready fake | US1 turn workflow and repository contract |
| US4 | Threshold, compaction, reload, failure, and overflow scenarios preserve transcript/facts | US3 persisted context and lock |
| US5 | Save/reload/limit/clear and controlled style influence pass with blank context allowed | US3 setting store and US1 prompt builder |

### Within Each User Story

1. Complete that story's test tasks and confirm the intended assertions fail.
2. Implement pure policies and storage/model services before UI orchestration.
3. Implement leaf components before integrating `AssistantWorkspace` or `AssistantShell`.
4. Run the story's unit and component tests, then its Playwright scenario.
5. Stop at the checkpoint and verify earlier-story tests still pass before advancing.

### Parallel Opportunities

- T002 and T003 can run together after T001 starts dependency installation.
- After T004, the constants, model/repository boundaries, and independent test fixture work can be divided according to the Phase 2 micro-dependencies above.
- Tests marked [P] in each story target distinct files and can be written concurrently before implementation.
- Leaf components marked [P] can run concurrently once their prop/type contracts are stable.
- US4 and US5 can proceed in parallel after US3, provided ownership avoids concurrent edits to repository and workspace files; otherwise use the priority order.
- T067–T069 are independent cross-cutting test files and can run together before final refinement.

---

## Parallel Examples

### User Story 1

```text
T010 prompt construction tests
T011 temporary repository tests
T012 conversation component tests
T013 ready-flow browser test
```

After T017 defines message rendering props, T018 Composer and T019 ActivityStatus can be implemented in parallel before T020–T022 integration.

### User Story 2

```text
T025 browser adapter lifecycle tests
T026 availability component tests
T027 lifecycle browser journeys
T028 native-to-product error mapping
```

T029–T034 then converge on the already stable adapter, reducer, and shell contracts.

### User Story 3

```text
T035 Dexie transaction tests
T036 fallback parity tests
T037 session UI tests
T038 persistence browser journeys
T039 multi-page concurrency races
```

After repository behavior stabilizes, T045 SessionSidebar and T046 ConfirmationDialog can be implemented in parallel before workspace integration.

### User Story 4

```text
T050 context policy tests
T051 compaction transaction tests
T052 context interface tests
T053 context browser journeys
```

T054 and T055 may be owned separately after their shared test contracts agree, then merge through T058.

### User Story 5

```text
T060 personality policy tests
T061 settings dialog tests
T062 settings browser journeys
```

T063 storage behavior and T064 dialog presentation can proceed in parallel before T065–T066 prompt/workspace integration.

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 and validate the ready-model conversation independently in truthful temporary mode.
3. Treat this as an internal MVP checkpoint only.
4. Complete US2 before deploying `/assistant`, because a public route must handle preparation and unsupported environments honestly.

### Incremental Delivery

1. **US1 + US2**: deployable local conversation and lifecycle truth.
2. **US3**: durable browser-local history, user control, and multi-window integrity.
3. **US4**: visible measured context and safe compaction.
4. **US5**: optional persistent personality.
5. **Phase 8**: combined responsive/accessibility/privacy proof plus bounded real-model and evaluator gates.

Each checkpoint keeps one current production path. Later stories extend the same adapter, repository contract, and workspace rather than retaining prototype APIs, dual storage, or hidden feature flags.

### Suggested Ownership

- Keep one owner for `AssistantWorkspace.tsx` and `AssistantShell.tsx` within a phase to avoid state-integration races.
- Model, repository, pure context policy, leaf components, and their dedicated tests can be owned independently when marked [P].
- Never run US4 and US5 repository/workspace edits concurrently in the same checkout without explicit file ownership, even though their product behavior is logically parallel.

## Notes

- `[P]` means parallelizable only after earlier explicit dependencies are complete.
- User-story labels provide traceability to `spec.md`; setup, foundation, and release tasks intentionally have no story label.
- Use the global Chrome `LanguageModel` API only; do not add `window.ai`, a cloud SDK, backend inference, model polyfill, alternate local runtime, or production fake.
- Keep prompts, responses, titles, personality, summaries, and assistant failures out of URLs, site requests, third-party resource loads, logs, and analytics.
- Commit after each verified task or cohesive group, and preserve unrelated work.
