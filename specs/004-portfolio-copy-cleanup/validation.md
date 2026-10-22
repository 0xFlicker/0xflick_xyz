# Validation — 2026-10-22

## Automated checks
- `yarn lint`: passed, no warnings/errors.
- `yarn typecheck`: passed.
- `yarn validate:content`: passed; identity, chronology, privacy markers and nine routes checked.
- `yarn test:content`: five tests passed.
- `yarn build`: passed. Warnings from existing Transformers import.meta usage and outdated Browserslist data; neither dependency changed.
- `git diff --check`: passed.

## Browser verification
Tested the final production build served at http://127.0.0.1:3100 using the in-app browser.
- Desktop 1280×720 and mobile 390×844: homepage, About, Work, Experience and Connect render without horizontal overflow or broken images.
- Homepage DOM contains four sections in order: introduction, House, selected work, contact. Desktop primary action ends at y=449, within the first screen.
- Mobile menu opens, Escape closes it and restores focus to Menu, and selecting Work closes it and navigates.
- Project GIPHY anchor lands at y=96. All seven project-index fragments resolve to elements.
- Desktop current-page links identify Work, About, Experience and Connect; the archive also identifies Work.
- Keyboard Tab reaches Experience with focus-visible and a solid outline.
- Footer Local AI assistant link opens the existing assistant; no model download initiated.
- No captured browser console errors.
- Browser visual review used the system dark theme. Light-theme foreground, focus and active-state classes reviewed in source; no light-theme screenshot captured.
- Temporary mobile viewport override reset.

Screenshots (local ignored artifacts): `output/portfolio-cleanup/home-desktop.jpg` and `output/portfolio-cleanup/home-mobile.jpg`.

## Review
React checklist: Server Components retained for editorial content; only shared interactive header is client-side. Removed scroll effects/listeners and obsolete content arrays. Explicit React type imports used in changed shared components. Headless UI handles menu focus and dismissal. No new dependencies, API changes, or persistence.

Public copy checked against `src/lib/career.ts` and `docs/career-facts.md`; dates, titles, distinct Shutterstock tenures and public links preserved. Metadata and positioning guidance reconciled. Dry homepage sentence appears once in rendered portfolio source. No deployment performed.

## Spec Kit gates
Pre-implementation analysis: six requirements covered by eight tasks, no ambiguity, duplication, unmapped tasks or constitution conflicts. Spec-quality checklist passed 6/6.

Convergence: six functional requirements, four success criteria, seven acceptance scenarios, plan decisions and all five constitution principles checked against the current implementation and validation evidence. Zero missing, partial, contradicting or unrequested findings. No convergence tasks appended. All eight implementation tasks complete.

## Follow-up copy correction
The user requested removing the dry architecture sentence. Removed it without a replacement, reconciled the specification and editorial guidance, and reran lint, typecheck, content validation, five content tests, and production build successfully. Refreshed the local production preview and desktop/mobile screenshots; the sentence is absent and mobile has no horizontal overflow. This supersedes the earlier retained-sentence acceptance note. Completion audit against the updated acceptance criterion found no remaining work.

## Distinct page purposes — latest user refinement
This supersedes the earlier four-section homepage design and employer entries on Work.

- Home now has two sections and 63 main-content words. Browser inspection of the complete homepage HTML found no salaried employer names, including metadata and structured data. Shared social image text and alt text were also updated in source.
- Work contains The House, Morpheus, Editor, Create and six open-source projects. No employment date ranges, role titles, GIPHY entry or Verta entry. Removed career imports, metadata helper, evidence grids and employer-summary array.
- Experience retains all nine canonical career records and all responsibility/outcome bullets. Both Shutterstock tenures remain separate. Product links land on the correct 2015 and 2022 career entries.
- All five project-index anchors resolve. Home, Work and Experience pass desktop 1280×720 and mobile 390×844 overflow checks and visual review. Viewport override reset afterward.
- Lint, typecheck, content validation, five content tests and production build passed. Same existing Transformers and Browserslist warnings; dependencies unchanged.
- React review: static page data, Server Components, stable keys, no new effects, dependencies or persistence. Canonical career data unchanged.
- Spec Kit analysis: revised requirements covered by T009–T012, no ambiguities or constitution conflicts. Completion audit of the revised spec, plan and tasks found no remaining gaps; no convergence tasks added.
- Screenshot: `output/portfolio-cleanup/home-distinct-desktop.jpg`. Local preview refreshed; no deployment.
