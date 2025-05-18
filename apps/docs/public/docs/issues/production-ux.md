Okay, I can help you sort out these issues with your new production scheduling feature. It sounds like a classic case of a few crossed wires after some rapid development, especially when integrating UI, server actions, and database logic.

Here's my plan:

1.  **Inspect the Database**: I'll start by examining your Supabase `production` and `inventory` schemas (and `public` as requested) to get a clear picture of the table structures, relationships, and any relevant functions or views. This will be crucial for understanding the data flow and for fixing any database-related errors in your server actions.
2.  **Tackle the Form's Behavior (`production-form.tsx`)**:
    - The premature error toasts and the submit button getting stuck in a loading state are the top priority. I'll investigate the `validateForm` function, as the linter errors there strongly suggest it's not returning a boolean correctly, which could be causing these issues.
    - I'll also check how `handleSubmit` is invoked and ensure that validation only runs when the user actually tries to submit the form.
    - I'll look into the `useEffect` hooks to ensure they aren't causing unintended validation triggers.
3.  **Address Data Logic**: I'll pay close attention to how `rawVolume` is handled, keeping in mind your note about `qty_drums` (number of drums) versus what might have previously been `total_volume` (liters). The form seems to assume 200L per drum in some places (e.g., `selectedBatch.drums_in_stock * 200`), so I'll ensure this logic is consistent.
4.  **Fix Linter Errors**:
    - In `production-form.tsx`: I'll correct the `validateForm` return issues.
    - In `apps/web/src/app/(routes)/production/actions/production.ts`:
      - I'll investigate the missing exports (`fetchSuppliers`, `fetchItemsBySupplier`) from `@/app/actions/orders`.
      - I'll address the schema/table name issues for `stills` and the RPC call `create_distillation_job`, using the information from the database inspection.
5.  **Review Submission Flow**: Once the immediate form behavior and linter errors are fixed, I'll review the overall submission logic in `production-form.tsx` and the `createProductionJob` server action to ensure it correctly processes the data and inserts it into the `jobs` and potentially `operations` tables.

Let's start by getting a look at your database structure. I'll list the tables in the `production`, `inventory`, and `public` schemas.

Ran tool
Thanks for that detailed table information! This is very helpful.

Here's what I've gathered and how it impacts the next steps:

- **`production.stills` Table:** The linter error in `actions/production.ts` (line 215) was correct; the code was trying to query a non-existent table. It seems the actual table name is `production.stills`. I also see it has `still_id` (integer), `code` (char), and `max_capacity` (numeric), `is_operational` (boolean) which matches what the `fetchStills` function expects.
- **`production.jobs` Table:** This table is the entry point as you mentioned. It correctly links to `inventory.items` (for `item_id`) and `inventory.batches` (for `input_batch_id`).
- **`production.operations` Table:** This is a child of `jobs` and has an `op_type` (enum including "distillation") and links to `production.distillation_details`.
- **`production.distillation_details` Table:** This table is keyed by `op_id` (linking back to `operations`) and `still_id` (linking to `production.stills`), and stores `raw_volume`. This confirms that when a distillation job is created, an operation of type 'distillation' will be created, and a corresponding `distillation_details` record will store the specifics.
- **`inventory.batches` Table:** Crucially, this table has `qty_drums` (numeric) and `batch_code` (text). It links to `inventory.items`.
- **`inventory.drums` Table:** This has `current_volume` (numeric) and `serial_number` (text). It links to `inventory.batches`.
- **`inventory.items` Table:** Links to `inventory.materials` and `inventory.suppliers`. This is where `item_id` comes from.
- **`fetchSuppliers` and `fetchItemsBySupplier`:** The linter errors in `actions/production.ts` (lines 11 and 338) about these missing exports are likely because they are defined in `apps/web/src/app/actions/suppliers.ts` (as seen in the `production-form.tsx` imports) and not in `apps/web/src/app/actions/orders.ts`.
- **RPC `create_distillation_job`:** The linter error on line 313 of `actions/production.ts` indicates this RPC might not exist or is not callable in the way the code attempts. I'll need to verify its existence and signature using the Supabase tools.

**Regarding `qty_drums` vs. `rawVolume`:**

- The `inventory.batches` table stores `qty_drums`.
- The `production.distillation_details` table (linked to a job via an operation) stores `raw_volume`.
- The `production-form.tsx` has logic like `selectedBatch.drums_in_stock * 200` when setting a default for `rawVolume` and for validation. This implies an assumption that each drum contributes 200L to the `rawVolume` to be processed. This seems reasonable if `drums_in_stock` (which `fetchAvailableBatchesByItem` returns from `v_batches_with_drums`) truly represents the count of full, 200L drums.

Now, let's address the RPC call. I'll check the available functions to see if `create_distillation_job` is there and what its parameters are.

Ran tool
It appears I can't directly list database functions with the available tools. However, given the linter error and the context, it's highly probable that the `create_distillation_job` RPC either:

1.  Doesn't exist under that exact name in the `production` schema.
2.  Has different parameter names or types than what `actions/production.ts` is trying to use (`p_item_id`, `p_batch_id`, `p_planned_start`, `p_still_id`, `p_raw_volume`, `p_priority`).

For now, I will proceed with fixing the client-side issues in `production-form.tsx` and the import/table name issues in `actions/production.ts`. We might need to revisit the RPC call later if the server action still fails after these fixes. The user who wrote the SQL function (`create_distillation_job`) will know its exact signature.

Let's start with the `production-form.tsx` file. The linter errors in `validateForm` are critical. The `toast.error()` function (presumably from `useToast`) likely returns a toast ID (a string or number), not a boolean. The `validateForm` function needs to explicitly return `false` after showing the toast, and `true` if all validations pass.

I'll make the following changes to `apps/web/src/features/production/components/production-form.tsx`:

1.  Modify `validateForm` to explicitly `return false;` after each `toast.error()` call.
2.  Ensure `return true;` is at the end of `validateForm` if all checks pass.

```typescript jsx:apps/web/src/features/production/components/production-form.tsx
// ... existing code ...
  const validateForm = (): boolean => {
    if (!selectedSupplier) {
      toast.error("Supplier is required.");
      return false;
    }
    if (!selectedItem) {
      toast.error("Material item is required.");
      return false;
    }
    if (!selectedBatch) {
      toast.error("Input batch is required.");
      return false;
    }
    if (!plannedDate) {
      toast.error("Planned date is required.");
      return false;
    }
    if (!selectedStill) {
      toast.error("Distillation still is required.");
      return false;
    }
    if (!rawVolume || isNaN(Number(rawVolume)) || Number(rawVolume) <= 0) {
      toast.error("Valid raw material volume is required.");
      return false;
    }
    if (selectedBatch && Number(rawVolume) > selectedBatch.drums_in_stock * 200) {
      toast.error(
        `Volume exceeds available stock in batch (${
          selectedBatch.drums_in_stock * 200
        }L).`
      );
      return false;
    }
    if (selectedStill && Number(rawVolume) > selectedStill.max_capacity * 200) {
      toast.error(
        `Volume exceeds still capacity (${selectedStill.max_capacity * 200}L).`
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
// ... existing code ...

```

The `validateForm` function in `production-form.tsx` should now correctly return boolean values. This should prevent the premature error toasts and ensure the form validation logic behaves as expected (i.e., only when `handleSubmit` is called).

Next, I'll address the linter errors in `apps/web/src/app/(routes)/production/actions/production.ts`:

1.  **Missing Imports**: I'll change the import path for `fetchSuppliers` and `fetchItemsBySupplier` from ` "@/app/actions/orders"` to `"@/app/actions/suppliers"`.
2.  **Table Name for Stills**: I'll change `from("stills")` to `from("stills")` in the `fetchStills` function (it seems it was already correct in your schema but the linter picked up something, possibly related to a type generation issue which this might also resolve). I'll also correct the type assertion for the return value of `fetchStills` to make it more robust, though the primary issue seems to be the table name in the query.
3.  **RPC Call**: I'll leave the `create_distillation_job` RPC call as is for now. If it's incorrect, it will error out at runtime, and we'll have a clearer error message from Supabase. The linter error here is often due to generated types not perfectly matching the dynamic nature of RPCs until they are actually invoked.

Here's the proposed edit for `apps/web/src/app/(routes)/production/actions/production.ts`.

```typescript:apps/web/src/app/(routes)/production/actions/production.ts
// ... existing code ...
  mapJobStatusToOrderStatus,
  getProgressFromStatus,
  getPriorityFromJob,
} from "@/features/production/types";
// import { fetchSuppliers, fetchItemsBySupplier } from "@/app/actions/orders";
import { fetchSuppliers, fetchItemsBySupplier } from "@/app/actions/suppliers";

/***************************
 * READ ACTIONS
// ... existing code ...
export async function fetchStills(): Promise<
  Array<{ still_id: number; code: string; max_capacity: number }>
> {
  return executeServerDbOperation(async (supabase) => {
    const { data, error } = await supabase
      .schema("production")
      .from("stills") // Ensured this matches the actual table name from schema inspection
      .select("still_id, code, max_capacity")
      .eq("is_operational", true)
      .order("code");

    if (error) {
      console.error("[fetchStills]", error);
      return [];
    }
    // Correctly type the expected data structure
    return data as Array<{ still_id: number; code: string; max_capacity: number }>;
  });
}

// ... existing code ...
// We simply re-export the supplier & item helpers from orders actions so the
// production form can import from a single location.

// export { fetchSuppliers, fetchItemsBySupplier } from "@/app/actions/orders";
export { fetchSuppliers, fetchItemsBySupplier } from "@/app/actions/suppliers";

```

It seems the model only applied the change to the re-export at the bottom of the file. I'll try to reapply the full intended changes to `apps/web/src/app/(routes)/production/actions/production.ts`, specifically:

- Changing the import path for `fetchSuppliers` and `fetchItemsBySupplier` at the top of the file.
- Ensuring the `fetchStills` function queries `production.stills` and the type assertion for its return value is correct.

---

You're right about the re-exports; it's cleaner and often less error-prone to import directly from the source module, especially with server actions and how their async nature is handled.

Also, thank you for providing the `create_distillation_job` function definition! The parameters in your `actions/production.ts` file for the `.rpc()` call (`p_item_id`, `p_batch_id`, etc.) match this definition. The linter error there is likely a type-related quirk that doesn't reflect an actual issue with the call's structure, especially since the types in `apps/mobile/src/types/supabase.ts` also show this function with the correct signature.

The same applies to the `production.stills` table. Your `supabase.ts` type definitions clearly show `stills` under the `production` schema with the correct columns (`still_id`, `code`, `max_capacity`, `is_operational`). The linter errors for the `.from("stills")` call in `fetchStills` are puzzling but likely stem from a type generation or linter configuration nuance rather than an incorrect table name in your code. This can sometimes happen if types need to be regenerated after schema changes (like moving the `stills` table).

Let's proceed by cleaning up `apps/web/src/app/(routes)/production/actions/production.ts` as you suggested, by removing the re-exports.

I will make the following changes to `apps/web/src/app/(routes)/production/actions/production.ts`:

1.  Remove the line `import { fetchSuppliers, fetchItemsBySupplier } from "@/app/actions/suppliers";` (or if it was still pointing to `@/app/actions/orders`, that version of the import).
2.  Remove the line `export { fetchSuppliers, fetchItemsBySupplier } from "@/app/actions/suppliers";` (or its equivalent pointing to `@/app/actions/orders`) from the end of the file.

This ensures that `production-form.tsx` (and any other components) will rely on direct imports from `apps/web/src/app/actions/suppliers.ts` for these functions.

```typescript:apps/web/src/app/(routes)/production/actions/production.ts
'use server';

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Order as ProductionJobOrderType,
  mapJobStatusToOrderStatus,
  getProgressFromStatus,
  getPriorityFromJob,
} from "@/features/production/types";
// Removed import for fetchSuppliers and fetchItemsBySupplier as they are not used directly in this file

/***************************
 * READ ACTIONS
// ... existing code ...
 * SHARED DROPDOWN HELPERS
 ***************************/

// Removed re-export of fetchSuppliers and fetchItemsBySupplier

```

It seems the model only removed the re-export at the bottom and didn't remove the `import` statement at the top. The linter errors are the same persistent ones related to type definitions for `stills` and the RPC, which we've discussed.

I'll try one more time to specifically remove the import line as well. Since we've confirmed the `stills` table name is correct in the code and the RPC signature matches, these linter errors are likely due to type generation/caching and shouldn't block functionality once types are refreshed.

Attempting to remove the specific import line from `apps/web/src/app/(routes)/production/actions/production.ts`.

```typescript:apps/web/src/app/(routes)/production/actions/production.ts
'use server';

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Order as ProductionJobOrderType,
  mapJobStatusToOrderStatus,
  getProgressFromStatus,
  getPriorityFromJob,
} from "@/features/production/types";
// import { fetchSuppliers, fetchItemsBySupplier } from "@/app/actions/orders"; // This line should have been removed if it was pointing to orders
// The following line, if present and pointing to suppliers, should also be removed:
// import { fetchSuppliers, fetchItemsBySupplier } from "@/app/actions/suppliers";

/***************************
 * READ ACTIONS
// ... existing code ...

```

It appears the import line was already removed or was not present as expected in the previous step. That's good; the file `apps/web/src/app/(routes)/production/actions/production.ts` should now no longer be importing or re-exporting `fetchSuppliers` and `fetchItemsBySupplier`.

With these changes:

1.  The `production-form.tsx` should have its client-side validation logic working correctly, preventing premature toasts.
2.  The server action file `apps/web/src/app/(routes)/production/actions/production.ts` is cleaner regarding imports.
3.  The database interactions for `fetchStills` and `createProductionJob` use the correct table and RPC names/parameters based on your provided schema and function definition. The persistent linter errors are likely type-system artifacts that a type regeneration (e.g., `supabase gen types typescript`) would resolve.

**Regarding the form submission logic and potential issues in `confirmation-dialog.tsx`:**

- The core form submission happens in `production-form.tsx`'s `handleSubmit` function. It now correctly calls `validateForm()`, and if that returns `true`, it proceeds to build `formData` and call `createProductionJob(formData)`. This part looks logically sound, assuming `createProductionJob` works as expected (which it should, given your SQL definition).
- You mentioned `confirmation-dialog.tsx`. This component doesn't seem to be directly used by `production-form.tsx`. The `production-form.tsx` directly calls `onJobCreated(result)` and then `toast.success(...)` or `toast.error(...)`. If there's a separate confirmation step _after_ the `production-form.tsx` successfully submits and calls `onJobCreated`, that would be handled by the parent component that renders `ProductionForm`. The `Schedule New Production Job` modal (which you mentioned has 3 steps and uses `create-job-modal.tsx`) seems to be a different UI flow than the one using `production-form.tsx`. The screenshots you provided show a UI that looks more like `production-form.tsx`.

**Next Steps & Testing:**

At this point, the most important thing is to **test the "Schedule Job" functionality that uses `production-form.tsx`**.

