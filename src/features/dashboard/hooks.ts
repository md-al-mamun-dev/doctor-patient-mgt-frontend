'use client';

import { useApiQuery } from '@/hooks/use-api-query';
import { keys } from '@/lib/query-keys';
import type {
  DashboardAdmissions,
  DashboardBreakdown,
  DashboardSummary,
  DoctorCaseload,
} from '@/types/models';

export type DashboardRangeParams = {
  from?: string;
  to?: string;
};

export interface DashboardUnifiedData {
  summary: DashboardSummary;
  breakdown: DashboardBreakdown;
  admissions: DashboardAdmissions;
  topDoctors: DoctorCaseload[];
}

/** Unified overview hook fetching all dashboard datasets in a single optimized request. */
export function useDashboardOverview(
  params: DashboardRangeParams = {},
  initialData?: DashboardUnifiedData | null,
) {
  return useApiQuery<DashboardUnifiedData>(
    keys.dashboard.overview(params.from, params.to),
    '/dashboard',
    {
      params: {
        ...(params.from ? { from: params.from } : {}),
        ...(params.to ? { to: params.to } : {}),
        limit: 10,
      },
      staleTime: 30_000,
      ...(initialData ? { initialData } : { initialDataUpdatedAt: 0 }),
    },
  );
}

/** Headline metrics and period comparisons for the selected date range. */
export function useDashboardSummary(
  params: DashboardRangeParams = {},
  initialData?: DashboardSummary | null,
) {
  return useApiQuery<DashboardSummary>(
    keys.dashboard.summary('custom', params.from, params.to),
    '/dashboard/summary',
    {
      params,
      staleTime: 30_000,
      ...(initialData ? { initialData } : {}),
    },
  );
}

/** Admissions trend chart series for current and previous period. */
export function useAdmissions(
  params: DashboardRangeParams & { interval?: 'day' | 'week' | 'month' } = {},
  initialData?: DashboardAdmissions | null,
) {
  return useApiQuery<DashboardAdmissions>(
    keys.dashboard.admissions('custom', params.from, params.to),
    '/dashboard/admissions',
    {
      params,
      staleTime: 30_000,
      ...(initialData ? { initialData } : {}),
    },
  );
}

/** Top doctors ranked by current patient caseload. */
export function useTopDoctors(limit = 10, initialData?: DoctorCaseload[] | null) {
  return useApiQuery<DoctorCaseload[]>(
    keys.dashboard.topDoctors(),
    '/dashboard/patients-per-doctor',
    {
      params: { limit },
      staleTime: 30_000,
      ...(initialData ? { initialData } : {}),
    },
  );
}

/** Today's patient condition mix and workload by medical specialization. */
export function useBreakdown(initialData?: DashboardBreakdown | null) {
  return useApiQuery<DashboardBreakdown>(
    keys.dashboard.breakdown(),
    '/dashboard/breakdown',
    {
      staleTime: 60_000,
      ...(initialData ? { initialData } : {}),
    },
  );
}
