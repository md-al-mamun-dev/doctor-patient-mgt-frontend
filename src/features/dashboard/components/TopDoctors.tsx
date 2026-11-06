import Link from 'next/link';

export interface TopDoctorItem {
  doctorId: string;
  name: string;
  specialization: string;
  count: number;
  percentage: number;
}

export interface TopDoctorsProps {
  topDoctors: TopDoctorItem[];
}

export function TopDoctors({ topDoctors }: TopDoctorsProps) {
  return (
    <section aria-labelledby="top-title" className="rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h2 id="top-title" className="text-base font-semibold text-ink">
            Patients per doctor
          </h2>
          <p className="mt-1 text-sm text-muted">Top 10 by current patients</p>
        </div>
        <Link href="/doctors" className="text-sm font-medium text-brand-700 hover:underline">
          All doctors
        </Link>
      </div>

      {topDoctors.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted">
          No doctor assignment data available.
        </div>
      ) : (
        <ol className="mt-3 space-y-0.5 px-3 pb-4 sm:px-4">
          {topDoctors.map((doc) => (
            <li key={doc.doctorId}>
              <Link
                href={`/doctors/${doc.doctorId}`}
                prefetch={false}
                className="group block rounded-lg px-2 py-2 transition-colors hover:bg-canvas"
              >
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-ink group-hover:text-brand-700">{doc.name}</span>{' '}
                    <span className="text-muted">{doc.specialization}</span>
                  </span>
                  <span className="font-medium tabular-nums text-ink">{doc.count}</span>
                </span>
                <span aria-hidden="true" className="mt-1.5 block h-1.5 rounded-full bg-line/70">
                  <span
                    className="block h-full rounded-full bg-brand-600 transition-all duration-300"
                    style={{ width: `${Math.max(4, doc.percentage)}%` }}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
