# Inventory Categories

> /api/dashboard/inventory-categories

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Get inventory categories count based on chemical groups
 * /api/dashboard/inventory-categories
 * This endpoint returns counts of stock drums grouped by chemical_group
 * from raw_materials table.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Direct query using raw SQL for more control
    const { data, error } = await supabase.rpc(
      "get_inventory_by_chemical_group"
    );

    // If the RPC doesn't exist, fall back to a simpler query
    if (error && error.message.includes("does not exist")) {
      // Simple query to get all in-stock drums with a count
      const { count, error: simpleError } = await supabase
        .from("stock_drums")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_stock");

      if (simpleError) {
        console.error("Supabase simple query error:", simpleError);
        return NextResponse.json(
          { error: "Failed to fetch inventory counts" },
          { status: 500 }
        );
      }

      // Return a simplified response with just one category
      return NextResponse.json([
        {
          name: "All Materials",
          count: count || 0,
          value: (count || 0) * 1000, // Estimate value
        },
      ]);
    }

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch inventory categories" },
        { status: 500 }
      );
    }

    // If we have data, format it for the response
    if (data && Array.isArray(data)) {
      const categories = data.map((item) => ({
        name: item.chemical_group || "Other",
        count: item.count,
        value: item.count * 1000, // Estimate value at $1000 per drum
      }));

      return NextResponse.json(categories);
    }

    // Fallback for empty data
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error processing inventory categories:", error);
    return NextResponse.json(
      { error: "Failed to process inventory categories" },
      { status: 500 }
    );
  }
}
```
