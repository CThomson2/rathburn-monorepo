# Recent Orders

> /api/dashboard/recent-orders

```ts
import { NextResponse } from "next/server";
import { DATABASE_ROUTE_CONFIG, getDb } from "@/database";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

export async function POST() {
  try {
    const db = getDb();
    // Fetch data for the report
    const [recentTransactions, inventoryItems] = await Promise.all([
      db.transactions.findMany({
        take: 10,
        orderBy: { tx_date: "desc" },
      }),
      db.new_drums.count(),
    ]);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Write report content
    page.drawText("Dashboard Report", {
      x: 50,
      y: yPosition,
      size: 20,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // Add date
    page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // Add inventory summary
    page.drawText("Inventory Summary", {
      x: 50,
      y: yPosition,
      size: 16,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
    page.drawText(`Total Items: ${inventoryItems}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // Add recent transactions
    page.drawText("Recent Transactions", {
      x: 50,
      y: yPosition,
      size: 16,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    recentTransactions.forEach((tx: any) => {
      page.drawText(`ID: ${tx.tx_id}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
      page.drawText(`Material: ${tx.material}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
      page.drawText(`Type: ${tx.tx_type}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
      page.drawText(`Date: ${new Date(tx.tx_date).toLocaleDateString()}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
    });

    // Finalize PDF
    const pdfBytes = await pdfDoc.save();

    // Return PDF as response
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=dashboard-report-${
          new Date().toISOString().split("T")[0]
        }.pdf`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
```
