import { Suspense, use } from 'react';
import { DoctorDetailView } from '@/features/doctors/DoctorDetailView';
import { INITIAL_DOCTORS } from '@/lib/mock/seed';

export const metadata = {
  title: 'Doctor Profile | Doctor Tracker',
};

export function generateStaticParams() {
  return INITIAL_DOCTORS.map((doc) => ({
    doctorId: doc.id,
  }));
}

function DoctorDetailPageContent({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);
  return <DoctorDetailView doctorId={doctorId} />;
}

export default function DoctorDetailPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted">Loading doctor profile...</p>
        </div>
      }
    >
      <DoctorDetailPageContent params={params} />
    </Suspense>
  );
}
