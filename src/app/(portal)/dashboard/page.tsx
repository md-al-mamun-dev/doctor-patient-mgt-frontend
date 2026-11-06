import { Suspense } from 'react';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { getDashboardData } from '@/features/dashboard/services/dashboard.service';
import type { TrendRange } from '@/features/dashboard/utils/dates';

export const metadata = {
  title: 'Dashboard | Doctor Tracker',
};

interface DashboardPageProps {
  searchParams?: Promise<{
    range?: TrendRange;
    from?: string;
    to?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const range = resolvedParams?.range || 'today';
  const from = resolvedParams?.from;
  const to = resolvedParams?.to;

  // Server-side initial data pre-fetching in parallel
  const initialData = await getDashboardData({
    range,
    from,
    to,
  });

  return (
    <Suspense fallback={<div className="h-48 w-full animate-pulse rounded-xl bg-canvas" />}>
      <DashboardView
        initialData={initialData}
        initialRange={range}
        initialFrom={from}
        initialTo={to}
      />
    </Suspense>
  );
}
