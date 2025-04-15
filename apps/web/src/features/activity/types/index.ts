import { Tables } from "@/types/models/database.types";

// Export drum scan log type from database types
export type DrumScanLog = Tables<"log_drum_scan">;

// Export notification type from database types
export type Notification = Tables<"notification">;

// Define scan status type
export type ScanStatus = "success" | "failed";

// Define scan type enum
export type ScanType =
  | "intake"
  | "transport"
  | "distillation_loading"
  | "distillation_start"
  | "error";

// Define audience type for notifications
export type AudienceType =
  | "all"
  | "lab_workers"
  | "inventory_workers"
  | "office_workers"
  | "managers";

// Define message type for notifications
export type MessageType = "info" | "warning" | "urgent" | "error" | "success";

// Define a type for real-time scan events received via SSE
export interface ScanEvent {
  scanId: number;
  drumId: number | null;
  scanType: ScanType;
  scanStatus: ScanStatus;
  scannedAt: string;
  userId: number;
}

// Define a type for dashboard widgets
export interface DashboardWidget {
  id: string;
  title: string;
  description?: string;
  width?: "full" | "half" | "third";
  height?: "small" | "medium" | "large";
}
