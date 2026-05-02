# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun run dev` — start dev server (Next.js with Turbopack)
- `bun run build` — production build
- `bun run lint` — run ESLint
- `bun run typecheck` — run TypeScript type checking (`tsc --noEmit`)
- `bun run format` — format all .ts/.tsx files with Prettier

## Architecture

Next.js 16 app using the App Router with React Server Components enabled by default. Uses bun as the package manager.

**UI layer:** shadcn/ui (radix-nova style) with Tailwind CSS v4. Add components via `npx shadcn@latest add <component>` — they land in `components/ui/`. The `cn()` utility in `lib/utils.ts` merges Tailwind classes.

**Theming:** `next-themes` wraps the app in `components/theme-provider.tsx`. Dark mode toggles via the `d` key (when not in an input). Theme is class-based (`.dark` on `<html>`).

**Path aliases:** `@/*` maps to the project root (e.g., `@/components/ui/button`, `@/lib/utils`).

**Styling conventions:** Tailwind CSS v4 with PostCSS. Design tokens (colors, radii) are CSS custom properties defined in `app/globals.css` using oklch. Prettier auto-sorts Tailwind classes via `prettier-plugin-tailwindcss`.

## Code Style

- No semicolons, double quotes, 2-space indent, trailing commas (es5)
- Fonts: Geist (sans) and Geist Mono, loaded via `next/font/google`
