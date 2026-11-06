'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientFormSchema, PatientFormData } from '@/lib/validation/schemas';
import { useAddPatient, useUpdatePatient } from './hooks';
import { useMockStore } from '@/lib/mock/store';
import { useUIStore } from '@/lib/store/uiStore';
import { DoctorSelectModal } from '@/components/modals/DoctorSelectModal';
import type { Condition, Gender } from '@/types/models';
import type { Doctor } from '@/types';

interface PatientFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: Partial<PatientFormData>;
  initialDoctorId?: string;
  patientId?: string;
  version?: number;
  mode?: 'create' | 'edit';
  layout?: 'dialog' | 'drawer';
  submitLabel?: string;
}

export function PatientForm({
  onSuccess,
  onCancel,
  initialValues,
  initialDoctorId,
  patientId,
  version = 1,
  mode = 'create',
  layout = 'dialog',
  submitLabel,
}: PatientFormProps) {
  const doctors = useMockStore((state) => state.doctors);
  const addPatient = useMockStore((state) => state.addPatient);
  const updatePatientStore = useMockStore((state) => state.updatePatient);
  const showToast = useUIStore((state) => state.showToast);

  // Preselection logic:
  // - If initialDoctorId is provided explicitly (e.g. from doctor profile /doctors/[id]/patients/new), use it.
  // - If editing an existing patient (mode === 'edit'), preselect the patient's existing doctor.
  // - When adding a new patient generally (mode === 'create'), start with no selection ('').
  const targetDoctorId =
    initialDoctorId || (mode === 'edit' ? initialValues?.doctorId : undefined) || '';
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(targetDoctorId);
  const [prevTargetDoctorId, setPrevTargetDoctorId] = useState(targetDoctorId);
  const [isDoctorPickerOpen, setIsDoctorPickerOpen] = useState(false);

  if (targetDoctorId !== prevTargetDoctorId) {
    setPrevTargetDoctorId(targetDoctorId);
    setSelectedDoctorId(targetDoctorId);
  }

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const doctorInitials = selectedDoctor
    ? selectedDoctor.name
        .replace(/^Dr\.\s*/i, '')
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'DR';

  const defaultCondition = initialValues?.condition || 'Stable';
  const defaultAdmissionDate =
    initialValues?.admissionDate ||
    initialValues?.admitted ||
    new Date().toISOString().split('T')[0];

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      age: initialValues?.age,
      gender: (initialValues?.gender as 'male' | 'female' | 'other') || 'male',
      doctorId: selectedDoctorId,
      phone: initialValues?.phone || '',
      email: initialValues?.email || '',
      condition: defaultCondition,
      diagnosis: initialValues?.diagnosis || '',
      admissionDate: defaultAdmissionDate,
      notes: initialValues?.notes || '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const addPatientMutation = useAddPatient(selectedDoctorId, form);
  const updatePatientMutation = useUpdatePatient(form);

  useEffect(() => {
    setValue('doctorId', selectedDoctorId);
  }, [selectedDoctorId, setValue]);

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctorId(doctor.id);
    setValue('doctorId', doctor.id, { shouldValidate: true, shouldDirty: true });
    setIsDoctorPickerOpen(false);
  };

  const onSubmit = async (data: PatientFormData) => {
    try {
      const conditionMap: Record<string, Condition> = {
        stable: 'stable',
        'under observation': 'under_observation',
        under_observation: 'under_observation',
        critical: 'critical',
        recovering: 'recovering',
        discharged: 'discharged',
      };

      const normalizedCond = data.condition.toLowerCase();
      const apiCondition: Condition = conditionMap[normalizedCond] || 'stable';

      const admissionDateStr =
        data.admissionDate || data.admitted || new Date().toISOString().split('T')[0];

      if (mode === 'create') {
        const assignedDoctorId = data.doctorId || selectedDoctorId;
        if (!assignedDoctorId) {
          setIsDoctorPickerOpen(true);
          return;
        }

        try {
          await addPatientMutation.mutateAsync({
            name: data.name,
            age: Number(data.age),
            gender: data.gender.toLowerCase() as Gender,
            phone: data.phone,
            email: data.email || undefined,
            condition: apiCondition,
            diagnosis: data.diagnosis || undefined,
            admissionDate: admissionDateStr,
            notes: data.notes || undefined,
          });

          const created = addPatient({
            ...data,
            doctorId: assignedDoctorId,
            admissionDate: admissionDateStr,
            admitted: admissionDateStr,
          });
          showToast(`Patient ${created.name} successfully registered.`);
          reset();
          onSuccess?.();
        } catch {
          // Keep form open so user can fix invalid fields; do not add to local store or close modal
          return;
        }
      } else if (patientId) {
        try {
          await updatePatientMutation.mutateAsync({
            id: patientId,
            version,
            previousDoctorId: initialDoctorId || initialValues?.doctorId || selectedDoctorId,
            changes: {
              name: data.name,
              age: Number(data.age),
              gender: data.gender.toLowerCase() as Gender,
              phone: data.phone,
              email: data.email || undefined,
              condition: apiCondition,
              diagnosis: data.diagnosis || undefined,
              admissionDate: admissionDateStr,
              notes: data.notes || undefined,
              doctorId: data.doctorId,
            },
          });

          updatePatientStore(patientId, {
            ...data,
            admissionDate: admissionDateStr,
            admitted: admissionDateStr,
          });
          showToast(`Patient ${data.name} updated successfully.`);
          reset();
          onSuccess?.();
        } catch {
          return;
        }
      }
    } catch (err) {
      console.error('Failed to save patient', err);
    }
  };

  const buttonText =
    submitLabel || (mode === 'create' ? 'Add patient' : 'Save changes');

  const isDrawer = layout === 'drawer';

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          if (formErrors.doctorId || !selectedDoctorId) {
            setIsDoctorPickerOpen(true);
          }
        })}
        className={isDrawer ? 'flex flex-1 flex-col justify-between overflow-hidden' : 'space-y-0'}
      >
        <div className={isDrawer ? 'flex-1 space-y-4 overflow-y-auto px-6 py-5' : 'px-6 pb-6 pt-5'}>
          {/* Doctor Context Banner */}
          {selectedDoctor ? (
            <div className="mb-5 flex items-center gap-3 rounded-lg bg-canvas px-3 py-2.5 ring-1 ring-inset ring-line">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100"
              >
                {doctorInitials}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-ink truncate">{selectedDoctor.name}</p>
                <p className="text-xs text-muted truncate">
                  {selectedDoctor.specialty}, {selectedDoctor.hospital || selectedDoctor.department || 'Square Hospital'}
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-muted">Doctor</span>
                <button
                  type="button"
                  onClick={() => setIsDoctorPickerOpen(true)}
                  data-testid="btn-change-doctor"
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-white px-2 text-xs font-medium text-ink shadow-2xs hover:bg-canvas transition-colors cursor-pointer"
                >
                  <svg
                    className="size-3.5 text-muted"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m16 3 4 4-4 4" />
                    <path d="M20 7H4" />
                    <path d="m8 21-4-4 4-4" />
                    <path d="M4 17h16" />
                  </svg>
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <div
                className={`flex items-center justify-between rounded-lg border p-3 sm:p-3.5 transition-colors ${
                  errors.doctorId
                    ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400/30'
                    : 'border-dashed border-line bg-canvas/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                      errors.doctorId
                        ? 'border border-rose-300 bg-rose-100 text-rose-700'
                        : 'border border-line bg-canvas text-muted'
                    }`}
                  >
                    ?
                  </span>
                  <div className="text-sm">
                    <p className={`font-medium ${errors.doctorId ? 'text-rose-700' : 'text-ink'}`}>
                      No doctor assigned
                    </p>
                    <p className="text-xs text-muted">Please select an attending doctor</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDoctorPickerOpen(true)}
                  data-testid="btn-select-doctor"
                  className="inline-flex h-7 items-center gap-1.5 rounded-md bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-700 transition-colors cursor-pointer"
                >
                  Select doctor
                </button>
              </div>
              {errors.doctorId && (
                <p className="mt-1.5 text-xs text-rose-600" role="alert">
                  {errors.doctorId.message || 'Please select an assigned doctor'}
                </p>
              )}
            </div>
          )}

          {/* Hidden select registered for form state and test compatibility */}
          <select {...register('doctorId')} className="sr-only" tabIndex={-1} aria-hidden="true">
            <option value="">No doctor selected</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>

        {/* 2-Column Responsive Form Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label htmlFor="p-name" className="mb-1.5 block text-sm font-medium text-ink">
              Full name
            </label>
            <div className="relative">
              <input
                id="p-name"
                type="text"
                placeholder="Patient's full name"
                {...register('name')}
                className={`block h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-4 ${
                  errors.name
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-line focus:border-brand-500 focus:ring-brand-500/15'
                }`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          {/* Age */}
          <div>
            <label htmlFor="p-age" className="mb-1.5 block text-sm font-medium text-ink">
              Age
            </label>
            <div className="relative">
              <input
                id="p-age"
                type="number"
                placeholder="Years"
                inputMode="numeric"
                min="0"
                max="130"
                {...register('age', { valueAsNumber: true })}
                className={`block h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-4 ${
                  errors.age
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-line focus:border-brand-500 focus:ring-brand-500/15'
                }`}
              />
            </div>
            {errors.age && <p className="mt-1 text-xs text-rose-600">{errors.age.message}</p>}
          </div>

          {/* Gender: Segmented Radio Control */}
          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-ink">Gender</legend>
            <div className="grid h-10 grid-cols-3 gap-1 rounded-lg bg-canvas p-1 ring-1 ring-inset ring-line">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="male"
                  {...register('gender')}
                  className="peer sr-only"
                />
                <span className="block rounded-md py-1.5 text-center text-sm text-muted transition-colors peer-checked:bg-white peer-checked:font-semibold peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">
                  Male
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="female"
                  {...register('gender')}
                  className="peer sr-only"
                />
                <span className="block rounded-md py-1.5 text-center text-sm text-muted transition-colors peer-checked:bg-white peer-checked:font-semibold peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">
                  Female
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="other"
                  {...register('gender')}
                  className="peer sr-only"
                />
                <span className="block rounded-md py-1.5 text-center text-sm text-muted transition-colors peer-checked:bg-white peer-checked:font-semibold peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">
                  Other
                </span>
              </label>
            </div>
          </fieldset>

          {/* Phone */}
          <div>
            <label htmlFor="p-phone" className="mb-1.5 block text-sm font-medium text-ink">
              Phone
            </label>
            <div className="relative">
              <input
                id="p-phone"
                type="tel"
                placeholder="e.g. +1-555-0101 or 01712345678"
                {...register('phone')}
                className={`block h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-4 ${
                  errors.phone
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-line focus:border-brand-500 focus:ring-brand-500/15'
                }`}
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="p-email" className="mb-1.5 block text-sm font-medium text-ink">
              Email <span className="font-normal text-muted">(optional)</span>
            </label>
            <div className="relative">
              <input
                id="p-email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className={`block h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-4 ${
                  errors.email
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-line focus:border-brand-500 focus:ring-brand-500/15'
                }`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
          </div>

          {/* Condition Dropdown */}
          <div>
            <label htmlFor="p-cond" className="mb-1.5 block text-sm font-medium text-ink">
              Condition
            </label>
            <div className="relative">
              <select
                id="p-cond"
                {...register('condition')}
                className="block h-10 w-full appearance-none rounded-lg border border-line bg-white pl-3 pr-9 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              >
                <option value="Stable">Stable</option>
                <option value="Under observation">Under observation</option>
                <option value="Critical">Critical</option>
                <option value="Recovering">Recovering</option>
                <option value="Discharged">Discharged</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
                <svg
                  className="size-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>
          </div>

          {/* Admission Date */}
          <div>
            <label htmlFor="p-date" className="mb-1.5 block text-sm font-medium text-ink">
              Admission date
            </label>
            <div className="relative">
              <input
                id="p-date"
                type="date"
                {...register('admissionDate')}
                className="block h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
            </div>
          </div>

          {/* Diagnosis */}
          <div className="sm:col-span-2">
            <label htmlFor="p-diag" className="mb-1.5 block text-sm font-medium text-ink">
              Diagnosis <span className="font-normal text-muted">(optional)</span>
            </label>
            <div className="relative">
              <input
                id="p-diag"
                type="text"
                placeholder="For example, hypertension"
                {...register('diagnosis')}
                className="block h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label htmlFor="p-notes" className="mb-1.5 block text-sm font-medium text-ink">
              Notes <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="p-notes"
              rows={3}
              placeholder="Anything the next person on shift should know"
              {...register('notes')}
              className="block w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
            <p className="mt-1.5 text-xs text-muted">Visible to all staff.</p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div
        className={
          isDrawer
            ? 'flex gap-2 border-t border-line bg-canvas/60 px-6 py-4'
            : 'flex flex-col-reverse gap-2 border-t border-line bg-canvas/60 px-6 py-4 sm:flex-row sm:justify-end'
        }
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`inline-flex h-10 px-4 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm transition-colors border border-line bg-white font-medium text-ink hover:bg-canvas cursor-pointer ${
              isDrawer ? 'flex-1' : ''
            }`}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || addPatientMutation.isPending || updatePatientMutation.isPending}
          data-testid="btn-submit-patient"
          className={`inline-flex h-10 px-4 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm transition-colors bg-brand-600 font-semibold text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer ${
            isDrawer ? 'flex-1' : ''
          }`}
        >
          {isSubmitting || addPatientMutation.isPending || updatePatientMutation.isPending
            ? 'Saving...'
            : buttonText}
        </button>
      </div>
    </form>

    <DoctorSelectModal
      isOpen={isDoctorPickerOpen}
      onClose={() => setIsDoctorPickerOpen(false)}
      onSelect={handleSelectDoctor}
      currentDoctorId={selectedDoctorId}
    />
  </>
  );
}
