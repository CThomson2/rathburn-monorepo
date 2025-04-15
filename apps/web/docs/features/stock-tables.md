# # Raw Material Inventory Data Table & KPI Dashboard

## USER STORIES

- Build a responsive, interactive table for raw material inventory (7,000+ rows) integrated with Prisma (ORM) and Next.js.
- Include grouped views, pagination, and custom row formatting based on stock status.
- Provide a KPI dashboard with visualizations derived from the same data.
- Use TanStack Table + Query
- Utilise ShadcnUI as preferred design paradigm

## Milestone 1: Base Data Table MVP

**Objective:** Render a minimal working table with data fetched from the backend (via Prisma + Next.js App Router).

- [ ] **Set up server route for raw material data**
  - [ ] Create a new API endpoint (e.g., app/api/inventory/route.ts).
  - [ ] Use Prisma to fetch raw materials (limit the dataset for initial testing, e.g. first 100 rows).
  - [ ] Return JSON array for the table.
- [ ] **Implement basic table in frontend**
  - [ ] Create a new page/component (e.g., app/inventory/page.tsx) that fetches data from the /api/inventory endpoint.
  - [ ] Set up TanStack Table with the fetched data, displaying only a few key columns (e.g., material_name, quantity, status).
- [ ] **Ensure responsiveness**
  - [ ] Use ShadcnUI or basic Tailwind classes to ensure the table resizes nicely on smaller screens.
  - [ ] Confirm minimal styling for clarity.

**Acceptance Criteria:** A single page renders a table with raw material data from the database; table is responsive on mobile and desktop.

---

## Milestone 2: Pagination & Core Table Interactivity

**Objective:** Handle 7,000+ rows efficiently with pagination, basic sorting, and filtering.

- [ ] **Add Pagination (TanStack Table)**
  - [ ] Implement server‐side or client‐side pagination (depending on performance preference).
  - [ ] Provide page navigation (e.g., "1, 2, 3…").
  - [ ] Confirm performance remains smooth when loading new pages.
- [ ] **Sorting**
  - [ ] Allow users to sort by at least one or two key fields (e.g., material_name, order_id).
  - [ ] Sort either server‐side (to avoid pulling all data at once) or client‐side (if feasible with chunked data).
- [ ] **Filtering**
  - [ ] Introduce column filtering or global search, e.g., filter by status.
  - [ ] Decide on server‐side or client‐side approach for best performance.

**Acceptance Criteria:** Users can navigate through pages of data, sort rows by major columns, and filter table contents. All queries remain performant.

---

## Milestone 3: Grouping & Expanded Rows

**Objective:** Enable grouping by order_id with expandable sub‐rows showing individual drums.

- [ ] **Database Query/ORM Enhancement**
  - [ ] Update Prisma query or define a new endpoint that returns nested data grouped by order_id.
  - [ ] Example structure:

```json
[
  {
    "order_id": 123,
    "order_details": [
      { "drum_id": 1, "status": "in_stock", ... },
      { "drum_id": 2, "status": "pending_arrival", ... }
    ]
  },
  ...
]
```

- [ ] **Implement TanStack Table Grouping**
  - [ ] Set up a grouping mechanism in the table config to group rows under a parent row.
  - [ ] Add an expand/collapse toggle that reveals sub‐rows for each order.
- [ ] **Conditional Row Formatting**
  - [ ] Color or style rows based on status (e.g., a subtle color band for in_stock vs. pending_arrival).
  - [ ] Possibly highlight "urgent" statuses.

**Acceptance Criteria:** Rows are grouped by order_id, with a clickable toggle to expand/collapse sub‐rows. Visually indicate row status.

---

## Milestone 4: KPI Dashboard & Visualization

**Objective:** Display high‐level summary statistics and charts for raw material status, usage, etc.

- [ ] **Design Basic KPI Dashboard**
  - [ ] Create a new page (e.g., app/inventory/dashboard.tsx) or a dashboard section on the main inventory page.
  - [ ] Summaries: total stock, number of orders in pending, total processed, etc.
- [ ] **Integrate Graph Library**
  - [ ] Use a chart component (e.g., Recharts, Chart.js, or any ShadcnUI-compatible library).
  - [ ] Show bar/line/pie charts representing relevant stats (e.g., distribution by status).
- [ ] **Connect to Real Data**
  - [ ] Fetch aggregated metrics from your API (e.g., count by status).
  - [ ] Render charts in real-time.

**Acceptance Criteria:** A KPI view presents at least one or two charts (e.g., status distribution, total inventory). Stats update accurately from the database.

---

## Milestone 5: Final Polishing & Design

**Objective:** Improve overall UI/UX, code structure, and ensure a professional look.

- [ ] **Refine Table Design**
  - [ ] Standardize colors, typography, spacing for ShadcnUI components.
  - [ ] Add tooltips or icons for user clarity where needed.
- [ ] **Enhance Performance**
  - [ ] Confirm SSR or CSR approach doesn't slow down rendering of 7,000+ rows.
  - [ ] Add lazy loading or infinite scroll if necessary.
- [ ] **Clean Up & Document**
  - [ ] Ensure folder structure is logical (/app/inventory, /app/inventory/dashboard, etc.).
  - [ ] Add short READMEs or comments to guide future maintainers/users.

**Acceptance Criteria:** Table and dashboard have a cohesive, intuitive design, run efficiently, and are well-documented.

---

## Overall Notes

- Prioritize: Build from core functionality (basic table + data fetch) to advanced features (grouping, charts).
- Test Early: Each milestone should include basic tests to verify the data loads, sorting/filters work, etc.
- Continuous Integration: If possible, set up a simple CI to run lint checks or basic tests on each push.
