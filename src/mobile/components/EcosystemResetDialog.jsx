export default function EcosystemResetDialog({ open, busy, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="ayna-ecosystem-reset-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="ayna-reset-title" aria-describedby="ayna-reset-description" onClick={(event) => event.stopPropagation()} style={{ width: 'min(360px,calc(100% - 36px))', padding: 22, borderRadius: 24, background: 'var(--ayna-surface)', color: 'var(--ayna-text)', border: '1px solid var(--ayna-border)', boxShadow: '0 24px 60px rgba(20,20,30,.25)' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#A54D3C', marginBottom: 8 }}>Please check before resetting</div>
        <h2 id="ayna-reset-title" style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 25, lineHeight: 1.2, color: 'var(--ayna-heading)', margin: '0 0 10px' }}>Delete your Ecosystem?</h2>
        <p id="ayna-reset-description" style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ayna-text-muted)', margin: '0 0 18px' }}>
          This removes your Ecosystem products, product tracking, and intake answers so you can start again. Your account, saved products, check-ins, and community activity stay.
        </p>
        <div style={{ display: 'flex', gap: 9 }}>
          <button type="button" disabled={busy} onClick={onCancel} style={{ flex: 1, border: '1px solid var(--ayna-border)', borderRadius: 99, padding: 12, background: 'var(--ayna-surface)', color: 'var(--ayna-heading)', fontWeight: 600, cursor: 'pointer' }}>Keep my Ecosystem</button>
          <button type="button" disabled={busy} onClick={onConfirm} style={{ flex: 1, border: 0, borderRadius: 99, padding: 12, background: '#9C4434', color: '#fff', fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Resetting…' : 'Delete Ecosystem'}</button>
        </div>
      </section>
    </div>
  );
}
