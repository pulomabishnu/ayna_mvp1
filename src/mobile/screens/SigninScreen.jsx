import { useEffect, useState } from 'react';

const DEFAULT_STATS = [
  { label: 'Products', value: 0 },
  { label: 'Reads', value: 0 },
  { label: 'Pillars', value: 0 },
];

// Same three statements, same order, same required-before-signup gate as
// src/components/AuthGate.jsx's CONSENT_ITEMS — this is a real compliance
// step for a health app processing self-reported data via AI, not
// decoration, so it isn't something to drop for a simpler mobile form.
const CONSENT_ITEMS = [
  'The health information I share with ayna is self-reported wellness information, not a clinical record.',
  'My wellness data may be processed by an external AI service to personalize recommendations. ayna takes measures to anonymize and secure this information and never sells it.',
  'ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider.',
];

function Field({ label, icon, children }) {
  return (
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
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1px', textTransform: 'uppercase', color: '#A8A29E' }}>{label}</div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = { border: 'none', outline: 'none', background: 'transparent', fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: '#292524', width: '100%', padding: '3px 0 0' };

const EmailIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="1.75" style={{ flex: 'none' }}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </svg>
);
const LockIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="1.75" style={{ flex: 'none' }}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

function PrimaryButton({ onClick, disabled, children }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled ? 'rgba(255,199,116,.45)' : '#FFC774',
        color: '#292524',
        textAlign: 'center',
        padding: 15,
        borderRadius: 99,
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 600,
        fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: disabled ? 'none' : '0 16px 30px -14px rgba(255,199,116,.8)',
      }}
    >
      {children}
    </div>
  );
}

function GoogleButton({ onClick, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        background: 'rgba(255,252,249,.14)',
        border: '1px solid rgba(255,255,255,.28)',
        textAlign: 'center',
        padding: 15,
        borderRadius: 99,
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 500,
        fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.87Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z" />
        <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
      </svg>
      {disabled ? 'Opening Google…' : 'Continue with Google'}
    </div>
  );
}

