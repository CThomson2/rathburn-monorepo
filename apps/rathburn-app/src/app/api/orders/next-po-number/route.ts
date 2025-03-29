import { NextResponse } from "next/server";
import { getDb, DATABASE_ROUTE_CONFIG } from "@/database";
import { format } from "date-fns";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

export async function GET() {
  try {
    // Get today's date in YYYY-MM-DD format for database query
    const db = getDb();
    const today = new Date();
    const todayFormatted = format(today, "yyyy-MM-dd");

    // Count orders made today
    const todayOrdersCount = await db.orders.count({
      where: {
        date_ordered: {
          gte: new Date(todayFormatted),
          lt: new Date(
            new Date(todayFormatted).getTime() + 24 * 60 * 60 * 1000
          ),
        },
      },
    });

    // Convert count to letter (A, B, C)
    const letterMap = ["A", "B", "C", "D", "E"];
    const orderLetter = letterMap[todayOrdersCount] || "X";

    // Generate PO number in format YY-MM-DD-A-RS
    const poNumber = `${format(today, "dd-MM-yy")}-${orderLetter}-RS`;

    return NextResponse.json({ poNumber });
  } catch (error) {
    console.error("Failed to generate PO number:", error);
    return NextResponse.json(
      { error: "Failed to generate PO number" },
      { status: 500 }
    );
  }
}
