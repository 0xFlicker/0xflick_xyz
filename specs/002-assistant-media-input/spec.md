# Feature Specification: Assistant Image and Audio Input

**Feature Branch**: `002-assistant-media-input`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Adding image and audio support to the persona AI assistant, when the underlying model supports it."

## Clarifications

### Session 2026-08-20

- Q: If a media-bearing turn is queued or interrupted before generation finishes, should the product keep the original image/audio only in the active page and mark the turn interrupted after reload or close, requiring the visitor to reattach it? → A: Keep original media in page memory for resubmission while the prior turn's text remains active or a retry is offered; release it when the text is no longer submittable with that media or after page reload, requiring reattachment.
- Q: Should v1 allow one media attachment per visitor message, or allow multiple image/audio attachments when the underlying model supports them? → A: Use the underlying model and environment as the authority; do not impose an arbitrary product attachment count or media-size limit, and expose as many attachments as they can reliably accept.
- Q: After a media turn completes, should durable history retain a small image thumbnail and labelled audio identity, or only a text marker and metadata? → A: Retain a small image thumbnail and labelled audio identity with accessible metadata, while never sending that history representation to future model turns.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ask About an Image (Priority: P1)

A visitor whose on-device model accepts images can select an image, review it before sending, add an optional question, and receive a text response that considers the image for that turn.

**Why this priority**: Image understanding is the most common and immediately visible extension beyond the assistant's existing text-only experience. It proves capability detection, local attachment handling, one-shot multimodal generation, and a truthful transition back to text-only conversation.

**Independent Test**: In an environment that reports image support, select an image containing controlled, observable details, send it with and without accompanying text, then ask a text follow-up without reattaching the image. Verify that the first response used the image, the follow-up does not silently reuse it, and reattaching it starts a new image-bearing turn.

**Acceptance Scenarios**:

1. **Given** the on-device model is ready and accepts image input, **When** the visitor opens the composer, **Then** an image attachment action is available and clearly identifies the supported use.
2. **Given** the visitor selects a valid supported image, **When** selection completes, **Then** the composer shows a preview and identifying details with actions to inspect or remove the image before sending.
3. **Given** a valid image is attached, **When** the visitor sends it with optional text, **Then** the transcript immediately shows the image as part of the visitor's message and generation proceeds with both the attachment and text that were reviewed.
4. **Given** the assistant completed a response to an image, **When** the visitor asks a text follow-up without reattaching the image, **Then** the model receives only text context, the interface may show the bounded history representation, and the assistant does not claim to inspect the prior image again.
5. **Given** an image is staged but not sent, **When** the visitor removes it, **Then** the image is no longer included in the pending message and any drafted text remains unchanged.

---

### User Story 2 - Ask About Audio (Priority: P2)

A visitor whose on-device model accepts audio can select an audio recording or file, review its identity and playback before sending, add an optional instruction, and receive a text response that considers the audio for that turn.

**Why this priority**: Audio expands the assistant to spoken and recorded material while reusing the same trustworthy one-shot attachment flow established for images.

**Independent Test**: In an environment that reports audio support, select a short controlled recording, play and remove it before submission, then send it with and without accompanying text and verify the response and transcript. Ask a later text follow-up without reattaching the recording and verify that audio is not silently replayed.

**Acceptance Scenarios**:

1. **Given** the on-device model is ready and accepts audio input, **When** the visitor opens the composer, **Then** an audio attachment action is available and clearly identifies the supported use.
2. **Given** the visitor selects a valid supported audio item, **When** selection completes, **Then** the composer shows identifying details, playback controls when the item can be decoded, and an action to remove it before sending.
3. **Given** valid audio is attached, **When** the visitor sends it with optional text, **Then** the transcript immediately shows the audio as part of the visitor's message and generation proceeds with both the attachment and text that were reviewed.
4. **Given** audio playback is unavailable but the underlying model can still accept the selected item, **When** the item is staged, **Then** the product explains the preview limitation without falsely claiming that the item cannot be analyzed, and the item remains limited to the current turn.
5. **Given** audio input fails validation or generation, **When** the failure appears, **Then** the visitor keeps recoverable drafted text and receives a specific recovery action without a fabricated response.

