# Implementation Plan: Portfolio copy cleanup

**Branch**: `codex/004-portfolio-copy-cleanup` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

## Summary
Subtract repetitive content, lead with projects, and simplify the existing header. Reuse existing components and canonical career data.

## Technical Context
- TypeScript, Next.js 14 App Router, React 18, TailwindCSS, Headless UI.
- No new dependencies, persistence, services, or API changes.
- Existing content validation, lint, typecheck, build; real-browser desktop/mobile checks.
- Preserve existing theme behavior, project anchors, metadata URL contract, and mobile focus handling.
- No new automated tests for static copy; verify navigation interactively and run existing checks.

## Constitution Check
I: Deliver a working editorial increment. II: Remove content and header scroll machinery rather than introduce abstractions. III: Delete obsolete grids/data. IV: Routes compose pages; shared navigation/content stays in lib/components. V: Use career.ts and career-facts.md; add no claims.
Clean checkout verified before edits. All required quality gates and browser checks are included. Pre-design and post-design gates pass without exceptions.

## Project Structure
- `src/components/PortfolioHome.tsx`: four sections with featured House and three employer entries.
- `src/lib/portfolio.ts`: concise selected employer summaries; remove unused capability data.
- `src/components/Header.tsx`, `Footer.tsx`, `src/lib/navigation.ts`: plain header, shared primary links, secondary assistant link.
- `src/app/~/about/page.tsx`, `~/projects/page.tsx`, `~/cv/page.tsx`, `connect/page.tsx`: subtract slogans, repeated prose and grids; retain factual detail and destinations.
- `src/lib/site.ts`, `src/app/opengraph-image.tsx`, `docs/portfolio-positioning.md`: reconcile metadata and guidance with new copy.
- `specs/004-portfolio-copy-cleanup/`: specification and validation artifacts.
