import { getTrendRangeDaysLabel } from '../utils/dates';

export interface DashboardSummaryProps {
  totalDoctors: number;
  totalPatients: number;
  newPatients: number;
  changePct?: number;
  trendRange: string;
  avgPatientsPerDoctor: number;
  criticalPatients: number;
  dischargedPatients: number;
  hospitalsCount?: number;
  highestCaseload?: number;
}

export function DashboardSummary({
  totalDoctors,
  totalPatients,
  newPatients,
  changePct,
  trendRange,
  avgPatientsPerDoctor,
  criticalPatients,
  dischargedPatients,
  hospitalsCount,
  highestCaseload,
}: DashboardSummaryProps) {
  const trendDaysLabel = getTrendRangeDaysLabel(trendRange);

  return (
    <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-5">
      {/* Total Doctors */}
      <div className="bg-white p-4 sm:p-5">
        <dt className="flex items-center gap-2 text-sm text-muted">Total doctors</dt>
        <dd
          className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-ink"
          data-testid="kpi-total-doctors"
        >
          {totalDoctors.toLocaleString('en-US')}
        </dd>
        {hospitalsCount !== undefined && hospitalsCount > 0 ? (
          <dd className="mt-2 text-xs text-muted">
            Across {hospitalsCount} {hospitalsCount === 1 ? 'specialty' : 'specialties'}
          </dd>
        ) : (
          <dd className="mt-2 text-xs text-muted">Registered staff</dd>
        )}
      </div>

      {/* Total Patients */}
      <div className="bg-white p-4 sm:p-5">
        <dt className="flex items-center gap-2 text-sm text-muted">Total patients</dt>
        <dd
          className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-ink"
          data-testid="kpi-total-patients"
        >
          {totalPatients.toLocaleString('en-US')}
        </dd>
        <dd className="mt-2 text-xs text-muted">
          {dischargedPatients.toLocaleString('en-US')} discharged
        </dd>
      </div>

      {/* New Patients */}
      <div className="bg-white p-4 sm:p-5">
        <dt className="flex items-center gap-2 text-sm text-muted">New patients</dt>
        <dd className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-ink">
          {newPatients.toLocaleString('en-US')}
        </dd>
        <dd className="mt-2 text-xs text-muted">
          {changePct !== undefined ? (
            <>
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  changePct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                <svg
                  className={`size-3.5 shrink-0 ${changePct < 0 ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m22 7-8.5 8.5-5-5L2 17" />
                  <path d="M16 7h6v6" />
                </svg>
                {Math.abs(changePct)}%
              </span>{' '}
              vs previous {trendDaysLabel} {trendDaysLabel === '1' ? 'day' : 'days'}
            </>
          ) : (
            <span>In selected {trendDaysLabel} {trendDaysLabel === '1' ? 'day' : 'days'}</span>
          )}
        </dd>
      </div>

      {/* Patients Per Doctor */}
      <div className="bg-white p-4 sm:p-5">
        <dt className="flex items-center gap-2 text-sm text-muted">Patients per doctor</dt>
        <dd className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-ink">
          {avgPatientsPerDoctor}
        </dd>
        {highestCaseload !== undefined && highestCaseload > 0 ? (
          <dd className="mt-2 text-xs text-muted">Highest caseload is {highestCaseload}</dd>
        ) : (
          <dd className="mt-2 text-xs text-muted">Average caseload ratio</dd>
        )}
      </div>

      {/* Critical Now */}
      <div className="bg-white p-4 sm:p-5 col-span-2 md:col-span-1">
        <dt className="flex items-center gap-2 text-sm text-muted">
          <span aria-hidden="true" className="size-2 rounded-full bg-rose-500 animate-pulse" />
          Critical now
        </dt>
        <dd
          className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-critical-700"
          data-testid="kpi-critical-patients"
        >
          {criticalPatients.toLocaleString('en-US')}
        </dd>
        <dd className="mt-2 text-xs text-muted">
          {totalPatients > 0 ? ((criticalPatients / totalPatients) * 100).toFixed(1) : '0.0'}% of all patients
        </dd>
      </div>
    </dl>
  );
}
