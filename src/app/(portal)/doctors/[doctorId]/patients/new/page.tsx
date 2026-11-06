import { Suspense, use } from 'react';
import { INITIAL_DOCTORS } from '@/lib/mock/seed';
import { NewDoctorPatientContent } from './NewDoctorPatientContent';

export function generateStaticParams() {
  return INITIAL_DOCTORS.map((doc) => ({
    doctorId: doc.id,
  }));
}

function Inner({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);
  return <NewDoctorPatientContent doctorId={doctorId} />;
}

export default function NewDoctorPatientPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted">Loading registration form...</p>
        </div>
      }
    >
      <Inner params={params} />
    </Suspense>
  );
}
