const HeartIcon = ({ stroke }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" />
  </svg>
);

function Tab({ label, active, dark, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: 'center',
        padding: '9px 0',
        borderRadius: 99,
        cursor: 'pointer',
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 600,
        fontSize: 13.5,
        background: active ? (dark ? '#FFF9F2' : '#FFFCF9') : 'transparent',
        color: active ? '#292524' : dark ? 'rgba(255,249,242,.7)' : '#78716C',
        boxShadow: active && !dark ? '0 1px 3px rgba(41,37,36,.10)' : active && dark ? '0 1px 3px rgba(0,0,0,.18)' : 'none',
        transition: 'background .18s',
      }}
    >
      {label}
    </div>
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
}) {
  const dark = variant === 'dark';

  return (
    <div
      style={{
        padding: '58px 20px 12px',
        background: dark ? '#242A52' : '#F3EFE9',
        color: dark ? '#FFF9F2' : '#292524',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div
          onClick={dark ? onGoLanding : undefined}
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 25,
            letterSpacing: 0.5,
            cursor: dark ? 'pointer' : 'default',
          }}
        >
          ayna
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            onClick={onOpenSaved}
            style={{
              width: 34,
              height: 34,
              borderRadius: 99,
              border: dark ? '1px solid rgba(255,255,255,.28)' : '1px solid #E1D5CE',
              background: dark ? 'rgba(255,249,242,.12)' : '#FFFCF9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <HeartIcon stroke={dark ? '#FFC774' : '#A2603C'} />
          </div>
          <div
            onClick={dark ? undefined : onGoEco}
            style={{
              width: 34,
              height: 34,
              borderRadius: 99,
              border: dark ? '1px solid rgba(255,255,255,.28)' : '1px solid #E1D5CE',
              background: dark ? 'rgba(255,249,242,.12)' : '#FFFCF9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              color: dark ? '#FFF9F2' : '#78716C',
              cursor: dark ? 'default' : 'pointer',
            }}
          >
            {initial}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          background: dark ? 'rgba(255,249,242,.14)' : '#EAE3DA',
          borderRadius: 99,
          padding: 3,
          gap: 2,
        }}
      >
        <Tab label="Browse" active={activeTab === 'browse'} dark={dark} onClick={onGoBrowse} />
        <Tab label="My Ecosystem" active={activeTab === 'eco'} dark={dark} onClick={onGoEco} />
      </div>
    </div>
  );
}
