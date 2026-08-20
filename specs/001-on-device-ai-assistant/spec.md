# Feature Specification: On-Device AI Assistant

**Feature Branch**: `001-on-device-ai-assistant`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Create a world-class, browser-local AI assistant interface for supported Chrome desktop environments, with simple conversational turns, browser-saved sessions, personality settings, visible context control and compaction, and honest feedback during local inference."

## Clarifications

### Session 2026-08-20

- Q: If browser storage is unavailable or full, should visitors still be allowed to chat in a clearly marked temporary session that disappears after the page closes or reloads? → A: Allow temporary chat with a persistent “Not saved” warning.
- Q: If the same saved chat is open in two browser windows and both try to change it, which window should be allowed to write? → A: Automatically merge changes from every window into one transcript.
- Q: What should visitors see at the assistant URL when their browser or device cannot run the local model? → A: Show the same takeover shell with the limitation, requirements, Retry, and a route back to the portfolio instead of chat controls.
- Q: Should the shipped assistant record anonymous, non-content events such as opening the experience, model eligibility, preparation completion, first-turn completion, and failure category? → A: Collect no assistant-specific analytics; rely only on evaluator studies.
- Q: Which types of supported desktop must pass the ready-model response-time and answer-quality checks before the feature can ship? → A: Test only the project owner's current supported Mac.
- Q: Should the ready assistant retain Chrome's native session between turns? → A: Retain one native session for the selected chat when its persisted history, compacted context, and personality are unchanged; destroy and reconstruct it whenever those inputs become stale.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete a Helpful Local Conversation (Priority: P1)

An eligible portfolio visitor opens the dedicated assistant experience, understands that it runs locally with important limitations, sends a text prompt, watches the response arrive, and continues with a follow-up turn that uses the active conversation context.

**Why this priority**: A useful first conversation is the smallest end-to-end proof that the portfolio demonstrates AI product and interaction-design capability rather than merely describing it.

**Independent Test**: On a supported desktop where the on-device model is ready, a visitor can open the assistant, submit two related prompts, receive understandable responses, stop an in-progress response, and start a fresh chat without using any session-management or settings features.

**Acceptance Scenarios**:

1. **Given** the visitor's environment is supported and the model is ready, **When** the visitor opens the assistant's dedicated URL, **Then** the conversation interface is immediately available with a clear local-AI and double-check-results notice.
2. **Given** an empty conversation, **When** the visitor submits a non-empty prompt, **Then** the interface shows generation activity promptly, presents output as it becomes available, and preserves the completed user and assistant messages in order.
3. **Given** a completed first exchange, **When** the visitor asks a follow-up that depends on that exchange, **Then** the assistant responds using the active conversation context.
4. **Given** a response is being generated, **When** the visitor chooses Stop, **Then** generation stops, any received text remains visible as an interrupted response, and the visitor can send another prompt.
5. **Given** a conversation contains messages, **When** the visitor starts a new chat, **Then** a separate empty conversation opens and the prior conversation remains available in local history.
6. **Given** a ready selected chat completes one turn without interruption, **When** the visitor submits a follow-up before its persisted context changes elsewhere, **Then** the assistant reuses that chat's ready local model session without presenting model-download activity again.

---

### User Story 2 - Understand Preparation, Availability, and Failure (Priority: P2)

A visitor encounters any supported lifecycle state—checking, preparation required, downloading, preparing, ready, generating, interrupted, or failed—and always understands what is happening, whether waiting is useful, and what action is available. An ineligible visitor receives an honest explanation instead of a broken or misleading chat surface.

**Why this priority**: Local inference can require a large first-time preparation and can change availability independently of the site. Trustworthy lifecycle feedback is essential to the demonstration.

**Independent Test**: Simulate each defined lifecycle and failure state and verify that the experience names the state, provides the correct progress or recovery action, preserves entered text where recovery is possible, and never offers hosted inference as a fallback.

**Acceptance Scenarios**:

