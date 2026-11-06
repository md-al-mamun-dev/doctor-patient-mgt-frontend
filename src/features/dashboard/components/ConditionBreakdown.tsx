import Link from 'next/link';

export interface ConditionItem {
  condition: string;
  key: string;
  count: number;
  percentage: number;
  color: string;
  bgClass: string;
}

export interface ConditionBreakdownProps {
  totalPatients: number;
  conditionBreakdown: ConditionItem[];
}

export function ConditionBreakdown({
  totalPatients,
  conditionBreakdown,
}: ConditionBreakdownProps) {
  return (
    <section aria-labelledby="condition-title" className="mt-6 rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h2 id="condition-title" className="text-base font-semibold text-ink">
            Patient condition
          </h2>
          <p className="mt-1 text-sm text-muted">All {totalPatients} patients, as of today</p>
        </div>
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {/* Stacked Horizontal Progress Bar */}
        <div
          role="img"
          aria-label={`Condition mix: ${conditionBreakdown.map((c) => `${c.count} ${c.condition.toLowerCase()}`).join(', ')}`}
          className="mt-5 flex h-8 gap-0.5"
        >
          {conditionBreakdown.map((item, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === conditionBreakdown.length - 1;
            const widthPct = totalPatients > 0 ? (item.count / totalPatients) * 100 : 0;
            return (
              <div
                key={item.condition}
                className={`${item.bgClass} h-full transition-all duration-300 ${
                  isFirst ? 'rounded-l-lg' : ''
                } ${isLast ? 'rounded-r-lg' : ''}`}
                style={{
                  width: `${Math.max(widthPct > 0 ? 1 : 0, widthPct)}%`,
                  minWidth: item.count > 0 ? '6px' : '0px',
                }}
                title={`${item.condition}: ${item.count}`}
              />
            );
          })}
        </div>

        {/* Condition Cards Grid */}
        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {conditionBreakdown.map((item) => (
            <li key={item.condition}>
              <Link
                href={`/patients?condition=${encodeURIComponent(item.key)}`}
                prefetch={false}
                className="group -m-2 block rounded-lg p-2 transition-colors hover:bg-canvas"
              >
                <span className="flex items-center gap-2 text-sm text-muted group-hover:text-ink">
                  <span aria-hidden="true" className={`size-2.5 rounded-full ${item.bgClass}`} />
                  {item.condition}
                </span>
                <span className="mt-1 block text-xl font-semibold tabular-nums text-ink">
                  {item.count}
                </span>
                <span className="block text-xs tabular-nums text-muted">
                  {item.percentage}% of patients
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

