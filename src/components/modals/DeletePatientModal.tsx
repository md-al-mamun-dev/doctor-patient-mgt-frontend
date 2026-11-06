'use client';

import { createPortal } from 'react-dom';
import { useMockStore } from '@/lib/mock/store';
import { useUIStore } from '@/lib/store/uiStore';
import { Patient } from '@/types';

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export function DeletePatientModal({ isOpen, onClose, patient }: DeletePatientModalProps) {
  const deletePatient = useMockStore((state) => state.deletePatient);
  const showToast = useUIStore((state) => state.showToast);

  if (!isOpen || !patient || typeof document === 'undefined') return null;

  const handleDelete = () => {
    const success = deletePatient(patient.id);
    if (success) {
      showToast(`Patient record for ${patient.name} was removed.`);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-patient-title"
        className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </div>
          <div>
            <h3 id="delete-patient-title" className="text-base font-semibold text-ink">
              Delete Patient Record
            </h3>
            <p className="text-xs text-muted">This action permanently deletes the clinical record.</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-canvas p-3 text-xs text-ink/80 space-y-1 border border-line">
          <p>
            <strong className="text-ink">Patient:</strong> {patient.name}
          </p>
          <p>
            <strong className="text-ink">Assigned Doctor:</strong> {patient.doctorName}
          </p>
          <p>
            <strong className="text-ink">Condition:</strong> {patient.condition} ({patient.status})
          </p>
        </div>

        <p className="mt-3 text-xs text-muted">
          Are you sure you want to remove this patient? Doctor caseload and dashboard counters will be updated immediately.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-line text-xs font-medium text-ink hover:bg-canvas transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

