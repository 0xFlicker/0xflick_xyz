# Quickstart: Multimodal Persona Assistant Input

## Prerequisites

- Node/Yarn dependencies installed in the Flicking checkout.
- Secure-context local assistant build available.
- Deterministic fake-model test harness (default).
- Owner-controlled desktop Chrome with the browser Prompt API enabled for real acceptance; audio support may require suitable GPU/model/storage.

## Deterministic verification

Run the focused suite while implementing:

    yarn test:assistant

The feature-specific deterministic coverage is split across:

- `tests/unit/assistant/mediaFoundation.test.ts` and `tests/unit/assistant/audioMedia.test.ts`
- `tests/component/assistant/media.test.tsx` and `tests/component/assistant/availability-media.test.tsx`
- `tests/unit/assistant/browserLanguageModel.test.ts` and `tests/unit/assistant/dexieRepository.test.ts`

The new tests should cover:

1. Independent text/image/audio capability snapshots and capability changes.
2. Exact ordered text/image/audio content arrays, multiple attachments, mixed modalities, aggregate measurement, and normalized native rejection.
3. No product cap on count/bytes/dimensions/duration/combination; fake provider limits are reported as provider/resource failures.
4. Raw Blob source present for the active attempt and an eligible retry, absent from repository records, replay, compaction, logs, and network spies.
5. Media-bearing native session destruction and text-only reconstruction after terminal, stop, failure, and retry.
6. Owner-aware queue behavior: the owning window claims the turn; another window skips it; owner loss transitions to requires-reattach; reattachment creates a new immutable turn.
7. Bounded image thumbnail/audio identity history, metadata fallback when image decode fails, temporary-mode “Not saved,” and atomic session/clear-all deletion.
8. Composer/transcript keyboard and screen-reader states for staged, unsupported, rejected, interrupted, and reattachment-required attachments.

Run the broader deterministic checks:

    yarn lint
    yarn typecheck
    yarn validate:content
    yarn test:content
    yarn build

Observed on 2026-08-20: `yarn lint`, `yarn typecheck`, `yarn validate:content`,
`yarn test:content`, `yarn test:assistant` (23 files / 99 tests), and `yarn build`
all pass. The focused browser checks below pass in both configured Chromium
profiles; the complete legacy Playwright matrix still has unrelated strict
`getByText` selector failures in existing tests, so those failures are not used
as media/provider evidence.

## Browser acceptance scenarios

Use a secure desktop Chrome session and record this separately from fake-model results.
The deterministic browser coverage currently lives in
`tests/e2e/assistant-media.spec.ts` (4 tests) and
`tests/e2e/assistant-accessibility.spec.ts` (2 tests), all passing in desktop and
narrow Chromium with a fake Prompt API. This proves UI/lifecycle wiring only, not
real model capability or native resource acceptance.

1. **Capability matrix**: observe text-only, image-capable, audio-capable, and unavailable states independently. Confirm the UI does not claim support from an aggregate probe.
2. **Image one-shot**: attach one or more images, submit with text, confirm the native request contains exact ordered image parts, then confirm a later text turn has no image part.
3. **Audio one-shot**: repeat with audio; verify hardware/GPU/model availability and accessible duration/identity metadata.
4. **Mixed input**: submit a text plus image/audio combination that the selected model accepts; if the provider rejects it, show the actionable native error and preserve eligible staged media.
5. **Dynamic limits**: use a model/environment that rejects a large or numerous selection. Confirm the provider/resource error is surfaced and no arbitrary product limit message appears.
6. **Retry/cancel**: stop or retry before the pair becomes unsubmitable. Confirm raw source remains available only in the owning page and retry creates a new turn.
7. **Reload/reattach**: reload before processing or after a lost owner. Confirm raw source is undiscoverable, history text/thumbnail/label remains, and a new attachment is required.
8. **Cross-window ownership**: open a second assistant window. Confirm it cannot claim/send the first window’s media turn and that text-only turns still use the normal queue.
9. **Replay/compaction**: reopen the session or trigger compaction. Confirm text and optional accessible labels are retained but no thumbnail/source/native media is sent to the model.
10. **Privacy/deletion**: inspect network and logs for no media egress, then delete the session and confirm its history representations disappear atomically.

## Evidence and release gate

Report deterministic local checks, fake-model behavior, and owner-Chrome/provider acceptance as separate evidence tiers. A fake model cannot prove Chrome capability, measurement, GPU/storage availability, or native rejection behavior. A real-browser smoke test cannot replace repository/privacy/concurrency tests.
