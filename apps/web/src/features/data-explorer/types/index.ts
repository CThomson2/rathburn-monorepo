import { Database } from "@rathburn/types";

export type ValidTable =
  | keyof Database["public"]["Tables"]
  | keyof Database["public"]["Views"];

// Type for selected column
export interface SelectedColumn {
  name: string;
  selected: boolean;
}

// Type for filter condition
export interface FilterCondition {
  id: string;
  column: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "like"
    | "ilike"
    | "is"
    | "in";
  value: string;
}

// Type for a sort specification
// Type for sort specification
export interface SortSpec {
  id: string;
  column: string;
  direction: "asc" | "desc";
}

// Type for pagination
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Type for table data options
export interface TableDataOptions {
  pagination?: PaginationOptions;
  filters?: FilterCondition[];
  sorts?: SortSpec[];
  columns?: string[];
  includeCount?: boolean;
}

// Type for table data response
export interface TableDataResponse<T = any> {
  data: T[];
  count: number;
  error: any;
  isLoading: boolean;
}
