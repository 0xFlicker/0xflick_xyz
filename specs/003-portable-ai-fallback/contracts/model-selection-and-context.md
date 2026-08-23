# Contract: Model Selection, Boundaries, and Context

**Feature**: 003-portable-ai-fallback

## Idle definition

A chat is switchable only when it has no queued, context-checking, compacting, claimed, or streaming turn and no current model request. Opening controls is allowed during work, but confirming a switch returns `chat_busy` and is not deferred.

## Initial selection

- A blank chat chooses the highest-ranked offered option.
- Automatic choice never starts a portable download.
- Required preparation is confirmed before transfer.
- The first accepted prompt persists the ready model on the new session and immutable turn at revision zero.
- Initial assignment writes no model boundary.

## Confirmation and activation

Confirmation and activation are separate durable steps:

1. Under repository coordination, verify idle state, increment `modelRequestRevision`, and persist a `PendingModelRequest` while active model remains unchanged.
2. Prepare/readiness-check the target and create candidate context outside a long session-generation lock, tagged with epoch/request/history identity.
3. On completion, atomically verify the request is still latest, the session is not deleted/cleared, history is still compatible, and no turn is nonterminal.
4. Update active key/revision, scope context, increment history revision, clear the request, and insert one boundary in one transaction.
5. Publish through existing repository subscriptions; every page destroys stale retained sessions and adopts the durable winner.

A failed, cancelled, superseded, abandoned, same-model, or stale request creates no boundary and cannot change the active model. A newer failed request does not revive an older pending request.

## Latest-confirmed-wins

The confirmation transaction's monotonic revision is the only order. Modal click time, wall clock, progress, readiness time, and worker completion order have no authority.

If A confirms a slow model and B confirms a different model later:

- B owns the higher revision immediately.
- A may finish downloading/caching public assets, but its candidate activation is rejected and destroyed.
- Only an activation that still owns the highest request revision can write a boundary.

## Prompt race

Prompt acceptance and selection confirmation are mutually exclusive repository transactions:

- accepted prompt first: the switch fails `chat_busy`;
- pending request first: acceptance fails `model_change_in_progress` and preserves the draft.

Each accepted turn captures model key/revision/runtime identity. Queue claim and checkpoints validate the captured attempt. Selection, fallback, readiness, and removal never call submit/retry or replay an accepted prompt.

## Boundary rendering

- One successful model change creates one `ModelBoundary` after the latest terminal turn.
- The boundary names the new actual model and execution method.
- Multiple boundaries at one transcript position sort by selection revision.
- Boundaries survive reopen, deletion behavior follows their session, and temporary mode marks them not saved.
- Individual assistant responses display no model label.
- Boundaries never enter prompts, summaries, titles, or model measurements.

## Reopen and removal

- If the stored active model is ready, restore it with no boundary or readiness prompt.
- If it is externally unavailable and an already-ready replacement exists, perform one expected-revision CAS to the ranked strongest replacement and append one `reopen_fallback` boundary.
- If only downloadable/preparable replacements exist, keep the prior selection unavailable and require preparation confirmation; start no transfer and append no boundary.
- If the visitor intentionally removed the active model, `requiresExplicitReplacement` suppresses reopen fallback until another model is confirmed. This specific rule controls over the general unavailable-model reopen behavior.
- A losing reopen race adopts the winner and does not chain another automatic fallback during that activation cycle.

## Downgrade context

After confirmation and target readiness:

1. If the source model remains usable, make one compaction attempt with the source model. Hold the result as a candidate.
2. Render and tokenize target prompts with the target model's exact chat template.
3. Reserve required system/personality/current-prompt/output capacity.
4. Include an eligible summary if it fits, then newest complete historical turns that fit.
5. If compaction fails or does not fit, silently use newest complete historical turns only.
6. Never split a turn, truncate the current prompt, rewrite visible history, or include media/boundaries.
7. If required content alone cannot fit, reject the next send with a concise context action.

The confirmation copy says only that switching to a less capable model may reduce answer quality and conversation memory. No separate compaction failure notice is shown for this approved downgrade path.

## No-lock correctness

Web Locks coordinate work where present, but IndexedDB CAS is authoritative. Durable owner/attempt identities prevent another page from checkpointing or terminalizing live work. Opening a second page never blanket-interrupts queued media turns. Explicit takeover terminalizes the old attempt before creating a new retry; stale worker writes then fail identity checks. No liveness or inference timeout performs automatic takeover.

## Test contract

Required deterministic cases include:

- two-window slow A then later B confirmation;
- simultaneous ready-model confirmations;
- newer failure with older preparation still running;
- confirmation during queued/streaming work;
- prompt-acceptance/confirmation race;
- owner loss, stale progress, clear/delete during preparation;
- ready/unavailable/downloadable/removed reopen cases;
- one-boundary uniqueness and no response badges;
- successful/failed downgrade context with whole-turn trimming;
- media UI persistence with zero portable reconstruction media/labels;
- no automatic replay after failure, fallback, switch, or removal.
