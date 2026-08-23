# Data Model: Portable Browser-Local AI Fallback

**Feature**: 003-portable-ai-fallback

## Storage boundaries

Conversation identity, selections, turns, boundaries, and text context remain in the existing assistant repository (Dexie in saved mode, memory in temporary mode). Public model/runtime assets live in a dedicated Cache API namespace controlled through Transformers.js `ModelRegistry`. Live pipelines, tokenizers, GPU/WASM sessions, progress, and preparation attempts live in page/worker memory only.

The Dexie schema advances from version 2 to version 3 to add `modelBoundaries` and indexes needed for selection convergence. Its single upgrade transaction rewrites existing session, turn, and context records with the truthful historical `browser-prompt-api` identity and revision zero. After upgrade, the fields are required; there is no legacy read branch, dual write, or ongoing normalization path. If that native identity is unavailable when the chat reopens, the normal reopen rule applies.

Clear all assistant data deletes repository records, including model boundaries and pending selection intent, but never touches the model-asset cache. Remove model deletes only the selected catalog artifact/runtime cache entries and never cascades into conversations.

## Static catalog entities

### ModelKey

A stable opaque string identifying the complete inference contract, not just a display name.

Initial values:

- `browser-prompt-api`
- `smollm2-360m-webgpu`
- `smollm2-135m-wasm`

Changing artifact revision, backend, or dtype requires a new `ModelKey` unless the old cache identity is deliberately replaced in the same deploy and removed from the catalog.

### LocalModelDescriptor

Static source-controlled catalog record; never copied into every conversation as a mutable source of truth.

| Field | Type | Meaning |
|---|---|---|
| key | ModelKey | Stable runtime identity |
| displayName | string | User-facing actual model name |
| executionName | string | Prompt API, WebGPU, or WASM |
| rank | number | Native first, larger accelerated second, compatibility third |
| kind | native or portable | Adapter family |
| capabilities | text/image/audio booleans or dynamic | Portable entries are text-only; native probes current capability |
| task | text-generation? | Portable Transformers.js pipeline task |
| repository | string? | Pinned public model repository |
| revision | string? | Immutable artifact commit |
| device | webgpu or wasm? | Portable execution device |
| dtype | q4? | Portable precision identity |
| approximateWeightBytes | number? | Pre-metadata confirmation estimate |
| contextLimit | number or dynamic | Loaded model config/provider is authoritative |
| promptVersion | number | Prompt/chat-template compatibility identity |

### ModelAssetSnapshot

Ephemeral observation derived from the static descriptor, required API surface, `ModelRegistry`, and the current worker attempt.

| Field | Type | Meaning |
|---|---|---|
| modelKey | ModelKey | Catalog entry |
| compatibility | omitted or offered | Structural API result; omitted entries never render |
| state | unprepared, preparing, loading, checking, ready, failed, removing, missing | Current-device state |
| requiredFiles | AssetFile[] | Pinned required file requests discovered by ModelRegistry |
| expectedBytes | number? | Aggregate metadata size when measurable |
| loadedBytes | number? | Aggregate progress when measurable |
| progress | number? | Measured percentage; absent means indeterminate active state |
| loadedRuntimeIdentity | string? | Worker/pipeline identity after readiness |
| failure | normalized failure? | Concise category/action; no internal diagnostics in UI |
| observedAt | number | Observation timestamp, not an admission cache |

Installed/ready is never represented by an unverified persisted boolean. A new page re-inspects required files and performs readiness before using a portable pipeline.

## Durable conversation entities

### AssistantSession extensions

| Field | Type | Meaning |
|---|---|---|
| activeModelKey | ModelKey? | Model assigned to subsequent accepted turns; absent only on a blank/legacy unresolved session |
| activeModelRevision | number | Selection request revision that activated the current model; zero for initial assignment |
| modelRequestRevision | number | Monotonic counter incremented when a selection confirmation transaction commits |
| pendingModelRequest | PendingModelRequest? | Latest confirmed target not yet activated |
| requiresExplicitReplacement | boolean | Suppresses reopen auto-fallback after intentional active-model removal |
| modelUnavailableReason | removed, evicted, unsupported, failed, none | Why the active key cannot currently accept a turn |

Readiness and installed state are not persisted here. `activeModelKey` records chat provenance; the catalog/runtime decides whether it is currently usable.

### PendingModelRequest

Durable intent nested in the session record. It changes the active model only after a separate activation transaction succeeds.