1. **Given** the environment can prepare the on-device model but it is not ready, **When** the visitor activates the assistant, **Then** the experience explains the local preparation, expected resource requirements, and that preparation begins only after the visitor confirms.
2. **Given** preparation is in progress, **When** measurable progress changes, **Then** the experience reports that progress; after measured download completes but readiness is still pending, it switches to an honest indeterminate finalization state.
3. **Given** the environment cannot provide the required local model, **When** the visitor opens the assistant URL, **Then** the same takeover shell replaces chat controls with the reliably detected limitation, relevant requirements, Retry, and a route back to the portfolio.
4. **Given** a model that was previously ready has become unavailable, **When** the visitor returns, **Then** saved sessions remain intact and the experience offers local preparation again without implying that conversation content was lost.
5. **Given** preparation or generation fails, **When** the failure is shown, **Then** the visitor receives a plain-language explanation, an appropriate retry or recovery action, and no false claim that the request completed.

---

### User Story 3 - Return to and Manage Local Chats (Priority: P3)

A returning visitor can continue locally saved conversations, distinguish them by concise titles and recency, delete individual conversations, and remove all assistant data from the browser.

**Why this priority**: Session continuity makes the experience feel like a considered assistant workspace while explicit deletion and storage limits preserve user control and trust.

**Independent Test**: Create several chats, reload the experience, reopen each chat, delete one, clear all data, and verify the selected chat, ordering, content, and settings behave as specified without an account or network service.

**Acceptance Scenarios**:

1. **Given** locally saved sessions exist, **When** the visitor returns to the assistant, **Then** the most recently active session opens and all sessions are ordered by recent activity.
2. **Given** a new session receives its first prompt, **When** it appears in history, **Then** it has a concise title derived from that prompt without requiring another model response.
3. **Given** the visitor chooses to delete one session and confirms, **When** deletion completes, **Then** that session and its context summary are removed while other sessions and settings remain.
4. **Given** the visitor chooses Clear all and confirms the destructive action, **When** clearing completes, **Then** all sessions, messages, context summaries, and personality settings are removed and a blank new session is shown.
5. **Given** 100 sessions already exist, **When** the visitor tries to create another, **Then** the experience explains the limit and asks the visitor to delete a session rather than silently evicting data.
6. **Given** the same session is open in multiple windows, **When** completed turns are added from more than one window, **Then** every turn appears exactly once in a shared deterministic order, each response remains attached to its prompt, and no completed turn is overwritten.

---

### User Story 4 - See and Control Conversation Context (Priority: P4)

A visitor can see how much of the current model context is occupied, understand when older detail has been condensed, inspect what is active versus summarized, and request compaction before reaching the limit.

**Why this priority**: Visible context behavior demonstrates mature AI product judgment and prevents silent loss of conversational continuity.

**Independent Test**: Grow a conversation across the normal, warning, and compaction thresholds; compact manually and automatically; reload the session; and verify that the transcript remains intact, context state remains understandable, and follow-up prompts preserve evaluated facts.

**Acceptance Scenarios**:

1. **Given** a live conversation, **When** context usage changes, **Then** the interface presents a compact visual measure and a text equivalent showing normal, nearing limit, or compacted state.
2. **Given** context reaches 75% of available capacity, **When** the visitor continues the conversation, **Then** the experience warns that compaction is approaching without blocking the next turn.
3. **Given** the next turn would take context beyond 80% of capacity, **When** the turn is submitted, **Then** older exchanges are condensed before generation while the most recent complete exchanges and governing instructions are retained whenever they fit.
4. **Given** a conversation has enough history to compact, **When** the visitor chooses Compact now, **Then** the experience condenses older active context, shows what changed, and leaves the visible transcript unchanged.
5. **Given** compaction fails or the available context cannot fit the next prompt, **When** the failure is detected, **Then** no transcript is deleted, the visitor is told that generation did not proceed with full context, and the experience offers retry, manual compaction where possible, or a new chat.

---

### User Story 5 - Set a Persistent Personality Preference (Priority: P5)

