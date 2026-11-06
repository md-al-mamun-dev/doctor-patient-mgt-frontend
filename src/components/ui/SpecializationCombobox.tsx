'use client';

import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { useMockStore } from '@/lib/mock/store';
import { useSpecializations, useCreateSpecialization } from '@/features/specializations/hooks';

interface SpecializationComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  id?: string;
}

export function SpecializationCombobox({
  value = '',
  onChange,
  error,
  disabled = false,
  id = 'd-spec',
}: SpecializationComboboxProps) {
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
  const storeSpecializations = useMockStore((state) => state.specializations);
  const addSpecializationStore = useMockStore((state) => state.addSpecialization);

  // Read from API
  const { data: apiSpecializations } = useSpecializations();
  const createSpecializationMutation = useCreateSpecialization();

  // Combine and deduplicate specialization list
  const allSpecializations = useMemo(() => {
    const map = new Map<string, string>();
    // Start with store specializations
    for (const s of storeSpecializations || []) {
      if (s.name) map.set(s.name.toLowerCase(), s.name);
    }
    // Overlay API specializations if available
    if (apiSpecializations && Array.isArray(apiSpecializations)) {
      for (const s of apiSpecializations) {
        if (s.name) map.set(s.name.toLowerCase(), s.name);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [storeSpecializations, apiSpecializations]);

  // Filter specializations based on user input
  const filteredSpecializations = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return allSpecializations;
    return allSpecializations.filter((s) => s.toLowerCase().includes(q));
  }, [allSpecializations, inputValue]);

  // Check if typed value is an exact match
  const trimmed = inputValue.trim();
  const exactMatch = allSpecializations.some((s) => s.toLowerCase() === trimmed.toLowerCase());
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

  const selectSpecialization = (specializationName: string) => {
    onChange(specializationName);
    setInputValue(specializationName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateAndSelect = async (newSpecializationName: string) => {
    const name = newSpecializationName.trim();
    if (!name) return;

    // Call API (fails gracefully if offline)
    await createSpecializationMutation.mutateAsync({ name }).catch(() => {});

    // Update store
    addSpecializationStore(name);

    selectSpecialization(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const totalOptions = filteredSpecializations.length + (canAddNew ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? totalOptions - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (canAddNew && highlightedIndex === filteredSpecializations.length) {
        handleCreateAndSelect(trimmed);
      } else if (highlightedIndex >= 0 && highlightedIndex < filteredSpecializations.length) {
        selectSpecialization(filteredSpecializations[highlightedIndex]);
      } else if (filteredSpecializations.length > 0) {
        selectSpecialization(filteredSpecializations[0]);
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
          data-testid="input-doctor-specialization"
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
          aria-label="Toggle specialization options"
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
          data-testid="specialization-combobox-list"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg focus:outline-none text-sm text-ink animate-in fade-in zoom-in-95 duration-100"
        >
          {filteredSpecializations.map((s, index) => {
            const isHighlighted = highlightedIndex === index;
            const isSelected = s.toLowerCase() === value.trim().toLowerCase();

            return (
              <li
                key={s}
                role="option"
                aria-selected={isSelected}
                data-testid={`specialization-option-${s.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}
                onClick={() => selectSpecialization(s)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-canvas text-ink' : 'text-ink'
                } ${isSelected ? 'font-semibold text-brand-700 bg-brand-50/50' : ''}`}
              >
                <span>{s}</span>
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
              data-testid="specialization-option-add-new"
              onClick={() => handleCreateAndSelect(trimmed)}
              onMouseEnter={() => setHighlightedIndex(filteredSpecializations.length)}
              className={`flex items-center gap-2 border-t border-line/60 px-3 py-2 text-xs font-semibold text-brand-700 cursor-pointer transition-colors ${
                highlightedIndex === filteredSpecializations.length ? 'bg-brand-50' : 'bg-canvas/30 hover:bg-brand-50'
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
              <span>Add &ldquo;{trimmed}&rdquo; as new specialization</span>
            </li>
          )}

          {filteredSpecializations.length === 0 && !canAddNew && (
            <li className="px-3 py-3 text-center text-xs text-muted">No specializations found.</li>
          )}
        </ul>
      )}
    </div>
  );
}

