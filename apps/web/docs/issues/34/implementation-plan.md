# Issue 34: Implementing the new stock management system

## Overview

This issue outlines the implementation plan for generating, applying, and registering initial stock barcodes using our new CT47 scanner. The process will establish our baseline inventory in the new system and provide a foundation for ongoing stock management.

## Business Context

We've conducted a manual stock count that has been entered into our system, but we need to verify this data by applying barcodes to all existing items and scanning them to confirm their presence. This process will help us identify discrepancies between our records and actual stock, where items may have arrived or been processed since the count.

## Implementation Steps & Timeline

### 1. Review and Finalize Barcode Label Design (30 minutes)</mark>

**Completion: Tue 8 April**

- [ ] Adjust barcode width to improve readability
- [ ] Update unit counter to show position within material/supplier grouping
- [ ] Test PDF output with updated design
- [ ] Verify QR code functionality links to correct drum information page

### 2. Generate and Print Initial Stock Labels (45 minutes)

**Completion: Tue 8 April**

- [ ] Update API route to use `drum_stock` table rather than `drums` if feasible
- [ ] Generate PDF files organized by material/supplier grouping
- [ ] Print physical labels in batches organized by material type
- [ ] Verify label quality and readability before full deployment

### 3. Configure CT47 Scanner for Data Collection (60 minutes)

**Completion: Tue 8 April**

- [ ] Insert and activate Lebara SIM card
- [ ] Configure internet connectivity settings
- [ ] Set up barcode scanning application
- [ ] Configure scanner to either:
  - [ ] Transmit scans directly to API endpoint
  - [ ] Store scans in local memory if connectivity is unavailable

### 4. Create API Routes for Scan Processing (60 minutes)

**Completion: Tue 8 April**

- [ ] Implement `/api/barcodes/scan/route.ts` to receive scanner data
- [ ] Add validation for barcode format integrity
- [ ] Create logic to process incoming scans and insert into `log_drum_scan` table
- [ ] Implement error handling and confirmation response to scanner

### 5. Verify Database Structure and Triggers (45 minutes)

**Completion: Tue 8 April**

- [ ] Review existing triggers on `log_drum_scan` table
- [ ] Ensure proper constraints are in place
- [ ] Test that inserts into `log_drum_scan` correctly update related tables
- [ ] Create or modify functions needed to process scan data

### 6. Create Management Views for Monitoring (30 minutes)

**Completion: Tue 8 April**

- [ ] Create `view_drum_scan_activity` for monitoring recent scans
- [ ] Create `view_stock_discrepancies` to highlight items in system but not scanned
- [ ] Create `view_stock_reconciliation` showing overall inventory status

### 7. Apply Labels and Scan Initial Inventory (60 minutes)

**Completion: Tue 8 April**

- [ ] Physically apply labels to stock items by material/supplier group
- [ ] Scan each item immediately after applying the label
- [ ] Record any discrepancies found (items missing or unlisted)
- [ ] Verify scan data is appearing correctly in database

## Database Tables Involved

- `log_drum_scan` - Primary interface for scanner input
- `drum_stock` - Official drum inventory data
- `drums` - Current temporary table (to be replaced by `drum_stock`)
- `order_detail` - Related order information
- `ref_materials` - Material reference data
- `ref_suppliers` - Supplier reference data

## Success Criteria

- All physical drums have barcodes applied
- All applied barcodes have been scanned and registered in the system
- Discrepancies between expected and actual inventory are documented
- Management views provide clear visibility into inventory status
- Scanner system is functioning reliably with proper connectivity

## Follow-up Actions

After completion of this initial implementation, we'll need to:

1. Address any discrepancies found between expected and actual inventory
2. Develop process documentation for ongoing barcode scanning
3. Train staff on new scanning procedures
4. Schedule regular inventory reconciliation checks

## Notes

- The initial stock barcode implementation is the foundation for our new inventory system
- This process creates the baseline data that all future inventory movements will build upon
- The system design prioritizes data integrity and auditability
