# Contract: Media Persistence and Queue Ownership

**Feature**: 002-assistant-media-input

## Repository boundary

Repository methods accept text, turn metadata, media representation records, and owner identity. They never accept raw MediaPart source values. The Dexie and memory implementations must have equivalent behavior.

Required behavior:

- create a media history representation before the turn becomes processable;
- enqueue a turn with mediaKinds, mediaRepresentationIds, mediaOwnerWindowId, and mediaState;
- claim only if the caller owns the queued media attempt, under the existing per-session Web Lock;
- mark an owner-lost turn interrupted/requires_reattach without deleting its text/history representation;
- finish terminal state and release/retain raw ownership according to the page-local lifecycle;
- atomically delete session, message, turn, and media-history records;
- expose temporary-mode records in memory only and preserve the visible “Not saved” state.

## Owner-aware queue contract

Each page creates an unpredictable window ID. A media turn stores that ID and is claimable only when:

1. the caller’s window ID matches the turn owner;
2. the page-local EphemeralMediaStore has the exact source parts for the turn;
3. the current owner lease/lock is valid.

Text-only turns retain current queue behavior. Another window may observe a media turn but must skip it rather than claim and send an incomplete prompt. On reload/owner loss, cleanup marks the turn unavailable/requires_reattach. Reattachment creates a new immutable turn and does not change the old turn’s terminal history.

## Schema and deletion

Add a Dexie schema version with a mediaHistory table indexed by sessionId, turnId, messageId, and createdAt. Store only bounded image thumbnails or audio identity/metadata. Session deletion, clear-all, and tombstone cleanup include the new table in their existing transaction boundaries.

No raw-media store, object URL, cloud upload, remote reference, or compatibility dual-write is permitted.

## Failure behavior

- If representation derivation fails, retain accessible metadata and continue without a false thumbnail.
- If native measurement or prompt submission rejects, preserve staged raw parts while the attempt remains eligible for correction/retry.
- If the text is no longer submittable with the media or the owner disappears, release raw parts and require reattachment.
- Errors are actionable and contain no raw source data in logs or persisted error fields.
