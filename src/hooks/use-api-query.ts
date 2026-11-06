'use client';

import {
  hashKey,
  keepPreviousData,
  skipToken,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import type { ApiError } from '@/lib/api/errors';
import type { Page } from '@/lib/api/types';

type QueryExtras<TQueryFnData, TData> = Omit<
  UseQueryOptions<TQueryFnData, ApiError, TData>,
  'queryKey' | 'queryFn'
> & {
  /** Query string values for the request. */
  params?: object;
  /** Request timeout; default 15 seconds. */
  timeoutMs?: number;
};

/**
 * Fetches one record or any non-list response.
 *
 *   const { data: doctor } = useApiQuery<Doctor>(keys.doctors.detail(id), `/doctors/${id}`);
 *
 * Pass `null` as the path to wait, for example until an id is known.
 */
export function useApiQuery<TQueryFnData, TData = TQueryFnData>(
  queryKey: QueryKey,
  path: string | null,
  options: QueryExtras<TQueryFnData, TData> = {},
): UseQueryResult<TData, ApiError> {
  const { params, timeoutMs, ...rest } = options;
  return useQuery<TQueryFnData, ApiError, TData>({
    ...rest,
    queryKey,
    queryFn:
      path === null
        ? skipToken
        : async ({ signal }) => (await apiFetch<TQueryFnData>(path, { params, signal, timeoutMs })).data,
  });
}

export type UseApiListOptions<TItem, TParams extends object> = Omit<
  UseQueryOptions<Page<TItem>, ApiError>,
  'queryKey' | 'queryFn' | 'placeholderData'
> & {
  /** Key factory for this list, for example `keys.patients.list`. */
  key: (params: TParams) => QueryKey;
  path: string;
  params: TParams;
  /** Load the next page in the background when there is one. Default true. */
  prefetchNext?: boolean;
  timeoutMs?: number;
};

/**
 * Fetches a paged list and keeps `{ data, meta }` together.
 *
 * - The previous page stays on screen while the next one loads (no empty flash).
 * - The next page is prefetched, so clicking Next is usually instant.
 *
 *   const { data, isPlaceholderData } = useApiList<Patient, PatientListParams>({
 *     key: keys.patients.list, path: '/patients', params,
 *   });
 */
export function useApiList<TItem, TParams extends { page?: number }>({
  key,
  path,
  params,
  prefetchNext = true,
  timeoutMs,
  ...rest
}: UseApiListOptions<TItem, TParams>): UseQueryResult<Page<TItem>, ApiError> {
  const queryClient = useQueryClient();

  const loadPage =
    (pageParams: TParams) =>
    async ({ signal }: { signal: AbortSignal }): Promise<Page<TItem>> => {
      const res = await apiFetch<TItem[]>(path, { params: pageParams, signal, timeoutMs });
      const rows = res.data ?? [];
      return {
        data: rows,
        meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1, hasNextPage: false },
      };
    };

  const query = useQuery<Page<TItem>, ApiError>({
    ...rest,
    queryKey: key(params),
    queryFn: loadPage(params),
    placeholderData: keepPreviousData,
  });

  const meta = query.data?.meta;
  const nextParams =
    prefetchNext && meta?.hasNextPage && !query.isPlaceholderData ? { ...params, page: meta.page + 1 } : null;
  const nextKey = nextParams ? key(nextParams) : null;
  const nextHash = nextKey ? hashKey(nextKey) : null;

  useEffect(() => {
    if (!nextParams || !nextKey) return;
    void queryClient.prefetchQuery({ queryKey: nextKey, queryFn: loadPage(nextParams) });
    // nextHash changes exactly when nextKey/nextParams change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextHash, queryClient]);

  return query;
}
