import { NextResponse } from "next/server";
import { fetchDrumLabelData, markDrumLabelsAsPrinted } from "@/app/actions/label-generation";
import bwipjs from "bwip-js";
import { PDFDocument, StandardFonts } from "pdf-lib";
// For convenience, helper to convert inches to PDF points (72pt = 1in)
import { inchesToPoints } from "@/lib/utils";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(
  req: Request,
  {
    params: { "pol-id": polId },
  }: { params: { "pol-id": string } }
) {
  try {
    if (!polId) {
      return NextResponse.json(
        { error: "Missing purchase order line ID" },
        { status: 400 }
      );
    }

    // Fetch drum label data from database
    const drumLabels = await fetchDrumLabelData(polId);

    if (!drumLabels.length) {
      return NextResponse.json(
        { error: "No drum labels found for this purchase order line" },
        { status: 404 }
      );
    }

    // Create a PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page size for 6" x 4" label printing (landscape)
    const PAGE_WIDTH = inchesToPoints(6);
    const PAGE_HEIGHT = inchesToPoints(4);

    // For each drum, generate a barcode and a dedicated page in the PDF
    for (const drum of drumLabels) {
      // Generate the barcode image (PNG) for the serial number
      const barcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: `${drum.serialNumber}`,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: "center",
      });

      // Add a new page for each drum's label
      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const barcodeImage = await pdfDoc.embedPng(new Uint8Array(barcodeBuffer));

      // Add Supplier and Material text in bold
      page.drawText(`Supplier: ${drum.supplierName}`, {
        x: 30,
        y: PAGE_HEIGHT - 30,
        size: 14,
        font: boldFont,
      });
      page.drawText(`Material: ${drum.materialName}`, {
        x: 30,
        y: PAGE_HEIGHT - 50,
        size: 14,
        font: boldFont,
      });

      // Place the barcode image
      page.drawImage(barcodeImage, {
        x: 30,
        y: 50,
      });

      // Add serial number and PO information
      page.drawText(`Serial Number: ${drum.serialNumber}`, {
        x: 30,
        y: 200,
        size: 14,
        font,
      });
      
      page.drawText(`Order ID: ${drum.purchaseOrderId}`, {
        x: 30,
        y: 20,
        size: 14,
        font,
      });
    }

    // Finalize PDF
    const pdfBytes = await pdfDoc.save();

    // Save generated PDF to /public folder
    await mkdir(join(process.cwd(), "public", "labels"), { recursive: true });
    
    // Generate the file path and URL path
    const fileName = `barcodes-${polId}.pdf`;
    const filePath = join(process.cwd(), "public", "labels", fileName);
    const urlPath = `/labels/${fileName}`;
    
    // Save the file
    await writeFile(filePath, pdfBytes);

    // Mark labels as printed
    await markDrumLabelsAsPrinted(polId);

    // Return the URL path to the generated PDF
    return NextResponse.json({ 
      success: true,
      filePath: urlPath
    });
    
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error generating barcodes" },
      { status: 500 }
    );
  }
} 