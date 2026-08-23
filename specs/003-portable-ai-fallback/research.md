# Research: Portable Browser-Local AI Fallback

**Feature**: 003-portable-ai-fallback
**Date**: 2026-08-22

## Decision 1: Use one assistant pipeline with a catalog of adapter factories

**Decision**: Extend the existing `LocalModelAdapter` boundary into a model catalog that maps a stable model key to metadata and an adapter factory. Keep `BrowserLanguageModelAdapter` as the native entry and add one `PortableLanguageModelAdapter` backed by a worker. The current queue, context manager, repository, transcript, and terminal-turn rules remain the only chat pipeline.

**Rationale**:

- The repository already isolates Chrome Prompt API calls in `browserLanguageModel.ts` and drives every turn through `LocalModelAdapter`, `LocalModelSession`, `AssistantWorkspace`, and the persisted queue.
- A catalog makes model identity and priority explicit without creating a second chat implementation or leaking provider types into React and persistence.
- Session-cache identity can include the model key, pinned artifact revision, runtime, and dtype so no native or portable hidden state crosses a model boundary.

**Alternatives rejected**:

- A separate portable-assistant route or queue: duplicates orchestration and creates conflicting transcript/context paths.
- Runtime auto-fallback inside one adapter: would hide model changes and violate confirmation/boundary requirements.
- TensorFlow.js plus a separate model conversion: Transformers.js already supplies the tokenizer, chat template, generation, WebGPU/WASM execution, streaming, and cancellation primitives needed here.

## Decision 2: Add Transformers.js 4.2.0 and pin two official SmolLM2 artifacts

**Decision**: Add `@huggingface/transformers` 4.2.0 as the only new runtime dependency. Configure the initial portable catalog as follows:

| Model key | Display identity | Artifact | Revision | Runtime | Dtype | Approximate weight download |
|---|---|---|---|---|---|---:|
| `smollm2-360m-webgpu` | SmolLM2 360M · WebGPU | `onnx-community/SmolLM2-360M-Instruct-ONNX` | `fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9` | `webgpu` | `q4` | 386 MB |
| `smollm2-135m-wasm` | SmolLM2 135M · WASM | `onnx-community/SmolLM2-135M-Instruct-ONNX` | `b8a5c0f183b78c55955a5364f610c36668b5e681` | `wasm` | `q4` | 181 MB |

The confirmation UI uses library-provided file metadata to calculate the complete transfer size, including tokenizer/config/runtime files, rather than treating the weight size above as exact total bytes.

**Rationale**:

- Transformers.js 4.2.0 is the current stable npm release and contains the production-oriented `ModelRegistry` API needed for file enumeration, metadata, aggregate progress, cache inspection, and scoped removal.
- The ONNX Community instruct exports contain the tokenizer/chat-template files and current Transformers.js-compatible ONNX variants. Using `q4` for both tiers avoids making float16 shader/CPU support an additional admission condition.
- Both models declare an 8,192-position context. The application still reads the loaded config and treats the runtime value as authoritative.
- Pinning immutable revisions prevents a model update from silently changing size, behavior, or cache identity. Changing a revision is a deliberate catalog change.

**Alternatives rejected**:

- Tracking `main`: makes cache identity, displayed size, and runtime behavior mutable without a deploy.
- Committing hundreds of megabytes of model weights to this Git repository or Vercel output: increases repository/deployment complexity while public pinned Hub assets already satisfy the preparation privacy boundary.
- `q4f16` variants: smaller on disk, but their float16 execution assumptions would add another compatibility condition to both paths.
- A still smaller custom or unmaintained model export: saves bytes at the cost of a new conversion and artifact-ownership burden.

## Decision 3: Run all portable work in a dedicated module worker

**Decision**: Load Transformers.js, the tokenizer, model, and generation state inside `portableModel.worker.ts`, created with the standard module-worker URL pattern supported by the Next.js build. One page owns one portable worker/controller; persistent model assets are shared by the origin cache, but live model instances and KV state are not shared across windows.

The worker protocol supports `inspect`, `prepare`, `measure`, `generate`, `interrupt`, `dispose`, and typed progress/result/error events. `TextStreamer` emits incremental text. `InterruptableStoppingCriteria` stops generation at a generation step. Stopping a preparation attempt detaches the UI, ignores late attempt-tagged events, and may terminate that page's worker to reclaim computation; Transformers.js exposes no supported load-time `AbortSignal`, so the UI does not claim the underlying transfer was cancelled. No cancellation is ever triggered by elapsed application time.

