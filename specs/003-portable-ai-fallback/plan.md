# Implementation Plan: Portable Browser-Local AI Fallback

**Branch**: `003-portable-ai-fallback` | **Date**: 2026-08-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-portable-ai-fallback/spec.md`

## Summary

Extend `/assistant` from one Chrome Prompt API adapter into a native-first catalog with two pinned portable text models: SmolLM2 360M q4 on WebGPU and SmolLM2 135M q4 on single-thread WASM. Add `@huggingface/transformers` 4.2.0 behind a dedicated module worker so preparation, tokenization, readiness, compaction, and generation do not block assistant controls. A real non-whitespace readiness generation on the current device—not browser family, a benchmark, or a timeout—decides whether an offered model is ready.

Preserve one chat pipeline: existing turns, queue, context, transcript, local persistence, media privacy, and terminal-write rules operate through a model catalog/controller and provider-neutral adapters. Persist model selection separately from readiness, bind every accepted turn to a model revision, order concurrent confirmations by a monotonic repository revision, and add one durable transcript boundary only when activation commits. Store model/runtime assets in a dedicated Cache API namespace through Transformers.js `ModelRegistry`; conversation Clear all never touches those assets, and model removal never rewrites chats.

## Technical Context

**Language/Version**: Strict TypeScript 5.9, React 18, Next.js 14 App Router, ES2020 browser workers

**Primary Dependencies**: Existing React/Next.js, Dexie 4, `@types/dom-chromium-ai`, uuid, Vitest, Testing Library, Playwright; add exact `@huggingface/transformers` 4.2.0 (which owns its ONNX Runtime Web dependency)

**Storage**: Existing Dexie/IndexedDB assistant database upgraded to v3 for session model state, immutable turn assignment, and model boundaries; existing in-memory temporary repository; dedicated Cache API namespace for pinned public model/runtime files; page/worker memory for live pipelines, progress, and candidate context

**Testing**: `yarn lint`, `yarn typecheck`, `yarn validate:content`, `yarn test:content`, `yarn test:assistant`, `yarn build`, `yarn test:e2e:assistant`; deterministic fake catalog/worker and no-egress spies; separately recorded real pinned 135M WASM, 360M WebGPU, and native Prompt API acceptance

**Target Platform**: Secure-context browsers that expose at least one required runtime surface: eligible browser Prompt API, Worker + Cache Storage + WebAssembly for WASM, or Worker + Cache Storage + WebGPU for accelerated inference. No browser/OS/device allowlist.

**Project Type**: Next.js client-side web feature under the existing `src/features/assistant/` architecture

**Performance Goals**: Main-thread navigation, selector, status, and stop controls remain operable during model work; aggregate preparation progress is shown when measurable; local text arrives incrementally when the runtime yields it. Token speed, answer quality, first-token latency, and fixed completion duration are not release gates.

**Constraints**: Conversation data never leaves the device; only confirmed preparation may request pinned public assets and those requests contain no user/session content. Portable models are text-only with an 8,192-token loaded-config target. No application timeout for preparation, health check, compaction, or generation. No automatic model fallback after a live failure, prompt replay, response replacement, per-response labels, feature flags, site-wide COOP/COEP headers, cloud inference, or synthetic answers.

**Scale/Scope**: Three catalog entries, current assistant limit of roughly 100 local sessions, one pending model intent per chat, one live portable pipeline per page, one immutable model assignment per accepted turn, and model assets of roughly 386 MB (360M q4) or 181 MB (135M q4) plus tokenizer/config/runtime files

## Constitution Check

*GATE: evaluated before Phase 0 research and rechecked after Phase 1 design.*

### Before design

- **I. Ship the Smallest Working Layer**: PASS — first prove one 135M WASM local turn through the existing assistant path, then add native catalog unification, WebGPU, durable switching, and removal as separately green layers.
- **II. Choose Simple, Durable Architecture**: PASS — one maintained Transformers.js dependency supplies tokenizer/chat template/generation/WebGPU/WASM/cache lifecycle; no custom model conversion, server, OPFS store, service worker, or duplicate chat pipeline.
- **III. Maintain One Current Path**: PASS WITH DOCUMENTED EXCEPTIONS — all models use one current queue/context/repository path and failures remain visible. The spec explicitly permits only (a) whole-turn older-context reduction after a confirmed downgrade when compaction fails and (b) one ready-model automatic replacement when reopening an externally unavailable model. Intentional removal suppresses the reopen exception.
- **IV. Preserve Modular Boundaries**: PASS — catalog/selection, worker runtime, asset cache, provider adapters, repository state, context policy, and UI have explicit contracts and do not duplicate sources of truth.
- **V. Publish Verifiable Truth**: PASS — readiness requires real local output on the current device; deterministic/build/real-runtime evidence is reported separately; ecosystem labels and performance claims are not inferred.
- **Technical/editorial constraints**: PASS — strict TypeScript, client-only browser API modules, functional React, Tailwind UI, and existing App Router composition remain.
- **Delivery gates**: PASS — dirty checkout was inspected and the user explicitly chose to continue in place; relevant automated/build/browser checks and real model proofs are specified before completion.

## Project Structure

### Documentation (this feature)

```text
specs/003-portable-ai-fallback/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── model-assets-and-workspace.md
│   ├── model-catalog-and-adapters.md
│   ├── model-selection-and-context.md
│   └── portable-worker.md
└── checklists/
    └── requirements.md