A visitor can add optional global instructions that shape subsequent answers, see the size limit before saving, change or clear the instructions later, and understand that the preference cannot remove the assistant's accuracy and transparency boundaries.

**Why this priority**: Personality control demonstrates prompt composition and customization, but the core assistant remains useful when the setting is blank.

**Independent Test**: Save, edit, exceed, and clear the personality preference; send controlled prompts before and after each change; reload the experience; and verify persistence, limits, scope, and unchanged safety notices.

**Acceptance Scenarios**:

1. **Given** the visitor has never changed personality settings, **When** settings open, **Then** the personality field is blank and its 1,000-character limit is visible.
2. **Given** a valid personality preference, **When** the visitor saves it, **Then** it persists locally and influences subsequent turns in every session without rewriting existing messages.
3. **Given** the preference exceeds 1,000 characters, **When** the visitor attempts to save, **Then** saving is blocked with an inline explanation and the prior saved value remains unchanged.
4. **Given** a saved preference, **When** the visitor clears and saves it, **Then** subsequent turns use only the assistant's default guidance.

### Edge Cases

- The assistant URL is opened in a non-Chrome browser, a mobile browser, an insecure environment, private browsing, or an otherwise ineligible device.
- Browser support exists but model availability cannot be determined or the browser reports no actionable reason for unavailability.
- The first model preparation has no measurable total, stalls, finishes downloading but remains in finalization, loses connectivity, runs out of storage, or is canceled by navigation.
- The model is removed, updated, or becomes ineligible between page load and session creation, or during a response.
- The visitor submits an empty prompt, whitespace-only text, a prompt larger than the available context, repeated rapid submissions, or a prompt while another response is active.
- Streaming produces no initial text for an extended period, returns partial output before failure, or completes with an empty response.
- The visitor stops a response at the same moment it completes or navigates to another session while generation is active.
- The browser tab is refreshed, closed, duplicated, or opened in two windows while a turn or local-data mutation is in progress.
- Local storage is unavailable, full, evicted, externally cleared, or contains a session that cannot be read safely.
- A generated session title is empty, extremely long, or duplicates another title.
- The active session is deleted, the final remaining session is deleted, or Clear all is dismissed rather than confirmed.
- Context capacity changes after a model update, usage crosses a threshold during generation, automatic overflow happens earlier than expected, or compaction itself would exceed the available context.
- A compaction summary omits or distorts a fact that a later evaluated prompt depends on.
- Personality text attempts to contradict the always-visible disclaimer or the assistant's fixed transparency boundaries.
- Long prompts, responses, URLs, code blocks, unbroken strings, and assistive-technology announcements must not break layout, focus, or transcript navigation.

## Requirements *(mandatory)*

### Functional Requirements

#### Entry, Eligibility, and Trust

- **FR-001**: The product MUST provide a stable, directly shareable URL for the assistant and a discoverable entry point from the portfolio.
- **FR-002**: The product MUST present the assistant as a dedicated takeover experience while retaining a clear way back to the portfolio.
- **FR-003**: The product MUST determine whether the current environment can provide the required browser-local model before enabling conversation input.
- **FR-004**: The product MUST distinguish checking, preparation available, actual download in progress, model initialization, ready, generating, stopped, context-limited, and failed states whenever those distinctions are reliably available; ordinary ready-model initialization MUST NOT be labelled as a download.
- **FR-005**: The product MUST show a meaningful state change or acknowledgment within one second of activation, submission, stopping, retrying, deletion, clearing, saving settings, or starting compaction.
- **FR-006**: The product MUST require an explicit visitor action before beginning a first-time model preparation and MUST explain that preparation can require substantial local storage, memory, processing, time, and an unmetered connection.
- **FR-007**: The product MUST report measured download progress only when pre-creation availability indicates a download, MUST use indeterminate progress before Chrome reports a positive fraction, and MUST use an indeterminate preparation state when measured download is complete but the model is not ready.
- **FR-008**: When local inference is unsupported or unavailable, the product MUST retain the same takeover shell, replace chat controls with the reliably detected limitation, relevant requirements, Retry, and a route back to the portfolio, and MUST NOT present a simulated chat, cloud inference, or another local runtime as a fallback.
- **FR-009**: The product MUST keep an always-visible notice stating that inference runs locally, the assistant has no tools or live web access, answers may be wrong or outdated, and important results should be double-checked.
- **FR-010**: The shipped assistant MUST NOT emit assistant-specific analytics or diagnostics for eligibility, preparation, turns, context, or failures; prompts, responses, personality text, context summaries, and session titles MUST remain on the visitor's device and MUST NOT be included in site-wide analytics, logs, URLs, or requests to the site or third parties.

