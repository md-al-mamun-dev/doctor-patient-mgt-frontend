import { Suspense } from 'react';
import { PatientsView } from '@/features/patients/PatientsView';

export const metadata = {
  title: 'Patients | Doctor Tracker',
};

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted">Loading patients roster...</p>
        </div>
      }
    >
      <PatientsView />
    </Suspense>
  );
}
