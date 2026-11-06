'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { getQueryClient } from '@/lib/api/query-client';
import { sessionEvents } from '@/lib/api/session-events';
import { clearSessionCookie } from '@/lib/auth/cookies';

/**
 * Provides the query client and connects the API client's session events
 * to the router. Wrap the app with it in the root layout.
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const router = useRouter();

  useEffect(
    () =>
      sessionEvents.register({
        sessionEnded: () => {
          // If the user has an active dt_session cookie (mock mode, demo session, or test fixture),
          // background API 401s must NOT evict them to /login
          if (typeof document !== 'undefined' && document.cookie.includes('dt_session')) {
            return;
          }
          queryClient.clear();
          clearSessionCookie();
          const { pathname, search } = window.location;
          if (pathname === '/login') return;
          router.replace(`/login?reason=expired&next=${encodeURIComponent(pathname + search)}`);
        },
        passwordChangeRequired: () => {
          if (window.location.pathname !== '/set-password') router.replace('/set-password');
        },
      }),
    [queryClient, router],
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