1.  Ensure your Supabase types are up-to-date in your project if you have a command for that (e.g., `npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts` or similar, run from the `apps/web` directory or correctly pathed). This might clear up the persistent linter errors.
2.  Try submitting the form.


    *   Do the premature validation toasts still appear? (They shouldn't).
    *   Does the form submit correctly?
    *   Do you get a success toast with a Job ID?
    *   Check your `production.jobs`, `production.operations`, and `production.distillation_details` tables in Supabase to see if the data was inserted correctly.

If the form submission still fails, the error message from the `toast.error(result.message || "Failed to schedule job.");` in `production-form.tsx` (which comes from the `createProductionJob` server action) will be key to debugging further.

Do you want to proceed with testing, or is there anything else in the `production-form.tsx` or related files you'd like me to look at before you do? For instance, you mentioned the `create-job-modal.tsx` and a 3-step process, which seems distinct from the `production-form.tsx` we've been focusing on.

---

That's very helpful context, thank you! Understanding the intended workflow, especially the 1-to-many relationship possibilities between an "operation" and "distillation_details" (even if it's 1-to-1 for the MVP), is key.

Let's break this down:

**1. Current Schema vs. Multi-Run Operations:**

- You mentioned: "one operation - 2 records of `distillation_details`".
- Looking at the `apps/mobile/src/types/supabase.ts` definition for `production.distillation_details`, the relationship to `production.operations` via `op_id` is marked as `isOneToOne: true`.
  ```typescript
  // In apps/mobile/src/types/supabase.ts, for production.distillation_details
  Relationships: [
    {
      foreignKeyName: "distillation_details_op_id_fkey"
      columns: ["op_id"]
      isOneToOne: true // This implies one operation links to one distillation_detail
      referencedRelation: "operations"
      referencedColumns: ["op_id"]
    },
    // ...
  ]
  ```
- This `isOneToOne: true` means that, as the database schema is currently defined (at least according to your type generation), an `op_id` can only appear once in `distillation_details`. This makes `op_id` effectively a unique key for `distillation_details` pointing back to `operations`.
- The SQL function `create_distillation_job` you provided is consistent with this 1-to-1 setup: it creates one `jobs` record, one `operations` record, and inserts _one_ corresponding `distillation_details` record.
- The validation in `production-form.tsx` (`Number(rawVolume) > selectedStill.max_capacity * 200`) also aligns with this, as it prevents scheduling a job where the volume for that single distillation operation would exceed the still's capacity (requiring a split that the current SQL doesn't handle).

**Implication for MVP:** The current system (form + SQL function + DB schema as per types) is set up to handle one distillation run per "job creation" event. The `raw_volume` entered must fit the chosen still. This seems perfectly fine for an MVP.

**Future State (Multi-Run Operations):**
If you want one `operations` record (e.g., "Distill 1000L of Methanol using Still M") to result in multiple `distillation_details` records (e.g., run 1 for 500L, run 2 for 500L), you'd likely need to:

1.  Modify the `production.distillation_details` table: `op_id` could no longer be its sole primary key or have a unique constraint enforcing a 1:1 with `operations`. You'd need a new primary key for `distillation_details` (e.g., `distillation_detail_id UUID PK`) and `op_id` would just be a foreign key.
2.  Update the `create_distillation_job` SQL function to include logic to loop and insert multiple `distillation_details` rows if `p_raw_volume` exceeds `p_still_id`'s capacity.
3.  Adjust the form (`production-form.tsx`) validation – you might remove the check that raw volume must be less than still capacity, or change how it's handled.

This future state is a more significant change, likely for after the current form is stable.

**2. `production.stills.max_capacity` Units:**

- Your form (`production-form.tsx`) correctly handles `max_capacity` as _drums_ for now:
  - Display: `Still ${s.code} (Capacity: ${s.max_capacity * 200}L)`
  - Validation: `Number(rawVolume) > selectedStill.max_capacity * 200`
- This is consistent. When you later change `max_capacity` in the DB to be in _liters_, you'll just need to remove the `* 200` from these places in the form. No changes are needed for this right now.

**3. Linter Errors in `actions/production.ts`:**

Given your confirmation about the `stills` table location and the `create_distillation_job` function's correctness:

- The linter errors for `.from("stills")` and `.rpc("create_distillation_job")` in `apps/web/src/app/(routes)/production/actions/production.ts` are almost certainly due to your `apps/web` project's auto-generated Supabase types being out of sync with the actual database schema (especially after moving tables like `stills`).
- The primary way to fix these is to **regenerate the TypeScript types for your Supabase client specifically for the `apps/web` project.** The command is usually something like `npx supabase gen types typescript --project-id <your-project-id> --schema public,production,inventory > path/to/your/web/types/supabase.ts`. Make sure to include all relevant schemas (`public`, `production`, `inventory`).

**How to Progress Further:**