#### Conversation

- **FR-011**: A ready visitor MUST be able to submit multi-line text prompts and receive text responses in a chronological transcript.
- **FR-012**: The product MUST permit only one active generation per session and MUST prevent duplicate rapid submissions from creating unintended turns.
- **FR-013**: The product MUST expose generation activity continuously until completion, interruption, or failure and MUST present incremental output when available.
- **FR-014**: The visitor MUST be able to stop an active response without losing text already received or the prompt that initiated it.
- **FR-015**: A stopped, failed, or empty response MUST be visibly distinguishable from a completed response and MUST offer an appropriate next action.
- **FR-016**: The transcript MUST present headings, lists, quotations, links, inline code, and code blocks readably while treating all generated content as untrusted display content rather than executable instructions.
- **FR-017**: The visitor MUST be able to copy the text of an individual assistant response.
- **FR-018**: The assistant's fixed guidance MUST favor direct helpful answers, acknowledge material uncertainty, ask a concise clarifying question when the request cannot be answered responsibly, and never claim access to tools, live information, private data, or actions it does not have.
- **FR-019**: A personality preference MUST NOT override the fixed guidance, local-data disclosure, or double-check-results notice.
- **FR-048**: The product MUST retain at most one native model session per window for the selected chat, reuse it across successful turns only while persisted history, compacted context, and personality still match, and destroy it on interruption, failure, invalidation, destructive action, session switch, or unmount.

#### Sessions and Local Data Control

- **FR-020**: The visitor MUST be able to create, switch among, and revisit up to 100 locally stored sessions without an account.
- **FR-021**: Each session MUST retain a stable identity, concise title, created time, last-active time, ordered messages, interruption state, and context state across ordinary reloads and browser restarts while local data remains available.
- **FR-022**: A new session MUST receive a deterministic concise title derived from its first user prompt, and duplicate titles MUST remain distinguishable by session identity and recency.
- **FR-023**: Sessions MUST be ordered by most recent activity, and the most recently active available session MUST reopen on return.
- **FR-024**: At the 100-session limit, the product MUST block creation of another session with a clear deletion action and MUST NOT silently evict an existing session.
- **FR-025**: The visitor MUST be able to delete one session after confirmation without changing other sessions or global settings.
- **FR-026**: The visitor MUST be able to clear all assistant data after an explicit destructive confirmation; completion MUST remove all sessions, messages, summaries, active-session references, and personality settings.
- **FR-027**: The product MUST explain that local history is best-effort, can be removed by browser settings or storage pressure, and is normally temporary in private browsing.
- **FR-028**: If local data cannot be stored or read, the product MUST allow conversation to continue in a temporary session, keep a persistent “Not saved” warning visible, preserve recoverable content for the current visit, explain that the session will disappear after close or reload, and MUST NOT report that persistence succeeded.
- **FR-029**: When the same session changes in multiple open windows, the product MUST automatically merge completed turns into one transcript, identify turns and messages stably so duplicates appear only once, keep each response attached to its originating prompt, order concurrent turns by prompt creation time with a deterministic tie-breaker, preserve every completed turn, and bring each open view to the merged state.

#### Personality

