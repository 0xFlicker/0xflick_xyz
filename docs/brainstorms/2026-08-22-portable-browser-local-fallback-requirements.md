---
date: 2026-08-22
topic: portable-browser-local-fallback
---

# Portable Browser-Local Assistant Fallback

## Summary

Extend `/assistant` with a top-left model selector and a native-first local inference ladder that works on modern mobile browsers. Compatible visitors can prepare, select, and switch among the actual models their device can run without sending conversation content to a server.

---

## Problem Frame

The current assistant works only when Chrome exposes an eligible built-in model. Everyone else receives an explanatory dead end even when their browser could run a small model through WebGPU or WebAssembly.

This makes the shared assistant route least useful on mobile devices, where portfolio links are commonly opened. The fallback does not need to match the built-in model's quality or speed. It needs to complete real, private, local text turns.

---

## Key Decisions

- **Native-first model ladder.** A new chat chooses the strongest runnable model in this order: Chrome built-in, SmolLM2 360M through WebGPU, then SmolLM2 135M through WASM. The portable model family uses Transformers.js with ONNX Runtime Web unless planning uncovers a blocking incompatibility.
- **Visible model control.** The model selector sits at the top-left of the assistant content and names the actual model and backend, such as `SmolLM2 360M · WebGPU`.
- **Current-device catalog.** The selector includes only models the current device can run or prepare. It does not display a disabled universal catalog.
- **Switchable conversations.** A visitor may switch models within one chat after confirmation. The transcript records the model boundary, while individual assistant messages remain unlabeled.
- **Best-effort downgrade continuity.** Before a deliberate downgrade, the current model attempts to compact the existing context. If that fails, the new model receives the newest turns that fit without a separate error or technical explanation.
- **No application timeout.** Model preparation, health checks, and generation may continue for as long as the browser allows. The visitor retains an explicit stop action.
- **Separate content and model storage.** Clearing conversations and settings does not remove downloaded model assets. Portable models have separate removal controls.

---

## Requirements

**Discovery and selection**

- R1. The assistant must expose a model selector at the top-left of the assistant content.
- R2. The selector must list every supported model the current environment can run or explicitly prepare and must omit incompatible models.
- R3. Each selector entry must show the actual model identity and execution backend rather than only a product-tier nickname.
- R4. A new chat must automatically select the strongest currently runnable model in the order Chrome built-in, SmolLM2 360M with WebGPU, then SmolLM2 135M with WASM.
- R5. Automatic initial selection must not begin a portable model download without visitor confirmation.
- R6. A model must not be presented as ready until it has loaded and completed a minimal local generation health check on the current device.

**Preparation and local execution**

- R7. Selecting an uninstalled portable model must open one preparation confirmation that identifies the model, backend, approximate download size, and lower expected capability before any download begins.
- R8. Preparation must expose meaningful progress or an indeterminate working state without imposing an application-generated timeout.
- R9. Portable tokenization and generation must run off the main UI thread so the assistant remains operable while the model works.
- R10. Prompt text, responses, context summaries, settings, session titles, and media must remain on the visitor's device during portable inference.
- R11. Network activity during preparation may retrieve public runtime and model assets but must never include conversation content.
- R12. A portable model must remain available for reuse after successful preparation while its browser-managed assets remain present.

**Conversation and switching**

- R13. A ready portable model must support multi-turn text conversation, incremental output when available, stopping, terminal failure states, copying, and the existing local transcript behavior.
- R14. A visitor may request a model switch only when no turn is actively generating.
- R15. Every model switch must require visitor confirmation, including a switch proposed after a readiness or generation failure.
- R16. The assistant must never switch models silently, replay an accepted prompt automatically, or replace partial output with another model's response.
- R17. A completed switch must add one durable transcript boundary naming the newly active model and must not label each assistant response.
- R18. The new model must receive as much existing conversation context as its own context window can fit.
- R19. Before switching to a less capable model, the confirmation must briefly warn that answer quality and conversation memory may degrade.
- R20. Before a deliberate downgrade, the current model must make one best-effort context-compaction attempt when it remains usable.
- R21. If downgrade compaction fails, switching must continue with the newest context that fits and must not expose a separate compaction failure notice.
- R22. If a requested model cannot become ready, the previously active model and accepted transcript must remain unchanged.

