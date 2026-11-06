import Link from 'next/link';
import { Logo } from '@/components/brand';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo href="/dashboard" size="lg" />
        </div>
        <p className="text-sm font-semibold tracking-wider text-brand-600 uppercase">404 error</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Page not found</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Sorry, we couldn&apos;t find the page or patient record you&apos;re looking for.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/doctors"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas"
          >
            View Doctors
          </Link>
        </div>
      </div>
    </div>
  );
}

