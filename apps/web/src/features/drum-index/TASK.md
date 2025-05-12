# Implementation Plan: Enhanced Realtime Inventory & Scanning System

## I. Summary of Current State & Recent Developments

The mobile PWA application has undergone a significant refactoring to centralize session and scan state management using a Zustand store (`apps/mobile/src/core/stores/session-store.ts`). This store now handles:

- **Task-Oriented Sessions:** Users can select a specific Purchase Order Line (`pol_id`) as a task (currently focused on "Goods In" / Transport View).
- **Session Lifecycle:** Starting, confirming (with task selection), ending sessions.
- **Scan Processing:**
  - Validating scanned barcodes against the selected task's drums (`purchase_order_drums`).
  - Updating the `is_received` status of drums in `inventory.purchase_order_drums`.
  - Logging scan events (successes and errors) to the new `public.session_scans` table.
- **Realtime UI Updates (Initial Setup):**
  - The mobile app's `TransportView` now shows live progress for the active task, including a list of all drums for that task and their received status, plus a list of drums scanned in the current UI interaction.
  - The web app's `RealtimeScanLogSidebar` component subscribes to `public.session_scans` to display a live feed of scan activities.
  - Initial data for the web app's sidebar is fetched server-side in `DashboardLayout`.

**Key Architectural Changes:**

- Shifted from local component state and older context (`useScan`) to a global Zustand store for session and scanning logic in the mobile app.
- Introduced `public.session_scans` table as the primary source for real-time scan logging and for the web app's feed.
- Created a SQL view `public.v_purchase_order_drum_details` to provide enriched data for display.
- Refactored `TransportView.tsx` to use the Zustand store and display task-specific information and drum lists.
- Refactored `scan-log-sidebar.tsx` (now `RealtimeScanLogSidebar`) to consume data from `public.session_scans`.

## II. Next Steps & Feature Enhancements

This plan outlines further development to build upon the current foundation, focusing on database integrity, advanced real-time UI, and expanded functionality.

### A. Realtime UI Enhancements (Web App - `apps/web`)

