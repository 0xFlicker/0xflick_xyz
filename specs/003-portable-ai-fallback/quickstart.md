# Quickstart: Portable Browser-Local AI Fallback

## Prerequisites

- Dependencies installed in the Flicking checkout.
- Secure-context `/assistant` build (`localhost` is acceptable for local development).
- Browser storage/cache available for portable model preparation.
- Deterministic fake catalog/worker fixtures for routine tests.
- At least one owner-controlled environment exposing WebGPU for the 360M proof and one exposing Worker + WebAssembly for the 135M proof. These may be the same computer and do not form a release allowlist.

The first real preparations transfer roughly 386 MB for the 360M q4 weight or 181 MB for the 135M q4 weight, plus tokenizer, config, and runtime assets. Use the UI's ModelRegistry-derived total as the actual expected transfer.

## Smallest working-layer sequence

Implementation should remain green after each layer:

1. **WASM local turn**: fixed catalog, worker protocol, 135M prepare/readiness, text-only first turn, stop, and no-egress proof.
2. **Native-first catalog**: route the current Prompt API adapter and 135M worker through one selector/controller without changing the queue/transcript path.
3. **Accelerated tier**: add the pinned 360M WebGPU descriptor through the same worker contract and prove its real readiness/turn.
4. **Durable switching**: add v3 schema, intent ordering, boundaries, target-fit context, and cross-window convergence.
5. **Asset management**: add exact model removal and verify conversation/model deletion scopes.

Do not hide incomplete layers behind a feature flag. Each layer must be a working coherent implementation before the next expands it.

## Deterministic verification

During implementation run the focused assistant suite:

    yarn test:assistant

Add or extend coverage in these areas:

- `tests/unit/assistant/modelCatalog.test.ts`
- `tests/unit/assistant/portableWorkerClient.test.ts`
- `tests/unit/assistant/modelAssets.test.ts`
- `tests/unit/assistant/modelSelection.test.ts`
- `tests/unit/assistant/modelContextSwitch.test.ts`
- `tests/unit/assistant/modelSessionCache.test.ts`
- `tests/unit/assistant/dexieRepository.test.ts`
- `tests/component/assistant/modelSelector.test.tsx`
- existing availability, conversation, media, context, settings, and accessibility component suites
- `tests/e2e/assistant-model-selection.spec.ts`
- `tests/e2e/assistant-portable-privacy.spec.ts`
- existing assistant lifecycle/concurrency/context/media/persistence/privacy suites

The fake catalog/worker scenarios must prove:

1. Catalog order and structural offering without browser/device allowlists.
2. Measured and indeterminate preparation, non-whitespace readiness, whitespace/failure rejection, and no application timeout.
3. Text streaming, partial-output stop, worker termination/reconstruction, and stale attempt-event rejection.
4. Portable text-only capability while native media remains unchanged and historical media stays UI-only.
5. Initial selection without automatic portable transfer.
6. Confirmation before every requested/recommended switch and exactly one boundary per successful activation.
7. Latest-confirmed revision winning when an older model prepares more slowly in another window.
8. Prompt acceptance versus model-intent races and immutable turn model binding.
9. Ready/unavailable/downloadable/removed reopen behavior, including intentional-removal suppression.
10. Successful source-model compaction and failed-compaction newest-complete-turn fallback measured by the target tokenizer.
11. No current-prompt/partial-turn truncation and no response model badges.
12. Clear all preserving assets; remove model preserving conversations; eviction/partial cache detected from actual files.
13. No prompt, response, context, personality, title, session identifier, or media content in asset requests, BroadcastChannel messages, logs, or URLs.
14. No-lock/CAS behavior: second windows cannot checkpoint another attempt, explicit takeover invalidates stale writes, and opening a page does not blanket-interrupt a live media owner.

## Repository checks

Before implementation completion run:

    yarn lint
    yarn typecheck
    yarn validate:content
    yarn test:content
    yarn test:assistant
    yarn build
    yarn test:e2e:assistant

`yarn build` is specifically responsible for catching Next.js module-worker, Transformers.js, WebGPU/WASM asset, and client-bundle integration errors. Playwright must exercise representative desktop and narrow/mobile sizes. Test-runner time limits are harness controls only; application code must contain no preparation, readiness, compaction, or generation deadline.

## Real portable-runtime acceptance

Record this evidence separately from fake-worker and Playwright results. It proves the pinned runtime/model pair, not blanket browser/device support.

### SmolLM2 135M · WASM

1. Use a secure page where the selector offers the WASM entry.
2. Confirm the dialog names `SmolLM2 135M`, `WASM`, the ModelRegistry-derived total, and lower expected capability before any model request starts.
3. Observe preparation for as long as needed. Verify measured progress when totals exist, otherwise an indeterminate active state; confirm no app-generated timeout.
4. Verify readiness requires non-whitespace local generation.
5. Submit a unique text marker and receive non-whitespace streamed/terminal output.
6. Stop a second generation and verify partial output follows the existing terminal rule without model switch/replay.
7. Reload and verify cached assets are reused, then remove the model and verify its files are absent while the conversation remains.

### SmolLM2 360M · WebGPU

Repeat the same flow in an environment exposing WebGPU. Additionally:

