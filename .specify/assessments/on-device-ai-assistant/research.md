# Idea Research: On-Device AI Assistant

- **Slug**: on-device-ai-assistant
- **Created**: 2026-08-19
- **Evidence confidence (overall)**: medium

## Users & Demand

- The only direct demand signal supplied for this project is the product owner's stated desire for an interactive portfolio demonstration of AI expertise; no interviews, support requests, analytics, or observed usage were provided. This is a stated want, not behavioral evidence. — [source: `intake.md`](./intake.md) (confidence: high, cited)
- The Prompt API community maintains an open thread soliciting developer use cases, and its explainer characterizes developer feedback as positive, but the reviewed material does not quantify adoption or demand for a general-purpose assistant. — [source: [developer-interest issue](https://github.com/webmachinelearning/prompt-api/issues/74), [Prompt API explainer](https://github.com/webmachinelearning/prompt-api)] (confidence: medium, cited)
- Google reports that Trip.com uses built-in AI for local personalized travel summaries. This is adjacent production evidence for on-device web inference, not evidence that portfolio visitors want a general chat assistant. — [source: [Chrome at Google I/O 2026](https://developer.chrome.com/blog/chrome-at-io26)] (confidence: medium, cited; vendor-reported)
- The likely audience is portfolio visitors evaluating the creator's product and engineering ability. — [ASSUMPTION] (confidence: low)

## Prior Art

- Chrome documents an official Prompt API playground plus web and extension demos, so browser-provided prompting and basic conversational interaction already have platform-owned precedents. — [source: [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api)] (confidence: high, cited)
- The Prompt API itself is an active Web Machine Learning Community Group proposal for a uniform interface to browser-provided language models; its draft exposes system, user, and assistant messages, streaming, session cloning, context accounting, and overflow events. — [source: [Prompt API draft report](https://webmachinelearning.github.io/prompt-api/), [Prompt API repository](https://github.com/webmachinelearning/prompt-api)] (confidence: high, cited)
- WebLLM is an established open-source alternative that performs in-browser inference through WebGPU and exposes OpenAI-style chat completions, streaming, workers, and multiple model families. Unlike Chrome's built-in API, it requires the application to arrange model/runtime delivery and caching. — [source: [WebLLM repository](https://github.com/mlc-ai/web-llm)] (confidence: high, cited)
- A repository-wide text scan found no existing assistant, Prompt API, `LanguageModel`, IndexedDB, or chat-session implementation outside this assessment; current dependencies also contain no AI or browser-database package. — [source: repository scan of `src/`, project configuration, and `.specify/` on 2026-08-19] (confidence: high, cited)
- ChatGPT, Claude, and Grok were named by the product owner as interaction references, but no specific behaviors or comparative evaluation criteria were supplied. — [source: `intake.md`](./intake.md) (confidence: high, cited)

## Market & Context

- Chrome identifies the Prompt API for web pages as stable from Chrome 148 and for extensions from Chrome 138; the linked Chrome Status record corroborates the web feature identity. — [source: [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api), [Chrome Status](https://chromestatus.com/feature/5134603979063296), [Chrome at Google I/O 2026](https://developer.chrome.com/blog/chrome-at-io26)] (confidence: high, cited)
- From Chrome 149, Chrome documents English, Spanish, Japanese, German, and French input/output support for its foundation models. — [source: [built-in AI requirements](https://developer.chrome.com/docs/ai/get-started)] (confidence: high, cited)
- The Prompt API remains a Community Group draft rather than a W3C Standard, despite Chrome shipping it. — [source: [Prompt API draft report](https://webmachinelearning.github.io/prompt-api/)] (confidence: high, cited)
- Mozilla records a negative position based on interoperability concerns; WebKit records an oppose position with interoperability, portability, and privacy concerns. This is strong evidence that a browser-native implementation is Chrome-specific for the foreseeable scope. — [source: [Mozilla standards position](https://github.com/mozilla/standards-positions/issues/1213), [WebKit standards position](https://github.com/WebKit/standards-positions/issues/495)] (confidence: high, cited)
- Chrome states that, after the initial model download, inference can run without a network connection and sends no model input data to Google or another third party. — [source: [built-in AI requirements](https://developer.chrome.com/docs/ai/get-started)] (confidence: high, cited; vendor claim)
- Without this feature, the portfolio continues to describe AI capability rather than demonstrate an interactive AI product. — [ASSUMPTION] (confidence: low)

## Data & Constraints

- Supported foundation-model environments are desktop Windows 10/11, macOS 13+, Linux, and Chromebook Plus at the documented ChromeOS platform level; Android, iOS, and non-Plus ChromeOS devices are not supported. — [source: [built-in AI requirements](https://developer.chrome.com/docs/ai/get-started), [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api)] (confidence: high, cited)
- Chrome's developer requirements specify at least 22 GB free profile-volume storage, either more than 4 GB VRAM or at least 16 GB RAM plus four CPU cores, and an unmetered connection for the initial download. Chrome Help separately says approximately 20 GB, so the sources are directionally aligned but not numerically identical. — [source: [built-in AI requirements](https://developer.chrome.com/docs/ai/get-started), [Chrome Help model management](https://support.google.com/chrome/answer/16961953)] (confidence: high, cited)
- `LanguageModel.availability()` distinguishes `unavailable`, `downloadable`, `downloading`, and `available`; creating a session that needs a download requires meaningful user activation. — [source: [built-in AI requirements](https://developer.chrome.com/docs/ai/get-started), [Prompt API draft report](https://webmachinelearning.github.io/prompt-api/)] (confidence: high, cited)
- Session creation exposes normalized `downloadprogress`; after it reaches completion, extraction and memory loading can still require an indeterminate wait. Prompt responses can stream incrementally, and an `AbortSignal` can cancel prompting. — [source: [model-download UX guidance](https://developer.chrome.com/docs/ai/inform-users-of-model-download), [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api)] (confidence: high, cited)
- Chrome may select a larger model, a smaller model, or CPU inference based on the device. Model updates can change behavior, the installed version is not queryable from JavaScript, and an update swap can cause a prompt to fail. — [source: [built-in model management](https://developer.chrome.com/docs/ai/understand-built-in-model-management)] (confidence: high, cited)
- Chrome can purge the model under storage pressure or changed eligibility, including during a running session; a later `create()` call must trigger re-download. — [source: [built-in model management](https://developer.chrome.com/docs/ai/understand-built-in-model-management)] (confidence: high, cited)
- A live language-model session reports `contextUsage` and `contextWindow`. When a new prompt overflows the window, Chrome normally drops the oldest prompt/response pairs while retaining the system prompt and emits `contextoverflow`; an input that still cannot fit fails with `QuotaExceededError`. — [source: [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api), [Prompt API draft report](https://webmachinelearning.github.io/prompt-api/)] (confidence: high, cited)
- `initialPrompts` can reconstruct prior user/assistant turns after a browser restart, but each live session still consumes browser-managed model resources and should be destroyed when no longer needed. — [source: [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api)] (confidence: high, cited)
- The API is restricted to secure contexts and windows; Chrome currently exposes it to top-level windows and same-origin iframes by default, not Web Workers. — [source: [Prompt API draft report](https://webmachinelearning.github.io/prompt-api/), [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api)] (confidence: high, cited)
- IndexedDB provides asynchronous, same-origin storage for structured data. Browser storage is best-effort by default and may be evicted under storage pressure; private browsing normally clears stored data at session end. `localStorage` is synchronous and capped at 10 MiB, making session count alone an inadequate storage-capacity measure. — [source: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)] (confidence: high, cited)
- No latency, throughput, response-quality, context-size, session-size, or eligible-visitor measurements exist for this application yet. — [source: `intake.md` and repository scan](./intake.md) (confidence: high, cited absence)

## Evidence Against the Idea

- The eligible audience excludes mobile users, non-Chrome browsers, and many desktop devices; the download/storage requirements create a substantial activation barrier even among supported Chrome users. — [source: [built-in AI requirements](https://developer.chrome.com/docs/ai/get-started), [Mozilla position](https://github.com/mozilla/standards-positions/issues/1213), [WebKit position](https://github.com/WebKit/standards-positions/issues/495)] (confidence: high, cited)
- A generic local chat interface is not novel by itself because Chrome ships a Prompt API playground and WebLLM supplies an open-source browser chat stack. Distinctiveness therefore depends on product execution and demonstrable insight, not merely local inference. — [source: [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api), [WebLLM repository](https://github.com/mlc-ai/web-llm)] (confidence: medium, cited inference)
- The current evidence does not show that portfolio visitors will wait for a model download or prefer an embedded assistant over the site's existing content. — [ASSUMPTION based on missing user research] (confidence: low)
- Model selection, updates, CPU/GPU paths, purges, and mid-swap failures make performance and output quality device-dependent and capable of changing without an application release. — [source: [built-in model management](https://developer.chrome.com/docs/ai/understand-built-in-model-management)] (confidence: high, cited)
- Error-triggered compaction alone would be too late for ordinary overflow because Chrome automatically removes old turn pairs before raising `QuotaExceededError`; context behavior must account for the earlier `contextoverflow` path. — [source: [Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api)] (confidence: high, cited inference)
- Browser-only history is not guaranteed durable: users can clear it, private mode removes it, and best-effort storage can be evicted. — [source: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)] (confidence: high, cited)
- No evaluated concise system prompt or task suite currently supports the claim that the small local model will be broadly helpful; the always-visible verification disclaimer mitigates expectation risk but is not evidence of quality. — [source: `intake.md`](./intake.md) (confidence: high for evidence gap, cited)

## Gaps & Open Questions

- [NEEDS CLARIFICATION: What share of current portfolio visitors use an eligible Chrome desktop environment, and how many have the model already available?]
- [NEEDS CLARIFICATION: What user research or task evidence would demonstrate that visitors want to use this assistant rather than inspect a guided demo?]
- [NEEDS CLARIFICATION: Which route and discovery affordance should provide the shareable takeover experience, and what non-eligible visitors should see?]
- [NEEDS CLARIFICATION: Is the initial language contract English-only, or must the experience support all five documented Chrome 149 languages?]
- [NEEDS CLARIFICATION: What benchmark prompt set, correctness rubric, safety rubric, and minimum quality threshold define “helpful” for the local model?]
- [NEEDS CLARIFICATION: What are measured time-to-first-token, generation rate, download duration, context-window size, and failure rates across representative eligible CPU and GPU devices?]
- [NEEDS CLARIFICATION: Should product-managed compaction summarize history before Chrome's automatic eviction, and how will the summary itself be evaluated for lost or distorted context?]
- [NEEDS CLARIFICATION: Should personality be global or per session, and should its limit be based on measured context usage rather than a fixed character count?]
- [NEEDS CLARIFICATION: Should the session cap be 50, 100, or storage-budget-based; what happens at the cap; and is export required?]
- [NEEDS CLARIFICATION: Should the application request persistent browser storage, and how will it explain that local history can still be cleared or evicted?]
- [NEEDS CLARIFICATION: Which model lifecycle states, download/extraction phases, streaming state, cancellation state, overflow event, and recovery actions must the UI expose?]
- [NEEDS CLARIFICATION: What accessibility and comprehension testing will validate the always-visible local-inference and double-check-results disclaimer?]

## Sources

All external pages below were fetched read-only without redirects through validated public addresses.

- https://developer.chrome.com/docs/ai/prompt-api (host: `developer.chrome.com`, policy: confirmed-by-user)
- https://developer.chrome.com/docs/ai/get-started (host: `developer.chrome.com`, policy: confirmed-by-user)
- https://developer.chrome.com/docs/ai/inform-users-of-model-download (host: `developer.chrome.com`, policy: confirmed-by-user)
- https://developer.chrome.com/docs/ai/understand-built-in-model-management (host: `developer.chrome.com`, policy: confirmed-by-user)
- https://developer.chrome.com/blog/chrome-at-io26 (host: `developer.chrome.com`, policy: confirmed-by-user)
- https://chromestatus.com/feature/5134603979063296 (host: `chromestatus.com`, policy: confirmed-by-user)
- https://webmachinelearning.github.io/prompt-api/ (host: `webmachinelearning.github.io`, policy: confirmed-by-user)
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria (host: `developer.mozilla.org`, policy: confirmed-by-user)
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API (host: `developer.mozilla.org`, policy: confirmed-by-user)
- https://support.google.com/chrome/answer/16961953 (host: `support.google.com`, policy: confirmed-by-user)
- https://github.com/webmachinelearning/prompt-api (host: `github.com`, policy: allowlisted)
- https://github.com/webmachinelearning/prompt-api/issues/74 (host: `github.com`, policy: allowlisted)
- https://github.com/mozilla/standards-positions/issues/1213 (host: `github.com`, policy: allowlisted)
- https://github.com/WebKit/standards-positions/issues/495 (host: `github.com`, policy: allowlisted)
- https://github.com/mlc-ai/web-llm (host: `github.com`, policy: allowlisted)
- [`intake.md`](./intake.md) (local assessment artifact)
- Repository scan of `src/`, project configuration, and `.specify/` on 2026-08-19 (local system evidence)
