import { NextResponse } from "next/server";
import { withDatabase, DATABASE_ROUTE_CONFIG } from "@/database";
import { MaterialStock } from "@/features/old-dashboard/types/api";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

/**
 * Current Stock queries
 * /api/dashboard/current-stock
 * This endpoint returns the current stock of materials.
 * It returns the total stock, and the materials with the highest and lowest stock.
 * It also returns the count of materials with the lowest stock.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lowCount = searchParams.get("low")
      ? parseInt(searchParams.get("low")!)
      : 5; // Default to 5 if not specified
    const highCount = searchParams.get("high")
      ? parseInt(searchParams.get("high")!)
      : 10; // Default to 10 if not specified

    // Use withDatabase to perform multiple related database operations
    const stockData = await withDatabase(async (db) => {
      const totalStock = await db.new_drums.count({
        where: {
          status: "available",
        },
      });

      // High stock materials
      const topMaterials = await db.$queryRaw<MaterialStock[]>`
        SELECT 
          material,
          COUNT(*) as count
        FROM inventory.new_drums
        WHERE status = 'available'
        GROUP BY material
        ORDER BY count DESC
        LIMIT ${highCount}
      `;

      // Low stock materials
      const lowStockMaterials = await db.$queryRaw<MaterialStock[]>`
        WITH MaterialCounts AS (
          SELECT 
            material,
            COUNT(*) as count
          FROM inventory.new_drums
          WHERE status = 'available'
          GROUP BY material
        )
        SELECT
          material,
          count
        FROM MaterialCounts
        WHERE count < ${lowCount}
        ORDER BY count ASC
      `;

      // Count of low stock materials
      const lowStockCountResult = await db.$queryRaw<{ count: number }[]>`
        WITH MaterialCounts AS (
          SELECT 
            material,
            COUNT(*) as count
          FROM inventory.new_drums
          WHERE status = 'available'
          GROUP BY material
        )
        SELECT
          COUNT(*) as count
        FROM MaterialCounts
        WHERE count < ${lowCount}
      `;

      const lowStockCount = Number(lowStockCountResult[0]?.count || 0);

      return {
        totalStock,
        lowStockCount,
        lowStockMaterials,
        topMaterials,
      };
    });

    return NextResponse.json({
      totalStock: stockData.totalStock,
      lowStockCount: stockData.lowStockCount,
      lowStockMaterials: stockData.lowStockMaterials.map(
        (material: MaterialStock) => ({
          material: material.material,
          count: Number(material.count),
        })
      ),
      topMaterials: stockData.topMaterials.map((material: MaterialStock) => ({
        material: material.material,
        count: Number(material.count),
      })),
    });
  } catch (error) {
    console.error("Error fetching inventory overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory overview" },
      { status: 500 }
    );
  }
}
