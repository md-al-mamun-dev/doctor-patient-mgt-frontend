import { ApiError, codeForStatus, fallbackMessage } from './errors';
import { sessionEvents } from './session-events';
import { executeRequest } from './transport';
import type { ApiErrorBody, ApiSuccess, PageMeta } from './types';

/**
 * The one place that talks to the API from the browser.
 *
 * - Calls same-origin `/api/v1/...` (Next.js rewrites it to Express), so the
 *   httpOnly auth cookies are sent automatically and never touched by JS.
 * - Unwraps the `{ success, data, meta }` envelope.
 * - On a 401, refreshes the session once (shared by all requests that fail
 *   together), then retries the request once.
 * - Turns every failure, including offline and timeouts, into an ApiError.
 */

export const API_BASE_PATH = '/api/v1';
const DEFAULT_TIMEOUT_MS = 15_000;

/** Calls that must never trigger a refresh-and-retry. */
const NO_REFRESH_PATHS = new Set(['/auth/login', '/auth/refresh', '/auth/logout']);

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  /** Query string values. Arrays become comma lists; empty values are left out. */
  params?: object;
  /** JSON body for POST and PATCH. Defaults to `{}`, since the API requires a JSON body. */
  body?: unknown;
  /** The record's `version`, sent as `If-Match` (required by the API on every PATCH). */
  ifMatch?: number | string;
  /** Cancels the request; pass TanStack Query's `signal`. */
  signal?: AbortSignal;
  /** Default 15 seconds. */
  timeoutMs?: number;
  headers?: Record<string, string>;
};

type RawBody = { data?: unknown; meta?: PageMeta; error?: Partial<ApiErrorBody> } | null;

// ---------------------------------------------------------------- helpers

export function buildPath(path: string, params?: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(','));
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return `${API_BASE_PATH}${path}${query ? `?${query}` : ''}`;
}

export async function readBody(res: Response): Promise<RawBody> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    return null;
  }
  if (!text) return null;
  try {
    return JSON.parse(text) as RawBody;
  } catch {
    return null;
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

export function toApiError(res: Response, body: RawBody): ApiError {
  const error = body?.error ?? {};
  const code = error.code ?? codeForStatus(res.status);
  return new ApiError(
    res.status,
    code,
    error.message ?? fallbackMessage(code),
    Array.isArray(error.details) ? error.details : [],
    error.requestId ?? res.headers.get('x-request-id') ?? undefined,
    body?.data,
    parseRetryAfter(res.headers.get('retry-after')),
  );
}

export function fromFetchFailure(err: unknown, callerSignal?: AbortSignal): ApiError {
  const name = err instanceof Error || err instanceof DOMException ? err.name : '';
  if (callerSignal?.aborted) return new ApiError(0, 'ABORTED', fallbackMessage('ABORTED'));
  if (name === 'TimeoutError') return new ApiError(0, 'TIMEOUT', fallbackMessage('TIMEOUT'));
  if (name === 'AbortError') return new ApiError(0, 'ABORTED', fallbackMessage('ABORTED'));
  return new ApiError(0, 'NETWORK_ERROR', fallbackMessage('NETWORK_ERROR'));
}

/** Combines the caller's signal with a timeout. */
function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  if (!signal) return timeout;
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeout]);
  const controller = new AbortController();
  const forward = (source: AbortSignal) => () => controller.abort(source.reason);
  signal.addEventListener('abort', forward(signal), { once: true });
  timeout.addEventListener('abort', forward(timeout), { once: true });
  return controller.signal;
}

// ---------------------------------------------------------------- refresh

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Swaps the refresh cookie for new tokens. Concurrent callers share one
 * request, so a page whose four widgets all get a 401 sends one refresh.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= executeRequest(`${API_BASE_PATH}/auth/refresh`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

// ---------------------------------------------------------------- request

async function send<T>(path: string, options: RequestOptions, isRetry: boolean): Promise<ApiSuccess<T>> {
  const method = options.method ?? 'GET';
  const hasBody = method === 'POST' || method === 'PATCH';

  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (options.ifMatch !== undefined) headers['If-Match'] = `"${options.ifMatch}"`;

  let res: Response;
  try {
    res = await executeRequest(buildPath(path, options.params), {
      method,
      headers,
      cache: 'no-store',
      body: hasBody ? JSON.stringify(options.body ?? {}) : undefined,
      signal: withTimeout(options.signal, options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    throw fromFetchFailure(err, options.signal);
  }

  if (res.status === 204) return { success: true, data: undefined as T };

  const body = await readBody(res);
  if (res.ok) return { success: true, data: body?.data as T, meta: body?.meta };

  const refreshable = !NO_REFRESH_PATHS.has(path);
  if (res.status === 401 && refreshable && !isRetry && (await refreshSession())) {
    return send<T>(path, options, true);
  }

  const error = toApiError(res, body);
  if (res.status === 401 && refreshable && path !== '/auth/me') sessionEvents.sessionEnded();
  if (error.code === 'PASSWORD_CHANGE_REQUIRED') sessionEvents.passwordChangeRequired();
  throw error;
}

/** Sends a request and returns the unwrapped `{ data, meta }`. Throws ApiError on failure. */
export function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  return send<T>(path, options, false);
}

type NoMethod = Omit<RequestOptions, 'method' | 'body'>;

/** Shorthand for each method. */
export const api = {
  get: <T>(path: string, options?: NoMethod) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: NoMethod) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body: unknown, options?: NoMethod) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T = void>(path: string, options?: NoMethod) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
