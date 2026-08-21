# Contract: Media Workspace and User Flow

**Feature**: 002-assistant-media-input

## Capability and picker state

- Composer shows image/audio attachment actions only when the corresponding current capability is available.
- The picker supports multiple selected files and uses accept hints without treating them as validation or a product cap.
- Staged items show type, name, size, and measurable dimensions/duration when available. Every item is removable before send.
- A capability change or provider rejection leaves staged items reviewable; send rechecks and reports the actionable reason.

## Submission, retry, and reload

- Send creates one immutable turn containing text and the selected media parts for the current attempt.
- The exact source is sent only for that turn. A retry creates a new turn and may reuse in-memory source only while the prior attempt remains eligible and the page owner is alive.
- Terminalization, cancellation that makes the pair unsubmitable, unrecoverable failure, or owner loss releases raw source. Reloaded pages show reattachment-required state; they never resurrect source from history.
- A new attachment after reload creates a new turn and leaves the prior text/history record intact.

## Transcript and context

- Current-turn UI may show a local preview of selected media.
- Durable history shows a bounded image thumbnail or labelled audio identity/metadata plus accessible text. Temporary-mode history is visibly marked “Not saved.”
- Replay and compaction include text and optional accessible labels/metadata for explanation only. They never pass thumbnails, source bytes, object URLs, or native image/audio values to a future model turn.
- User attachments use a dedicated renderer; generated assistant media rendering is unchanged.

## Accessibility and privacy

- File controls have labels and keyboard operation. Staged attachments, unsupported states, provider rejection, interruption, and reattachment requirements are announced through accessible status text.
- Preview failures fall back to text metadata.
- No source bytes, remote URLs, filenames, dimensions, durations, or derived media are sent to analytics, logs, network endpoints, or unapproved browser surfaces. Names and metadata may be rendered locally when needed for the user’s history.
- No camera, microphone, screen capture, media generation, or remote URL import is part of this feature.
