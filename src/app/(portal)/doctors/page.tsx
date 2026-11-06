import { Suspense } from 'react';
import { DoctorsView } from '@/features/doctors/DoctorsView';

export const metadata = {
  title: 'Doctors | Doctor Tracker',
};

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted">Loading doctors directory...</p>
        </div>
      }
    >
      <DoctorsView />
    </Suspense>
  );
}
