# Validation: On-device AI assistant

**Date**: 2026-08-20  
**Branch**: `001-on-device-ai-assistant`  
**Route**: `/assistant`

## Automated release checks

| Command | Result | Evidence |
|---|---|---|
| `yarn lint` | Pass | Next ESLint completed with no warnings or errors. |
| `yarn typecheck` | Pass | `tsc --noEmit` completed successfully. |
| `yarn validate:content` | Pass | Validated identity, chronology, privacy markers, and 9 routes across 85 source files and 103 public text files. |
| `yarn test:content` | Pass | 5 of 5 content-validator tests passed. |
| `yarn test:assistant` | Pass | 17 files and 86 unit/component tests passed. Node emitted only the non-functional experimental `localStorage` warning from isolated Vitest workers. |
| `yarn build` | Pass | Next.js production build compiled, typechecked, linted, and generated all 16 static pages. `/assistant` is 100 kB with 204 kB first-load JavaScript. Browserslist reported the existing stale `caniuse-lite` advisory. |
| `yarn test:e2e:assistant` | Pass | A fresh production build completed, then 34 of 34 Playwright journeys passed across desktop Chromium and a 390 px narrow Chromium project. |

The browser suite covers ready, unsupported, and downloadable model states; simple streaming turns and Stop; context display, manual/automatic compaction, unknown capacity, and overflow; browser persistence, the 100-session limit, deletion, Clear all, and temporary storage; personality settings; two-page Web Lock ordering and recovery; no-egress observation; and wide/narrow accessibility behavior.

The real-model lifecycle correction adds direct regression proof for Chrome's normalized `downloadprogress` values, indeterminate zero progress, download-to-preparation presentation, page-setup failure while Chrome continues downloading, automatic availability polling, available-model synthetic-progress suppression, current `NotReadableError` output-filtering semantics, and active native-session reuse. Two unchanged turns use one native session; preparation hands its session to the first turn; successful compaction hands over its validated replacement; and history, personality, selection, Stop, failure, deletion, Clear all, unavailability, or unmount invalidates and destroys stale retained state. The production Chromium lifecycle journey emits synthetic `0` and `1` progress during an already-available model create and verifies that no download UI appears.

A follow-up context-visibility refinement was validated with the full unit suite plus the ready-model and unknown-capacity Playwright journeys in both desktop and narrow Chromium. Those journeys prove that a blank chat omits the context control and that it appears after the first turn. The existing `yarn dev` process on port 3000 was left running, so the production build/full-matrix command was not repeated over that process; the table's production build and 32-test result remain the immediately preceding release run.

The React Strict Mode storage regression was exercised against that running development server. A fresh isolated Chromium profile reported `Saved in this browser`, retained a generated chat after reload, and completed all 32 desktop/narrow Playwright journeys with `PLAYWRIGHT_USE_EXISTING_SERVER=1 yarn playwright test`.

The context dialog refinement was exercised in isolated desktop and narrow Chromium profiles. The primary view now contains only measured usage, the immediate compaction consequence, the unchanged-transcript guarantee, and the available action; generated summary text remains hidden until `See condensed summary` is opened and is contained in a bounded scrolling region. The complete 32-journey browser matrix passed against the local development build, including manual and automatic compaction.

Automatic compaction was held open deterministically in both browser projects to verify the compact composer replacement. It shows `Making room for this conversation…`, `Your message will start automatically.`, and a working `Cancel`; the textarea and inaccurate `Stop response` action are absent until actual response generation begins. Manual compaction uses the same compact surface without presenting an ineffective cancel action.

The accessibility journey exercises keyboard-only settings and composer use, deterministic dialog focus restoration, reduced-motion emulation, 200% root-text reflow, visible live generation state, transcript busy state, and an axe scan with zero violations in both viewport projects. Automated screenshot review at 1440 × 1000 and 390 × 844 confirmed that the desktop rail, narrow drawer, dialogs, transcript, context control, composer, and permanent disclosure remain legible and contained.

The portfolio exit was moved from the storage footer to an icon-only back link at the top-left of both the desktop rail and narrow drawer. Its visible arrow retains the accessible name and tooltip `Return to portfolio`; focused desktop and narrow Chromium accessibility journeys passed.

## Source audit

