# UI Component Refactoring Documentation

## Overview

This document explains the refactoring process for UI components in the Rathburn monorepo. The goal was to leverage the monorepo structure by moving common UI components to a shared package while keeping platform-specific components in their respective applications.

## Key Changes

1. Created a new package `@rathburn/ui` for shared components
2. Analyzed components from both web and mobile applications
3. Moved identical components to the shared package
4. Created configurable versions of components that had minor differences
5. Left significantly different components in their original locations
6. Set up proper dependencies and import paths

## Component Analysis Results

- **Identical Components**: 8 components were identical between web and mobile

  - Moved to shared package: accordion, alert, aspect-ratio, card, context-menu, toast, toaster, toggle

- **Components with Differences**: 26 components had differences
  - Created configurable solutions for components with minor differences (e.g., Button)
  - Left components with significant differences in their original locations

## Implementation Strategy

### For Identical Components

- Direct copy to the shared package with the same interface
- Import directly from the shared package in both apps

### For Components with Minor Differences

- Created flexible, configurable base components in the shared package
- Added platform-specific presets (e.g., `webButtonVariants`, `mobileButtonVariants`)
- Updated imports in the original components to use the shared package

### For Components with Major Differences

- Kept these components in their original locations
- Where beneficial, they can import shared components as building blocks

## Maintenance Process

1. **Analysis Script**: Created `scripts/update-ui-package.sh` to:

   - Detect identical components across applications
   - Move new identical components to the shared package
   - Update exports in the shared package

2. **Package Structure**:

   - Components in `packages/ui/src/components/[component-name]/index.tsx`
   - Utility functions in `packages/ui/src/lib/utils.ts`
   - Main exports in `packages/ui/src/index.ts`

3. **Build Process**:
   - Updated TurboRepo configuration to include the UI package in build workflows
   - Used `tsup` for TypeScript compilation with both CJS and ESM output

## Benefits

1. **Reduced Duplication**: Common components are now defined once and shared
2. **Consistent Styling**: Shared components ensure design consistency
3. **Better Maintenance**: Changes to shared components propagate to all apps
4. **Type Safety**: Shared TypeScript interfaces maintain a consistent API
5. **Easier Onboarding**: New developers have a clear distinction between shared and platform-specific components

## Recommendations for New Components

1. Start by determining if a component should be shared or platform-specific
2. For shared components, add configuration options to handle minor variations
3. Use the maintenance script to keep the shared package up-to-date
4. Document platform-specific variations in component comments

## Next Steps

- Consider creating visual tests for shared components
- Expand the shared package with more configurable components
- Add storybook documentation for the shared UI components
- Set up automated tests to ensure components render consistently across platforms
