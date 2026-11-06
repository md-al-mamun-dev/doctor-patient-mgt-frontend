'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrentUser } from '@/features/auth/hooks';
import { ThemeToggle } from './ThemeToggle';

interface UserMenuProps {
  onSignOut: () => void;
  isSigningOut?: boolean;
}

export function UserMenu({ onSignOut, isSigningOut = false }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: me } = useCurrentUser();

  const displayName = me?.name || 'Nadia Islam';
  const email = me?.email || 'admin@doctortracker.dev';
  const roleName = me?.role ? (me.role === 'admin' ? 'Admin' : 'Staff') : 'Admin';
  const roleDescription =
    me?.role === 'staff' ? 'Staff, clinical access' : 'Admin, full access';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open user menu"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-canvas sm:pr-2 cursor-pointer"
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100"
        >
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-ink">{displayName}</span>
          <span className="block text-xs leading-tight text-muted">{roleName}</span>
        </span>
        <span
          className={`hidden text-muted transition-transform duration-200 sm:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
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
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-white p-1.5 shadow-xl shadow-black/10 ring-1 ring-black/5"
        >
          <div className="px-3 py-2.5">
            <p className="text-sm font-medium text-ink">{displayName}</p>
            <p className="text-xs text-muted">{email}</p>
            <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-200">
              {roleDescription}
            </span>
          </div>

          <div className="my-1 h-px bg-line" />

          <ThemeToggle showLabel />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
            disabled={isSigningOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-50 cursor-pointer"
          >
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span>{isSigningOut ? 'Signing out...' : 'Log out'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

