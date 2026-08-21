# Contract: Media Model Adapter

**Feature**: 002-assistant-media-input

## Purpose

Keep browser Prompt API details inside the model adapter while allowing the assistant domain to submit exact image/audio source parts for one turn.

## Domain-facing operations

The adapter exposes provider-neutral operations equivalent to:

- getCapabilities(): returns independent text, image, and audio availability with model identity and observation time.
- measurePrompt(input): returns aggregate provider usage or a normalized resource/unsupported error.
- promptStreaming(input, signal): streams text for one current turn.
- destroySession(): releases the native session and any provider-retained prompt context.

The input contains ordered text and MediaPart values. The adapter does not accept persisted MediaHistoryRepresentation values as model content.

## Capability rules

- Probe text-only, text+image, and text+audio independently.
- A positive modality capability does not promise a maximum attachment count or every mixed combination.
- Recheck capability and provider measurement at send time because model/environment state can change.
- Unknown native shapes fail closed with an actionable error rather than being coerced into text.

## Native mapping

browserLanguageModel.ts maps domain parts to one ordered Prompt API content array:

- text becomes a text content item;
- image source becomes the official image value;
- audio source becomes the official audio value;
- order is preserved, including multiple attachments and mixed modalities.

The installed Chromium declaration may need an adapter-local augmentation for Blob values. The domain remains Blob-based and no silent image/audio conversion is allowed. The real Chrome acceptance check must verify the value accepted by the target implementation.

## Session/privacy rules

- A native session that receives any media is destroyed after terminal completion, stop, failure, or replacement for retry.
- Later sessions are reconstructed from persisted text and optional history labels only.
- measurePrompt receives the same structured content shape as promptStreaming; history thumbnails/labels are never passed as media content.
- Errors normalize unsupported modality/combination, resource exhaustion, unavailable model, abort, and reattachment-required cases without logging source bytes or filenames.

## Test contract

The fake model must capture the exact ordered content array, expose independent capabilities, and simulate provider rejection/measurement. Tests assert that the adapter sends selected source values exactly once for the current attempt and never sends persisted history representations on a later text-only turn.
