export default function RevealScreen({
  topAreas = ['Cycle', 'Energy', 'Sleep'],
  productCount = 0,
  readCount = 0,
  goalCount = 0,
  onContinue,
}) {
  const [orbit1, orbit2, orbit3] = topAreas;
  const caption = `${productCount} products · ${readCount} reads · ${goalCount} goal${goalCount === 1 ? '' : 's'} you named`;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#FAF6F1', color: '#1A1714', position: 'relative', fontFamily: "'DM Sans',system-ui,sans-serif", animation: 'ay-page .25s ease-out' }}>
      <div
        style={{
          position: 'absolute',
          top: -70,
          right: -70,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,199,116,.3),rgba(255,199,116,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(78,56,102,.14),rgba(78,56,102,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingLeft: 24, paddingRight: 24, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20 }}>ayna</span>
          <span style={{ fontSize: 10, color: '#8c8078' }}>beta</span>
        </div>
      </div>

      <div style={{ padding: '30px 24px 0', textAlign: 'center', position: 'relative' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 999,
            background: '#FFEFD6',
            color: '#8a5a1e',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a5a1e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l4 4 10-10" />
          </svg>
          Intake complete
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 500, fontSize: 27, lineHeight: 1.25, margin: '0 0 8px' }}>
          Your ecosystem is ready.
        </div>
        <p style={{ margin: '0 auto', maxWidth: 280, fontSize: 14, color: '#8c8078', lineHeight: 1.5 }}>Built from your answers.</p>
      </div>

      <div style={{ position: 'relative', width: 320, height: 320, margin: '22px auto 0' }}>
        <div
          style={{
            position: 'absolute',
            left: 96,
            top: 96,
            width: 128,
            height: 128,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#242A52 0%,#4E3866 55%,#A2603C 100%)',
            boxShadow: '0 24px 50px -20px rgba(36,42,82,.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'ay-breathe 4s ease-in-out infinite',
            zIndex: 1,
          }}
        >
          <span style={{ color: '#FFFFFF', fontFamily: "'Playfair Display',serif", fontSize: 16 }}>you</span>
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, animation: 'ay-orbit 28s linear infinite' }}>
          {orbit1 && (
            <div style={{ position: 'absolute', left: 114, top: 9, width: 92, height: 38 }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  animation: 'ay-counter 28s linear infinite',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '0 12px',
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(26,23,20,.08)',
                  borderRadius: 999,
                  boxShadow: '0 10px 22px -12px rgba(26,23,20,.3)',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#4E3866', flex: 'none' }} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{orbit1}</span>
              </div>
            </div>
          )}
          {orbit2 && (
            <div style={{ position: 'absolute', left: 228, top: 207, width: 92, height: 38 }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  animation: 'ay-counter 28s linear infinite',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '0 12px',
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(26,23,20,.08)',
                  borderRadius: 999,
                  boxShadow: '0 10px 22px -12px rgba(26,23,20,.3)',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#C0761F', flex: 'none' }} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{orbit2}</span>
              </div>
            </div>
          )}
          {orbit3 && (
            <div style={{ position: 'absolute', left: 0, top: 207, width: 92, height: 38 }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  animation: 'ay-counter 28s linear infinite',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '0 12px',
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(26,23,20,.08)',
                  borderRadius: 999,
                  boxShadow: '0 10px 22px -12px rgba(26,23,20,.3)',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#242A52', flex: 'none' }} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{orbit3}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: '#8c8078', marginTop: 6, position: 'relative' }}>{caption}</div>

      <div style={{ margin: '24px 24px 34px', position: 'relative' }}>
        <button
          onClick={onContinue}
          style={{
            width: '100%',
            padding: 16,
            border: 'none',
            borderRadius: 16,
            background: 'linear-gradient(135deg,#F0A84B,#E8A94F)',
            color: '#1A1714',
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 16px 28px -14px rgba(232,169,79,.9)',
          }}
        >
          See my full ecosystem
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
