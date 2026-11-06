import 'server-only';

import { serverApiFetch } from '@/lib/api/server';
import { getPresetDateRange, type TrendRange } from '../utils/dates';
import type {
  DashboardSummary,
  DashboardBreakdown,
  DashboardAdmissions,
  DoctorCaseload,
  CurrentUser,
} from '@/types/models';

export interface DashboardFilterParams {
  range?: TrendRange | 'custom';
  from?: string;
  to?: string;
}

export interface DashboardUnifiedResponse {
  summary: DashboardSummary;
  breakdown: DashboardBreakdown;
  admissions: DashboardAdmissions;
  topDoctors: DoctorCaseload[];
}

export interface DashboardServerData {
  summary: DashboardSummary | null;
  breakdown: DashboardBreakdown | null;
  admissions: DashboardAdmissions | null;
  topDoctors: DoctorCaseload[] | null;
  currentUser: CurrentUser | null;
  hospitalsCount: number;
  highestCaseload: number;
}

/**
 * Server-side data fetching for the Dashboard.
 *
 * Current Optimized Approach:
 * Fetches the unified GET /api/v1/dashboard endpoint along with auth session in parallel (2 requests total).
 * The backend computes all analytics in a single multi-facet MongoDB aggregation pass.
 */
export async function getDashboardData(
  filters: DashboardFilterParams = { range: 'today' },
): Promise<DashboardServerData> {
  // Resolve exact YYYY-MM-DD boundaries
  let fromDate = filters.from;
  let toDate = filters.to;

  if (filters.range && filters.range !== 'custom') {
    const rangeDates = getPresetDateRange(filters.range as TrendRange);
    fromDate = rangeDates.from;
    toDate = rangeDates.to;
  }

  const queryParams = {
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
    limit: 10,
  };

  /* =========================================================================
   * LEGACY APPROACH (Preserved for reference):
   * Multiple separate round-trips via Promise.all():
   * -------------------------------------------------------------------------
   * const [summaryRes, breakdownRes, admissionsRes, topDoctorsRes, meRes] = await Promise.all([
   *   serverApiFetch<DashboardSummary>('/api/v1/dashboard/summary', { params: queryParams }).catch(() => null),
   *   serverApiFetch<DashboardBreakdown>('/api/v1/dashboard/breakdown').catch(() => null),
   *   serverApiFetch<DashboardAdmissions>('/api/v1/dashboard/admissions', { params: queryParams }).catch(() => null),
   *   serverApiFetch<DoctorCaseload[]>('/api/v1/dashboard/patients-per-doctor', { params: { limit: 10 } }).catch(() => null),
   *   serverApiFetch<{ user: CurrentUser } | CurrentUser>('/api/v1/auth/me').catch(() => null),
   * ]);
   * ========================================================================= */

  // High-performance unified data fetch: 1 unified analytics request + 1 auth verification request
  const [dashboardRes, meRes] = await Promise.all([
    serverApiFetch<DashboardUnifiedResponse>('/api/v1/dashboard', { params: queryParams }).catch(() => null),
    serverApiFetch<{ user: CurrentUser } | CurrentUser>('/api/v1/auth/me').catch(() => null),
  ]);

  const dashboardData = dashboardRes?.data;
  const topDocs = dashboardData?.topDoctors ?? [];
  const highestCaseload = topDocs.length > 0 ? topDocs[0].count : 0;

  // Unpack CurrentUser normalization
  let user: CurrentUser | null = null;
  if (meRes?.data) {
    user = 'user' in meRes.data ? meRes.data.user : meRes.data;
  }

  // Hospitals count: derived from distinct specializations or fallback
  const distinctHospitals = new Set(
    (dashboardData?.breakdown?.bySpecialization ?? []).map((s) => s.specialization),
  ).size;

  return {
    summary: dashboardData?.summary ?? null,
    breakdown: dashboardData?.breakdown ?? null,
    admissions: dashboardData?.admissions ?? null,
    topDoctors: topDocs.length > 0 ? topDocs : null,
    currentUser: user,
    hospitalsCount: distinctHospitals > 0 ? distinctHospitals : 0,
    highestCaseload,
  };
}
