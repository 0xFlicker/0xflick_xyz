---
date: 2026-08-22
topic: portable-browser-local-fallback
focus: Broaden /assistant beyond the Chrome Prompt API while keeping inference on-device
mode: repo-grounded
---

# Ideation: Portable browser-local assistant fallback

## Grounding Context

- `/assistant` currently reaches local inference through a provider-neutral `LocalModelAdapter`, while the concrete implementation is limited to Chrome's Prompt API.
- The queue, transcript, persistence, context reconstruction, media privacy boundary, and most workspace UI can remain independent of the inference runtime.
- Existing feature requirements explicitly exclude alternate runtimes. A portable fallback therefore requires a product-scope change, not merely an implementation swap.
- Browser API presence is not enough to claim support. Readiness must cover successful model initialization and a small generation on representative physical devices.
- The fallback may produce substantially worse answers, but it must remain private, honestly disclosed, responsive enough to use, and deterministic about when a turn has been accepted.

## Topic Axes

- Runtime coverage
- Model payload and performance
- Consent and preparation UX
- Privacy, cache ownership, and offline reuse
- Adapter and context architecture
- Media capability

## Ranked Ideas

### 1. Native-first portable ONNX ladder

**Description**

Keep Chrome Prompt API as the preferred provider. When it is unavailable, offer a Transformers.js adapter that selects WebGPU with SmolLM2-360M or WASM with SmolLM2-135M before accepting a turn.

**Axis:** Runtime coverage

**Basis:** Direct and external. The existing adapter seam can host another runtime. Transformers.js and ONNX Runtime Web support WebGPU and broad-browser WASM, and official quantized SmolLM2 browser artifacts exist.

**Rationale:** This is the broadest practical reach with one model family and no cloud inference. WebGPU is an acceleration tier; WASM is the compatibility floor.

**Downsides:** Two weight variants, weak 135M answer quality, and a new model-download/cache lifecycle.

**Confidence:** 91%

**Complexity:** Medium-high

**Status:** Explored

### 2. wllama single-artifact spike

**Description**

Prototype one GGUF model in wllama, using WebGPU layer offload where viable and WASM SIMD otherwise.

**Axis:** Model payload and performance

**Basis:** External. wllama V3 supports worker inference, WebGPU offload, WASM CPU execution, OPFS model management, and streaming.

**Rationale:** A single model artifact and continuous partial offload may be operationally cleaner than backend-specific ONNX variants.

**Downsides:** A younger, faster-moving runtime; cross-origin isolation for multithreaded CPU; and an unproven Safari, Firefox, and mobile device matrix.

**Confidence:** 78%

**Complexity:** Medium-high

**Status:** Unexplored

### 3. Honest model preparation and cache ownership

**Description**

Replace the unsupported dead end with an explicit preparation card showing approximate download size, lower expected quality, execution backend, storage and battery implications, progress, and a Remove installed model action. Self-host immutable weights and support offline reuse after preparation.

**Axis:** Consent, privacy, cache, and offline UX

**Basis:** Direct. The current product already treats model preparation as a user-authorized resource event, and conversation deletion is distinct from model-cache deletion.

**Rationale:** Preserves trust while turning unsupported systems into an opt-in working path.

**Downsides:** Asset hosting cost, browser eviction behavior, cache-version management, and more storage semantics to explain.

**Confidence:** 95%

**Complexity:** Medium

**Status:** Unexplored

### 4. Runtime-aware adapter identity and worker boundary

**Description**

Add a runtime/model descriptor to `LocalModelAdapter`, select the provider before generation, run portable inference in a dedicated worker, and key session and context caches by runtime plus model identity.

**Axis:** Adapter and context architecture

**Basis:** Direct. The workspace already routes inference through `LocalModelAdapter`, but cache identity and UI copy currently assume one Chrome model.

**Rationale:** Keeps queueing, persistence, prompt reconstruction, and transcript behavior stable while preventing context from crossing model/runtime boundaries.

**Downsides:** Availability and progress types need expansion; worker RPC, cancellation, and teardown need careful tests.

**Confidence:** 94%

**Complexity:** Medium

**Status:** Unexplored

### 5. Deterministic tiny-model context policy

**Description**

Use the portable tokenizer for exact context measurement, but use a bounded rolling history window rather than tiny-model-generated compaction on the weakest tier.

**Axis:** Adapter and context architecture

**Basis:** Reasoned. A 135M fallback can count tokens reliably but cannot be trusted to preserve durable facts in recursive summaries.

**Rationale:** Makes degradation predictable and honest instead of fabricating conversational continuity.

**Downsides:** Fallback conversations remember less, and existing compaction UI and contracts need capability-aware wording.

**Confidence:** 88%

**Complexity:** Medium

**Status:** Unexplored

### 6. Text-only first, health check, and real-device matrix

**Description**

Ship the portable fallback as text-only. Before enabling it, inspect backend limits and complete a fixed local-generation health check. Validate Chrome Android, Safari/iOS, Firefox Windows/macOS, and WASM-only paths for memory use, first-token latency, cache reuse, offline behavior, and tab survival.

**Axis:** Media capability and runtime coverage

**Basis:** Direct and reasoned. Current media controls are capability-gated, and successful API detection or model initialization does not prove generation under memory pressure.

**Rationale:** Delivers a small end-to-end layer without multiplying downloads or overclaiming support.

**Downsides:** Preparation takes longer and physical-device acceptance is labor-intensive.

**Confidence:** 96%

**Complexity:** Medium

**Status:** Unexplored

## Rejection Summary

| Candidate | Disposition |
| --- | --- |
| Single 135M model everywhere | Retained only as the CPU tier; it needlessly sacrifices quality on capable GPUs. |
| User-visible engine selector | Defer; automatic pre-turn routing with clear disclosure is simpler for visitors. |
| First-party immutable weights, cache manager, offline reuse | Consolidated into idea 3. |
| Multithreaded WASM headers | Treat as a measured wllama implementation choice, not an independent product direction. |
| Exact tokenizer context measurement | Consolidated into idea 5. |
| Specialist image/audio sidecars | Defer until text fallback works end to end. |
| User-provided GGUF | Enthusiast feature with weak mainstream fallback value. |
| PWA model installation | Adds product surface before normal browser cache persistence is proven insufficient. |
| WebLLM accelerated tier | Strong WebGPU option but does not cover the required CPU/WASM fallback. |
| TensorFlow.js tiny GPT | Technically broad, but makes tokenizer, KV cache, streaming, cancellation, and model conversion application-owned work. |
| No-chat specialist utilities | Could improve tiny-model quality but changes the product instead of extending it. |
| Per-answer fallback label | Repetitive; disclose the active runtime/model globally and in durable turn metadata instead. |

## External Grounding

- [Transformers.js documentation](https://huggingface.co/docs/transformers.js/main/index)
- [ONNX Runtime Web documentation](https://onnxruntime.ai/docs/tutorials/web/)
- [ONNX Runtime browser support matrix](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)
- [SmolLM2-135M-Instruct ONNX artifacts](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct/tree/main/onnx)
- [SmolLM2-360M-Instruct ONNX artifacts](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct/tree/main/onnx)
- [wllama](https://github.com/ngxson/wllama)
- [WebLLM](https://github.com/mlc-ai/web-llm)
