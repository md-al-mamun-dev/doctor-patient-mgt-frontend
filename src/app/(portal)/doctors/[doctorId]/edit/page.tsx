import { Suspense, use } from 'react';
import { INITIAL_DOCTORS } from '@/lib/mock/seed';
import { EditDoctorContent } from './EditDoctorContent';

export function generateStaticParams() {
  return INITIAL_DOCTORS.map((doc) => ({
    doctorId: doc.id,
  }));
}

function Inner({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);
  return <EditDoctorContent doctorId={doctorId} />;
}

export default function EditDoctorPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted">Loading doctor editor...</p>
        </div>
      }
    >
      <Inner params={params} />
    </Suspense>
  );
}