1. **Realtime `InventoryGrid.tsx` (`apps/web/src/features/drum-index/components/inventory-grid.tsx`)**:

   - **Objective**: Make the drum inventory grid update in real-time when drum statuses or details change.
   - **Implementation**:
     - Subscribe `InventoryGrid.tsx` to changes in `inventory.drums` and potentially `inventory.batches` or a relevant view (e.g., `v_drums` or `v_batches_with_drums`).
     - When a change is detected (e.g., a drum's status changes due to a scan logged in `public.session_scans` that then triggers an update to `inventory.drums`), re-fetch data for the grid or update the relevant row in the local state.
     - **Visual Feedback**: Implement a "flash" effect (e.g., brief highlight or animation) for a drum in the grid when its data is updated due to a recent scan. This can be managed with local component state triggered by the real-time update.
     - **Caching**: Use a caching system or query on load to fetch initial scan data using the scans made in the last 24 hours from the `session_scan`. Use SWR or NextJS caching.

2. **"Recently Updated Drums" Component (Web App)**:
   - **Objective**: Display a horizontally scrolling row of the N most recently updated/scanned drums above the filter inputs in `InventoryGrid.tsx`.
   - **Implementation**:
     - Create a new component (e.g., `RecentlyScannedDrums.tsx`).
     - This component will subscribe to `public.session_scans` (or `inventory.drums` based on `updated_at`).
     - Maintain a small list (e.g., 5-10) of the most recent unique drums that have been scanned or had their status changed.
     - Display these as drum "circles" similar to `InventoryGrid.tsx`, possibly with minimal detail.

### B. Database Enhancements (`inventory` & `public` Schemas)

1. **Trigger Logic for `public.session_scans` -> `inventory.drums`**:

   - **Objective**: When a `check_in` scan is successfully logged in `public.session_scans` for a `purchase_order_drum`, automate the creation or update of the corresponding record in `inventory.drums` and link it to a batch.
   - **Implementation**:
     - Create/Refine a SQL trigger function (similar to `receive_delivery` but adapted for `session_scans`).
     - This function will be triggered `AFTER INSERT ON public.session_scans` WHERE `scan_action = 'check_in'` AND `scan_status = 'success'`.
     - **Logic**:
       - Use the `pod_id` (or `pol_id` + `serial_number`) from the `session_scans` record.
       - Find the corresponding `inventory.purchase_order_drums` record.
       - If not already done, create/find a batch in `inventory.batches` associated with the `pol_id` (similar to `receive_delivery`).
       - Insert a new record into `inventory.drums`, linking it to the batch and copying relevant details (serial number, initial volume, item via batch). Set its status to 'in_stock'.
       - Update `inventory.purchase_order_drums.drum_id` with the new `inventory.drums.drum_id`.
     - Consider idempotency: ensure that if a trigger runs multiple times for the same logical event (e.g., due to retries or replay), it doesn't create duplicate `drums` or `batches`.

2. **Review and Strengthen `inventory` Schema Integrity**:

   - **Objective**: Ensure data consistency and enforce business rules across related inventory tables.
   - **Implementation**:
     - **Relationships**: Verify all foreign key relationships between `purchase_orders`, `purchase_order_lines`, `purchase_order_drums`, `items`, `batches`, `batch_inputs`, and `drums` are correctly defined and enforced.
     - **Synchronization**: Consider if any `updated_at` fields or status fields across these tables need to be kept in sync via triggers (e.g., if all drums for a `purchase_order_line` are received, should the `purchase_order_lines.status` or `purchase_orders.status` update automatically?).

3. **Database Constraints for Business Logic**:

   - **Objective**: Enforce rules directly at the database level.
   - **Implementation**:
     - **Drum Location/Status**: `ALTER TABLE inventory.drums ADD CONSTRAINT check_location_for_pending CHECK (NOT (status = 'pending' AND current_location IS NOT NULL));` (Drums with 'pending' status must have a NULL location). Adjust 'pending' if your status enum is different.
     - **Drum Status Transitions**:
       - This is more complex. The ideal solution is a state transition table (like your `config.drum_status_transitions`) and a trigger function on `inventory.drums` `BEFORE UPDATE` that checks if the `OLD.status -> NEW.status` transition is valid according to the transition table.
     - Other constraints as identified (e.g., volume checks, serial number formats if not already handled).

4. **Scan Cancellation Logic (`public.session_scans`)**:
   - **Objective**: Allow a scan to be logically "cancelled" by inserting a new scan record.
   - **Implementation**:
     - The `cancelled_scan_id` in `public.session_scans` already allows this.
     - **Trigger (Optional but Recommended)**: A trigger `AFTER INSERT ON public.session_scans WHERE scan_action = 'cancel'` could:
       - Verify the `cancelled_scan_id` refers to a scan that _can_ be cancelled.
       - Potentially update a status field on the original scan record.
       - More robustly, if cancelling a `check_in` scan has inventory implications, this trigger might need to initiate a compensating transaction or flag it for review.

### C. UI/UX Enhancements

1. **Drum Details Drawer (Web App - `InventoryGrid.tsx`)**:

   - **Objective**: Show detailed information when a drum is clicked in the inventory grid.
   - **Implementation**:
     - Use a Drawer component from Shadcn/ui.
     - When a drum "circle" in `InventoryGrid.tsx` is clicked, open the drawer.
     - Fetch data for the selected drum using its `drum_id` from views like `public.v_purchase_order_drum_details`, `public.v_drums`, `public.v_batches_with_drums`, or direct table queries.
     - Display comprehensive details.

2. **Scanning & Task UI (Mobile App - `TransportView`)**:

- **Objective**:
- **Implementation**: Provide a seamless user experience, with clear and transparent information on all barcode labels
- Caching Strategy: Use caching with tasks (`task-selection-modal.tsx`) so that opening the modal does not cause another DB fetch each time

## III. General Considerations & Future Work

- **Error Handling & User Feedback**: Improve across both mobile and web apps.
- **Testing**: Implement unit and integration tests.
- **Offline Support (Mobile PWA)**: Further review caching strategies.
- **Production View (`apps/mobile/src/views/ProductionView.tsx`)**: Connect to real data sources.
- **Security (RLS Policies)**: Continuously review and refine.