---

### User Story 3 - See Only Capabilities That Work (Priority: P3)

A visitor can continue using the assistant without confusion when image support, audio support, both capabilities, or neither capability is available in the current on-device model.

**Why this priority**: The feature must extend supported environments without degrading the existing text assistant or presenting controls that cannot work.

**Independent Test**: Exercise four controlled environments—text only, image plus text, audio plus text, and image plus audio—and verify that each exposes only working attachment actions while text conversation remains unchanged.

**Acceptance Scenarios**:

1. **Given** the current model accepts text but neither media type, **When** the assistant becomes ready, **Then** the existing text conversation experience remains usable and no unavailable media action is shown.
2. **Given** the current model accepts only one media type, **When** the assistant becomes ready, **Then** only that media type's attachment action is available.
3. **Given** media capability changes after an attachment was staged, **When** the visitor attempts to send, **Then** generation is blocked, the attachment remains reviewable and removable, and the interface explains that the current model no longer accepts it.
4. **Given** a conversation contains an earlier media attachment, **When** the visitor reopens the conversation, **Then** the transcript shows only its bounded history representation, the raw media is not replayed into a new turn, and the visitor can attach the original again if the current model supports a new analysis.

---

### User Story 4 - Retain and Remove Local Media Safely (Priority: P4)

A visitor can revisit media-bearing conversations while local history is available and can delete the same media through existing session and clear-all controls.

**Why this priority**: Media can be more sensitive and storage-intensive than text, so local retention, deletion, and privacy claims must remain honest and predictable.

**Independent Test**: Send supported image and audio items in saved and temporary modes, reload, delete one conversation, clear all assistant data, and inspect network activity to verify retention, removal, and device-only handling.

**Acceptance Scenarios**:

1. **Given** durable local history is available, **When** a media-bearing conversation is reloaded, **Then** its text, media marker, and bounded image thumbnail or audio identity reappear with the message, without requiring the original media bytes for replay.
2. **Given** durable local history is unavailable, **When** the visitor sends media in a temporary session, **Then** the persistent “Not saved” warning applies to the media and explains that it will disappear after close or reload.
3. **Given** a visitor confirms deletion of a media-bearing session, **When** deletion succeeds, **Then** its messages and media are removed without changing other sessions or the global personality preference.
4. **Given** a visitor confirms Clear all, **When** the operation succeeds, **Then** any active media and all retained media history representations are removed along with the existing assistant data covered by that action.
5. **Given** a visitor selects, previews, sends, reloads, or deletes media, **When** network activity is inspected, **Then** no request contains or is caused by the media or its private identifying details.

### Edge Cases

- The selected item has a supported media category but an unsupported, misleading, corrupt, empty, or unreadable format.
- The selected item or combined message exceeds a reliably known model, conversation-context, or local-storage limit.
- Multiple items are selected when the current model can accept fewer items or cannot accept their combination.
- The visitor selects an image and audio together, but the model supports each only in separate requests.
- A capability check succeeds during preparation but the capability disappears before measurement or generation.
- The visitor removes, replaces, sends, stops, switches sessions, closes the page, or clears data while media validation, previewing, persistence, context measurement, or generation is in progress.
- A stopped or failed turn still offers retry for the same text, so its original media remains available in page memory; once retry is unavailable or the text is no longer submittable with that media, the original media is released.
- A page reload occurs while a media-bearing turn is active, queued, stopped, failed, or retryable, so the transcript survives only with its text and bounded history representation and the original media requires reattachment.
- The same media-bearing conversation is open in two windows and one window deletes it or submits another turn.
- A valid item has no trustworthy filename, media type, dimensions, duration, or preview.
- Image dimensions or audio duration are unusually large even though the encoded item is small, creating excessive local processing or context pressure.
- The model produces text that claims it could not receive media, contradicts observable media content, claims unsupported transcription, identification, or live lookup capabilities, or implies that a later text-only turn can still inspect an earlier one-shot attachment.
- A visitor expects a prior image or audio item to be available after compaction or on a follow-up turn without attaching it again.
- Saved media becomes unreadable because local browser data is partially removed or corrupted.
- Assistive technology cannot perceive the visual preview or operate the audio preview, removal action, attachment action, or generation status.

