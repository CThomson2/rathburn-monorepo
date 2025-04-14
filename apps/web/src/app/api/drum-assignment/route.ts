import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Optional filters
    const materialFilter = searchParams.get("material");
    const statusFilter = searchParams.get("status");
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    
    // Build query for pending assignments
    let query = supabase
      .from("distillation_pending_assignment")
      .select(`
        *,
        drum:drums(*)
      `)
      .range(offset, offset + limit - 1);
    
    // Apply filters if provided
    if (materialFilter) {
      query = query.eq("material", materialFilter);
    }
    
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }
    
    // Execute query
    const { data, error, count } = await query.order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching pending assignments:", error);
      return NextResponse.json(
        { error: "Failed to fetch pending assignments" },
        { status: 500 }
      );
    }
    
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("distillation_pending_assignment")
      .select("*", { count: "exact" });
    
    if (countError) {
      console.error("Error getting total count:", countError);
    }
    
    return NextResponse.json({
      pendingAssignments: data || [],
      total: totalCount || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    // Validate required fields
    const { drum_id, distillation_id } = body;
    if (!drum_id || !distillation_id) {
      return NextResponse.json(
        { error: "Missing required fields: drum_id and distillation_id" },
        { status: 400 }
      );
    }
    
    // Insert new assignment
    const { data, error } = await supabase
      .from("distillation_pending_assignment")
      .insert([
        {
          drum_id,
          distillation_id,
          status: "pending", // Default status
          assigned_by: body.assigned_by || null,
          notes: body.notes || null,
        },
      ])
      .select();
    
    if (error) {
      console.error("Error creating drum assignment:", error);
      return NextResponse.json(
        { error: "Failed to create drum assignment" },
        { status: 500 }
      );
    }
    
    // Update drum status to 'pending_assignment'
    const { error: drumUpdateError } = await supabase
      .from("drums")
      .update({ status: "pending_allocation" })
      .eq("drum_id", drum_id);
    
    if (drumUpdateError) {
      console.error("Error updating drum status:", drumUpdateError);
      // Proceed anyway, but log the error
    }
    
    return NextResponse.json({
      message: "Drum assignment created successfully",
      assignment: data[0],
    }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}