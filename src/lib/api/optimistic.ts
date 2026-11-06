import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { Page } from './types';

/** Puts the cache back the way it was. */
export type Rollback = () => void;

function snapshotLists<T>(queryClient: QueryClient, listKey: QueryKey): Rollback {
  const snapshot = queryClient.getQueriesData<Page<T>>({ queryKey: listKey });
  return () => snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

/**
 * Removes a row from every cached page under `listKey` right away.
 * Use in `onMutate`; call the returned rollback in `onError`.
 * `listKey` must match list caches only (for example ['patients', 'list']).
 */
export async function removeFromLists<T extends { id: string }>(
  queryClient: QueryClient,
  listKey: QueryKey,
  id: string,
): Promise<Rollback> {
  await queryClient.cancelQueries({ queryKey: listKey });
  const rollback = snapshotLists<T>(queryClient, listKey);
  queryClient.setQueriesData<Page<T>>({ queryKey: listKey }, (page) => {
    if (!page || !page.data.some((row) => row.id === id)) return page;
    return {
      data: page.data.filter((row) => row.id !== id),
      meta: { ...page.meta, total: Math.max(0, page.meta.total - 1) },
    };
  });
  return rollback;
}

/** Changes a row in every cached page under `listKey` right away. */
export async function updateInLists<T extends { id: string }>(
  queryClient: QueryClient,
  listKey: QueryKey,
  id: string,
  change: Partial<T> | ((row: T) => T),
): Promise<Rollback> {
  await queryClient.cancelQueries({ queryKey: listKey });
  const rollback = snapshotLists<T>(queryClient, listKey);
  queryClient.setQueriesData<Page<T>>({ queryKey: listKey }, (page) => {
    if (!page) return page;
    return {
      ...page,
      data: page.data.map((row) => {
        if (row.id !== id) return row;
        return typeof change === 'function' ? change(row) : { ...row, ...change };
      }),
    };
  });
  return rollback;
}