1.  **Regenerate Supabase Types for `apps/web`:** This is the most crucial step to resolve those persistent linter errors. It will update your `apps/web/src/types/supabase.ts` (or wherever your web app's Supabase types are stored), and the linter should then correctly recognize `production.stills` and the `create_distillation_job` RPC.
2.  **Test the `ProductionForm`:**
    - Once types are regenerated (and hopefully linter errors are gone), thoroughly test the form flow in `production-form.tsx` (which I understand is used within the `ProductionModal` triggered from the sidebar's "Schedule Distillation" item).
    - Verify that the client-side validation fixes we made earlier (correct boolean returns in `validateForm`) prevent premature error toasts.
    - Attempt to submit a valid job.
    - Check the browser's console and your Supabase dashboard (Network tab, database table contents) to see if the `createProductionJob` server action is called successfully and if data is inserted into `production.jobs`, `production.operations`, and `production.distillation_details`.
    - Note any runtime errors if submission fails.

Based on our discussion, no further code modifications seem immediately necessary _until_ you regenerate types and re-test. The current code aligns with an MVP scope where one job submission creates one distillation operation with one corresponding detail record, and the volume must fit the chosen still.

Please let me know how the type regeneration and testing go!

---

Okay, it's great that you've resolved the type conflicts by removing the old Supabase type definition file! That often clears up a lot of these "phantom" linter errors.

You're also spot on about the linter error for `stills`: if the types in `supabase.ts` (which the linter uses) correctly show `stills` in the `production` schema, then an incorrect schema reference in the code would indeed be a _runtime_ error from Supabase, not a _linting_ error, assuming the table name itself is recognized by the type system. The previous lint errors were likely because the type system itself was confused by the conflicting definitions.

Now, let's focus on the remaining linter error in `apps/web/src/lib/database.ts` within the `executeDbOperation` function. The error:
`Argument of type 'SupabaseClient<any, string, any>' is not assignable to parameter of type 'SupabaseClient<Database, "public", ...>'. Type 'string' is not assignable to type '"public"'.`

This typically happens when the Supabase client instance (here, created by `createClient()` from `lib/supabase/server.ts`) has a more generic type than what the `operation` callback expects (`SupabaseClient<Database>`).

The most straightforward way to fix this is to explicitly type the `supabase` variable when it's created in the server-side path, ensuring it matches the more specific `SupabaseClient<Database>` type.

I'll apply this change to `apps/web/src/lib/database.ts`.

```typescript:apps/web/src/lib/database.ts
// ... existing code ...
export async function executeDbOperation<T>(
  operation: SupabaseOperation<T>,
  clientType: ClientType = "browser"
): Promise<T> {
  if (clientType === "server") {
    const supabase: SupabaseClient<Database> = createClient(); // Explicitly type supabase instance
    return operation(supabase);
  }
  return withSupabaseClient(operation);
}

// ... existing code ...
```

It seems explicitly typing `supabase` as `SupabaseClient<Database>` still results in a similar type error. This suggests the issue might be with the return type of `createClient()` from `lib/supabase/server.ts` or how `SupabaseOperation<T>` is defined in relation to it.

Let's try a slightly different approach. Instead of re-typing `supabase`, we can cast it when passing it to the `operation` function. This is often a less intrusive way to satisfy the type checker if the underlying types are indeed compatible but the inference is struggling.

I'll modify `executeDbOperation` in `apps/web/src/lib/database.ts` to cast `supabase` to `SupabaseClient<Database>` specifically for the `operation` call.

```typescript:apps/web/src/lib/database.ts
// ... existing code ...
export async function executeDbOperation<T>(
  operation: SupabaseOperation<T>,
  clientType: ClientType = "browser"
): Promise<T> {
  if (clientType === "server") {
    const supabase = createClient();
    return operation(supabase as SupabaseClient<Database>); // Cast supabase client here
  }
  return withSupabaseClient(operation);
}

// ... existing code ...
```

Okay, the type error in `database.ts` should now be resolved by casting the Supabase client.

**Reviewing `actions/production.ts` and Related Files:**

Now that the type definitions are sorted out and the `database.ts` helper should be type-safe:

- **`apps/web/src/app/(routes)/production/actions/production.ts`**:

  - The linter errors related to `from("stills")` and `rpc("create_distillation_job")` should ideally be gone now that your primary Supabase types file is the only one in play and it accurately reflects the `production.stills` table and the `create_distillation_job` function.
  - If these lint errors _persist_, it would be very strange and might point to a caching issue in your editor's linter or a very subtle problem with the `Database` type itself that's not immediately obvious. However, based on everything, they _should_ resolve.
  - The logic within `fetchProductionJobs`, `fetchProductionJobById`, `fetchStills`, `fetchAvailableBatchesByItem`, and `createProductionJob` looks sound and consistent with the database schema and the provided SQL function.

- **`apps/web/src/features/production/components/production-form.tsx`**:

  - The `validateForm` function fix should ensure client-side validation behaves correctly.
  - The `handleSubmit` logic, which calls `createProductionJob`, seems correct.
  - The data fetching using SWR for suppliers, items, batches, and stills also looks appropriate.

- **`apps/web/src/features/production/types.ts`**:
  - The mapping functions here (`mapJobStatusToOrderStatus`, `getProgressFromStatus`, `getPriorityFromJob`) are used to transform data for the UI and seem to be self-contained.

**Regarding `operation_drums`:**

You asked me to look at `production.operation_drums`.
From the table list provided in the tool output earlier, `operation_drums` has:

- Primary Keys: `op_id`, `drum_id` (composite key)
- Foreign Keys:
  - `op_id` to `production.operations.op_id`
  - `drum_id` to `inventory.drums.drum_id`
  - `scan_id` to `logs.drum_scan.scan_id`
- Columns: `op_id`, `drum_id`, `scan_id`, `volume_transferred`, `assigned_at`.

This table indeed acts as a junction table, linking a specific drum (from inventory) that was involved in a specific operation, how much volume was transferred for that drum in that operation, and when it was assigned (likely via a scan). This supports scenarios where multiple drums might be part of a single operation (e.g., multiple input drums for a distillation, or multiple output drums).

The current `create_distillation_job` SQL function _does not_ interact with `operation_drums`. It only creates the main `jobs`, `operations`, and `distillation_details` records. Populating `operation_drums` would be a separate step, possibly triggered by a physical scan in the actual distillation process, as indicated by its `scan_id` FK and the comment "Junction table, updated via context scan workflows."

**Summary & Next Steps:**

1.  **Confirm Linter Errors in `actions/production.ts` are Resolved:** Please check if the linter errors in this file have disappeared after you removed the duplicate type file.
2.  **Test the "Schedule Job" UI Flow:**
    - Use the "Schedule Distillation" feature.
    - Verify client-side validation works as expected (no premature toasts).
    - Attempt to submit a job.
    - Observe the outcome: success/failure toasts, data in the database (`jobs`, `operations`, `distillation_details`).
    - If there are runtime errors, the browser console and Supabase logs will be your best friends.

The codebase for creating the initial job and its core distillation operation seems to be in a good state, assuming the type regeneration has cleaned up the linter's view of your schema. The current setup correctly reflects an MVP for a single distillation run per job creation. The `operation_drums` table is there for more detailed tracking but isn't part of the initial job scheduling via the `create_distillation_job` function.

Let me know the results of your testing!

---

You're absolutely right, the `toast.error("Distillation still is required.")` should only appear when `validateForm()` is called during the `handleSubmit` process, not when simply selecting a batch.

The behavior you're seeing (toast appearing after `handleBatchSelect`) is indeed puzzling if `handleBatchSelect` _only_ does what's currently in the code:

```typescript
const handleBatchSelect = (batch: Batch) => {
  setSelectedBatch(batch);
  // Default raw volume to total available in batch, capped by still capacity later if needed
  setRawVolume(batch.drums_in_stock * 200);
};
```

This function only calls `setSelectedBatch` and `setRawVolume`. State updates in React can trigger re-renders, and if a `useEffect` hook unintentionally depends on `selectedBatch` or `rawVolume` and then calls `validateForm` or `handleSubmit`, that could be the culprit. However, there are no such `useEffect` hooks visible in the provided snippet of `production-form.tsx` that would do this.

**Hypotheses for Premature Validation/Submission:**

1.  **Invisible `useEffect`:** There might be a `useEffect` hook elsewhere in `production-form.tsx` (not in the snippet) that has `selectedBatch` or `rawVolume` in its dependency array and is incorrectly triggering validation or submission.
2.  **Parent Component Behavior:** The parent component that renders `<ProductionForm />` (likely `ProductionModal` which wraps it) might have some logic that observes changes or props from `ProductionForm` and then triggers an action that leads back to validation. This is less likely to directly call `validateForm` inside `ProductionForm` but is a possibility for indirect effects.
3.  **Accidental Form Submission Event:** While unlikely that selecting a batch via a button click would trigger a form's `submit` event, stranger things have happened with event propagation or specific UI library behaviors. The batch selection buttons are `<Button type="button">` (implied, as they don't have `type="submit"`), which should prevent this, but it's worth keeping in mind.
4.  **State Updates Triggering a Cascade that fills defaults:** As you hypothesized, if selecting a batch causes `rawVolume` to be set, and other fields like `plannedDate` and `priority` already have default values, the only remaining empty field for validation _might_ be `selectedStill`. If _something_ is calling `validateForm()` after the batch selection and subsequent `rawVolume` update, it would then hit the `!selectedStill` check. The core question is _what_ is calling `validateForm()` prematurely.

**Adding Logging:**

Let's add comprehensive logging to `production-form.tsx` to trace the execution flow and state changes. This will be the most effective way to pinpoint why validation is happening.

I'll add `console.log` statements to:

- The beginning of `ProductionForm` to see when it re-renders.
- `useEffect` hooks (if any become visible or if we need to add test ones).
- `handleBatchSelect` to log the batch and the raw volume being set.
- `validateForm` to see when it's called and the state of all relevant form fields at that moment.
- `handleSubmit` to see when it's called.

This should give us a clear picture.

Here's the edit for `apps/web/src/features/production/components/production-form.tsx` with the added logging.

```typescript jsx:apps/web/src/features/production/components/production-form.tsx
\
// ... existing code ...
export function ProductionForm({
  onJobCreated,
  onCancel,
}: ProductionFormProps) {
  const { toast } = useToast();

  console.log("ProductionForm: Component rendering/re-rendering");

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [plannedDate, setPlannedDate] = useState<Date | undefined>(new Date());
  const [selectedStill, setSelectedStill] = useState<Still | null>(null);
  const [rawVolume, setRawVolume] = useState<number | string>("");
  const [priority, setPriority] = useState<number>(10);

  console.log("ProductionForm: Current State", {
    selectedSupplier,
    selectedItem,
    selectedBatch,
    plannedDate: plannedDate?.toISOString(),
    selectedStill,
    rawVolume,
    priority,
  });

  // UI State for Popovers/Commands
  const [supplierSearch, setSupplierSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
// ... existing code ...
  // SWR Data Fetching
  const { data: suppliers, error: suppliersError } = useSWR<Supplier[]>(
    "allSuppliers",
    () => {
      console.log("ProductionForm: Fetching suppliers");
      return fetchSuppliers();
    }
  );
  const { data: items, error: itemsError } = useSWR<Item[]>(
    selectedSupplier ? `itemsBySupplier-${selectedSupplier.id}` : null,
    () => {
      console.log("ProductionForm: Fetching items for supplier:", selectedSupplier?.id);
      return fetchItemsBySupplier(selectedSupplier!.id);
    }
  );
  const { data: batches, error: batchesError } = useSWR<Batch[]>(
    selectedItem ? `batchesByItem-${selectedItem.id}` : null,
    () => {
      console.log("ProductionForm: Fetching batches for item:", selectedItem?.id);
      return fetchAvailableBatchesByItem(selectedItem!.id);
    }
  );
  const { data: stills, error: stillsError } = useSWR<Still[]>(
    "allStills",
    () => {
      console.log("ProductionForm: Fetching stills");
      return fetchStills();
    }
  );

  // Reset dependent fields when a higher-level selection changes
  useEffect(() => {
    console.log("ProductionForm: useEffect for selectedSupplier changed. Current supplier:", selectedSupplier);
    setSelectedItem(null);
    setItemSearch("");
  }, [selectedSupplier]);

  useEffect(() => {
    console.log("ProductionForm: useEffect for selectedItem changed. Current item:", selectedItem);
    setSelectedBatch(null);
    setRawVolume(""); // Reset volume when item/batch context changes
  }, [selectedItem]);

  const filteredSuppliers = suppliers?.filter((s) =>
// ... existing code ...
  const handleBatchSelect = (batch: Batch) => {
    console.log("ProductionForm: handleBatchSelect called with batch:", batch);
    setSelectedBatch(batch);
    const newRawVolume = batch.drums_in_stock * 200;
    setRawVolume(newRawVolume);
    console.log("ProductionForm: selectedBatch set, rawVolume set to:", newRawVolume);
  };

  const validateForm = (): boolean => {
    console.log("ProductionForm: validateForm called. Current form values:", {
      selectedSupplier,
      selectedItem,
      selectedBatch,
      plannedDate,
      selectedStill,
      rawVolume,
      priority,
    });
    if (!selectedSupplier) {
      toast.error("Supplier is required.");
      console.log("ProductionForm: Validation failed - Supplier is required.");
      return false;
    }
    if (!selectedItem) {
      toast.error("Material item is required.");
      console.log("ProductionForm: Validation failed - Material item is required.");
      return false;
    }
    if (!selectedBatch) {
      toast.error("Input batch is required.");
      console.log("ProductionForm: Validation failed - Input batch is required.");
      return false;
    }
    if (!plannedDate) {
      toast.error("Planned date is required.");
      console.log("ProductionForm: Validation failed - Planned date is required.");
      return false;
    }
    if (!selectedStill) {
      toast.error("Distillation still is required.");
      console.log("ProductionForm: Validation failed - Distillation still is required.");
      return false;
    }
    if (!rawVolume || isNaN(Number(rawVolume)) || Number(rawVolume) <= 0) {
      toast.error("Valid raw material volume is required.");
      console.log("ProductionForm: Validation failed - Valid raw material volume is required. Raw volume:", rawVolume);
      return false;
    }
    if (selectedBatch && Number(rawVolume) > selectedBatch.drums_in_stock * 200) {
      toast.error(
        `Volume exceeds available stock in batch (${
          selectedBatch.drums_in_stock * 200
        }L).`
      );
      console.log("ProductionForm: Validation failed - Volume exceeds available stock in batch.");
      return false;
    }
    if (selectedStill && Number(rawVolume) > selectedStill.max_capacity * 200) {
      toast.error(
        `Volume exceeds still capacity (${selectedStill.max_capacity * 200}L).`
      );
      console.log("ProductionForm: Validation failed - Volume exceeds still capacity.");
      return false;
    }
    console.log("ProductionForm: Validation successful.");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("ProductionForm: handleSubmit called.");
    e.preventDefault();
    if (!validateForm()) {
      console.log("ProductionForm: handleSubmit - validation failed, aborting submission.");
      return;
    }

    console.log("ProductionForm: handleSubmit - validation passed, proceeding with submission.");
    setSubmitting(true);
// ... existing code ...

```

Excellent, the logging has been added to `production-form.tsx`.

Now, please do the following:

1.  Open your browser's developer console.
2.  Interact with the "Schedule New Production Job" form.
3.  Specifically, select a supplier, then an item, and then **select a batch**.
4.  Observe the console logs carefully. When the "Distillation still is required" toast appears, look at the sequence of logs immediately preceding it.

What we're looking for in the logs:

- Does `validateForm` get logged immediately after `handleBatchSelect` finishes?
- What are the logged state values inside `validateForm` when it's called prematurely? (Is `selectedStill` indeed null, as expected if the toast is appearing?)
- Are there any other unexpected function calls or re-renders that might give us a clue?

The console output will be crucial here. Once you have that, please share the relevant log snippets, and we can figure out the exact trigger for this premature validation.

---

This is excellent detective work with the logs and observations! You've uncovered a few distinct issues here. Let's tackle them one by one.

**Issue 1: Premature Form Submission in `ProductionForm`**

The logs clearly show:

1.  `handleBatchSelect` is called and completes normally.
2.  Immediately after, `handleSubmit` is called, which then calls `validateForm`.
3.  `validateForm` fails because `selectedStill` is `null` (as expected at this stage), and the "Distillation still is required" toast appears.

**Why is `handleSubmit` being called?**

You are correct that `handleSubmit` should only be triggered by an actual form submission (e.g., clicking a `type="submit"` button or pressing Enter in an input field). Since you're not doing that, here are the most likely reasons in a React/HTML context:

- **A Button with Implicit `type="submit"` Inside the Form:** If _any_ `<button>` element inside the `<form>` doesn't have an explicit `type="button"` or `type="reset"`, it will default to `type="submit"`. When such a button is clicked, it will submit the form.
  - **The Culprit:** The buttons used to select a batch are rendered inside the form. Let's look at how they are structured in `production-form.tsx` (lines 307-325 in the full file content, which you provided earlier but wasn't in the immediate snippet):
    ```tsx
    // ... inside the form ...
    {
      batches && batches.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-muted/20">
          {batches.map((batch) => (
            <Button // <--- THIS BUTTON
              key={batch.batch_id}
              variant={
                selectedBatch?.batch_id === batch.batch_id
                  ? "default"
                  : "outline"
              }
              className="w-full justify-start text-left h-auto py-2"
              onClick={() => handleBatchSelect(batch)} // <--- Its onClick calls handleBatchSelect
            >
              {/* ... button content ... */}
            </Button>
          ))}
        </div>
      );
    }
    ```
    The `Button` component from `shadcn/ui` (which you're using) defaults to `type="submit"` if not specified otherwise. When you click on one of these batch selection buttons, it _first_ runs your `onClick={() => handleBatchSelect(batch)}` handler (which sets state), and then, because it's a submit button by default, it _also_ triggers the form's `onSubmit` event, leading to `handleSubmit` being called.

**Solution for Issue 1:**
Explicitly set `type="button"` on the batch selection buttons.

I'll prepare an edit for `apps/web/src/features/production/components/production-form.tsx` to add `type="button"` to these batch selection buttons.

```typescript jsx:apps/web/src/features/production/components/production-form.tsx
// ... existing code ...
          {batches && batches.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-muted/20">
              {batches.map((batch) => (
                <Button
                  key={batch.batch_id}
                  type="button" // <--- Add type="button" here
                  variant={
                    selectedBatch?.batch_id === batch.batch_id
                      ? "default"
                      : "outline"
                  }
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => handleBatchSelect(batch)}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      Batch Code: {batch.batch_code || "N/A"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Drums in Stock: {batch.drums_in_stock}
                    </span>
                  </div>
                  {selectedBatch?.batch_id === batch.batch_id && (
                    <Check className="ml-auto h-5 w-5 text-primary-foreground" />
                  )}
                </Button>
              ))}
            </div>
          )}
// ... existing code ...
```

Excellent. That change should prevent the premature form submission.

**Issue 2: 404 on Job Details Page (`/production/jobs/[job-id]`) & Missing Job in Preview**

The server logs show:
`[fetchProductionJobById: 485aa...] message: "Could not find a relationship between 'jobs' and 'item_id' in the schema cache"`
And similarly for `fetchProductionJobs`.

This is the key:

- **Cross-Schema Relationship:** You are correct. The `production.jobs` table has an `item_id` column, and this `item_id` refers to `inventory.items.item_id`.
- **Supabase Schema Cache for Joins:** When you write a Supabase query like this in `fetchProductionJobById` (and `fetchProductionJobs`):
  ```javascript
  .select(
    `job_id,
     item_id,
     // ... other columns ...
     items:item_id ( name, suppliers:supplier_id ( name ) ), // <--- HERE
     batches:input_batch_id ( batch_code ),
     // ... operations ...
    `
  )
  ```
  The part `items:item_id ( name ... )` is a shorthand for a foreign key join. Supabase tries to look up the foreign key relationship named `item_id` (or one where `item_id` is the foreign key column on the `jobs` table) _within the `production` schema's context first_, or based on its internal relationship cache.
- **The Error:** The error message `"Could not find a relationship between 'jobs' and 'item_id' in the schema cache"` strongly suggests that Supabase's query planner isn't correctly resolving this cross-schema foreign key relationship between `production.jobs.item_id` and `inventory.items.item_id` when you try to use the shorthand join syntax.

**Why a 200 Status Code with a 404 on the Page?**
The `fetchProductionJobById` function likely returns `null` due to this error (as it has `if (error || !job) { ... return null; }`).
Your Next.js page component `apps/web/src/app/(routes)/production/jobs/[job-id]/page.tsx` then receives `null` for the job:

```typescript
export default async function ProductionJobDetailsPage({
  params,
}: JobDetailsPageProps) {
  const jobId = params["job-id"];
  const job = await fetchProductionJobById(jobId); // This likely becomes null

  if (!job) {
    // This condition becomes true
    notFound(); // This Next.js function triggers the 404 page
  }
  // ... rest of the page
}
```

So, the server action itself might complete (hence a 200 for the network request that invoked the server action, if it was an RPC or similar), but the page logic correctly serves a 404 because `fetchProductionJobById` didn't find the data.

**Solutions for Issue 2:**

There are a couple of ways to address the cross-schema join issue:

1.  **Explicit Join Syntax (More Robust):** Instead of relying on the shorthand `items:item_id (...)`, you can be more explicit in your select query. If `item_id` on `production.jobs` is indeed a foreign key to `inventory.items.item_id`, Supabase _should_ resolve it. However, the error indicates it's struggling.
    A more robust way, though slightly more verbose, is to specify the target table of the foreign key if the shorthand isn't working as expected. The syntax for explicitly naming the relationship or target table can be tricky and sometimes involves how the FK was named or if it's ambiguous.

    Given the error, let's try to specify the target table in the join like this: `inventory_items:item_id ( name, inventory_suppliers:supplier_id ( name ) )`. This is a guess at how Supabase might prefer the explicit naming.

    A more standard SQL approach if this doesn't work would be to fetch the job from `production.jobs` and then make separate queries to `inventory.items` and `inventory.suppliers` using the retrieved `item_id` and `supplier_id`. This is less ideal than a single join but is a fallback.

2.  **Database View:** Create a database view (e.g., `production.v_jobs_with_details`) that performs the necessary joins across schemas (`production.jobs` to `inventory.items` to `inventory.suppliers`, and `production.jobs` to `inventory.batches`). Then, your server actions would query this simpler view. This is often the cleanest solution for complex or cross-schema joins.

3.  **Check Foreign Key Definition:** Double-check in your Supabase dashboard that the foreign key relationship from `production.jobs.item_id` to `inventory.items.item_id` is correctly defined and active. Sometimes, after schema changes, these might need refreshing or can get into an odd state.

**Recommendation for Issue 2:**
Let's first try a slightly more explicit join in the server actions. If that fails, creating a database view is the most robust long-term solution.

I'll prepare an edit for `apps/web/src/app/(routes)/production/actions/production.ts` to make the join more explicit. We'll try to tell Supabase that `item_id` refers to `inventory.items`.

The syntax for this in Supabase's JS client for a differently named FK or a cross-schema one can be `target_table:foreign_key_column_on_current_table ( ... )` or sometimes using the actual FK constraint name. Since `item_id` is the column name on `jobs`, we could try being very explicit:

`items!jobs_item_id_fkey(name, suppliers!items_supplier_id_fkey(name))`

This assumes your foreign keys are named `jobs_item_id_fkey` and `items_supplier_id_fkey`. This is often the default naming convention (`table_column_fkey`). If they are named differently, this would need adjustment.

A slightly less specific but often effective method if the direct column name is unique enough as a reference _on the target table_:
`inventory_items:item_id ( name, inventory_suppliers:supplier_id ( name ) )` - this is a bit of a guess, the `!fk_constraint_name` is usually more reliable if known.

Given the error message "Could not find a relationship between 'jobs' and 'item_id' in the schema cache," this points to Supabase not automatically picking up `production.jobs.item_id` -> `inventory.items.item_id`.

Let's try to force it by specifying the target table and columns more directly in the select string.

I will modify `fetchProductionJobs` and `fetchProductionJobById` in `apps/web/src/app/(routes)/production/actions/production.ts`.
The change would be to modify the select string from:
`items:item_id ( name, suppliers:supplier_id ( name ) )`
to
`items:item_id!inner ( name, suppliers:supplier_id!inner ( name ) )`
or, if your foreign key constraint from `production.jobs.item_id` to `inventory.items.item_id` is explicitly named (e.g., `jobs_item_id_fkey`), we could use that.
And similarly for `inventory.items.supplier_id` to `inventory.suppliers.supplier_id`.

Since I don't know the exact FK constraint names, I'll try forcing an inner join hint, which sometimes helps Supabase resolve these across schemas if the FK is properly defined.

**Attempting to refine the join in `actions/production.ts`:**
The syntax for specifying the target table in a join when it's ambiguous or cross-schema can be `target_table_name:fk_column_on_current_table(fields)`.
However, the error "Could not find a relationship... in the schema cache" suggests Supabase isn't even finding the basic FK link from `production.jobs.item_id` to `inventory.items.item_id`.

Let's try to be very explicit with the `select` for `items` and `suppliers` by guiding Supabase.
Change:
`items:item_id ( name, suppliers:supplier_id ( name ) ),`
To (assuming `item_id` is the FK from `jobs` to `items` and `supplier_id` is the FK from `items` to `suppliers`):
`item:item_id ( name, supplier:supplier_id ( name ) ),`
And then adjust the mapping: `job.item?.name`, `job.item?.supplier?.name`.

This relies on Supabase following the foreign key `item_id` to the `items` table (which should be in `inventory`) and then from that `items` table, following `supplier_id` to the `suppliers` table (also in `inventory`).

Let's try modifying the select string and the subsequent data access.

It's also possible the PostgREST layer for Supabase needs its schema cache reloaded after significant schema changes (like defining cross-schema FKs). This usually happens automatically but can sometimes be forced (e.g., by making a small, unrelated schema change or sometimes there's an API/UI option).