- verify the worker selected the exact pinned 360M q4 WebGPU runtime;
- force or observe model-session/resource failure and confirm the model never claims ready;
- confirm the UI recommends, but does not activate, an alternative without confirmation.

### Browser built-in regression

In an environment where the Prompt API is eligible:

- verify it remains first-ranked and uses the existing prepare/readiness path;
- complete text and supported media journeys;
- switch to/from a portable model and verify native sessions cannot survive the runtime-identity mismatch;
- verify no raw historical media or attachment label enters portable reconstruction.

## Multi-window acceptance

1. Open the same saved chat in two windows.
2. Confirm a slow/unprepared model in window A, then confirm another model in window B.
3. Verify B's higher durable request revision wins even if A finishes later; all pages converge and stale A cannot add a boundary.
4. Race prompt acceptance against switch confirmation; verify exactly one commits and the other preserves its draft/actionable state.
5. Reopen an externally unavailable model in both windows with one already-ready fallback; verify one CAS boundary and no fallback chain.
6. Remove the active model; reopen and verify no automatic replacement until a new explicit confirmation.
7. Run without Web Locks when the test harness can suppress them; verify repository CAS prevents duplicate writes and explicit recovery replaces, rather than mutates/replays, a stale attempt.

## Extended-work and no-timeout acceptance

Run at least ten observations lasting ten minutes or more across preparation, readiness, compaction, and generation. While each operation remains alive:

- the page shows an active state;
- navigation/status/stop remain operable;
- no application timer converts it to failure;
- browser/OS termination is reported as an external failure with a concise next action;
- stopping is user-driven and does not delete completed transcript or installed assets.

## Network privacy inspection

Use unique canary values for prompt, personality, title, context, and local media history. Inspect URL, method, request headers, and request body for every request during preparation and inference.

Allowed during confirmed preparation:

- pinned Hugging Face model/config/tokenizer files;
- pinned/bundled Transformers.js/ONNX runtime assets.

Forbidden at all times:

- canary values or session/turn IDs in any request;
- prompt/response/context/media/title/personality telemetry;
- server or cloud inference;
- remote media conversion;
- asset download before confirmation.

After readiness, a portable prompt/compaction/generation must create no application network request.

## Completion evidence

Report these tiers independently:

1. deterministic unit/component repository results;
2. production build and fake-runtime Playwright results at desktop/narrow sizes;
3. exact real 135M WASM result;
4. exact real 360M WebGPU result;
5. native Prompt API regression result;
6. any observed current-device readiness failures, without converting them into ecosystem gates.

Answer quality, token speed, and fixed first-token latency are observations only and never release gates. A readiness failure on one observed environment is recorded as that environment's result; it does not remove the structurally offered model or become a browser/device allowlist.

## Recorded implementation evidence — 2026-08-23

### Deterministic and production-build tier

- `yarn lint`: pass with no warnings or errors.
- `yarn typecheck`: pass.
- `yarn validate:content`: pass across 100 source files, 120 public text files, and 9 discovered routes.
- `yarn test:content`: 5/5 pass.
- `yarn test:assistant`: 31 files and 138 tests pass.
- `yarn test:e2e:assistant`: production build passes; 62 desktop/narrow browser tests pass and 6 opt-in real/extended tests skip in the routine suite.
- The production build emits `/assistant` and the portable module worker/runtime assets. Next.js reports the upstream Transformers.js `import.meta` warning, but compilation, static generation, and browser runtime loading complete.

### Controlled browser tier

- The dedicated two-tier privacy journey completes 20 turns per desktop/narrow run (40 observed turns total). Unique prompt canaries and local output are absent from request URLs, headers, bodies, and console logs.
- Latest-confirmed-wins, no-Web-Lock CAS, queued-as-busy behavior, no replay, ready fallback, downloadable-only reopen, intentional-removal suppression, Clear all/model-cache separation, active/inactive removal, and cross-window invalidation pass at desktop and narrow widths.
- Controlled Prompt API text, image, audio, one-shot media, context, compaction, persistence, accessibility, and no-egress regressions pass at both widths. This is automated native-adapter evidence, not a claim that the test runner exposes a production Prompt API installation.

### Exact real-runtime tier

- **SmolLM2 135M q4 · WASM**: pass in an owner-controlled Chromium run. The pinned model completed preparation, non-whitespace readiness, a unique non-empty local turn, user-driven stop with preserved partial output, reload/cache reuse without a model-body transfer, exact model removal, preserved transcript, and no post-readiness inference request. The journey completed in 58.9 seconds (1.0-minute suite).
- **SmolLM2 360M q4 · WebGPU**: this machine exposes the structural WebGPU surface, so the model remained offered and the pinned pair was attempted. The current environment reached a truthful terminal readiness failure; it never claimed ready, exposed no composer, wrote no boundary, and left the 135M alternative available for explicit selection. The revised acceptance journey passed in 51.2 seconds (52.6-second suite). This is a current-environment result, not a WebGPU/browser support claim or a catalog gate.

### Extended no-timeout tier

- Ten simultaneous portable generations remained active for 10.0 minutes with visible `Response started` state, operable model selector, and enabled Stop controls. All ten then stopped by visitor action and preserved partial local output. The opt-in run passed in 604.6 seconds; no application-generated timeout, fallback, or replay occurred.
