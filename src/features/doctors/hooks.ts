'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useApiList, useApiQuery } from '@/hooks/use-api-query';
import { api } from '@/lib/api/client';
import type { FormLike } from '@/lib/api/form-errors';
import { keys } from '@/lib/query-keys';
import type { Doctor, DoctorInput, DoctorListParams } from '@/types/models';

/** Doctors directory table. */
export function useDoctors(params: DoctorListParams) {
  return useApiList<Doctor, DoctorListParams>({
    key: keys.doctors.list,
    path: '/doctors',
    params,
  });
}

/** Doctor detail profile. Pass null until the id is known. */
export function useDoctor(id: string | null) {
  return useApiQuery<Doctor>(
    keys.doctors.detail(id ?? ''),
    id ? `/doctors/${id}` : null,
    { staleTime: 30_000 }
  );
}

/** Doctor summary metrics for detail view header. */
export function useDoctorSummary(id: string | null) {
  return useApiQuery<{
    patientCount: number;
    criticalCount: number;
    admittedThisMonth: number;
  }>(
    keys.doctors.summary(id ?? ''),
    id ? `/doctors/${id}/summary` : null,
    { staleTime: 30_000 }
  );
}

/** Specializations and hospitals for filter menus (staleTime 5 minutes). */
export function useDoctorFacets() {
  return useApiQuery<{ specializations: string[]; hospitals: string[] }>(
    keys.doctors.facets,
    '/doctors/facets',
    { staleTime: 5 * 60_000 }
  );
}

/** Fast options lookup for doctor comboboxes. */
export function useDoctorOptions(q: string) {
  return useApiQuery<Array<{ id: string; name: string; specialization: string }>>(
    keys.doctors.options(q),
    q.length >= 1 ? '/doctors/options' : null,
    { params: { q }, staleTime: 5 * 60_000 }
  );
}

/** Add doctor dialog/modal. */
export function useCreateDoctor(form?: FormLike) {
  return useApiMutation<Doctor, DoctorInput>({
    mutationFn: (body) => api.post<Doctor>('/doctors', body).then((res) => res.data),
    invalidate: [keys.doctors.all, keys.dashboard.all],
    successMessage: 'Doctor added successfully',
    form,
  });
}

/** Edit doctor dialog/modal with If-Match versioning. */
export function useUpdateDoctor(form?: FormLike) {
  const queryClient = useQueryClient();
  return useApiMutation<Doctor, { id: string; version: number; changes: Partial<DoctorInput> }>({
    mutationFn: ({ id, version, changes }) =>
      api.patch<Doctor>(`/doctors/${id}`, changes, { ifMatch: version }).then((res) => res.data),
    onSuccess: (doctor) => queryClient.setQueryData(keys.doctors.detail(doctor.id), doctor),
    invalidate: (_doctor, { changes }) => [
      keys.doctors.lists,
      ['doctors', 'options'],
      keys.doctors.facets,
      // If doctor name changes, patients list reflects the updated doctor name
      ...(changes.name ? [keys.patients.all] : []),
    ],
    successMessage: 'Doctor updated successfully',
    errorMessage: (error) => (error.is('PRECONDITION_FAILED') ? false : error.message),
    form,
  });
}

