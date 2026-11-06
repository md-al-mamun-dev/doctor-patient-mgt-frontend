'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useChangePassword } from '@/features/auth/hooks';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Logo } from '@/components/brand';

interface SetPasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SetPasswordPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordLength, setPasswordLength] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePassword = useChangePassword();

  const onSubmit = async (data: SetPasswordFormData) => {
    setErrorMessage(null);
    if (data.newPassword !== data.confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }
    if (data.newPassword.length < 15) {
      setErrorMessage('New password must be at least 15 characters long.');
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to change password. Please check your current password.'
      );
    }
  };

  const newPasswordRegister = register('newPassword', {
    required: 'New password is required',
    minLength: { value: 15, message: 'Password must be at least 15 characters' },
  });

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-canvas">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="flex justify-center">
          <Logo href="/dashboard" size="md" />
        </div>

        {/* Card */}
        <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,22,0.04)] sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Set new password</h1>
          <p className="mt-1 text-sm text-muted">
            For security, choose a new password that is at least 15 characters long.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Current Password</label>
              <input
                type="password"
                placeholder="Temporary or current password"
                {...register('currentPassword', { required: 'Current password is required' })}
                className="w-full h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">New Password</label>
              <input
                type="password"
                placeholder="At least 15 characters"
                {...newPasswordRegister}
                onChange={(e) => {
                  newPasswordRegister.onChange(e);
                  setPasswordLength(e.target.value.length);
                }}
                className="w-full h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
              {errors.newPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.newPassword.message}</p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                <span
                  className={`size-2 rounded-full ${
                    passwordLength >= 15 ? 'bg-emerald-500' : 'bg-line'
                  }`}
                />
                <span>Must be at least 15 characters ({passwordLength}/15)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                {...register('confirmPassword', { required: 'Please confirm your new password' })}
                className="w-full h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || changePassword.isPending}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting || changePassword.isPending ? 'Updating...' : 'Set new password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
