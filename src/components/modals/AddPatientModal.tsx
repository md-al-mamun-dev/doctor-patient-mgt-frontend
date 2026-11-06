'use client';

import { useEffect, useCallback } from 'react';
import { PatientForm } from '@/features/patients/PatientForm';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoctorId?: string;
}

export function AddPatientModal({ isOpen, onClose, initialDoctorId }: AddPatientModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 sm:p-10 backdrop-blur-xs"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-patient-d-title"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/10 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h3 id="add-patient-d-title" className="text-lg font-semibold tracking-tight text-ink">
              Add patient
            </h3>
            <p className="mt-1 text-sm text-muted">
              {initialDoctorId
                ? "The patient is added to this doctor's list."
                : 'Register a new patient and assign to a doctor.'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
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
          initialDoctorId={initialDoctorId}
          mode="create"
          onSuccess={onClose}
          onCancel={onClose}
          submitLabel="Add patient"
        />
      </div>
    </div>
  );
}