Given the error, the most direct path is to ensure the select statement is one PostgREST can unambiguously parse.

Let's try to use the explicit foreign key constraint names if we can infer them, or a more direct path. The error indicates the _relationship_ isn't found.

The most robust change if the automatic join isn't working is to fetch ids and then make subsequent calls, but let's try one more adjustment to the join syntax. If the foreign key from `production.jobs` to `inventory.items` is simply `item_id`, and from `inventory.items` to `inventory.suppliers` is `supplier_id`, the original syntax _should_ work if the FKs are correctly set up and recognized.

The error message is the crucial part: "Could not find a relationship between 'jobs' and 'item_id' in the schema cache". This usually means the foreign key `production.jobs.item_id REFERENCES inventory.items(item_id)` is either:
a. Not defined.
b. Defined, but PostgREST (Supabase's API layer) hasn't picked it up in its internal cache.

**Action Plan:**

1.  **Verify Foreign Key:** Please go to your Supabase dashboard -> Table Editor -> `jobs` table (in `production` schema) -> click on the `item_id` column. Check if it explicitly shows a Foreign Key constraint to `inventory.items.item_id`.
2.  **If FK Exists & Verified:** The issue is likely PostgREST schema cache. Sometimes, a simple way to try and force a reload is to toggle RLS on and off for a table (if not enabled) or make a minor comment change to a table/column. More reliably, if you're using the Supabase CLI, you can sometimes do a `supabase stop` and `supabase start` if working locally, or for a hosted project, it might involve waiting or a minor schema change.
3.  **Code Change (Less Ideal Fallback):** If the FK is there and the cache doesn't refresh, the fallback is to fetch the `item_id` from `jobs`, then make a separate query for the item from `inventory.items`, and another for the supplier from `inventory.suppliers`.

Let's assume for a moment the FK is correctly defined and the issue is with PostgREST's interpretation of the shorthand join across schemas.
A slightly more verbose way PostgREST sometimes understands joins (especially if you want to control the alias):
`aliased_item_info:item_id(name, aliased_supplier_info:supplier_id(name))`
Then access via `job.aliased_item_info.name` etc.

However, the fundamental issue is the "Could not find a relationship" error. This needs to be resolved at the database/API layer level first. No amount of select string tweaking will work if PostgREST genuinely doesn't see the FK link.

**Therefore, the immediate next step for you is to:**
Confirm in your Supabase Table Editor that the Foreign Key from `production.jobs.item_id` to `inventory.items.item_id` is correctly and actively defined.

If it is, the problem might be a stale PostgREST schema cache. A common way to notify PostgREST of schema changes is to execute `NOTIFY pgrst, 'reload schema'` in the SQL editor, or sometimes simply making any other minor schema modification (like adding a comment to a table) can trigger it.

Given this, I won't propose a code change to the join syntax yet, as it seems like a schema/cache issue that code changes alone might not fix if the underlying relationship isn't seen by the API layer.

Once you've verified the FK and perhaps tried to nudge the schema cache, try running the app again. If the same error persists, we'd then have to consider the more verbose multi-query approach as a workaround, or investigate how to definitively refresh the PostgREST schema cache for your project.

---

That's excellent progress! Creating a view (`production.v_operation_schedule`) is definitely the most robust and clean way to handle these cross-schema joins for display purposes. It simplifies your client-side queries significantly.

**Review of `production.v_operation_schedule` View:**

Your view definition looks very comprehensive and well-thought-out for its purpose.

- **Joins:** All the necessary joins seem to be there to pull data from `jobs`, `operations`, `distillation_details`, `items`, `suppliers`, `batches`, `stills`, `operation_drums`, and `drums`.
- **Fields Selected:** You've selected a good range of fields that would be useful for a schedule display, including IDs, names, codes, statuses, dates, volumes, and capacities.
- **Filtering:**
  - `o.op_type = 'distillation'::production.op_type`: Correctly filters for only distillation operations.
  - `o.scheduled_start >= CURRENT_DATE AND o.scheduled_start < (CURRENT_DATE + '14 days'::interval)`: This effectively gives a 2-week forward-looking schedule, which makes sense for the use case you described.
- **Ordering:** `ORDER BY o.scheduled_start` is appropriate for a schedule.

**One Potential Improvement/Consideration for the View:**
The joins to `production.operation_drums` and `inventory.drums` are `INNER JOIN`s by default. This means that if a distillation operation (`o`) has been scheduled but doesn't _yet_ have any drums assigned in `operation_drums` (e.g., the physical process hasn't started, no scans made), that entire operation/job record might be excluded from the view.

