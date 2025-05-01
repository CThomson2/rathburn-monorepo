// Generate PDF with barcodes for suppliers
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const JsBarcode = require('jsbarcode');
const { DOMImplementation, XMLSerializer } = require('xmldom');
const SVGtoPDF = require('svg-to-pdfkit');

// Load suppliers data
const suppliersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../sql/data/suppliers.json'), 'utf8'));

// PDF configuration
const doc = new PDFDocument({
  size: 'A4',
  margin: 30, // Reduced margins to fit more content
});

// Setup PDF generation
doc.pipe(fs.createWriteStream(path.join(__dirname, '../suppliers-barcodes.pdf')));

// Function to create barcode SVG
function createBarcodeSVG(value, displayValue) {
  const xmlSerializer = new XMLSerializer();
  const document = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null);
  const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  
  // Use the first 10 characters of the UUID for a more compact barcode
  // The full UUID is preserved in the text display for reference
  const shortValue = value.substring(0, 10);
  
  JsBarcode(svgNode, shortValue, {
    xmlDocument: document,
    format: 'CODE128',
    width: 1.5,       // Make thinner bars for more compact barcodes
    height: 40,       // Reduce height to make barcode smaller
    displayValue: true,
    text: displayValue || value,
    fontSize: 10,     // Smaller text
    margin: 5         // Smaller margin
  });
  
  return xmlSerializer.serializeToString(svgNode);
}

// Layout configuration - MODIFIED for more compact display
const barcodeWidth = 180;    // Narrower barcodes
const barcodeHeight = 80;    // Shorter barcode sections
const itemsPerRow = 2;       // Back to 2 columns
const itemsPerPage = 12;     // Increased items per page (6 rows × 2 columns)
const pageWidth = doc.page.width;
const pageHeight = doc.page.height;
const startX = 30;           // Start further left to utilize space better
const endX = pageWidth - 30; // Add right margin
const availableWidth = endX - startX;
const columnWidth = availableWidth / itemsPerRow;
const startY = 30;
const marginY = 15;          // Reduced vertical margin

console.log(`Generating PDF for ${suppliersData.length} suppliers...`);

// Add a title page with instructions - more compact
doc.fontSize(20);
doc.font('Helvetica-Bold');
doc.text('Supplier Barcodes for Stock Count', {
  align: 'center'
});

doc.moveDown(1);
doc.fontSize(12);
doc.font('Helvetica');
doc.text('Instructions:', {
  underline: true
});
doc.moveDown(0.5);
doc.text('1. Scan a supplier barcode to set the current context.');
doc.text('2. Scan material barcodes for each unit from that supplier.');
doc.text('3. To change suppliers, scan a new supplier barcode.');

doc.moveDown(1);
doc.text('Note: Each scan of a material barcode will increment the count by 1 for that supplier/material combination.', {
  align: 'center'
});

doc.text('\nImportant: These barcodes use shortened IDs (first 10 chars of UUID) to make them more compact. The full supplier name is shown for reference.', {
  align: 'center'
});

doc.addPage();

// Generate barcodes page by page
let currentX = startX;
let currentY = startY;
let itemCount = 0;
let pageCount = 1;

suppliersData.forEach((supplier, index) => {
  // Generate barcode for supplier ID
  const barcodeValue = supplier.supplier_id;
  const displayText = supplier.name;
  const barcodeSVG = createBarcodeSVG(barcodeValue, displayText);
  
  // Add supplier name as title above barcode
  doc.fontSize(12); // Smaller font size
  doc.font('Helvetica-Bold');
  doc.text(supplier.name, currentX, currentY, {
    width: barcodeWidth,
    align: 'center'
  });
  
  // Add "SUPPLIER" label
  doc.fontSize(10); // Smaller font size
  doc.font('Helvetica');
  doc.fillColor('red');
  doc.text('SUPPLIER', currentX, currentY + 15, {
    width: barcodeWidth,
    align: 'center'
  });
  doc.fillColor('black');
  
  // Add barcode SVG
  SVGtoPDF(doc, barcodeSVG, currentX, currentY + 30, {
    width: barcodeWidth,
    height: barcodeHeight - 35
  });
  
  // Move to next position
  itemCount++;
  if (itemCount % itemsPerRow === 0) {
    // Move to next row
    currentX = startX;
    currentY += barcodeHeight + marginY;
  } else {
    // Move to next column
    currentX = startX + columnWidth;
  }
  
  // Check if we need a new page
  if (itemCount % itemsPerPage === 0 && index < suppliersData.length - 1) {
    doc.addPage();
    currentX = startX;
    currentY = startY;
    pageCount++;
    console.log(`Added page ${pageCount}`);
  }
});

console.log(`Generated ${pageCount} pages of supplier barcodes.`);
doc.end();
console.log('PDF saved to suppliers-barcodes.pdf'); 