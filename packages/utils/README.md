# @rathburn/utils

A shared utilities package for Rathburn applications.

## Installation

This package is internal to the Rathburn monorepo and is automatically available to all workspace packages.

## Usage

```typescript
import { findSimilarSupplierName, showSuggestionToast } from "@rathburn/utils";

// Example usage of supplier name suggestion
const supplierList = ["Acme Inc", "Global Industries", "Tech Solutions"];
const userInput = "Acme Incorporated";
const suggestion = findSimilarSupplierName(userInput, supplierList);

if (suggestion) {
  showSuggestionToast("Did you mean:", suggestion, () => {
    // Handle confirmation
    console.log(`User confirmed: ${suggestion}`);
  });
}
```

## Available Utilities

### Supplier Utilities

- `findSimilarSupplierName`: Finds the closest matching supplier name from a list of suppliers

### Toast Utilities

- `showSuggestionToast`: Displays a confirmation toast with suggestion and action buttons
- `centeredConfirmToastConfig`: Configuration for centered confirmation toasts

## Development

To build the package:

```bash
pnpm build
```

To watch for changes during development:

```bash
pnpm dev
```
