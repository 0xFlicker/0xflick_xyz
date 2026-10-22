# Tasks: Portfolio copy cleanup

## Phase 1: Setup
- [x] T001 Inspect clean checkout, constitution and canonical content in src/lib/career.ts and docs/career-facts.md.

## Phase 2: Foundation
- [x] T002 Define scope, navigation contract and validation in specs/004-portfolio-copy-cleanup/.

## Phase 3: US1 — Work first
Original pass: homepage introduction, House, employer entries, contact. Superseded by Phase 7 below.
- [x] T003 [US1] Rewrite src/components/PortfolioHome.tsx and remove unused content from src/lib/portfolio.ts per FR-001/FR-002.

## Phase 4: US2 — Direct navigation
Independent check: desktop and mobile primary links work, current page is clear, footer reaches assistant.
- [x] T004 [US2] Simplify src/components/Header.tsx, Footer.tsx and src/lib/navigation.ts per FR-003/FR-006.

## Phase 5: US3 — Specific copy
Independent check: five editorial routes retain facts and destinations with no repeated slogans.
- [x] T005 [US3] Tighten src/app/~/about/page.tsx, ~/projects/page.tsx, ~/cv/page.tsx and connect/page.tsx per FR-004/FR-005.
- [x] T006 [US3] Reconcile src/lib/site.ts, src/app/opengraph-image.tsx and docs/portfolio-positioning.md per FR-004/FR-005.

## Phase 6: Validation
- [x] T007 Run required checks and browser desktop/mobile verification; record evidence in specs/004-portfolio-copy-cleanup/validation.md per FR-005/FR-006 and SC-001–004.
- [x] T008 Review current implementation against spec/plan/tasks using speckit-converge.

## Dependencies and implementation strategy
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008. US1 is the smallest working increment. US1 and US2 touch distinct files and could be developed independently; this pass executes sequentially. US3 page edits are independent except shared metadata reconciliation follows them. No additional agents or test infrastructure required.

## Phase 7: Distinct page purposes — user refinement
- [x] T009 [US1] Reduce src/components/PortfolioHome.tsx to introduction and project preview; remove employer names from src/lib/site.ts, src/app/layout.tsx and src/app/opengraph-image.tsx per revised FR-001.
- [x] T010 [US3] Rework src/app/~/projects/page.tsx around products; remove unused employer data from src/lib/portfolio.ts while retaining career detail on src/app/~/cv/page.tsx per revised FR-002/FR-005.
- [x] T011 Update docs/portfolio-positioning.md and feature guidance; run required checks and desktop/mobile verification, recording results in validation.md per FR-004/FR-006 and revised SC-001.
- [x] T012 Run the completion audit against the revised spec and plan.

Execute T009 → T010 → T011 → T012. Existing completed tasks record the earlier iteration; Phase 7 implements the latest user request.