- **FR-030**: Settings MUST provide one global, blank-by-default personality preference with a visible character count and a maximum of 1,000 characters.
- **FR-031**: A saved personality preference MUST persist locally and apply to subsequent turns in all sessions; changes MUST NOT rewrite prior transcript content.
- **FR-032**: Saving over the character limit MUST be blocked without replacing the last valid saved value.
- **FR-033**: Clear all MUST restore the personality preference to its blank default.

#### Context and Compaction

- **FR-034**: Each active session MUST show context consumption as both a visual measure and an accessible text state based on the capacity reported for that session.
- **FR-035**: The context display MUST distinguish normal, nearing limit at 75% or more, and compacted states and MUST disclose when the browser has already removed older detail from active context.
- **FR-036**: Before a submitted turn is expected to exceed 80% of available context, the product MUST condense older active exchanges into a summary while retaining fixed guidance, the personality preference, and the most recent complete exchanges that fit.
- **FR-037**: The visitor MUST be able to request compaction before the automatic threshold whenever older exchanges are available to condense.
- **FR-038**: Compaction MUST leave the visible transcript unchanged, identify that older exchanges are represented by a summary, and persist the resulting context state with the session.
- **FR-039**: The visitor MUST be able to inspect a plain-language context detail view that distinguishes recent exchanges included directly from older exchanges represented by a summary.
- **FR-040**: If capacity cannot be measured reliably, the context display MUST state that the limit is unknown; on an overflow signal, it MUST disclose the loss of active detail and rebuild a compacted context before accepting another turn.
- **FR-041**: If compaction fails or a single prompt cannot fit, the product MUST preserve the transcript, avoid claiming a context-complete answer, and offer retry, a smaller prompt, or a new chat as applicable.

#### Accessibility and Interaction Quality

- **FR-042**: All primary actions MUST be operable by keyboard with visible focus, logical focus order, and no keyboard trap.
- **FR-043**: State changes, streamed content, errors, confirmations, context warnings, and completion MUST be conveyed without relying on color, animation, or vision alone and without excessive assistive-technology announcements.
- **FR-044**: The experience MUST respect reduced-motion preferences and MUST keep essential status understandable when decorative motion is absent.
- **FR-045**: The conversation composer, transcript, session navigation, settings, dialogs, notices, and unavailable state MUST remain usable without horizontal page scrolling across supported desktop window sizes and narrow unsupported-device views.
- **FR-046**: During streaming, the product MUST keep the latest output discoverable without forcing the viewport away from a visitor who has intentionally scrolled to earlier content.
- **FR-047**: Destructive confirmations and error recovery MUST return focus to a predictable, relevant location.

### Scope Boundaries

This feature excludes web search, backend content loading, tools, durable cross-session memory beyond saved transcripts and context summaries, accounts, synchronization, cloud persistence, export, cloud inference, alternate local runtimes, unsupported-browser inference, mobile inference, multimodal input, autonomous actions, custom model training, multilingual behavior beyond English, unbounded storage, and hosted-assistant feature parity. It does not redesign unrelated portfolio routes.

### Key Entities *(include if feature involves data)*

