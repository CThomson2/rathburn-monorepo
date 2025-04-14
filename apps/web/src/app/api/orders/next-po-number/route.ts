import { NextResponse } from "next/server";
import { format } from "date-fns";
import { executeDbOperation } from "@/lib/database";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    return executeDbOperation(async (client) => {
      // Get today's date in YYYY-MM-DD format for database query
      const today = new Date();
      const todayFormatted = format(today, "yyyy-MM-dd");
      
      // Query orders made today
      const startOfDay = `${todayFormatted}T00:00:00.000Z`;
      const endOfDay = `${todayFormatted}T23:59:59.999Z`;
      
      const { count, error } = await client
        .from('stock_order')
        .select('*', { count: 'exact', head: true })
        .gte('date_ordered', startOfDay)
        .lte('date_ordered', endOfDay);
      
      if (error) {
        throw error;
      }
      
      // Use count to determine letter (A, B, C)
      const todayOrdersCount = count || 0;
      const letterMap = ["A", "B", "C", "D", "E"];
      const orderLetter = letterMap[todayOrdersCount] || "X";
      
      // Generate PO number in format YY-MM-DD-A-RS
      const poNumber = `${format(today, "dd-MM-yy")}-${orderLetter}-RS`;
      
      return NextResponse.json({ poNumber });
    });
  } catch (error) {
    console.error("Failed to generate PO number:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate PO number",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
