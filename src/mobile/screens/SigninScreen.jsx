import { useEffect, useState } from 'react';
import LegalFooter from '../components/LegalFooter.jsx';
import { getSupabaseClient } from '../../utils/supabaseClient.js';

// Reset links must open on the website (an email can't open capacitor://).
// /auth/callback handles type=recovery with a set-new-password form.
const PASSWORD_RESET_REDIRECT = 'https://www.aynahealth.co/auth/callback';

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
  'When I intentionally use an AI-powered feature, relevant information I provide may be processed by third-party AI providers such as Anthropic, OpenAI, or Google to generate my requested response. ayna minimizes the context sent and does not sell it.',
  'ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider.',
  'I confirm that I am at least 18 years old.',
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

// iOS zooms the whole page in on focus for any text input whose computed
// font-size is under 16px, then doesn't reliably zoom back out — the
// max() floor keeps that from firing without changing the size at any
// --ayna-text-scale setting that was already >= 16px.
const inputStyle = { border: 'none', outline: 'none', background: 'transparent', fontFamily: "'DM Sans',sans-serif", fontSize: 'max(16px, calc(15px * var(--ayna-text-scale, 1)))', color: '#292524', width: '100%', padding: '3px 0 0' };

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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', border: 'none',
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
    </button>
  );
}

function GoogleButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', color: '#FFFCF9',
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
    </button>
  );
}

function AppleButton({ onClick, disabled }) {
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
      <svg width="16" height="18" viewBox="0 0 16 18">
        <path fill="#FFFCF9" d="M13.06 9.53c-.02-1.96 1.6-2.9 1.67-2.94-.91-1.33-2.33-1.51-2.84-1.53-1.21-.12-2.36.71-2.97.71-.62 0-1.55-.7-2.55-.68-1.31.02-2.53.76-3.2 1.93-1.37 2.37-.35 5.87.98 7.79.65.94 1.42 1.99 2.44 1.96.98-.04 1.35-.63 2.53-.63 1.18 0 1.51.63 2.55.6 1.05-.02 1.72-.95 2.36-1.89.75-1.08 1.05-2.13 1.06-2.18-.02-.01-2.03-.78-2.03-3.13z" />
        <path fill="#FFFCF9" d="M11.1 3.68c.54-.65.9-1.56.8-2.46-.77.03-1.71.51-2.27 1.15-.5.57-.94 1.5-.82 2.38.86.06 1.75-.44 2.29-1.07z" />
      </svg>
      {disabled ? 'Opening Apple…' : 'Continue with Apple'}
    </div>
  );
}

