# Phase 0 Research: On-Device AI Assistant

**Feature**: `001-on-device-ai-assistant`  
**Research date**: 2026-08-20  
**Status**: Complete — no unresolved technical clarifications

## 1. Browser AI Surface

**Decision**: Target the stable website Prompt API in Chrome 148+ through the global `LanguageModel` object. Use a single English text options object for both availability checks and session creation, and add `@types/dom-chromium-ai` as a development dependency. Detect support from the exposed global and secure-context state rather than user-agent, operating-system, or hardware heuristics.

**Rationale**: Chrome 148 is the first stable website release. The API is exposed only on `Window` in secure contexts, and `LanguageModel.availability()` is the authoritative eligibility signal. Chrome explicitly recommends the DefinitelyTyped package because this single-engine draft API is not part of TypeScript's default DOM library. One adapter containing every browser-AI call limits churn from the Community Group draft.

**Alternatives considered**:

- The obsolete `window.ai.languageModel` prototype was rejected because it is not the shipped surface.
- Browser or hardware sniffing was rejected because Chrome intentionally withholds some unavailability reasons and requirements can change.
- WebLLM, a Prompt API polyfill, and cloud inference were rejected because the approved scope has one browser-provided local-inference path and no fallback runtime.

**Primary sources**: [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api), [Chrome built-in AI requirements](https://developer.chrome.com/docs/ai/get-started), [Prompt API draft](https://webmachinelearning.github.io/prompt-api/), [DefinitelyTyped declarations](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/dom-chromium-ai/index.d.ts)

## 2. Availability and Model Preparation

**Decision**: Model the reported availability values `unavailable`, `downloadable`, `downloading`, and `available`, plus application states for checking, finalizing, ready, and failure. For any state that can require a download, invoke `LanguageModel.create()` directly from the visitor's activation handler and attach a normalized `downloadprogress` monitor. Treat progress reaching 100% as “download complete, preparing model” until creation actually resolves.

**Rationale**: A model download needs transient user activation. Awaiting unrelated work before `create()` risks `NotAllowedError`. Chrome's progress is normalized and may be privacy-masked, so byte counts and completion-time estimates would be false precision. Aborting creation stops the application's wait but may not stop Chrome's underlying download; UI copy must say “Stop waiting” rather than promising “Cancel download.”

**Alternatives considered**:

- Automatic first-time download on route entry was rejected because it conflicts with the activation requirement and the specification's consent step.
- A single generic loading spinner was rejected because download, finalization, and generation have different recovery actions.

**Primary sources**: [Chrome model-download UX](https://developer.chrome.com/docs/ai/inform-users-of-model-download), [shared model creation algorithm](https://webmachinelearning.github.io/writing-assistance-apis/#create-an-ai-model-object)

## 3. Model Session and Streaming Boundary

**Decision**: Define a feature-local model adapter with availability, prepare/create, reconstruct, stream, context measurement, and destroy operations. Prefer `promptStreaming()` with an `AbortController`, map known `DOMException.name` values to stable application errors, and destroy a live model session whenever its conversation is switched, deleted, rebuilt, or abandoned.

**Rationale**: The adapter makes the experimental global replaceable by deterministic fakes in tests without adding a second production runtime. Streaming provides useful activity feedback. Explicit destruction releases browser-managed resources and prevents stale sessions from continuing after storage or context state changes.

**Alternatives considered**:

- Direct `LanguageModel` calls throughout components were rejected because they couple UI, lifecycle, and draft API details.
- A permanently live model object for every saved session was rejected because browser-managed model sessions consume resources and cannot be serialized.
- Vercel AI SDK and server routes were rejected because generation is local and no server transport is required.

**Primary sources**: [Chrome prompting and cancellation](https://developer.chrome.com/docs/ai/prompt-api#prompt-the-model), [Chrome session management](https://developer.chrome.com/docs/ai/session-management)

## 4. Transcript Restoration and Context Compaction

**Decision**: Keep the full transcript in browser storage and treat the live model session as disposable. Reconstruct the active session with `initialPrompts`: fixed system guidance first, then an optional compacted summary and the most recent complete turns. Use `measureContextUsage()` before a turn, `contextUsage/contextWindow` after generation, and the `contextoverflow` event for visible context state. Warn at 75%; before a turn would exceed 80%, acquire the session generation lock, summarize older turns with a short-lived separate `LanguageModel` session, create and validate a replacement chat session, then atomically commit the summary. Keep at least the four most recent complete turns when they fit.

**Rationale**: Chrome can evict old prompt/response pairs before throwing quota errors, so waiting for `QuotaExceededError` would make context loss silent. A separate compaction session does not contaminate the chat transcript. Committing only after replacement-session creation succeeds prevents a failed summary from destroying usable context. The visible transcript never changes; only the model's active representation does.

**Alternatives considered**:

- Error-only compaction was rejected because automatic pair eviction can happen first.
- Summarizing inside the already-full chat session was rejected because it consumes and mutates the context being repaired.
- The separate Summarizer API was considered but rejected for the first layer because it introduces a second browser-AI capability and availability contract; one shipped Prompt API adapter is simpler.
- Persisting native model sessions was rejected because the browser exposes no serialization contract.

**Primary sources**: [Chrome session compaction](https://developer.chrome.com/docs/ai/session-compacting), [Chrome Prompt API context guidance](https://developer.chrome.com/docs/ai/prompt-api), [built-in AI do and don't guidance](https://developer.chrome.com/docs/ai/built-in-ai-dos-donts)

## 5. Browser-Local Persistence

**Decision**: Use Dexie 4 over one IndexedDB database at schema version 1. Store operational metadata, sessions, turns, messages, context states, global settings, and deletion tombstones in separate typed stores. Use Dexie transactions for every multi-store mutation and `liveQuery()` as the cross-window invalidation source. Add one feature-local subscription hook that can consume either Dexie live queries or the temporary in-memory repository; do not require `dexie-react-hooks`.

**Rationale**: Dexie supplies typed schema declarations, atomic transactions, upgrade handling, explicit errors, and cross-context mutation observation. The feature's required in-memory mode needs the same repository/subscription contract, so a small adapter around core `liveQuery()` avoids coupling React directly to only the durable implementation. Only fields used for lookups or ordering are indexed; assistant content is never indexed.

**Alternatives considered**:

- Native IndexedDB was rejected because request/event plumbing, transactions, version changes, and cross-window subscriptions would add substantial custom code.
- `idb` was rejected because it wraps promises well but still leaves reactive cross-window invalidation and subscription plumbing to the application.
- Dexie Cloud, CRDT libraries, `dexie-observable`, and `dexie-syncable` were rejected because cloud sync is out of scope and the older addons are legacy.
- `dexie-react-hooks` was rejected because the feature must switch to a page-lifetime memory repository behind the same UI contract.

**Primary sources**: [Dexie React/live-query behavior](https://dexie.org/docs/Tutorial/React), [Dexie transactions](https://dexie.org/docs/Dexie/Dexie.transaction%28%29), [IndexedDB specification](https://www.w3.org/TR/IndexedDB/)

## 6. Cross-Window Turn Ordering

**Decision**: Persist every submitted prompt as a `queued` turn with stable session, turn, and message UUIDs. Acquire one exclusive Web Lock named for the session before local inference. After acquiring it, re-read the queue and process the earliest turn by `(promptCreatedAt, turnId)`. Keep the user prompt and response attached by `turnId`; terminal turns are immutable. Dexie remains authoritative and every window re-reads it after mutation notifications.

**Rationale**: This reconciles the requirement for one active generation per session with automatic multi-window merging. Two windows can submit without data loss, but only one model generates at a time. The next generator rebuilds from the latest completed transcript, so queued work does not use stale context. Stable identities make retries idempotent and prevent duplicate rendering.

**Alternatives considered**:

- Last-write-wins was rejected by the clarified data-integrity requirement.
- Concurrent generation in separate windows was rejected because it violates the one-generation rule and produces divergent model context.
- A permanent writer window was rejected because the user explicitly chose automatic merging rather than takeover.
- BroadcastChannel content replication was rejected because notifications are ephemeral; no prompt or response content should be broadcast, and IndexedDB is already the durable source of truth.

**Primary sources**: [Web Locks specification](https://w3c.github.io/web-locks/), [Dexie cross-window mutation propagation](https://dexie.org/docs/Dexie/Dexie.on.storagemutated), [Broadcast Channel limitations](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)

## 7. Deletion, Clear-All, and Async Race Integrity

**Decision**: Maintain a dataset epoch in a non-content metadata record. Every async write captures and verifies that epoch inside its transaction. Individual deletion creates a session tombstone before removing related records; writes also verify absence of the tombstone. Clear all increments the epoch and atomically clears all user-data stores, tombstones, settings, and active-session state. Pending model operations are aborted, and stale completions fail their epoch or tombstone guard.

**Rationale**: A model response can finish after another window deletes its session or clears all data. Epoch and tombstone guards prevent that stale result from resurrecting content. Deleting the entire IndexedDB database was avoided because open windows can block it; transactional clearing provides a verifiable completion boundary.

**Alternatives considered**:

- UI-only cancellation was rejected because a stale tab can miss or delay a notification.
- Database deletion for Clear all was rejected because it can remain blocked by open connections.
- Tombstones without an epoch were rejected because Clear all would need to retain unbounded deletion history.

**Primary sources**: [IndexedDB transactions](https://www.w3.org/TR/IndexedDB/), [Dexie blocked upgrades](https://dexie.org/docs/Dexie/Dexie.on.blocked)

## 8. Storage Durability and Temporary Mode

**Decision**: Use one repository interface with Dexie-backed and page-lifetime in-memory implementations. Initial open/read failure enters temporary mode. A required commit failure snapshots recoverable current state into memory, shows the persistent “Not saved” warning, and remains temporary until reload to avoid split-brain history. After the first successful durable save, request persistent storage at most once; denial is nonfatal and never changes the best-effort disclosure.

**Rationale**: Browser storage is removable and private-browsing data is temporary. The requested temporary mode preserves the core demonstration while staying honest. A reload is a clean retry boundary. A one-time persistence request reduces eviction risk without claiming durability or affecting Chrome's separately managed AI model.

**Alternatives considered**:

- Blocking chat on storage failure was rejected by clarification.
- Automatically returning from memory to IndexedDB during the same visit was rejected because two histories could diverge.
- Detecting private browsing was rejected because browsers intentionally do not expose a reliable signal.

**Primary sources**: [Storage Standard](https://storage.spec.whatwg.org/), [storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [persistent-storage guidance](https://web.dev/articles/persistent-storage)

## 9. Route and Feature Boundaries

**Decision**: Publish the direct route at `/assistant`. Its server route owns metadata; a route-specific layout reuses `Providers` for theme behavior but intentionally omits `SiteShell`, `Header`, and `Footer` to create the takeover. Add `Assistant` to shared navigation for discovery and sitemap inclusion. Put all interactive work under `src/features/assistant/`; only the route composition stays under `src/app/assistant/`.

**Rationale**: `/assistant` is self-describing and shareable. The root layout does not impose the portfolio shell, while `SiteShell` always adds the existing header/footer. A feature directory keeps model, persistence, context, and UI concerns separate without introducing another application or global state framework.

**Alternatives considered**:

- `/ai` was shorter but less descriptive.
- Nesting inside the tilde portfolio layout was rejected because it cannot provide a true takeover.
- A modal over the homepage was rejected because it weakens the stable URL and session-restoration boundary.

**Local evidence**: `src/app/layout.tsx`, `src/components/SiteShell.tsx`, `src/components/Layout.tsx`, `src/app/providers.tsx`, `src/lib/navigation.ts`, `src/app/sitemap.ts`

## 10. Response Rendering and Content Safety

**Decision**: Add `react-markdown` with `remark-gfm`, do not enable raw HTML, disallow images and other auto-fetching content, and map supported elements to feature-styled components. Permit safe text links only through the library's URL transform; external links open after an explicit visitor action with safe relationship attributes. Implement response copying locally with `navigator.clipboard` and an accessible success/failure status.

**Rationale**: The transcript must render headings, lists, links, quotations, inline code, and code blocks. `react-markdown` parses to React elements without `dangerouslySetInnerHTML` and is safe by default. Disabling images prevents generated Markdown from making an automatic third-party request, preserving the no-content-egress contract.

**Alternatives considered**:

- Handwritten Markdown parsing was rejected as unreliable and unsafe.
- Raw HTML and `rehype-raw` were rejected because model output is untrusted.
- Reusing `CopyToClipboard` was rejected because it selects sharing on some devices and suppresses a TypeScript error instead of guaranteeing copy behavior.
- Syntax-highlighting packages were deferred; styled plain code blocks satisfy the current requirement with less weight.

**Primary sources**: [`react-markdown` security and features](https://github.com/remarkjs/react-markdown/blob/main/readme.md), [`remark-gfm`](https://github.com/remarkjs/remark-gfm)

## 11. Client State and Accessibility

**Decision**: Use React `useReducer` plus focused hooks for three orthogonal state groups: model availability/preparation, generation/context work, and storage mode. Use Headless UI for dialogs and narrow-screen navigation. Announce lifecycle transitions through a throttled status region rather than placing the token stream itself in a live region. Auto-scroll only while the visitor remains near the transcript end, and respect reduced motion.

**Rationale**: Discriminated state contracts prevent impossible UI combinations without a new state-machine dependency. Separating availability, work, and storage allows states such as “ready + queued + not saved” to remain understandable. Throttled announcements avoid reading every streamed token to screen-reader users.

**Alternatives considered**:

- XState and a global store were rejected because the route owns all state and React primitives are sufficient.
- Toast-only feedback was rejected because essential activity and failures must remain present and accessible.
- Forced auto-scroll was rejected because it would pull visitors away from earlier content.

**Primary sources**: [Headless UI](https://headlessui.com/react/dialog), [WAI-ARIA live regions](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

## 12. Testing and Shipping Evidence

**Decision**: Add Vitest, jsdom, React Testing Library, user-event, and fake-indexeddb for pure, repository, and component tests. Add Playwright and `@axe-core/playwright` for production-build browser flows, multi-page convergence, responsive layout, keyboard/focus, and automated accessibility checks. Inject a fake `LanguageModel` before hydration for deterministic lifecycle tests. Keep the real-model timing, quality, preparation, overflow, and purge checks as a manual acceptance gate on the project owner's current supported Mac.

**Rationale**: The repository has only Node content tests today. A fake adapter is the only reliable way to cover all model states in automation, while IndexedDB/Web Locks need real Chromium coverage. The specification explicitly limits shipping claims to one real Mac, so automated fakes cannot substitute for that evidence.

**Alternatives considered**:

- Content tests alone were rejected because they cannot exercise browser state or interaction.
- Unit tests without a real-browser layer were rejected because cross-window storage and locks have browser semantics.
- Running the real model in CI was rejected because model availability, download, and hardware are not deterministic in ephemeral automation profiles.

**Primary sources**: [Vitest DOM environments](https://vitest.dev/guide/features), [Testing Library user-event](https://testing-library.com/docs/user-event/intro/), [`fake-indexeddb`](https://github.com/dumbmatter/fakeIndexedDB), [Playwright pages](https://playwright.dev/docs/pages), [Next.js testing guidance](https://nextjs.org/docs/app/guides/testing)

## Dependency Decision Summary

### Runtime additions

- `dexie` — typed, transactional browser persistence and live queries.
- `react-markdown` — safe React rendering of model Markdown.
- `remark-gfm` — tables, task lists, autolinks, and other expected chat formatting.

### Development additions

- `@types/dom-chromium-ai` — official recommended draft API declarations.
- `vitest`, `jsdom` — unit and component runner/environment.
- `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` — user-centered component testing.
- `fake-indexeddb` — IndexedDB integration tests outside a browser.
- `@playwright/test`, `@axe-core/playwright` — browser, cross-window, responsive, and accessibility validation.

### Explicit non-additions

- No cloud AI SDK, backend endpoint, alternate local model runtime, state-machine library, global store, CRDT, sanitizer for raw HTML, syntax highlighter, or analytics package.
