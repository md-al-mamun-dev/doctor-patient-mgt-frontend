import 'server-only';

import { cookies } from 'next/headers';
import { buildPath, fromFetchFailure, readBody, toApiError } from './client';
import { API_SERVER_URL } from './config';
import type { ApiSuccess } from './types';

/**
 * For Server Components, route handlers and server actions: calls the Express
 * API directly at API_SERVER_URL and forwards session headers.
 *
 * It can't refresh an expired session (server components can't set cookies),
 * so a 401 is thrown for the caller to handle, usually by skipping a prefetch
 * and letting the browser fetch after its own refresh.
 */
export async function serverApiFetch<T>(
  path: string,
  options: { params?: object; timeoutMs?: number } = {},
): Promise<ApiSuccess<T>> {
  if (!API_SERVER_URL) throw new Error('API_URL is not set');
  const cookieJar = await cookies();
  const cookieHeader = cookieJar.toString();

  let res: Response;
  try {
    res = await fetch(`${API_SERVER_URL}${buildPath(path, options.params)}`, {
      headers: { Accept: 'application/json', ...(cookieHeader && { Cookie: cookieHeader }) },
      cache: 'no-store',
      signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });
  } catch (err) {
    throw fromFetchFailure(err);
  }

  if (res.status === 204) return { success: true, data: undefined as T };
  const body = await readBody(res);
  if (!res.ok) throw toApiError(res, body);
  return { success: true, data: body?.data as T, meta: body?.meta };
}
