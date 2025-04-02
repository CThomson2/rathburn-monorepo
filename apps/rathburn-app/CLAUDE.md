# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (runs Prisma generate first)
- `npm run lint` - Run ESLint
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test -- -t "test name"` - Run specific test
- `npm run prisma:generate` - Generate Prisma client

## Code Standards

- **TypeScript**: Strict typing required; use proper interfaces/types
- **Imports**: Use absolute imports with `@/` prefix (e.g., `@/components/Button`)
- **Components**: React functional components with proper prop typing
- **File naming**: PascalCase for components (.tsx), camelCase for utilities (.ts)
- **Directories**: kebab-case for folders
- **Error handling**: Use error boundaries and try/catch for async operations
- **Testing**: Place in `__tests__` directories with `.test.ts(x)` naming
- **State management**: Prefer React Query for server state, context for app state

## Tools

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- Supabase auth
- Jest/React Testing Library
- ESLint/TypeScript-ESLint
