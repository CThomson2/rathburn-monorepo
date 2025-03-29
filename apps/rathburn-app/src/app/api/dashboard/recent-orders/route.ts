import { NextRequest } from "next/server";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";
import { queries } from "@/database/models/orders";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/recent
 * Fetches recent orders with optional search filtering
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  try {
    // Parse search query parameter
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("q") || "";

    // Fetch recent orders
    const result = await queries.getOrders({
      page: 1,
      limit: 5,
      sortField: "date_ordered",
      sortOrder: "desc",
      // Only pass search terms if they exist
      ...(searchQuery ? { search: searchQuery } : {}),
    });

    return apiSuccess({
      orders: result.orders,
      total: result.total,
    });
  } catch (error) {
    console.error("API error:", error);
    return apiError(error instanceof Error ? error : "Unknown error occurred");
  }
});
