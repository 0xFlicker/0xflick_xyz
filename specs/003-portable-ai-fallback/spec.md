# Feature Specification: Portable Browser-Local AI Fallback

**Feature Branch**: `003-portable-ai-fallback`

**Created**: 2026-08-22

**Status**: Draft

**Input**: Extend `/assistant` with a native-first model selector and portable on-device fallback that lets visitors attempt real private text turns on any device where a local model can be offered, even when answer quality or generation speed is low.

## Clarifications

### Session 2026-08-22

- Q: When an existing chat's last confirmed model is unavailable, should the strongest replacement activate immediately or wait for confirmation? → A: Activate the strongest available replacement immediately without confirmation.
- Q: Which physical mobile devices must pass before the fallback can be called ready to ship? → A: No physical-device matrix gates shipping; offer compatible models and let each device's readiness result decide.
- Q: If two open windows confirm different models for the same chat at nearly the same time, which selection should win? → A: The most recently confirmed selection wins, and every window converges to it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Attempt a Local Turn on This Device (Priority: P1)

A visitor who opens `/assistant` on any device where a portable model can be offered can prepare that model and attempt a text conversation without sending conversation content off the device.

**Why this priority**: The feature has no value unless an environment that currently reaches the unsupported state can produce a real local answer.

**Independent Test**: For each available model tier and controlled capability profile, open `/assistant`, confirm preparation, and verify that the model either reaches ready and completes a terminal response containing non-whitespace output or remains unavailable with an accurate next action, without conversation-content network traffic.

**Acceptance Scenarios**:

1. **Given** the built-in browser model is unavailable and a portable model can be prepared, **When** the visitor confirms preparation and submits a text prompt after readiness completes, **Then** the selected model generates a non-empty response locally.
2. **Given** model preparation or generation remains active for an extended period without a browser failure, **When** application time passes, **Then** the work continues with an understandable active state until it completes or the visitor stops it.
3. **Given** a device cannot run or prepare any offered model, **When** eligibility checking completes, **Then** the assistant retains its unavailable experience without offering cloud or synthetic inference.

---

### User Story 2 - See and Choose Available Models (Priority: P2)

A visitor can see the actual models and execution methods available on the current device, understand which one is active, and deliberately choose a different model from the top-left of the assistant content.

**Why this priority**: A portable fallback becomes understandable and controllable when model identity, preparation cost, and current selection are visible rather than hidden routing decisions.

**Independent Test**: Provide an environment with at least two available models, verify that the strongest runnable model is initially selected, switch to the other model, and verify confirmation, readiness, active-state update, and exactly one durable transcript boundary.

**Acceptance Scenarios**:

1. **Given** multiple models can run or be prepared on the current device, **When** a new chat opens, **Then** the strongest available model is selected and every compatible option appears in the top-left selector using its actual model and execution names.
2. **Given** the visitor selects an unprepared model, **When** the selection requires a download, **Then** one confirmation explains the model, execution method, approximate size, and expected capability before preparation starts.
3. **Given** the selected model fails and another model is available, **When** the assistant recommends the alternative, **Then** no model change occurs until the visitor confirms it.
4. **Given** an existing chat's last confirmed model is unavailable or unsupported, **When** the visitor reopens that chat, **Then** the strongest available replacement becomes active without confirmation and one durable model boundary records the change.

---

### User Story 3 - Continue One Chat Across Model Changes (Priority: P3)

A visitor can switch models within an existing chat while preserving the visible transcript and as much useful conversation context as the newly selected model can carry.

**Why this priority**: Model choice should be useful during a conversation without forcing a new chat or burdening every answer with provenance labels.

**Independent Test**: Build a conversation with a stronger model, confirm a downgrade, force both successful and failed context condensation, and verify that the new model receives the best available context, one model boundary appears, no response receives an individual model badge, and no accepted turn is replayed.

**Acceptance Scenarios**:

1. **Given** an idle chat with prior turns, **When** the visitor confirms a switch to another ready model, **Then** one durable boundary names the new active model and subsequent turns use it.
2. **Given** the visitor confirms a switch to a less capable model, **When** the current model can condense older context, **Then** the new model receives that condensed context plus the newest turns that fit.
3. **Given** condensation fails during a confirmed downgrade, **When** the switch continues, **Then** the new model receives the newest turns that fit without a separate condensation error notice and the visible transcript remains unchanged.
4. **Given** a response is actively generating, **When** the visitor opens model controls, **Then** the model cannot change until the active turn reaches a terminal state.
5. **Given** two open windows confirm different models for the same chat, **When** both selections converge, **Then** the most recently confirmed selection wins and every window shows the same active model and durable boundary.

---

### User Story 4 - Manage Models Separately From Conversations (Priority: P4)

A visitor can clear conversation data without redownloading portable models and can separately remove an installed model without deleting or rewriting chats.

**Why this priority**: Model assets are large reusable resources, while conversations and settings are personal content with a different deletion intent.

**Independent Test**: Prepare a portable model and create a conversation, clear all assistant data, verify that the model remains available, then remove the model separately and verify that conversation deletion and model removal report only their own scope.

