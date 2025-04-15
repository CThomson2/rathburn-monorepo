import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// TODO: Remove this after the drum labels are printed for existing stock
// TODO: Repurpose the stock labels generator component to fetch counts for new and repro drums
export async function GET() {
  try {
    // Create Supabase client
    const supabase = createClient();

    // Get count of drums
    const { count, error } = await supabase
      .from("drums")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error fetching drum count:", error);
      return NextResponse.json(
        { error: "Failed to fetch drum count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
