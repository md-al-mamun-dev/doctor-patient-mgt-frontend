'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useApiList, useApiQuery } from '@/hooks/use-api-query';
import { api } from '@/lib/api/client';
import type { FormLike } from '@/lib/api/form-errors';
import { keys } from '@/lib/query-keys';
import type { User, UserInput, UserListParams, UserRole, UserStatus } from '@/types/models';

/** Users directory table for admins. */
export function useUsers(params: UserListParams) {
  return useApiList<User, UserListParams>({
    key: keys.users.list,
    path: '/users',
    params,
  });
}

/** Single user profile. */
export function useUser(id: string | null) {
  return useApiQuery<User>(
    keys.users.detail(id ?? ''),
    id ? `/users/${id}` : null,
    { staleTime: 30_000 }
  );
}

/** Create new user with temporary password. */
export function useCreateUser(form?: FormLike) {
  return useApiMutation<{ user: User; temporaryPassword: string }, UserInput>({
    mutationFn: (body) =>
      api.post<{ user: User; temporaryPassword: string }>('/users', body).then((res) => res.data),
    invalidate: [keys.users.all],
    // The UI displays the temporary password dialog rather than a generic toast
    successMessage: false,
    form,
  });
}

/** Update user role or status with If-Match versioning. */
export function useUpdateUser(form?: FormLike) {
  const queryClient = useQueryClient();
  return useApiMutation<
    User,
    { id: string; version: number; changes: { name?: string; role?: UserRole; status?: UserStatus } }
  >({
    mutationFn: ({ id, version, changes }) =>
      api.patch<User>(`/users/${id}`, changes, { ifMatch: version }).then((res) => res.data),
    onSuccess: (user) => queryClient.setQueryData(keys.users.detail(user.id), user),
    invalidate: [keys.users.all],
    successMessage: 'User updated successfully',
    errorMessage: (error) => (error.is('PRECONDITION_FAILED') ? false : error.message),
    form,
  });
}

/** Reset user password, generating a new temporary password. */
export function useResetPassword() {
  return useApiMutation<{ temporaryPassword: string }, { id: string }>({
    mutationFn: ({ id }) =>
      api.post<{ temporaryPassword: string }>(`/users/${id}/reset-password`).then((res) => res.data),
    invalidate: [keys.users.all],
    successMessage: false,
  });
}

/** Unlock user account when locked due to consecutive failed logins. */
export function useUnlockUser() {
  const queryClient = useQueryClient();
  return useApiMutation<User, { id: string }>({
    mutationFn: ({ id }) => api.post<User>(`/users/${id}/unlock`).then((res) => res.data),
    onSuccess: (user) => queryClient.setQueryData(keys.users.detail(user.id), user),
    invalidate: [keys.users.all],
    successMessage: 'Account unlocked successfully',
  });
}

/** Revoke all active sessions for a specific user. */
export function useRevokeSessions() {
  return useApiMutation<void, { id: string }>({
    mutationFn: ({ id }) => api.post(`/users/${id}/revoke-sessions`).then(() => undefined),
    successMessage: 'User signed out from all devices',
  });
}

