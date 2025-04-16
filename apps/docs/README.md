# Rathburn Documentation Portal

A centralized documentation site for the Rathburn Ops monorepo, built with [Docusaurus](https://docusaurus.io/).

## Project Overview

This project aims to organize scattered markdown documentation from across the monorepo into a structured, browsable web interface using Docusaurus and a custom file tree navigation component.

## Features

- **Centralized Documentation**: Consolidates all documentation from the monorepo in one place
- **File Tree Navigation**: Intuitive file tree interface for browsing documentation
- **Categorized Content**: Documents organized by type (user guides, development, architecture, deployment)
- **Search Functionality**: Full-text search across all documentation
- **Responsive Design**: Mobile-friendly interface

## Development Roadmap

### Phase 1: Setup & Configuration (Completed)

- [x] Initialize Docusaurus project
- [x] Configure project settings
- [x] Implement Tailwind CSS integration
- [x] Implement file tree component
- [x] Create script to find markdown files

### Phase 2: Content Migration (In Progress)

- [ ] Scan monorepo for markdown files
- [ ] Categorize documentation
- [ ] Create logical folder structure
- [ ] Migrate content with proper front matter
- [ ] Create landing pages for each category

### Phase 3: UI Refinement

- [ ] Enhance file tree styling and functionality
- [ ] Implement light/dark mode
- [ ] Improve responsive design
- [ ] Add search functionality
- [ ] Create custom theme that aligns with Rathburn branding

### Phase 4: Integration & Deployment

- [ ] Setup CI/CD pipeline
- [ ] Configure automatic documentation updates
- [ ] Set up versioning
- [ ] Deploy to production environment

## File Organization Structure

```
docs/
├── user-guides/    # End-user documentation
├── development/    # Developer documentation
│   ├── components/ # Component documentation
│   ├── api/        # API documentation
│   └── hooks/      # Hooks documentation
├── architecture/   # System architecture documentation
└── deployment/     # Deployment and infrastructure documentation
```

## Getting Started

### Installation

```
$ cd apps/docs
$ npm install
```

### Local Development

```
$ npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Documentation Migration

A utility script is provided to help find and organize markdown files from the monorepo:

```
$ node scripts/find-markdown.js
```

This script:

1. Finds all markdown files in the monorepo
2. Categorizes them based on content and location
3. Creates appropriate documentation directories
4. Prepares files for copying (when enabled)

To actually copy the files, uncomment the `copyFiles(categorized)` line in the script.

## Contributing

Guidelines for contributing to the documentation:

1. Place new documentation in the appropriate category folder
2. Use front matter to specify title and sidebar label
3. Follow markdown best practices
4. Include links to related documentation when relevant

## License

This project is licensed under the terms of the MIT license.
