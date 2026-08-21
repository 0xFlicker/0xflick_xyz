# Data Model: Multimodal Persona Assistant Input

**Feature**: 002-assistant-media-input

## Storage boundary

Raw image/audio source bytes are never durable. They live only in a page-local ephemeral store while a current turn or explicitly eligible retry can still submit them. IndexedDB and the in-memory repository store text, turn state, ownership metadata, and bounded history representations only.

The Dexie schema receives one additive version upgrade for the media-history table. Existing text/session records continue to be readable through the normal upgrade; there is no legacy dual-write path or raw-media migration.

## Entities

### EphemeralMediaAttempt

Page-memory record; never serialized.

| Field | Type | Meaning |
|---|---|---|
| submissionId | string | Unique attempt identity; a retry gets a new value |
| turnId | string | Owning queued/current turn |
| ownerWindowId | string | Random per-page owner identity |
| parts | MediaPart[] | Exact selected Blob values and user-visible metadata |
| retryEligible | boolean | Whether the UI may resubmit the same bytes |
| createdAt | number | Page-local timestamp |
| expiresReason | enum | released, reload, cancelled, terminal, replaced, unavailable |

The store exposes lookup, attach, release, and owner checks only. It does not expose a persistence, URL, cross-window broadcast, or logging operation.

### MediaPart

Domain input passed from Composer to the active turn.

| Field | Type | Meaning |
|---|---|---|
| kind | image or audio | User-selected modality |
| source | Blob | Exact selected source, page memory only |
| mimeType | string | Source MIME type |
| name | string | User-visible file name when available |
| byteLength | number | Source size for accessible status/measurement |
| width/height | number? | Measured image dimensions when available |
| durationSeconds | number? | Measured audio duration when available |
| accessibleLabel | string | Stable user-facing description, not a model substitute |

The source field is never accepted by repository APIs and never appears in replay or compaction structures.

### ConversationTurn extensions

Existing immutable turn record gains:

| Field | Type | Meaning |
|---|---|---|
| mediaKinds | image[] or audio[] | Modality summary for UI and validation |
| mediaRepresentationIds | string[] | References to bounded history records |
| mediaOwnerWindowId | string? | Page that currently owns raw source bytes |
| mediaState | none, ephemeral, requires_reattach, released | Raw-source lifecycle state |
| interruptedReason | string? | User-facing reason when owner/reload makes a queued media turn unavailable |

Text, timestamps, terminal state, and retry lineage remain governed by the existing turn model. A retry always creates a new turn; it never mutates a terminal turn.

### MediaHistoryRepresentation

Durable in Dexie; memory-only in temporary mode.

| Field | Type | Meaning |
|---|---|---|
| id | string | Stable representation identifier |
| sessionId | string | Owning assistant session |
| turnId | string | Accepted turn |
| messageId | string | User message that displayed the attachment |
| kind | image or audio | Representation modality |
| thumbnail | Blob? | Small locally-derived image preview only |
| label | string | File/attachment identity shown in history |
| accessibleLabel | string | Screen-reader text and fallback when preview fails |
| mimeType | string | Display metadata |
| byteLength | number? | Original-size metadata, not source bytes |
| width/height | number? | Image metadata when measured |
| durationSeconds | number? | Audio metadata when measured |
| createdAt | number | History ordering |

An image thumbnail is bounded by a UI-preview dimension/byte policy. That policy is not an input limit and is never used in the native model request. Audio has no durable source or waveform field.

### MediaCapabilitySnapshot

Ephemeral model/environment observation; not persisted.

| Field | Type | Meaning |
|---|---|---|
| text | available or unavailable | Text-only Prompt API path |
| image | available or unavailable | Text+image probe result |
| audio | available or unavailable | Text+audio probe result |
| observedAt | number | Capability observation time |
| modelIdentity | string? | Selected model/session identity |
| error | string? | Normalized availability explanation |

Capabilities may change due to model downloads, hardware, GPU, storage, or browser state. A stale staged attachment remains removable/reviewable, but send rechecks the snapshot.

## Relationships and indexes

- Session 1-to-many turns.
- Turn 1-to-many messages and 1-to-many MediaHistoryRepresentation records.
- Message references representation IDs for rendering; the representation table remains the deletion authority.
- Dexie indexes: sessionId, turnId, messageId, and createdAt on media history; ownerWindowId/mediaState on queued turns where the current repository query benefits from it.
- Session deletion and clear-all delete related media-history records in the same transaction as messages, turns, and tombstones.

## Lifecycle

1. **Draft**: Composer holds selected MediaPart values in the page-local store; nothing is durable.
2. **Accepted**: The text and history representation are recorded, the queued turn receives its ownerWindowId, and raw parts remain in the owner page’s EphemeralMediaAttempt.
3. **Queued/generating**: The existing per-session Web Lock serializes work. Only the owner with the matching in-memory attempt can claim a media turn.
4. **Terminal**: On success, stop, cancellation, replacement, or unrecoverable provider failure, raw parts are released unless the UI explicitly keeps an eligible retry. The representation remains with the terminal history record.
5. **Owner lost**: Reload/close or missing in-memory source transitions an unprocessed media turn to requires_reattach/interrupted. Its text and representation remain visible; a new attachment creates a new turn.
6. **Follow-up**: Context reconstruction and compaction use text plus optional accessible labels/metadata, never MediaPart.source or thumbnail bytes. The native session used for the media turn has already been destroyed.
7. **Deletion**: Session/message deletion removes all related representations and references atomically. Temporary mode drops memory records when the repository/session is cleared.

## Validation invariants

- A persisted record cannot contain a raw source Blob, object URL, native image/audio value, or network URL.
- A media turn cannot be claimed by a window without an owner match and a live ephemeral attempt.
- A retry cannot mutate the prior terminal turn.
- A missing or failed image thumbnail falls back to accessible metadata.
- Capability unavailability disables only the unsupported send path; it does not silently discard staged media.
- No product-defined maximum is applied to count, bytes, dimensions, duration, or mixed combinations. Native measurement/rejection and local resource failure are the only limits.
