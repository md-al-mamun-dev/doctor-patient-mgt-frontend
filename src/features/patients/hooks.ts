'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useApiList, useApiQuery } from '@/hooks/use-api-query';
import { api } from '@/lib/api/client';
import type { FormLike } from '@/lib/api/form-errors';
import { removeFromLists, type Rollback } from '@/lib/api/optimistic';
import { keys } from '@/lib/query-keys';
import type { Patient, PatientInput, PatientListItem, PatientListParams } from '@/types/models';

/** Patients directory table. */
export function usePatients(params: PatientListParams) {
  return useApiList<PatientListItem, PatientListParams>({
    key: keys.patients.list,
    path: '/patients',
    params,
  });
}

/** Paged patient roster for a specific doctor. */
export function useDoctorPatients(doctorId: string, params: PatientListParams) {
  return useApiList<PatientListItem, PatientListParams>({
    key: (p) => keys.doctors.patients(doctorId, p),
    path: `/doctors/${doctorId}/patients`,
    params,
  });
}

/** Single patient details with notes and version. */
export function usePatient(id: string | null) {
  return useApiQuery<Patient>(
    keys.patients.detail(id ?? ''),
    id ? `/patients/${id}` : null,
    { staleTime: 30_000 }
  );
}

/** Add patient under a specific doctor. */
export function useAddPatient(doctorId: string, form?: FormLike) {
  return useApiMutation<Patient, PatientInput>({
    mutationFn: (body) =>
      api.post<Patient>(`/doctors/${doctorId}/patients`, body).then((res) => res.data),
    invalidate: [
      keys.doctors.detail(doctorId),
      keys.doctors.lists,
      keys.patients.all,
      keys.dashboard.all,
    ],
    successMessage: (patient) => {
      const doctorName =
        patient?.doctor?.name || (patient as any)?.doctorName || 'assigned physician';
      return {
        title: 'Patient added',
        description: `${patient.name} is now assigned to ${doctorName}.`,
      };
    },
    form,
  });
}

/** Edit patient with If-Match versioning and doctor reassignment support. */
export function useUpdatePatient(form?: FormLike) {
  const queryClient = useQueryClient();
  return useApiMutation<
    Patient,
    {
      id: string;
      version: number;
      previousDoctorId: string;
      changes: Partial<PatientInput> & { doctorId?: string };
    }
  >({
    mutationFn: ({ id, version, changes }) =>
      api.patch<Patient>(`/patients/${id}`, changes, { ifMatch: version }).then((res) => res.data),
    onSuccess: (patient) => queryClient.setQueryData(keys.patients.detail(patient.id), patient),
    invalidate: (patient, { previousDoctorId }) => {
      const currentDocId = patient?.doctor?.id || (patient as any)?.doctorId;
      return [
        keys.patients.lists,
        keys.doctors.detail(previousDoctorId),
        ...(patient && currentDocId && currentDocId !== previousDoctorId
          ? [keys.doctors.detail(currentDocId)]
          : []),
        keys.doctors.lists,
        keys.dashboard.all,
      ];
    },
    successMessage: 'Patient updated successfully',
    errorMessage: (error) => (error.is('PRECONDITION_FAILED') ? false : error.message),
    form,
  });
}

/**
 * Delete patient with instant optimistic removal and automatic rollback on error.
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useApiMutation<void, PatientListItem, { rollbacks: Rollback[] }>({
    mutationFn: (patient) => api.delete(`/patients/${patient.id}`).then(() => undefined),
    onMutate: async (patient) => {
      const docId = patient.doctor?.id || (patient as any).doctorId;
      return {
        rollbacks: await Promise.all([
          removeFromLists<PatientListItem>(queryClient, keys.patients.lists, patient.id),
          docId
            ? removeFromLists<PatientListItem>(
                queryClient,
                ['doctors', 'detail', docId, 'patients'],
                patient.id
              )
            : Promise.resolve(() => {}),
        ]),
      };
    },
    onError: (_error, _patient, context) =>
      context?.rollbacks.forEach((rollback) => rollback()),
    errorMessage: (error) =>
      error.is('NOT_FOUND')
        ? 'This patient was already deleted.'
        : `Couldn't delete patient. ${error.message}`,
    successMessage: (_data, patient) => ({
      title: 'Patient deleted',
      description: `${patient.name} was removed from the list.`,
    }),
    invalidate: (_data, patient) => {
      const docId = patient.doctor?.id || (patient as any).doctorId;
      return [
        keys.patients.all,
        ...(docId ? [keys.doctors.detail(docId)] : []),
        keys.doctors.lists,
        keys.dashboard.all,
      ];
    },
  });
}

