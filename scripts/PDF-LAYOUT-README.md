# Barcode PDF Layout Improvements

## Latest Changes (More Compact Layout)

Both material and supplier barcode PDFs have been updated with the following compact improvements:

### 1. Increased Items Per Page
- Changed back to 2 columns for better space utilization
- Increased to 10-12 items per page (5-6 rows × 2 columns)
- Reduced the barcode height (40px vs 80px previously)

### 2. Optimized Barcode Content
- Now using only the first 10 characters of UUIDs for barcode generation
- Full supplier name or material code still displayed for reference
- Thinner bars for more compact barcodes (1.5px vs 2-2.5px width)

### 3. Better Margins and Spacing
- Equal margins on left and right sides (30px)
- Reduced vertical spacing between items (15px)
- Optimized column layout using available page width

### 4. Improved Space Efficiency
- Reduced font sizes for all text elements
- More compact information display
- Only essential information shown directly on barcodes

## Important Note About Shortened UUIDs

To make the barcodes more compact and easier to scan:
- Only the first 10 characters of each UUID are used in the actual barcode
- The barcode scanner will read this shortened ID
- The stock count system should be able to find the correct item with this prefix
- Full name of material/supplier is still shown for human reference

## Results
These changes create a much more efficient layout:
- More barcodes per page means fewer pages to print
- Smaller barcodes are still scannable but take up less space
- Right margin prevents content from being cut off

## To Generate the PDFs
Run the following commands from the scripts directory:

```bash
# Generate both PDFs
npm run generate-all

# Or individually
npm run generate-material-barcodes
npm run generate-supplier-barcodes
```

The PDFs will be saved in the root directory of the project as:
- `materials-barcodes.pdf`
- `suppliers-barcodes.pdf`

## Print Instructions
When printing these PDFs:
1. Use high-quality printing settings
2. Do NOT use "Fit to page" to maintain proper barcode sizes
3. Use letter size or A4 paper
4. Print in portrait orientation 