# Rathburn Operations Monorepo

This monorepo contains the applications used for Rathburn's inventory and operations management.

## Applications

### Web Application (https://rathburn.app)

The main operations dashboard for managing inventory, tracking drums, processing orders, and monitoring stock levels. Built with Next.js and Supabase for real-time data management.

Key features:

- Inventory management dashboard
- Drum tracking and assignment
- Order processing
- Stock history visualization
- Real-time activity monitoring

### Mobile Application (https://mobile.rathburn.app)

A companion mobile application optimized for warehouse operations, primarily focused on barcode scanning and inventory updates. Built with React and integrated with barcode scanning hardware.

Key features:

- Barcode scanning integration
- Real-time inventory updates
- Mobile-optimized interface
- Offline capability with sync

## Development

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development servers for all applications
pnpm dev

# Or start a specific app
pnpm dev --filter=web
pnpm dev --filter=mobile
```

### Build

```bash
# Build all applications
pnpm build

# Build specific application
pnpm build --filter=web
pnpm build --filter=mobile
```

## Project Structure

- `apps/web`: Main Next.js web application
- `apps/mobile`: React mobile application
- `apps/docs`: Documentation site
- `packages/`: Shared libraries and utilities

## Deployment

Automated deployments are handled through CI/CD pipelines. See `deployment.md` for detailed deployment procedures.

## Documentation

Application-specific documentation can be found in the respective app directories:

- Web app: `apps/web/docs/`
- Mobile app: `apps/mobile/docs/`