The final audit covered `src/features/assistant/`, `src/app/assistant/`, assistant unit/component/e2e tests, and fixtures. It found no legacy `window.ai.languageModel` path, deprecated Prompt API quota/parameter fields, cloud or backend inference call, assistant analytics/logging, empty catch, unsafe cast, or alternate runtime. `git diff --check` passed.

## Manual release evidence and limitations

### T073 — real Chrome and assistive-technology exercise

Completed and accepted by the project owner on 2026-08-20 in Google Chrome 151.0.7922.138 on macOS 26.5.2 at `http://localhost:3000/assistant` with the installed model ready. The real browser restored existing IndexedDB chats and completed two new local turns. The first test turn moved through `Preparing your message` and `Generating response` to `Response complete`; generated text first appeared after approximately 321 ms and the turn completed after approximately 15.1 seconds without ambiguous activity.

At the default 1,728 × 997 viewport and an explicit 390 × 844 narrow viewport, document width equalled viewport width. Keyboard traversal exposed a logical, visibly focused order beginning with Return to portfolio and New chat. Settings, context, narrow chat-drawer, and deletion-confirmation dialogs contained focus, closed with Escape, and restored focus to their trigger. The portfolio link navigated to `/` and browser Back restored the ready assistant. A created chat and both completed turns survived reload. The permanent local/no-tools/double-check disclosure remained present in the accessibility snapshot.

The initial VoiceOver exercise announced `Response started` and `Response complete` but omitted the response body. Completion status now keeps streamed chunks outside the live region, then atomically exposes `Response complete` plus the final assistant text once the turn is terminal. A real Chrome turn exposed `Response complete. VoiceOver announcement test.` in the status region; the focused component regression, desktop/narrow accessibility journeys, and full assistant suite cover the behavior without token-by-token announcements. The project owner accepted the corrected spoken result.

VoiceOver subsequently announced Chrome's web-content title and group-navigation hint before the response. The application was provoking that orientation speech by unmounting the focused textarea during ordinary context checking. Normal queued, context-checking, and generation states now retain the same composer; only actual context compaction replaces it, and automatic compaction focuses its Cancel action. A real Chrome Enter submission retained `assistant-composer` as the active element with exactly one textarea through `On-device AI ready`, `Preparing your message`, `Generating response`, `Response started`, and the atomic `Response complete. Focus stayed in the composer.` announcement. The focused component suite passed 20 tests, the full assistant suite passed 82 tests, and the desktop/narrow accessibility and lifecycle browser subset passed all 8 journeys. The project owner accepted the corrected VoiceOver focus behavior.

The terminal live-region announcement now parses the completed Markdown and exposes only readable plain text, omitting formatting delimiters, hidden HTML, and images suppressed by the visible renderer while retaining meaningful code punctuation. A real Chrome response containing a level-two heading, bold, emphasis, and a named link produced exactly `Response complete. Helpful answer Use bold, emphasis, and named links.` with focus still on `assistant-composer`. The full 86-test assistant suite and the desktop/narrow accessibility journey passed after this correction.

The narrow overflow exercise found that a 600-character unbroken user token produced a 6,489 px article scroll width despite no page-level overflow. `Transcript` now applies `min-w-0 break-words`; the same saved turn retested at a 358 px article width and 315 px message width with no internal or page overflow. After the later VoiceOver refinements, `yarn lint`, `yarn typecheck`, and all 86 tests across the 17-file assistant suite passed. No assistant request appeared in the Next.js server log during either model turn. Chrome console inspection found only unrelated wallet-extension `ethereum` injection conflicts, with no application warning or error.

T073 is complete with the project owner's accessibility acceptance. The automation surface, rather than the real-Chrome control surface, supplied the 200% reflow, reduced-motion, and no-egress evidence; destructive deletion was inspected through its confirmation boundary without deleting the owner's browser data. The cold-download lifecycle is covered by the separately completed T074 run rather than this ready-model session.

### T074 — owner-Mac model quality and context retention

Completed by the project owner on 2026-08-20. The detailed Q01–Q20 reviewer scores, timing rows, C01–C10 retention marks, environment record, and preparation observations were not added to this repository, so this record does not independently reproduce or generalize those results.

All planned release-evidence tasks are checked off.
