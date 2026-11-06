'use client';

import { useApiQuery } from '@/hooks/use-api-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { api } from '@/lib/api/client';
import { keys } from '@/lib/query-keys';
import type { Specialization, SpecializationInput } from '@/types/models';

export function useSpecializations(q?: string) {
  return useApiQuery<Specialization[]>(
    keys.specializations.list(q),
    '/specializations',
    {
      params: q ? { q } : undefined,
      staleTime: 60_000,
    }
  );
}

export function useCreateSpecialization() {
  return useApiMutation<Specialization, SpecializationInput>({
    mutationFn: (body) => api.post<Specialization>('/specializations', body).then((res) => res.data),
    invalidate: [keys.specializations.all],
  });
}

