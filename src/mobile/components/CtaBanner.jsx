function GradientBanner({ onClick, title = 'Build your ecosystem', buttonLabel = 'Start' }) {
  return (
    <div
      onClick={onClick}
      style={{
        margin: '0 20px 20px',
        borderRadius: 24,
        padding: 20,
        background: 'linear-gradient(135deg,#1D1A2B 0%,#1D1A2B 52%,#1D1A2B 100%)',
        color: '#FFFFFF',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 24px rgba(36,42,82,.18)',
      }}
    >
      <div style={{ position: 'absolute', right: -38, top: -38, width: 150, height: 150, borderRadius: 99, border: '1px solid rgba(255,255,255,.16)' }} />
      <div style={{ position: 'absolute', right: -8, top: 16, width: 92, height: 92, borderRadius: 99, border: '1px solid rgba(255,255,255,.12)' }} />
      <div style={{ fontFamily: "var(--ayna-font-display)", fontSize: 'calc(26px * var(--ayna-text-scale, 1))', lineHeight: 1.2, margin: '10px 0 6px', maxWidth: 230 }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <div
          style={{
            background: '#F7BADD',
            color: '#171717',
            fontFamily: "var(--ayna-font-ui)",
            fontWeight: 600,
            fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
            padding: '9px 18px',
            borderRadius: 99,
            animation: 'ay-bob 2.5s ease-in-out infinite',
          }}
        >
          {buttonLabel}
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
        border: '1px solid #E0E0D9',
        borderRadius: 18,
        background: '#FFFFFF',
        cursor: 'pointer',
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 99, background: 'linear-gradient(135deg,#1D1A2B,#1D1A2B)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))' }}>Build your ecosystem</div>
        <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: '#626262', marginTop: 2 }}>6 steps</div>
      </div>
      <div style={{ color: '#1D1A2B', fontSize: 'calc(16px * var(--ayna-text-scale, 1))' }}>→</div>
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
        background: '#171717',
        color: '#FFFFFF',
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
        <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))' }}>Build your ecosystem</div>
        <div style={{ fontSize: 'calc(11px * var(--ayna-text-scale, 1))', opacity: 0.62, marginTop: 1 }}>6 steps · 90 seconds</div>
      </div>
      <div
        style={{
          background: '#F7BADD',
          color: '#171717',
          width: 32,
          height: 32,
          borderRadius: 99,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
        }}
      >
        →
      </div>
    </div>
  );
}

export default function CtaBanner({ variant = 'gradient', onClick, title, buttonLabel }) {
  if (variant === 'inline') return <InlineRow onClick={onClick} />;
  if (variant === 'pill') return <StickyPill onClick={onClick} />;
  return <GradientBanner onClick={onClick} title={title} buttonLabel={buttonLabel} />;
}
