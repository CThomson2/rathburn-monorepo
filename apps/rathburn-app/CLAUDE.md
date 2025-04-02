# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `pnpm dev` or `npm run dev` - Start development server
- `pnpm build` or `npm run build` - Build for production (runs Prisma generate first)
- `pnpm lint` or `npm run lint` - Run ESLint
- `pnpm test` or `npm test` - Run all tests
- `pnpm test:watch` or `npm run test:watch` - Run tests in watch mode
- `pnpm test -- -t "test name"` or `npm run test -- -t "test name"` - Run specific test
- `pnpm prisma:generate` or `npm run prisma:generate` - Generate Prisma client
- `pnpm prisma:pull` or `npm run prisma:pull` - Pull database schema
- `pnpm prisma:build` or `npm run prisma:build` - Pull database schema and generate client
- `pnpm prisma:migrate` or `npm run prisma:migrate` - Run database migrations
- `pnpm clean` or `npm run clean` - Clean Next.js cache

### Monorepo Commands
- `pnpm dev:rathburn` - Start development server for rathburn-app
- `pnpm start:rathburn` - Start production server for rathburn-app
- `pnpm format` - Format all files with Prettier

## Code Standards

- **TypeScript**: Strict typing required; use proper interfaces/types
- **Imports**: Use absolute imports with `@/` prefix (e.g., `@/components/Button`)
- **Components**: React functional components with proper prop typing
- **File naming**: 
  - PascalCase for components (.tsx)
  - camelCase for utilities (.ts)
  - kebab-case for folders
- **Error handling**: Use error boundaries and try/catch for async operations
- **Testing**: Place in `__tests__` directories with `.test.ts(x)` naming
- **State management**: Prefer React Query for server state, context for app state

### Project Structure
- Organize code by features within the `features` folder
- Each feature should include only folders necessary for that feature:
  - api - API request declarations
  - components - Feature-specific components
  - hooks - Feature-specific hooks
  - types - Feature-specific types
  - utils - Feature-specific utility functions

### Import Guidelines
- Avoid cross-feature imports; compose features at the application level
- Follow unidirectional architecture:
  - Shared modules can be used anywhere
  - Features can import from shared modules but not from app
  - App can import from features and shared modules

### Formatting
- ESLint is used for code linting
- TypeScript is configured with strict mode for type checking
- Use proper error handling with try/catch for async operations

## Tools

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- Supabase auth
- Jest/React Testing Library
- ESLint/TypeScript-ESLint
- pnpm package manager
- Turbo for monorepo management