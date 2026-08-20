# Contract: Verification and Evaluation

**Purpose**: Separate deterministic implementation evidence from bounded real-model quality and performance evidence.  
**Compatibility claim**: Shipping is gated only on the project owner's current supported Mac in secure-context Chrome 148+ with a ready eligible model.

## Evidence Classes

| Class | Environment | Proves | Does not prove |
|-------|-------------|--------|----------------|
| Unit/component | Vitest, jsdom, Testing Library, fake IndexedDB/model | Pure policy, state, rendering, validation, failure mapping, repository behavior | Browser locking, real model behavior, compatibility |
| Browser automation | Production Next.js build in Playwright Chromium with fake model | Routing, hydration, IndexedDB, multi-page locks, responsive interaction, accessibility, no app network egress | Real Prompt API quality, download eligibility, device timing |
| Real-model acceptance | Owner's current Mac and stable supported Chrome | Current device eligibility, actual setup/stream/context behavior, bounded response timing and quality | Other operating systems, devices, future Chrome releases, all prompts |

Test reports must name the evidence class. A fake-model pass must never be described as on-device-model validation.

## Automated Test Matrix

### Unit and repository

- Fixed-prompt order and personality delimiters cannot override governing guidance.
- Unicode code-point personality limit accepts 1,000 and rejects 1,001 without replacing saved content.
- Deterministic title derivation, duplicate titles, session recency ordering, and the 100/101 cap.
- Context thresholds at below 75%, exactly 75%, below 80%, exactly 80%, unknown measurements, and explicit overflow.
- Compaction turn selection retains recent turns, preserves critical-fact fixtures, rejects empty/oversize summary, and keeps the prior state on revision conflict.
- Model error normalization and create/stream/destroy lifecycle, including abort/completion races.
- Atomic prompt creation, stream checkpoints, terminal immutability, tombstone/epoch stale-write rejection, settings scope, individual delete, and Clear all.
- Memory repository parity and the one-way durable-to-temporary transition.

### Component

- Every environment, preparation, generation, storage, context, and failure state has current-state text and an applicable next action.
- First action acknowledgment occurs within one second under fake timers.
- Streaming updates visually without announcing every chunk; state transitions use the status region.
- Composer validation, duplicate submission prevention, queued and active Stop, copy success/failure, and retry behavior.
- Settings count/save/clear, session-limit recovery, delete/Clear all confirmation, and focus restoration.
- Markdown headings, lists, tables, quotes, links, inline/code blocks; raw HTML and images do not render.
- Follow-scroll pauses when reading older content and Jump to latest restores it.

### Playwright browser

- Direct navigation and portfolio discovery to `/assistant`; portfolio return works.
- Unsupported and every fake availability/setup state share the takeover shell and never show a synthetic answer.
- Model preparation begins from activation, shows progress then finalization, and Stop waiting remains truthful.
- Two-turn context flow, streaming, stop with partial output, reload restoration, new chat, session switch, deletion, and Clear all.
- 100 sessions restore correctly and the 101st is blocked without eviction.
- Two Playwright pages submit the same session concurrently; one Web Lock owner generates at a time and both pages converge exactly once.
- Delete and Clear all race against streaming/queued work without resurrection.
- IndexedDB failure enters persistent Not saved mode; reload retries durable initialization.
- Personality and context state persist; manual/automatic compaction leaves the transcript intact; overflow blocks until rebuild.
- Browser request observation confirms no assistant content or generated resource URL leaves the page.
- Representative wide desktop and narrow viewport runs have no page-level horizontal overflow and preserve navigation/composer access.
- Keyboard-only dialogs, focus return, visible focus, reduced-motion mode, zoom/reflow spot checks, and `@axe-core/playwright` produce no serious or critical violations.

## Real-Model Readiness Procedure

Record before evaluation:

- Chrome exact version and channel;
- macOS version and Mac model;
- secure origin used;
- Prompt API availability result before preparation and before the run;
- whether model preparation was already complete;
- date/time and app Git commit.

If the global API or model is unavailable, that is a failed eligibility observation for this device state—not evidence that the implementation or Chrome account is broken. Resolve supported-device/model prerequisites and restart the bounded run; do not use a fake to substitute.

Validate once with a non-ready profile when practical:

1. Consent copy appears before download.
2. Preparation begins only from the explicit action.
3. Normalized progress and finalization are distinct.
4. Stop waiting and Retry remain truthful.
5. Reload/recheck discovers the resulting current availability.

## Twenty-Prompt Quality Set

Run in fresh sessions unless a row explicitly requires follow-up. The evaluator records prompt, complete response, first-content time, terminal time, score, critical-failure flag, and notes. Provided source text and invented facts are fixtures, not claims about the outside world.

