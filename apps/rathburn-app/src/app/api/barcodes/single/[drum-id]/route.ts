// /app/api/barcodes/[drum_id]/route.ts
import { NextResponse } from "next/server";
import { withDatabase, DATABASE_ROUTE_CONFIG } from "@/database";
import bwipjs from "bwip-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toBuffer } from "qrcode";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

// For convenience, helper to convert inches to PDF points (72pt = 1in)
const inchesToPoints = (inches: number) => Math.floor(inches * 72);

export async function GET(
  req: Request,
  { params: { "drum-id": drumId } }: { params: { "drum-id": string } }
) {
  try {
    if (!drumId) {
      console.error("Missing drum_id");
      return NextResponse.json({ error: "Missing drum_id" }, { status: 400 });
    }

    return await withDatabase(async (db) => {
      // Fetch the drum with its related order information
      const drum = await db.new_drums.findUnique({
        where: {
          drum_id: Number(drumId),
        },
        include: {
          orders: true,
        },
      });

      if (!drum) {
        return NextResponse.json(
          { error: `Drum with ID ${drumId} not found` },
          { status: 404 }
        );
      }

      // Extract the necessary data for the label
      const { material, supplier } = drum.orders || {
        material: drum.material,
        supplier: "Unknown",
      };

      // Attempt to find the material code, but handle case where material doesn't exist
      let materialCode = material.slice(0, 3);
      try {
        const materialRecord = await db.raw_materials.findFirst({
          where: {
            material_name: material,
          },
          select: {
            material_code: true,
          },
        });

        // Only assign materialCode if the record was found
        if (materialRecord && materialRecord.material_code) {
          materialCode = materialRecord.material_code;
        }
      } catch (error) {
        console.error(
          `Error: no database record exists for material "${material}"`,
          error
        );
        // Continue execution with default materialCode
      }

      // Create QR code for the drum info URL
      const qrCodeUrl = `http://localhost/drums/info/${drum.drum_id}`;
      const qrCodeBuffer = await toBuffer(qrCodeUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 150,
      });

      // Generate the barcode using material code if available
      const barcodeText = `${materialCode}-${drum.drum_id}`;
      const barcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: barcodeText,
        scale: 4,
        height: 40,
        includetext: true,
        textxalign: "center",
        textyalign: "below",
        textyoffset: 15,
        textsize: 18,
        textfont: "Helvetica",
        textgaps: 1,
      });

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Create page (80mm x 200mm)
      const page = pdfDoc.addPage([inchesToPoints(7.75), inchesToPoints(3.15)]);

      // Embed images
      const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
      const barcodeImage = await pdfDoc.embedPng(new Uint8Array(barcodeBuffer));

      // Draw header section - using lines instead of rectangle for borders
      // Draw bottom border
      page.drawLine({
        start: { x: 0, y: page.getHeight() - 35 },
        end: { x: page.getWidth() - 60, y: page.getHeight() - 35 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Draw right border
      page.drawLine({
        start: { x: page.getWidth() - 60, y: page.getHeight() },
        end: { x: page.getWidth() - 60, y: page.getHeight() - 35 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Draw company name (smaller and positioned higher)
      page.drawText("RATHBURN CHEMICALS", {
        x: 10,
        y: page.getHeight() - 25,
        size: 14,
        font: helveticaBold,
      });

      // Draw large material text in header section
      page.drawText(material.toUpperCase(), {
        x: page.getWidth() * (3 / 5),
        y: page.getHeight() - 25,
        size: 14,
        font: helveticaBold,
      });

      // Draw QR code in top right with adjusted text position
      page.drawImage(qrImage, {
        x: page.getWidth() - 90,
        y: page.getHeight() - 80,
        width: 60,
        height: 60,
      });

      // Draw "Drum Info" text centered under QR code
      const drumInfoText = "Drum Info";
      const drumInfoWidth = helvetica.widthOfTextAtSize(drumInfoText, 12);
      page.drawText(drumInfoText, {
        x: page.getWidth() - 90 + (60 - drumInfoWidth) / 2, // Center under QR code
        y: page.getHeight() - 95,
        size: 12,
        font: helvetica,
      });

      // Draw left side information
      const leftColumnX = 20;
      let currentY = page.getHeight() - 70;
      const lineSpacing = 20; // Increased spacing

      // Draw left column labels and values
      const leftColumnData = [
        { label: "Mfg :", value: supplier },
        { label: "PO No. :", value: drum.orders?.po_number || "N/A" },
        { label: "Product :", value: `${material}` },
        { label: "Date :", value: new Date().toLocaleDateString() },
      ];

      leftColumnData.forEach(({ label, value }) => {
        page.drawText(label, {
          x: leftColumnX,
          y: currentY,
          size: 12,
          font: helvetica,
        });
        page.drawText(value, {
          x: leftColumnX + 80,
          y: currentY,
          size: 12,
          font: helveticaBold,
        });
        currentY -= lineSpacing;
      });

      // Draw additional information (Unit, Weight, Volume) to the right
      const rightColumnX = page.getWidth() * (3 / 5); // Position right of center
      currentY = page.getHeight() - 70; // Same starting height as left column

      const additionalInfo = [
        { label: "Unit :", value: "1/80" },
        { label: "Wt :", value: "158 KG" },
        { label: "Vol :", value: "199.5 LT" },
      ];

      additionalInfo.forEach(({ label, value }) => {
        page.drawText(label, {
          x: rightColumnX,
          y: currentY,
          size: 12,
          font: helvetica,
        });
        page.drawText(value, {
          x: rightColumnX + 60,
          y: currentY,
          size: 12,
          font: helveticaBold,
        });
        currentY -= lineSpacing;
      });

      // Draw barcode at the bottom with more padding
      const { width: barcodeWidth } = barcodeImage.scale(1);
      const barcodeY = 15; // Move closer to bottom edge

      page.drawImage(barcodeImage, {
        x: (page.getWidth() - barcodeWidth) / 2,
        y: barcodeY,
        width: barcodeWidth,
        height: 75, // Taller rendering height
      });

      // Finalize PDF
      const pdfBytes = await pdfDoc.save();

      // Return PDF response
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="drum-${drum.drum_id}-label.pdf"`,
        },
      });
    });
  } catch (error) {
    console.error("Error generating label:", error);
    return NextResponse.json(
      { error: "Failed to generate label" },
      { status: 500 }
    );
  }
}