```

### Source Code

```text
src/features/assistant/
├── AssistantWorkspace.tsx               # Compose controller, repository, queue, and UI; no runtime branches
├── types.ts                              # Model keys, selection, boundary, turn/context extensions
├── constants.ts                          # DB v3, prompt/runtime/cache/lock identities
├── reducer.ts                            # Per-option discovery and active/pending workspace state
├── components/
│   ├── AssistantShell.tsx                # Top-left selector placement
│   ├── ModelSelector.tsx                 # Offered/active/pending model choices
│   ├── ModelPreparationDialog.tsx        # Size/capability/switch confirmation and progress
│   ├── ModelManager.tsx                  # Installed-model removal separate from Clear all
│   ├── Transcript.tsx                    # Durable boundary placement, no message badges
│   ├── Composer.tsx                      # Active-model capabilities and busy transition guard
│   └── AvailabilityPanel.tsx             # Provider-neutral readiness/failure states
├── model/
│   ├── modelAdapter.ts                   # Required model/runtime identity and capabilities
│   ├── modelCatalog.ts                   # Ordered static descriptors and structural offer checks
│   ├── modelController.ts                # Discovery, adapter/worker ownership, active/pending coordination
│   ├── browserLanguageModel.ts            # Existing native Prompt API adapter
│   ├── portableLanguageModel.ts           # Worker-backed adapter/session
│   ├── portableModel.worker.ts            # Transformers.js load/tokenize/generate/dispose
│   ├── portableWorkerProtocol.ts          # Typed commands/events and validation
│   ├── modelAssets.ts                     # ModelRegistry/cache inspect/prepare/remove operations
│   └── modelSessionCache.ts               # Runtime/model/revision-aware retained session identity
├── context/
│   ├── prompt.ts                          # Model-neutral text reconstruction; portable media exclusion
│   ├── contextManager.ts                  # Target-tokenizer whole-turn fit instead of fixed turn count
│   └── compaction.ts                      # Source compaction candidate + target measurement/commit
└── storage/
    ├── database.ts                        # Dexie v3 modelBoundaries schema and one-time v2 rewrite
    ├── repository.ts                      # Atomic selection/activation/removal state contracts
    ├── dexieRepository.ts                 # Revision/CAS/boundary/turn assignment implementation
    ├── memoryRepository.ts                # Equivalent temporary single-window semantics
    ├── repositoryFallback.ts              # Existing saved-to-temporary recovery
    └── useRepositoryQuery.ts              # Cross-window model selection/boundary subscriptions