export default function SigninScreen({
  stats = DEFAULT_STATS,
  authUser,
  onSignUp,
  onSignIn,
  onGoogleSignIn,
  onResendConfirmation,
  onAuthenticated,
}) {
  const [mode, setMode] = useState('signup'); // 'signup' | 'signin' | 'check-email'
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checked, setChecked] = useState([false, false, false]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  // Cross-tab pickup: confirming email in a different tab establishes the
  // session there via localStorage, which fires onAuthStateChange back in
  // THIS tab through the standard storage-event mechanism (authUser flows
  // down from that). Move forward the moment that arrives instead of
  // leaving them stuck on "check your email" until they manually reopen
  // the app.
  useEffect(() => {
    if (mode === 'check-email' && authUser) onAuthenticated(firstName.trim() || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, authUser]);

  const initial = (firstName || '').trim().charAt(0).toUpperCase() || '?';
  const allConsented = checked.every(Boolean);
  const toggleCheck = (i) => setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const handleSignUp = async () => {
    if (!allConsented) {
      setError('Please agree to the three statements above before creating your account.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { needsConfirmation } = await onSignUp({ email: email.trim(), password, firstName: firstName.trim() });
      if (needsConfirmation) setMode('check-email');
      else onAuthenticated(firstName.trim() || undefined);
    } catch (e) {
      if (e.code === 'email_already_exists') setMode('signin');
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await onSignIn({ email: email.trim(), password });
      onAuthenticated();
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    // Same gate as desktop's AuthGate.jsx handleGoogle — the three consent
    // statements above only render in signup mode, so this is the one place
    // stopping Google from creating a real account with none of them agreed
    // to. Signing in with an existing account needs no re-consent.
    if (mode === 'signup' && !allConsented) {
      setError('Please agree to the three statements above before continuing.');
      return;
    }
    setError('');
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (e) {
      setError(e.message || 'Could not start Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await onResendConfirmation(email.trim());
      setResendMsg('Sent! Check your inbox (and spam folder) again in a minute.');
    } catch (e) {
      setResendMsg(e.message || 'Could not resend right now — try again in a moment.');
    } finally {
      setResending(false);
    }
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
      {mode === 'check-email' ? (
        <>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(26px * var(--ayna-text-scale, 1))', lineHeight: 1.3, marginBottom: 12, textAlign: 'center' }}>
            Almost there.
          </div>
          <div style={{ fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'rgba(255,252,249,.82)', textAlign: 'center', marginBottom: 20 }}>
            A confirmation email is on its way from ayna (puloma@aynahealth.co). Check your spam folder if you don't see it. Once confirmed, come back here — this screen updates on its own.
          </div>
          {resendMsg && <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', textAlign: 'center', color: 'rgba(255,252,249,.75)', marginBottom: 14 }}>{resendMsg}</div>}
          <div
            onClick={resending ? undefined : handleResend}
            style={{ textAlign: 'center', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: resending ? 'rgba(255,252,249,.5)' : '#FFC774', cursor: resending ? 'default' : 'pointer' }}
          >
            {resending ? 'Sending…' : 'Resend confirmation email'}
          </div>
          <div style={{ flex: 1 }} />
        </>
      ) : (
        <>
          {mode === 'signup' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ flex: 1, borderRadius: 16, padding: '12px 10px', background: 'rgba(255,252,249,.13)', border: '1px solid rgba(255,255,255,.2)', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(22px * var(--ayna-text-scale, 1))' }}>{s.value}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(8.5px * var(--ayna-text-scale, 1))', letterSpacing: '.8px', textTransform: 'uppercase', opacity: 0.68, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(30px * var(--ayna-text-scale, 1))', lineHeight: 1.2, marginBottom: 20 }}>
            {mode === 'signup' ? (<>Save it under<br />your name.</>) : (<>Welcome<br />back.</>)}
          </div>

          {mode === 'signup' && (
            <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 20px -12px rgba(0,0,0,.35)' }}>
              <div style={{ width: 42, height: 42, borderRadius: 99, background: '#FFC774', color: '#292524', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Playfair Display',serif", fontSize: 'calc(19px * var(--ayna-text-scale, 1))' }}>
                {initial}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1px', textTransform: 'uppercase', color: '#A8A29E' }}>First name</div>
                <input type="text" placeholder="Maya" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ ...inputStyle, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', fontWeight: 500 }} />
              </div>
            </div>
          )}

          <Field label="Email" icon={EmailIcon}>
            <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Password" icon={LockIcon}>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          </Field>

          {mode === 'signup' && (
            <div style={{ marginTop: 6, marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CONSENT_ITEMS.map((text, i) => (
                <div key={i} onClick={() => toggleCheck(i)} style={{ display: 'flex', gap: 10, cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid rgba(255,255,255,.5)', background: checked[i] ? '#FFC774' : 'transparent', flex: 'none', marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: '#292524', fontWeight: 700 }}>
                    {checked[i] ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: 'rgba(255,252,249,.78)' }}>{text}</div>
                </div>
              ))}
            </div>
          )}

          {error && <div style={{ color: '#FFC9BC', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', marginTop: 10 }}>{error}</div>}

          <div style={{ flex: 1, minHeight: 14 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {mode === 'signup' ? (
              <PrimaryButton onClick={handleSignUp} disabled={loading}>
                <span>{loading ? 'Creating account…' : 'Create my account'}</span>
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#292524" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={handleSignIn} disabled={loading}>
                <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              </PrimaryButton>
            )}
            <GoogleButton onClick={handleGoogle} disabled={googleLoading || loading} />
          </div>

          <div
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
            style={{ textAlign: 'center', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'rgba(255,252,249,.72)', marginTop: 16, cursor: 'pointer' }}
          >
            {mode === 'signup' ? 'Already have an account? Sign in' : "New here? Create an account"}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, opacity: 0.6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF9F2" strokeWidth="2" strokeLinecap="round">
              <rect x="5" y="11" width="14" height="10" rx="2.5" />
              <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
            </svg>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '.6px' }}>ENCRYPTED · NEVER SOLD</span>
          </div>
        </>
      )}
    </div>
  );
}
