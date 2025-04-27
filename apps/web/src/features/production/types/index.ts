export type OrderStatus = 'preparing' | 'distillation' | 'qc' | 'complete' | 'error';

export type Order = {
  id: string;
  itemName: string;
  supplier: string;
  quantity: number;
  scheduledDate: string;
  status: OrderStatus;
  progress: number;
  priority: 'low' | 'medium' | 'high';
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
    name: string;
    completed: boolean;
    assignedTo?: string;
  }[];
}

export type JobStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'cancelled';

// Mapping from database status to UI status
export const mapJobStatusToOrderStatus = (
  status: JobStatus
): OrderStatus => {
  switch (status) {
    case 'scheduled':
    case 'confirmed':
      return 'preparing';
    case 'in_progress':
      return 'distillation';
    case 'paused':
      return 'qc';
    case 'completed':
      return 'complete';
    case 'failed':
    case 'cancelled':
      return 'error';
    default:
      return 'preparing';
  }
};

// Helper to determine progress percentage based on status
export const getProgressFromStatus = (
  status: string
): number => {
  switch (status) {
    case 'scheduled':
      return 10;
    case 'confirmed':
      return 25;
    case 'in_progress':
      return 50;
    case 'paused':
      return 75;
    case 'completed':
      return 100;
    case 'failed':
    case 'cancelled':
      return 60; // Error state shows some progress
    default:
      return 0;
  }
};

// Helper to determine priority based on job data
export const getPriorityFromJob = (
  job: any
): 'low' | 'medium' | 'high' => {
  if (!job) return 'medium';
  
  // Determine priority based on job.priority if available
  if (typeof job.priority === 'number') {
    if (job.priority >= 8) return 'high';
    if (job.priority >= 4) return 'medium';
    return 'low';
  }
  
  return 'medium';
};

// Add these new types for distillation schedules
export type DistillationStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

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