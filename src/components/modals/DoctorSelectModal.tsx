'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMockStore } from '@/lib/mock/store';
import { Doctor } from '@/types';

interface DoctorSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (doctor: Doctor) => void;
  currentDoctorId?: string;
}

const PAGE_SIZE = 5;

export function DoctorSelectModal({
  isOpen,
  onClose,
  onSelect,
  currentDoctorId,
}: DoctorSelectModalProps) {
  const doctors = useMockStore((state) => state.doctors);
  const patients = useMockStore((state) => state.patients);

  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Compute doctor caseload counts
  const caseloadMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of patients) {
      map.set(p.doctorId, (map.get(p.doctorId) || 0) + 1);
    }
    return map;
  }, [patients]);

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        (d.department && d.department.toLowerCase().includes(q)) ||
        (d.hospital && d.hospital.toLowerCase().includes(q))
    );
  }, [doctors, query]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + PAGE_SIZE);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 sm:p-6 backdrop-blur-xs"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-doctor-modal-title"
        data-testid="modal-doctor-picker"
        className="relative flex flex-col w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h3
              id="select-doctor-modal-title"
              className="text-base font-semibold tracking-tight text-ink"
            >
              Select doctor
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Choose an attending physician for this patient.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            data-testid="btn-close-doctor-picker"
            className="inline-grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink -mr-1 -mt-1 cursor-pointer"
          >
            <svg
              className="size-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-line p-3 bg-canvas/40">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
              <svg
                className="size-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, specialty, or hospital..."
              aria-label="Search doctors"
              data-testid="input-doctor-search"
              className="block h-9 w-full rounded-lg border border-line bg-white pl-9 pr-8 text-xs text-ink placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCurrentPage(1);
                }}
                aria-label="Clear search"
                className="absolute inset-y-0 right-2 flex items-center px-1 text-muted hover:text-ink"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Doctor List */}
        <div className="flex-1 overflow-y-auto divide-y divide-line p-2">
          {paginatedDoctors.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs font-medium text-ink">No doctors found</p>
              <p className="mt-1 text-xs text-muted">
                No physician matched &ldquo;{query}&rdquo;.
              </p>
            </div>
          ) : (
            paginatedDoctors.map((doc) => {
              const isSelected = doc.id === currentDoctorId;
              const caseload = caseloadMap.get(doc.id) || 0;
              const initials = doc.name
                .replace(/^Dr\.\s*/i, '')
                .split(' ')
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={doc.id}
                  onClick={() => onSelect(doc)}
                  data-testid={`doctor-picker-row-${doc.id}`}
                  className={`group flex items-center justify-between gap-3 rounded-xl p-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-brand-50/70 ring-1 ring-brand-200' : 'hover:bg-canvas'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 ring-inset ${
                        isSelected
                          ? 'bg-brand-600 text-white ring-brand-600'
                          : 'bg-brand-50 text-brand-700 ring-brand-100 group-hover:bg-white'
                      }`}
                    >
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink truncate">{doc.name}</p>
                        {isSelected && (
                          <span className="rounded bg-brand-100 px-1.5 py-0.2 text-[10px] font-semibold text-brand-800">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate">
                        {doc.specialty} &bull; {doc.hospital || doc.department || 'Square Hospital'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] tabular-nums font-medium text-muted">
                      {caseload} {caseload === 1 ? 'patient' : 'patients'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(doc);
                      }}
                      data-testid={`btn-select-doctor-${doc.id}`}
                      className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-brand-100 text-brand-800'
                          : 'bg-brand-600 text-white hover:bg-brand-700'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-line bg-canvas/60 px-4 py-2.5 text-xs text-muted">
          <span>
            {filteredDoctors.length > 0 ? (
              <>
                Showing <strong className="font-medium text-ink">{startIndex + 1}</strong> to{' '}
                <strong className="font-medium text-ink">
                  {Math.min(startIndex + PAGE_SIZE, filteredDoctors.length)}
                </strong>{' '}
                of <strong className="font-medium text-ink">{filteredDoctors.length}</strong> doctors
              </>
            ) : (
              '0 doctors'
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              data-testid="btn-doctor-picker-prev"
              className="inline-flex h-7 items-center justify-center rounded-md border border-line bg-white px-2 text-xs font-medium text-ink shadow-2xs hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Prev
            </button>
            <span className="px-1 text-[11px] tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              data-testid="btn-doctor-picker-next"
              className="inline-flex h-7 items-center justify-center rounded-md border border-line bg-white px-2 text-xs font-medium text-ink shadow-2xs hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
