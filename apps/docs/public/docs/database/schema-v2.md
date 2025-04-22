# Scanning Workflow - Database Schema Design

## 1. Inventory Management Overview

### 1.1 Business view

1. **Suppliers & Purchase Orders**

   - We onboard materials via **purchase orders** from **suppliers**.
   - Each PO has one or more **lines**, each requesting a given **item** and quantity.

2. **Materials → Items**

   - A **material** (e.g. "Acetone") is a broad chemical, tied to a CAS number and a "chemical group."
   - We catalogue each **item** as a purchasable form/packaging of that material (e.g. 5 L jug, 50 L drum).

3. **Receipt & Batching**

   - When goods arrive, we create a **batch** (batch_type might be "new receipt," "repro," etc.) for a given item.
   - A batch has a total volume and (optionally) a link back to its originating PO.

4. **Drum Tracking**

   - Physical containers ("drums") are instantiated for each batch and carry a **serial_number**, **current_volume**, and **status** ("in stock," "in use," "empty," etc.).
   - As we fill a drum, each "fill" event is recorded (drum_fills → volume_added, timestamp).
   - We also track **batch_inputs**, which are more generic "volume added" events against a batch (for example, topping off or combining).

5. **Locations**
   - Drums (and maybe batches) can be assigned to hierarchical **locations** (warehouse → aisle → rack → shelf).

### 1.2 Key tables & FKs

```text
suppliers ← purchase_orders ← purchase_order_lines → items → materials
items ← batches ← batch_inputs
batches → drums ← drum_fills
drums → locations
```

---

## 2. Device‑Based Scanning Logs

### 2.1 Summary

- Every time an operator scans a barrel barcode or a context QR code with an industrial handheld, we log that in **drum_scan** or **context_scan**.
- We capture who (user_id), on what device (device_id), what they scanned (raw barcode/QR), what the system detected (detected_drum or context_id), plus status/error codes for audit and troubleshooting.
- A **devices** table holds our fleet of scanners (hw_id, OS, last_seen).

### 2.2 Key tables & FKs

```text
auth.users.id → drum_scan.user_id
devices.device_id → drum_scan.device_id
devices.device_id → context_scan.device_id
```

---

## 3. Production Workflow

### 3.1 Business view

1. **Orders → Jobs**

   - A customer or internal request becomes an **order** (order_id, item, quantity, schedule).
   - Each order spins up one or more **jobs**, which specify an **input_batch** and get scheduled/planned.

2. **Jobs → Operations**

   - A **job** is broken into discrete **operations** (op_type might be “mix,” “heat,” “filter,” etc.).
   - Each operation has planned vs. actual start/end times and a status flag.

3. **Resource Allocation**

   - **operation_drums** links which drums—and how much volume—are pulled into an operation (via a scan event, scan_id).
   - **drum_usage** also ties drums to operations (for longer‑term assignment tracking).

4. **Quality & Process Details**

   - For distillation steps we have **distillation_details** (raw_volume, expected_yield, JSON metadata).
   - QC outcomes feed into **qc_results** (grade, tested_at, volume, metadata).
   - Some jobs require splitting into child operations (**split_operations**) for yields or parallel processing.

