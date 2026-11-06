'use client';

import { useUIStore } from '@/lib/store/uiStore';

export function Toast() {
  const toastMessage = useUIStore((state) => state.toastMessage);
  const hideToast = useUIStore((state) => state.hideToast);

  if (!toastMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-ink shadow-lg animate-in slide-in-from-bottom-5 duration-200"
    >
      <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="font-medium">{toastMessage}</span>
      <button
        type="button"
        onClick={hideToast}
        aria-label="Dismiss notification"
        className="ml-2 text-muted hover:text-ink text-xs font-bold"
      >
        &times;
      </button>
    </div>
  );
}

