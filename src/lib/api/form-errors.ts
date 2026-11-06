import { isApiError } from './errors';

/**
 * The part of a React Hook Form `form` this needs. Declared with method
 * syntax so any `UseFormReturn<YourForm>` can be passed in.
 */
export interface FormLike {
  setError(name: string, error: { type: string; message?: string }, options?: { shouldFocus: boolean }): void;
}

/**
 * Puts the API's field errors (`error.details`) under the matching form fields
 * and focuses the first one. Returns true when at least one field was marked.
 */
export function applyServerErrors(error: unknown, form: FormLike): boolean {
  if (!isApiError(error) || error.details.length === 0) return false;
  if (error.code !== 'VALIDATION_ERROR' && error.code !== 'CONFLICT') return false;
  error.details.forEach((issue, index) => {
    form.setError(issue.path, { type: 'server', message: issue.message }, { shouldFocus: index === 0 });
  });
  return true;
}
