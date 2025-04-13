# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Dev: `npm run dev` - Start the development server
- Build: `npm run build` - Build for production
- Build (dev): `npm run build:dev` - Build for development
- Lint: `npm run lint` - Run ESLint checks
- Preview: `npm run preview` - Preview production build

## Code Style
- TypeScript + React with strict typing
- Use functional components with hooks
- Follow shadcn/ui component patterns
- Use TailwindCSS for styling
- Import order: React → libraries → components → hooks → utils
- Use path aliases: @/* for imports from src/
- Components use PascalCase, utilities use camelCase
- Handle errors with try/catch and provide user feedback
- Prefer explicit returns and type annotations
- Organize large components with custom hooks