import { NextResponse } from "next/server";
import { getDb, DATABASE_ROUTE_CONFIG } from "@/database";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

// Define interfaces for the database results
interface SupplierResult {
  supplier: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const material = searchParams.get("material");

  try {
    const db = getDb();
    let suggestions: string[] = [];

    // If material is provided, get historical suppliers for this material
    if (material) {
      const historicalSuppliers = await db.orders.findMany({
        where: {
          material: {
            equals: material,
            mode: "insensitive",
          },
        },
        select: {
          supplier: true,
        },
        distinct: ["supplier"],
      });

      suggestions = historicalSuppliers.map((s: SupplierResult) => s.supplier);

      // If user is typing, filter existing suggestions and add new matches
      if (query) {
        const additionalSuppliers = await db.suppliers.findMany({
          where: {
            supplier_name: {
              startsWith: query,
              mode: "insensitive",
            },
            // Exclude suppliers we already have
            NOT: {
              supplier_name: {
                in: suggestions,
              },
            },
          },
          select: {
            supplier_name: true,
          },
          take: 10,
        });

        // Combine and sort results
        suggestions = [
          ...suggestions.filter((s: string) =>
            s.toLowerCase().startsWith(query.toLowerCase())
          ),
          ...additionalSuppliers.map(
            (s: { supplier_name: string }) => s.supplier_name
          ),
        ];
      }
    }
    // If no material is provided, just search suppliers by query
    else if (query) {
      const suppliers = await db.suppliers.findMany({
        where: {
          supplier_name: {
            startsWith: query,
            mode: "insensitive",
          },
        },
        select: {
          supplier_name: true,
        },
        take: 10,
      });

      suggestions = suppliers.map(
        (s: { supplier_name: string }) => s.supplier_name
      );
    }

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error("Error fetching supplier suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
