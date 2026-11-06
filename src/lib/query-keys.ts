import type {
  AuditListParams,
  DoctorListParams,
  PatientListParams,
  UserListParams,
} from '@/types/models';

/**
 * Centralized hierarchical query keys.
 * Invalidating parent keys cascade down to dependent sub-queries.
 */
export const keys = {
  me: ['auth', 'me'] as const,
  users: {
    all: ['users'] as const,
    lists: ['users', 'list'] as const,
    list: (params: UserListParams) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  doctors: {
    all: ['doctors'] as const,
    lists: ['doctors', 'list'] as const,
    list: (params: DoctorListParams) => ['doctors', 'list', params] as const,
    detail: (id: string) => ['doctors', 'detail', id] as const,
    summary: (id: string) => ['doctors', 'detail', id, 'summary'] as const,
    patients: (id: string, params: PatientListParams) => ['doctors', 'detail', id, 'patients', params] as const,
    options: (q: string) => ['doctors', 'options', q] as const,
    facets: ['doctors', 'facets'] as const,
  },
  patients: {
    all: ['patients'] as const,
    lists: ['patients', 'list'] as const,
    list: (params: PatientListParams) => ['patients', 'list', params] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    overview: (from?: string, to?: string) => ['dashboard', 'overview', { from, to }] as const,
    summary: (range?: string, from?: string, to?: string) => ['dashboard', 'summary', { range, from, to }] as const,
    admissions: (range?: string, from?: string, to?: string) => ['dashboard', 'admissions', { range, from, to }] as const,
    topDoctors: () => ['dashboard', 'topDoctors'] as const,
    breakdown: () => ['dashboard', 'breakdown'] as const,
  },
  audit: {
    all: ['audit'] as const,
    list: (params: AuditListParams) => ['audit', 'list', params] as const,
  },
  hospitals: {
    all: ['hospitals'] as const,
    list: (q?: string) => ['hospitals', 'list', q] as const,
  },
  specializations: {
    all: ['specializations'] as const,
    list: (q?: string) => ['specializations', 'list', q] as const,
  },
};

