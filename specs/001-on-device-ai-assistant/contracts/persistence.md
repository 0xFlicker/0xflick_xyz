# Contract: Browser-Local Persistence and Concurrency

**Durable implementation**: Dexie 4 over IndexedDB  
**Temporary implementation**: Page-lifetime memory repository  
**Coordination**: Dexie live queries plus per-session Web Locks

## Repository Boundary

Interface and orchestration code depend on a feature-owned repository, not Dexie tables. The contract provides operations equivalent to:

```ts
interface AssistantRepository {
  mode(): "durable" | "temporary"
  initialize(): Promise<RepositorySnapshot>
  subscribeSessions(listener: (value: SessionListSnapshot) => void): Unsubscribe
  subscribeConversation(
    sessionId: SessionId,
    listener: (value: ConversationSnapshot | null) => void,
  ): Unsubscribe
  subscribeSettings(listener: (value: SettingsSnapshot) => void): Unsubscribe

  selectSession(sessionId: SessionId | null): Promise<MutationResult>
  acceptPrompt(input: AcceptPromptInput): Promise<AcceptedTurn>
  claimNextTurn(input: ClaimTurnInput): Promise<ClaimedTurn | null>
  checkpointResponse(input: ResponseCheckpoint): Promise<MutationResult>
  finishTurn(input: FinishTurnInput): Promise<MutationResult>
  commitContext(input: ContextCompareAndSwap): Promise<MutationResult>
  savePersonality(input: SavePersonalityInput): Promise<MutationResult>
  deleteSession(input: DeleteSessionInput): Promise<MutationResult>
  clearAll(input: ClearAllInput): Promise<MutationResult>
}
```

Inputs carry stable IDs, captured dataset epoch, and for generation writes a `generationAttemptId`. Mutation results discriminate success, expected conflict, validation failure, session limit, deleted/cleared state, and storage failure. Expected conflicts are handled idempotently; storage failures enter the explicit temporary-mode workflow.

## Database Ownership

- One database named `flick-assistant` owns only this feature's records.
- Schema version 1 is the sole supported schema. No compatibility store, dual write, legacy API import, or cloud-sync metadata is introduced.
- Dexie transactions contain every mutation that touches more than one record or store.
- Database content is never copied to application logs, development analytics, URLs, exception-reporting services, or BroadcastChannel messages.
- Store queries are bounded by stable session IDs and indexed ordering fields. The feature does not scan or index message text.

## Reactive Snapshots

- Core Dexie `liveQuery()` drives session and conversation snapshots in the durable repository, including mutations committed by other windows on the same origin.
- A small feature subscription adapter exposes the same external-store behavior for Dexie and memory repositories and cleans up on session switch/unmount.
- UI reconciliation is by stable record ID. New snapshots replace derived view state; they are not appended blindly.
- Each window keeps its current visible selection locally. `AppMeta.activeSessionId` is updated for next-load restoration but a selection change in another window does not forcibly navigate the current one.
- If the visible session is deleted elsewhere, the window selects the most recent remaining session or the blank draft and restores focus predictably.
- No prompt, response, personality, title, or summary is sent through BroadcastChannel. IndexedDB is the only durable cross-window source.

## Turn Submission and Locking

### Submission transaction

`acceptPrompt` atomically creates the turn, completed user message, pending assistant message, and—when submitting a blank draft—the saved session and title. It verifies:

- input is non-empty and not the same submission token already committed;
- current epoch matches the caller;
- target session exists and is not tombstoned;
- creating a session would not exceed 100.

After commit, all windows may render the queued turn exactly once.

### Generation lock

The window requests an exclusive Web Lock named `flick-assistant:session:<session-id>`. The name contains only the non-secret UUID. The lock is held for context preparation and model streaming, then released after terminal persistence or explicit failure. Web Locks support is part of the eligible runtime contract; the feature does not fall back to unsafe same-tab-only coordination.

After lock acquisition, the owner must:

1. Re-read the session and queue; never generate from the pre-lock snapshot.
2. If a turn remains `generating` but no live lock owner could still hold it, terminalize that orphan as `interrupted/owner_closed` with its last checkpoint.
3. Select the smallest `(promptCreatedAt, turnId)` queued pair.
4. Atomically transition it to `generating` with a unique attempt ID.
5. Reconstruct from the latest completed transcript and context state.
6. Generate and commit only while epoch, session, tombstone, status, and attempt ID remain valid.
7. Re-query the queue before releasing. It may process another turn with the now-current transcript, or release so another waiting window can acquire.

If a window submits while another holds the lock, its lock request waits and the UI says the turn is queued. An aborted waiting request leaves the persisted turn queued unless the visitor explicitly stops that queued turn.

## Deterministic Merge Rules

- Turn order is ascending `promptCreatedAt`, then ascending UUID string as tie-breaker.
- Each response remains attached through `turnId`; assistant completion time never changes transcript adjacency.
- Stable IDs make delivery at-least-observed but render exactly once.
- Terminal turn records are immutable. A stale writer receives `already_terminal` and adopts the stored value.
- A queue worker always rebuilds after the prior turn commits, so later turns see the latest eligible conversation context regardless of which window submitted them.
- Clocks can differ slightly across windows; the product contract intentionally defines captured prompt time plus UUID as the stable merge order and does not reorder terminal turns later.