**Model capabilities and media**

- R23. Portable models in this release must be text-only.
- R24. Selecting a portable model must remove image and audio submission controls without removing existing media records from the visible transcript.
- R25. A portable model must not receive raw media or imply that it can inspect media from an earlier model boundary.
- R26. Existing native-model image and audio behavior must remain available when the active model reports those capabilities.

**Storage and removal**

- R27. Clearing all assistant conversations and settings must preserve downloaded model assets.
- R28. Each installed portable model must provide a separate removal action with confirmation.
- R29. Removing a portable model must not delete or rewrite conversations created with that model.
- R30. Removing the active model must not trigger an automatic model switch or replay; the visitor must confirm another available model before the next turn.
- R31. The UI must distinguish browser storage eviction or missing assets from an intentional conversation deletion.

**Failure behavior and usability**

- R32. Preparation, health checks, compaction, and generation must not fail solely because an application timer elapsed.
- R33. A visitor must be able to stop waiting on preparation or stop an active generation without deleting the model cache or completed transcript content.
- R34. Browser termination, resource exhaustion, unsupported operations, corrupt assets, and explicit visitor cancellation must produce a stable recoverable state without cloud or synthetic inference.
- R35. A failed readiness check may recommend another compatible model but must wait for visitor confirmation before changing the selection.
- R36. Model work must expose an understandable active state without presenting internal runtime diagnostics or lengthy technical recovery instructions.

---

## Key Flows

- F1. First portable turn
  - **Trigger:** A visitor opens a new chat where the Chrome built-in model is unavailable.
  - **Steps:** The selector chooses the strongest compatible portable model, requests preparation consent if needed, completes local readiness work, and enables text input.
  - **Outcome:** The visitor receives a real locally generated response and the selected model remains reusable.
  - **Covered by:** R2-R13, R32-R36

- F2. Manual model switch
  - **Trigger:** A visitor opens the selector while the chat is idle and chooses another compatible model.
  - **Steps:** The assistant presents one confirmation, prepares the model if necessary, carries forward the best available context, and records one model boundary.
  - **Outcome:** Subsequent turns use the selected model without relabeling earlier or later responses.
  - **Covered by:** R14-R22

- F3. Downgrade with constrained context
  - **Trigger:** A visitor switches from a stronger model to one with a smaller usable context window.
  - **Steps:** The confirmation gives one concise degradation warning, the current model attempts compaction, and the new model receives the compacted context or newest turns that fit.
  - **Outcome:** The switch completes without a technical failure dump; the visible transcript remains intact.
  - **Covered by:** R18-R22

- F4. Model failure
  - **Trigger:** The selected model fails readiness or generation.
  - **Steps:** The assistant preserves accepted content, identifies the failure, and may offer another compatible model without selecting it.
  - **Outcome:** The visitor chooses whether to switch, retry, stop, or leave; no turn is replayed automatically.
  - **Covered by:** R15-R16, R22, R32-R36

- F5. Clear conversations or remove a model
  - **Trigger:** A visitor clears assistant data or separately removes an installed portable model.
  - **Steps:** Conversation clearing removes its confirmed content scope while retaining model assets; model removal removes only the confirmed model assets.
  - **Outcome:** The two destructive actions remain independent and report their actual result.
  - **Covered by:** R27-R31

---

## Acceptance Examples

- AE1. Portable generation on mobile
  - **Covers R2-R13.**
  - **Given** a representative current iPhone or iPad running Safari, or an Android device running Chrome, with at least one compatible portable runtime
  - **When** the visitor confirms preparation and submits a text prompt after readiness completes
  - **Then** the device produces a non-empty local response without conversation content appearing in network requests.

