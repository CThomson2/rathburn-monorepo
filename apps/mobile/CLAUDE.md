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
- Use path aliases: @/\* for imports from src/
- Components use PascalCase, utilities use camelCase
- Handle errors with try/catch and provide user feedback
- Prefer explicit returns and type annotations
- Organize large components with custom hooks

## Industrial Environment Considerations

### UI/UX for Industrial Setting

- Use large, easily tappable buttons (minimum 48x48px touch targets)
- High contrast colors for visibility in different lighting conditions
- Simple, intuitive layout for workers who may be wearing gloves
- Clear feedback for scan success/failure (visual and possibly audio cues)

### Performance Optimization

- Minimize bundle size for faster loading on potentially limited networks
- Implement efficient state management (consider Zustand or Jotai for lightweight options)
- Use React.memo and useMemo to optimize rendering performance
- Lazy load components that aren't immediately needed

### Offline Capabilities

- Robust caching of app assets via service worker
- Store scan data locally when offline using IndexedDB
- Sync data when connection is restored
- Clear visual indicators of online/offline status

### Future Honeywell SDK Integration

- Design with abstraction layers for scanner functionality
- Create scanner service with interface that can be implemented by both basic input and future SDK
- Keep core scanning logic separate from UI components
