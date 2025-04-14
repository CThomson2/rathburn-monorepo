// Mark this route as dynamic to handle request.url correctly
export const dynamic = "force-dynamic";

/**
 * Data source: Supabase
 *
 * PDF Label Configuration
 * The barcode label will be in exact same size and format as that used in the `api/barcodes/stock-drums/[order-detail-id]/route.ts` path
 *
 * Label Size: 7.75 x 3.15 inches (converted to points in code)
 * Margin: 15 points (about 0.2 inches) to prevent content from being cut off
 *
 * Barcode:
 * - Type: Code 128
 * - Position: Centered, at approximately 35% from bottom of page
 * - Size: 60% of page width, 75 points height
 * - Includes human-readable text
 *
 * QR Code:
 * - Position: Right side of label
 * - Size: 80 points (or 70% of frame width if using frame)
 * - Contains URL to drum info page
 *
 * Text Elements:
 * - Header: Company logo (140px width) or text at top
 * - Material name: Centered below header, 14pt bold
 * - Left column (from top, 20pt from left, 12pt font):
 *   - Manufacturer
 *   - PO Number
 *   - Product
 *   - Date
 * - Right column (from top, at page width/2, 12pt font):
 *   - Unit number (x/total)
 *   - Weight
 *
 * Images:
 * - Company logo: Top left
 * - QR frame: Around QR code on right side
 *
 * The PDF is generated with pdf-lib, barcodes with bwip-js, and QR codes with qrcode
 */

// Import required libraries
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import bwipjs from "bwip-js";
import { toBuffer } from "qrcode";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { Database, Tables } from "@/types/models/database.types";

// For convenience, helper to convert inches to PDF points (72pt = 1in)
const inchesToPoints = (inches: number) => Math.floor(inches * 72);

// Global margin offset to prevent content from being cut off during printing
const margin = 15; // 15 points margin (about 0.2 inches)

// Example cURL request:
// curl -X GET "http://localhost:3000/api/barcodes/initial-stock?material=Acetone&supplier=Caldic&site=new"

// Define an interface for the drum data
interface DrumData {
  old_id: number;
  material: string;
  material_code: string;
  batch_code: string;
  id: number;
  supplier: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  site: string;
  date_ordered: string | null;
  chemical_group: string | null;
}

