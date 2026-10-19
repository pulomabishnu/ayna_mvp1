import { useEffect, useRef, useState } from 'react';
import { freshStartWarning } from '../../utils/quizRedo.js';

const sheet = { width: 'min(380px,calc(100% - 36px))', maxHeight: 'calc(100% - 36px)', overflow: 'auto', padding: 22, borderRadius: 16, background: 'var(--ayna-bg)', color: 'var(--ayna-text)', border: '1px solid var(--ayna-border)' };
const h2 = { fontFamily: 'var(--ayna-font-display)', fontSize: 25, lineHeight: 1.2, color: 'var(--ayna-heading)', margin: '0 0 10px' };
const muted = { fontSize: 14, lineHeight: 1.55, color: 'var(--ayna-text-muted)', margin: 0 };
const option = { display: 'block', width: '100%', textAlign: 'left', margin: '0 0 10px', padding: '14px 16px', minHeight: 48, borderRadius: 14, border: '1px solid var(--ayna-border)', background: 'transparent', color: 'var(--ayna-heading)', cursor: 'pointer', font: 'inherit' };
const btn = { flex: 1, minHeight: 48, border: '1px solid var(--ayna-border)', borderRadius: 12, padding: 12, background: 'transparent', color: 'var(--ayna-heading)', fontWeight: 600, cursor: 'pointer' };
const DANGER = '#9C4434';

/**
 * Redo quiz / reset, on the app.
 *  step="choose":  keep my products and add new ones, or start fresh.
 *  step="confirm": the second warning for start fresh (also what "Reset
 *                  Ecosystem" opens), with exactly what is deleted and the count.
 */
export default function EcosystemResetDialog({ open, busy, step: initialStep = 'confirm', productCount = 0, trackedCount = 0, onCancel, onConfirm, onKeep }) {
  const dialogRef = useRef(null);
  const [step, setStep] = useState(initialStep);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    dialogRef.current?.querySelector('button')?.focus();
    return () => previous?.focus?.();
  }, [open, step]);
  if (!open) return null;
  const w = freshStartWarning({ productCount, trackedCount });

  const keys = (event) => {
    if (event.key === 'Escape' && !busy) onCancel();
    if (event.key === 'Tab') {
      const buttons = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
      if (!buttons.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    }
  };

  return (
    <div className="ayna-ecosystem-reset-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      {step === 'choose' ? (
        <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ayna-redo-title" onClick={(event) => event.stopPropagation()} onKeyDown={keys} style={sheet}>
          <h2 id="ayna-redo-title" style={h2}>Redo the quiz</h2>
          <p style={{ ...muted, margin: '0 0 16px' }}>What should happen to the {productCount} product{productCount === 1 ? '' : 's'} in your Ecosystem?</p>
          <button type="button" onClick={onKeep} style={{ ...option, background: 'var(--ayna-accent-soft, transparent)', borderWidth: 2, borderColor: 'var(--ayna-heading)' }}>
            <strong style={{ display: 'block', fontSize: 16, marginBottom: 4 }}>Keep my products and add new ones</strong>
            <span style={muted}>Everything you have stays. New matches from your answers are added.</span>
          </button>
          <button type="button" onClick={() => setStep('confirm')} style={option}>
            <strong style={{ display: 'block', fontSize: 16, marginBottom: 4, color: DANGER }}>Start fresh</strong>
            <span style={muted}>Clear your Ecosystem and build a new one from your new answers.</span>
          </button>
          <button type="button" onClick={onCancel} style={{ ...btn, width: '100%', border: 0, textDecoration: 'underline' }}>Cancel</button>
        </section>
      ) : (
        <section ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="ayna-reset-title" aria-describedby="ayna-reset-description" onClick={(event) => event.stopPropagation()} onKeyDown={keys} style={{ ...sheet, borderColor: DANGER }}>
          <h2 id="ayna-reset-title" style={h2}>{w.title}</h2>
          <div id="ayna-reset-description" style={{ fontSize: 14, lineHeight: 1.55 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700 }}>This deletes:</p>
            <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>{w.clears.map((c) => <li key={c}>{c}</li>)}</ul>
            <p style={{ margin: '0 0 4px', fontWeight: 700 }}>This stays:</p>
            <ul style={{ margin: '0 0 12px', paddingLeft: 20, color: 'var(--ayna-text-muted)' }}>{w.keeps.map((c) => <li key={c}>{c}</li>)}</ul>
            <p style={{ margin: '0 0 18px', padding: '10px 12px', borderRadius: 10, background: '#f6d4cc', color: '#6e2a1f', fontWeight: 700 }}>{w.permanence}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 9 }}>
            <button type="button" disabled={busy} onClick={initialStep === 'choose' ? () => setStep('choose') : onCancel} style={btn}>{initialStep === 'choose' ? 'Go back' : 'Cancel'}</button>
            <button type="button" disabled={busy} onClick={onConfirm} style={{ ...btn, border: 0, background: DANGER, color: '#fff', fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Deleting…' : w.confirmLabel}</button>
          </div>
        </section>
      )}
    </div>
  );
}
