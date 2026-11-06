'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DoctorForm } from '@/features/doctors/DoctorForm';

export default function NewDoctorPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Add New Doctor</h1>
          <p className="mt-1 text-sm text-muted">Register a new medical specialist to the hospital directory.</p>
        </div>
        <Link
          href="/doctors"
          className="text-xs font-medium text-muted hover:text-ink hover:underline"
        >
          &larr; Back to Doctors
        </Link>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,22,0.04)] sm:p-8">
        <DoctorForm
          onSuccess={() => router.push('/doctors')}
          onCancel={() => router.push('/doctors')}
          submitLabel="Save Doctor"
        />
      </div>
    </div>
  );
}

