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

## Data Fetching & Caching

### Server Actions vs API Routes

#### Server Actions

**When to use Server Actions:**

- **Form submissions**: Perfect for handling form data (as you suspected)
- **Data mutations**: Creating, updating, or deleting records
- **Actions that** modify state: Changing status of drums, updating batch information
- **Progressive enhancement**: They work even without JavaScript enabled
- **Authentication-dependent operations**: Actions that need the current user's context

**When to use API Routes**:

- **Complex data aggregation**: When you need to combine data from multiple sources
- **Third-party API interactions**: When you need to proxy requests to other services
- **Webhook endpoints**: For receiving data from external services
- **Public endpoints**: That might be consumed by other applications
- **Streaming data**: For SSE (Server-Sent Events) or other streaming responses

**Filtering Data - Client vs Server**:

For your inventory management system, I recommend a hybrid approach:

- **Server-side filtering**:

- Filter data at the database level using Supabase queries
- Advantages:

  - Much more efficient for large datasets (only fetches what you need)
  - Reduces bandwidth usage
  - Can leverage database indexes for faster queries
  - Works well with Supabase's built-in filtering capabilities

- **Client-side filtering:**

  - Only useful for:

    - Very small datasets already loaded in the browser
    - Quick UI toggles where re-fetching would be disruptive
    - When you need instant feedback without network latency

#### API Routes

Request Data

1. URL query params `/api/drums?param=value`

   - `GET`: for optional or filtering parameters

2. NextJS path params `/api/drums/[id]/route.ts`

   - `GET`: for resource identification

3. Request body `/api/drums/route.ts`

   - `POST`, `PUT`, `DELETE`: for creating, updating, or deleting resources

4. `useParams`
5. `usePathname`
6. `useRouter`
7. `useSession`
8. `useUser`
9. `useSearchParams`
