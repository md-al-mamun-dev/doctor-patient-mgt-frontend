export interface SpecializationRow {
  specialization: string;
  doctors: number;
  patients: number;
  perDoctor: number | string;
  percentage: number;
}

export interface SpecializationTableProps {
  specializationTable: SpecializationRow[];
}

export function SpecializationTable({ specializationTable }: SpecializationTableProps) {
  return (
    <section aria-labelledby="spec-title" className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h2 id="spec-title" className="text-base font-semibold text-ink">
            Specializations
          </h2>
          <p className="mt-1 text-sm text-muted">Doctors and patients in each, most patients first</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Doctors and patients per specialization</caption>
          <thead className="border-y border-line bg-canvas/60">
            <tr>
              <th
                scope="col"
                className="py-2.5 pl-5 pr-3 text-left text-xs font-medium text-muted sm:pl-6"
              >
                Specialization
              </th>
              <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium text-muted">
                Doctors
              </th>
              <th
                scope="col"
                className="w-1/2 py-2.5 pl-3 pr-5 text-left text-xs font-medium text-muted sm:pr-3"
              >
                Patients
              </th>
              <th
                scope="col"
                className="hidden py-2.5 pl-3 pr-5 text-right text-xs font-medium text-muted sm:table-cell sm:pr-6"
              >
                Per doctor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {specializationTable.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-muted">
                  No specialization data available.
                </td>
              </tr>
            ) : (
              specializationTable.map((row) => (
                <tr key={row.specialization} className="transition-colors hover:bg-canvas/40">
                  <td className="py-3 pl-5 pr-3 font-medium text-ink sm:pl-6">{row.specialization}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{row.doctors}</td>
                  <td className="py-3 pl-3 pr-5 sm:pr-3">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="block h-1.5 flex-1 rounded-full bg-line/70">
                        <span
                          className="block h-full rounded-full bg-brand-600 transition-all duration-300"
                          style={{ width: `${Math.max(4, row.percentage)}%` }}
                        />
                      </span>
                      <span className="w-9 text-right tabular-nums text-ink">{row.patients}</span>
                    </div>
                  </td>
                  <td className="hidden py-3 pl-3 pr-5 text-right tabular-nums text-muted sm:table-cell sm:pr-6">
                    {row.perDoctor}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
