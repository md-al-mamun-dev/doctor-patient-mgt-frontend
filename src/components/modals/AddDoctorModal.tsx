'use client';

import { DoctorForm } from '@/features/doctors/DoctorForm';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDoctorModal({ isOpen, onClose }: AddDoctorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-doctor-title"
        className="w-full max-w-lg rounded-2xl border border-line bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h3 id="add-doctor-title" className="text-lg font-semibold tracking-tight text-ink">
              Add doctor
            </h3>
            <p className="mt-1 text-sm text-muted">New doctors appear at the top of the list.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink -mr-2 -mt-1 cursor-pointer"
            aria-label="Close dialog"
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

        <DoctorForm onSuccess={onClose} onCancel={onClose} submitLabel="Add doctor" />
      </div>
    </div>
  );
}
