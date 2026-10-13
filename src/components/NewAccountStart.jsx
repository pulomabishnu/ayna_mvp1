import { useEffect, useRef } from 'react';
import './new-account-start.css';

/**
 * Shown once when Google / Apple sign-in from a sign-in form created a
 * brand-new, empty account (see src/utils/oauthNewAccount.js). One primary
 * action: start the quiz. Used by the website (App.jsx) and the app (MobileApp.jsx).
 */
export default function NewAccountStart({ name = '', onStart, onSignOut, onClose }) {
  const startRef = useRef(null);
  useEffect(() => {
    startRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="ay-newacct" role="presentation">
      <section className="ay-newacct__card" role="dialog" aria-modal="true" aria-labelledby="ay-newacct-title" aria-describedby="ay-newacct-body">
        <button type="button" className="ay-newacct__close" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <span className="ay-newacct__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.2" /></svg>
        </span>
        <h2 id="ay-newacct-title">Let&apos;s build your ecosystem first</h2>
        <p id="ay-newacct-body">
          {name ? `Welcome, ${name}. ` : 'Welcome. '}
          Nothing is saved to this account yet. Answer a few questions and ayna picks products for you.
        </p>
        <button type="button" ref={startRef} className="ay-newacct__primary" onClick={onStart}>Build my ecosystem</button>
        {onSignOut && <button type="button" className="ay-newacct__quiet" onClick={onSignOut}>Not you? Sign out</button>}
      </section>
    </div>
  );
}
