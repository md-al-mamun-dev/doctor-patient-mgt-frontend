'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMockStore } from '@/lib/mock/store';
import { DoctorForm } from '@/features/doctors/DoctorForm';

function getInitials(name: string) {
  return (
    name
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DR'
  );
}

export function EditDoctorContent({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const doctors = useMockStore((state) => state.doctors);
  const doctor = doctors.find((d) => d.id === doctorId);

  if (!doctor) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <h1 className="text-xl font-semibold text-ink">Doctor Not Found</h1>
        <p className="mt-1 text-sm text-muted">The requested doctor record could not be found.</p>
        <Link
          href="/doctors"
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm"
        >
          Return to Doctors
        </Link>
      </div>
    );
  }

  const initials = getInitials(doctor.name);

  return (
    <div className="mx-auto max-w-2xl py-6">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-base font-semibold tracking-wide text-brand-700 ring-1 ring-inset ring-brand-500/20">
            {initials}
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Edit {doctor.name}
            </h1>
            <p className="text-sm text-muted">
              {doctor.specialty} &bull; {doctor.hospital || 'General Hospital'}
            </p>
          </div>
        </div>
        <Link
          href={`/doctors/${doctorId}`}
          className="text-xs font-medium text-muted hover:text-ink hover:underline"
        >
          &larr; Back to Doctor Profile
        </Link>
      </div>

      {/* Styled Form Container Card */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm ring-1 ring-black/5">
        <DoctorForm
          mode="edit"
          layout="dialog"
          doctorId={doctorId}
          initialValues={{
            name: doctor.name,
            specialty: doctor.specialty,
            hospital: doctor.hospital,
            department: doctor.department,
            email: doctor.email,
            phone: doctor.phone,
            status: doctor.status,
          }}
          onSuccess={() => router.push(`/doctors/${doctorId}`)}
          onCancel={() => router.push(`/doctors/${doctorId}`)}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
