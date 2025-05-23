# Drums Data Import Process

This directory contains scripts to import and process drum inventory data from CSV into the Supabase database.

## Files

- `generate_sql_from_csv.js` - Node.js script to convert CSV data into SQL insert statements
- `import_drums_data.sql` - Generated SQL to import raw data into the `public.drums` table
- `process_drums_to_stock.sql` - SQL to aggregate and transfer data from `drums` to `stock_repro`

## Import Process

### Step 1: Generate SQL from CSV

This step has already been completed, but if you need to regenerate the SQL:

```bash
# Install dependencies
npm install csv-parse

# Run the script
node scripts/generate_sql_from_csv.js
```

This reads the CSV file and generates `import_drums_data.sql` with proper transformations.

### Step 2: Import Raw Data into Supabase

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `import_drums_data.sql` into the editor
4. Run the SQL to insert all records into the `public.drums` table

### Step 3: Map Material Codes (If Needed)

The script will identify unmapped material codes that don't exist in your `ref_materials` table. You need to:

1. Review the unmapped codes in the initial query output of `process_drums_to_stock.sql`
2. Insert any missing codes into the `ref_materials` table:

```sql
-- Example: Add missing material codes to ref_materials
INSERT INTO public.ref_materials (value, code, chemical_group)
VALUES
  ('Methanol', 'MET', 'Alcohol'),
  ('Acetone', 'ACE', 'Ketone'),
  ('Heptane', 'HEP', 'Hydrocarbon');
```

### Step 4: Process Data to Stock Table

1. Open the Supabase SQL Editor again
2. Copy and paste the contents of `process_drums_to_stock.sql` into the editor
3. Run the SQL to aggregate data and insert into the `stock_repro` table

## Data Transformations

The following transformations are applied during import:

- `material_code`: Takes the first 3 characters of the material name in uppercase (or 'XXX' if empty)
- `site`: Converts "New Site" to "new" and "Old Site" to "old" (takes first 3 chars lowercase)
- `status`: Set to 'R' for all records (representing Repro drums)

## Aggregation Process

The data is aggregated from the `drums` table to the `stock_repro` table by:

1. Grouping by `material_code` and `site`
2. Counting the number of records in each group (quantity)
3. Creating a note with the import date
4. Setting the appropriate location based on the site

## Handling Duplicate Data

The script detects duplicate `old_id` values (40 duplicates found). These duplicates are preserved in the raw data import, but will be consolidated when aggregating to the `stock_repro` table.

## Material Code Validation

The `process_drums_to_stock.sql` script:

1. Creates a temporary mapping table showing all material codes from the drums table
2. Indicates which codes are missing from the `ref_materials` reference table
3. Only transfers drums with valid material codes to `stock_repro`
4. Reports on drums that couldn't be processed due to missing material code mappings

# Stock Count Barcode Generator

This package contains scripts to generate barcode PDFs for physical stock taking.

## Setup

Install dependencies:

```bash
cd scripts
npm install
```

## Generate Barcode PDFs

Generate material barcodes:

```bash
npm run generate-material-barcodes
```

Generate supplier barcodes:

```bash
npm run generate-supplier-barcodes
```

Generate both PDFs:

```bash
npm run generate-all
```

The PDFs will be saved in the root directory as:
- `materials-barcodes.pdf`
- `suppliers-barcodes.pdf`

## Stock Count System Usage Instructions

### Database Setup

A `stock_count` table has been created in the Supabase database with the following structure:

- `id` (UUID, Primary Key)
- `supplier_id` (UUID, Foreign Key to inventory.suppliers)
- `material_id` (UUID, Foreign Key to inventory.materials)
- `quantity` (Integer)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Workflow

1. Print both the material and supplier barcode PDFs.
2. Start your stock count by scanning a supplier barcode (red "SUPPLIER" label) to set the context.
3. For each item from that supplier, scan the material barcode. Each scan will:
   - If it's the first scan for that supplier-material combination, create a new record with quantity 1
   - If the combination already exists, increment the quantity by 1
4. To change suppliers, scan a new supplier barcode.

### Mobile App Integration

The mobile app should implement the following logic:

1. Keep track of the currently selected supplier_id
2. When a barcode is scanned:
   - If it matches a supplier_id pattern, update the current supplier context
   - If it matches a material_id pattern, execute an UPSERT query

Sample UPSERT query:

```sql
INSERT INTO public.stock_count (supplier_id, material_id, quantity)
VALUES ('[current_supplier_id]', '[scanned_material_id]', 1)
ON CONFLICT (supplier_id, material_id) 
DO UPDATE SET
  quantity = stock_count.quantity + 1,
  updated_at = now();
```
