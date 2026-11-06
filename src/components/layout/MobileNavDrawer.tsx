'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMockStore } from '@/lib/mock/store';
import { useCurrentUser } from '@/features/auth/hooks';
import { Logo } from '@/components/brand';

const emptySubscribe = () => () => {};

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export function MobileNavDrawer({ isOpen, onClose, onSignOut }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [visible, setVisible] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(isOpen);

  // Synchronize visibility during render if opening
  if (isOpen && !visible) {
    setVisible(true);
  }

  // Handle enter animation frame and exit timeout
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen) {
      const frame = requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      return () => cancelAnimationFrame(frame);
    } else if (visible) {
      const frame = requestAnimationFrame(() => {
        setIsAnimating(false);
      });
      timer = setTimeout(() => {
        setVisible(false);
      }, 200);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
    }
  }, [isOpen, visible]);

  const { data: me } = useCurrentUser();
  const doctors = useMockStore((state) => state.doctors);
  const patients = useMockStore((state) => state.patients);

  const displayName = me?.name || 'Nadia Islam';
  const displayRole = me?.role ? (me.role === 'admin' ? 'Admin' : 'Staff') : 'Admin';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const totalDoctors = doctors.length;
  const totalPatients = patients.length;
  const prevPathnameRef = useRef(pathname);

  // Close drawer on path change
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Handle ESC key and backdrop
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scrolling when drawer is open
  useEffect(() => {
    if (!visible) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [visible]);

  if (!visible || !mounted) return null;

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
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
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
    {
      name: 'Doctors',
      href: '/doctors',
      count: totalDoctors,
      icon: (
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
          <path d="M11 2v2" />
          <path d="M5 2v2" />
          <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
          <path d="M8 15a6 6 0 0 0 12 0v-3" />
          <circle cx="20" cy="10" r="2" />
        </svg>
      ),
    },
    {
      name: 'Patients',
      href: '/patients',
      count: totalPatients,
      icon: (
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
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return createPortal(
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-200 ease-out ${
        isAnimating ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 min-h-screen bg-ink/40 backdrop-blur-xs"
      />

      {/* Slide-over Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed inset-y-0 left-0 flex h-full min-h-screen w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl will-change-transform ${
          isAnimating
            ? 'translate-x-0 transition-transform duration-200 ease-out'
            : '-translate-x-full transition-transform duration-150 ease-in'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex h-14 items-center justify-between border-b border-line pl-4 pr-2">
          <Logo href="/dashboard" onClick={onClose} prefetch={false} />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="inline-grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink cursor-pointer"
          >
            <svg
              className="size-5 shrink-0"
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

        {/* Navigation Links */}
        <nav aria-label="Main" className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                prefetch={false}
                className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand-800'
                    : 'font-medium text-muted hover:bg-canvas hover:text-ink'
                }`}
              >
                {item.icon}
                {item.name}
                {item.count !== undefined && (
                  <span
                    className={`ml-auto text-xs tabular-nums ${
                      isActive ? 'text-brand-800 font-semibold' : 'text-muted'
                    }`}
                  >
                    {item.count.toLocaleString()}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100"
            >
              {initials}
            </span>
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium text-ink">{displayName}</p>
              <p className="truncate text-xs text-muted">{displayRole}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 cursor-pointer"
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Log out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
