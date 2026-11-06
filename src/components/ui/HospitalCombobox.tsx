'use client';

import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { useMockStore } from '@/lib/mock/store';
import { useHospitals, useCreateHospital } from '@/features/hospitals/hooks';

interface HospitalComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  id?: string;
}

export function HospitalCombobox({
  value = '',
  onChange,
  error,
  disabled = false,
  id = 'd-hosp',
}: HospitalComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Sync internal state during render when external value changes
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
  }

  // Read from store
  const storeHospitals = useMockStore((state) => state.hospitals);
  const addHospitalStore = useMockStore((state) => state.addHospital);

  // Read from API
  const { data: apiHospitals } = useHospitals();
  const createHospitalMutation = useCreateHospital();

  // Combine and deduplicate hospital list
  const allHospitals = useMemo(() => {
    const map = new Map<string, string>();
    // Start with store hospitals
    for (const h of storeHospitals) {
      if (h.name) map.set(h.name.toLowerCase(), h.name);
    }
    // Overlay API hospitals if available
    if (apiHospitals && Array.isArray(apiHospitals)) {
      for (const h of apiHospitals) {
        if (h.name) map.set(h.name.toLowerCase(), h.name);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [storeHospitals, apiHospitals]);

  // Filter hospitals based on user input
  const filteredHospitals = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return allHospitals;
    return allHospitals.filter((h) => h.toLowerCase().includes(q));
  }, [allHospitals, inputValue]);

  // Check if typed value is an exact match
  const trimmed = inputValue.trim();
  const exactMatch = allHospitals.some((h) => h.toLowerCase() === trimmed.toLowerCase());
  const canAddNew = trimmed.length >= 2 && !exactMatch;

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectHospital = (hospitalName: string) => {
    onChange(hospitalName);
    setInputValue(hospitalName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateAndSelect = async (newHospitalName: string) => {
    const name = newHospitalName.trim();
    if (!name) return;

    // Call API (fails gracefully if offline)
    await createHospitalMutation.mutateAsync({ name }).catch(() => {});

    // Update store
    addHospitalStore(name);

    selectHospital(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const totalOptions = filteredHospitals.length + (canAddNew ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? totalOptions - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (canAddNew && highlightedIndex === filteredHospitals.length) {
        handleCreateAndSelect(trimmed);
      } else if (highlightedIndex >= 0 && highlightedIndex < filteredHospitals.length) {
        selectHospital(filteredHospitals[highlightedIndex]);
      } else if (filteredHospitals.length > 0) {
        selectHospital(filteredHospitals[0]);
      } else if (canAddNew) {
        handleCreateAndSelect(trimmed);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const listboxId = useId();

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={inputValue}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
          placeholder="Choose or type"
          data-testid="input-doctor-hospital"
          onChange={(e) => {
            const next = e.target.value;
            setInputValue(next);
            onChange(next);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`block h-10 w-full rounded-lg border bg-white px-3 pr-9 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-4 ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
              : 'border-line focus:border-brand-500 focus:ring-brand-500/15'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle hospital options"
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-ink cursor-pointer"
        >
          <svg
            className={`size-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          data-testid="hospital-combobox-list"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg focus:outline-none text-sm text-ink animate-in fade-in zoom-in-95 duration-100"
        >
          {filteredHospitals.map((h, index) => {
            const isHighlighted = highlightedIndex === index;
            const isSelected = h.toLowerCase() === value.trim().toLowerCase();

            return (
              <li
                key={h}
                role="option"
                aria-selected={isSelected}
                data-testid={`hospital-option-${h.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => selectHospital(h)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-canvas text-ink' : 'text-ink'
                } ${isSelected ? 'font-semibold text-brand-700 bg-brand-50/50' : ''}`}
              >
                <span>{h}</span>
                {isSelected && (
                  <svg
                    className="size-3.5 text-brand-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </li>
            );
          })}

          {/* Quick Add Option */}
          {canAddNew && (
            <li
              role="option"
              aria-selected={false}
              data-testid="hospital-option-add-new"
              onClick={() => handleCreateAndSelect(trimmed)}
              onMouseEnter={() => setHighlightedIndex(filteredHospitals.length)}
              className={`flex items-center gap-2 border-t border-line/60 px-3 py-2 text-xs font-semibold text-brand-700 cursor-pointer transition-colors ${
                highlightedIndex === filteredHospitals.length ? 'bg-brand-50' : 'bg-canvas/30 hover:bg-brand-50'
              }`}
            >
              <svg
                className="size-3.5 shrink-0 text-brand-600"
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
              <span>Add &ldquo;{trimmed}&rdquo; as new hospital</span>
            </li>
          )}

          {filteredHospitals.length === 0 && !canAddNew && (
            <li className="px-3 py-3 text-center text-xs text-muted">No hospitals found.</li>
          )}
        </ul>
      )}
    </div>
  );
}