**Acceptance Scenarios**:

1. **Given** one installed portable model and saved assistant data, **When** the visitor confirms Clear all assistant data, **Then** conversations and settings are removed while the model remains installed.
2. **Given** an installed model that is not active, **When** the visitor confirms its removal, **Then** its installed assets are removed without changing conversations.
3. **Given** an installed model is active, **When** the visitor removes it, **Then** no replacement is selected automatically and another model must be confirmed before the next turn.

### Edge Cases

- An accelerated execution method is exposed but the selected model cannot complete its readiness check under current memory pressure.
- A portable model download completes but loading or the local readiness generation fails.
- The browser reports no measurable download progress while preparation is still active.
- Preparation, readiness checking, condensation, or generation continues indefinitely without a browser error.
- The visitor stops waiting at the same moment preparation or generation completes.
- The browser or operating system terminates long-running model work, evicts installed assets, or clears them outside the assistant.
- A selected model becomes unavailable between model selection and turn acceptance.
- A model switch is requested while a turn is queued, streaming, stopped, or failing.
- A downgrade cannot fit the existing condensed context or even the newest complete turn.
- A model switch occurs after earlier native turns used image or audio input that the portable model cannot inspect.
- The same chat is open in multiple windows when its selected model or model boundary changes.
- The visitor removes the active model or clears conversations while model preparation is active.
- Available model names, versions, execution methods, approximate sizes, or capabilities change after a model update.

## Requirements *(mandatory)*

### Functional Requirements

#### Model Discovery and Selection

- **FR-001**: The assistant MUST place a model selector at the top-left of the assistant content.
- **FR-002**: The selector MUST list every model the current environment can run or explicitly prepare and MUST omit incompatible models.
- **FR-003**: Each selector entry MUST identify the actual model and execution method, its active or preparation state, and whether preparation is required.
- **FR-004**: A new chat MUST select the strongest available model in this order: eligible built-in browser model, larger accelerated portable model, then smaller compatibility portable model.
- **FR-005**: Automatic initial selection MUST NOT begin a portable model download without visitor confirmation.
- **FR-006**: The initial portable model catalog MUST include `SmolLM2 360M · WebGPU` where accelerated execution is viable and `SmolLM2 135M · WASM` where compatibility execution is viable.
- **FR-041**: Reopening an existing chat MUST restore its last confirmed model when available; otherwise the strongest available replacement MUST become active without confirmation and add one durable model boundary.

#### Preparation and Readiness

- **FR-007**: Selecting an unprepared portable model MUST present one confirmation naming the model, execution method, approximate download size, and lower expected capability before network transfer begins.
- **FR-008**: Preparation MUST expose measured progress when available and an indeterminate active state otherwise.
- **FR-009**: A portable model MUST NOT become ready until it loads and completes a minimal local generation check that produces non-whitespace output on the current device.
- **FR-010**: Preparation, readiness checking, context condensation, and generation MUST NOT fail solely because an application-generated timeout elapsed.
- **FR-011**: Model work MUST leave navigation, status, stopping, and other assistant controls operable while it continues.
- **FR-012**: The visitor MUST be able to stop waiting on preparation or readiness and stop active generation without deleting installed model assets or completed transcript content.

#### Privacy and Local Conversation

- **FR-013**: Portable inference MUST keep prompts, responses, transcript content, condensed context, personality settings, session titles, and media on the visitor's device.
- **FR-014**: Model preparation MAY retrieve public model and execution assets, but those requests MUST NOT contain conversation content.
- **FR-015**: A ready portable model MUST support multi-turn text prompts, incremental output when available, stopping, terminal failure states, copying, and the assistant's existing local transcript behavior.
- **FR-016**: Portable models in this feature MUST accept text only.
- **FR-017**: Selecting a text-only model MUST make image and audio submission unavailable while preserving existing media records in the visible transcript.
- **FR-018**: A text-only model MUST NOT receive raw prior media or imply that it can inspect media from an earlier model boundary.
- **FR-019**: Existing image and audio behavior MUST remain available when the active model reports those capabilities.

#### Model Switching and Context

- **FR-020**: A visitor MUST be able to request a model switch only while the chat has no active generation.
- **FR-021**: Every visitor-requested model switch and every switch recommended after readiness or generation failure MUST require confirmation; only the unavailable-model reopen behavior in FR-041 is exempt.
- **FR-022**: The assistant MUST NOT switch models silently, replay an accepted prompt automatically, or replace partial output with another model's response.
- **FR-023**: A completed switch MUST add exactly one durable transcript boundary naming the newly active model.
- **FR-024**: Individual assistant responses MUST NOT display model identity labels.
- **FR-025**: The newly selected model MUST receive as much existing conversation context as its own capacity can carry.
- **FR-026**: A downgrade confirmation MUST briefly warn that a less capable model may reduce answer quality and conversation memory.
- **FR-027**: Before a deliberate downgrade, the current model MUST make one best-effort attempt to condense older context when it remains usable.
- **FR-028**: If downgrade condensation fails, the newly selected model MUST receive the newest complete context that fits without a separate condensation failure notice.
- **FR-029**: If a requested model cannot become ready, the prior active model and accepted transcript MUST remain unchanged.
- **FR-030**: When multiple windows confirm different models for one chat, the most recently confirmed selection MUST win under a deterministic order and every window MUST converge to that active model and durable boundary.

