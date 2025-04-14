/**
 * API Route Handler for updating order fields
 *
 * This endpoint allows updating any permitted fields of an order using
 * the new flexible CRUD pattern.
 *
 * @route PATCH /api/orders/update
 *
 * @param request - The incoming HTTP request
 * @returns NextResponse with the updated order
 */
import { NextResponse } from "next/server";
import { ordersCrud } from "@/database/models/orders/crud";
import { DATABASE_ROUTE_CONFIG } from "@/lib/prisma-client";
import { formatDates } from "@/utils/formatters/data";

// Force dynamic rendering for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function PATCH(request: Request) {
  try {
    // Parse request body
    const { id, data } = await request.json();

    // Validate input
    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Invalid update data" },
        { status: 400 }
      );
    }

    // Use our CRUD operations to update the order
    const updatedOrder = await ordersCrud.update(id, data);

    // Format dates for client display
    const formattedOrder = formatDates(updatedOrder, [
      "created_at",
      "updated_at",
      "date_ordered",
      "eta_start",
      "eta_end",
    ]);

    return NextResponse.json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
