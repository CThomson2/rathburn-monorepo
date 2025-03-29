import { getDb, DATABASE_ROUTE_CONFIG } from "@/database";
import { NextResponse } from "next/server";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

export async function GET() {
  try {
    const db = getDb();
    const recentDeliveries = await db.deliveries.findMany({
      orderBy: { date_received: "desc" },
      take: 3,
      select: {
        delivery_id: true,
        date_received: true,
        // ... any other fields to display
      },
    });
    return NextResponse.json(recentDeliveries);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
