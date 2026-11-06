'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMockStore } from '@/lib/mock/store';
import { PatientForm } from '@/features/patients/PatientForm';

export function EditPatientContent({ patientId }: { patientId: string }) {
  const router = useRouter();
  const patients = useMockStore((state) => state.patients);
  const patient = patients.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <h1 className="text-xl font-semibold text-ink">Patient Not Found</h1>
        <p className="mt-1 text-sm text-muted">The requested patient record could not be found.</p>
        <Link
          href="/patients"
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Return to Patients
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Edit Patient Record</h1>
          <p className="mt-1 text-sm text-muted">Modify treatment status, diagnosis, or reassign doctor.</p>
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
          patientId={patientId}
          initialValues={{
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            doctorId: patient.doctorId,
            condition: patient.condition,
            status: patient.status,
            admitted: patient.admitted,
            phone: patient.phone || '',
          }}
          mode="edit"
          onSuccess={() => router.push('/patients')}
          onCancel={() => router.push('/patients')}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}

