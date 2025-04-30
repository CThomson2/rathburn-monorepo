import { NextResponse } from "next/server";
import {
  fetchDrumLabelData,
  markDrumLabelsAsPrinted,
} from "@/app/actions/label-generation";
import bwipjs from "bwip-js";
import { toBuffer } from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
// For convenience, helper to convert inches to PDF points (72pt = 1in)
import { inchesToPoints } from "@/lib/utils";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const margin = 15; // 15 points margin (about 0.2 inches)

export async function GET(
  req: Request,
  { params: { "pol-id": polId } }: { params: { "pol-id": string } }
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
    // const firstUnitNumber = Math.min(
    //   ...drumLabels.map((label) => parseInt(label.serialNumber
    //     .slice(label.serialNumber.indexOf("-") + 1)
    //   ))
    // );

    if (!drumLabels || drumLabels.length === 0) {
      return NextResponse.json(
        { error: "No drum labels found for this purchase order line" },
        { status: 404 }
      );
    }

    // Generate a QR code for the purchase order line endpoint (using polId)
    const qrCodeUrl =
      process.env.NODE_ENV === "development"
        ? `http://localhost/api/barcodes/drum-labels/${polId}`
        : `https://${process.env.NEXT_PUBLIC_API_URL}/barcodes/drum-labels/${polId}`;
    const qrCodeBuffer = await toBuffer(qrCodeUrl, {
      errorCorrectionLevel: "M",
      margin: 0,
      width: 150,
    });

    // Create a PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Load header logo and QR frame images for layout
    let logoImage, qrFrameImage;
    try {
      const path = require("path");
      const logoPath = path.join(
        process.cwd(),
        "src",
        "assets",
        "label",
        "label-header.png"
      );
      const qrFramePath = path.join(
        process.cwd(),
        "src",
        "assets",
        "label",
        "label-qr-frame.png"
      );
      logoImage = await pdfDoc.embedPng(fs.readFileSync(logoPath));
      qrFrameImage = await pdfDoc.embedPng(fs.readFileSync(qrFramePath));
    } catch {}

    // Dimensions for 6" x 4" label (landscape)
    const PAGE_WIDTH = inchesToPoints(7.75);
    const PAGE_HEIGHT = inchesToPoints(3.15);

    // Iterate over each drum label record to build pages
    const totalUnits = drumLabels.length;
    for (let [i, drum] of drumLabels.entries()) {
      const unitNumber = i + 1;

      // Create new page
      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      // Draw header logo or fallback text
      if (logoImage) {
        const dims = logoImage.scale(1);
        const logoW = 140;
        const logoH = logoW * (dims.height / dims.width);
        page.drawImage(logoImage, {
          x: 10,
          y: PAGE_HEIGHT - (30 + margin),
          width: logoW,
          height: logoH,
        });
      } else {
        page.drawText("RATHBURN CHEMICALS", {
          x: 10,
          y: PAGE_HEIGHT - (35 + margin),
          size: 14,
          font: boldFont,
        });
      }

      // Horizontal rule under header
      page.drawLine({
        start: { x: 0, y: PAGE_HEIGHT - (35 + margin) },
        end: { x: PAGE_WIDTH, y: PAGE_HEIGHT - (35 + margin) },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Timestamp in top-right (date and time)
      const now = new Date();
      const dateStr = `Printed on ${now.toLocaleDateString()}`;
      const clockStr = now.toTimeString().substring(0, 8); // HH:MM:SS
      // Draw date line
      const dateW = font.widthOfTextAtSize(dateStr, 8);
      page.drawText(dateStr, {
        x: PAGE_WIDTH - dateW - 10,
        y: PAGE_HEIGHT - (15 + margin),
        size: 8,
        font,
      });
      // Draw time line below date
      const clockW = font.widthOfTextAtSize(clockStr, 8);
      page.drawText(clockStr, {
        x: PAGE_WIDTH - clockW - 10,
        y: PAGE_HEIGHT - (25 + margin),
        size: 8,
        font,
      });

      // Material text centered below header
      const materialText = drum.materialName.toUpperCase();
      page.drawText(materialText, {
        x: PAGE_WIDTH / 2 - font.widthOfTextAtSize(materialText, 14) / 2,
        y: PAGE_HEIGHT - (25 + margin),
        size: 14,
        font: boldFont,
      });

      // QR frame + code
      const qrX = PAGE_WIDTH - 110;
      const qrY = PAGE_HEIGHT - (180 + margin);
      const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
      if (qrFrameImage) {
        const frameDim = qrFrameImage.scale(1);
        const fW = 100;
        const fH = fW * (frameDim.height / frameDim.width);
        page.drawImage(qrFrameImage, { x: qrX, y: qrY, width: fW, height: fH });
        const qW = fW * 0.7;
        const qH = qW;
        const offX = (fW - qW) / 2;
        const offY = (fH - qH) * 0.8;
        page.drawImage(qrImage, {
          x: qrX + offX,
          y: qrY + offY,
          width: qW,
          height: qH,
        });
      } else {
        page.drawImage(qrImage, { x: qrX, y: qrY, width: 80, height: 80 });
      }

      // Left column info
      let yPos = PAGE_HEIGHT - (70 + margin);
      const leftData = [
        { label: "Mfg. :", value: drum.supplierName },
        // Format date as DD-MM-YYYY
        {
          label: "Date :",
          value: `${new Date().getDate().toString().padStart(2, "0")}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${new Date().getFullYear()}`,
        },
      ];
      leftData.forEach(({ label, value }) => {
        page.drawText(label, { x: 20, y: yPos, size: 12, font });
        page.drawText(value, { x: 100, y: yPos, size: 12, font: boldFont });
        yPos -= 20;
      });

      // Right column info
      yPos = PAGE_HEIGHT - (70 + margin);
      const rightData = [
        { label: "Unit :", value: `${unitNumber}/${totalUnits}` },
      ];
      rightData.forEach(({ label, value }) => {
        page.drawText(label, { x: PAGE_WIDTH / 2, y: yPos, size: 12, font });
        page.drawText(value, {
          x: PAGE_WIDTH / 2 + 60,
          y: yPos,
          size: 12,
          font: boldFont,
        });
        yPos -= 20;
      });

      // Generate and draw code128 barcode at bottom center
      // Moved up from previous position and removed border
      const barcodeBuf = await bwipjs.toBuffer({
        bcid: "code128",
        text: drum.serialNumber,
        includetext: false, // Don't include text in the barcode itself
        scale: 3,
        height: 15,
      });
      
      const barcodeImg = await pdfDoc.embedPng(new Uint8Array(barcodeBuf));
      const bDim = barcodeImg.scale(1);
      const bW = Math.min(PAGE_WIDTH * 0.6, bDim.width);
      const bH = 50;
      const bX = (PAGE_WIDTH - bW) / 2; // Center horizontally
      const bY = 40; // Moved up from 20 to 40
      
      // Draw the barcode without border
      page.drawImage(barcodeImg, { x: bX, y: bY, width: bW, height: bH });
      
      // Draw the serial number text clearly below the barcode
      const serialText = drum.serialNumber;
      const serialTextWidth = boldFont.widthOfTextAtSize(serialText, 14);
      page.drawText(serialText, {
        x: (PAGE_WIDTH - serialTextWidth) / 2, // Center the text
        y: bY - 20, // Position below the barcode
        size: 14,
        font: boldFont,
      });
      
      // Draw unit info to the right
      page.drawText(`Unit ${unitNumber}/${totalUnits}`, {
        x: PAGE_WIDTH - 100,
        y: bY - 20,
        size: 9,
        font,
      });
    }

    // Serialize and save PDF as before
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
      filePath: urlPath,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error generating barcodes" },
      { status: 500 }
    );
  }
}
