import { Suspense, use } from 'react';
import { INITIAL_DOCTORS } from '@/lib/mock/seed';
import { InterceptedEditDoctorModalClient } from './InterceptedEditDoctorModalClient';

export function generateStaticParams() {
  return INITIAL_DOCTORS.map((doc) => ({
    doctorId: doc.id,
  }));
}

function Inner({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);
  return <InterceptedEditDoctorModalClient doctorId={doctorId} />;
}

export default function InterceptedEditDoctorModalPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <Inner params={params} />
    </Suspense>
  );
}