- AE2. No silent fallback
  - **Covers R15-R16, R22, R35.**
  - **Given** WebGPU readiness fails while another compatible model is available
  - **When** the assistant proposes the alternative
  - **Then** the active model does not change until the visitor confirms, and no accepted prompt is replayed.

- AE3. Indefinite local work
  - **Covers R8, R32-R33, R36.**
  - **Given** a slow device continues preparing or generating without a browser error
  - **When** an arbitrary amount of application time passes
  - **Then** the work continues with an understandable active state until it completes or the visitor stops it.

- AE4. Context downgrade
  - **Covers R17-R21.**
  - **Given** a long conversation on a stronger model
  - **When** the visitor confirms a switch to a smaller model and compaction fails
  - **Then** one model boundary appears, the newest context that fits is used, and no per-response labels or compaction error notice appear.

- AE5. Native media history after portable switch
  - **Covers R23-R26.**
  - **Given** an existing transcript contains image or audio input handled by a capable native model
  - **When** the visitor switches to a text-only portable model
  - **Then** the prior media remains visible, media submission controls become unavailable, and later turns cannot access the prior raw media.

- AE6. Independent deletion scopes
  - **Covers R27-R31.**
  - **Given** saved conversations and one installed portable model
  - **When** the visitor clears all assistant data
  - **Then** conversations and settings are removed while the portable model remains installed and separately removable.

---

## Success Criteria

- A representative current iPhone or iPad running Safari can prepare a compatible listed model and complete a non-empty local text turn.
- A representative current Android device running Chrome can prepare a compatible listed model and complete a non-empty local text turn.
- Existing eligible desktop Chrome behavior continues to complete native text and supported media turns.
- Portable inference produces no network request containing prompt, response, transcript, context, personality, title, or media content.
- Every tested model switch creates exactly one boundary, requires confirmation, and causes no automatic prompt replay.
- No preparation, readiness, compaction, or generation test fails because of an application-generated timeout.
- Quality scores, token speed, and fixed first-token latency are not shipping gates for the portable models.

---

## Scope Boundaries

**Deferred for later**

- Portable image and audio models
- User-imported model files
- An installable PWA or explicit offline guarantee
- A full catalog containing models the current device cannot run
- Model benchmarks, recommendations based on answer quality, and user-facing quality scores

**Outside this product's identity**

- Cloud inference or server-side prompt processing
- Synthetic answers that imitate local generation
- Silent model changes or automatic replay of accepted prompts
- Per-response model badges

---

## Dependencies and Assumptions

- Modern mobile means representative current iPhone/iPad Safari and Chrome Android devices, not every historical device that implements JavaScript or WASM.
- Runtime support is determined from current-device capability and successful local readiness, not user-agent promises alone.
- Browsers and operating systems may terminate long-running work or evict cached assets; the application itself adds no timeout.
- Existing session, transcript, queue, accessibility, local persistence, and one-shot media privacy contracts remain in force unless this document changes them explicitly.
- `specs/001-on-device-ai-assistant/spec.md` and `specs/002-assistant-media-input/spec.md` currently prohibit alternate local runtimes and mobile inference; those exclusions must be superseded before implementation.
- Model artifact hosting and cache implementation are planning decisions, provided conversation content never accompanies asset requests.

---

## Sources

- `docs/ideation/2026-08-22-portable-browser-local-fallback.md`
- `specs/001-on-device-ai-assistant/spec.md`
- `specs/002-assistant-media-input/spec.md`
- [Transformers.js documentation](https://huggingface.co/docs/transformers.js/main/index)
- [ONNX Runtime Web documentation](https://onnxruntime.ai/docs/tutorials/web/)
- [ONNX Runtime browser support](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)
- [SmolLM2-135M-Instruct ONNX artifacts](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct/tree/main/onnx)
- [SmolLM2-360M-Instruct ONNX artifacts](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct/tree/main/onnx)
