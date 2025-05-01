// Generate PDF with barcodes for materials
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const JsBarcode = require('jsbarcode');
const { DOMImplementation, XMLSerializer } = require('xmldom');
const SVGtoPDF = require('svg-to-pdfkit');

// Load materials data
const materialsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../sql/data/materials.json'), 'utf8'));

// PDF configuration
const doc = new PDFDocument({
  size: 'A4',
  margin: 30, // Reduced margins to fit more content
});

// Setup PDF generation
doc.pipe(fs.createWriteStream(path.join(__dirname, '../materials-barcodes.pdf')));

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
const itemsPerPage = 10;     // Increased items per page (5 rows × 2 columns)
const pageWidth = doc.page.width;
const pageHeight = doc.page.height;
const startX = 30;           // Start further left to utilize space better
const endX = pageWidth - 30; // Add right margin
const availableWidth = endX - startX;
const columnWidth = availableWidth / itemsPerRow;
const startY = 30;
const marginY = 15;          // Reduced vertical margin

console.log(`Generating PDF for ${materialsData.length} materials...`);

// Generate barcodes page by page
let currentX = startX;
let currentY = startY;
let itemCount = 0;
let pageCount = 1;

materialsData.forEach((material, index) => {
  // Generate barcode for material ID
  const barcodeValue = material.material_id;
  const displayText = `${material.code}`;  // Just show the code for compactness
  const barcodeSVG = createBarcodeSVG(barcodeValue, displayText);
  
  // Add material name as title above barcode
  doc.fontSize(12); // Smaller font size
  doc.font('Helvetica-Bold');
  doc.text(material.name, currentX, currentY, {
    width: barcodeWidth,
    align: 'center'
  });
  
  // Add material code and chemical group
  doc.fontSize(9); // Smaller font size
  doc.font('Helvetica');
  doc.text(`Code: ${material.code} - CAS: ${material.cas_number}`, currentX, currentY + 15, {
    width: barcodeWidth,
    align: 'center'
  });
  
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
  if (itemCount % itemsPerPage === 0 && index < materialsData.length - 1) {
    doc.addPage();
    currentX = startX;
    currentY = startY;
    pageCount++;
    console.log(`Added page ${pageCount}`);
  }
});

console.log(`Generated ${pageCount} pages of material barcodes.`);
doc.end();
console.log('PDF saved to materials-barcodes.pdf'); 