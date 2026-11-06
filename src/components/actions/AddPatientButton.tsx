'use client';

import Link from 'next/link';

export interface AddPatientButtonProps {
  isAdmin: boolean;
  testId?: string;
  variant?: 'primary' | 'outline';
  className?: string;
  onSuccess?: () => void;
}

export function AddPatientButton({
  isAdmin,
  testId = 'btn-add-patient',
  variant = 'outline',
  className = '',
}: AddPatientButtonProps) {
  if (!isAdmin) return null;

  const baseStyles =
    'inline-flex h-9 sm:h-10 px-3.5 sm:px-4 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer';

  const variantStyles =
    variant === 'primary'
      ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow'
      : 'border border-line bg-white text-ink hover:bg-canvas shadow-xs hover:border-line-strong';

  const iconClass = variant === 'primary' ? 'text-white' : 'text-muted';

  return (
    <Link
      href="/patients/new"
      prefetch={false}
      data-testid={testId}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      <svg
        className={`size-4 shrink-0 ${iconClass}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
      <span>Add patient</span>
    </Link>
  );
}
