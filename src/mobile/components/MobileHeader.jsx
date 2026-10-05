const HeartIcon = ({ stroke }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" />
  </svg>
);

export default function MobileHeader({ variant = 'light', onOpenSaved }) {
  const dark = variant === 'dark';
  return <header style={{
    padding: 'max(20px, env(safe-area-inset-top)) 20px 12px',
    background: dark ? '#242A52' : 'var(--ayna-bg)',
    color: dark ? '#FFF9F2' : 'var(--ayna-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'relative', zIndex: 5,
  }}>
    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(25px * var(--ayna-text-scale, 1))', letterSpacing: .5 }}>ayna</span>
    {onOpenSaved && <button type="button" onClick={onOpenSaved} aria-label="Saved products" style={{ width: 36, height: 36, borderRadius: 99, border: dark ? '1px solid rgba(255,255,255,.28)' : '1px solid var(--ayna-border)', background: dark ? 'rgba(255,249,242,.12)' : 'var(--ayna-surface)', display: 'grid', placeItems: 'center' }}><HeartIcon stroke={dark ? '#FFC774' : '#A2603C'} /></button>}
  </header>;
}
