# Copilot Instructions

## Project Overview

Personal portfolio site for Flick (0xflick) at https://www.flick.ing. Built with Next.js 14 App Router, React 18, TypeScript, and TailwindCSS. Features a Three.js WebGL landing page and content pages for about, projects, resume, and connect.

## TypeScript & Code Style

- Strict TypeScript is enabled (`strict: true`). Never use `as any`, `as unknown`, or `"key" in obj` type hacks.
- Use explicit type imports: `import type { FC } from "react"`.
- Always import from `react` explicitly: `import { useState, useEffect } from "react"` — never rely on a global `React`.
- Use functional components exclusively. No class components.
- Path alias `@/*` maps to `./src/*`.

## React & Component Patterns

- Next.js App Router: components are server components by default. Add `"use client"` only when hooks or browser APIs are needed.
- Use `@headlessui/react` for accessible interactive UI (popovers, menus, transitions).
- Use `next-themes` for dark/light mode access (`useTheme` hook requires `"use client"`).
- Shared UI components in `src/components/` — `Container`, `Button`, `Card`, `SimpleLayout`, `Section`, `SocialIcons`.

## Styling

- TailwindCSS is the only styling approach. No CSS-in-JS or CSS modules.
- Dark mode uses the `class` strategy — use `dark:` variants in Tailwind classes.
- Brand colors: `brand-light` (#CADCFC), `brand-dark` (#00246B) — defined in `tailwind.config.ts`.

## Routing

- All routes use the App Router under `src/app/`.
- Tilde routes (`/~/about`, `/~/projects`, `/~/cv`) share a layout with navigation header and footer.
- `/connect` is a standalone page.
- `/` renders a full-page Three.js WebGL canvas.

## Three.js / WebGL

- Uses `@react-three/fiber` and `@react-three/drei`.
- Homepage scene in `src/features/home/` — includes canvas, shaders (`src/features/home/shaders/`), animation tracks, and content overlays.
- Reusable Three.js components in `src/components/three/`.
- Shader utilities in `src/shader/` (grid, outline).
- WebGL detection via `src/hooks/useDetectWebgl.ts` — fallback redirects to `/~/about`.

## Key Commands

- `yarn dev` — development server on http://localhost:3000
- `yarn build` — production build
- `yarn lint` — ESLint (next/core-web-vitals)
