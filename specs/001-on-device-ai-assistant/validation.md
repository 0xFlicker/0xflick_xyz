# Validation: On-device AI assistant

**Date**: 2026-08-20  
**Branch**: `001-on-device-ai-assistant`  
**Route**: `/assistant`

## Automated release checks

| Command | Result | Evidence |
|---|---|---|
| `yarn lint` | Pass | Next ESLint completed with no warnings or errors. |
| `yarn typecheck` | Pass | `tsc --noEmit` completed successfully. |
| `yarn validate:content` | Pass | Validated identity, chronology, privacy markers, and 9 routes across 84 source files and 102 public text files. |
| `yarn test:content` | Pass | 5 of 5 content-validator tests passed. |
| `yarn test:assistant` | Pass | 15 files and 71 unit/component tests passed. Node emitted only the non-functional experimental `localStorage` warning from isolated Vitest workers. |
| `yarn build` | Pass | Next.js production build compiled, typechecked, linted, and generated all 16 static pages. `/assistant` is 99 kB with 203 kB first-load JavaScript. Browserslist reported the existing stale `caniuse-lite` advisory. |
| `yarn test:e2e:assistant` | Pass | A fresh production build completed, then 32 of 32 Playwright journeys passed across desktop Chromium and a 390 px narrow Chromium project. |

The browser suite covers ready, unsupported, and downloadable model states; simple streaming turns and Stop; context display, manual/automatic compaction, unknown capacity, and overflow; browser persistence, the 100-session limit, deletion, Clear all, and temporary storage; personality settings; two-page Web Lock ordering and recovery; no-egress observation; and wide/narrow accessibility behavior.

A follow-up context-visibility refinement was validated with the full unit suite plus the ready-model and unknown-capacity Playwright journeys in both desktop and narrow Chromium. Those journeys prove that a blank chat omits the context control and that it appears after the first turn. The existing `yarn dev` process on port 3000 was left running, so the production build/full-matrix command was not repeated over that process; the table's production build and 32-test result remain the immediately preceding release run.

The React Strict Mode storage regression was exercised against that running development server. A fresh isolated Chromium profile reported `Saved in this browser`, retained a generated chat after reload, and completed all 32 desktop/narrow Playwright journeys with `PLAYWRIGHT_USE_EXISTING_SERVER=1 yarn playwright test`.

The context dialog refinement was exercised in isolated desktop and narrow Chromium profiles. The primary view now contains only measured usage, the immediate compaction consequence, the unchanged-transcript guarantee, and the available action; generated summary text remains hidden until `See condensed summary` is opened and is contained in a bounded scrolling region. The complete 32-journey browser matrix passed against the local development build, including manual and automatic compaction.

Automatic compaction was held open deterministically in both browser projects to verify the compact composer replacement. It shows `Making room for this conversation…`, `Your message will start automatically.`, and a working `Cancel`; the textarea and inaccurate `Stop response` action are absent until actual response generation begins. Manual compaction uses the same compact surface without presenting an ineffective cancel action.

The accessibility journey exercises keyboard-only settings and composer use, deterministic dialog focus restoration, reduced-motion emulation, 200% root-text reflow, visible live generation state, transcript busy state, and an axe scan with zero violations in both viewport projects. Automated screenshot review at 1440 × 1000 and 390 × 844 confirmed that the desktop rail, narrow drawer, dialogs, transcript, context control, composer, and permanent disclosure remain legible and contained.

The portfolio exit was moved from the storage footer to an icon-only back link at the top-left of both the desktop rail and narrow drawer. Its visible arrow retains the accessible name and tooltip `Return to portfolio`; focused desktop and narrow Chromium accessibility journeys passed.

## Source audit

The final audit covered `src/features/assistant/`, `src/app/assistant/`, assistant unit/component/e2e tests, and fixtures. It found no legacy `window.ai.languageModel` path, deprecated Prompt API quota/parameter fields, cloud or backend inference call, assistant analytics/logging, empty catch, unsafe cast, or alternate runtime. `git diff --check` passed.

## Manual release gates still required

### T073 — real Chrome and assistive-technology exercise

Not run. Playwright uses bundled Chromium, a deterministic fake `LanguageModel`, root-font scaling rather than browser UI zoom, and automated axe inspection. It does not prove the owner Chrome Prompt API, actual model download UI, a screen reader, true 200% browser zoom, or a manual DevTools network inspection. A person must still perform the representative desktop/narrow, keyboard, screen-reader, zoom, reduced-motion, navigation, overflow, dialog, storage, and no-egress pass in supported Chrome.

### T074 — owner-Mac model quality and context retention

Not run. The production Prompt API adapter was intentionally not replaced with fake-model evidence for this gate. On the owner Mac, complete the preparation check and use the exact Q01–Q20 and C01–C10 cases in `tests/fixtures/assistantEvaluation.ts`, with two reviewers and the scoring/timing protocol in `evaluation.md`.

### T075 — human usability study

Not run. Recruit at least five portfolio visitors and retain the bounded raw outcomes for task completion, state comprehension, disclosure retention, and portfolio impact before generalizing usability or release quality.

These three gates are external evidence requirements, not implementation failures. The automated implementation is complete, but the feature should not be described as fully release-validated until they pass.