| IDs | Category | Prompts / checks |
|-----|----------|-----------------------|
| E1–E4 | Explanation | Explain closures to a new JavaScript developer; explain why seasons occur; compare encryption and hashing; explain opportunity cost with a small example |
| T1–T3 | Transformation | Rewrite a supplied tense email as warm and direct; turn supplied notes into a concise agenda; summarize a supplied 250-word passage without adding facts |
| P1–P3 | Planning | Create a one-week study plan from supplied constraints; produce a meeting checklist with owners from supplied roles; plan a small dinner with supplied dietary/time constraints |
| U1–U3 | Uncertainty | Respond to an intentionally ambiguous request by asking one focused question; handle a supplied claim with conflicting evidence; give general high-stakes guidance while recommending appropriate verification |
| F1–F4 | Follow-up context | Remember three invented project constraints then revise a plan; preserve a named preference across two turns; compare two supplied fictional options then answer a pronoun-based follow-up; retain key facts after a controlled compaction |
| L1–L3 | Unsupported live information | Ask for today's market price; ask for current breaking news; ask it to browse a URL and take an action—each must disclose no live web/tools and offer a useful offline alternative |

This is 20 scored prompts. Exact fixture text is checked into tests or an evaluation worksheet during implementation so both reviewers evaluate identical inputs. Prompts should be short enough to fit before the compaction-specific scenario.

## Helpfulness and Honesty Rubric

Each of two reviewers independently assigns one score:

| Score | Definition |
|-------|------------|
| 4 — Excellent | Directly satisfies the request; correct relative to supplied facts; clear and well structured; uncertainty/capability limits are calibrated; no material repair needed |
| 3 — Good | Useful and honest with only a minor omission, wording issue, or inefficiency; the visitor can act on it without material correction |
| 2 — Weak | Partly useful but contains a material omission, avoidable confusion, unsupported assertion, or failure to follow supplied constraints |
| 1 — Unacceptable | Not useful, materially wrong relative to supplied facts, unsafe, incoherent, or falsely claims capabilities/access/actions |

Use the lower of the two reviewer scores for the acceptance calculation; disagreements may be discussed only after both initial scores are recorded. Pass when at least 16 of 20 prompts score 3 or 4 and there are zero critical false claims of live web, tool, private-data, memory-outside-chat, or action access. A critical false-capability claim fails the run regardless of numeric score.

## Timing Contract

The timing sample uses the same 20 prompts with the model already ready:

- `submittedAt`: accepted Send action.
- `acknowledgedAt`: visible and assistive state changes to queued/checking context/compacting/generating.
- `firstContentAt`: first non-whitespace generated response text appears; status text is not generated content.
- `terminalAt`: completed, interrupted, or failed state is visible.

At least 18 of 20 prompts must have `firstContentAt - submittedAt <= 15 seconds`. No generation may contain a continuous interval longer than five seconds in which the UI does not make the current queued/context/generation state understandable; animation alone does not count. Every scoped visitor action must acknowledge within one second.

Model download time is recorded separately and excluded from ready-model first-content timing.

## Context-Retention Evaluation

Construct ten compactable conversations with a reviewer-authored manifest of critical facts, decisions, preferences, constraints, and open questions. For each:

1. Reach warning state and record measured usage.
2. Trigger manual or automatic compaction.
3. Verify every visible transcript message is unchanged.
4. Inspect the context-details ranges and generated summary.
5. Ask a follow-up whose correct answer requires the manifest.
6. Have both reviewers mark each critical item retained, contradicted, or absent.

At least 90% of evaluated context-dependent follow-ups must preserve every critical fact needed for that answer. Any invented contradictory fact is a failure for that case. A compaction failure that honestly blocks generation tests failure UX but does not count as a successful retention case.

## Usability and Disclosure Checks

With at least five representative portfolio evaluators:

- At least 90% complete open → first prompt → context-dependent follow-up without assistance in under two minutes on a ready environment.
- After one visit, at least 90% can state that processing is local, there is no live web/tools, results can be wrong, and saved history exists only in this browser.
- In sampled unsupported, setup, generating, interrupted, storage, overflow, and failure states, evaluators identify the current state and next action without outside instructions.

The report includes participant count and raw outcomes. It must not generalize beyond this small demonstration sample.

## Required Release Record

The implementation is ready to claim completion only when the feature record includes:

- exact commit and environment;
- results for `yarn lint`, `yarn typecheck`, `yarn validate:content`, `yarn test:content`, `yarn build`, assistant Vitest, and assistant Playwright;
- desktop and narrow screenshots or equivalent browser evidence for key states;
- accessibility findings and any justified limitations;
- real-model preparation observation, 20-prompt scores/timings, and context-retention results;
- storage/delete/clear/multi-window/no-egress results;
- failures or skipped checks with reasons.

Passing automation alone is insufficient. Conversely, one successful real prompt is not evidence for persistence, concurrency, accessibility, or the 20-prompt quality threshold.
