const HeartIcon = ({ stroke }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" />
  </svg>
);

function Tab({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ position: 'relative', border: 0, background: 'transparent', padding: '8px 0 10px', color: active ? 'var(--ayna-deep-space)' : 'var(--ayna-text-faint)', fontWeight: active ? 750 : 600, fontSize: 'calc(12px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}>
      {label}
      {active && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 2, height: 2, borderRadius: 999, background: 'var(--ayna-purple)' }} />}
    </button>
  );
}

export default function MobileHeader({
  variant = 'light',
  initial = 'A',
  activeTab = 'browse',
  onGoBrowse,
  onGoEco,
  onOpenSaved,
  onGoLanding,
  onOpenProfile,
}) {
  const dark = variant === 'dark';
  return (
    <header style={{ paddingTop: 'max(18px, env(safe-area-inset-top))', paddingLeft: 20, paddingRight: 20, background: dark ? '#0B0E1F' : 'var(--ayna-bg)', color: dark ? '#fff' : 'var(--ayna-text)', position: 'relative', zIndex: 5 }}>
      <div style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={dark ? onGoLanding : undefined} style={{ border: 0, padding: 0, background: 'transparent', color: 'inherit', fontSize: 'calc(22px * var(--ayna-text-scale, 1))', fontWeight: 800, letterSpacing: '-.04em', cursor: dark ? 'pointer' : 'default' }}>ayna</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <button type="button" onClick={onOpenSaved} aria-label="Saved" style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--ayna-border)', background: dark ? 'rgba(255,255,255,.06)' : '#fff', display: 'grid', placeItems: 'center', color: dark ? '#fff' : 'var(--ayna-purple)', cursor: 'pointer' }}><HeartIcon stroke="currentColor" /></button>
          <button type="button" onClick={onOpenProfile} aria-label="Open profile" style={{ width: 36, height: 36, borderRadius: '50%', border: 0, background: 'var(--ayna-deep-space)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 'calc(12px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}>{initial}</button>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 22, borderBottom: '1px solid var(--ayna-border)', marginTop: 3 }}>
        <Tab label="Explore" active={activeTab === 'browse'} onClick={onGoBrowse} />
        <Tab label="Ecosystem" active={activeTab === 'eco'} onClick={onGoEco} />
      </nav>
    </header>
  );
}
