import { NextResponse } from "next/server";
import { withDatabase, DATABASE_ROUTE_CONFIG } from "@/database";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import bwipjs from "bwip-js";
import { toBuffer } from "qrcode";
import fs from "fs";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

// For convenience, helper to convert inches to PDF points (72pt = 1in)
const inchesToPoints = (inches: number) => Math.floor(inches * 72);

// Global margin offset to prevent content from being cut off during printing
const margin = 15; // 15 points margin (about 0.2 inches)

export async function GET(
  req: Request,
  {
    params: { "order-detail-id": detailId },
  }: { params: { "order-detail-id": string } }
) {
  try {
    if (!detailId || typeof detailId !== "string") {
      console.error("Missing order_detail_id");
      return NextResponse.json(
        { error: "Missing or invalid order_detail_id" },
        { status: 400 }
      );
    }

    return await withDatabase(async (db) => {
      // 0. First find the order detail record using the detailId from URL param
      const orderDetails = await db.stock_order_details.findUnique({
        where: {
          detail_id: Number(detailId),
        },
      });

      if (!orderDetails) {
        return NextResponse.json(
          { error: `Order detail with ID ${detailId} not found` },
          { status: 404 }
        );
      }

      // 1. Now find the stock order using the order_id from the order detail
      const stockOrder = await db.stock_orders.findUnique({
        where: {
          order_id: orderDetails.order_id,
        },
        select: {
          order_id: true,
          po_number: true,
          date_ordered: true,
        },
      });

      if (!stockOrder) {
        return NextResponse.json(
          { error: `Stock order not found for detail ${detailId}` },
          { status: 404 }
        );
      }

      const material = await db.raw_materials.findUnique({
        where: { material_id: orderDetails.material_id },
        select: {
          material_id: true,
          material_name: true,
          material_code: true,
        },
      });

      // 1. Fetch drum records for this order detail
      const drums = await db.stock_drums.findMany({
        where: { order_detail_id: Number(detailId) },
      });

      if (!drums.length) {
        return NextResponse.json(
          { error: "No drums found for this order" },
          { status: 404 }
        );
      }

      // Create QR code for the drum info URL
      const qrCodeUrl = `http://localhost/drums/info/${drums[0].drum_id}`;
      const qrCodeBuffer = await toBuffer(qrCodeUrl, {
        errorCorrectionLevel: "M",
        margin: 0, // Reduce margin to fit better inside frame
        width: 150,
      });

      // 2. Create a new PDF document.
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Read and embed the header logo and QR frame images
      let logoImage, qrFrameImage;
      try {
        // Use path.join for proper path resolution
        const path = require("path");
        const logoPath = path.join(
          process.cwd(),
          "public",
          "label",
          "label-header.png"
        );
        const qrFramePath = path.join(
          process.cwd(),
          "public",
          "label",
          "label-qr-frame.png"
        );

        console.log("Loading logo from:", logoPath);
        console.log("Loading QR frame from:", qrFramePath);

        // Use fs.readFileSync with proper path
        const logoBytes = fs.readFileSync(logoPath);
        logoImage = await pdfDoc.embedPng(logoBytes);

        const qrFrameBytes = fs.readFileSync(qrFramePath);
        qrFrameImage = await pdfDoc.embedPng(qrFrameBytes);

        console.log("Successfully loaded label images");
      } catch (error) {
        console.error("Error loading label images:", error);
        // Continue without images if they can't be loaded
      }

      // 3. Process each drum to generate a barcode and add a PDF page.
      // Calculate total number of drums for the x/N labeling
      const totalDrums = drums.length;

      // Loop through each drum and create a PDF page for it
      for (let drumIndex = 0; drumIndex < drums.length; drumIndex++) {
        const drum = drums[drumIndex];
        // Current unit number (1-based index)
        const currentUnitNumber = drumIndex + 1;

        // Generate barcode image using bwip-js.
        // The barcode text can be drum.drum_id or any other string.
        const barcodeText = material?.material_code
          ? `${material.material_code}-${drum.drum_id}`
          : `${drum.drum_id}`;
        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: "code128", // Barcode type: Code128
          text: barcodeText, // Adjust to your drum identifier field
          scale: 2.5, // Increased scale for better resolution
          height: 12, // Increased height to make bars taller
          includetext: true, // Include human-readable text
          textsize: 12, // Larger text size for better readability
          textxalign: "center", // Center align the text
          textyoffset: 2, // Add space between barcode and text
          textfont: "Helvetica", // Consistent font
          backgroundcolor: "FFFFFF", // White background
        });

        // Create a page for the label (adjust dimensions to your label format; e.g., 4x6 inches in points)
        const pageWidth = 7.75; // 4 inches * 72 points/inch
        const pageHeight = 3.15; // 6 inches * 72 points/inch
        const page = pdfDoc.addPage([
          inchesToPoints(pageWidth),
          inchesToPoints(pageHeight),
        ]);

        // Embed images
        let qrImage;
        try {
          qrImage = await pdfDoc.embedPng(qrCodeBuffer);
        } catch (error) {
          console.error("Error embedding QR code image:", error);
        }

        let barcodeImage;
        try {
          barcodeImage = await pdfDoc.embedPng(new Uint8Array(barcodeBuffer));
        } catch (error) {
          console.error("Error embedding barcode image:", error);
        }

        // Calculate dimensions for barcode placement while preserving aspect ratio
        if (barcodeImage) {
          const barcodeDims = barcodeImage.scale(1);
          const barcodeAspectRatio = barcodeDims.width / barcodeDims.height;

          // Set desired width and calculate height to preserve aspect ratio
          const barcodeWidth = Math.min(
            page.getWidth() * 0.6,
            barcodeDims.width
          ); // No wider than 80% of page width
          const barcodeHeight = 75;

          // Position barcode in the center of the page, below the header
          const barcodeX = (page.getWidth() - barcodeWidth) / 2; // Center horizontally
          const barcodeY = pageHeight * 0.35 + margin; // Position higher on the page and offset up by margin

          // Draw the barcode image on the page with correct aspect ratio
          page.drawImage(barcodeImage, {
            x: barcodeX,
            y: barcodeY,
            width: barcodeWidth,
            height: barcodeHeight,
          });
        }

        // Add additional label text (e.g., supplier, material, etc.).
        const supplierName = "Rathburn Chemicals Ltd";

        // Draw header section - using lines instead of rectangle for borders
        // Draw right border
        // page.drawLine({
        //   start: { x: page.getWidth() - 60, y: page.getHeight() },
        //   end: { x: page.getWidth() - 60, y: page.getHeight() - 35 },
        //   thickness: 1,
        //   color: rgb(0, 0, 0),
        // });

        // Draw company name (smaller and positioned higher)
        if (logoImage) {
          // Calculate dimensions to preserve aspect ratio
          const logoDims = logoImage.scale(1);
          const logoAspectRatio = logoDims.width / logoDims.height;
          const logoWidth = 140;
          const logoHeight = logoWidth / logoAspectRatio;

          page.drawImage(logoImage, {
            x: 10,
            y: page.getHeight() - (40 + margin), // Offset down by margin
            width: logoWidth,
            height: logoHeight,
          });
        } else {
          // Fallback to text if image is unavailable
          page.drawText("RATHBURN CHEMICALS", {
            x: 10,
            y: page.getHeight() - (35 + margin), // Offset down by margin
            size: 14,
            font: fontBold,
          });
        }

        // Draw bottom border
        page.drawLine({
          start: { x: 0, y: page.getHeight() - (35 + margin) },
          end: { x: page.getWidth(), y: page.getHeight() - (35 + margin) },
          thickness: 1,
          color: rgb(0, 0, 0),
        });

        // Add timestamp in top right corner for development purposes
        const now = new Date();
        const timeStr = `Printed at ${now
          .getHours()
          .toString()
          .padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        const timeWidth = font.widthOfTextAtSize(timeStr, 8);
        page.drawText(timeStr, {
          x: page.getWidth() - timeWidth - 10,
          y: page.getHeight() - (15 + margin), // Offset down by margin
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Draw large material text in header section
        page.drawText(material?.material_name.toUpperCase() || "", {
          x: page.getWidth() / 2,
          y: page.getHeight() - (25 + margin), // Offset down by margin
          size: 14,
          font: fontBold,
        });

        // Position values for QR code and frame
        const qrX = page.getWidth() - 110;
        const qrY = page.getHeight() - (180 + margin); // Offset down by margin

        // First draw the QR frame (if available)
        if (qrFrameImage && qrImage) {
          // Calculate dimensions to preserve aspect ratio
          const frameDims = qrFrameImage.scale(1);
          const frameAspectRatio = frameDims.width / frameDims.height;
          const frameWidth = 100;
          const frameHeight = frameWidth / frameAspectRatio;

          // Draw frame first
          page.drawImage(qrFrameImage, {
            x: qrX,
            y: qrY,
            width: frameWidth,
            height: frameHeight,
          });

          // Calculate QR code size to fit inside frame
          // Use a proportion of the frame's dimensions to ensure it fits inside
          const qrCodeWidth = frameWidth * 0.7;
          const qrCodeHeight = qrCodeWidth;

          // Calculate position to center QR code in frame
          const qrOffsetX = (frameWidth - qrCodeWidth) / 2;
          const qrOffsetY = (frameHeight - qrCodeHeight) * 0.8;

          // Draw QR code on top of frame
          page.drawImage(qrImage, {
            x: qrX + qrOffsetX,
            y: qrY + qrOffsetY,
            width: qrCodeWidth,
            height: qrCodeHeight,
          });
        } else if (qrImage) {
          // Just draw the QR code without frame
          const qrCodeSize = 80;

          page.drawImage(qrImage, {
            x: qrX,
            y: qrY,
            width: qrCodeSize,
            height: qrCodeSize,
          });

          // Draw text manually since we don't have the frame which includes text
          const scanText = "SCAN QR CODE FOR";
          const historyText = "DRUM HISTORY";
          const scanTextWidth = font.widthOfTextAtSize(scanText, 8);
          const historyTextWidth = font.widthOfTextAtSize(historyText, 8);

          page.drawText(scanText, {
            x: qrX + (qrCodeSize - scanTextWidth) / 2,
            y: qrY - 15,
            size: 8,
            font: fontBold,
            color: rgb(0, 0, 0),
          });

          page.drawText(historyText, {
            x: qrX + (qrCodeSize - historyTextWidth) / 2,
            y: qrY - 25,
            size: 8,
            font: fontBold,
            color: rgb(0, 0, 0),
          });
        }

        // Draw left side information
        const leftColumnX = 20;
        let currentY = page.getHeight() - (70 + margin); // Offset down by margin
        const lineSpacing = 20;

        // Draw left column labels and values
        const leftColumnData = [
          { label: "Mfg :", value: "Rathburn Chemicals Ltd" },
          { label: "PO No. :", value: stockOrder?.po_number || "N/A" },
          { label: "Product :", value: material?.material_name || "N/A" },
          { label: "Date :", value: new Date().toLocaleDateString("en-GB") },
        ];

        leftColumnData.forEach(({ label, value }) => {
          page.drawText(label, {
            x: leftColumnX,
            y: currentY,
            size: 12,
            font: font,
          });
          page.drawText(value, {
            x: leftColumnX + 80,
            y: currentY,
            size: 12,
            font: fontBold,
          });
          currentY -= lineSpacing;
        });

        // Draw additional information (Unit, Weight, Volume) to the right
        const rightColumnX = page.getWidth() / 2;
        currentY = page.getHeight() - (70 + margin); // Offset down by margin

        const additionalInfo = [
          // Dynamic Unit value based on drum position and total drums
          { label: "Unit :", value: `${currentUnitNumber}/${totalDrums}` },
          { label: "Wt :", value: "161 KG" },
          // { label: "Vol :", value: "199.5 LT" },
        ];

        additionalInfo.forEach(({ label, value }) => {
          page.drawText(label, {
            x: rightColumnX,
            y: currentY,
            size: 12,
            font: font,
          });
          page.drawText(value, {
            x: rightColumnX + 60,
            y: currentY,
            size: 12,
            font: fontBold,
          });
          currentY -= lineSpacing;
        });

        //   page.drawText(`Supplier: ${supplierName}`, {
        //     x: 20,
        //     y: pageHeight - 40,
        //     size: 12,
        //     font,
        //     color: rgb(0, 0, 0),
        //   });

        //   page.drawText(`Material: ${materialName}`, {
        //     x: 20,
        //     y: pageHeight - 60,
        //     size: 12,
        //     font,
        //     color: rgb(0, 0, 0),
        //   });

        //   // Optionally add more details like drum ID, order reference, etc.
        //   page.drawText(`Drum ID: ${drum.drum_id}`, {
        //     x: 20,
        //     y: pageHeight - 80,
        //     size: 12,
        //     font,
        //     color: rgb(0, 0, 0),
        //   });
        // }
      }

      // Move the PDF serialization and return statement outside the for loop
      // so it happens after all pages have been added

      // 4. Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();

      // 5. Return the PDF directly with appropriate headers
      return new NextResponse(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=drums-${detailId}.pdf`,
        },
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
