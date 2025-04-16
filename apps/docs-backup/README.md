This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

# Rathburn Documentation Portal

This project creates a centralized documentation site for the Rathburn Ops monorepo, organizing scattered markdown files into a structured, browsable interface using Docusaurus.

## Project Overview

The documentation portal will serve as the central knowledge base for the Rathburn project, making documentation easily accessible through an intuitive file tree interface.

## Project Stages

### 1. Setup & Migration

- [x] Create Next.js app in monorepo structure (completed)
- [ ] Migrate from Next.js to Docusaurus
- [ ] Configure Docusaurus with proper site structure
- [ ] Define documentation categories and sidebar structure

### 2. Content Organization

- [ ] Scan monorepo for all markdown files
- [ ] Categorize documentation into logical groups:
  - User guides
  - API documentation
  - Development guides
  - Architecture documentation
  - Configuration guides
- [ ] Migrate content to appropriate locations in Docusaurus structure

### 3. UI Implementation

- [ ] Implement file tree component for navigation
- [ ] Create homepage with search functionality
- [ ] Develop responsive layout compatible with desktop and mobile
- [ ] Implement dark/light mode theming

### 4. Integration & Deployment

- [ ] Setup CI/CD pipeline for automatic documentation builds
- [ ] Configure versioning for documentation
- [ ] Implement search functionality
- [ ] Deploy to production environment

## Docusaurus Implementation

The current Next.js structure will be replaced with Docusaurus for better documentation features:

```
docs-site/
├── docs/                   # Main documentation content
│   ├── intro.md            # Introduction page
│   ├── user-guides/        # User-facing documentation
│   ├── development/        # Developer documentation
│   └── architecture/       # Architecture documentation
├── src/
│   ├── components/         # Custom React components
│   │   └── ui/             # UI components including file tree
│   └── pages/              # Custom pages
├── static/                 # Static assets
├── docusaurus.config.js    # Docusaurus configuration
├── sidebars.js             # Sidebar navigation configuration
└── package.json            # Project dependencies
```

## File Tree Component Implementation

The file tree component will be implemented according to the specifications in TASK.md, providing an intuitive way to navigate the documentation structure.

## Next Steps

1. Install Docusaurus and migrate from Next.js structure
2. Create a script to find and analyze all markdown files in the monorepo
3. Implement file tree component for documentation navigation
4. Design documentation categories and structure
