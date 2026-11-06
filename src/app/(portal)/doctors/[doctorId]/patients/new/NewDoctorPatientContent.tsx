'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PatientForm } from '@/features/patients/PatientForm';

export function NewDoctorPatientContent({ doctorId }: { doctorId: string }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Add patient</h1>
          <p className="mt-1 text-sm text-muted">The patient is added to this doctor&apos;s list.</p>
        </div>
        <Link
          href={`/doctors/${doctorId}`}
          className="text-xs font-medium text-muted hover:text-ink hover:underline"
        >
          &larr; Back to Doctor Profile
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-2xl shadow-black/10 ring-1 ring-black/5">
        <PatientForm
          initialDoctorId={doctorId}
          mode="create"
          onSuccess={() => router.push(`/doctors/${doctorId}`)}
          onCancel={() => router.push(`/doctors/${doctorId}`)}
          submitLabel="Add patient"
        />
      </div>
    </div>
  );
}
