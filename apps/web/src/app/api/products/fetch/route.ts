import { NextResponse } from "next/server";

import type { ProductTableRow } from "@/types/models";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
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
