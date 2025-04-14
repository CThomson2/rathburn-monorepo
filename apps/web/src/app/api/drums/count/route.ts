import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