| Field | Type | Meaning |
|---|---|---|
| requestId | string | Globally unique confirmation identity |
| revision | number | Session-local monotonic confirmation order |
| targetModelKey | ModelKey | Requested model |
| sourceModelKey | ModelKey? | Active model when confirmed |
| ownerWindowId | string | Page that owns the preparation attempt |
| reason | visitor, recommended | Why confirmation was offered |
| status | preparing, checking, compacting, ready_to_commit | Durable coarse state; progress remains ephemeral |
| capturedEpoch | number | Clear-all/delete invalidation boundary |
| capturedHistoryRevision | number | Transcript/context version at confirmation |
| confirmedAt | number | Display/audit time only; not the ordering authority |

Only one pending request exists per session. A newer confirmation overwrites it after incrementing `modelRequestRevision`. Late events must match every identity field before they can update or activate.

### ConversationTurn extensions

| Field | Type | Meaning |
|---|---|---|
| modelKey | ModelKey | Active model captured atomically when the prompt is accepted |
| modelRevision | number | Active model revision captured with the key |
| modelRuntimeIdentity | string | Pinned native/portable runtime identity used for cache/session validation |

The fields are immutable. Claim and generation revalidate them. A missing runtime cannot reroute the turn; the turn fails/interruption is visible and Retry remains explicit.

### ModelBoundary

Dedicated transcript event; never encoded as a fake user/assistant message and never passed to a model.

| Field | Type | Meaning |
|---|---|---|
| id | string | Stable boundary ID; equal to or uniquely derived from request ID |
| sessionId | SessionId | Owning chat |
| selectionRevision | number | Activation order and uniqueness within the session |
| fromModelKey | ModelKey? | Previous active identity |
| toModelKey | ModelKey | New active identity |
| toDisplayName | string | Durable display snapshot for readable historical boundaries |
| toExecutionName | string | Durable backend snapshot |
| reason | visitor, recommended, reopen_fallback | Activation source |
| confirmation | visitor or automatic_reopen | Whether activation used a visitor confirmation |
| afterTurnId | TurnId? | Latest terminal turn at activation; null places the boundary before the first turn |
| createdAt | number | Display time |

Unique constraint: `(sessionId, selectionRevision)` and `id`. Transcript rendering groups boundaries after `afterTurnId` and sorts same-position boundaries by `selectionRevision`. Individual assistant messages have no model field rendered as a badge.

### ContextState extensions

| Field | Type | Meaning |
|---|---|---|
| modelKey | ModelKey? | Model whose tokenizer/capacity produced model-specific usage |
| modelRevision | number? | Active selection revision for that measurement |
| generatedByModelKey | ModelKey? | Model that created a condensed summary |
| appliesThroughTurnId | TurnId? | Last complete turn represented by the summary |
| promptVersion | number | Reconstruction contract |

Summary text may be reusable after target measurement, but token usage, warning level, and replacement-session identity are model-specific and invalidated on every selection change.

## Ephemeral entities

### DraftModelChoice

Page-memory choice for a new chat that has not accepted its first prompt.

| Field | Type | Meaning |
|---|---|---|
| modelKey | ModelKey | Strongest offered option or visitor choice |
| confirmed | boolean | Whether required preparation/switch copy was confirmed |
| readiness | ModelAssetSnapshot | Current page observation |

The first accepted prompt creates the session with this ready model at revision zero. Initial assignment writes no model boundary.

### ModelSelectionAttempt

Page/worker-memory operation corresponding to `PendingModelRequest`.

| Field | Type | Meaning |
|---|---|---|
| token | sessionId, epoch, requestId, revision | Late-event/CAS identity |
| abortController | AbortController | User/navigation cancellation signal at the adapter boundary |
| workerAttemptId | string | Routes worker progress and output |
| candidateRuntime | LocalModelSession? | Target session not cacheable until activation wins |
| candidateContext | CandidateContext? | Best-effort summary or newest complete target-fit turns |
| detached | boolean | UI stopped waiting; late events have no UI/durable authority |

Losing, cancelled, deleted, cleared, superseded, or failed candidates are destroyed exactly once.

### PortableWorkerSession

Worker-only live state.

| Field | Type | Meaning |
|---|---|---|
| runtimeIdentity | string | Model key + revision + backend + dtype + prompt version |
| pipeline | Transformers.js text-generation pipeline | Loaded tokenizer/model/runtime |
| contextLimit | number | Loaded config maximum |
| activeAttemptId | string? | Current prepare/measure/generate command |
| stoppingCriteria | interruptible criteria? | Cooperative generation stop |

No worker object is serialized or shared through BroadcastChannel.

## Relationships and indexes

