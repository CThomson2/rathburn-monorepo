export * from "./supabase";
/**
 * Common types and interfaces for the Rathburn monorepo
 */

/**
 * Generic API response interface
 */
export interface ApiResponse<T = unknown> {
  data: T;
  error: null | {
    message: string;
    code?: string | number;
  };
  status: number;
}

/**
 * Common pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Common error types
 */
export interface AppError extends Error {
  code?: string | number;
  status?: number;
  data?: unknown;
}

/**
 * Common user interface
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Common date range filter
 */
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

/**
 * Common status types
 */
export const StatusMap = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type Status = typeof StatusMap[keyof typeof StatusMap];

/**
 * Common sort direction type
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Generic key-value record type
 */
export type Record<T = unknown> = {
  [key: string]: T;
};

/**
 * Utility type to make all properties optional and nullable
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Utility type to make specific properties required
 */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for API request options
 */
export interface RequestOptions {
  headers?: Record<string>;
  params?: Record;
  signal?: AbortSignal;
  timeout?: number;
}