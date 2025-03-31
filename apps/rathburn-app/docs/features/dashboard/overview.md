# Overview of Dashboards and Widgets

## File structure

// app/
// ├── layout.tsx // Main layout with navigation/auth wrapper
// ├── page.tsx // Landing page (redirects to login or dashboard)
// ├── login/ // Authentication pages
// │ └── page.tsx
// ├── dashboard/
// │ ├── layout.tsx // Dashboard shared layout
// │ ├── page.tsx // Main dashboard overview page
// │ ├── actions.ts // Shared server actions for dashboard
// │ ├── utils/ // Shared utility functions
// │ │ ├── supabase-server.ts // Server-side Supabase client initialization
// │ │ └── supabase-client.ts // Client-side Supabase hooks
// │ ├── components/ // Shared dashboard components
// │ │ ├── DashboardHeader.tsx
// │ │ ├── Sidebar.tsx
// │ │ └── widgets/ // Reusable widget components
// │ │ ├── WidgetContainer.tsx
// │ │ └── ...
// │ ├── inventory/
// │ │ ├── page.tsx // Inventory dashboard main page
// │ │ ├── actions.ts // Inventory-specific server actions
// │ │ ├── api/ // API routes for inventory
// │ │ │ └── route.ts // Complex data fetching, aggregations
// │ │ ├── components/ // Inventory-specific components
// │ │ │ ├── StatusFilter.tsx
// │ │ │ ├── DrumTable.tsx
// │ │ │ └── WorkflowDiagram.tsx
// │ │ └── [id]/ // Dynamic route for individual drum details
// │ │ └── page.tsx
// │ ├── production/
// │ │ └── ... // Similar structure as inventory
// │ └── admin/
// │ └── ... // Similar structure as inventory
// └── api/ // Global API routes
// └── webhooks/
// └── route.ts // Handling external services callbacks