**Rationale**:

- Tokenization, model loading, readiness generation, compaction, and normal generation can be CPU-heavy. A worker keeps navigation, status, stop, and assistant controls responsive.
- ONNX Runtime documents that a WebGPU session belongs inside the application worker because GPU buffers cannot be transferred through its WASM proxy-worker path.
- A single worker protocol gives WebGPU and WASM identical lifecycle semantics and prevents provider objects from crossing into React.
- Per-window live inference is simpler and more failure-isolated than a SharedWorker; existing per-session Web Locks already prevent two windows from generating the same chat turn concurrently.

**Alternatives rejected**:

- Main-thread inference: risks making the required controls inoperable during WASM work.
- ONNX Runtime's proxy-worker flag: incompatible with the WebGPU buffer boundary and redundant when the whole portable adapter already runs in a worker.
- SharedWorker/service-worker inference: adds lifetime, browser-support, serialization, and ownership complexity not required by the three-model catalog.

## Decision 4: Offer by required API surface; declare ready only after real generation

**Decision**: Use a static ordered catalog and minimal structural checks, not browser/device allowlists or performance benchmarks.

- The native entry is offered when the Prompt API surface exists and its own availability result says it can run or be prepared.
- The WebGPU entry is offered when a secure worker context and `navigator.gpu` are exposed.
- The WASM entry is offered when the secure environment exposes Worker, WebAssembly, fetch, and Cache Storage required by preparation and reuse.

An offered portable model progresses through cache inspection, loading/preparation, and a fixed minimal text generation. It becomes `ready` only when that check returns non-whitespace output. Any load, operator, adapter/device, memory, quota, or generation failure leaves the entry not ready with a concise retry/alternative action. There are no device-family gates, memory thresholds, benchmark cutoffs, or fixed readiness durations.

**Rationale**:

- WebGPU support does not guarantee that a particular model will create a session or complete under current memory pressure; Transformers.js explicitly warns that WebGPU may fail where WASM works.
- Conversely, ecosystem labels are too coarse to justify hiding a model that the current environment could run.
- The readiness generation is the smallest truthful end-to-end proof available on the actual device.

**Alternatives rejected**:

- User-agent support matrices, RAM heuristics, GPU vendor lists, or token-speed gates: produce false positives/negatives and contradict the product decision to let the current device try.
- Treating successful download or model construction as ready: does not prove tokenization plus generation works.
- Falling through automatically after failure: hides a model switch and can replay a prompt.

## Decision 5: Use the Transformers.js ModelRegistry and a dedicated Cache API namespace

**Decision**: Configure a dedicated Transformers.js cache key for assistant model/runtime assets. Use `ModelRegistry.get_pipeline_files` and `get_file_metadata` before confirmation, `is_pipeline_cached_files` for installed/evicted state, aggregate `progress_total` events during preparation, and `clear_pipeline_cache` for separately confirmed removal. The static catalog plus the Cache API is the source of truth; do not duplicate model bytes or an installed-model manifest in Dexie.

Request `navigator.storage.persist()` from the page after explicit model-preparation consent, but treat a denied request as best-effort storage rather than a model incompatibility. Recheck cache files after browser restart, external clearing, failed preparation, and before claiming installation. Model-specific Web Locks serialize prepare/remove operations across windows; a small BroadcastChannel notification asks other windows to re-inspect authoritative cache state.

**Rationale**:

- Transformers.js 4.2 provides the complete asset lifecycle that this fixed catalog needs.
- Cache API storage is origin-scoped and independent of the assistant's Dexie database, so Clear all assistant data naturally leaves model assets alone.
- Browser storage is best-effort by default and may be evicted; `navigator.storage.persist()` may reduce that risk but cannot be promised.
- Scoped cache removal avoids clearing unrelated site assets, the library runtime for another model, or conversations.

**Alternatives rejected**:

- Model bytes in Dexie: duplicates a maintained cache layer and couples large public assets to personal conversation deletion.
- Clearing the whole cache namespace for one model: shared tokenizer/runtime files may still be required by another installed model.
- A persisted boolean `installed`: becomes false truth after browser eviction or external clearing.
- A service worker solely for model caching: unnecessary because the library and Cache API already provide the required behavior.

