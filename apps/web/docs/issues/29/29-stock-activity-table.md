# Issue 29: Schema Design for `stock_activity`

## Workspace info

- GitHub repo: **rathburn-online**
- Feature branch to be used: **29-db-implement-stock-activity-table**
- Supabase project: **Inventory Management**
- File System repository codebase location: **`/Users/conrad/Documents/apps/rb-dashboard/`**
- Local Supabase folder with migrations: **`/Users/conrad/Documents/apps/rb-dashboard/supabase/`**

## Setting up environment for work

- [x] Create new GitHub feature branch for database prototyping and push to remote
- [x] Copy/migrate/backup database schema structure from Supabase 'main' branch
- [x] Using Supabase branching, select and switch to newly created branch
- [ ] Apply migration (`apply_migration`) to new feature branch
- [x] Create new markdown documents in /docs dir, and update it with documentation after each successive distinct step in the workflow roadmap laid out below

### Docs

1. [Supabase Migrations](https://supabase.com/docs/guides/local-development/overview)
2. [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)

## Final Data Processing

- [ ] Select stock history rows missing quantity from event string
- [x] Update materials to match reference table
- [x] Replace raw materials for red materials code
- [ ] Match suppliers where applicable
- [ ] Split multi-material events into individual row
- [ ] Replace data in drum type column by using CASE WHEN on condition of material_name ending with "\_repro" or not (this will make it 100% accurate)
- [ ] Rename table to stock_activity (as it will be used as live operational table)

_Extra_

- [ ] Remove unnecessary columns and drop raw data table
- [ ] Write query to report on inconsistencies between source material and material_name extracted from event_str (due to potential errors propagated from raw data)

## Table Logic (Constraints, trigger functions)

- [ ] quantity != 0
- [ ] If quantity > 0, supplier_id must be not null AND reference row in ref_suppliers
- [ ] Determine optimal trigger function logic for the "drums arriving in stock" workflow

  - Currently order_detail runs triggers to generate series of new records in stock_drum when new order is created (records begin with default status "en_route"
  - When drums arrive physically at our facility, each is scanned, which updates drum_stock status value to "in_stock"
  - _This status change_ triggers the function to insert/update stock_new, which works by inserting a new record for the first scanned drum of the batch, then incrementing quantity of that field for each subsequent drum of the delivered batch
  - stock_activity (renamed new table) tracks each incoming/outgoing event, recording multi-drum events as one record. A batch of delivered drums would be one record with quantity of the amount which arrived.
  - this seems to overlap to a degree with existing stock_drum --> stock_new logic

- [ ] Create a new junction table mapping order_detail to stock_activity
  - M-M relation allows for multiple deliveries for a single ordered batch
- [ ] Add insert triggers triggered by order_detail (or stock_drum?)
- [ ] Create foreign key relation on stock_activity, referencing distillation_schedule_detail
- [ ] Enforce above FK as not null WHEN stock_activity quantity < 0 (I.e. leaving stock to be processed in a distillation)

_Extra_

- [ ] Thoroughly test all constraints and functionality
- [ ] Review relevant schema tables for redundancy/inefficiencies after integrating stock_activity

## Wrapping Up DB Design Tasks

- [ ] Conclude the workflow document markdown file with summary of progress
- [ ] Commit work to feature branch and open a PR to merge into main on Supabase & GitHub

## NextJS App Integration

- [ ] Review table RLS policies (visibility, targeted restrictions on modifications, etc.)
- [ ] Determine if users should be able to modify the table _at all_, or whether it functions entirely via database logic (e.g. triggers managing all updates / inserts)
- [ ] Generate database types for type safety
- [ ] Test a few basic queries with SELECT, INSERT, UPDATE to ensure policies and DB connection are configured correctly

## Data Visualisation

- [ ] Create new page route in app router for visualising and interacting with stock_activity data (as well as related tables)
- [ ] Create a spline graph component on page using ReCharts or a similar module
- [ ] Using SSR, fetch initial data on page load:
  - \_Default data fetched on load will be the last 6 months as time period, with chart showing line graph of the quantity of all (aggregated) materials over the time period. Data will be categorised into two sets (two lines): one for "new" drum_type records, and the other for "repro" drum_type
  - Use SUM aggregate on quantity field in stock*activity*
- [ ] Set up time period filters:
  - Entire dataset spans from March 2023 to March 2025 (but will continually be added to with live data when app in production)
  - Allow for filtering for smaller date ranges
- [ ] Create a wide search bar component at the top centre of page view, accessible with click or Cmmd+K shortcut (Ctrl+K on Windows)
  - [ ] Allow searching with either full material name, material code (from ref_materials.code), and supplier name
