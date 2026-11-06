'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { doctorFormSchema, DoctorFormData } from '@/lib/validation/schemas';
import { useCreateDoctor, useUpdateDoctor } from './hooks';
import { useMockStore } from '@/lib/mock/store';
import { useUIStore } from '@/lib/store/uiStore';
import { HospitalCombobox } from '@/components/ui/HospitalCombobox';
import { SpecializationCombobox } from '@/components/ui/SpecializationCombobox';

interface DoctorFormProps {
  doctorId?: string;
  mode?: 'create' | 'edit';
  layout?: 'dialog' | 'drawer';
  version?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: Partial<DoctorFormData>;
  submitLabel?: string;
}

export function DoctorForm({
  doctorId,
  mode = 'create',
  layout = 'dialog',
  version,
  onSuccess,
  onCancel,
  initialValues,
  submitLabel = mode === 'edit' ? 'Save changes' : 'Add doctor',
}: DoctorFormProps) {
  const addDoctor = useMockStore((state) => state.addDoctor);
  const updateDoctor = useMockStore((state) => state.updateDoctor);
  const showToast = useUIStore((state) => state.showToast);
  const form = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      specialty: initialValues?.specialty || '',
      hospital: initialValues?.hospital || initialValues?.department || '',
      department: initialValues?.department || initialValues?.hospital || '',
      email: initialValues?.email || '',
      phone: initialValues?.phone || '',
      status: initialValues?.status || 'Active',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const createDoctorMutation = useCreateDoctor(form);
  const updateDoctorMutation = useUpdateDoctor(form);
  const isPending = createDoctorMutation.isPending || updateDoctorMutation.isPending;

  const hospitalValue = useWatch({ control, name: 'hospital' });
  const specialtyValue = useWatch({ control, name: 'specialty' });
  const statusValue = useWatch({ control, name: 'status' });
  const nameValue = useWatch({ control, name: 'name' });

  const onSubmit = async (data: DoctorFormData) => {
    try {
      const hospitalName = data.hospital.trim();

      if (mode === 'edit' && doctorId) {
        try {
          await updateDoctorMutation.mutateAsync({
            id: doctorId,
            version: version ?? 1,
            changes: {
              name: data.name,
              specialization: data.specialty,
              hospital: hospitalName,
              phone: data.phone,
              email: data.email,
            },
          });

          const updated = updateDoctor(doctorId, {
            ...data,
            hospital: hospitalName,
            department: data.department || hospitalName,
          });

          if (updated) {
            showToast(`Doctor ${updated.name} updated successfully.`);
          }
          onSuccess?.();
          return;
        } catch {
          return;
        }
      }

      try {
        await createDoctorMutation.mutateAsync({
          name: data.name,
          specialization: data.specialty,
          hospital: hospitalName,
          phone: data.phone,
          email: data.email,
        });

        const created = addDoctor({
          ...data,
          hospital: hospitalName,
          department: data.department || hospitalName,
        });

        showToast(`Doctor ${created.name} successfully registered.`);
        reset();
        onSuccess?.();
      } catch {
        return;
      }
    } catch (err) {
      console.error('Failed to save doctor', err);
    }
  };

  const isDrawer = layout === 'drawer';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={isDrawer ? 'flex flex-1 flex-col justify-between overflow-hidden' : 'space-y-0'}
    >
      <div className={isDrawer ? 'flex-1 space-y-6 overflow-y-auto px-6 py-5' : 'space-y-6 px-6 pb-6 pt-2'}>
        {/* Section 1: Professional Profile */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-line/60 pb-2">
            <span className="grid size-6 place-items-center rounded-md bg-brand-50 text-brand-700">
              <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Professional Profile
            </h4>
          </div>

          {/* Full Name with smart "Dr." quick prepend */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="d-name" className="block text-sm font-medium text-ink">
                Full name <span className="text-rose-500">*</span>
              </label>
              {!nameValue?.startsWith('Dr.') && (
                <button
                  type="button"
                  onClick={() => {
                    setValue('name', `Dr. ${nameValue?.replace(/^Dr\.?\s*/i, '') || ''}`, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                >
                  + Add &quot;Dr.&quot; prefix
                </button>
              )}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="d-name"
                type="text"
                placeholder="Dr. Full name"
                {...register('name')}
                className={`block h-10 w-full rounded-lg border bg-white pl-9.5 pr-3 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-4 ${
                  errors.name
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-line focus:border-brand-500 focus:ring-brand-500/15'
                }`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          {/* 2-column Specialization & Hospital */}
          <div className={isDrawer ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
            {/* Specialization */}
            <div>
              <label htmlFor="d-spec" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                <svg className="size-3.5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                  <circle cx="20" cy="10" r="2" />
                </svg>
                <span>Specialization <span className="text-rose-500">*</span></span>
              </label>
              <SpecializationCombobox
                id="d-spec"
                value={specialtyValue}
                onChange={(val) => {
                  setValue('specialty', val, { shouldValidate: true, shouldDirty: true });
                }}
                error={errors.specialty?.message}
              />
              {errors.specialty ? (
                <p className="mt-1 text-xs text-rose-600">{errors.specialty.message}</p>
              ) : (
                <p id="d-spec-msg" className="mt-1.5 text-xs text-muted">
                  Select existing or type a custom specialty.
                </p>
              )}
            </div>

            {/* Hospital */}
            <div>
              <label htmlFor="d-hosp" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                <svg className="size-3.5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 21h18" />
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                  <path d="M10 9h4" />
                  <path d="M12 7v4" />
                </svg>
                <span>Hospital <span className="text-rose-500">*</span></span>
              </label>
              <HospitalCombobox
                id="d-hosp"
                value={hospitalValue}
                onChange={(val) => {
                  setValue('hospital', val, { shouldValidate: true, shouldDirty: true });
                  setValue('department', val);
                }}
                error={errors.hospital?.message}
              />
              {errors.hospital && <p className="mt-1 text-xs text-rose-600">{errors.hospital.message}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Availability */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-line/60 pb-2">
            <span className="grid size-6 place-items-center rounded-md bg-brand-50 text-brand-700">
              <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Contact & Availability
            </h4>
          </div>

          <div className={isDrawer ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
            {/* Phone */}
            <div>
              <label htmlFor="d-phone" className="mb-1.5 block text-sm font-medium text-ink">
                Phone number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <input
                  id="d-phone"
                  type="tel"
                  placeholder="e.g. +1-555-0101 or 01712345678"
                  {...register('phone')}
                  className={`block h-10 w-full rounded-lg border bg-white pl-9.5 pr-3 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-4 ${
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
              <label htmlFor="d-email" className="mb-1.5 block text-sm font-medium text-ink">
                Email address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="d-email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  {...register('email')}
                  className={`block h-10 w-full rounded-lg border bg-white pl-9.5 pr-3 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-4 ${
                    errors.email
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-line focus:border-brand-500 focus:ring-brand-500/15'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
            </div>

            {/* Interactive Segmented Availability Status */}
            <div className={isDrawer ? '' : 'sm:col-span-2'}>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Practice status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-canvas/60 p-1">
                <button
                  type="button"
                  onClick={() => setValue('status', 'Active', { shouldValidate: true, shouldDirty: true })}
                  className={`flex h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold transition-all cursor-pointer ${
                    statusValue === 'Active'
                      ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-600/20'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>Active</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('status', 'Inactive', { shouldValidate: true, shouldDirty: true })}
                  className={`flex h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold transition-all cursor-pointer ${
                    statusValue === 'Inactive'
                      ? 'bg-white text-slate-700 shadow-xs ring-1 ring-slate-400/30'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <span className="size-2 rounded-full bg-slate-400" />
                  <span>Inactive</span>
                </button>
              </div>
              <input type="hidden" {...register('status')} />
              {errors.status && <p className="mt-1 text-xs text-rose-600">{errors.status.message}</p>}
            </div>
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
          disabled={isSubmitting || isPending}
          data-testid="btn-submit-doctor"
          className={`inline-flex h-10 px-4 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm transition-colors bg-brand-600 font-semibold text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer shadow-xs ${
            isDrawer ? 'flex-1' : ''
          }`}
        >
          {isSubmitting || isPending ? (
            <>
              <svg className="size-4 animate-spin shrink-0 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
