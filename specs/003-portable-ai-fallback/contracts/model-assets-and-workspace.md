# Contract: Model Assets and Workspace

**Feature**: 003-portable-ai-fallback

## Asset ownership

Portable model/runtime assets use a dedicated Transformers.js Cache API namespace. The source-controlled catalog plus pinned `ModelRegistry` file inspection defines the expected set; Dexie never stores weight bytes or claims installation with a boolean.

For each portable descriptor:

- enumerate exact pipeline files and metadata for its task/revision/device/dtype;
- display aggregate bytes from metadata when available, otherwise the catalog estimate;
- serialize prepare/remove under a model-specific asset lock when Web Locks exist;
- inspect all required files before claiming installed;
- run readiness generation before claiming ready;
- clear only the selected pipeline's files during confirmed removal;
- dispose resident page workers before/while removal and notify other pages to re-inspect;
- treat BroadcastChannel as invalidation notification only, never storage authority.

Partial preparation, browser eviction, external site-data clearing, or corrupt files produce `missing`/`failed`, not `ready`. Retry may reuse whatever exact pinned files the cache retained.

## Storage persistence

After the visitor confirms a portable download, the page may request `navigator.storage.persist()`. Denial is normal and does not hide the model. `navigator.storage.estimate()` may inform concise storage failure copy but never decides model eligibility or promises free bytes. `QuotaExceededError` remains an actionable preparation failure.

No service worker, OPFS store, or model bytes in the assistant database are introduced.

## Deletion scopes

### Clear all assistant data

Deletes:

- sessions;
- turns/messages;
- contexts/summaries;
- settings;
- media-history records;
- model boundaries/pending selection intents.

Preserves:

- every portable model/runtime cache entry.

### Remove model

Deletes:

- exact pinned files belonging to the confirmed portable catalog entry, as reported by ModelRegistry;
- live page-owned runtime for that model.

Preserves:

- sessions, turns, messages, contexts, settings, media history, and model boundaries;
- other installed models and shared assets still required by them.

Removing the active model marks affected chats as requiring explicit replacement and performs no fallback, boundary, prompt replay, or transcript rewrite.

## Selector/workspace behavior

- Place `ModelSelector` at the top-left of assistant content, above the transcript and separate from the session sidebar.
- List all and only currently offered catalog entries; show actual model/execution names, active state, and preparation requirement.
- Keep the active model visually distinct from a pending requested target. A failed target never appears active.
- An unprepared portable target uses one confirmation containing model, execution method, aggregate/approximate size, and concise lower-capability warning before any transfer.
- A prepared switch still uses confirmation; downgrade copy remains brief.
- Disable confirmation while the chat is busy, but keep controls inspectable and status accessible.
- Preparation/checking/generation has measured progress when available and an indeterminate working state otherwise. No elapsed-time failure copy exists.
- Stop waiting/generating is always available and preserves completed transcript content/assets according to the operation contract.
- Failure copy exposes an understandable retry, choose-model, remove/reprepare, or unavailable action without internal stack/driver/operator detail.
- Model management is separate from Clear all assistant data.

## Privacy/no-egress

Preparation requests may contain only public pinned artifact/runtime identity. They must not contain prompt, response, transcript, title, personality, context, session/turn identifiers, media bytes, filenames, labels, or user-derived telemetry.

After readiness, portable measurement, compaction, and generation make no application network request. No cloud inference, server prompt endpoint, synthetic answer, analytics event containing conversation content, or remote media conversion exists.

## Accessibility

- Selector, confirmation, progress, active model, pending target, failure, and removal controls are keyboard operable and labelled.
- State changes use concise accessible status announcements without repeatedly announcing token deltas.
- Focus returns predictably after confirmation/cancellation/removal.
- Existing transcript copy, stop, session navigation, settings, and media-history accessibility remain intact at desktop and narrow/mobile sizes.

## Test contract

Tests prove exact deletion scopes, partial-cache reconciliation, cache eviction detection, model-specific removal, preparation race serialization, late-event rejection, selector ordering/content, concise confirmations, active-versus-pending identity, accessibility, no app timeouts, and network-content privacy. Real-browser evidence separately proves both pinned portable model/backend pairs and native regression.