#### Model Storage and Removal

- **FR-031**: Successfully prepared portable model assets MUST remain reusable while the browser retains them.
- **FR-032**: Clear all assistant data MUST remove conversations and settings while preserving installed portable model assets.
- **FR-033**: Every installed portable model MUST provide a separately confirmed removal action.
- **FR-034**: Removing a portable model MUST NOT delete or rewrite conversations created with that model.
- **FR-035**: Removing the active model MUST NOT select another model or replay a turn automatically; the visitor MUST confirm an available model before the next turn.
- **FR-036**: The assistant MUST distinguish missing or browser-evicted model assets from intentional conversation deletion.

#### Failures and Communication

- **FR-037**: Browser termination, resource exhaustion, unsupported operations, corrupt model assets, and visitor cancellation MUST produce a stable state with an understandable next action.
- **FR-038**: A failed readiness check MAY recommend another compatible model but MUST wait for visitor confirmation before changing the selection.
- **FR-039**: Model preparation and operation states MUST use concise visitor-facing language and MUST NOT expose internal diagnostics or lengthy technical recovery instructions.
- **FR-040**: No failure path MAY use cloud inference, server-side prompt processing, or a synthetic answer in place of the selected local model.

### Key Entities

- **Local Model Option**: A model the current environment can run or prepare, identified by its actual model name, execution method, capability profile, preparation state, and active state.
- **Chat Model Selection**: The model currently chosen for one assistant chat, including its readiness, confirmation order, and the point from which it handles subsequent turns.
- **Model Boundary**: A durable transcript event recording that subsequent turns use a newly confirmed model without labeling every response.
- **Installed Model Asset**: Reusable model data stored by the browser, with model identity, approximate size, version, and removal state independent of conversation data.
- **Portable Context State**: The condensed context and newest complete turns available to the selected model after its capacity is applied.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every observed device where a portable model reaches ready, the visitor can submit a text prompt and receive a terminal local response containing non-whitespace output.
- **SC-002**: On every observed device where an offered model cannot complete readiness, the assistant does not claim that model is ready and presents an accurate retry, alternative-model, or unavailable action.
- **SC-003**: Across 20 observed portable turns covering every offered model tier and controlled capability profile, 100% send no prompt, response, transcript, context, personality, title, or media content in network requests.
- **SC-004**: Every confirmed visitor-requested model change creates exactly one durable model boundary and produces no automatic replay of an accepted prompt.
- **SC-005**: Across 10 extended-work tests lasting at least 10 minutes, 100% remain active without an application-generated timeout while preserving a visible working state and manual stop action.
- **SC-006**: Across successful and failed downgrade-condensation cases, 100% preserve the visible transcript and deliver either condensed context or the newest complete context that fits to the selected model.
- **SC-007**: In every tested preparation, readiness, generation, removal, eviction, cancellation, and failure state, evaluators can identify the active model state and available next action without consulting external instructions.
- **SC-008**: Clear-all and model-removal tests preserve 100% of data outside the visitor-confirmed deletion scope.
- **SC-009**: On existing eligible desktop environments, 100% of previously supported text and media journeys continue to complete without regression.
- **SC-010**: Portable model answer quality, token speed, and fixed first-token latency are not used as shipping gates when the model completes a real local turn.

## Assumptions

- No browser, operating-system family, or hand-picked physical-device matrix gates release or implies blanket support; current-device capability and readiness remain authoritative.
- Current-device capability and successful local readiness are authoritative; browser or device names alone do not guarantee model operation.
- Browsers and operating systems may terminate long-running work or evict installed assets; the application adds no time limit of its own.
- The full visible transcript remains durable even when a newly selected model can carry only part of it as active context.
- Existing session, transcript, queue, accessibility, local persistence, and one-shot media privacy behavior remains unchanged unless this specification states otherwise.
- Portable image and audio inference, user-imported models, a full incompatible-model catalog, an installable app, an offline guarantee, quality scoring, and per-response model labels are outside this feature.
- The current alternate-runtime and mobile-inference exclusions in `specs/001-on-device-ai-assistant/spec.md` and `specs/002-assistant-media-input/spec.md` are superseded only for the behavior explicitly defined here.

### Constitution Exception

Principle III normally prohibits silent degradation. This feature grants two narrow exceptions. First, after a visitor confirms a downgrade with the warning that answer quality and conversation memory may decrease, failed condensation may silently reduce active context to the newest complete context that fits. Second, reopening a chat whose last confirmed model is unavailable may immediately activate the strongest available replacement, with a durable model boundary recording the change. Neither exception permits prompt replay, current-turn loss, transcript deletion, hidden cloud inference, suppressed model failures, or any other silent model change.