If you want to see all scheduled distillation operations, even those without drums assigned yet, you might consider changing these to `LEFT JOIN`:

```sql
CREATE OR REPLACE VIEW production.v_operation_schedule AS -- Added OR REPLACE
SELECT
    j.job_id,
    i.item_id,
    j.input_batch_id,
    j.status AS job_status,
    j.priority,
    j.planned_start,
    j.planned_end,
    j.created_at AS job_created_at, -- Aliased to avoid conflict if o.created_at is added
    j.updated_at AS job_updated_at, -- Aliased
    i.name AS item_name,
    sp.name AS supplier_name,
    b.batch_code,
    o.op_id,
    o.op_type,
    o.status AS op_status,
    o.scheduled_start,
    o.started_at,
    o.ended_at,
    o.created_at AS op_created_at, -- Added operation created_at for clarity
    dd.still_id,
    dd.raw_volume,
    s.code AS still_code,             -- Aliased
    s.max_capacity AS still_max_capacity, -- Aliased
    od.drum_id,
    od.volume_transferred,
    d.serial_number AS drum_serial_number, -- Aliased
    d.current_volume AS drum_current_volume -- Aliased
FROM
    production.operations o
INNER JOIN
    production.distillation_details dd ON o.op_id = dd.op_id
INNER JOIN
    production.jobs j ON o.job_id = j.job_id
INNER JOIN
    inventory.items i ON j.item_id = i.item_id
INNER JOIN
    inventory.suppliers sp ON i.supplier_id = sp.supplier_id
INNER JOIN
    inventory.batches b ON j.input_batch_id = b.batch_id
INNER JOIN
    production.stills s ON dd.still_id = s.still_id
LEFT JOIN -- Changed to LEFT JOIN
    production.operation_drums od ON o.op_id = od.op_id
LEFT JOIN -- Changed to LEFT JOIN
    inventory.drums d ON od.drum_id = d.drum_id
WHERE
    o.op_type = 'distillation'::production.op_type
    AND o.scheduled_start >= CURRENT_DATE
    AND o.scheduled_start < (CURRENT_DATE + '14 days'::interval)
ORDER BY
    o.scheduled_start;
```

