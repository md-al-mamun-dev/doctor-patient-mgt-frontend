'use client';

import { useApiQuery } from '@/hooks/use-api-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { api } from '@/lib/api/client';
import { keys } from '@/lib/query-keys';
import type { Hospital, HospitalInput } from '@/types/models';

export function useHospitals(q?: string) {
  return useApiQuery<Hospital[]>(
    keys.hospitals.list(q),
    '/hospitals',
    {
      params: q ? { q } : undefined,
      staleTime: 60_000,
    }
  );
}

export function useCreateHospital() {
  return useApiMutation<Hospital, HospitalInput>({
    mutationFn: (body) => api.post<Hospital>('/hospitals', body).then((res) => res.data),
    invalidate: [keys.hospitals.all],
  });
}

