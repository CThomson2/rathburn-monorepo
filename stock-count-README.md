# Stock Count System

This system allows for efficient physical stock taking using barcode scanning for materials and suppliers.

## Overview

The stock count system consists of:


1. **Barcode Generation Scripts** - Creates PDFs with barcodes for all materials and suppliers
2. **Supabase Database Table** - Stores the stock count data
3. **Mobile App Integration** - Scans barcodes to record inventory

## Setup Instructions

### 1. Install Dependencies and Generate Barcodes

```bash
# Install barcode generation dependencies
cd scripts
npm install

# Generate barcode PDFs
npm run generate-all
# Or from the mobile app directory:
cd ../apps/mobile
npm run generate-barcodes
```

This will create two PDFs in the root directory:
- `materials-barcodes.pdf` - Contains barcodes for all materials
- `suppliers-barcodes.pdf` - Contains barcodes for all suppliers

### 2. Print Barcodes

Print both PDFs and organize them for your inventory process:
- Consider laminating the supplier barcodes for durability
- Cut and organize the material barcodes for easy access
- The supplier barcodes are marked with a red "SUPPLIER" label for clear identification

### 3. Mobile App Setup

The mobile app includes components to scan and process barcodes:

- `BarcodeScanner.tsx` - React component for scanning barcodes
- `stockCount.ts` - API functions for processing scans and updating the database

The app needs the Supabase URL and anonymous key to function correctly. Ensure these are set in your environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Structure

The system uses a Supabase table with the following structure:

```sql
CREATE TABLE public.stock_count (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES inventory.suppliers(supplier_id),
  material_id UUID NOT NULL REFERENCES inventory.materials(material_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_supplier_material UNIQUE (supplier_id, material_id)
);
```

And a helper function to handle incrementation:

```sql
CREATE OR REPLACE FUNCTION public.increment_stock_count(
  p_supplier_id UUID,
  p_material_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_quantity INTEGER;
BEGIN
  INSERT INTO public.stock_count (supplier_id, material_id, quantity)
  VALUES (p_supplier_id, p_material_id, 1)
  ON CONFLICT (supplier_id, material_id) 
  DO UPDATE SET
    quantity = stock_count.quantity + 1,
    updated_at = now()
  RETURNING quantity INTO v_new_quantity;
  
  RETURN v_new_quantity;
END;
$$;
```

## Usage Workflow

1. **Begin Counting**
   - Start by scanning a supplier barcode (marked with red "SUPPLIER" label)
   - This sets the "context" for subsequent material scans

2. **Count Materials**
   - For each unit of a material from the current supplier, scan its barcode
   - Each scan increments the quantity by 1
   - If it's the first scan for that supplier/material combo, it creates a new record

3. **Change Suppliers**
   - To count materials from a different supplier, scan that supplier's barcode
   - This changes the context for subsequent scans

4. **Review Results**
   - The mobile app shows a history of recent scans
   - It displays the current supplier context at the top

## Generating Reports

After completing the stock count, you can query the table to generate reports:

```sql
-- Total quantity by material
SELECT m.name, m.code, SUM(sc.quantity) as total_quantity
FROM public.stock_count sc
JOIN inventory.materials m ON sc.material_id = m.material_id
GROUP BY m.name, m.code
ORDER BY m.name;

-- Inventory by supplier
SELECT s.name as supplier, m.name as material, m.code, sc.quantity
FROM public.stock_count sc
JOIN inventory.materials m ON sc.material_id = m.material_id
JOIN inventory.suppliers s ON sc.supplier_id = s.supplier_id
ORDER BY s.name, m.name;

-- Materials not in stock (missing from count)
SELECT m.name, m.code
FROM inventory.materials m
LEFT JOIN public.stock_count sc ON m.material_id = sc.material_id
WHERE sc.id IS NULL
ORDER BY m.name;
```

## Troubleshooting

- **Unknown Barcode**: If a barcode scan returns "Unknown barcode", ensure the barcode is from the generated PDFs.
- **No Supplier Context**: If you get an error about missing supplier context, scan a supplier barcode first.
- **Database Connection**: Check that your Supabase credentials are correct if you encounter connection issues.

## Technical Components

- **Barcode Generation**: Uses JSBarcode, PDFKit, and xmldom to create PDF barcodes
- **Database Integration**: Uses Supabase with PostgreSQL for data storage
- **Mobile Scanner**: Uses react-native with expo-barcode-scanner for the scanning interface 