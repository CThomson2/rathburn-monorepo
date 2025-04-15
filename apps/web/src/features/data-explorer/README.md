# Data Explorer Feature

## Overview

The Data Explorer is a comprehensive tool for exploring and analyzing data in the application. It provides two main views:

1. **Spreadsheet View** - A tabular representation of data with filtering, sorting, and pagination
2. **Query Builder View** - A visual interface for building complex queries

## Development Status

These components are currently under active development and may cause build failures in production environments.

## Build Configuration

To prevent build failures, the following measures have been implemented:

1. **Dynamic Imports with Error Handling**

   - Components are loaded dynamically with fallbacks
   - Error boundaries catch and handle exceptions gracefully

2. **Environment Variable Control**

   - Set `EXCLUDE_DATA_EXPLORER=true` in `.env.local` to exclude these components from the build
   - This activates webpack rules that replace the problematic components with null loaders

3. **Client-Side Only Rendering**
   - Components are configured with `ssr: false` to avoid server-side rendering issues

## How to Enable/Disable

### To Disable Data Explorer in Builds

Ensure `.env.local` contains:

```
EXCLUDE_DATA_EXPLORER=true
```

### To Enable Data Explorer in Builds

Set in `.env.local`:

```
EXCLUDE_DATA_EXPLORER=false
```

## Troubleshooting

If you encounter build failures:

1. Check that `EXCLUDE_DATA_EXPLORER=true` is set in your environment
2. Verify that the webpack configuration in `next.config.js` is correctly excluding the components
3. Check for errors in the console related to dynamic imports

## Component Architecture

- **index.tsx** - Main entry point that handles tab switching between views
- **components/spreadsheet-view.tsx** - Table-based view with filtering/sorting
- **components/query-builder-view.tsx** - Visual query builder
- **constants/tables.ts** - Available tables and query building utilities
- **hooks/use-columns.ts** - Hook for fetching column information
