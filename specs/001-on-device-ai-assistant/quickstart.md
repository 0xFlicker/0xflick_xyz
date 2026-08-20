# Quickstart: On-Device AI Assistant

**Feature route**: `/assistant`  
**Primary contracts**: [workspace](./contracts/assistant-workspace.md), [model adapter](./contracts/local-model-adapter.md), [persistence](./contracts/persistence.md), [evaluation](./contracts/evaluation.md)

This guide describes the expected implementation and validation workflow. The package scripts and feature code are added during `$speckit-implement`; the planning artifacts alone do not make the route available.

## 1. Prerequisites

- Use the repository's Yarn workflow and existing Node.js environment.
- For real inference, use stable Chrome 148 or newer on the project owner's supported Mac, from `https://` or `http://localhost`.
- The Chrome profile must be eligible for built-in AI and able to download the model. Current documented requirements include macOS 13+, sufficient storage, sufficient GPU or CPU/RAM capacity, and an unmetered initial-download connection. Runtime `LanguageModel.availability()` remains authoritative.
- Do not enable legacy Prompt API flags, old origin-trial APIs, or `window.ai.languageModel`. The supported target is the stable global `LanguageModel` website API.
- For deterministic browser tests, install Playwright's Chromium binary after project dependencies.

Reference: [Chrome built-in AI requirements](https://developer.chrome.com/docs/ai/get-started)

## 2. Install and Run

```bash
yarn install
yarn playwright install chromium
yarn dev
```

Open `http://localhost:3000/assistant`.

Expected first-load outcomes:

- Supported and ready: the composer becomes available.
- Supported but not prepared: the page explains requirements and waits for **Prepare on this device** before download.
- Unsupported/unavailable: the same takeover shell explains the detected limitation and offers Retry plus a portfolio return.
- Storage unavailable: conversation remains usable with a persistent **Not saved** warning.

No assistant API key or server environment variable exists.

## 3. Development Layers

### Layer 1 — local turn

1. Add the `/assistant` route and takeover layout.
2. Add the global `LanguageModel` adapter and deterministic fake.
3. Implement checking, consent, download, finalization, ready, streaming, Stop, and mapped failure states.
4. Complete one prompt and one context-dependent follow-up without any server request.

Acceptance: [plan Layer 1](./plan.md#layer-acceptance-conditions) and [model lifecycle](./contracts/local-model-adapter.md#lifecycle-rules).

### Layer 2 — local history

1. Add the schema-version-1 Dexie repository and page-memory implementation.
2. Persist draft-on-first-send sessions, queued turns, stream checkpoints, active selection, and recency order.
3. Add New chat, session switch, 100-session blocking, delete, Clear all, and best-effort disclosure.
4. Add Dexie live-query snapshots, per-session Web Locks, epoch guards, and tombstones.

Acceptance: [persistence concurrency cases](./contracts/persistence.md#concurrency-acceptance-cases).

### Layer 3 — personality and context

1. Add settings with blank default, Unicode-aware 1,000-character validation, and global persistence.
2. Add measured visual/text context state and the 75% warning.
3. Add manual and projected-80% compaction using a separate short-lived Prompt API session.
4. Add context detail ranges, overflow recovery, and atomic replacement validation.

Acceptance: [context interface](./contracts/assistant-workspace.md#context-interface) and [compaction contract](./contracts/local-model-adapter.md#compaction-contract).

### Layer 4 — release quality

1. Complete safe Markdown styling, copy feedback, responsive session drawer, follow-scroll, focus restoration, reduced motion, and assistive status behavior.
2. Complete unit/component and production-build Playwright coverage.
3. Run the real-model timing, quality, retention, usability, and disclosure gates on the owner Mac.

Acceptance: [evaluation contract](./contracts/evaluation.md).

## 4. Automated Checks

Implementation adds these focused scripts:

```bash
yarn test:assistant
yarn test:e2e:assistant
```

- `test:assistant` runs Vitest unit, repository, and component tests with jsdom and fake IndexedDB.
- `test:e2e:assistant` runs Playwright against a production build with the fake `LanguageModel` installed before hydration. It covers multi-page IndexedDB/Web Locks behavior as well as layout and accessibility.

Before claiming implementation completion, run every repository gate:

```bash
yarn lint
yarn typecheck
yarn validate:content
yarn test:content
yarn test:assistant
yarn build
yarn test:e2e:assistant
```

A skipped command must be reported with its reason. The fake model is test injection only; no query parameter, user setting, deployed feature flag, or alternate production runtime exposes it.

## 5. Manual Product Walkthrough

Use a dedicated non-sensitive test profile. Do not enter private or production secrets into prompts.

### Preparation and first turn

1. Open `/assistant` and confirm state text appears within one second.
2. If preparation is offered, read the disclosure and activate it.
3. Confirm zero progress is indeterminate, positive progress is determinate when reported, then changes to an indeterminate preparation state until ready.
4. Submit a multi-line prompt. Confirm queued/checking/generating feedback persists until first text.
5. Stop a long response. Confirm partial text remains visibly Stopped.
6. Send a follow-up and confirm it uses the completed prior exchange.
7. Confirm the ready follow-up does not show model-download UI and reuses the active native session until the chat, personality, or compacted context changes.

For a repeatable first-download test, launch Chrome with a fresh temporary `--user-data-dir` as recommended by Chrome's built-in AI documentation. Do not force-unload the model through `chrome://on-device-internals`; that page is useful for observation but can leave the browser's model service in a non-user lifecycle state.

### History and destructive actions

1. Create several sessions and confirm deterministic first-prompt titles and recency order.
2. Reload and restart Chrome; confirm the most recently active saved session and transcript restore.
3. Open the same session in two windows, submit from both, and confirm both prompts appear once, only one generation runs at a time, and both views converge.
4. Delete one session during generation and confirm no stale response recreates it.
5. Save a personality preference, then Clear all. Confirm sessions, transcript, summaries, active reference, and personality are gone only after confirmed success.
6. Exercise the 100-session automated fixture and verify the 101st is blocked with a deletion path.

### Context

1. Grow a fixture conversation below 75%, through 75%, and to projected 80% usage.
2. Confirm visual and text context states agree.
3. Use Compact now; compare transcript text before/after and confirm no visible message changed.
4. Inspect the summary/direct-turn ranges and ask a critical-fact follow-up.
5. Trigger fake overflow/failure in automation and actual overflow when practical; confirm the next turn blocks until a verified rebuild.

### Storage failure

1. Use the deterministic repository failure fixture to fail open, checkpoint, deletion, and Clear all independently.
2. Confirm **Not saved** stays visible and says close/reload will remove the temporary chat.
3. Confirm failed deletion never reports success or claims persistent removal was verified.
4. Reload and confirm the page attempts durable storage again rather than merging temporary and durable history.

## 6. Privacy and Content-Safety Check

After ordinary route assets finish loading:

1. Clear the Network panel.
2. Submit a unique harmless marker in a prompt and use a different marker in personality settings.
3. Exercise generation, title creation, compaction, copy, reload, delete, and Clear all.
4. Confirm neither marker appears in any page request URL, body, header, analytics event, generated resource request, console diagnostic, or server output.
5. Ask the model to emit Markdown containing raw HTML, an image URL, a `javascript:` link, a long code line, and an external HTTPS link.
6. Confirm raw HTML is inert/not rendered, the image never loads, unsafe links are inert, code scrolls locally, and the safe link navigates only after explicit activation.

The Chrome-managed model download is outside the page's request surface; the product must not claim it is part of assistant-data storage or site networking.

## 7. Responsive and Accessibility Check

Run at minimum:

- wide desktop viewport;
- compact desktop viewport;
- narrow/mobile-shaped unsupported viewport;
- 200% browser zoom/reflow;
- `prefers-reduced-motion: reduce`.

For each relevant state, verify no page-level horizontal scrolling, visible keyboard focus, logical order, session-drawer/dialog Escape and focus restoration, labelled composer/progress, non-color state cues, and usable transcript/code overflow. With a screen reader, confirm the status region announces lifecycle transitions but not every streamed chunk.

## 8. Real-Model Release Gate

Follow [contracts/evaluation.md](./contracts/evaluation.md) exactly:

1. Record the exact Chrome, macOS, Mac, origin, availability, date, and Git commit.
2. Run the fixed 20-prompt set with two independent reviewers.
3. Pass at least 16/20 at score 3 or better using the lower reviewer score, with zero critical false-capability claims.
4. Show first generated content within 15 seconds for at least 18/20 ready-model prompts and never leave more than five seconds of ambiguous activity.
5. Run ten context-retention cases and meet the 90% critical-fact threshold without transcript deletion.
6. Record setup, unsupported/failure, multi-window, deletion, disclosure, accessibility, and no-egress evidence.

Report the result as validation on that one device and browser version. Do not generalize it into support for all Chrome installations, operating systems, or future Prompt API revisions.

## 9. Ready for Task Generation

Planning is complete when:

- [research.md](./research.md) has no unresolved clarification;
- [data-model.md](./data-model.md) defines stored, ephemeral, transition, and transaction semantics;
- all four contracts agree on Prompt API, context, storage, concurrency, privacy, and validation behavior;
- [plan.md](./plan.md) passes both constitution checks;
- no implementation task introduces cloud inference, tools, memory beyond saved transcript/context, alternate local runtimes, analytics, or unrelated portfolio redesign.
