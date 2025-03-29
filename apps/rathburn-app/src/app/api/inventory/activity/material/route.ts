import { NextResponse } from "next/server";
import { getDb, DATABASE_ROUTE_CONFIG } from "@/database";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const material = searchParams.get("material"); // Extract material from query parameters

  if (!material) {
    return NextResponse.json(
      { error: "Material parameter is required" },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const transactions = await db.transactions.findMany({
      where: {
        material: {
          contains: material,
          mode: "insensitive",
        },
      },
      orderBy: {
        tx_date: "desc",
      },
      take: 100, // Limit to 100 most recent transactions
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