## Requirements *(mandatory)*

### Functional Requirements

#### Capability and Availability

- **FR-001**: The product MUST determine image and audio input support independently for the current on-device model before exposing either attachment action.
- **FR-002**: The product MUST expose an attachment action only for a media type the current model can accept; a text-only model MUST retain the existing text experience without disabled or simulated media controls.
- **FR-003**: Capability detection MUST be repeated whenever the model is newly prepared, replaced, retried after failure, or otherwise may have changed.
- **FR-004**: Before each media-bearing message is accepted for generation, the product MUST verify that the current model still supports every attached media type and the selected combination.
- **FR-005**: If capability cannot be determined reliably, the product MUST treat that media type as unavailable and MUST NOT send, transform, upload, or simulate analysis of it.
- **FR-006**: The product MUST preserve the assistant's existing preparation, availability, local-only, no-tools, no-live-web, uncertainty, and double-check disclosures for media-bearing conversations.

#### Attachment Preparation and Validation

- **FR-007**: A visitor MUST be able to select an existing image or audio item from the device when the corresponding capability is available; direct camera capture, microphone recording, screen capture, and remote URL import are outside this feature.
- **FR-008**: The composer MUST show each staged attachment's media category and available identifying details before submission, including an image preview or audio playback when local decoding permits it.
- **FR-009**: A visitor MUST be able to remove or replace a staged attachment without losing drafted text or affecting the saved transcript.
- **FR-010**: The product MUST accept a media-bearing message with or without accompanying text when the current model supports that form of input.
- **FR-011**: The product MUST validate media category, readability, emptiness, supported combination, and all reliably known item, message, context, and storage limits before accepting generation.
- **FR-012**: When a selection is rejected, the product MUST identify the affected item, give a plain-language reason, preserve other valid staged content, and provide an applicable remove, replace, reduce, or retry action.
- **FR-013**: The product MUST NOT silently resize, recompress, transcode, trim, extract, transcribe, or otherwise alter selected media before sending it to the model.
- **FR-014**: Attachment validation and preview work MUST be cancellable through removal, replacement, session switching, or destructive data actions, and a cancelled result MUST NOT reappear later.
- **FR-034**: The product MUST NOT impose an arbitrary attachment count, media-size, duration, or combination limit; it MUST expose the number and kinds of attachments the current model and environment can reliably accept, subject only to limits reported or enforced by the model, local storage, or available browser resources.

#### Generation and Conversation Context

- **FR-015**: A submitted media item and its accompanying text MUST form one visitor message and remain attached to the same generated response throughout queueing, generation, interruption, and failure; while that text remains active and a retry/resubmission is offered in the current page, the original media MAY remain in page memory for a new queued turn, but after retry is unavailable, the text is no longer submittable with that media, or the page reloads, only the bounded history representation is retained for transcript replay and cross-window reconciliation.
- **FR-016**: The product MUST give visible acknowledgment within one second after a valid media-bearing message is accepted and MUST distinguish validation, queued, context-checking, generating, stopped, completed, and failed states without implying media analysis completed before a response does.
- **FR-017**: The exact visitor-reviewed media and accompanying text MUST be the content presented to the current on-device model; the product MUST NOT substitute a lower-quality derivative, remote copy, transcript, or description as if it were the selected media.
- **FR-018**: Context measurement for a media-bearing turn MUST include the selected media when the current model provides reliable capacity information; after that turn is terminal, media bytes and previews MUST NOT be included in later prompt context or compaction input.
- **FR-019**: Follow-up model turns MUST use text context only; the interface MAY show the bounded history representation, but it MUST NOT be sent to the model as media context, and the visitor MUST reattach media for another analysis.
- **FR-020**: Stopped, failed, empty, filtered, unsupported, or context-limited media generations MUST preserve recoverable visitor content and partial response text under the assistant's existing terminal-state rules; if retrying is offered in the current page, resubmitting the same text/media MUST create a new queued turn without mutating the terminal turn, and its original media MAY remain memory-only until that resubmission is accepted, cancelled, or made unavailable.
- **FR-021**: The product MUST NOT retry a media generation automatically, switch to a cloud service or another model, or fabricate a media-derived answer after a failure.
- **FR-022**: Assistant responses MUST remain text-only, and generated links or markup MUST NOT create media output, remote media requests, or executable content.

