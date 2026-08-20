# Contract: Assistant Workspace

**Surface**: `GET /assistant`  
**Runtime**: Next.js route shell plus a client-side assistant workspace  
**Network contract**: No assistant API request exists; prompt, response, title, personality, and summary content must not be placed in requests or URLs

## Route and Discovery

- `/assistant` is the canonical, directly shareable URL and has dedicated title and description metadata.
- The shared portfolio navigation includes an `Assistant` destination. The existing sitemap derives the route from that same navigation source.
- The assistant route uses the global theme provider but not the portfolio `SiteShell`, header, or footer. Its full viewport is the product surface.
- A persistent, clearly named link returns to the portfolio. Browser Back behavior is not intercepted.
- Server-rendered markup provides the shell and disclosure skeleton without claiming support before client detection completes.

## Permanent Disclosure

The workspace keeps a compact notice visible in every environment and session state. It communicates all four facts without requiring a dialog:

1. AI responses are generated locally on this device.
2. The assistant has no tools or live web access.
3. Answers may be wrong or outdated.
4. Important results should be double-checked.

The history area also says that saved chats are best-effort browser data, may be removed by site-data controls or storage pressure, and are normally temporary in private browsing. In temporary mode the permanent warning changes to **Not saved** and explicitly says this visit's chat will disappear after close or reload.

## Responsive Information Architecture

### Wide workspace

- **Session rail**: product identity, New chat, recency-ordered sessions, per-session delete, history disclosure, and portfolio return.
- **Conversation header**: current title, context meter/details, settings, and compact activity state.
- **Transcript**: chronological turns, partial/terminal response states, response copy actions, and a scroll-to-latest affordance when follow mode is paused.
- **Composer zone**: multi-line input, Send or Stop, queued state, actionable failure, and the permanent disclosure.

The session rail has a bounded width; transcript content owns the flexible column. Code blocks scroll within their message and never force page-level horizontal scrolling.

### Narrow workspace

- The session rail becomes a Headless UI dialog/drawer opened from the conversation header.
- Context details and settings use focus-managed dialogs or sheets.
- Composer controls remain reachable above the viewport bottom and safe area.
- Unsupported narrow devices see the same shell, disclosure, requirements, Retry, and portfolio return—not a distorted desktop chat or simulated response.

## Environment States

Environment state is independent from storage and current work state.

| State | Required presentation | Primary action |
|-------|-----------------------|----------------|
| `checking` | Honest detection message and indeterminate progress; composer unavailable | None |
| `unsupported` | Reliably detected limitation, supported-environment requirements, preserved local-history statement, and no chat controls | Retry detection |
| `downloadable` | Consent card explaining substantial download/storage/memory/processing/time and unmetered-connection requirements | Prepare on this device |
| `downloading` | Indeterminate activity at zero, then normalized measured progress when emitted; never show bytes or an estimated completion time | Stop waiting |
| `preparing` | “Getting the model ready” with indeterminate progress after an actual download reaches one | Stop waiting |
| `ready` | Composer and session actions enabled subject to their own state | Send |
| `failed` | Plain-language mapped failure and applicable recovery | Retry, edit prompt, or browser help |

`Prepare on this device` calls model creation synchronously within that visitor activation. Monitor events are presented as download progress only when the availability captured before creation was `downloadable` or `downloading`; an already-available model may emit synthetic initialization progress and must keep the conversation interface visible with `Preparing your message…`. `Stop waiting` stops this page's wait and must not claim that Chrome's shared model download was cancelled. While Chrome reports a background download and no creation promise remains active, the workspace polls availability and rechecks when the page returns to the foreground so readiness appears without a manual Retry. Retry always re-runs authoritative availability; it does not assume that an earlier result remains true.

## Conversation Contract

### New chat and Send

- New chat selects an unsaved blank draft with focused composer. It does not create empty history or consume the 100-session limit.
- At 100 saved sessions, New chat is blocked immediately with a clear explanation and direct access to session deletion. `acceptPrompt` repeats the cap check transactionally so another window cannot create a 101st session. Existing data is never evicted.
- Send accepts non-empty multi-line text, gives visible acknowledgment within one second, persists one queued turn, clears the composer only after acceptance, and starts queue processing.
- Repeated activation for the same pending composer submission is deduplicated. A deliberate later submission creates a distinct turn.
- When another window is generating for the session, the accepted prompt renders as queued. The interface does not imply that two generations are active.
- Session titles are deterministic from the first prompt and can duplicate; date/recency and stable selection keep them distinguishable.

### Generation

- A pending assistant message appears beside its originating prompt immediately after acceptance.
- Before first content, status distinguishes waiting for the session, checking context, compacting, and generating.
- Incremental text replaces the pending placeholder as chunks arrive. The streamed token container is not itself a live region.
- A separate, throttled `role="status"` announces meaningful transitions: queued, generating, response started, stopped, complete, failed. It does not announce every chunk.
- Stop aborts the active response for this session. Already received text remains, and the assistant message is terminally labelled Stopped. Stop on a queued prompt removes it from future generation by terminalizing it as interrupted.
- Natural completion and Stop racing are idempotent: the first terminal commit wins and the interface renders the stored result.
- Failed and empty responses remain attached to the prompt, state why no complete answer exists, and offer only applicable retry/edit/new-chat actions.

### Transcript behavior

