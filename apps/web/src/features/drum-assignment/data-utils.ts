import {
  DrumAssignmentFilters,
  PendingAssignmentsResponse,
  DrumAssignmentFormData,
} from "./types";

/**
 * Fetches pending drum assignments with optional filters
 */
export async function getPendingAssignments(
  filters: DrumAssignmentFilters
): Promise<PendingAssignmentsResponse> {
  const { material, status, page = 1, limit = 10 } = filters;

  // Build query params
  const params = new URLSearchParams();
  if (material) params.append("material", material);
  if (status) params.append("status", status);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  // Fetch from our API
  const response = await fetch(`/api/drum-assignment?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // Disable caching for this request
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch pending assignments");
  }

  return await response.json();
}

/**
 * Creates a new drum assignment
 */
export async function createDrumAssignment(
  data: DrumAssignmentFormData
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Call our API
    const response = await fetch("/api/drum-assignment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create drum assignment");
    }

    return {
      success: true,
      message: "Drum assignment created successfully",
      data: result.assignment,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Fetches available drums that can be assigned
 * TODO: Switch DB table for stock_drum (or stock_new and stock_repro as separate queries)
 */
// export async function getAvailableDrums(material?: string) {
//   // Fetch available drums from the API
//   const params = new URLSearchParams();
//   if (material) params.append("material", material);
//   params.append("status", "in_stock"); // Only get drums that are in stock

//   const response = await fetch(`/api/inventory/drums?${params.toString()}`, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.message || "Failed to fetch available drums");
//   }

//   return await response.json();
// }

/**
 * Fetches upcoming distillation schedules
 */
export async function getUpcomingDistillations() {
  // Fetch upcoming distillation schedules
  const response = await fetch("/api/distillation/schedule?status=scheduled", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch distillation schedules");
  }

  return await response.json();
}
