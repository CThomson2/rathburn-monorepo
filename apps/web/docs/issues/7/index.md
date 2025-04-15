# Reimagined Database Operational Schema

## Develop Database Architecture & Basic React Components for Production Tracking System

### Issue Title: Develop Database Schema & Initial React UI for Production Tracking

**Description:**
This issue covers the development of the core database architecture and basic React components for a production tracking system that monitors raw material drums, their processing into different chemical grades, and any reprocessing workflows.

This will include:

1. **Database Schema Implementation**
   - [x] Create fresh new schema
   - Define tables to track drums, distillations, and reprocessed materials.
   - [ ] Consolidate orders, delivery batch code into single Drums table
   - Establish relationships between tables to handle many-to-many and one-to-many cases.
   - [ ] Add junction tables
   - Implement relevant constraints and indexes for performance.
   - [ ] Determine suitable index columns for common queries
   - Create trigger functions for automatic updates based on drum status changes.
   - [ ] Base off existing triggers in current schema
   - [ ] Create `activity` table reflecting original `transactions` table
2. **Basic React UI for Demonstration**
   - Drum Inventory Table → Displays all tracked drums with statuses (Pending, In Stock, Staged, Loaded, Repro).
   - Distillation Records View → Shows history of distillations, including drums used and final output grades.
   - Barcode Scan Log UI → Displays recently scanned drums and their updated status.

---

### Database Schema Requirements

**Tables to Implement**

- **Drums** → Tracks individual drums from arrival to processing.
- **Distillations** → Logs each distillation, including start/end times and stills used.
- **DistillationDrums (Junction)** → Tracks which drums were used in which distillation.
- **DistillationGrades** → Stores the different chemical grades produced in a distillation.
- **ReproDrums** → Records reprocessed drums created from failed or leftover material.
- **ReproDrumContent (Junction)** → Tracks the source of material added to reprocessed drums.

**Triggers & Automation**

- When a new drum is ordered, it is added to Drums with a Pending status.
- Upon scanning at intake, its status changes to In Stock.
- When scheduled for processing, status updates to Staged.
- Once processed, a record in Distillations is created, and the drum status is updated.
- If material is left over, it is transferred into ReproDrums, maintaining traceability.

---

### React UI Development Tasks

1. **Basic Components**

   - `<DrumTable />`
     - Displays all drums with ID, material type, batch code, and status.
     - Allows filtering by status (e.g., Pending, In Stock, Staged).
   - `<DistillationTable />`
     - Lists completed distillations, the still used, and output grades.
     - Allows selection to view details (e.g., which drums contributed).
   - `<ScanLog />`
     - Displays the latest barcode scans with timestamps.
     - Shows status updates in real-time.

2. **API Endpoints to Support UI**
   - `GET /api/drums` → Fetch all drum records.
   - `GET /api/distillations` → Fetch distillation records.
   - `POST /api/scan` → Updates drum status based on barcode scan.

---

### Milestones

**Phase 1: Database Implementation**

- Design and implement schema in PostgreSQL
- Define foreign keys and relationships
- Add triggers for automatic status updates

**Phase 2: Basic API & Backend**

- Implement Express routes for CRUD operations
- Integrate Prisma ORM for database interactions
- Test API endpoints with sample data

**Phase 3: React UI for Demo**

- Create basic table components
- Connect UI to API endpoints
- Implement real-time updates for scans

**Phase 4: Refinement of Pages**

- Utilise TanStack libraries
- [ ] Import and install useQuery and useTable
- [ ] Create modular `columns.tsx` component file to import for various tables
- [ ] Create types for table components
- [ ]

---

### UI & UX Enhancements

#### Stock Sheets App Routes

**Drums Table**

_List drums in series of mini tables, collapsible under a row for their respective order details_

```md
## <material> | <supplier> | <qty> | <qty in stock> | <date ordered> | <batch code> | <status>

## Collapsed state; each order separated in the table/list of tables by gap

Expanded state:
material | supplier | drum ID | date received | <date ordered> | <batch code> | <status>
1000 | Hexane | Caldic | 03 Mar | 24 Feb | FG29871 | pre-production
1001 | Hexane | Caldic | 03 Mar | 24 Feb | FG29871 | in stock
1002 | Hexane | Caldic | 03 Mar | 24 Feb | FG29871 | processed
1003 | Hexane | Caldic | 03 Mar | 26 Feb | FG29874 | processing
...
1009 | Hexane | Caldic | 03 Mar | 26 Feb | FG29874 | in stock
```

_Colour / shade rows based on status_:

- in stock: green
- pre-production: yellow?
- in-production: high contrast
- processed: grey, low contrast text (italics)?

**Features**

- [ ] Filter drum groups (ie orders) by **supplier**, **date range**
- [ ] Click to toggle plain view with no order separation, just rows of drums
- [ ] Filter by drum statuses
- [ ] Sort orders by various fields
- [ ] Sort drums within orders
- [ ] Drum rows interactive (hover effect) and expand a sidebar (right) or modal with details
- [ ] Drum modal/detail view **has the ability to assign to existing production run scheduled** and other operational data CRUD capabilities

**Repro Drums**

_Same table UI design, different columns. Relates to distillations in similar way to Drums relating to orders_

**Stock Control Table**

_Row for each event (Activity table, filtered for valid scans of in/out (not pre-production) drum movements_

> Find an effective UI design for the 300 material columns from Excel

--

#### Production App Routes

**Production Scheduling/Management**

**QRD Records**

---

### Acceptance Criteria

- The database schema is fully functional and supports all necessary operations.
- The React UI allows basic interaction with drum inventory and distillation records.
- The barcode scanning system updates drum status correctly.
- The system follows business logic accurately and ensures traceability.

**Priority:** High  
**Labels:** backend, frontend, database, MVP
