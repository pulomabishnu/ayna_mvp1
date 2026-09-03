import { useState } from 'react';

const DEFAULT_STATS = [
  { label: 'Products', value: 0 },
  { label: 'Reads', value: 0 },
  { label: 'Pillars', value: 0 },
];

export default function SigninScreen({ stats = DEFAULT_STATS, onCreateAccount, onContinueWithApple }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const initial = (name || '').trim().charAt(0).toUpperCase() || '?';

  const handleCreate = () => {
    if (onCreateAccount) onCreateAccount({ name, email });
  };
  const handleApple = () => {
    if (onContinueWithApple) onContinueWithApple({ name, email });
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'linear-gradient(170deg,#242A52 0%,#4E3866 60%,#A2603C 100%)',
        color: '#FFFCF9',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 34,
        display: 'flex',
        flexDirection: 'column',
        animation: 'ay-page .25s ease-out',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              borderRadius: 16,
              padding: '12px 10px',
              background: 'rgba(255,252,249,.13)',
              border: '1px solid rgba(255,255,255,.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 22 }}>{s.value}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, letterSpacing: '.8px', textTransform: 'uppercase', opacity: 0.68, marginTop: 3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, lineHeight: 1.2, marginBottom: 20 }}>
        Save it under
        <br />
        your name.
      </div>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '14px 16px',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 8px 20px -12px rgba(0,0,0,.35)',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 99,
            background: '#FFC774',
            color: '#292524',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontFamily: "'Playfair Display',serif",
            fontSize: 19,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#A8A29E' }}>
            First name
          </div>
          <input
            type="text"
            placeholder="Maya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'DM Sans',sans-serif", fontSize: 17, fontWeight: 500, color: '#292524', width: '100%', padding: '2px 0 0' }}
          />
        </div>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '14px 16px',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 8px 20px -12px rgba(0,0,0,.35)',
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="1.75" style={{ flex: 'none' }}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M4 7l8 6 8-6" />
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#A8A29E' }}>Email</div>
          <input
            type="text"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: '#292524', width: '100%', padding: '3px 0 0' }}
          />
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div
          onClick={handleCreate}
          style={{
            background: '#FFC774',
            color: '#292524',
            textAlign: 'center',
            padding: 15,
            borderRadius: 99,
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 16px 30px -14px rgba(255,199,116,.8)',
          }}
        >
          <span>Create my account</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#292524" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
        <div
          onClick={handleApple}
          style={{
            background: 'rgba(255,252,249,.14)',
            border: '1px solid rgba(255,255,255,.28)',
            textAlign: 'center',
            padding: 15,
            borderRadius: 99,
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 500,
            fontSize: 15,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFF9F2">
            <path d="M16.4 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.3-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.7-1.5 0-2.8.8-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.8.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.1-2.4 1.1-2.5-.1 0-2.1-.8-2.1-3.6ZM14.3 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2Z" />
          </svg>
          Continue with Apple
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, opacity: 0.6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF9F2" strokeWidth="2" strokeLinecap="round">
          <rect x="5" y="11" width="14" height="10" rx="2.5" />
          <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
        </svg>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '.6px' }}>ENCRYPTED · NEVER SOLD</span>
      </div>
    </div>
  );
}
