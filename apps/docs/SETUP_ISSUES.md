# Docusaurus Setup Issues and Solutions

## Current Status

We've successfully set up the foundation for the Rathburn Documentation portal using Docusaurus, including:

- Created Docusaurus project structure
- Implemented the file tree component for navigation
- Created a script to find and organize markdown files
- Designed the homepage with the file tree demo
- Set up Tailwind CSS integration
- Updated README with project planning details

## Issues Encountered

1. **Node.js Version Compatibility**:

   - The latest Docusaurus (3.7.0) requires Node.js with ES module support
   - Current Node.js version (v18.20.5) appears to be having issues loading ES modules

2. **Dependency Conflicts**:
   - React 19 (required by Docusaurus 3.7.0) conflicts with lucide-react which expects React 16-18
   - Various peer dependency conflicts between Radix UI components and React version

## Potential Solutions

### Option 1: Use an earlier version of Docusaurus

- Downgrade to Docusaurus 2.x which has better compatibility with Node.js v18
- Modify the file tree component to work with React 18 instead of React 19

### Option 2: Update Node.js version

- Upgrade to Node.js v20 which has better support for ES modules
- Keep the current dependencies

### Option 3: Use Next.js instead

- Since the monorepo already uses Next.js for other apps, consider building the documentation site with Next.js
- This would provide better compatibility with the existing UI components and structure

## Next Steps

1. Choose one of the options above to resolve the compatibility issues
2. Complete the implementation of the file tree component with proper navigation
3. Set up the script to find and organize markdown files
4. Create the documentation structure and migrate existing content

## Recommended Approach

The recommended approach is **Option 3: Use Next.js instead** for the following reasons:

1. Better compatibility with the existing monorepo structure
2. Reuse of existing UI components and styling from other apps
3. Consistent development experience across the monorepo
4. More flexibility in customizing the documentation site UI

To implement this approach:

1. Convert the current Docusaurus structure to Next.js
2. Keep the file tree component implementation
3. Adapt the documentation organization script for Next.js
4. Use the existing monorepo styling and components where possible