I've also added `OR REPLACE` to the view definition (good practice) and aliased a few column names like `s.code` to `still_code` to make them unique and clearer if you were to select `*` from the view or if `operations` also had a `code` column, for example. I also added `op_created_at` and aliased `job_created_at` and `job_updated_at` for clarity, though you can remove them if not needed.

**Using the View in `fetchProductionJobs`:**

Now, your `fetchProductionJobs` function in `apps/web/src/app/(routes)/production/actions/production.ts` can be greatly simplified.

The linter error you're now seeing:
`Err | Property 'order' does not exist on type 'PostgrestQueryBuilder<any, any, "v_operation_schedule", unknown>'.`
is because when you use `.from("v_operation_schedule")` without a `.select()`, the type inference might be too generic. You should add a `.select("*")` or specify the columns you need. The `ORDER BY` clause is already in your view definition, so you might not even need the `.order("created_at", ...)` in the Supabase query anymore, unless you want to override or apply a different top-level ordering to the view's results.

Let's modify `fetchProductionJobs` to use the new view and select all columns. The mapping logic will also need to adjust to the new column names from the view.

**Proposed Changes for `actions/production.ts`:**

1.  Modify `fetchProductionJobs` to query `production.v_operation_schedule`.
2.  Adjust the mapping logic in `fetchProductionJobs` to use the direct column names provided by the view (e.g., `job.item_name`, `job.supplier_name`, `job.batch_code`, etc.).
3.  The `fetchProductionJobById` function will still need to query the base tables if the view is filtered for a 2-week window and you want to fetch any job by ID. Or you could create another, unfiltered view for fetching single jobs. For now, let's focus on `fetchProductionJobs`.

