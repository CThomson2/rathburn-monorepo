import { Database } from "@rathburn/types";

// UI types - for display purposes in components like cards and progress indicators
export type JobDisplayStatus =
  | "drafted"
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "paused"
  | "qc"
  | "complete"
  | "error";

export interface ProductionJobViewData {
  id: string;
  jobName: string;
  batch_id?: string | null;
  batch_code?: string | null;
  item_id?: string | null;
  material_id?: string | null;
  itemName: string;
  supplier: string;
  quantity: number;
  scheduledDate: string;
  status: JobDisplayStatus; // Uses the new JobDisplayStatus
  progress: number;
  priority: "low" | "medium" | "high";
  activeOperationType?: OperationType; // Optional: To help determine 'qc' display status
  drums?: {
    id: string;
    serial: string;
    volume: number;
    location: string;
  }[];
  timeline?: {
    event: string;
    timestamp: string;
    user?: string;
  }[];
  tasks?: {
    op_id?: string;
    name: string;
    completed: boolean;
    assignedTo?: string;
    details?: string;
    status: OperationStatus; // This remains the DB op_status
    op_type?: OperationType; // Include op_type for more detailed task info
    started_at?: string | null;
    ended_at?: string | null;
  }[];
}

// production.job_status (Directly from Supabase, source of truth)
export type JobStatus = Database["production"]["Enums"]["job_status"];

// production.op_status (Directly from Supabase)
export type OperationStatus = Database["production"]["Enums"]["op_status"];

// production.op_type (Directly from Supabase)
export type OperationType = Database["production"]["Enums"]["op_type"];

// Mapping from database JobStatus to UI JobDisplayStatus
export const mapJobStatusToDisplayStatus = (
  dbStatus: JobStatus,
  activeOpType?: OperationType // Optional: to determine if QC is active
): JobDisplayStatus => {
  switch (dbStatus) {
    case "drafted":
      return "drafted";
    case "scheduled":
      return "scheduled";
    case "confirmed":
      return "confirmed";
    case "in_progress":
      // If the job is 'in_progress' and the currently active operation is 'qc',
      // then the display status should be 'qc'.
      if (activeOpType === "qc") {
        return "qc";
      }
      return "in_progress";
    case "paused":
      return "paused";
    case "completed":
      return "complete";
    case "failed":
    case "cancelled":
      return "error";
    default:
      // This case should ideally not be reached if all dbStatus values are handled.
      // Assert exhaustive check if possible with a library or manually.
      const _exhaustiveCheck: never = dbStatus;
      return "error"; // Fallback for unhandled statuses
  }
};

// Helper to determine progress percentage based on database JobStatus
export const getProgressFromDbJobStatus = (status: JobStatus): number => {
  switch (status) {
    case "drafted":
      return 0;
    case "scheduled":
      return 10; // Represents "Preparation" step initiated
    case "confirmed":
      return 25; // Preparation likely complete, ready for distillation
    case "in_progress": // Covers both "Distillation" and "QC" phases for progress bar
      return 50; // Mid-point, can be refined if QC is a distinct major progress step
    case "paused":
      return 75; // Or current progress before pause, this might need dynamic calculation
    case "completed":
      return 100;
    case "failed":
    case "cancelled":
      return 0; // Or a specific error progress, e.g. 5 if it started
    default:
      const _exhaustiveCheck: never = status;
      return 0;
  }
};

// Helper to determine priority based on job data
export const getPriorityFromJob = (
  job: Pick<ProductionJobViewData, "priority"> | { priority?: number | string } // Allow more flexible input
): "low" | "medium" | "high" => {
  if (!job || job.priority === undefined || job.priority === null) return "medium";

  if (typeof job.priority === "number") {
    if (job.priority >= 7) return "high"; // Adjusted threshold
    if (job.priority >= 4) return "medium";
    return "low";
  }
  // If priority is already in "low", "medium", "high" string format
  if (typeof job.priority === 'string' && ['low', 'medium', 'high'].includes(job.priority)) {
    return job.priority as "low" | "medium" | "high";
  }
  
  return "medium"; // Default
};

// Add these new types for distillation schedules
// Keeping DistillationStatus separate as it's specific to that view/feature
export type DistillationStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface DistillationScheduleItem {
  id: number;
  scheduled_date: string;
  material: {
    name: string;
    type: string;
  };
  status: DistillationStatus;
  operator?: {
    name: string;
    id: number;
  };
  still_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DistillationScheduleDay {
  date: string;
  formattedDate: string; // e.g., "Mon, Jan 1"
  schedules: DistillationScheduleItem[];
}

export interface ProductionJobData {
  batchId: string;
  plannedDate: string; // ISO string
  stillId: number;
  rawVolume: number;
  priority?: number;
  jobName?: string; // Optional
  // Use the precise DB JobStatus for creation/update actions
  jobStatus: JobStatus; 
  createdBy: string;
}


export const getStatusText = (status: JobDisplayStatus): string => {
  switch (status) {
    case "drafted":
      return "Draft";
    case "scheduled":
      return "Scheduled";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "In Progress";
    case "paused":
      return "Paused";
    case "qc":
      return "QC In Progress";
    case "complete":
      return "Complete";
    case "error":
      return "Error";
    default:
      const _exhaustiveCheck: never = status;
      return "Unknown";
  }
};

export const getStatusBadgeColorClass = (status: JobDisplayStatus): string => {
  switch (status) {
    case "drafted":
      return "bg-status-drafted";
    case "scheduled":
      return "bg-status-scheduled";
    case "confirmed":
      return "bg-status-confirmed";
    case "in_progress":
      return "bg-status-in_progress";
    case "paused":
      return "bg-status-paused";
    case "qc":
      return "bg-status-qc";
    case "complete":
      return "bg-status-complete";
    case "error":
      return "bg-status-error";
    default:
      const _exhaustiveCheck: never = status;
      return "bg-gray-400";
  }
};