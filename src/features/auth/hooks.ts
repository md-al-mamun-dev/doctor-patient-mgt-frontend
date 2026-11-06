'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useApiQuery } from '@/hooks/use-api-query';
import { api } from '@/lib/api/client';
import type { FormLike } from '@/lib/api/form-errors';
import { keys } from '@/lib/query-keys';
import type { CurrentUser } from '@/types/models';

export type LoginCredentials = {
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

/** Current user profile and session info. */
export function useCurrentUser() {
  const query = useApiQuery<{ user: CurrentUser } | CurrentUser>(keys.me, '/auth/me', {
    staleTime: 5 * 60_000,
    retry: false,
  });

  const raw = query.data;
  const user: CurrentUser | undefined =
    raw && 'user' in raw && raw.user ? (raw.user as CurrentUser) : (raw as CurrentUser | undefined);

  return {
    ...query,
    data: user,
  };
}

/** Sign in with email and password. */
export function useLogin(form?: FormLike) {
  const queryClient = useQueryClient();
  return useApiMutation<{ user: CurrentUser; session?: unknown } | CurrentUser, LoginCredentials>({
    mutationFn: (credentials) =>
      api
        .post<{ user: CurrentUser; session?: unknown } | CurrentUser>('/auth/login', credentials)
        .then((res) => res.data),
    onSuccess: (data) => {
      const user: CurrentUser = 'user' in data && data.user ? data.user : (data as CurrentUser);
      queryClient.setQueryData(keys.me, user);
    },
    errorMessage: (error) =>
      error.is('INVALID_CREDENTIALS') ? false : error.message,
    form,
  });
}

/** Forced or voluntary password change. */
export function useChangePassword(form?: FormLike) {
  const queryClient = useQueryClient();
  return useApiMutation<void, ChangePasswordInput>({
    mutationFn: (body) => api.post('/auth/change-password', body).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.me });
    },
    successMessage: 'Password changed successfully',
    form,
  });
}

/** Standard logout from current session. */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<void, void>({
    mutationFn: () => api.post('/auth/logout').then(() => undefined),
    onSuccess: () => {
      queryClient.clear();
      router.replace('/login');
    },
    errorMessage: false,
  });
}

/** Revoke all active sessions across all devices. */
export function useLogoutAll() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<void, void>({
    mutationFn: () => api.post('/auth/logout-all').then(() => undefined),
    onSuccess: () => {
      queryClient.clear();
      router.replace('/login?reason=all');
    },
    errorMessage: false,
  });
}

