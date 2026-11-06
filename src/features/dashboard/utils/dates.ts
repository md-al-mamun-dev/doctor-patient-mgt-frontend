export type TrendRange = 'today' | '7d' | '30d' | '90d' | '12m';

export interface DateRangeResult {
  from: string;
  to: string;
}

/**
 * Helper to format a Date into YYYY-MM-DD using Asia/Dhaka timezone (UTC+6)
 * matching backend parseDhakaDateRange behavior.
 */
export function formatDhakaDate(date: Date = new Date()): string {
  // Asia/Dhaka is UTC+6
  const dhakaTime = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  return dhakaTime.toISOString().split('T')[0];
}

/**
 * Computes exact start and end calendar dates in YYYY-MM-DD.
 * - today: 1 day (today to today)
 * - 7d: 7 days inclusive (offset -6 days to today)
 * - 30d: 30 days inclusive (offset -29 days to today)
 * - 90d: 90 days inclusive (offset -89 days to today)
 * - 12m: 365 days inclusive (offset -364 days to today, compliant with backend 366-day limit)
 */
export function getPresetDateRange(range: TrendRange): DateRangeResult {
  const toStr = formatDhakaDate(new Date());
  const [y, m, d] = toStr.split('-').map(Number);

  const calculateFrom = (daysOffset: number): string => {
    const fromDate = new Date(Date.UTC(y, m - 1, d - daysOffset));
    return fromDate.toISOString().split('T')[0];
  };

  switch (range) {
    case 'today':
      return { from: toStr, to: toStr };
    case '7d':
      return { from: calculateFrom(6), to: toStr };
    case '30d':
      return { from: calculateFrom(29), to: toStr };
    case '90d':
      return { from: calculateFrom(89), to: toStr };
    case '12m':
      // Backend validates duration <= 366 days, so 12m is exactly 365 days
      return { from: calculateFrom(364), to: toStr };
    default:
      return { from: calculateFrom(29), to: toStr };
  }
}

/**
 * Returns formatted label for today, e.g., 'Today (2 Nov)'
 */
export function getTodayLabel(date: Date = new Date()): string {
  const dhakaTime = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  const day = dhakaTime.getUTCDate();
  const month = dhakaTime.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return `Today (${day} ${month})`;
}

/**
 * Returns user-friendly duration label for trend ranges, e.g., '1', '7', '30', '90', '365'
 */
export function getTrendRangeDaysLabel(range: TrendRange | string): string {
  switch (range) {
    case 'today':
      return '1';
    case '7d':
      return '7';
    case '30d':
      return '30';
    case '90d':
      return '90';
    case '12m':
      return '365';
    default:
      return '30';
  }
}

