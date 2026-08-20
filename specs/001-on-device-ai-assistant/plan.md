# Implementation Plan: On-Device AI Assistant

**Branch**: `001-on-device-ai-assistant` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-on-device-ai-assistant/spec.md`

## Summary

Add a shareable `/assistant` takeover experience to the existing Next.js application. In supported secure-context Chrome environments, the route uses Chrome's stable website Prompt API through a single client-side adapter to provide streaming, cancellable, English text conversations. Sessions, messages, settings, context summaries, and deletion guards remain local to the browser in a typed Dexie/IndexedDB repository; a clearly marked page-lifetime memory repository keeps the current visit usable when durable storage fails. A per-session Web Lock and persisted turn queue preserve one active generation while converging prompts submitted in multiple windows.

Delivery grows in four independently usable layers:

1. The direct route, unsupported/setup states, and one temporary streaming turn establish the complete local-inference path.
2. Durable sessions, reload restoration, individual deletion, Clear all, and cross-window turn ordering establish trustworthy browser-local history.
3. Global personality guidance, context measurement, visible thresholds, and atomic compaction establish longer-conversation control.
4. Responsive interaction polish, accessibility, automated failure coverage, and the owner-Mac real-model evaluation establish the demonstration-quality release gate.

## Technical Context

**Language/Version**: TypeScript 5 in strict mode, React 18, Next.js 14.2.6 App Router

**Primary Dependencies**: Existing TailwindCSS, Headless UI, `next-themes`, and `uuid`; add Dexie 4, `react-markdown`, `remark-gfm`, and the development-only `@types/dom-chromium-ai` declarations

**Storage**: One schema-versioned Dexie 4 database over IndexedDB, with a page-lifetime in-memory implementation of the same feature repository contract when storage is unavailable

**Testing**: Existing ESLint, TypeScript, content validation, content tests, and production build; add Vitest/jsdom, React Testing Library, `fake-indexeddb`, Playwright, and `@axe-core/playwright`

**Target Platform**: Secure-context desktop Chrome 148+ with the global `LanguageModel` Prompt API and an eligible downloadable or installed model; the same route presents an explanatory unsupported state everywhere else. Real-model shipping evidence is limited to the project owner's current supported Mac.

**Project Type**: Client-heavy feature inside the existing single Next.js web application; no API route, backend inference, or server-side transcript storage

**Performance Goals**: On the qualifying owner-Mac validation run, at least 90% of 20 normal prompts show first generated content within 15 seconds and no interaction leaves more than 5 seconds of ambiguous activity; model download and preparation always expose distinct feedback; one valid native session is retained for the selected chat so unchanged follow-up turns avoid repeated session creation

**Constraints**: Prompt and response content never leaves the browser through the feature; one active generation per session; queued prompts converge across windows; maximum 100 saved sessions with the 101st blocked until the visitor deletes one; personality text limited to 1,000 Unicode code points; context warning at 75% and pre-turn compaction target at 80%; no analytics for assistant content or behavior; no cloud or alternate model fallback

**Scale/Scope**: One public route, five user stories, at most 100 browser-local sessions, one global personality setting, simple user/assistant turns, and one supported English text modality

## Constitution Check

*GATE: Passed before Phase 0 research and re-checked after Phase 1 design.*

| Principle / gate | Pre-research check | Post-design check |
|------------------|--------------------|-------------------|
| I. Ship the Smallest Working Layer | PASS — the first layer reaches a usable local streaming turn before persistence and context capabilities are added. | PASS — each of the four layers has a user-visible acceptance boundary and leaves the application usable. |
| II. Choose Simple, Durable Architecture | PASS — repository capabilities and existing dependencies were inspected before selecting additions. | PASS — Dexie replaces substantial transaction/reactivity plumbing; React primitives, one adapter, and existing Headless UI/Tailwind avoid speculative frameworks. |
| III. Maintain One Current Path | PASS — the feature defines only the shipped global `LanguageModel` surface, with no legacy API or alternate inference path. | PASS — temporary storage is an explicit failure state required by the specification, not a compatibility implementation; errors remain visible and actionable. |
| IV. Preserve Modular Boundaries | PASS — route composition stays under `src/app/assistant`; model, context, storage, and interface logic remain feature-local. | PASS — contracts define one-way boundaries and no portfolio, WebGL, or global application concern is duplicated. |
| V. Publish Verifiable Truth | PASS — browser and hardware support claims are based on primary Chrome documentation and runtime availability. | PASS — fake-model automation is separated from the real owner-Mac acceptance gate, and UI disclosure avoids claiming permanent storage or factual reliability. |
| Technical constraints | PASS — the design uses App Router, functional React, strict TypeScript, server routes by default, and client components only where browser APIs require them. | PASS — no secret, private content, server prompt path, unsafe cast convention, or non-Tailwind styling system is introduced. |
| Delivery and quality gates | PASS — spec success criteria provide end-to-end acceptance conditions. | PASS — the quickstart requires lint, typecheck, content checks, build, real Chromium desktop/mobile coverage, accessibility checks, and the bounded real-model run. |

No constitutional exceptions or complexity justifications are required.

## Project Structure

### Documentation (this feature)

```text
specs/001-on-device-ai-assistant/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── evaluation.md              # Fixed real-model evaluation fixtures (T071)
├── validation.md              # Release evidence record (T072–T075)
├── contracts/
│   ├── assistant-workspace.md
│   ├── evaluation.md
│   ├── local-model-adapter.md
│   └── persistence.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── assistant/
│       ├── layout.tsx          # Route metadata and themed takeover boundary
│       └── page.tsx            # Server route composition
├── features/
│   └── assistant/
│       ├── AssistantWorkspace.tsx
│       ├── constants.ts
│       ├── reducer.ts
│       ├── types.ts
│       ├── components/
│       │   ├── ActivityStatus.tsx
│       │   ├── AssistantShell.tsx
│       │   ├── AvailabilityPanel.tsx
│       │   ├── Composer.tsx
│       │   ├── ConfirmationDialog.tsx
│       │   ├── ContextDetails.tsx
│       │   ├── MessageContent.tsx
│       │   ├── SessionSidebar.tsx
│       │   ├── SettingsDialog.tsx
│       │   └── Transcript.tsx
│       ├── context/
│       │   ├── compaction.ts
│       │   ├── contextManager.ts
│       │   └── prompt.ts
│       ├── model/
│       │   ├── browserLanguageModel.ts
│       │   ├── errorMapping.ts
│       │   └── modelAdapter.ts
│       └── storage/
│           ├── database.ts
│           ├── dexieRepository.ts
│           ├── memoryRepository.ts
│           ├── repository.ts
│           └── useRepositoryQuery.ts
└── lib/
    └── navigation.ts           # Adds the discoverable Assistant destination

