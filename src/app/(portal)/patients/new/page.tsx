'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PatientForm } from '@/features/patients/PatientForm';

export default function NewPatientPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Add Patient</h1>
          <p className="mt-1 text-sm text-muted">Register a new patient admission to the healthcare management system.</p>
        </div>
        <Link
          href="/patients"
          className="text-xs font-medium text-muted hover:text-ink hover:underline"
        >
          &larr; Back to Patients
        </Link>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,22,0.04)] sm:p-8">
        <PatientForm
          onSuccess={() => router.push('/patients')}
          onCancel={() => router.push('/patients')}
          submitLabel="Add patient"
          layout="dialog"
        />
      </div>
    </div>
  );
}

