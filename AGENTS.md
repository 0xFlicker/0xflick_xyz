# Agent Guide

## Overview

`0xflick_xyz` is Flick's Principal Architect portfolio, built with Next.js 14 App Router, React 18, TypeScript, and TailwindCSS. The editorial homepage leads into about, selected systems, experience, and connect pages; the original interactive Three.js experience remains available at `/intro`. Production URL: https://www.flick.ing

## Local Setup

1. Install dependencies with `yarn install`.
2. Environment files are already provided:
   - `.env.development` — sets `OG_URL=http://localhost:3000` for local OpenGraph metadata.
   - `.env.production` — sets `OG_URL=https://www.flick.ing`.
3. Start the dev server with `yarn dev` (served on `http://localhost:3000`).

## Key Scripts

- `yarn dev` — run the Next.js dev server.
- `yarn build` — production build.
- `yarn start` — serve the production build.
- `yarn lint` — run ESLint (next/core-web-vitals preset).

## Spec Kit Workflow

- `.specify/memory/constitution.md` is the highest-authority engineering policy for this project.
- Use `$speckit-assess-intake` before specification when a product idea still needs evidence,
  problem definition, scope shaping, or a go/no-go decision.
- The normal feature cycle is `$speckit-specify` → `$speckit-clarify` → `$speckit-plan` →
  `$speckit-tasks` → `$speckit-analyze` → `$speckit-implement` → `$speckit-converge`.
- Feature artifacts live under `specs/NNN-short-name/`. The machine-local
  `.specify/feature.json` pointer identifies the active feature independently of the Git branch.
- The Git extension creates a numbered feature branch before `$speckit-specify`. Preserve existing
  dirty-checkout work by asking whether to commit first or continue in place before invoking it.
- The agent-context extension owns only the section delimited by `<!-- SPECKIT START -->` and
  `<!-- SPECKIT END -->`. Do not hand-edit content inside those markers.
- After task generation, `$speckit-analyze` runs as a mandatory consistency gate. After
  implementation, `$speckit-converge` runs as a mandatory completion audit.

## Architecture

### Routing

- **App Router only** — all routes live under `src/app/`.
- `/` — editorial Principal Architect homepage focused on positioning, proof, selected systems, and conversion.
- `/intro` — original full-screen WebGL Three.js experience. Falls back to `/~/about` when WebGL is unsupported.
- `/~/about`, `/~/projects`, `/~/cv` — content pages wrapped in a shared layout (`src/app/~/layout.tsx`) that provides the `<Header>`, `<Footer>`, theme provider, and navigation context.
- `/connect` — standalone page for scheduling intro calls, uses its own layout.

The tilde (`~`) prefix in the route path is intentional — it namespaces the portfolio content under a distinctive URL segment.

### Directory Structure

- `src/app/` — Next.js App Router pages and layouts.
- `src/components/` — Shared, reusable UI components (`Header`, `Footer`, `Container`, `Button`, `SiteShell`, `PortfolioHome`, `PortfolioUI`, `SocialIcons`, etc.).
- `src/components/three/` — Reusable react-three-fiber components (`Animatable`, `Chevron`, `FitToWidth`, `GridRect`, `GridTunnel`, `ScrollAnimatable`).
- `src/features/home/` — WebGL intro experience: Three.js canvas, animation tracks, GLSL shaders, and content overlays.
- `src/hooks/` — Shared React hooks (`useDetectWebgl`, `useNavigationEvent`, `useScroll`).
- `src/shader/` — GLSL shader utilities (`grid`, `outline`).
- `src/lib/` — Content, navigation, metadata, and utility helpers (`portfolio`, `navigation`, `site`, `articles`, `formatDate`).
- `src/styles/` — Global styles and Tailwind entry point.
- `src/images/` — Static image assets imported by components.
- `public/` — Public static assets (project screenshots, PDFs, favicons).

### Styling

- **TailwindCSS** is the primary styling approach. Configuration is in `tailwind.config.ts`.
- Brand colors: `brand-light` (#CADCFC) and `brand-dark` (#00246B).
- Dark mode is class-based via `next-themes` with `<ThemeProvider attribute="class">`.
- Global styles in `src/styles/tailwind.css`.

### Three.js / WebGL

- The homepage renders a full-page Three.js scene using `@react-three/fiber` and `@react-three/drei`.
- Custom GLSL shaders live in `src/features/home/shaders/` (OpenGL fragment shaders).
- Shader utilities for grid and outline effects are in `src/shader/`.
- WebGL support is detected at runtime via `useDetectWebgl`; unsupported browsers redirect to `/~/about`.
- Mobile detection happens server-side using the `User-Agent` header.

### Context & Theming

- `AppContext` (in `src/app/providers.tsx`) tracks `previousPathname` for navigation transitions.
- `ThemeProvider` from `next-themes` manages light/dark mode with system preference syncing.

## TypeScript

- Strict mode is enabled (`strict: true` in `tsconfig.json`).
- Path alias `@/*` maps to `./src/*`.
- Target: ES2020; module resolution: `bundler`.
- Use explicit type imports: `import type { FC } from "react"`.
- Import hooks and utilities from `react` explicitly, never rely on global `React`.

## Development Practices

- Use functional React components exclusively; no class components.
- Write clean TypeScript — avoid `as any`, `as unknown`, and `"key" in obj` patterns.
- Run `yarn lint` before committing.
- Server components are the default in the App Router. Add `"use client"` only when hooks or browser APIs are needed.
- When working with Three.js components, keep rendering logic in `src/features/home/` or `src/components/three/` as appropriate.

## Deployment

- Deployed on Vercel.
- The `OG_URL` environment variable controls OpenGraph image base URLs and differs between development and production.

## Reference Links

- Next.js docs: https://nextjs.org/docs
- react-three-fiber: https://docs.pmnd.rs/react-three-fiber
- TailwindCSS: https://tailwindcss.com/docs
- Headless UI: https://headlessui.com
