import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// TODO: Remove this after the drum labels are printed for existing stock
// TODO: Repurpose the stock labels generator component to fetch counts for new and repro drums
export async function GET() {
  try {
    // Create Supabase client
    const supabase = createClient();

    // Get drums
    const { data, error } = await supabase.from("stock_drum").select("*").limit(25);

    if (error) {
      console.error("Error fetching drum count:", error);
      return NextResponse.json(
        { error: "Failed to fetch drum count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