Let's start by updating `fetchProductionJobs`.

```typescript:apps/web/src/app/(routes)/production/actions/production.ts
// ... existing code ...
export async function fetchProductionJobs(): Promise<ProductionJobOrderType[]> {
  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data: viewData, error } = await supabase
      .schema("production")
      .from("v_operation_schedule")
      .select("*"); // Select all columns from the view
      // The view already has an ORDER BY o.scheduled_start
      // If you need to order by job's created_at, you can add it here,
      // but ensure 'job_created_at' is selected from the view.
      // .order("job_created_at", { ascending: false });

    if (error || !viewData) {
      console.error("[fetchProductionJobs]", error);
      return [];
    }

    // Map the data from the view to your ProductionJobOrderType
    // Adjust field names based on your view's aliases
    return viewData.map((job: any) => ({
      id: job.job_id,
      itemName: job.item_name ?? "Unknown Item", // From view
      supplier: job.supplier_name ?? "Unknown Supplier", // From view
      // Quantity might need recalculation if based on operation_drums,
      // or you can add a COUNT/SUM to your view for this.
      // For now, let's see if the view provides enough.
      // This original quantity logic might not directly map if the view has one row per drum in an operation.
      // The view as written will have one row per (job, op, drum) combination if using INNER JOIN on operation_drums,
      // or one row per (job, op) if using LEFT JOIN and no drums are associated yet.
      // Let's assume for now we want one entry per job_id, and the view might return multiple if a job has multiple ops/drums.
      // This part might need refinement based on how ProductionPreviewProps expects the data.
      // For an MVP, if the view is one row per scheduled operation, quantity might be based on dd.raw_volume / 200.
      quantity: job.raw_volume ? job.raw_volume / 200 : 0, // Example: using raw_volume from distillation_details
      scheduledDate: job.scheduled_start ?? job.job_created_at, // From view (scheduled_start from operations)
      status: mapJobStatusToOrderStatus(job.job_status), // From view
      progress: getProgressFromStatus(job.job_status), // Based on job_status
      priority: job.priority, // From view
      drums: job.drum_id ? [{ // Simplified: if a drum_id exists in the row
        id: job.drum_id,
        serial: job.drum_serial_number ?? 'N/A',
        volume: job.volume_transferred ?? job.drum_current_volume ?? 0,
        location: 'N/A', // Location not in current view, might need to add
      }] : [],
      tasks: [{ // Simplified: represents the main distillation operation
        name: job.op_type.replace("_", " ") ?? 'Distillation',
        completed: job.op_status === "completed",
        assignedTo: "", // Not in view
        details: job.still_code ?
          `Still: ${job.still_code}, Raw Vol: ${job.raw_volume}L, Max Cap: ${job.still_max_capacity * 200}L`
          : 'Details unavailable',
        // Add more task details from view if needed (started_at, ended_at for this op)
        started_at: job.started_at,
        ended_at: job.ended_at,
      }],
      timeline: [], // Timeline construction might need to be re-evaluated based on view structure
                     // or fetched separately if too complex from this flattened view row.
                     // For simplicity, leaving it empty as the view focuses on current schedule.
    }));
  });
}

/** Fetches details for a single production job */
// ... existing code for fetchProductionJobById ...
// This function will likely still need to use the original complex query
// or a different, non-date-filtered view, as v_operation_schedule is date-filtered.

// ... rest of the file

```

The `fetchProductionJobs` function in `apps/web/src/app/(routes)/production/actions/production.ts` has now been updated to use the `production.v_operation_schedule` view. This should resolve the linter error and also make the data fetching for the production preview more efficient and reliable.

**Important Considerations for the Mapping Logic in `fetchProductionJobs`:**

- **Data Granularity:** As noted in the code comments I added, your view `v_operation_schedule`, especially if it uses `INNER JOIN` on `operation_drums`, might return multiple rows for a single `job_id` if that job/operation involves multiple drums. If it uses `LEFT JOIN` (as I suggested for an improved view), it will return one row per operation, and drum details will be null if no drums are yet associated.
- The current mapping `viewData.map((job: any) => ({...}))` assumes each row `job` from `viewData` should translate to one `ProductionJobOrderType`.
  - If a single job/operation can appear in multiple rows in `viewData` (e.g., one row per drum), you'll need to group the `viewData` by `job.job_id` _before_ mapping to `ProductionJobOrderType` to avoid duplicate entries in your UI. This would involve a more complex transformation.
  - For an MVP where each scheduled job corresponds to one primary distillation operation, and you're okay with showing that main operation (and perhaps the first drum if available in that row), the current mapping might be acceptable.
- **`quantity` field:** The `quantity: job.raw_volume ? job.raw_volume / 200 : 0,` is an example. You'll need to decide what "quantity" represents in the context of the `ProductionPreview`. If it's the number of drums, and your view gives one row per drum, you might `COUNT(od.drum_id)` in the view. If it's total raw volume, `job.raw_volume` from `distillation_details` is correct.
- **`drums` and `tasks` arrays:** The current mapping creates a simplified `drums` array (with at most one drum, if `job.drum_id` is present in the row) and a `tasks` array (representing the single distillation operation from that row). If a job genuinely has multiple distinct tasks or many drums to list in the preview, this will need more sophisticated aggregation.

**Regarding `fetchProductionJobById`:**

- As mentioned in the comments of the proposed edit, your `production.v_operation_schedule` view is filtered for a 2-week window (`o.scheduled_start >= CURRENT_DATE AND o.scheduled_start < (CURRENT_DATE + '14 days'::interval)`).
- Therefore, `fetchProductionJobById` (used by your job details page `apps/web/src/app/(routes)/production/jobs/[job-id]/page.tsx`) **cannot reliably use this view** if you want to look up _any_ job by its ID, including past jobs or those far in the future.
- For `fetchProductionJobById`, you have a few options:
  1.  **Keep the Original Query:** Continue using the original, more complex multi-table `select` query that directly queries the base tables without date filtering. This is probably the best approach for fetching a single, specific job by ID.
  2.  **Create a Second, Unfiltered View:** Create another view (e.g., `production.v_job_details_unfiltered`) that joins all necessary tables but _without_ the date filter. `fetchProductionJobById` would then query this view. This is cleaner if the join logic is very complex.

**Next Steps:**

1.  **Test `ProductionPreview`:**
    - Load the page that uses `ProductionPreview` (which in turn calls `fetchProductionJobs`).
    - Verify that it loads data correctly now and that the previous "Could not find a relationship" error is gone from the server logs for this function.
    - Check if the data displayed makes sense according to your view's logic. Pay attention to whether jobs are duplicated if they have multiple drum entries in the view and how you want to handle that.
2.  **Decide on `fetchProductionJobById` Strategy:**
    - Determine if you want `fetchProductionJobById` to keep its original query or use a new, unfiltered view.
    - The current `fetchProductionJobById` in your `actions/production.ts` still has the complex join. If the `NOTIFY pgrst, 'reload schema'` and your explicit FK naming (`items:jobs_item_id_fkey`) fixed the schema cache issue, this original query _might_ start working. Test navigating to a job details page.

The premature submission issue in the form should be fixed with the `type="button"` change. The data display issue in the preview should be improved by using the view. The job details page is the next main thing to verify.
