/**
 * Shared, transport-level types used across API routes, server actions and UI.
 */

/** Serialized MongoDB ObjectId as used in JSON payloads. */
export type MongoId = string;

export interface BaseDocument {
  _id: MongoId;
  createdAt: string;
  updatedAt: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

/* ----------------------------- API result types ---------------------------- */
export interface ApiError {
  field?: string;
  message: string;
}

export interface ApiSuccess<TData = unknown> {
  success: true;
  data: TData;
}

export interface ApiFailure {
  success: false;
  errors: ApiError[];
  /** Optional machine-readable code, e.g. "VALIDATION_ERROR". */
  code?: string;
}

export type ApiResponse<TData = unknown> = ApiSuccess<TData> | ApiFailure;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<TItem> {
  items: TItem[];
  meta: PaginationMeta;
}
