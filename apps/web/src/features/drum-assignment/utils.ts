import { PendingAssignment } from "./types";

/**
 * Updates a pending assignment status (approve, reject, or complete)
 */
export async function updateAssignmentStatus(
  id: number,
  status: "approved" | "rejected" | "completed",
  notes?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const response = await fetch(`/api/drum-assignment/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        notes,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `Failed to ${status} assignment`);
    }
    
    return {
      success: true,
      message: `Assignment ${status} successfully`,
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
 * Deletes a pending assignment
 */
export async function deleteAssignment(
  id: number
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/drum-assignment/${id}`, {
      method: "DELETE",
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Failed to delete assignment");
    }
    
    return {
      success: true,
      message: "Assignment deleted successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Gets the details of a specific assignment
 */
export async function getAssignmentDetails(
  id: number
): Promise<{ success: boolean; data?: PendingAssignment; message?: string }> {
  try {
    const response = await fetch(`/api/drum-assignment/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Failed to get assignment details");
    }
    
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Formats a date string to a human-readable format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Gets a color for a status badge
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status.toLowerCase()) {
    case "pending":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
      };
    case "approved":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      };
    case "rejected":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      };
    case "completed":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      };
  }
}