#### Transcript, Persistence, and Data Control

- **FR-023**: The composer MUST render the current-turn image or audio attachment with its available local preview or playback controls, while terminal transcript history MUST retain only a small bounded image thumbnail or labelled audio identity plus accessible text identification.
- **FR-024**: Attachment presentation MUST remain distinguishable from assistant-generated content and MUST NOT allow media metadata or generated text to alter the surrounding interface.
- **FR-025**: In durable-history mode, the product MUST persist the text, media marker, bounded image thumbnail or audio identity, and accessibility metadata with the originating message; the original media bytes MUST NOT be required for session replay or reconstruction.
- **FR-026**: In temporary mode, the current-turn media MAY remain available until the turn ends when possible, while its bounded history representation carries the existing “Not saved” disclosure and MUST NOT be reported as durable.
- **FR-027**: Deleting a session MUST remove all active media and retained history representations owned by that session, and Clear all MUST remove all assistant media representations; neither action may report success until deletion is verified.
- **FR-028**: Orphaned, partially written, or unreadable media MUST fail visibly and be eligible for removal without hiding, corrupting, or recreating unrelated conversations.
- **FR-029**: Media selection, validation, current-turn generation, resubmission of the same text/media as a new turn, bounded history persistence, reconstruction, and deletion MUST occur without placing media bytes, derived content, filenames, media metadata, or local object identifiers in requests, URLs, analytics, diagnostics, or third-party services; raw media MUST remain memory-only for an offered resubmission and MUST NOT be retained solely to enable future replay.

#### Accessibility and Interaction Quality

- **FR-030**: Attachment, preview, playback, replace, remove, send, stop, retry, and deletion actions MUST be keyboard operable with visible focus and predictable focus restoration.
- **FR-031**: Every attachment MUST have an accessible text name that does not depend on seeing the image, hearing the audio, reading color, or interpreting motion.
- **FR-032**: Validation, local preparation, context pressure, capability loss, generation progress, completion, and failure MUST be communicated without relying on a preview, color, or animation alone and without announcing incremental output excessively.
- **FR-033**: Media previews and identifying details MUST remain usable without causing page-level horizontal overflow or hiding the composer at supported desktop and narrow layouts.

### Key Entities *(include if feature involves data)*

- **Media Capability**: The current on-device model's independently detected ability to accept image input, audio input, and supported combinations; includes any reliably observed attachment count, size, duration, or combination constraints, the observation state, and when it was last verified.
- **Staged Attachment**: A visitor-selected local item being validated or reviewed before submission; includes its media category, available identifying details, preview state, validation state, and cancellation identity, but does not yet belong to saved history.
- **Media Attachment**: A current-turn local image or audio item owned by exactly one visitor message; includes stable identity, media category, original content while the turn or an offered resubmission remains active in page memory, available identifying details, readability state, and one-shot context eligibility. It is invalidated on page reload or when the text can no longer be submitted with it.
- **History Media Representation**: The bounded record retained after a media-bearing turn, consisting of a small image thumbnail for images or labelled audio identity for audio plus accessible text and enough metadata to explain what was attached; it is never sent to the model as a substitute for the original media.
- **Media-Bearing Message**: One visitor message containing optional text and one or more accepted attachments, linked to exactly one turn and its assistant response.

## Scope Boundaries and Dependencies

### In Scope

- Selecting existing local image and audio items for model input.
- Independent capability detection and honest capability-based composer actions.
- Local preview or playback, validation, one-shot submission, text response, text-only follow-up context, bounded history persistence, deletion, privacy, and accessibility.
- Messages containing one or more supported attachments, including mixed image and audio only when the current model accepts that combination; the media is used only for the turn in which it is attached.

### Out of Scope

