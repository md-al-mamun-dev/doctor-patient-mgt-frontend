'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface AdmissionChartPoint {
  date: string;
  admissions: number;
  previous: number;
}

export interface AdmissionsChartProps {
  data: AdmissionChartPoint[];
}

export default function AdmissionsChart({ data }: AdmissionsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-lg border border-dashed border-line bg-canvas/30 text-xs text-muted sm:h-64">
        No admissions recorded in this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="admissionsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14897E" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#14897E" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
        <XAxis dataKey="date" stroke="var(--color-muted)" fontSize={11} tickLine={false} />
        <YAxis stroke="var(--color-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-line)',
            color: 'var(--color-ink)',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          itemStyle={{ color: 'var(--color-ink)' }}
          labelStyle={{ color: 'var(--color-muted)' }}
        />
        {/* Previous period: dashed line */}
        <Area
          type="monotone"
          dataKey="previous"
          stroke="var(--color-muted)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="none"
          isAnimationActive={false}
        />
        {/* Current period: solid area with subtle gradient fill */}
        <Area
          type="monotone"
          dataKey="admissions"
          stroke="#14897E"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#admissionsGradient)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
