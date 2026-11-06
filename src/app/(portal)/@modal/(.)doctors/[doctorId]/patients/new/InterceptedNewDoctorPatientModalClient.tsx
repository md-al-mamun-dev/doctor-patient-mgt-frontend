'use client';

import { PatientForm } from '@/features/patients/PatientForm';
import { useRouteOverlay } from '@/hooks/useRouteOverlay';

export function InterceptedNewDoctorPatientModalClient({
  doctorId,
}: {
  doctorId: string;
}) {
  const { isOpen, isClosing, handleClose } = useRouteOverlay({ exitDuration: 150 });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 sm:p-10 backdrop-blur-xs transition-opacity duration-200 ease-out ${
        isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-patient-d-title"
        className={`relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/10 ring-1 ring-black/5 max-h-[92vh] overflow-y-auto will-change-transform will-change-[opacity] ${
          isOpen && !isClosing
            ? 'scale-100 opacity-100 transition-all duration-200 ease-out'
            : 'scale-95 opacity-0 transition-all duration-150 ease-in'
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h3 id="add-patient-d-title" className="text-lg font-semibold tracking-tight text-ink">
              Add patient
            </h3>
            <p className="mt-1 text-sm text-muted">
              The patient is added to this doctor&apos;s list.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="inline-grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink -mr-2 -mt-1 cursor-pointer"
          >
            <svg
              className="size-[18px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <PatientForm
          initialDoctorId={doctorId}
          mode="create"
          onSuccess={handleClose}
          onCancel={handleClose}
          submitLabel="Add patient"
        />
      </div>
    </div>
  );
}
