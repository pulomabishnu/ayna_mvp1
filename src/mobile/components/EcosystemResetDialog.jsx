import { useEffect, useRef } from 'react';

export default function EcosystemResetDialog({ open, busy, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    dialogRef.current?.querySelector('button')?.focus();
    return () => previous?.focus?.();
  }, [open]);
  if (!open) return null;

  return (
    <div className="ayna-ecosystem-reset-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      <section ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="ayna-reset-title" aria-describedby="ayna-reset-description" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) onCancel();
        if (event.key === 'Tab') {
          const buttons = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
          if (!buttons.length) { event.preventDefault(); return; }
          if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
          else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
        }
      }} style={{ width: 'min(360px,calc(100% - 36px))', padding: 22, borderRadius: 12, background: 'var(--ayna-bg)', color: 'var(--ayna-text)', border: '1px solid var(--ayna-border)' }}>
        <h2 id="ayna-reset-title" style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 25, lineHeight: 1.2, color: 'var(--ayna-heading)', margin: '0 0 10px' }}>Reset your Ecosystem?</h2>
        <p id="ayna-reset-description" style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ayna-text-muted)', margin: '0 0 18px' }}>
          Clears your Ecosystem, its product tracking, and intake answers. Saved products, check-ins, and your account stay.
        </p>
        <div style={{ display: 'flex', gap: 9 }}>
          <button type="button" disabled={busy} onClick={onCancel} style={{ flex: 1, minHeight: 48, border: '1px solid var(--ayna-border)', borderRadius: 12, padding: 12, background: 'transparent', color: 'var(--ayna-heading)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button type="button" disabled={busy} onClick={onConfirm} style={{ flex: 1, minHeight: 48, border: 0, borderRadius: 12, padding: 12, background: '#9C4434', color: '#fff', fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Resetting…' : 'Reset'}</button>
        </div>
      </section>
    </div>
  );
}
