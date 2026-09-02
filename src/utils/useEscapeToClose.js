import { useEffect } from 'react';

/**
 * Closes a modal on Escape. Every modal in this app previously closed only
 * via backdrop click or an explicit close button — no keyboard path at all
 * (found live, 2026-08-24 bug bash: "Add to Your Ecosystem" and others).
 * `isOpen` guards the listener so a closed/unmounted modal never eats a
 * stray Escape meant for something else on the page.
 */
export function useEscapeToClose(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen || !onClose) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}
