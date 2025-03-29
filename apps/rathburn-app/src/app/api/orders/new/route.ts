import { NextResponse } from "next/server";
import { withDatabase, DATABASE_ROUTE_CONFIG } from "@/database";
import { PrismaClientKnownRequestError } from "@prisma-client/runtime/library";

/**
 * POST handler for creating a new order
 *
 * @param req - The incoming request
 * @returns JSON response with the created order or error
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { material, supplier, quantity, po_number = null } = body;

    console.log(
      `[API] Creating new order: ${material} from ${supplier}, quantity: ${quantity}`
    );

    // Use withDatabase to create a new order
    const newOrder = await withDatabase(async (db) => {
      return db.orders.create({
        data: {
          supplier,
          material,
          quantity,
          po_number, // Only include po_number if it exists
        },
      });
    });

    console.log(
      `[API] Successfully created order with ID: ${newOrder.order_id}`
    );

    // Return the combined data in JSON
    return NextResponse.json(
      {
        success: true,
        order: newOrder, // the order data
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Error creating order:", error);

    if (error instanceof PrismaClientKnownRequestError) {
      // PostgreSQL error messages are in error.message
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
