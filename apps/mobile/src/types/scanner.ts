// Define scan status as a string literal type
export type ScanStatus = "success" | "error" | "ignored";

// Define scan type as a string literal type
export type ScanType =
  | "check_in"
  | "transport"
  | "process"
  | "cancel"
  | "context";
