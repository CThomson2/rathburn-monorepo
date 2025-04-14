// Types for the drum assignment feature

export interface Drum {
  drum_id: number;
  material: string;
  status: string;
  supplier?: string;
  batch_code?: string;
  date_processed?: string | null;
  date_ordered?: string | null;
  site?: string;
  volume?: number;
  created_at: string;
  updated_at: string;
}

export interface DistillationSchedule {
  id: number;
  distillation_date: string;
  material: string;
  status: string;
  created_at: string;
  updated_at: string;
  operator_id?: number;
  still_id?: number;
  notes?: string;
}

export interface PendingAssignment {
  id: number;
  drum_id: number;
  distillation_id: number;
  status: string;
  assigned_by?: string;
  assigned_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  drum?: Drum;
  distillation?: DistillationSchedule;
}

export interface DrumAssignmentFormData {
  drum_id: number;
  distillation_id: number;
  assigned_by?: string;
  notes?: string;
}

export interface PendingAssignmentsResponse {
  pendingAssignments: PendingAssignment[];
  total: number;
  page: number;
  limit: number;
}

export interface DrumAssignmentFilters {
  material?: string;
  status?: string;
  page: number;
  limit: number;
}