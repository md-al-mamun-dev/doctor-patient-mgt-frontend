/**
 * Shapes shared by every Doctor Tracker API response.
 * They follow the envelope in the REST API Design doc.
 */

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

/** One problem with one field, as sent in `error.details`. */
export type FieldIssue = { path: string; message: string };

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PRECONDITION_REQUIRED'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  // Produced by the client itself, never sent by the server:
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'ABORTED';

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: FieldIssue[];
  requestId?: string;
};

export type ApiSuccess<T> = { success: true; data: T; meta?: PageMeta };
export type ApiFailure = { success: false; error: ApiErrorBody; data?: unknown };
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/** A page of list results, the shape list queries keep in the cache. */
export type Page<T> = { data: T[]; meta: PageMeta };
