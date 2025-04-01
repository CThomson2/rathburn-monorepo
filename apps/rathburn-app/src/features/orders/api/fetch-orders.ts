import { OrdersResponse } from "@/types/models";

/**
 * Fetches orders data from the API with pagination
 *
 * @param page - The page number to fetch (1-indexed)
 * @param limit - The number of items per page
 * @returns Promise with the orders response data
 */
export async function fetchOrders(
  page: number,
  limit: number
): Promise<OrdersResponse> {
  // Use absolute URL with window.location.origin
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${baseUrl}/api/orders?page=${page}&limit=${limit}`;

  console.log(`[Client] Fetching orders from: ${url}`);

  try {
    const response = await fetch(url, {
      // Add cache control headers to prevent caching issues
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Client] Error response: ${response.status} ${errorText}`);
      throw new Error(
        `Failed to fetch orders: ${response.status} ${errorText.substring(
          0,
          100
        )}`
      );
    }

    const data = await response.json();
    console.log(
      `[Client] Successfully fetched ${data.orders?.length || 0} orders`
    );
    return data;
  } catch (error) {
    console.error("[Client] Error in fetchOrders:", error);
    throw error;
  }
}
