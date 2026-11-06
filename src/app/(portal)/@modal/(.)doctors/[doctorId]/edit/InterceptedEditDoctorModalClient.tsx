'use client';

import { useMockStore } from '@/lib/mock/store';
import { DoctorForm } from '@/features/doctors/DoctorForm';
import { useRouteOverlay } from '@/hooks/useRouteOverlay';

function getInitials(name: string) {
  return (
    name
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DR'
  );
}

export function InterceptedEditDoctorModalClient({
  doctorId,
}: {
  doctorId: string;
}) {
  const doctors = useMockStore((state) => state.doctors);
  const doctor = doctors.find((d) => d.id === doctorId);
  const { isOpen, isClosing, handleClose } = useRouteOverlay({ exitDuration: 150 });

  if (!doctor) return null;

  const initials = getInitials(doctor.name);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className={`fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-xs transition-opacity duration-200 ease-out ${
        isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-doctor-d-title"
        data-testid="edit-doctor-drawer"
        className={`relative ml-auto flex h-full w-full max-w-md sm:max-w-lg flex-col bg-white shadow-2xl shadow-black/20 will-change-transform ${
          isOpen && !isClosing
            ? 'translate-x-0 transition-transform duration-200 ease-out'
            : 'translate-x-full transition-transform duration-150 ease-in'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-semibold tracking-wide text-brand-700 ring-1 ring-inset ring-brand-500/20">
              {initials}
            </span>
            <div>
              <h3 id="edit-doctor-d-title" className="text-base font-semibold tracking-tight text-ink">
                Edit {doctor.name}
              </h3>
              <p className="text-xs text-muted">
                {doctor.specialty} &bull; {doctor.hospital || 'General Hospital'}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
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

        {/* Doctor Form in Drawer Layout */}
        <DoctorForm
          mode="edit"
          layout="drawer"
          doctorId={doctorId}
          initialValues={{
            name: doctor.name,
            specialty: doctor.specialty,
            hospital: doctor.hospital,
            department: doctor.department,
            email: doctor.email,
            phone: doctor.phone,
            status: doctor.status,
          }}
          onSuccess={handleClose}
          onCancel={handleClose}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
