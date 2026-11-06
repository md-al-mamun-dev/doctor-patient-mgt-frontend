import { Suspense, use } from 'react';
import { INITIAL_PATIENTS } from '@/lib/mock/seed';
import { InterceptedEditPatientModalClient } from './InterceptedEditPatientModalClient';

export function generateStaticParams() {
  return INITIAL_PATIENTS.map((pat) => ({
    patientId: pat.id,
  }));
}

function Inner({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  return <InterceptedEditPatientModalClient patientId={patientId} />;
}

export default function InterceptedEditPatientModalPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <Inner params={params} />
    </Suspense>
  );
}