- Turn order is `(promptCreatedAt, turnId)` and user precedes assistant within each turn. Cross-window snapshots never duplicate a stable ID.
- The selected chat may retain one live model session across successful turns. Reuse is allowed only while its persisted history revision, compacted-context identity, fixed prompt version, and personality revision still match. Otherwise it is reconstructed only from fixed guidance, the current personality, a valid optional summary, and eligible completed turns. Failed or interrupted assistant output remains visible but is not represented as a completed answer.
- Auto-follow continues only while the visitor is near the transcript end. Scrolling upward pauses it and exposes a keyboard-operable Jump to latest action; incoming chunks never steal the viewport.
- Switching session aborts this window's active runtime object but does not discard persisted content. The newly active session is reconstructed before its next turn.

## Message Rendering Contract

- `react-markdown` and `remark-gfm` support paragraphs, headings, lists, tables, quotations, links, emphasis, inline code, and fenced code blocks.
- Raw HTML is disabled. Images and resource-loading elements are not rendered. No response content reaches `dangerouslySetInnerHTML`.
- Safe text links require explicit activation, and external targets use `rel="noopener noreferrer"`. Unsupported or unsafe URL schemes render as text.
- Long prose wraps; tables and code blocks receive labelled local overflow containers. Reduced motion removes decorative transitions without hiding state.
- Copy response copies the source Markdown text for that assistant message, then announces success or failure accessibly. It never invokes the system share sheet.

## Session and Data Actions

| Action | Contract |
|--------|----------|
| Switch session | Persist current coherent state, destroy this window's retained or active model, set the selected stable ID, and render the repository snapshot |
| Delete session | Require a dialog naming the session; on commit remove only that session's turns/messages/context, retain personality, select the next recent session or blank draft, and restore focus to a predictable session action |
| Clear all | Require destructive confirmation describing sessions and personality; on verified commit show a blank draft and blank personality; on failure explicitly state that persistent deletion was not verified |
| Save personality | Show Unicode code-point count; accept blank through 1,000; block over-limit save without replacing the prior value; announce success within one second |
| Retry failed turn | Create a new queued turn that refers visually to the same visitor intent; never mutate the terminal turn |

Destructive actions abort relevant local model work before attempting persistence. A stale generation cannot recreate a deleted session because repository writes verify epoch and tombstones.

## Context Interface

- Once the local model is ready and the chat has at least one turn, the conversation header provides a compact visual meter and equivalent text: `Context unknown`, `Context used`, `Nearing context limit`, `Compacted`, or `Context overflowed`. Before the first turn, or before the model is ready, the context control is omitted because no conversation context is expected yet.
- Known percentage is derived from paired browser measurements. It is not estimated from character count.
- At 75% or more, a persistent warning explains that older detail may soon be condensed but does not block the current turn.
- At a projected 80% or more, the accepted turn replaces the composer with `Making room for this conversation…`, `Your message will start automatically.`, and `Cancel` before generation. Visible transcript messages do not move or disappear.
- Compact now is available only when at least one older completed turn can be summarized while retaining recent turns.
- The context dialog leads with only the measured percentage or unavailable state, the immediate consequence, the invariant that visible chat history is unchanged, and any available action. Prompt layers, turn ranges, and timestamps are not primary interface content.
- When a generated summary exists, it is available behind a `See condensed summary` disclosure, clearly labelled as AI-generated and visually contained so long output cannot dominate the dialog or be mistaken for the original transcript.
- Failed compaction restores the prior committed state, says generation did not proceed with verified full context, and offers retry, a smaller prompt, or New chat.
- A browser `contextoverflow` event changes state to overflowed immediately and blocks the next turn until a compacted rebuild succeeds.

## Settings Contract

- Settings opens with the globally stored personality preference, blank by default.
- Explanatory text frames the field as style/preferences, not a system-prompt escape hatch.
- The save flow appends personality content inside explicit untrusted delimiters after the fixed guidance. It cannot remove disclosures or authorize tools, live data, private data, or actions.
- A change affects only later model input in every session. It never changes earlier messages or silently rewrites a summary; reconstruction records the revision it used.
- Clear field saves a valid blank preference. Clear all deletes the setting and restores revision-zero behavior.

## Accessibility and Interaction Guarantees

- Every primary action is a semantic button or link with a visible focus style and non-color state label.
- Dialogs trap focus only while open, close with Escape when safe, have labelled titles/descriptions, and restore focus to the invoking or next relevant control.
- Composer has a persistent label. `Enter` sends only according to the documented desktop shortcut; `Shift+Enter` always inserts a line break, and an explicit Send button remains available.
- Busy state uses `aria-busy` on the relevant conversation region, not the entire page.
- Errors use an alert only when immediate attention is required; ordinary lifecycle changes use the throttled status region.
- Progress has a text label and value when determinate. Spinner animation is never the sole signal.
- Automated axe checks are necessary but not sufficient: release validation includes keyboard-only, focus restoration, zoom/reflow, reduced-motion, and screen-reader status spot checks.

## Privacy and Network Acceptance

For assistant interactions, browser-network inspection must show no request caused by prompt text, generated Markdown, session/title changes, personality saves, context summaries, availability checks, or local model generation. Existing site assets may load normally, but model content must not be interpolated into their paths, query strings, analytics, errors, or telemetry.