- Image generation, audio generation, text-to-speech, speech-to-text presented as a separate transcript feature, or any non-text assistant response.
- Camera, microphone, screen, or live-stream capture.
- Remote media URLs, cloud storage, cloud inference, media search, media editing, automatic media conversion, or alternate-model fallback.
- Background analysis before the visitor sends, batch media libraries, attachment sharing outside the local assistant, and export or download of conversations.
- Replaying raw images or audio into later turns, including session replay, compaction, context reconstruction, or automatic follow-up generation; resubmitting the same text/media as a new queued turn is the explicit exception while its source remains in page memory.
- Guaranteeing recognition, transcription, translation, identification, diagnosis, or other model quality beyond the measurable acceptance evaluation.

### Dependencies

- The existing on-device persona assistant, including its text conversation, availability, context, storage, privacy, deletion, failure, and accessibility contracts, remains the base experience.
- The current on-device model and environment must truthfully expose and perform the requested media capability; this feature does not manufacture unavailable capability.
- The environment must be able to read a visitor-selected local item and, for visual or audible preview, decode it locally.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In each of four controlled capability profiles—text only, image plus text, audio plus text, and image plus audio—100% of attachment actions shown to visitors correspond to capabilities that can accept a valid test item, and no unavailable action is shown.
- **SC-002**: At least 95% of valid supported test attachments show a reviewable staged state within one second of local selection, excluding the time a visitor spends in the device's file chooser.
- **SC-003**: At least 95% of valid supported media submissions show an accepted, queued, or generating state in the transcript within one second of Send.
- **SC-004**: In a controlled set of 20 image and audio questions with objectively observable source facts, at least 16 responses materially address the supplied media and zero responses falsely claim live web, tool, private-data, or unsupported media access.
- **SC-005**: Across invalid format, unreadable item, capability loss, context limit, storage failure, Stop, retry, session switch, deletion, and Clear all tests, 100% preserve unrelated conversation data and provide an accurate terminal state or recovery action without a fabricated answer; an offered resubmission retains the original media only in page memory until the new queued turn is accepted, cancelled, or made unavailable.
- **SC-006**: In durable-history tests, 100% of accepted media messages retain the correct text, media marker, bounded image thumbnail or audio identity after reload and cross-window reconciliation, while 100% of later turns omit the original media unless the visitor attaches it again; verified session deletion or Clear all removes the retained history representations, and reload never restores original media bytes.
- **SC-007**: Browser-network inspection records zero requests caused by selected media, media content, filenames, derived media content, attachment persistence, or media generation across selection, preview, submission, reload, and deletion scenarios.
- **SC-008**: In moderated keyboard-only and screen-reader checks, at least 90% of participants can attach, review, remove, and send one supported image and one supported audio item on the first attempt without assistance.
- **SC-009**: At representative desktop and narrow viewport sizes, all media actions, previews, playback controls, statuses, and recovery actions remain reachable with no page-level horizontal scrolling and no loss of drafted text.

## Assumptions

- “Image and audio support” means image and audio input to the assistant; assistant output remains text.
- The first working layer uses existing local files. Direct camera and microphone capture can be assessed as separate future features if evidence supports them.
- Image support and audio support are independent and can change with the current model or environment; neither is assumed from text support.
- A visitor may send media without accompanying text when the model supports that form, in which case the assistant's fixed guidance asks it to describe or address the supplied item directly.
- Attachment count, size, duration, and combination limits come from the current model and environment or unavoidable local resource constraints; the product does not add arbitrary caps. Unsupported selections are rejected before generation rather than altered or split into hidden turns.
- Media follows the existing assistant's local-history mode: durable when local persistence succeeds and temporary with an explicit warning when it does not.
- Original selected media is retained only for the active one-shot turn and any explicitly offered resubmission of that same text/media as a new turn, in page memory only. After resubmission is unavailable, the text is no longer submittable with that media, or the page reloads, durable history retains a small image thumbnail or labelled audio identity with accessible metadata, but must not retain or replay raw media solely for future context, compaction, or reconstruction.
- A later text turn may refer to the fact that an attachment was used or to the assistant's prior textual answer, but must not claim to inspect the prior media; reattachment is required for another analysis.
- Existing session-count limits, personality behavior, local-only disclosure, context thresholds, generation concurrency, and destructive confirmation rules remain unchanged unless this specification explicitly extends them.