## Decision 6: Pin runtime identity in every live session and accepted turn

**Decision**: Define a stable runtime identity as `(modelKey, model revision, backend, dtype, prompt version)`. Include it in `modelSessionCache` keys and capture the selected `modelKey` plus selection revision atomically when a prompt is accepted. A queued turn can only be generated by that captured model revision; it is never replayed through a replacement model.

Destroy portable pipelines/worker state when switching or removing a model and destroy native multimodal sessions according to the existing one-shot media rules. A later model reconstructs context through the provider-neutral prompt builder rather than inheriting hidden provider state.

**Rationale**:

- The current retained-session cache does not include model/runtime identity because only one adapter existed.
- Immutable turn provenance is necessary even though individual messages intentionally omit model badges.
- Reconstructing through text maintains the existing raw-media privacy boundary and makes context capacity measurable per target tokenizer.

## Decision 7: Serialize confirmation order before slow preparation

**Decision**: Persist a monotonic model-selection revision at the instant a visitor confirms a switch, under a short per-session model-intent Web Lock when available and an authoritative Dexie transaction in every environment. That revision is the definition of "most recently confirmed." Slow preparation/health-check/compaction is tagged with the session epoch, request ID, revision, owner window, and captured history revision; it uses a request-specific ownership lock where available rather than holding the session generation lock for the full download. Beginning and activation use short session coordination, and activation may commit only if its revision is still the latest confirmed intent and the chat remains idle.

Committing a switch atomically updates the session's active model, clears the matching pending intent, and appends exactly one `ModelBoundary`. A superseded, failed, cancelled, or abandoned attempt leaves the active model and transcript unchanged and writes no boundary. Repository subscriptions make every window converge. `acceptPrompt` rejects while a model intent is pending, and model-switch confirmation rejects while any turn is queued, claimed, or streaming, preventing work from crossing the boundary.

Durable turn/model attempt IDs and compare-and-swap terminal writes remain the correctness authority when Web Locks are absent. Another window may observe but cannot process a live owner's turn. It may perform an explicit retry/takeover that terminalizes the old attempt before creating a new immutable turn; stale worker checkpoints are then rejected by attempt identity. No liveness timer marks inference dead. A released request-specific lock allows another window to clear only the matching abandoned pending intent; without Web Locks, recovery is explicit rather than timer-driven. Opening another window must not run the current blanket `markUnownedMediaTurns()` behavior, which can interrupt a still-live media owner.

**Rationale**:

- Ordering by completion would let an older, slow download overwrite a model that was confirmed later in another window.
- Wall-clock timestamps can tie and do not serialize cross-window writes.
- IndexedDB transactions supply the device-local monotonic order without a server or leader election; Web Locks reduce duplicate work where present but are not the only correctness boundary.

**Alternatives rejected**:

- Last worker to finish wins: violates the clarified confirmation order.
- Timestamp plus UUID only: deterministic but does not guarantee confirmation order under clock/tie anomalies.
- BroadcastChannel as authority: messages can be missed and do not durably serialize writes.

## Decision 8: Make downgrade context best-effort without mutating visible history

**Decision**: Before a confirmed downgrade, the current usable model gets one compaction attempt against the existing text-only reconstruction. Hold the candidate summary in memory until the target model is ready and the selection revision is committed. Measure the target prompt with its exact tokenizer/chat template.

If compaction fails or the summary does not fit, build target context from the newest complete historical turns that fit after reserving personality/system content, the current prompt, and output capacity. Drop whole oldest historical turns only. Never truncate the current user prompt, rewrite visible history, include raw historical media, or show a separate compaction diagnostic. The only pre-confirmation copy is the brief warning that a less capable model may reduce answer quality and conversation memory.

**Rationale**:

- The target tokenizer is the authoritative measure; character counts or source-model token counts are not portable.
- Holding candidate compaction until commit preserves FR-029 if the target cannot become ready.
- Whole-turn trimming is predictable and keeps user/assistant pairs coherent.

**Alternatives rejected**:

- Blocking the switch when compaction fails: contradicts the explicitly approved best-effort behavior.
- Silently truncating the current prompt or partial turns: loses accepted/current user intent.
- Showing internal token/compaction failure details: conflicts with the requested concise communication.