5. **Contextual Device State**
   - When operators scan a QR code at a station (e.g. “Still #3”), wecreate a **device_context** record that temporarily binds that device to a given context (operation, location, or job).

### 3.2 Key tables & FKs

```text
orders → jobs → operations
operations → distillation_details
operations → qc_results
operations → split_operations (parent_op_id → child split_id)
operations → operation_drums → drum_scan.scan_id
operations → drum_usage → drums
devices → device_context
jobs → inventory.batches (input_batch_id)
jobs → inventory.items (item_id)
```

---

## 4. End‑to‑End Flow (Simplified)

1. **Procurement**: Create PO → receive goods → batch → fill drums → store at location.
2. **Inventory**: Track real‑time drum volumes and locations via mobile scans (drum_scan + batch_inputs/drum_fills).
3. **Production Kickoff**: User submits order → system creates job → plans operations.
4. **Execution**: Operator at each station scans context QR → picks drum(s) → scans barrel → operation_drums records transfer → system updates drum.current_volume.
5. **QC & Yield**: After critical ops, distillation_details and qc_results capture quality and volumes. Splits spawn child operations as needed.
6. **Fulfillment**: Once all ops complete, job status flips to “done,” drums may be emptied, and final volumes/outcomes are reported back to inventory/orders.

---

### 4.1 How it might be implemented in PostgreSQL

- **Schemas**: weve clearly separated `inventory`, `logs`, and `production`.
- **FKs & constraints**: non‑nullable FKs enforce that every drum belongs to a batch, every PO line maps to an item, etc.
- **Triggers/Policies** (not shown) likely:
  - Recompute `drums.current_volume` on INSERT into `drum_fills` or `operation_drums`.
  - Enforce that wecan’t overfill a drum (check constraint).
  - Cascade updates of status (e.g. when an operation ends, update job status).
- **Indices**: on timestamp columns (`scanned_at`, `started_at`, `created_at`) and on foreign keys to support fast lookups.
- **JSONB** columns for metadata let werecord free‑form details without altering the schema.
- **Row‑Level Security** in Supabase could restrict scans so users only see drums in their assigned location.

---

**Bottom line:**  
This design cleanly modularizes **procurement → inventory → scanning audit → production**. It lets wetrace every liter of solvent from the moment it’s ordered, through drum filling, through every processing step, to final QC and dispatch—while giving wethe raw logs to troubleshoot and the structured tables to build automated workflows and reports.

## 5. In‑App Workflow & UI Patterns

### A. Task‑Oriented Dashboard

- **List of Active Production Orders**
  - Show a card or table view of today’s “open” orders, each with:
    - Item name + supplier
    - Quantity (# of drums required)
    - Scheduled date/time
    - Current state (e.g. “Preparing drums”, “In‑distillation”, “QC pending”, “Complete”)
- **Drum‑Preparation Drill‑down**
  - When weclick an order, show the list of drums weneed to prepare:
    - Available Eligible Drums (filter by item‑criteria + “in stock” + correct supplier)
    - For each drum: serial number, current volume, last location, “Assign to this order” button

### B. Context‑Scan Wizard

1. **“Start Preparation”** → Prompt: “Tap the Still/Station QR”
2. **Awaiting Context Scan** → open our device’s camera or ask the industrial scanner SDK to read a QR
3. **On Success** → show “Now please scan Drum barcode #1”
4. **On Drum Scan** → POST `/api/operations/:opId/context-scan` with `{ deviceId, userId, scanId }` → UI flashes green check
5. **Repeat** until weve scanned the # of drums needed, then enable “Mark Preparation Complete”

> Under the covers each context+drum scan within 60s writes a row to `context_scan` and `operation_drums`, and updates `drums.current_location` & `drums.status`.

### C. Drum Detail Panel

Within the order detail, allow a click‑through on any drum to reveal a timeline:

- **Inventory Events**: batch created → fills → batch_inputs
- **Context Scans**: movements between locations/stations
- **Operation Drums**: when and how much was transferred into each op
- **QC & Distillation Details** (if it’s a finished‑goods drum)

A simple vertical timeline component (timestamp + icon + short description) makes auditability obvious.

### D. Yard & Location QR Codes

- **Rack/Section QRs** in the two drum yards, mapped 1:1 to our `locations` hierarchy.
- Let our “Move Drum → Yard” workflow ask for both: rack‑QR then drum. This writes a `context_scan` and immediately updates the `drums.current_location` FK.

### E. Enforce “Scan → Action”

Make every state transition in our workflow UI contingent on the corresponding scan event. E.g.:

| UI Action                 | Precondition                         |
| ------------------------- | ------------------------------------ |
| “Reserve Drum for Order”  | context_scan + drum_scan logged      |
| “Start Distillation”      | station QR + drum_scan(s) logged     |
| “Complete Operation”      | all required scans & op records done |
| “Dispatch Finished Goods” | final drum_scan at dispatch QR       |

Workers can’t click “Next” until the scan table shows the row. That friction—and the immediate visual feedback—drives compliance.

---

## 6. Adoption & SOP Recommendations

1. **Minimize Steps**
   - Keep it to “Scan location → Scan drum → Done.” Any extra taps or fields and well lose them.
2. **Instant Feedback**
   - A green check, a short vibration or beep on scan success, plus a counter (“Drums scanned: 1/2”).
3. **Offline Mode & Retry**
   - If Wi‑Fi drops, cache scans locally and sync later. Nothing kills trust faster than “I scanned it, but it never saved.”
4. **Training “Live Demo”**
   - A 10‑minute on‑floor session showing how two clicks replace a 3‑page paper form.
5. **Visibility & Gamification**
   - A big screen in the lab showing “% of on‑time scans” by shift. A little friendly competition goes a long way.
6. **Exceptions & Audit Trails**
   - Provide an “Exception” flow (with manager approval) for truly urgent cases. But log them in a separate table so wecan spot patterns.
7. **Management Enforcement**
   - Ultimately, the policy lives with operations. Make sure supervisors can see non‑compliant events and follow up immediately.

---

### 6.1 Bottom‑Line

By baking the scan requirement _directly_ into every task button and giving our workers instant, unambiguous feedback, weturn scanning from “just another chore” into literally the only way to move the process forward. Couple that with simple training, offline resilience, and real‑time compliance dashboards, and well close the gap between “technophobic” fears and “wow that actually saves me time.” Traceability becomes not just policy, but the path of least resistance.
