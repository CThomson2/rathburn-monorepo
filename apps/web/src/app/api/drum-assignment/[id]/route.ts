import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("distillation_pending_assignment")
      .select(`
        *,
        drum:drums(*),
        distillation:distillation_schedule(*)
      `)
      .eq("id", assignmentId)
      .single();
    
    if (error) {
      console.error("Error fetching assignment:", error);
      return NextResponse.json(
        { error: "Failed to fetch assignment" },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const supabase = createClient();
    const body = await request.json();
    
    // Validate the body
    const { status, notes } = body;
    if (!status || !["approved", "rejected", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }
    
    // Get the current assignment
    const { data: currentAssignment, error: fetchError } = await supabase
      .from("distillation_pending_assignment")
      .select("*")
      .eq("id", assignmentId)
      .single();
    
    if (fetchError || !currentAssignment) {
      console.error("Error fetching current assignment:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch current assignment" },
        { status: 500 }
      );
    }
    
    // Prepare the update
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    // Update the assignment
    const { data, error } = await supabase
      .from("distillation_pending_assignment")
      .update(updateData)
      .eq("id", assignmentId)
      .select();
    
    if (error) {
      console.error("Error updating assignment:", error);
      return NextResponse.json(
        { error: "Failed to update assignment" },
        { status: 500 }
      );
    }
    
    // Update drum status based on the assignment status
    if (status === "approved") {
      const { error: drumUpdateError } = await supabase
        .from("drums")
        .update({ status: "allocated" })
        .eq("drum_id", currentAssignment.drum_id);
      
      if (drumUpdateError) {
        console.error("Error updating drum status:", drumUpdateError);
        // Continue anyway but log the error
      }
    } else if (status === "rejected") {
      const { error: drumUpdateError } = await supabase
        .from("drums")
        .update({ status: "in_stock" })
        .eq("drum_id", currentAssignment.drum_id);
      
      if (drumUpdateError) {
        console.error("Error updating drum status:", drumUpdateError);
        // Continue anyway but log the error
      }
    }
    
    return NextResponse.json({
      message: `Assignment ${status} successfully`,
      assignment: data[0],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const supabase = createClient();
    
    // Get the current assignment to get drum_id
    const { data: currentAssignment, error: fetchError } = await supabase
      .from("distillation_pending_assignment")
      .select("*")
      .eq("id", assignmentId)
      .single();
    
    if (fetchError || !currentAssignment) {
      console.error("Error fetching current assignment:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch current assignment" },
        { status: 500 }
      );
    }
    
    // Delete the assignment
    const { error } = await supabase
      .from("distillation_pending_assignment")
      .delete()
      .eq("id", assignmentId);
    
    if (error) {
      console.error("Error deleting assignment:", error);
      return NextResponse.json(
        { error: "Failed to delete assignment" },
        { status: 500 }
      );
    }
    
    // Reset drum status to in_stock
    const { error: drumUpdateError } = await supabase
      .from("drums")
      .update({ status: "in_stock" })
      .eq("drum_id", currentAssignment.drum_id);
    
    if (drumUpdateError) {
      console.error("Error updating drum status:", drumUpdateError);
      // Continue anyway but log the error
    }
    
    return NextResponse.json({
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}