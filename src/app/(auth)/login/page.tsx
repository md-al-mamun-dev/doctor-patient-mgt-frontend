import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/LoginForm';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Logo } from '@/components/brand';

export const metadata: Metadata = {
  title: 'Sign in | Doctor Tracker',
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo href="/login" size="md" />
        </div>

        <Suspense fallback={<div className="h-96 animate-pulse bg-muted/10 rounded-2xl mt-8" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-xs text-muted">Access is limited to authorized hospital staff.</p>
      </div>
    </main>
  );
}
