# Concept: Local Assistant as Interactive Portfolio Proof

- **Slug**: on-device-ai-assistant
- **Created**: 2026-08-20
- **Recommended option**: Option B — Bounded Local Assistant Workspace

## Options

### Option A — Guided Single-Conversation Showcase

- **Sketch**: Offer a shareable, takeover-style demonstration where eligible visitors can begin one local conversation, choose from a few representative starting points, observe model readiness and activity, and understand the local-processing and verification boundaries. The experience is deliberately ephemeral: it proves that useful local interaction works without attempting to become a reusable assistant workspace.
- **Appetite**: small (days). This is a budget for proving the core interaction and trust framing, not an implementation estimate.
- **Trade-offs**: Wins speed, focus, and a low-cost way to test whether visitors engage. Sacrifices saved conversations, repeat use, personality customization, and meaningful context control from the stated scope. Because Chrome and other projects already provide playgrounds, it risks looking like a polished platform demo rather than distinctive evidence of AI product judgment.
- **Rabbit holes**: Expanding starter prompts into a full task catalog; polishing a temporary experience until it becomes a hidden workspace; redesigning the portfolio entry experience; adding persistence incrementally without accepting the larger option's appetite.

### Option B — Bounded Local Assistant Workspace

- **Sketch**: Give eligible visitors a dedicated, shareable takeover experience for simple text conversations, with a clear path to start and revisit conversations, bounded browser-local continuity, a user-controlled personality prefix, visible context pressure, and legible preparation, generation, interruption, overflow, and recovery states. Ineligible visitors receive an honest explanation without losing the surrounding portfolio experience. The workspace is intentionally narrower than commercial assistants: its value is the quality of interaction, transparency, and user control.
- **Appetite**: medium (weeks). This budget reflects the breadth of interaction states, persistence expectations, accessibility, evaluation, and device variability; it is not a delivery estimate and remains uncertain until representative-device validation.
- **Trade-offs**: Best matches the stated demonstration goal and the problem definition's trust, context, reliability, and comprehension metrics. It can show product judgment beyond basic prompting while remaining bounded to simple turns. It costs materially more than Option A, reaches only an eligible subset of visitors, inherits variable local-model quality, and creates user expectations around saved history that browser-local storage cannot guarantee absolutely.
- **Rabbit holes**: Chasing feature parity with cloud assistants; turning context handling into a general memory system; adding cloud or cross-browser fallbacks; supporting unlimited history or migration; over-designing personality controls; treating every model error as a bespoke workflow; expanding the work into a broader portfolio redesign.

### Option C — Evidence-Led Case Study, No Custom Assistant

- **Sketch**: Do not build a custom assistant. Publish a concise case study or annotated walkthrough of current browser-native AI capabilities, constraints, and product decisions, optionally directing visitors to an existing external playground for hands-on experimentation. Revisit a custom experience only if portfolio feedback or audience data shows a stronger need.
- **Appetite**: small (days). This preserves the option to invest later and carries no custom assistant product budget.
- **Trade-offs**: Wins reach, accessibility, maintainability, and low platform risk because every visitor can consume the proof. Sacrifices the direct interactive evidence at the center of the stated goal and may reinforce the current problem of asking visitors to trust static claims. External playgrounds cannot demonstrate the creator's own interaction design or failure handling.
- **Rabbit holes**: Allowing the case study to become a disguised implementation plan; reproducing an external playground inside the portfolio; continuously updating editorial material for a changing browser platform without gaining product evidence.

## Recommendation

Recommend **Option B — Bounded Local Assistant Workspace**, with a medium appetite and an explicit validation gate before specification commits to its full boundary. It is the only option that covers the stated session, personality, context, persistence, and activity-feedback scope while also addressing the problem definition's real differentiator: demonstrating judgment about trust, failure, and user control rather than merely invoking a browser model.

Option A is the appropriate fallback if representative-device validation shows that model quality, eligibility, or latency cannot support a credible assistant. Option C remains rational if the owner is unwilling to fund a medium appetite without observed visitor demand. The recommendation therefore depends on validating reach and helpfulness early, and success should be judged against first-interaction completion, evaluated helpfulness, reliability, comprehension, accessibility, and portfolio-impact signals defined in [`problem.md`](./problem.md).

## Out of Scope (for the recommended option)

- Web search, backend content loading, tools, external actions, or autonomous behavior.
- Durable personal memory beyond bounded conversation continuity.
- Accounts, server synchronization, cross-device history, or initial session export.
- Cloud inference fallback or an alternate local-model runtime for unsupported environments.
- Cross-browser, mobile, or ineligible-device inference parity.
- Multimodal input or output and multilingual breadth beyond one validated initial language.
- Unbounded conversation storage or guaranteed persistence against browser clearing and eviction.
- Feature parity with ChatGPT, Claude, Grok, or other commercial assistants.
- Custom model selection, training, fine-tuning, or model-distribution work.
- Unrelated redesign of the portfolio or its existing content architecture.

## Assumptions to Validate

- A meaningful share of the intended portfolio audience can access an eligible Chrome desktop environment, or the eligible subset is strategically valuable despite limited reach.
- Visitors will tolerate the model's preparation delay when progress and purpose are clear.
- The browser-provided model can pass a concise, representative helpfulness and trust-boundary evaluation for simple turns.
- The available model lifecycle and context signals are sufficient to make activity, context pressure, interruption, and recovery understandable.
- Browser-local conversation continuity is valuable even though users or the browser may clear it.
- A personality prefix provides meaningful user control without consuming disproportionate context or confusing the assistant's safety and accuracy boundaries.
- A single initial language is acceptable for the first bounded concept.
- Ineligible visitors can still understand the demonstration's value without running the model and without a cloud fallback.
- The portfolio owner accepts a medium, weeks-sized appetite to achieve differentiation beyond an existing playground.
- The experience's quality and portfolio impact can be evaluated with a defined prompt suite, representative-device checks, accessibility testing, and a small amount of audience feedback.
