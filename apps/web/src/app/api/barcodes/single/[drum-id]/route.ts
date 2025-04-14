// /app/api/barcodes/[drum_id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import bwipjs from "bwip-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toBuffer } from "qrcode";
// For convenience, helper to convert inches to PDF points (72pt = 1in)
import { inchesToPoints } from "@/lib/utils";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
      const drum = await db.stock_drum.findUnique({
        where: {
          drum_id: Number(drumId),
        },
        include: {
          order_detail: {
            include: {
              stock_order: {
                include: {
                  ref_suppliers: true,
                },
              },
              ref_materials: true,
            },
          },
        },
      });

      if (!drum) {
        return NextResponse.json(
          { error: `Drum with ID ${drumId} not found` },
          { status: 404 }
        );
      }

      // Extract the necessary data for the label
      // In Prisma, joined tables are nested under their relation name
      const materialCode = drum.material_code;
      // Access the material name through the order_detail relation
      const materialName = drum.order_detail.ref_materials.value;

      // Access supplier through the nested relations
      const supplier =
        drum.order_detail.stock_order.ref_suppliers.supplier_name;

      // Attempt to find the material code, but handle case where material doesn't exist
      const materialRecord = await db.ref_materials.findFirst({
        where: {
          code: materialCode || "",
        },
        select: {
          value: true,
        },
      });

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
      page.drawText(materialName.toUpperCase(), {
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
        {
          label: "PO No. :",
          value: drum.order_detail.stock_order.po_number || "N/A",
        },
        { label: "Product :", value: `${materialName}` },
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
