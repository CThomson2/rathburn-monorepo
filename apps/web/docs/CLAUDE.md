# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands

- Build: `pnpm build` (generates Prisma client, builds Next.js)
- Dev: `pnpm dev` (starts Next.js dev server)
- Start: `pnpm start` (starts production server)
- Lint: `pnpm lint` (runs ESLint with max-warnings 0)
- Type Check: `pnpm check-types` (runs TypeScript with --noEmit)
- Monorepo commands: `pnpm build:web`, `pnpm lint:web` (runs for web app only)

## Code Style Guidelines

- **Architecture**: Follow unidirectional flow (shared → features → app) with strict feature isolation
- **Imports**: Use absolute imports with `@/` prefix (e.g., `@/components/ui/button`)
- **Components**: Use PascalCase for component files (.tsx), kebab-case for folders
- **TypeScript**: Always use proper typing with interfaces/types, strict mode enabled
- **UI Components**: Use shadcn/ui components from `src/components/ui`
- **File naming**: PascalCase for components (.tsx), camelCase for utilities (.ts), kebab-case for folders
- **Testing**: Place tests in `__tests__` folders with `.test.ts[x]` extension
- **Error Handling**: Use try/catch blocks for async operations, React Error Boundary for components
- **State Management**: Use React Query for server state, context/hooks for UI state

## Project Structure

- Code organized by features in `src/features/` folder
- Feature folders include: api, components, hooks, types, utils
- Avoid cross-feature imports; compose at application level
- Shared components in `src/components/ui`

## Tools

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase auth
- React Query for data fetching
- Prisma ORM with PostgreSQL
- shadcn/ui for UI components
