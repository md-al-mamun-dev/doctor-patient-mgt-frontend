'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns true only on the client after initial hydration is complete.
 * Prevents hydration mismatches caused by client-only state (e.g., query cache or auth).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

