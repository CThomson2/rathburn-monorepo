import { NextResponse } from "next/server";
import { withDatabase, DATABASE_ROUTE_CONFIG } from "@/database";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

/**
 * GET handler for fetching a single supplier by ID
 *
 * @param req - The incoming request
 * @param params - The route parameters containing supplier-id
 * @returns JSON response with supplier data or error
 */
export async function GET(
  req: Request,
  { params }: { params: { "supplier-id": string } }
) {
  try {
    const supplierId = params["supplier-id"];

    // Validate the supplier ID
    if (!supplierId || isNaN(Number(supplierId))) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const result = await withDatabase(async (db) => {
      // Find the supplier by ID
      const supplierRecord = await db.suppliers.findUnique({
        where: {
          supplier_id: Number(supplierId),
        },
      });

      if (!supplierRecord) {
        throw new Error(`Supplier with ID "${supplierId}" not found`);
      }

      return supplierRecord;
    });

    // Return the supplier record
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error(`[API] Error fetching supplier:`, error);

    return NextResponse.json(
      {
        error: "Failed to fetch supplier",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 404 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