- Session 1-to-many turns, messages, contexts, and model boundaries.
- Session has at most one pending model request.
- Turn belongs to exactly one model key/revision.
- Boundary belongs to one activation revision and one transcript position.
- Catalog descriptor 1-to-many asset request keys, but no conversation foreign key cascades into model assets.
- Dexie v3 adds `modelBoundaries: "id, sessionId, selectionRevision, afterTurnId, createdAt, [sessionId+selectionRevision]"` and preserves existing tables/indexes.
- Session deletion/clear-all includes boundaries and pending intent in the existing epoch/tombstone transaction.
- Model-specific prepare/remove uses `flick-assistant:model-assets:<modelKey>` Web Locks where available. Selection confirmation uses `flick-assistant:model-intent:<sessionId>`; generation continues using the existing session lock where available.

## Selection lifecycle

1. **Discover**: inspect structural APIs and model cache; omit only entries missing a required execution surface.
2. **Initial draft**: choose the highest-ranked offered option. Do not download portable assets.
3. **Initial ready**: after any required preparation confirmation and readiness generation, the first prompt transaction creates the session and immutable model-bound turn. No boundary is added.
4. **Confirm switch**: while no turn is queued, checking context, compacting, or generating, transactionally increment `modelRequestRevision` and write `pendingModelRequest`. Active model remains unchanged.
5. **Prepare target**: the owner worker prepares/checks the target. `acceptPrompt` is blocked by pending intent across every window. A later confirmation supersedes the request immediately.
6. **Build target context**: if downgrading, make one current-model compaction attempt; then measure with the target tokenizer and choose the summary plus newest complete turns, or newest complete turns alone.
7. **Activate**: atomically verify epoch/request/history/idle state, update active model/revision, clear pending, scope context, increment history revision, and insert one boundary.
8. **Fail/cancel/stale**: clear only a matching pending request. Keep active model/transcript/context unchanged; destroy candidate runtime. An older superseded request never revives.
9. **Reopen fallback**: when the prior model is unavailable for external reasons and an already-ready replacement exists, perform one expected-revision CAS activation with `reopen_fallback`. If only downloadable models exist, do not download or add a boundary.
10. **Intentional removal**: dispose resident runtime, remove exact assets, retain provenance key, set `requiresExplicitReplacement`, and block turns. Reopen fallback remains suppressed until a confirmed replacement activates.

## Prompt acceptance versus selection

Prompt acceptance and switch confirmation race through the repository:

- If prompt acceptance commits first, the switch returns `chat_busy` and writes no intent/boundary.
- If pending intent commits first, prompt acceptance returns `model_change_in_progress` and preserves the unsent draft.
- Queue claim validates the turn's model key/revision against its accepted values; it never substitutes the session's newer active model.

When Web Locks are unavailable, Dexie compare-and-swap attempt identity remains authoritative. A second window can observe an owner but cannot write its checkpoints. Explicit recovery terminalizes the stale attempt before a new retry; no liveness timeout interrupts local math.

## Context selection lifecycle

1. Render the exact target chat template and tokenize it with the target tokenizer.
2. Reserve system/personality content, the current complete user prompt, and the configured output token allowance.
3. Add an eligible summary only if it fits and does not include content beyond `appliesThroughTurnId`.
4. Add completed historical user/assistant turns newest-first, then restore chronological order.
5. Drop only whole oldest historical turns when capacity is exceeded.
6. Exclude queued, generating, failed, interrupted, model-boundary, and all historical media representation content.
7. If required content alone cannot fit, fail visibly with a context action; never truncate the current prompt.

## Validation invariants

- Active model changes only through an atomic initial assignment, confirmed activation, or the documented ready-model reopen exception.
- Highest `modelRequestRevision` is the only request allowed to activate; completion time and wall clock are irrelevant.
- Exactly one successful activation writes exactly one boundary. Probing, preparation, failure, cancellation, stale completion, and same-model selection write none.
- Model boundary text is UI metadata only and never enters model input.
- A switch cannot commit while any accepted turn is nonterminal.
- A queued turn runs with its immutable accepted model or fails visibly; no replay/reroute occurs.
- Readiness uses a fixed conversation-free probe and does not create a session turn/message/boundary.
- Portable reconstruction contains no raw media, thumbnail, attachment label, object URL, or model-boundary text.
- Clear all and model removal cannot cross their storage scopes.
- No readiness, preparation, selection, context, or generation transition is driven by an application elapsed-time deadline.
- Temporary mode preserves these single-window semantics in memory and remains visibly “Not saved”; it does not claim cross-window convergence.
