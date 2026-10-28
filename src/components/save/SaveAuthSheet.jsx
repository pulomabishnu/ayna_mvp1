import { useEffect, useRef } from 'react';
import './save.css';

/**
 * Save while signed out (team direction 22): say what an account is for,
 * then Continue to sign in; the save finishes after she signs in. She can
 * also keep it on this device for now, so the heart never looks broken.
 */
export default function SaveAuthSheet({ product, onContinue, onKeepHere, onClose, variant = 'app' }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const t = setTimeout(() => ref.current?.querySelector('.ay-sas__primary')?.focus(), 30);
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); try { prev?.focus?.(); } catch { /* gone */ } };
  }, [onClose]);
  if (!product) return null;
  return (
    <div className={`ay-sas-dim is-${variant}`} onClick={onClose}>
      <section ref={ref} className="ay-sas" role="dialog" aria-modal="true" aria-labelledby="ay-sas-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ay-sas__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        <h2 id="ay-sas-title">Save this to your ayna</h2>
        <p>Sign in or create an account to keep products, resources and recommendations in one place.</p>
        <p className="ay-sas__item">{product.name}</p>
        <button type="button" className="ay-sas__primary" onClick={onContinue}>Continue</button>
        {onKeepHere && <button type="button" className="ay-sas__text" onClick={onKeepHere}>Keep it on this device for now</button>}
      </section>
    </div>
  );
}
