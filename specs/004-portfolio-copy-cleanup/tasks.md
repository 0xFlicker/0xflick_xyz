# Tasks: Portfolio copy cleanup

## Phase 1: Setup
- [x] T001 Inspect clean checkout, constitution and canonical content in src/lib/career.ts and docs/career-facts.md.

## Phase 2: Foundation
- [x] T002 Define scope, navigation contract and validation in specs/004-portfolio-copy-cleanup/.

## Phase 3: US1 — Work first
Independent check: homepage reads introduction → House → three employer entries → contact.
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
