'use client';

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '@/lib/api/errors';
import { applyServerErrors, type FormLike } from '@/lib/api/form-errors';

type ToastText = string | { title: string; description?: string };

export type UseApiMutationOptions<TData, TVariables, TContext = unknown> = UseMutationOptions<
  TData,
  ApiError,
  TVariables,
  TContext
> & {
  /** Query keys to refresh once the request finishes, whether it worked or not. */
  invalidate?: QueryKey[] | ((data: TData | undefined, variables: TVariables) => QueryKey[]);
  /** Toast on success. Omit or `false` for none. */
  successMessage?: false | ToastText | ((data: TData, variables: TVariables) => ToastText | false);
  /**
   * Toast on failure. Default: the API's own message. `false` (or a function
   * returning `false`) to show nothing and handle the error yourself.
   */
  errorMessage?: false | string | ((error: ApiError, variables: TVariables) => string | false);
  /** A React Hook Form `form`: field errors from the API appear under the matching fields. */
  form?: FormLike;
};

// Handled elsewhere (redirects), so a toast would only add noise.
const SILENT_CODES = new Set(['UNAUTHORIZED', 'PASSWORD_CHANGE_REQUIRED', 'ABORTED']);

function show(text: ToastText, kind: 'success' | 'error', requestId?: string) {
  const title = typeof text === 'string' ? text : text.title;
  const description =
    (typeof text === 'string' ? undefined : text.description) ?? (requestId ? `Reference: ${requestId}` : undefined);
  toast[kind](title, description ? { description } : undefined);
}

/**
 * useMutation with the app's conventions built in: toasts, field errors on
 * forms, and cache refresh after every write.
 *
 *   const save = useApiMutation({
 *     mutationFn: (body: DoctorInput) => api.post<Doctor>('/doctors', body).then((r) => r.data),
 *     invalidate: [keys.doctors.all, keys.dashboard.all],
 *     successMessage: 'Doctor added',
 *     form,
 *   });
 *
 * Your own onMutate, onSuccess, onError and onSettled still run, after these.
 */
export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: UseApiMutationOptions<TData, TVariables, TContext>,
): UseMutationResult<TData, ApiError, TVariables, TContext> {
  const queryClient = useQueryClient();
  const { invalidate, successMessage, errorMessage, form, onSuccess, onError, onSettled, ...rest } = options;

  return useMutation<TData, ApiError, TVariables, TContext>({
    ...rest,
    onSuccess: (...args) => {
      const [data, variables] = args;
      if (successMessage) {
        const text = typeof successMessage === 'function' ? successMessage(data, variables) : successMessage;
        if (text !== false) show(text, 'success');
      }
      return onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error, variables] = args;
      const markedFields = form ? applyServerErrors(error, form) : false;
      if (!markedFields && errorMessage !== false && !SILENT_CODES.has(error.code)) {
        const text =
          typeof errorMessage === 'function' ? errorMessage(error, variables) : (errorMessage ?? error.message);
        if (text !== false) show(text, 'error', error.requestId);
      }
      return onError?.(...args);
    },
    onSettled: async (...args) => {
      const [data, , variables] = args;
      const keys = typeof invalidate === 'function' ? invalidate(data, variables) : (invalidate ?? []);
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      return onSettled?.(...args);
    },
  });
}
