'use client';

import { useState, useEffect, useRef } from 'react';

interface CustomDatePopoverProps {
  onClose: () => void;
  onApply: (from: string, to: string) => void;
  initialFrom?: string;
  initialTo?: string;
}

export function CustomDatePopover({
  onClose,
  onApply,
  initialFrom = '',
  initialTo = '',
}: CustomDatePopoverProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus first input on mount
    fromInputRef.current?.focus();

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to && from > to) {
      setError('Start date cannot be after end date.');
      return;
    }
    setError(null);
    onApply(from, to);
    onClose();
  };

  const handleReset = () => {
    setFrom('');
    setTo('');
    setError(null);
    onApply('', '');
    onClose();
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-date-title"
      className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-line bg-white p-4 shadow-xl ring-1 ring-black/5"
    >
      <form onSubmit={handleApply} className="space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <span id="custom-date-title" className="text-xs font-semibold uppercase tracking-wider text-muted">
            Custom Date Range
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close custom date range popover"
            className="text-muted hover:text-ink text-sm font-medium transition-colors"
          >
            &times;
          </button>
        </div>

        {error && (
          <div role="alert" className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="dashboard-custom-from" className="block text-xs font-medium text-ink">
            From Date
          </label>
          <input
            ref={fromInputRef}
            id="dashboard-custom-from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              if (error) setError(null);
            }}
            className="h-8 w-full rounded-md border border-line px-2 text-xs text-ink focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dashboard-custom-to" className="block text-xs font-medium text-ink">
            To Date
          </label>
          <input
            id="dashboard-custom-to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              if (error) setError(null);
            }}
            className="h-8 w-full rounded-md border border-line px-2 text-xs text-ink focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-muted hover:text-ink font-medium transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition-colors shadow-xs"
            >
              Apply
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