- **Assistant Session**: One local conversation, identified independently and containing a title, creation and recent-activity times, ordered messages, current generation state, and current context state.
- **Conversation Turn**: One user prompt and its resulting assistant response, with a stable identity, prompt creation time, deterministic transcript position, and completion or interruption state.
- **Message**: A user or assistant contribution with a stable identity, parent turn identity, role, text content, completion or interruption status, and creation time.
- **Context State**: The current capacity, usage level, threshold state, most recent directly included exchanges, optional summary of older exchanges, last compaction time, and any known overflow condition for one session.
- **Personality Preference**: One global optional text preference, its character count, and last update time; blank means default assistant behavior.
- **Model Activity State**: The visitor-facing availability, preparation, progress, readiness, generation, interruption, context, or failure state and the action currently available.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of eligible evaluation participants can open the ready assistant, submit a prompt, receive a response, and complete a context-dependent follow-up without assistance in under two minutes.
- **SC-002**: Every tested activation, submission, stop, retry, deletion, clear-all, setting-save, and compaction action produces visible and assistive-technology-compatible acknowledgment within one second.
- **SC-003**: On the project owner's current supported Mac with a ready model, at least 90% of ordinary evaluation prompts begin showing generated content within 15 seconds, and no generation presents more than five seconds of ambiguous inactivity.
- **SC-004**: On that same Mac, across a minimum 20-prompt evaluation covering explanation, transformation, planning, uncertainty, follow-up context, and unsupported live-information requests, at least 80% of responses receive a helpful-and-honest score of 3 or better on a 4-point rubric from two reviewers, with zero critical false claims of live web, tool, data, or action access.
- **SC-005**: In a 100-session persistence test, all completed sessions reopen with the correct title, order, transcript, and context state after reload; the 101st session is blocked without silent eviction.
- **SC-006**: Individual deletion and clear-all tests remove 100% of the selected local assistant data while preserving data explicitly outside the chosen deletion scope.
- **SC-007**: At least 90% of context-dependent evaluation prompts after automatic or manual compaction preserve the critical facts identified in the source conversation, and no compaction deletes visible transcript messages.
- **SC-008**: In every tested unsupported, preparation, generation, interruption, storage, overflow, and failure scenario, evaluators can identify the current state and available next action without consulting external instructions.
- **SC-009**: At least 90% of five or more representative portfolio evaluators can correctly state after one visit that the assistant runs locally, has no live web or tools, can be wrong, and stores history only in their browser.
- **SC-010**: All core flows meet WCAG 2.2 AA expectations in automated checks and manual keyboard, screen-reader, contrast, zoom, and reduced-motion review, with no critical accessibility blocker.
- **SC-011**: Across tested viewport widths from 320 to 2,560 pixels, all states avoid horizontal page overflow and keep their primary action, state explanation, and route back to the portfolio usable.
- **SC-012**: At least 80% of five or more target portfolio evaluators agree that the completed experience provides stronger evidence of AI product and engineering capability than the site's static AI claims alone.

## Assumptions

- The primary audience is hiring managers, senior product and engineering peers, and prospective collaborators evaluating the portfolio owner's AI product judgment.
- The initial assistant and evaluation language is English.
- Inference is available only in supported desktop Chrome environments where the browser can successfully provide or prepare its on-device model; unsupported mobile and browser visitors remain in the takeover shell but receive the explanatory experience instead of chat controls.
- The assistant has a stable direct URL plus one clear portfolio entry point; sharing the URL shares the experience, never local conversation content.
- The initial shipping gate covers only the project owner's current supported Mac. Passing the quality and timing criteria on that Mac is required, and public claims MUST NOT imply that other eligible hardware has been certified.
- The fixed assistant guidance is concise and stable. Personality is a global optional prefix, starts blank, is limited to 1,000 characters, and affects subsequent turns only.
- The session cap is 100. The product blocks at the cap rather than automatically deleting data.
- Browser-local persistence is best-effort. Accounts, synchronization, persistent-storage guarantees, and export are outside this feature.
- Context warning begins at 75% of reported capacity and automatic compaction occurs before a turn expected to exceed 80%. If capacity is unknown, the limitation is shown and overflow recovery is explicit.
- Feature-specific reach, completion, comprehension, quality, and portfolio impact are measured through evaluator studies rather than shipped assistant analytics. Any existing site-wide page-view measurement remains outside this feature and cannot include assistant content or interaction details.
- Model preparation duration is not bounded because download size, connection, extraction, and device capability vary; prompt status clarity and ready-model response timing are bounded instead.

## Dependencies

- A supported browser release must expose an eligible on-device language model, availability information, model preparation, incremental response delivery, cancellation, and context-capacity signals needed by the scoped experience.
- The browser and device must meet the vendor's current operating-system, storage, memory or graphics, processor, and connection requirements.
- The project owner's current supported Mac and the required reviewers must be available for response-quality, performance, lifecycle, accessibility, comprehension, and portfolio-impact validation.
- Existing portfolio navigation and visual identity must provide a discoverable entry point and coherent route back without requiring unrelated route redesign.
