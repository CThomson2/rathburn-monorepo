# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

### From Monorepo Root

```bash
# Development
pnpm dev:rathburn                      # Run in development mode

# Build
pnpm build:rathburn                    # Standard build
pnpm build:rathburn:standalone         # Standalone build (for production)

# Run
pnpm start:rathburn                    # Start using server.js wrapper (recommended)
pnpm start:rathburn:standalone         # Equivalent to above
pnpm start:rathburn:pm2                # Start with PM2 (development config)
pnpm start:rathburn:prod               # Start with PM2 (production config)
```

### From App Directory (apps/rathburn-app)

```bash
# Development
pnpm dev                               # Run in development mode

# Build
pnpm build                             # Standard build
pnpm build && pnpm postbuild           # Standalone build (for production)

# Run
pnpm start                             # Start using server.js wrapper (recommended)
pnpm start:standalone                  # Start directly (not recommended)
pm2 start ecosystem.config.js --only rathburn-dev   # Start with PM2 (dev)
pm2 start ecosystem.config.js --only rathburn-app   # Start with PM2 (prod)
```

### Common Commands
- `pnpm lint` - Run ESLint
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test -- -t "test name"` - Run specific test
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:pull` - Pull database schema
- `pnpm prisma:build` - Pull database schema and generate client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm clean` - Clean Next.js cache
- `pnpm format` - Format all files with Prettier

### Troubleshooting
If you encounter "ReferenceError: crypto is not defined" or other module errors:
1. Build with standalone mode: `pnpm build:rathburn:standalone` (or `pnpm build && pnpm postbuild`)
2. Always use the server wrapper: `pnpm start:rathburn` (or `pnpm start`)

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