tests/
├── fixtures/
│   ├── fakeLanguageModel.ts               # Multi-model adapter behavior
│   └── fakePortableWorker.ts              # Portable protocol/progress/late-event behavior
├── unit/assistant/
│   ├── modelCatalog.test.ts
│   ├── portableWorkerClient.test.ts
│   ├── modelAssets.test.ts
│   ├── modelSelection.test.ts
│   ├── modelContextSwitch.test.ts
│   ├── modelSessionCache.test.ts
│   └── dexieRepository.test.ts
├── component/assistant/
│   └── modelSelector.test.tsx
└── e2e/
    ├── assistant-model-selection.spec.ts
    └── assistant-portable-privacy.spec.ts
```

**Structure Decision**: Extend the existing assistant feature in place. `AssistantWorkspace` remains the composition root but delegates model discovery/runtime lifecycle to `modelController`, public asset ownership to `modelAssets`, and portable execution to a worker-backed adapter. Model selection and boundary transactions remain repository concerns. This prevents runtime-specific branches from accumulating in the already-large workspace while preserving the one working chat pipeline.

## Phase 0: Research and Decisions

The unknowns are resolved in [research.md](research.md). Implementation follows these decisions:

1. Use one ordered model catalog and provider-neutral adapter factory layer; do not create a parallel portable chat implementation.
2. Pin exact `@huggingface/transformers` 4.2.0 and immutable ONNX Community SmolLM2 q4 revisions: 360M on WebGPU and 135M on WASM.
3. Execute portable loading/tokenization/readiness/measurement/generation in a dedicated module worker with typed attempt-tagged events.
4. Offer models by minimal required API surface, but declare ready only after non-whitespace local generation. Add no ecosystem, memory, GPU vendor, benchmark, latency, or quality gate.
5. Use Transformers.js `ModelRegistry` and a dedicated Cache API namespace for file metadata, progress, cache truth, eviction detection, and exact removal; keep model bytes out of Dexie.
6. Include complete model/runtime identity in retained sessions and accepted turns so hidden native/portable context cannot cross a boundary.
7. Assign a monotonic confirmation revision before slow preparation; late attempts cannot override a later choice. IndexedDB CAS remains authoritative when Web Locks are absent.
8. Measure context with the target tokenizer and trim whole oldest completed turns only. A confirmed downgrade may use newest complete context silently when source compaction fails.
9. Keep portable inference text-only and exclude all historical media representation data from portable reconstruction while retaining media in visible history.
10. Use single-thread WASM without site-wide cross-origin isolation headers.
11. Require fake-runtime, production-worker, and real pinned model/backend evidence as separate tiers; no physical-device matrix is a shipping gate.

## Phase 1: Design and Implementation Plan

### Layer 1 — Prove one portable local turn end to end

- Add exact Transformers.js 4.2.0 and the typed module-worker protocol.
- Implement the 135M q4 WASM descriptor, fixed content-free readiness prompt, exact tokenizer measurement, text streaming, user stop, and disposal.
- Extend the fake adapter/worker first, then prove the real pinned 135M model prepares and generates a non-empty local answer through the existing turn/terminal pipeline.
- Add network canaries around preparation and generation; preparation may fetch only pinned public assets and generation must not issue application requests.
- Keep WASM single-threaded and ensure the production Next build emits/loads worker/runtime assets correctly.

**Acceptance**: In an offered WASM environment, explicit preparation reaches ready only after real output and a submitted text prompt reaches a non-empty terminal local response, with operable controls and no conversation egress or application timeout.

### Layer 2 — Replace single-model assumptions with one catalog/controller

- Add `modelCatalog.ts` with native, 360M WebGPU, and 135M WASM descriptors and structural offer checks only.
- Preserve `BrowserLanguageModelAdapter`; make model/capability identity required at the adapter boundary.
- Add `modelController.ts` to own per-option discovery, active/pending adapter lifecycle, worker construction, and normalized state. Replace the workspace's direct single-adapter construction and reducer's single environment state.
- Add `ModelSelector` at the top-left `AssistantShell` seam. Show all offered entries, actual model/execution names, active/pending/preparation state, and no incompatible catalog.
- Generalize Chrome-specific `AvailabilityPanel`, activity, and context copy without exposing internal diagnostics.
- Bind composer image/audio actions to the active model's current capabilities; existing native multimodal behavior stays unchanged and portable is text-only.
- Prove the real 360M q4 WebGPU pair through the same worker and controller before expanding switching behavior.

**Acceptance**: A new chat chooses native → 360M → 135M by rank, starts no portable transfer automatically, and completes a real local turn with each ready catalog tier through one queue/transcript path.

### Layer 3 — Persist model identity, selection intent, and boundaries

- Advance the assistant database to v3. In one upgrade transaction, mark historical sessions/turns/context as `browser-prompt-api` revision zero and add `modelBoundaries`; after upgrade use only the required v3 shape.
- Extend repository operations to atomically:
  - accept a prompt with active model key/revision/runtime identity;
  - reject acceptance while a model request is pending;
  - confirm a model request only while the chat has no nonterminal turn;
  - increment the monotonic request revision;
  - fail/cancel only a matching pending request;
  - activate only the latest matching request and append one boundary;
  - perform one expected-revision reopen activation;
  - mark intentional active-model removal as requiring explicit replacement.
- Mirror saved-mode semantics in the memory repository, visibly retaining its single-window/non-durable limitations.
- Add model key/revision/runtime identity to `modelSessionCache`; destroy every mismatch/candidate loser.
- Update repository live queries and reducer state so every window converges to durable active/pending/boundary state.
- Keep IndexedDB attempt IDs/CAS as the write authority. Use Web Locks to reduce duplicate work where present; do not process queue turns through the current unsafe unlocked branch.
- Replace blanket startup media-owner interruption with owner/attempt-aware reconciliation so opening a second model-selector window does not invalidate a live media turn.

**Acceptance**: Prompt/switch races have one winner; turns never reroute; a successful activation creates one boundary; later-confirmed choice wins regardless of preparation order; stale workers cannot write; no response has a model badge.

### Layer 4 — Switch context with source compaction and target measurement

- Split the current same-adapter compaction flow into an optional source-model candidate summary and target-model measurement/build.
- Replace the fixed newest-four-turn policy with exact target tokenizer capacity: reserve required prompt/output capacity and include newest complete turns that fit.
- Hold candidate summary/context until activation commits so target failure leaves the prior active context untouched.
- On confirmed downgrade compaction failure, omit the summary and use newest complete turns silently, after only the brief quality/memory warning.
- Reject required-content overflow visibly; never truncate the current prompt or partial turns.
- Scope context usage and retained sessions by model key/revision. Model boundaries and all media representations are excluded from portable prompts.
- Destroy native multimodal sessions under the existing one-shot rules before later text-only reconstruction.

**Acceptance**: Successful and failed downgrade cases preserve the visible transcript, commit boundary/context atomically, give the target only valid fitting text, and perform no replay or media leakage.

### Layer 5 — Reopen fallback and separate model management

- On chat activation, restore the prior model if ready. Otherwise perform at most one automatic expected-revision activation to the strongest already-ready replacement and write one `reopen_fallback` boundary.
- If only downloadable models exist, keep the prior model unavailable, require preparation confirmation, start no transfer, and write no boundary.
- Preserve the intentional-removal exception with `requiresExplicitReplacement` across reopen.
- Use ModelRegistry file lists/metadata for confirmation, preparation progress, cache completeness, eviction detection, and exact model removal.
- Request persistent origin storage after preparation consent but treat denial normally.
- Add a separate model manager/removal confirmation. Dispose live runtime, remove selected files, re-inspect, and notify other windows. Do not delete shared files still required by another descriptor.
- Leave Clear all assistant data scoped to conversations/settings/context/media history/boundaries; verify model cache survives.

**Acceptance**: External unavailability reopens to one ready fallback boundary, intentional removal never auto-falls back, clear-all preserves models, and model removal preserves every chat record.

### Layer 6 — Failure clarity, accessibility, and verification

- Normalize storage quota, missing/evicted/corrupt asset, unsupported operator/device, browser termination, resource exhaustion, interruption, and stale/superseded attempt states into concise user actions.
- Keep measured or indeterminate working states alive without elapsed-time failure. Stop waiting detaches the attempt and ignores late events; do not promise load-transfer cancellation that Transformers.js does not expose.
- Verify selector/dialog/manager/progress/boundary focus, keyboard, screen-reader, overflow, and narrow/mobile layout.
- Run all deterministic/build/Playwright checks in [quickstart.md](quickstart.md), including privacy request bodies/headers and the no-Web-Lock CAS profile.
- Record real exact 135M WASM, 360M WebGPU, and native regression evidence separately. Observe extended work for at least ten minutes without application timeout. Do not transform observed device failures into a support allowlist.

**Acceptance**: Every tested operation has truthful active/terminal/action state, all relevant repository checks pass, both pinned portable pairs complete real local turns where offered, and no conversation content leaves the device.

## Phase 1 Artifacts

- [research.md](research.md)
- [data-model.md](data-model.md)
- [contracts/model-catalog-and-adapters.md](contracts/model-catalog-and-adapters.md)
- [contracts/portable-worker.md](contracts/portable-worker.md)
- [contracts/model-selection-and-context.md](contracts/model-selection-and-context.md)
- [contracts/model-assets-and-workspace.md](contracts/model-assets-and-workspace.md)
- [quickstart.md](quickstart.md)

## Constitution Check (post-design)

- **I. Ship the Smallest Working Layer**: PASS — the six layers each have an end-to-end acceptance condition and keep the product buildable; the first layer proves the weakest real fallback before multi-model complexity.
- **II. Choose Simple, Durable Architecture**: PASS — one current Transformers.js release and ModelRegistry replace custom tokenizer/runtime/cache code; the static two-model catalog avoids user-import/plugin abstraction; no direct ONNX dependency is added.
- **III. Maintain One Current Path**: PASS WITH THE TWO SPEC EXCEPTIONS — the plan removes single-adapter/unsafe-unlocked assumptions rather than preserving parallel paths. Failures are visible and never trigger cloud/replay. The two narrow product-approved silent behaviors are isolated in context selection and reopen activation and covered by deterministic tests.
- **IV. Preserve Modular Boundaries**: PASS — runtime worker, catalog/controller, asset manager, repository transactions, context policy, and UI contracts are cohesive; Cache API is model-asset truth and Dexie is conversation truth.
- **V. Publish Verifiable Truth**: PASS — an entry cannot claim ready before a real local generation; fake tests, production build, exact runtime proofs, and observed device outcomes remain distinct evidence tiers.
- **Privacy/data minimization**: PASS — conversation-derived values have no allowed path into preparation fetches; portable inference is worker-local and media history remains UI-only.
- **Accessibility/failure clarity**: PASS — active/pending model, progress, stop, failure, boundaries, and removal have explicit accessible states and concise recovery.
- **Delivery gates**: PASS — plan requires all relevant repository checks, desktop/narrow browser verification, extended no-timeout observation, and exact real runtime acceptance before completion.

## Complexity Tracking

| Constitution exception | Why required | Simpler alternative rejected because |
|---|---|---|
| Principle III: after a confirmed downgrade, failed source compaction may silently omit older active context and use newest complete turns that fit | The visitor already confirmed a concise warning and explicitly requires the switch to continue without an internal compaction notice; visible transcript/current prompt remain intact | Blocking the switch or showing technical compaction diagnostics contradicts the approved product behavior |
| Principle III: reopening a chat with an externally unavailable prior model may atomically activate the strongest already-ready replacement without confirmation | The clarified reopen behavior keeps an existing chat immediately usable and leaves one durable boundary; it never downloads, replays, or replaces a current turn | Requiring confirmation on every unavailable reopen was explicitly rejected; auto-preparing a model would violate download consent |

No additional constitution violations are accepted. The catalog, worker, v3 boundary table, pending selection intent, and asset manager are the minimum structures needed for truthful readiness, cross-window ordering, no replay, and independent deletion scopes.
