import { NextResponse } from "next/server";
import { getDb, DATABASE_ROUTE_CONFIG } from "@/database";
import type { ProductTableRow } from "@/types/models";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

export async function GET(req: Request) {
  try {
    const db = getDb();
    const products = await db.products.findMany({
      select: {
        product_id: true,
        name: true,
        sku: true,
        grade: true,
        raw_materials: {
          select: {
            cas_number: true,
          },
        },
      },
    });

    return NextResponse.json(
      products.map((product: any) => {
        const { raw_materials, ...rest } = product;
        return {
          ...rest,
          cas_number: raw_materials?.cas_number ?? "",
        };
      })
    );
  } catch (error: any) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { message: "Failed to fetch products", error: error.message },
      { status: 500 }
    );
  }
}
