'use client';

import { useMemo, useState, useCallback, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks';
import { useDashboardOverview, type DashboardUnifiedData } from './hooks';
import { HeaderActions, type TrendRange } from './HeaderActions';
import { DashboardSummary } from './components/DashboardSummary';
import { ConditionBreakdown } from './components/ConditionBreakdown';
import { TopDoctors } from './components/TopDoctors';
import { SpecializationTable } from './components/SpecializationTable';
import { getPresetDateRange, getTodayLabel } from './utils/dates';
import type { DashboardServerData } from './services/dashboard.service';

// Dynamically import Recharts with SSR disabled to optimize initial bundle size
const AdmissionsChart = dynamic(() => import('./components/AdmissionsChart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg bg-canvas/30 text-xs text-muted">
      Loading chart...
    </div>
  ),
});

export interface DashboardViewProps {
  initialData?: DashboardServerData;
  initialRange?: TrendRange;
  initialFrom?: string;
  initialTo?: string;
}

export function DashboardView({
  initialData,
  initialRange = 'today',
  initialFrom,
  initialTo,
}: DashboardViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Authentication & Authorization: prefer server-authenticated identity, fallback to client session
  const { data: me } = useCurrentUser();
  const effectiveUser = me || initialData?.currentUser;
  const isAdmin = effectiveUser?.role === 'admin';

  const [trendRange, setTrendRange] = useState<TrendRange>(initialRange);
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(
    initialFrom && initialTo ? { from: initialFrom, to: initialTo } : null,
  );
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const todayLabel = useMemo(() => getTodayLabel(), []);

  // Compute exact YYYY-MM-DD boundaries
  const queryDates = useMemo(() => {
    if (customRange) {
      return { from: customRange.from, to: customRange.to };
    }
    return getPresetDateRange(trendRange);
  }, [trendRange, customRange]);

  // Prepare initial overview dataset from SSR prefetch
  const initialOverview = useMemo<DashboardUnifiedData | null>(() => {
    if (!initialData?.summary || !initialData?.breakdown || !initialData?.admissions) {
      return null;
    }
    return {
      summary: initialData.summary,
      breakdown: initialData.breakdown,
      admissions: initialData.admissions,
      topDoctors: initialData.topDoctors || [],
    };
  }, [initialData]);

  // Single unified client-side TanStack Query hook (instant date-switching via 1 optimized HTTP request)
  const { data: unifiedData, isLoading } = useDashboardOverview(queryDates, initialOverview);

  // If both SSR prefetch and client query have no data yet and query is fetching, render a skeleton
  const hasData = Boolean(unifiedData?.summary || initialData?.summary);

  /* Legacy multi-hook approach preserved for reference:
  const { data: summaryData } = useDashboardSummary(queryDates, initialData?.summary);
  const { data: breakdownData } = useBreakdown(initialData?.breakdown);
  const { data: admissionsData } = useAdmissions(queryDates, initialData?.admissions);
  const { data: topDoctorsData } = useTopDoctors(10, initialData?.topDoctors);
  */

  // Synchronize URL search parameters for linkability and server-rendering consistency
  const updateUrlParams = useCallback(
    (newRange: TrendRange, fromVal?: string, toVal?: string) => {
      const params = new URLSearchParams();
      params.set('range', newRange);
      if (fromVal) params.set('from', fromVal);
      if (toVal) params.set('to', toVal);

      startTransition(() => {
        router.replace(`/dashboard?${params.toString()}`, { scroll: false });
      });
    },
    [router],
  );

  // Pure data mappings directly from verified API responses (Zero Mock Data Leakage)
  const summary = unifiedData?.summary || initialData?.summary;
  const totalDoctors = summary?.totalDoctors ?? 0;
  const totalPatients = summary?.totalPatients ?? 0;
  const criticalPatients = summary?.criticalPatients ?? 0;
  const dischargedPatients = summary?.dischargedPatients ?? 0;
  const avgPatientsPerDoctor = summary?.avgPatientsPerDoctor ?? 0;
  const newPatients = summary?.newPatients ?? 0;
  const newPatientsPrevPeriod = summary?.newPatientsPrevPeriod ?? 0;
  const changePct = summary?.changePct;

  // Condition breakdown data directly mapped from API
  const conditionBreakdown = useMemo(() => {
    const rawConditions =
      unifiedData?.breakdown?.byCondition || initialData?.breakdown?.byCondition || [];

    const colors: Record<string, { color: string; bgClass: string; label: string }> = {
      critical: { color: '#F43F5E', bgClass: 'bg-rose-500', label: 'Critical' },
      under_observation: { color: '#FBBF24', bgClass: 'bg-amber-400', label: 'Under observation' },
      recovering: { color: '#0EA5E9', bgClass: 'bg-sky-500', label: 'Recovering' },
      stable: { color: '#10B981', bgClass: 'bg-emerald-500', label: 'Stable' },
      discharged: { color: '#CBD5E1', bgClass: 'bg-slate-300', label: 'Discharged' },
    };

    return rawConditions.map((item) => {
      const conf = colors[item.condition] || {
        color: '#10B981',
        bgClass: 'bg-emerald-500',
        label: item.condition,
      };
      const percentage = totalPatients > 0 ? Math.round((item.count / totalPatients) * 1000) / 10 : 0;
      return {
        condition: conf.label,
        key: item.condition,
        count: item.count,
        percentage,
        color: conf.color,
        bgClass: conf.bgClass,
      };
    });
  }, [unifiedData?.breakdown, initialData?.breakdown, totalPatients]);

  // Top doctors data directly mapped from API
  const topDoctors = useMemo(() => {
    const rawDoctors = unifiedData?.topDoctors || initialData?.topDoctors || [];
    const highest = Math.max(...rawDoctors.map((d) => d.count), 1);
    return rawDoctors.map((d) => ({
      doctorId: d.doctorId,
      name: d.name,
      specialization: d.specialization,
      count: d.count,
      percentage: Math.round((d.count / highest) * 100),
    }));
  }, [unifiedData?.topDoctors, initialData?.topDoctors]);

  const highestCaseload = topDoctors.length > 0 ? topDoctors[0].count : (initialData?.highestCaseload ?? 0);

  // Specialization table data directly mapped from API
  const specializationTable = useMemo(() => {
    const rawSpecs =
      unifiedData?.breakdown?.bySpecialization || initialData?.breakdown?.bySpecialization || [];
    const highest = Math.max(...rawSpecs.map((s) => s.patients), 1);
    return rawSpecs.map((s) => ({
      specialization: s.specialization,
      doctors: s.doctors,
      patients: s.patients,
      perDoctor: s.doctors > 0 ? (s.patients / s.doctors).toFixed(1) : 0,
      percentage: Math.round((s.patients / highest) * 100),
    }));
  }, [unifiedData?.breakdown, initialData?.breakdown]);

  const hospitalsCount = specializationTable.length > 0 ? specializationTable.length : (initialData?.hospitalsCount ?? 0);

  // Chart data points directly from backend bucketed admissions timeline
  const chartData = useMemo(() => {
    const rawAdmissions = unifiedData?.admissions || initialData?.admissions;
    if (!rawAdmissions?.current) return [];

    const prevMap = new Map((rawAdmissions.previous || []).map((p) => [p.date, p.count]));
    const prevValues = (rawAdmissions.previous || []).map((p) => p.count);

    return rawAdmissions.current.map((item, idx) => ({
      date: item.date.slice(5),
      admissions: item.count,
      previous: prevMap.get(item.date) ?? prevValues[idx] ?? 0,
    }));
  }, [unifiedData?.admissions, initialData?.admissions]);

  // Handlers for filter controls
  const handleApplyCustom = useCallback(
    (from: string, to: string) => {
      if (from && to) {
        setCustomRange({ from, to });
        updateUrlParams(trendRange, from, to);
      } else {
        setCustomRange(null);
        updateUrlParams(trendRange);
      }
    },
    [trendRange, updateUrlParams],
  );

  const handleCloseCustom = useCallback(() => setIsCustomOpen(false), []);
  const handleToggleCustomOpen = useCallback(() => setIsCustomOpen((prev) => !prev), []);
  const handleSelectTrendRange = useCallback(
    (range: TrendRange) => {
      setTrendRange(range);
      setCustomRange(null);
      updateUrlParams(range);
    },
    [updateUrlParams],
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions (Colocated Component) */}
      <HeaderActions
        isAdmin={isAdmin}
        newPatients={newPatients}
        criticalPatients={criticalPatients}
        changePct={changePct}
        trendRange={trendRange}
        todayLabel={todayLabel}
        customRange={customRange}
        isCustomOpen={isCustomOpen}
        onToggleCustomOpen={handleToggleCustomOpen}
        onCloseCustom={handleCloseCustom}
        onSelectTrendRange={handleSelectTrendRange}
        onApplyCustomRange={handleApplyCustom}
      />

      {/* Loading Skeleton when waiting for fresh client data after expired SSR */}
      {!hasData && isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 w-full rounded-xl bg-canvas border border-line" />
          <div className="h-20 w-full rounded-xl bg-canvas border border-line" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-64 rounded-xl bg-canvas border border-line lg:col-span-2" />
            <div className="h-64 rounded-xl bg-canvas border border-line" />
          </div>
        </div>
      ) : (
        <>
          {/* 2. 5-Card Unified Segmented KPI Grid */}
          <DashboardSummary
            totalDoctors={totalDoctors}
            totalPatients={totalPatients}
            newPatients={newPatients}
            changePct={changePct}
            trendRange={trendRange}
            avgPatientsPerDoctor={avgPatientsPerDoctor}
            criticalPatients={criticalPatients}
            dischargedPatients={dischargedPatients}
            hospitalsCount={hospitalsCount}
            highestCaseload={highestCaseload}
          />

          {/* 3. Patient Condition Breakdown */}
          <ConditionBreakdown
            totalPatients={totalPatients}
            conditionBreakdown={conditionBreakdown}
          />

          {/* 4. Middle Grid: Admissions Per Day & Patients Per Doctor */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Admissions per Day Chart */}
            <section
              aria-labelledby="admissions-title"
              className="flex flex-col rounded-xl border border-line bg-white lg:col-span-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5 sm:px-6 sm:pt-6">
                <div>
                  <h2 id="admissions-title" className="text-base font-semibold text-ink">
                    Admissions per day
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {newPatients.toLocaleString()} this period, {newPatientsPrevPeriod.toLocaleString()} in the{' '}
                    {trendRange === 'today' ? '1' : trendRange === '7d' ? '7' : trendRange === '30d' ? '30' : trendRange === '90d' ? '90' : '365'}{' '}
                    days before
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="h-0.5 w-4 rounded bg-brand-600" />
                    Current
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="w-4 border-t-2 border-dashed border-slate-400" />
                    Previous
                  </span>
                </div>
              </div>

              <figure className="flex flex-1 flex-col px-5 pb-5 sm:px-6 sm:pb-6">
                <figcaption className="sr-only">
                  Daily admissions from the selected period compared with the previous period.
                </figcaption>
                <div className="relative mt-8 h-60 sm:h-64 lg:h-auto lg:min-h-64 lg:flex-1">
                  <AdmissionsChart data={chartData} />
                </div>
              </figure>
            </section>

            {/* Patients Per Doctor (Top 10) */}
            <TopDoctors topDoctors={topDoctors} />
          </div>

          {/* 5. Specializations Table */}
          <SpecializationTable specializationTable={specializationTable} />
        </>
      )}
    </div>
  );
}
