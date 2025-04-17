import { NextResponse } from "next/server";
import { executeDbOperation } from "@/lib/database";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    return executeDbOperation(async (client) => {
      // Use Supabase's ilike for case-insensitive matching
      const { data, error } = await client
        .from("ref_materials")
        .select("value")
        .ilike("value", `${query}%`)
        .limit(10);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        suggestions: data.map((s) => s.value),
      });
    });
  } catch (error) {
    console.error("Error fetching material suggestions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch suggestions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
