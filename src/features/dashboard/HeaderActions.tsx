'use client';

import { CustomDatePopover } from './CustomDatePopover';
import type { TrendRange } from './utils/dates';
import { AddDoctorButton, AddPatientButton } from '@/components/actions';

export type { TrendRange };

export interface HeaderActionsProps {
  isAdmin: boolean;
  onOpenAddPatient?: () => void;
  newPatients: number;
  criticalPatients: number;
  changePct?: number;
  trendRange: TrendRange;
  todayLabel: string;
  customRange: { from: string; to: string } | null;
  isCustomOpen: boolean;
  onToggleCustomOpen: () => void;
  onCloseCustom: () => void;
  onSelectTrendRange: (range: TrendRange) => void;
  onApplyCustomRange: (from: string, to: string) => void;
}

export function HeaderActions({
  isAdmin,
  newPatients,
  criticalPatients,
  changePct,
  trendRange,
  todayLabel,
  customRange,
  isCustomOpen,
  onToggleCustomOpen,
  onCloseCustom,
  onSelectTrendRange,
  onApplyCustomRange,
}: HeaderActionsProps) {
  return (
    <div className="flex flex-col gap-3 pb-2 border-b border-line/60">
      {/* Row 1: Page Title & Top-Right Primary Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Dashboard</h1>
        </div>

        {/* Action Buttons for Admins at Top-Right */}
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-2.5">
            <AddDoctorButton
              isAdmin={isAdmin}
              testId="btn-dashboard-add-doctor"
              variant="primary"
            />
            <AddPatientButton
              isAdmin={isAdmin}
              testId="btn-dashboard-add-patient"
              variant="outline"
            />
          </div>
        )}
      </div>

      {/* Row 2: Summary Stats Subtitle (Left) & Date Range Controls (Right) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pt-1">
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          <span className="font-semibold text-ink">{newPatients.toLocaleString('en-US')}</span>{' '}
          {newPatients === 1 ? 'patient admitted across' : 'patients admitted across'}{' '}
          <span className="font-medium text-ink">
            {customRange
              ? `${customRange.from} – ${customRange.to}`
              : trendRange === 'today'
                ? todayLabel
                : trendRange.toUpperCase()}
          </span>{' '}
          {changePct !== undefined && `(${changePct >= 0 ? '+' : ''}${changePct}% vs prior period). `}
          <span className="font-semibold text-critical-700">
            {criticalPatients.toLocaleString('en-US')} critical
          </span>{' '}
          condition today.
        </p>

        {/* Date Range Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {/* Preset Buttons Group */}
          <div
            role="group"
            aria-label="Date range"
            className="flex flex-1 sm:flex-none rounded-lg border border-line bg-white p-0.5 shadow-xs"
          >
            {(
              [
                { label: todayLabel, value: 'today' as const },
                { label: '7 days', value: '7d' as const },
                { label: '30 days', value: '30d' as const },
                { label: '90 days', value: '90d' as const },
                { label: '12 months', value: '12m' as const },
              ]
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={trendRange === item.value && !customRange}
                onClick={() => onSelectTrendRange(item.value)}
                data-testid={`btn-trend-range-${item.value}`}
                className={`h-8 flex-1 sm:flex-none whitespace-nowrap rounded-md px-2.5 text-xs sm:text-sm transition-all ${
                  trendRange === item.value && !customRange
                    ? 'bg-brand-50 font-semibold text-brand-700 shadow-xs'
                    : 'font-medium text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Button & Popover */}
          <div className="relative">
            <button
              type="button"
              aria-label="Custom date range"
              aria-expanded={isCustomOpen}
              onClick={onToggleCustomOpen}
              className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line px-3 text-xs sm:text-sm font-medium transition-colors hover:bg-canvas shadow-xs ${
                customRange ? 'bg-brand-50 font-semibold text-brand-700 border-brand-200' : 'bg-white text-ink'
              }`}
            >
              <svg
                className="size-4 shrink-0 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
              </svg>
              <span className="hidden sm:inline">
                {customRange ? `${customRange.from || 'Start'} – ${customRange.to || 'End'}` : 'Custom'}
              </span>
            </button>

            {isCustomOpen && (
              <CustomDatePopover
                onClose={onCloseCustom}
                onApply={onApplyCustomRange}
                initialFrom={customRange?.from || ''}
                initialTo={customRange?.to || ''}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
