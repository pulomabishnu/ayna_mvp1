import { useEffect, useRef } from 'react';

/** Keep Tab inside a dialog and give focus back to where it was when the dialog closes. */
export function useFocusTrap(active = true) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.activeElement;
    const node = ref.current;
    const items = () => (node ? [...node.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((el) => el.getClientRects().length) : []);
    if (node && !node.contains(document.activeElement)) (items()[0] || node).focus?.();
    const onKey = (e) => {
      if (e.key !== 'Tab' || !node) return;
      const list = items();
      if (!list.length) return;
      const first = list[0]; const last = list[list.length - 1];
      if (!node.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); if (prev && typeof prev.focus === 'function') prev.focus(); };
  }, [active]);
  return ref;
}