export default function SigninScreen({
  stats = DEFAULT_STATS,
  authUser,
  onSignUp,
  onSignIn,
  onGoogleSignIn,
  onAppleSignIn,
  onResendConfirmation,
  onVerifyEmailOtp,
  onAuthenticated,
  initialMode = 'signup',
}) {
  const [mode, setMode] = useState(initialMode === 'signin' ? 'signin' : 'signup'); // 'signup' | 'signin' | 'check-email'
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checked, setChecked] = useState([false, false, false, false]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetting, setResetting] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);

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

  // The native Google/Apple round trip (Browser.open -> appUrlOpen) lands
  // back on this same mounted screen instead of navigating anywhere, so a
  // failure there previously only reached console.error — invisible on a
  // real device with no attached debugger. useSupabaseAuth dispatches this
  // event instead of (or in addition to) logging, so the failure actually
  // reaches the person trying to sign in.
  useEffect(() => {
    const onOAuthError = (e) => {
      setGoogleLoading(false);
      setAppleLoading(false);
      setError(e.detail || 'Sign-in did not complete. Please try again.');
    };
    window.addEventListener('ayna:native-oauth-error', onOAuthError);
    return () => window.removeEventListener('ayna:native-oauth-error', onOAuthError);
  }, []);

  const initial = (firstName || '').trim().charAt(0).toUpperCase() || '?';
  const allConsented = checked.every(Boolean);
  const toggleCheck = (i) => setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const handleVerifyCode = async () => {
    const cleanCode = emailCode.replace(/\D/g, '').slice(0, 8);
    if (!/^\d{8}$/.test(cleanCode)) {
      setError('Enter the 8-digit verification code from your email.');
      return;
    }
    setError('');
    setVerifyingCode(true);
    try {
      await onVerifyEmailOtp({ email: email.trim(), token: cleanCode });
      onAuthenticated(firstName.trim() || undefined);
    } catch (e) {
      setError(/expired|invalid|token/i.test(e?.message || '')
        ? 'That code is invalid or expired. Tap Resend code and try again.'
        : (e?.message || 'Could not verify that code. Please try again.'));
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSignUp = async () => {
    if (mode === 'signup' && !allConsented) {
      setError('Please agree to all four statements above before creating your account.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { needsConfirmation } = await onSignUp({ email: email.trim(), password, firstName: firstName.trim() });
      if (needsConfirmation) {
        setEmailCode('');
        setResendMsg('');
        setMode('check-email');
      } else {
        onAuthenticated(firstName.trim() || undefined);
      }
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
      if (/email not confirmed|confirm your email|not verified/i.test(e?.message || '')) {
        setEmailCode('');
        setResendMsg('');
        setMode('check-email');
        setError('Your email still needs verification. Enter the code from your email below.');
      } else {
        setError(e.message || 'Something went wrong. Please try again.');
      }
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
      setError('Please agree to all four statements above before continuing.');
      return;
    }
    setError('');
    setGoogleLoading(true);
    try {
      await onGoogleSignIn({ consented: mode === 'signup' });
    } catch (e) {
      setError(e.message || 'Could not start Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    if (!onAppleSignIn) return;
    if (mode === 'signup' && !allConsented) {
      setError('Please agree to all four statements above before continuing.');
      return;
    }
    setError('');
    setAppleLoading(true);
    try {
      await onAppleSignIn({ consented: mode === 'signup' });
      onAuthenticated(firstName.trim() || undefined);
    } catch (e) {
      if (!/cancel/i.test(e?.message || '')) setError(e?.message || 'Could not sign in with Apple.');
    } finally {
      setAppleLoading(false);
    }
  };

  // Before the 2026-09-22 audit a signed-out user who forgot their password
  // had no way back in (reset only existed inside Settings, behind sign-in).
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setError('');
    setResetMsg('');
    if (!cleanEmail) { setError('Enter your email above, then tap "Forgot password?".'); return; }
    const supabase = getSupabaseClient();
    if (!supabase) { setError('Could not reach ayna. Please try again.'); return; }
    setResetting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: PASSWORD_RESET_REDIRECT });
      if (resetError) throw resetError;
      setResetMsg(`If an account exists for ${cleanEmail}, we sent a link to reset your password. Open it, set a new password, then sign in here.`);
    } catch (e) {
      setError(e?.message || 'Could not send a reset email right now. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await onResendConfirmation(email.trim());
      setEmailCode('');
      setResendMsg('New code sent. Check your inbox and spam folder.');
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
            Verify your email.
          </div>
          <div style={{ fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'rgba(255,252,249,.82)', textAlign: 'center', marginBottom: 18 }}>
            We sent an 8-digit verification code to {email}. Enter it below to finish creating your account.
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '14px 16px', marginBottom: 12, boxShadow: '0 8px 20px -12px rgba(0,0,0,.35)' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1px', textTransform: 'uppercase', color: '#A8A29E', textAlign: 'center' }}>Verification code</div>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="12345678"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              autoFocus
              style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 700, padding: '8px 0 2px' }}
            />
          </div>
          {error && <div style={{ color: '#FFC9BC', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', textAlign: 'center', marginBottom: 12 }}>{error}</div>}
          <PrimaryButton onClick={handleVerifyCode} disabled={verifyingCode || emailCode.length !== 8}>
            {verifyingCode ? 'Verifying…' : 'Verify email'}
          </PrimaryButton>
          {resendMsg && <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', textAlign: 'center', color: 'rgba(255,252,249,.75)', marginTop: 12 }}>{resendMsg}</div>}
          <div
            onClick={resending ? undefined : handleResend}
            style={{ textAlign: 'center', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: resending ? 'rgba(255,252,249,.5)' : '#FFC774', cursor: resending ? 'default' : 'pointer', marginTop: 12 }}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </div>
          <div
            onClick={() => { setMode('signup'); setEmailCode(''); setError(''); setResendMsg(''); }}
            style={{ textAlign: 'center', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'rgba(255,252,249,.72)', cursor: 'pointer', marginTop: 12 }}
          >
            Change email
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

          {mode === 'signin' && (
            <div
              role="button"
              tabIndex={0}
              onClick={resetting ? undefined : handleForgotPassword}
              style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: '#FFC774', marginTop: 10, cursor: resetting ? 'default' : 'pointer', alignSelf: 'flex-start' }}
            >
              {resetting ? 'Sending reset link…' : 'Forgot password?'}
            </div>
          )}
          {resetMsg && <div style={{ color: 'rgba(255,252,249,.85)', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', marginTop: 10, lineHeight: 1.5 }}>{resetMsg}</div>}
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
            <GoogleButton onClick={handleGoogle} disabled={googleLoading || appleLoading || loading} />
            {onAppleSignIn && <AppleButton onClick={handleApple} disabled={appleLoading || googleLoading || loading} />}
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
      <LegalFooter variant="light" />
    </div>
  );
}
