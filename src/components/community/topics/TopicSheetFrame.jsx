import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSheetViewport, backdropTap } from '../useSheetViewport.js';
import { autofocusTarget } from '../../../utils/delightRuntime.js';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The host screen's own sheet look, so topic sheets match every other
 * Community sheet: website = cm-sheet (centred card, bottom sheet on phones),
 * app = am-sheet (bottom sheet). Esc closes, Tab stays inside, focus goes
 * back to what opened it.
 */
export default function TopicSheetFrame({ variant = 'web', title, onClose, children, className = '' }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useSheetViewport(true);
  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    const first = autofocusTarget(node, FOCUSABLE); // no surprise keyboard (utils/delightRuntime.js)
    (first || node)?.focus({ preventScroll: true });
    const onKey = (e) => {
      const wrap = wrapRef.current;
      const all = document.querySelectorAll('.cm-sheet-backdrop, .am-sheet-backdrop');
      if (all[all.length - 1] !== wrap) return;
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab' || !wrap) return;
      const items = [...wrap.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === a || !wrap.contains(document.activeElement))) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && (document.activeElement === z || !wrap.contains(document.activeElement))) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, []);

  const app = variant === 'app';
  const host = (app ? document.querySelector('.ayna-mobile .am-screen') || document.querySelector('.ayna-mobile') : document.querySelector('.app-container')) || document.body;
  const close = <button type="button" className={app ? 'ut-close' : 'cm-sheet-close'} aria-label="Close" onClick={onClose}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
  </button>;
  return createPortal(<div ref={wrapRef} className={app ? 'am-sheet-backdrop' : 'cm-sheet-backdrop'} {...backdropTap(onClose)}>
    <div ref={ref} tabIndex={-1} className={`${app ? 'am-sheet am-compose-sheet' : 'cm-sheet'} ut-sheet${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
      {app ? <div className="am-sheet-head"><h2 id={titleId}>{title}</h2>{close}</div> : <header><h2 id={titleId}>{title}</h2>{close}</header>}
      {children}
    </div>
  </div>, host);
}