tests/
├── setup.ts
├── component/
│   └── assistant/
├── e2e/
│   ├── assistant.spec.ts
│   ├── assistant-accessibility.spec.ts
│   ├── assistant-concurrency.spec.ts
│   ├── assistant-context.spec.ts
│   ├── assistant-lifecycle.spec.ts
│   ├── assistant-persistence.spec.ts
│   ├── assistant-privacy.spec.ts
│   └── assistant-settings.spec.ts
├── fixtures/
│   ├── assistantEvaluation.ts
│   └── fakeLanguageModel.ts
└── unit/
    └── assistant/

playwright.config.ts
vitest.config.ts
```

**Structure Decision**: Keep the existing single-application App Router structure. The server route owns metadata and composes one client workspace. All assistant-specific components and browser concerns live in `src/features/assistant`, divided by interface, model, context, and storage responsibilities. Existing global navigation is the only shared source modified for discovery. Tests mirror feature boundaries and reserve real browser semantics for Playwright.

## Implementation Boundaries

- `AssistantWorkspace` coordinates orthogonal availability, generation/context, and storage state; components do not call browser AI or IndexedDB directly.
- `modelAdapter` is the only production interface to `LanguageModel`. The browser implementation owns creation, streaming, cancellation, measurements, and destruction; the workspace may retain one valid native session for the selected chat while persisted prompt inputs match; deterministic tests inject a fake.
- `repository` is the only persistence interface consumed by orchestration and UI. Dexie and memory repositories publish the same query snapshots and mutation results.
- `contextManager` selects transcript material and decides when to compact. `compaction` produces a candidate summary but cannot commit it; the orchestrator commits only after a replacement model session succeeds.
- Dexie records are the cross-window source of truth. Web Locks serialize model work but never replace database transactions or deletion guards.
- Markdown rendering accepts no raw HTML or generated resources. Copy and explicit link navigation are the only response-side browser actions.

## Layer Acceptance Conditions

1. **Local turn**: `/assistant` can distinguish unsupported, downloadable, preparing, ready, streaming, stopped, and failed states; a ready environment completes or stops one prompt without a server request.
2. **Local history**: a completed conversation restores after reload; two windows preserve and serially answer submitted turns; deletion and Clear all cannot be reversed by a stale generation; storage failure visibly enters “Not saved” mode.
3. **Context control**: personality guidance persists globally, the context meter reports known or unknown state honestly, warning and compaction thresholds are deterministic, and a failed compaction leaves the prior working context intact.
4. **Release evidence**: automated browser flows pass at representative desktop and mobile sizes with keyboard and accessibility checks, and the manual owner-Mac run satisfies SC-003 and SC-004 without broadening the compatibility claim.
