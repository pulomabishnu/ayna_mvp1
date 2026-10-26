import { useEffect, useRef } from 'react';

/**
 * The quiet "…" on a Today item (Today audit, Oct 25, issue 2): the things
 * she rarely needs (Useful / Not useful, Stopped using, Turn off check-ins,
 * Hide today) live here, so each item shows one primary action and at most
 * one text link. A <details> so it works without script state, closes on
 * Escape, on a pick and on a tap outside.
 *
 * children: the menu's buttons (Not useful keeps its own reason list).
 */
export default function ItemMenu({ label = 'More options', children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const outside = (e) => { if (el.open && !el.contains(e.target)) el.open = false; };
    const key = (e) => { if (e.key === 'Escape' && el.open) { el.open = false; el.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', outside);
    el.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', outside); el.removeEventListener('keydown', key); };
  }, []);
  // A pick closes the menu, except the toggle that opens Not useful's reasons.
  const onClick = (e) => {
    const b = e.target.closest('button');
    if (b && !b.hasAttribute('aria-expanded') && ref.current) ref.current.open = false;
  };
  return (
    <details ref={ref} className={`ay-today__menu ${className}`.trim()}>
      <summary aria-label={label} title={label}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
      </summary>
      <div className="ay-today__menulist" role="group" aria-label={label} onClick={onClick}>{children}</div>
    </details>
  );
}