## Decision 9: Keep portable inference text-only and network-silent after preparation

**Decision**: Portable adapters report text-only capabilities. The composer disables image/audio submission for the active portable model while the transcript continues to render existing bounded media history. Prior media records remain UI-only and are excluded from portable prompt reconstruction; the portable model receives no raw media, thumbnail, object URL, attachment label, or claim that it inspected prior media.

Only public pinned artifact and runtime requests are allowed during confirmed preparation. Fetch wrappers and tests assert that no prompt, response, title, personality, context, media marker, or session identifier appears in URLs, headers, or bodies. Once ready, portable measure/generate/compact operations perform no application network request.

**Alternatives rejected**:

- Converting historical media to text automatically: introduces inference/egress behavior outside the feature.
- Sending model content to a server when local work fails: violates the defining privacy requirement.
- Hiding prior media records: rewrites the visible transcript across a model boundary.

## Decision 10: Use single-threaded WASM without cross-origin isolation headers

**Decision**: Configure the compatibility worker for one WASM thread and do not add site-wide COOP/COEP headers. WebGPU remains the accelerated tier. This is a deliberate compatibility architecture, not a temporary feature gate.

**Rationale**:

- Multi-threaded WASM generally depends on cross-origin isolation and SharedArrayBuffer behavior that varies across embedded/mobile contexts.
- Site-wide isolation headers can affect unrelated portfolio resources and third-party integrations.
- The product explicitly accepts slow generation and rejects token-speed shipping gates; a single-thread compatibility path serves more environments with less site-wide risk.

**Alternatives rejected**:

- Require cross-origin isolation for every assistant visitor: narrows compatibility and expands the change beyond `/assistant`.
- Dynamically benchmark and hide the WASM model: reinstates capability gatekeeping.

## Decision 11: Separate deterministic, production-build, and real-model evidence

**Decision**: Extend fake-adapter/worker tests for deterministic catalog, state, privacy, queue, context, and concurrency coverage. Exercise the production worker bundle in Playwright at desktop and narrow/mobile viewports. Before implementation completion, separately run each exact portable catalog entry through preparation, readiness, a non-empty local turn, stop, reopen/cache reuse, and removal in at least one environment where its required runtime is exposed. This validates the shipped model/runtime pair without creating a physical-device matrix or claiming ecosystem-wide support.

Extended-work tests observe at least ten minutes with no product timeout. Test-runner limits may end a failed test, but no elapsed-time failure path exists in application code.

**Rationale**:

- Fake models cannot prove the pinned ONNX artifact, worker bundle, WebGPU/WASM runtime, or browser cache actually works.
- One real machine cannot prove every browser/device works; current-device readiness remains the truthful authority.
- Evidence tiers keep "the feature works" distinct from "this ecosystem is universally supported."

## Primary sources

- [Transformers.js 4.2.0 npm package](https://www.npmjs.com/package/%40huggingface/transformers)
- [Transformers.js v4 ModelRegistry and aggregate progress](https://huggingface.co/blog/transformersjs-v4)
- [Transformers.js pipeline revisions, caching, and streaming](https://huggingface.co/docs/transformers.js/en/pipelines)
- [Transformers.js ModelRegistry API](https://huggingface.co/docs/transformers.js/api/utils/model_registry)
- [Transformers.js TextStreamer API](https://huggingface.co/docs/transformers.js/en/api/generation/streamers)
- [Transformers.js interruptible stopping criteria](https://huggingface.co/docs/transformers.js/api/generation/stopping_criteria)
- [Transformers.js WebGPU guide](https://huggingface.co/docs/transformers.js/en/guides/webgpu)
- [ONNX Runtime worker/WebGPU constraints](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html)
- [SmolLM2 360M Instruct pinned ONNX export](https://huggingface.co/onnx-community/SmolLM2-360M-Instruct-ONNX/commit/fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9)
- [SmolLM2 135M Instruct pinned ONNX export](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX/commit/b8a5c0f183b78c55955a5364f610c36668b5e681)
- [MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [MDN persistent storage request](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)
- [MDN Cache.delete](https://developer.mozilla.org/en-US/docs/Web/API/Cache/delete)

All planning unknowns are resolved. Actual operator/device success remains intentionally determined by the readiness generation on the current device, with the exact pinned pairs proven during implementation acceptance.
