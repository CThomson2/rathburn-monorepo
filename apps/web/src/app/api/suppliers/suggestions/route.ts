import { NextResponse } from "next/server";
import { executeDbOperation } from "@/lib/database";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const material = searchParams.get("material");

  console.log("[Supplier Suggestions API] Request received:", {
    query,
    material,
    url: req.url,
  });

  // Return empty array if no query is provided (similar to materials endpoint)
  if (!query) {
    console.log(
      "[Supplier Suggestions API] No query provided, returning empty array"
    );
    return NextResponse.json({ suggestions: [] });
  }

  try {
    return executeDbOperation(async (client) => {
      console.log(
        "[Supplier Suggestions API] Executing DB operation with query:",
        query
      );

      // Simplify to match the working materials API approach
      const { data, error } = await client
        .from("ref_suppliers")
        .select("supplier_name")
        .ilike("supplier_name", `${query}%`)
        .limit(10);

      console.log("[Supplier Suggestions API] DB response:", {
        resultCount: data?.length || 0,
        error: error || null,
      });

      if (error) {
        console.error("[Supplier Suggestions API] Database error:", error);
        throw error;
      }

      const suggestions = data.map((s) => s.supplier_name);
      console.log(
        "[Supplier Suggestions API] Returning suggestions:",
        suggestions
      );

      return NextResponse.json({
        suggestions,
      });
    });
  } catch (error) {
    console.error(
      "[Supplier Suggestions API] Error fetching supplier suggestions:",
      error
    );
    return NextResponse.json(
      {
        error: "Failed to fetch suggestions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
