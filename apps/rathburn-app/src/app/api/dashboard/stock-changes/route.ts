import { NextResponse } from "next/server";
import { getDb, DATABASE_ROUTE_CONFIG } from "@/database";
import { DailyChange } from "@/features/dashboard/types/api";

/**
 * Stock Changes queries
 * /api/dashboard/stock-changes
 * This endpoint returns the stock changes for the past 2 weeks (weekdays only)
 * It returns the net change for each day, and the total stock at the end of each day.
 */
export async function GET() {
  try {
    console.log("[API] Fetching weekly stock changes...");
    const db = getDb();

    const weeklyStockChanges = await db.$queryRaw<DailyChange[]>`
      WITH RECURSIVE DateSeries AS (
        -- Generate dates for last 10 weekdays
        SELECT 
          CURRENT_DATE - INTERVAL '14 days' + (n || ' days')::INTERVAL AS date
        FROM generate_series(0, 14) n
        WHERE EXTRACT(DOW FROM CURRENT_DATE - INTERVAL '14 days' + (n || ' days')::INTERVAL) NOT IN (0, 6)
        LIMIT 10
      ),
      DailyChanges AS (
        SELECT 
          DATE(tx_date) as date,
          COUNT(*) as change_count,
          tx_type
        FROM inventory.transactions
        WHERE 
          tx_date >= CURRENT_DATE - INTERVAL '14 days'
          AND tx_type IN ('intake', 'processed')
        GROUP BY DATE(tx_date), tx_type
      )
      SELECT 
        to_char(ds.date, 'Dy') as day,
        COALESCE(
          SUM(
            CASE 
              WHEN dc.tx_type = 'intake' THEN dc.change_count 
              WHEN dc.tx_type = 'processed' THEN -dc.change_count
              ELSE 0 
            END
          ),
          0
        )::integer as "netChange"
      FROM DateSeries ds
      LEFT JOIN DailyChanges dc ON ds.date = dc.date
      GROUP BY ds.date, to_char(ds.date, 'Dy')
      ORDER BY ds.date ASC
    `;

    console.log("[API] Weekly stock changes data:", weeklyStockChanges);

    // Ensure we have the correct data structure
    const formattedData = weeklyStockChanges.map((change: DailyChange) => ({
      day: change.day,
      netChange: Number(change.netChange),
    }));

    console.log("[API] Formatted data:", formattedData);

    return NextResponse.json({ weeklyStockChanges: formattedData });
  } catch (error) {
    console.error("[API] Error fetching stock changes:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock changes" },
      { status: 500 }
    );
  }
}
