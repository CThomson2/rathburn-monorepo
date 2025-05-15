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



An (integer) number of drums, in this batch, currently in stock

I did some rapid development recently, making a new feature revolving around the user workflow of shcheduling production (distillation) processes (the app is for internal company use). I worked on it with a colleague, and there are a few issues with the system design for this feature, though I think it's just a case of ironing out a few small wrinkles - type errors, DB naming conflicts etc.

So, this feature encompasses both the web app and mobile app, as well as database functionality. You will need to use the Supabase MCP server to list the DB tables, query it to get an understanding of the logic and functionality, constraints etc.

This feature is in the form of a workflow, which is initiiated in a user form (UI) on the nextJS web app. The components for this are in web/src/features/production/components. (please ignore the adjacent folder "<...>/production/production", this is irrelevant. Just the production/components folder is what we're focusing on.

The barrel export file:@index.ts shows which components are used. The producrtion UI features are in two places:
- the global layout sidebnar, @app-sidebar.tsx . Specifically, the "Production" dropdown in the sidebar menu. Right now, the only one of the three items in the production sidebar section that is active is the "schedule_distillation". When clicked, this opens a 3-step modal: @create-job-modal.tsx  (three views to click through). 

You'll see the term "job" a lot in the code for this feature. This means a production job, which is an operation in the physical business for transporting and distilling our raw materials. This is the "entry point" table in the supabase `production` schema. We will focus on this schema mainly, though others will be involved later. Always list tables from `public` too when using supabase as some functions and views are defined in public even if they relate to the production schema.

The production form (@production-form.tsx ) is used to generate (insert) a new record into the `jobs` table, and I think it will also insert record(s) into the `operations` table (which is a child table of `jobs`). (When I use table names assume it's `production` schema here).

We are now moving into discussion on the `inventory` schema too. The inventory schema contains tables representing our stock, i.e. the stock that will be scheduled for a production run. There are interlinking relations between these schemas. See `inveetnrory.batches`, `inventory.drums`. The user who fills out the production schedule form will specify a specific `item` to be produced. `invetntory.items` is a reference table (constant, fixed data for our purposees). `items` is a table listing every single distinct raw material item. By `item`, I mean that we can habe two records for the material Acetone, if each is manufactured by a different one of our suppliers. `items` records are unique by the combined index (material_id, supplier_id).

`batches` is a table of actual batches in stock (batches of raw materials/drums). This is a dynamic table, changing as inventory levels change. It has a `total_volume` field.

**Important point on `total_volume`**: