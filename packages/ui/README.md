# @rathburn/ui

A shared UI component library that contains common components used across web and mobile applications.

## Overview

This package contains reusable UI components built with:

- React
- Radix UI
- Tailwind CSS
- Class Variance Authority (CVA)

## Component Types

Components in this package fall into three categories:

1. **Identical components**: Components that are 100% identical between web and mobile applications.

   - These are directly imported from the shared package.
   - Examples: accordion, alert, aspect-ratio, etc.

2. **Configurable components**: Components with minor differences between platforms.

   - These provide options to customize behavior per platform.
   - Both web and mobile apps can import and configure these components.
   - Example: Button component with configurable shadow, focus styles, and sizes.

3. **Platform-specific components**: Components with significant differences.
   - These remain in the respective app's `components/ui` folders.
   - When appropriate, they can import and extend components from this package.

## Usage

### Identical Components

```tsx
import { Accordion, Toast } from "@rathburn/ui";

// Use directly in your application
<Accordion type="single">
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>;
```

### Configurable Components

```tsx
// Web app
import { Button, webButtonVariants } from "@rathburn/ui";

// Mobile app
import { Button, mobileButtonVariants } from "@rathburn/ui";

// Custom button with specific platform options
import { Button, createButtonVariants } from "@rathburn/ui";

const customButtonVariants = createButtonVariants({
  useShadow: true,
  focusRingStyle: "ring-2",
  useRingOffset: true,
});
```

## Maintenance

To keep this package up-to-date:

1. Use the `scripts/update-ui-package.sh` script to detect identical components:

   ```bash
   ./scripts/update-ui-package.sh
   ```

2. When creating new platform-specific variations:

   - Create the base component in this package with configuration options
   - Create platform-specific wrappers in the app's UI folders

3. Build the package:
   ```bash
   pnpm --filter @rathburn/ui build
   ```

## Adding New Components

1. Determine if a component should be shared or platform-specific
2. For shared components, add them to `packages/ui/src/components/[component-name]/index.tsx`
3. Export the component in `packages/ui/src/index.ts`
4. Build the package

## Guidelines for New Components

- Make components configurable when platform-specific variations are needed
- Follow the same directory structure and naming conventions
- Include TypeScript interfaces and comprehensive documentation
- Keep dependencies consistent with existing components
