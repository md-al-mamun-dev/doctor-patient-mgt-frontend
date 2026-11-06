import type { ApiErrorCode, FieldIssue } from './types';

/** Messages used when the server sends none (or the request never reached it). */
const FALLBACK_MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: 'Some fields need fixing.',
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  UNAUTHORIZED: 'Your session ended. Sign in again.',
  FORBIDDEN: "You don't have permission to do that.",
  PASSWORD_CHANGE_REQUIRED: 'Set a new password to continue.',
  NOT_FOUND: 'This record no longer exists.',
  CONFLICT: 'This change conflicts with existing data.',
  PRECONDITION_FAILED: 'Someone else changed this record. Review the latest details and try again.',
  PRECONDITION_REQUIRED: 'Something went wrong. Try again.',
  UNSUPPORTED_MEDIA_TYPE: 'Something went wrong. Try again.',
  RATE_LIMITED: 'Too many requests. Try again shortly.',
  INTERNAL_ERROR: 'Something went wrong. Try again.',
  SERVICE_UNAVAILABLE: 'The server is unavailable right now. Try again shortly.',
  NETWORK_ERROR: 'Check your connection, then try again.',
  TIMEOUT: 'The server took too long to respond. Try again.',
  ABORTED: 'The request was cancelled.',
};

const CODE_BY_STATUS: Partial<Record<number, ApiErrorCode>> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  428: 'PRECONDITION_REQUIRED',
  429: 'RATE_LIMITED',
  503: 'SERVICE_UNAVAILABLE',
};

export function codeForStatus(status: number): ApiErrorCode {
  return CODE_BY_STATUS[status] ?? 'INTERNAL_ERROR';
}

export function fallbackMessage(code: string): string {
  return FALLBACK_MESSAGES[code as ApiErrorCode] ?? FALLBACK_MESSAGES.INTERNAL_ERROR;
}

/**
 * Every failed request becomes an ApiError, whether the server answered or not.
 * `status` is 0 when the request never got a response (offline, timeout, cancelled).
 */
export class ApiError<TData = unknown> extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly code: ApiErrorCode | (string & {}),
    message: string,
    readonly details: FieldIssue[] = [],
    readonly requestId?: string,
    /** On a 412, the current version of the record. */
    readonly data?: TData,
    /** From the Retry-After header on a 429 or 503. */
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }

  /** Worth retrying automatically: network failures, timeouts, 5xx and 429. */
  get retryable(): boolean {
    if (this.code === 'ABORTED') return false;
    return this.status === 0 || this.status >= 500 || this.status === 429;
  }

  is(code: ApiErrorCode): boolean {
    return this.code === code;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** A message that is always safe to show a person. */
export function errorMessage(error: unknown): string {
  return isApiError(error) ? error.message : fallbackMessage('INTERNAL_ERROR');
}
