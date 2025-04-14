import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { selectFromTable } from "@/lib/database";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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

    // Find the supplier by ID
    const supplierRecord = await selectFromTable("ref_suppliers", {
      filters: {
        supplier_id: Number(supplierId),
      },
    });

    if (!supplierRecord) {
      throw new Error(`Supplier with ID "${supplierId}" not found`);
    }

    // Return the supplier record
    return NextResponse.json(supplierRecord, {
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