export async function GET(req: Request) {
  try {
    // Get parameters from query
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const materialFilter = searchParams.get("material");
    const supplierFilter = searchParams.get("supplier");
    const siteFilter = searchParams.get("site");

    console.log("Creating Supabase client with SERVICE ROLE key to bypass RLS");

    // Create Supabase client with service role key instead of anon key
    // Review: imported supabase client from @/lib/supabase/server.ts
    // I had defined it here previously
    // const supabase = createClient();
    const supabase = createClient();

    console.log("Querying the 'drums' table using service role");

    // Build query with optional filters
    let query = supabase.from("drums").select("*");

    if (materialFilter) {
      query = query.eq("material", materialFilter);
    }

    if (supplierFilter) {
      query = query.eq("supplier", supplierFilter);
    }

    if (siteFilter) {
      query = query.eq("site", siteFilter);
    }

    // Execute query
    const { data, error } = await query;

    // Log results
    console.log("Query completed. Error:", error ? "Yes" : "No");
    console.log("Rows returned:", data ? data.length : 0);

    if (error) {
      console.error("Error details:", error);
      return NextResponse.json(
        { error: "Database query error: " + error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No drums found matching the criteria" },
        { status: 404 }
      );
    }

    // Log the first record for debugging
    if (data.length > 0) {
      console.log("First record sample:", data[0]);
    }

    const drums = data as DrumData[];

    // Track processed old_ids to avoid duplicates
    const processedOldIds = new Set();

    // Filter stock drum groups by material and supplier
    // Within these groups, all drums are effectively identical, in business terms
    // This allows for using any label from those generated for the group, for any drum in the group
    // And only at that point, fixing each drum to its specific ID
    const drumGroups: Record<string, DrumData[]> = {};

    // Filter out duplicates based on old_id
    const uniqueDrums = drums.filter((drum: DrumData) => {
      if (processedOldIds.has(drum.old_id)) {
        return false;
      }
      processedOldIds.add(drum.old_id);
      return true;
    });

    uniqueDrums.forEach((drum) => {
      // Create a compound key using material and supplier
      const groupKey = `${drum.material}-${drum.supplier || "Unknown"}`;

      if (!drumGroups[groupKey]) {
        drumGroups[groupKey] = [];
      }
      drumGroups[groupKey].push(drum);
    });

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Load images...

    // Process each group
    for (const [groupKey, drumsInGroup] of Object.entries(drumGroups)) {
      const totalDrumsInGroup = drumsInGroup.length;

      // Process each drum within the group
      for (let drumIndex = 0; drumIndex < totalDrumsInGroup; drumIndex++) {
        const drum = drumsInGroup[drumIndex];
        const currentUnitNumber = drumIndex + 1;

        // // TEMPORARY - START: Debug code for first 10 records
        // console.log(`Total unique drums found: ${uniqueDrums.length}`);
        // const limitedDrums = uniqueDrums.slice(0, 10);
        // console.log(`Processing only first 10 drums for testing`);

        // // Log each drum record for debugging
        // limitedDrums.forEach((drum: DrumData, index: number) => {
        //   console.log(`Drum ${index + 1}:`, {
        //     id: drum.id,
        //     old_id: drum.old_id,
        //     material: drum.material,
        //     batch_code: drum.batch_code,
        //     supplier: drum.supplier,
        //     site: drum.site,
        //     status: drum.status,
        //   });
        // });
        // // TEMPORARY - END: Debug code

        // Read and embed the header logo and QR frame images
        let logoImage, qrFrameImage;
        try {
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

          const logoBytes = fs.readFileSync(logoPath);
          logoImage = await pdfDoc.embedPng(logoBytes);

          const qrFrameBytes = fs.readFileSync(qrFramePath);
          qrFrameImage = await pdfDoc.embedPng(qrFrameBytes);
        } catch (error) {
          console.error("Error loading label images:", error);
          // Continue without images if they can't be loaded
        }

        // Generate QR code for the drum info URL
        const qrCodeUrl = `http://localhost/drums/info/${drum?.id}`;
        const qrCodeBuffer = await toBuffer(qrCodeUrl, {
          errorCorrectionLevel: "M",
          margin: 0,
          width: 150,
        });

        // Generate barcode
        const barcodeText = drum?.material_code
          ? `${drum?.material_code}-${drum?.old_id}`
          : `${drum?.old_id}`;

        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: "code128", // Barcode type: Code128
          text: barcodeText, // Adjust to your drum identifier field
          scale: 4, // Increased scale for better resolution (increased from 2)
          height: 10, // Increased height to make bars taller
          includetext: true, // Include human-readable text
          textsize: 12, // Larger text size for better readability (increased from 8)
          textxalign: "center", // Center align the text
          textyoffset: 2, // Add space between barcode and text
          textfont: "Helvetica", // Consistent font
          backgroundcolor: "FFFFFF", // White background
        });

        // Create a page for the label
        const pageWidth = 7.75;
        const pageHeight = 3.15;
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

        // Draw barcode
        if (barcodeImage) {
          const barcodeWidth = page.getWidth() * 0.6;
          const barcodeHeight = 75;
          // Move the barcode more to the left to avoid overlapping with QR code
          const barcodeX = (page.getWidth() - barcodeWidth) / 2 - 50; // Shifted left by 40 points
          const barcodeY = pageHeight * 0.35 + margin;

          page.drawImage(barcodeImage, {
            x: barcodeX,
            y: barcodeY,
            width: barcodeWidth,
            height: barcodeHeight,
          });
        }

        // Draw header
        if (logoImage) {
          const logoDims = logoImage.scale(1);
          const logoAspectRatio = logoDims.width / logoDims.height;
          const logoWidth = 140;
          const logoHeight = logoWidth / logoAspectRatio;

          page.drawImage(logoImage, {
            x: 10,
            y: page.getHeight() - (40 + margin),
            width: logoWidth,
            height: logoHeight,
          });
        } else {
          page.drawText("RATHBURN CHEMICALS", {
            x: 10,
            y: page.getHeight() - (35 + margin),
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

        // Add timestamp
        const now = new Date();
        const timeStr = `Printed at ${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        const timeWidth = font.widthOfTextAtSize(timeStr, 8);
        page.drawText(timeStr, {
          x: page.getWidth() - timeWidth - 10,
          y: page.getHeight() - (15 + margin),
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Draw material name
        page.drawText(drum?.material?.toUpperCase() || "", {
          x: page.getWidth() / 2,
          y: page.getHeight() - (25 + margin),
          size: 14,
          font: fontBold,
        });

        // Position QR code
        const qrX = page.getWidth() - 110;
        const qrY = page.getHeight() - (180 + margin);

        // Draw QR code and frame
        if (qrFrameImage && qrImage) {
          const frameDims = qrFrameImage.scale(1);
          const frameAspectRatio = frameDims.width / frameDims.height;
          const frameWidth = 100;
          const frameHeight = frameWidth / frameAspectRatio;

          page.drawImage(qrFrameImage, {
            x: qrX,
            y: qrY,
            width: frameWidth,
            height: frameHeight,
          });

          const qrCodeWidth = frameWidth * 0.7;
          const qrCodeHeight = qrCodeWidth;
          const qrOffsetX = (frameWidth - qrCodeWidth) / 2;
          const qrOffsetY = (frameHeight - qrCodeHeight) * 0.8;

          page.drawImage(qrImage, {
            x: qrX + qrOffsetX,
            y: qrY + qrOffsetY,
            width: qrCodeWidth,
            height: qrCodeHeight,
          });
        } else if (qrImage) {
          const qrCodeSize = 80;

          page.drawImage(qrImage, {
            x: qrX,
            y: qrY,
            width: qrCodeSize,
            height: qrCodeSize,
          });

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

        // Draw left column information
        const leftColumnX = 20;
        let currentY = page.getHeight() - (60 + margin);
        const lineSpacing = 20;

        const leftColumnData = [
          { label: "Mfg :", value: drum?.supplier || "N/A" },
          { label: "Batch :", value: drum?.batch_code || "N/A" },
          { label: "Product :", value: drum?.material || "N/A" },
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

        // Draw right column information
        const rightColumnX = page.getWidth() / 2;
        currentY = page.getHeight() - (60 + margin);

        // When drawing the unit information, use:
        const additionalInfo = [
          {
            label: "Unit :",
            value: `${currentUnitNumber}/${totalDrumsInGroup}`,
          },
          { label: "Site :", value: drum?.site || "N/A" },
          {
            label: "Date :",
            value: drum?.date_ordered || new Date().toLocaleDateString("en-GB"),
          },
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
      }
    }

    // Serialize the PDF and return
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=initial-stock-drums.pdf",
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
