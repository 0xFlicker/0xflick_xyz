<!--
Sync Impact Report
- Version change: Unratified template -> 1.0.0
- Modified principles: None (initial ratification)
- Added principles:
  - I. Ship the Smallest Working Layer
  - II. Choose Simple, Durable Architecture
  - III. Maintain One Current Path
  - IV. Preserve Modular Boundaries
  - V. Publish Verifiable Truth
- Added sections:
  - Technical and Editorial Constraints
  - Delivery and Quality Gates
  - Governance rules
- Removed sections: None
- Follow-up TODOs: None
-->
# 0xflick_xyz Constitution

## Core Principles

### I. Ship the Smallest Working Layer
Every change MUST start with the smallest coherent increment that works end to end. The site MUST
remain buildable and usable after each increment, and each layer MUST have an observable acceptance
condition. A larger architecture MUST NOT replace a working product with unfinished complexity.
This keeps delivery grounded in usable outcomes while allowing capability to grow deliberately.

### II. Choose Simple, Durable Architecture
Implementations MUST use the simplest design that fully satisfies current requirements. They MUST
avoid speculative abstractions, configuration, and indirection. Existing project dependencies MUST
be checked before custom functionality or a new package is introduced; a well-maintained library
MAY be added when it lowers total complexity or improves reliability. Architectural choices MUST be
suitable for long-term ownership rather than planned replacement by a later stopgap cleanup.

### III. Maintain One Current Path
When requirements replace existing behavior, the obsolete path MUST be removed. Compatibility
layers, fallback branches, parallel implementations, and migration scaffolding MUST NOT be added to
preserve superseded behavior. Failures MUST surface promptly with enough context to understand and
correct them; empty catches and silent degradation are prohibited. Deployment is the default gate,
so feature flags and disabled-but-visible states require an explicit product requirement.

### IV. Preserve Modular Boundaries
Components MUST remain cohesive, reusable where reuse is real, and separated by concern. Route
composition belongs in `src/app/`; shared interface elements belong in `src/components/`; WebGL
experience logic belongs in `src/features/home/` or `src/components/three/`; shared content and
domain data belong in `src/lib/`. Cross-boundary dependencies MUST flow through explicit interfaces,
and a change MUST NOT duplicate an existing source of truth merely to shorten an implementation.

### V. Publish Verifiable Truth
Public claims MUST be supported by canonical project records or primary public evidence before they
ship. Career facts MUST come from `src/lib/career.ts` and `docs/career-facts.md`; unpublished
financials, private contacts, customer or partner identities, incidents, roadmaps, internal systems,
and invented metrics MUST remain excluded. A change is complete only when its relevant automated
checks and user-visible flows have been verified. This makes production output, rather than intent,
the measure of correctness.

## Technical and Editorial Constraints

- The application MUST use the Next.js App Router under `src/app/`, React functional components,
  strict TypeScript, and TailwindCSS as the primary styling system.
- Server Components MUST remain the default. A component MAY use `"use client"` only when hooks,
  stateful interaction, or browser APIs require it.
- Type imports MUST be explicit. Production code MUST NOT use `as any`, `as unknown`, or property
  existence checks as a substitute for a defined type contract.
- The `/intro` WebGL experience and the editorial portfolio routes MUST retain separate concerns.
  Changes to Three.js rendering MUST stay within the established WebGL modules.
- Public identity, chronology, selected work, and confidentiality rules MUST remain consistent
  across structured data, editorial documentation, rendered pages, metadata, and generated assets.
- Environment-specific Open Graph URLs MUST use the existing `OG_URL` contract. Secrets and private
  data MUST NOT enter source, public assets, generated documents, or client bundles.

## Delivery and Quality Gates

1. Before editing a dirty checkout, the agent MUST inspect the changes and ask whether to commit
   first or continue in place. Unrelated work MUST NOT be reset, stashed, reverted, or overwritten.
2. Every feature or correction MUST define a concrete end-to-end acceptance condition before its
   implementation expands beyond the first working layer.
3. The relevant repository checks MUST pass before completion is claimed: `yarn lint`,
   `yarn typecheck`, `yarn validate:content`, `yarn test:content`, and `yarn build`. A skipped check
   MUST be reported with its reason.
4. User-interface changes MUST be exercised at representative desktop and mobile sizes. Navigation,
   overflow, assets, primary interactions, and affected routes MUST be checked in a real browser.
5. Public-copy changes MUST be reconciled with canonical records and the content validator.
   Ambiguous facts MUST be resolved or explicitly withheld rather than presented as confirmed.
6. Review MUST reject unjustified complexity, duplicated sources of truth, silent failure paths,
   stale implementations, and work that cannot demonstrate its acceptance condition.

## Governance

This constitution is the highest-authority engineering policy for `0xflick_xyz`. `AGENTS.md` and
feature artifacts MAY add operational detail but MUST NOT weaken or contradict these rules.

Amendments require an explicit change to this file that states the rationale, records affected
principles and sections in the Sync Impact Report, updates the amendment date, and receives project
owner approval. Version numbers follow semantic versioning: MAJOR for incompatible removals or
redefinitions of governance, MINOR for new principles or materially expanded obligations, and PATCH
for non-semantic clarification. The ratification date remains fixed after initial adoption.

Every specification, implementation plan, task list, review, and completion report MUST check the
work against applicable principles and quality gates. Any necessary exception MUST be documented in
the governing feature artifact with its scope and rationale before implementation; silent exceptions
are invalid. Constitution compliance MUST be rechecked whenever scope or architecture changes.

**Version**: 1.0.0 | **Ratified**: 2026-08-19 | **Last Amended**: 2026-08-19
