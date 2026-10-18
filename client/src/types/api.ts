/**
 * PERUNDHU (பேருந்து) — Shared API Response Contracts
 * Strictly aligned with verified backend models and middleware
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}