## Streaming Persistence

- The user message and assistant placeholder commit before model work.
- The owner checkpoints the latest full assistant text at most every 500 ms and once at termination. Checkpoints never store individual token events.
- Each checkpoint transaction verifies current epoch, missing tombstone, `generating` status, and matching attempt ID.
- Stop and natural completion use a first-terminal-write-wins transaction. Later callbacks observe terminal state and cannot modify content.
- If the window closes, the last checkpoint remains. The next lock owner visibly marks it interrupted before processing another turn.
- If a required checkpoint or terminal write fails, abort the model stream, preserve the last coherent view in memory as interrupted, enter temporary mode, and do not continue a divergent durable generation.

## Deletion Integrity

### Individual session

In one transaction:

1. Validate the captured epoch and existing target.
2. Write its tombstone.
3. Delete context, messages, turns, then session.
4. Replace `activeSessionId` if necessary.

The initiating window aborts model work before the transaction. Other active or queued windows discover the tombstone on their next write or lock acquisition and terminate without recreation. Personality and other sessions are outside this delete scope.

### Clear all

The initiating window aborts local work, then one transaction:

1. Reads and increments `datasetEpoch`.
2. Clears session, turn, message, context, personality, and tombstone stores.
3. Clears `activeSessionId`.
4. Retains only non-content schema coordination and the one-time persistence-request marker.

All older async operations carry the previous epoch and fail before writing. Other windows receive live-query invalidation and return to a blank draft. Clear all is reported complete only after the durable transaction commits.

If deletion fails, the UI must not claim removal from persistent storage. It states that deletion could not be verified, exposes Retry, and links to browser site-data controls. Recoverable current-view content may continue in temporary mode, but this is a failure result rather than a successful clear.

## Temporary Mode

### Entry

Enter temporary mode when:

- database open or initial coherent read fails;
- IndexedDB is unavailable, externally removed, or becomes unreadable;
- quota or another required transaction failure prevents a verified durable commit.

Initial-read failure starts a blank temporary repository unless a coherent in-page snapshot already exists. Write failure copies the last coherent current-view records to memory, labels the failed mutation accurately, and aborts any durable generation before continuing.

### Behavior

- The persistent **Not saved** warning remains visible until page close/reload.
- All subsequent actions in this window use the memory repository only; the feature never dual-writes or silently switches back.
- The page can create, stream, stop, edit settings, delete, and clear its memory data, but explains that close/reload removes it.
- Cross-window convergence is not promised for temporary data. Each affected page is explicit about its mode.
- Reload is the only automatic attempt to reopen the durable repository.

This is a required product failure state, not a second inference implementation or backward-compatibility path.

## Best-Effort Durability

After the first successful durable user-data commit, the repository transactionally records `persistenceRequestedAt` before making a one-time best-effort `navigator.storage.persist()` request. Rejection or denial:

- does not fail the saved operation;
- does not trigger repeated prompts;
- does not change the browser-history disclosure;
- never implies the separately managed Chrome AI model is retained.

The product always says that local history may be removed by storage pressure or browser settings and is normally temporary in private browsing.

## Repository Error Codes

| Code | Meaning | Required response |
|------|---------|-------------------|
| `session_limit` | 100 saved sessions already exist | Block new saved session; open deletion action |
| `invalid_input` | Empty prompt, over-limit personality, or invalid record relation | Keep prior valid state and focus correction |
| `already_terminal` | Stop/completion or duplicate worker race already resolved | Adopt authoritative snapshot without alarm |
| `session_deleted` | Tombstone or missing target detected | Abort work and move to remaining/blank session |
| `dataset_cleared` | Caller epoch is stale | Abort work and reset to current blank/snapshot state |
| `revision_conflict` | Context changed during compaction | Discard candidate and rebuild/retry under lock |
| `storage_unavailable` | Open/read failed | Enter temporary mode |
| `storage_write_failed` | Required transaction did not commit | Abort affected work, enter temporary mode, disclose not saved |
| `deletion_unverified` | Delete/Clear all did not commit | Do not show success; offer retry and site-data controls |

Raw storage errors may be shown in development diagnostics without content but are not persisted or sent remotely.

## Concurrency Acceptance Cases

1. Two windows submit at the same instant: both turns appear once in identical deterministic order; only one is `generating`; both eventually attach one terminal response.
2. One window stops while another observes: the first terminal transaction wins and both converge to the same partial response/status.
3. One window deletes during another's stream: the tombstone/transaction removes records; the stale checkpoint fails and cannot resurrect them.
4. Clear all runs while multiple queues wait: epoch changes; every old claim fails; all windows show no saved sessions or personality.
5. The lock owner closes mid-stream: last checkpoint remains interrupted after the next owner acquires; the next queued turn is not answered against a fictitiously completed response.
6. Durable storage fails mid-stream: that page aborts durable work and becomes Not saved; no terminal durable record is fabricated.

