function GradientBanner({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        margin: '0 20px 20px',
        borderRadius: 24,
        padding: 20,
        background: 'linear-gradient(135deg,#242A52 0%,#4E3866 52%,#A2603C 100%)',
        color: '#FFFCF9',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 24px rgba(36,42,82,.18)',
      }}
    >
      <div style={{ position: 'absolute', right: -38, top: -38, width: 150, height: 150, borderRadius: 99, border: '1px solid rgba(255,255,255,.16)' }} />
      <div style={{ position: 'absolute', right: -8, top: 16, width: 92, height: 92, borderRadius: 99, border: '1px solid rgba(255,255,255,.12)' }} />
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, lineHeight: 1.2, margin: '10px 0 6px', maxWidth: 230 }}>
        Build your ecosystem
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <div
          style={{
            background: '#FFC774',
            color: '#292524',
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: 13,
            padding: '9px 18px',
            borderRadius: 99,
            animation: 'ay-bob 2.5s ease-in-out infinite',
          }}
        >
          Start
        </div>
      </div>
    </div>
  );
}

function InlineRow({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        margin: '0 20px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        border: '1px solid #E1D5CE',
        borderRadius: 18,
        background: '#FFFCF9',
        cursor: 'pointer',
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 99, background: 'linear-gradient(135deg,#242A52,#A2603C)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14 }}>Build your ecosystem</div>
        <div style={{ fontSize: 12, color: '#78716C', marginTop: 2 }}>6 steps</div>
      </div>
      <div style={{ color: '#A2603C', fontSize: 16 }}>→</div>
    </div>
  );
}

function StickyPill({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 44,
        background: '#292524',
        color: '#FFFCF9',
        borderRadius: 99,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxShadow: '0 12px 28px rgba(41,37,36,.24)',
        zIndex: 30,
      }}
    >
      <div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14 }}>Build your ecosystem</div>
        <div style={{ fontSize: 11, opacity: 0.62, marginTop: 1 }}>6 steps · 90 seconds</div>
      </div>
      <div
        style={{
          background: '#FFC774',
          color: '#292524',
          width: 32,
          height: 32,
          borderRadius: 99,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
        }}
      >
        →
      </div>
    </div>
  );
}

export default function CtaBanner({ variant = 'gradient', onClick }) {
  if (variant === 'inline') return <InlineRow onClick={onClick} />;
  if (variant === 'pill') return <StickyPill onClick={onClick} />;
  return <GradientBanner onClick={onClick} />;
}
