# Decision: Proceed with a Bounded Local Assistant

- **Slug**: `on-device-ai-assistant`
- **Decision date**: 2026-08-20
- **Verdict**: **Go**
- **Reviewed**: `intake.md`, `research.md`, `problem.md`, `concept.md`, and the project constitution

## Scorecard

| Criterion | Rating | Assessment |
| --- | --- | --- |
| Problem validity | Adequate | The portfolio currently asks visitors to infer AI product capability from static claims. An interactive demonstration directly addresses that gap, although its effect on visitor trust and engagement has not yet been measured. |
| Evidence strength | Adequate | Current Chrome documentation provides strong evidence that the core browser capabilities and lifecycle signals exist. Evidence of audience demand is limited to the product owner's strategic objective and adjacent examples, so this is sufficient for a portfolio experiment rather than a broader market claim. |
| Value versus inaction | Adequate | A useful, transparent local assistant could provide differentiated proof of AI product judgment. The value remains strategically plausible rather than quantified; inaction carries an opportunity cost, not a demonstrated business loss. |
| Feasibility and appetite | Adequate | Option B is credible within a medium, weeks-scale appetite using browser-provided inference, storage, and lifecycle APIs. Representative-device validation and a model-quality evaluation remain necessary. |
| Strategic fit | Strong | The concept directly supports the portfolio's positioning and fits the constitution's emphasis on a smallest working end-to-end layer, durable simplicity, and verifiable claims. |
| Risk posture | Adequate | Eligibility, model availability, latency, model quality, context pressure, and browser-storage durability are identified and bounded. Their mitigations still need to become explicit acceptance and failure-handling criteria in the feature specification. |

## Verdict and Rationale

Proceed to specification with **Option B: Bounded Local Assistant Workspace**.

There is enough technical evidence, a valid strategic problem, and a suitably bounded concept to justify specifying the feature. This decision does **not** establish broad visitor demand, universal device support, production-grade model quality, or parity with hosted assistants. It funds a focused portfolio demonstration whose limitations are part of the experience rather than hidden.

The specification should retain an early validation gate for browser eligibility, first-model preparation, representative-device latency, and evaluated response quality. If those checks cannot support the workspace credibly, reduce the product to Option A's guided single-conversation showcase. Do not introduce a cloud inference fallback, alternate browser runtime, or parallel implementation.

## Specification Handoff

### Problem to solve

Portfolio visitors currently have no direct way to experience the owner's AI product and interaction-design capability. Eligible visitors should be able to use a transparent, browser-local assistant that demonstrates sound handling of inference, context, persistence, limitations, and failure states.

### Chosen concept and appetite

Build a dedicated, easy-to-share takeover experience for a bounded local assistant. The appetite is **medium: weeks, not months**.

### In scope

- Simple text conversation turns using Chrome's available on-device AI capability.
- A discoverable, shareable assistant URL and a dedicated takeover interface.
- Multiple browser-local sessions, new chats, revisiting chats, individual deletion, and clear-all deletion.
- A realistic bounded session limit, provisionally 50–100 sessions.
- A blank-by-default, browser-persisted personality prompt prefix editable in settings and subject to a defined size limit.
- Visible context pressure and understandable context-control or compaction behavior.
- Honest feedback for availability checks, model preparation or download, prompting, streaming, cancellation, completion, interruption, context overflow, and recoverable failure states where the browser exposes them.
- An always-visible explanation that inference is local, capabilities are limited, and important answers should be double-checked.
- A clear, trustworthy experience for unsupported, unavailable, or model-preparation-failed environments.
- Accessibility, representative-device validation, and a small response-quality evaluation suite.

### Out of scope

- Web search, backend content loading, or other tools.
- Durable memory beyond active conversation context and browser-local session history.
- Accounts, synchronization, cloud persistence, or session export.
- Cloud inference fallback, alternate local runtimes, unsupported-browser inference, or mobile support.
- Multimodal input, autonomous actions, custom model training, or hosted-assistant feature parity.
- Multilingual support beyond one initial language.
- Unbounded browser storage or unrelated portfolio redesign.

### Success evidence to define in the specification

- Eligible visitors can reach the assistant and complete a first useful turn.
- Preparation, generation, cancellation, and failure states remain understandable without implying that work is happening when it is not.
- A representative prompt suite meets a defined helpfulness and honesty threshold on supported test devices.
- Session creation, restoration, individual deletion, and clear-all deletion behave reliably within the selected cap.
- Context pressure and compaction are visible and preserve enough continuity to support simple turns.
- Unsupported visitors understand the device/browser limitation and retain trust in the demonstration.
- Keyboard, focus, screen-reader, contrast, reduced-motion, and responsive-layout checks pass for the complete flow.
- The demonstration produces a defined portfolio-impact signal rather than relying only on subjective polish.

### Questions carried into specification and clarification

1. Who is the primary portfolio audience, and which visitor behavior will count as evidence that the demonstration improves credibility?
2. Where is the entry point, what is the final shareable route, and how much of the takeover remains visible when local AI is unavailable?
3. What is the initial supported language?
4. Which prompt suite, scoring rubric, and minimum quality threshold define a helpful simple turn?
5. Which representative devices and preparation, first-feedback, token-stream, and completion-time thresholds define acceptable performance?
6. How will context capacity be measured, visualized, and compacted when capacity signals are available, unavailable, or contradicted by an inference error?
7. Is the personality prefix global or session-specific, what exact character limit applies, and how is its effect explained to users?
8. What exact session cap, eviction behavior, storage-failure behavior, and local-data durability language apply?
9. Which browser lifecycle and failure states can be distinguished reliably, and what recovery action belongs to each state?
10. What exact disclaimer, accessibility acceptance criteria, analytics boundary, and portfolio-impact target apply?

## Next Step

Run `$speckit-specify` for `on-device-ai-assistant`, using this handoff as the feature boundary. Follow with `$speckit-clarify` before planning so the quality, performance, context, storage, discovery, and measurement thresholds become testable requirements.
