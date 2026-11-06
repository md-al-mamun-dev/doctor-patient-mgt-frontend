import { Suspense, use } from 'react';
import { INITIAL_PATIENTS } from '@/lib/mock/seed';
import { EditPatientContent } from './EditPatientContent';

export function generateStaticParams() {
  return INITIAL_PATIENTS.map((pat) => ({
    patientId: pat.id,
  }));
}

function Inner({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  return <EditPatientContent patientId={patientId} />;
}

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted">Loading patient editor...</p>
        </div>
      }
    >
      <Inner params={params} />
    </Suspense>
  );
}
