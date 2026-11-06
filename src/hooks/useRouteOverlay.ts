'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface UseRouteOverlayOptions {
  exitDuration?: number;
  onDismiss?: () => void;
}

export function useRouteOverlay(options: UseRouteOverlayOptions = {}) {
  const { exitDuration = 150, onDismiss } = options;
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Trigger enter transition on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Lock background body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      if (onDismiss) {
        onDismiss();
      } else {
        router.back();
      }
    }, exitDuration);
  }, [isClosing, onDismiss, router, exitDuration]);

  // Escape key dismiss listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  return { isOpen, isClosing, handleClose };
}
