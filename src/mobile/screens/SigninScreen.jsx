import { useEffect, useState } from 'react';
import { Stamp } from '../components/BrandBits.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { HEARD_ABOUT_OPTIONS, HEARD_ABOUT_OTHER_MAX, heardAboutMetadata } from '../../utils/heardAbout.js';
import { stashPendingSignupMeta } from '../../utils/pendingConsent.js';
import { setRememberMe } from '../../utils/supabaseClient.js';
import '../auth.css';
import '../../styles/flow.css';

/** "Where did you hear about us?" is REQUIRED on account creation (founder
 * spec, 2026-10). Same check as src/components/AuthGate.jsx's copy. */
function isHeardAboutAnswered(value) {
  return HEARD_ABOUT_OPTIONS.some((o) => o.value === value);
}

// Same three statements, same order, same required-before-signup gate as
// src/components/AuthGate.jsx's CONSENT_ITEMS, this is a real compliance
// step for a health app processing self-reported data via AI, not
// decoration, so it isn't something to drop for a simpler mobile form.
const CONSENT_ITEMS = [
  'The health information I share with ayna is self-reported wellness information, not a clinical record.',
  'My wellness data may be processed by an external AI service to personalize recommendations. ayna takes measures to anonymize and secure this information and never sells it.',
  'ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider.',
];

function Field({ label, icon, children }) {
  return (
    <label className="ayna-fresh-auth-field"
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: 'none',
      }}
    >
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: "var(--ayna-font-ui)", fontSize: 12, fontWeight: 700, color: '#5C514C' }}>{label}</span>
        {children}
      </div>
    </label>
  );
}

// iOS zooms the whole page in on focus for any text input whose computed
// font-size is under 16px, then doesn't reliably zoom back out, the
// max() floor keeps that from firing without changing the size at any
// --ayna-text-scale setting that was already >= 16px.
const inputStyle = { border: 'none', outline: 'none', background: 'transparent', fontFamily: "var(--ayna-font-ui)", fontSize: 'max(16px, calc(15px * var(--ayna-text-scale, 1)))', color: '#171717', width: '100%', padding: '3px 0 0' };

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
    <button className="ayna-fresh-auth-primary" type="button" disabled={disabled} onClick={onClick}
      style={{
        width: '100%',
        border: 0,
        background: disabled ? 'rgba(255,199,116,.45)' : '#F7BADD',
        color: '#171717',
        textAlign: 'center',
        padding: 15,
        borderRadius: 14,
        fontFamily: "var(--ayna-font-ui)",
        fontWeight: 600,
        fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: 'none',
      }}
    >
      {children}
    </button>
  );
}

function GoogleButton({ onClick, disabled }) {
  return (
    <button className="ayna-fresh-auth-social" type="button" disabled={disabled} onClick={onClick}
      style={{
        width: '100%',
        color: '#FFFFFF',
        background: 'rgba(255,252,249,.14)',
        border: '1px solid rgba(255,255,255,.28)',
        textAlign: 'center',
        padding: 15,
        borderRadius: 14,
        fontFamily: "var(--ayna-font-ui)",
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
    <button className="ayna-fresh-auth-social" type="button" disabled={disabled} onClick={onClick}
      style={{
        width: '100%',
        color: '#FFFFFF',
        background: 'rgba(255,252,249,.14)',
        border: '1px solid rgba(255,255,255,.28)',
        textAlign: 'center',
        padding: 15,
        borderRadius: 14,
        fontFamily: "var(--ayna-font-ui)",
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
        <path fill="#FFFFFF" d="M13.06 9.53c-.02-1.96 1.6-2.9 1.67-2.94-.91-1.33-2.33-1.51-2.84-1.53-1.21-.12-2.36.71-2.97.71-.62 0-1.55-.7-2.55-.68-1.31.02-2.53.76-3.2 1.93-1.37 2.37-.35 5.87.98 7.79.65.94 1.42 1.99 2.44 1.96.98-.04 1.35-.63 2.53-.63 1.18 0 1.51.63 2.55.6 1.05-.02 1.72-.95 2.36-1.89.75-1.08 1.05-2.13 1.06-2.18-.02-.01-2.03-.78-2.03-3.13z" />
        <path fill="#FFFFFF" d="M11.1 3.68c.54-.65.9-1.56.8-2.46-.77.03-1.71.51-2.27 1.15-.5.57-.94 1.5-.82 2.38.86.06 1.75-.44 2.29-1.07z" />
      </svg>
      {disabled ? 'Opening Apple…' : 'Continue with Apple'}
    </button>
  );
}

export default function SigninScreen({
  initialMode = 'signup',
  authUser,
  onSignUp,
  onSignIn,
  onGoogleSignIn,
  onAppleSignIn,
  onResendConfirmation,
  onAuthenticated,
  onAuthBack,
  onStartEcosystem,
  myProducts = [],
  topAreas = [],
}) {
  const ecoPicks = (myProducts || []).filter(Boolean);
  const showEcoSummary = ecoPicks.length > 0 && !authUser;
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin' | 'check-email'
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checked, setChecked] = useState([false, false, false]);
  // Remember me (sign-in): controls ONLY where the Supabase session token is
  // stored (localStorage vs sessionStorage, src/utils/supabaseClient.js).
  // Defaults on. Never deletes any account data.
  const [rememberMe, setRememberMeChecked] = useState(true);
  // Required "Where did you hear about us?" (saved in user metadata).
  const [heardAbout, setHeardAbout] = useState('');
  const [heardOther, setHeardOther] = useState('');
  // Create account is only offered in the save step after the quiz (opened
  // in signup mode). Opened for sign-in, new people go build an Ecosystem.
  const canSignUp = initialMode === 'signup';
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
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

  // The native Google/Apple round trip (Browser.open -> appUrlOpen) lands
  // back on this same mounted screen instead of navigating anywhere, so a
  // failure there previously only reached console.error, invisible on a
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

  const handleSignUp = async () => {
    if (!isHeardAboutAnswered(heardAbout)) {
      setError('Tell us where you heard about ayna.');
      return;
    }
    if (!allConsented) {
      setError('Please agree to the three statements above before creating your account.');
      return;
    }
    setError('');
    setLoading(true);
    // Signup always persists the new session (the Remember me choice is a
    // sign-in option); see src/utils/supabaseClient.js.
    setRememberMe(true);
    try {
      const { needsConfirmation } = await onSignUp({ email: email.trim(), password, firstName: firstName.trim(), metadata: heardAboutMetadata(heardAbout, heardOther) });
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
    setRememberMe(rememberMe);
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
    // Same gate as desktop's AuthGate.jsx handleGoogle, the three consent
    // statements above only render in signup mode, so this is the one place
    // stopping Google from creating a real account with none of them agreed
    // to. Signing in with an existing account needs no re-consent.
    if (mode === 'signup' && !isHeardAboutAnswered(heardAbout)) {
      setError('Tell us where you heard about ayna.');
      return;
    }
    if (mode === 'signup' && !allConsented) {
      setError('Please agree to the three statements above before continuing.');
      return;
    }
    setError('');
    stashPendingSignupMeta(mode === 'signup' ? heardAboutMetadata(heardAbout, heardOther) : null);
    // Before the OAuth redirect: the flag must already be set when the
    // returning setSession writes the session through the storage adapter.
    setRememberMe(mode === 'signup' ? true : rememberMe);
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (e) {
      setError(e.message || 'Could not start Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    // Same gates as handleGoogle above.
    if (mode === 'signup' && !isHeardAboutAnswered(heardAbout)) {
      setError('Tell us where you heard about ayna.');
      return;
    }
    if (mode === 'signup' && !allConsented) {
      setError('Please agree to the three statements above before continuing.');
      return;
    }
    setError('');
    stashPendingSignupMeta(mode === 'signup' ? heardAboutMetadata(heardAbout, heardOther) : null);
    setRememberMe(mode === 'signup' ? true : rememberMe);
    setAppleLoading(true);
    try {
      await onAppleSignIn();
    } catch (e) {
      setError(e.message || 'Could not start Apple sign-in.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await onResendConfirmation(email.trim());
      setResendMsg('Sent! Check your inbox (and spam folder) again in a minute.');
    } catch (e) {
      setResendMsg(e.message || 'Could not resend right now, try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="ayna-fresh-auth ay-auth"
      style={{
        flex: 1,
        overflowY: 'auto',
        background: '#3e2723',
        color: '#FFFFFF',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 34,
        display: 'flex',
        flexDirection: 'column',
        animation: 'ay-page .25s ease-out',
      }}
    >
      <button className="ayna-fresh-auth-back ay-auth-back" type="button" onClick={onAuthBack} aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
      </button>
      {mode === 'check-email' ? (
        <>
          <div style={{ flex: 1 }} />
          <div className="ay-auth-check-title">
            Almost there.
          </div>
          <div className="ay-auth-check-copy">
            A confirmation email is on its way from ayna (puloma@aynahealth.co). Check your spam folder if you don't see it. Once confirmed, come back here, this screen updates on its own.
          </div>
          {resendMsg && <div className="ay-auth-check-msg" role="status">{resendMsg}</div>}
          <button type="button" className="ay-auth-link" disabled={resending} onClick={handleResend}>
            {resending ? 'Sending…' : 'Resend confirmation email'}
          </button>
          <div style={{ flex: 1 }} />
        </>
      ) : (
        <>
          <header className="ay-auth-head">
            <Stamp id="ay-auth-stamp" className="is-inline is-small" />
            <h1>{mode === 'signup' ? (showEcoSummary ? 'Save your Ecosystem' : 'Sign up') : 'Sign in'}</h1>
            {mode === 'signup' && showEcoSummary && <p>Create an account to keep it.</p>}
          </header>

          {mode === 'signup' && showEcoSummary && (
            <section className="ay-auth-eco" aria-label="Your Ecosystem">
              <div className="ay-auth-eco-copy">
                <strong>{ecoPicks.length} {ecoPicks.length === 1 ? 'pick' : 'picks'}{topAreas.length ? ` · ${topAreas.length} ${topAreas.length === 1 ? 'area' : 'areas'}` : ''}</strong>
                {topAreas.length > 0 && <span>{topAreas.slice(0, 4).join(', ')}</span>}
              </div>
              <div className="ay-auth-eco-thumbs" aria-hidden="true">
                {ecoPicks.slice(0, ecoPicks.length > 4 ? 3 : 4).map((p, i) => (
                  <span key={p.id || i}>
                    <i className="ay-auth-eco-fallback">{String(p.brand || p.name || '?').trim().charAt(0).toUpperCase()}</i>
                    <ProductImage product={p} src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                  </span>
                ))}
                {ecoPicks.length > 4 && <span className="is-more">+{ecoPicks.length - 3}</span>}
              </div>
            </section>
          )}

          <div className="ay-auth-form">
          {mode === 'signup' && (
            <label className="ayna-fresh-auth-field" style={{ background: '#FFFFFF', borderRadius: 14, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 99, background: '#F7BADD', color: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "var(--ayna-font-display)", fontSize: 'calc(19px * var(--ayna-text-scale, 1))' }}>
                {initial}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontFamily: "var(--ayna-font-ui)", fontSize: 12, fontWeight: 700, color: '#5C514C' }}>First name</span>
                <input type="text" autoComplete="given-name" placeholder="Your first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ ...inputStyle, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', fontWeight: 500 }} />
              </div>
            </label>
          )}

          <Field label="Email" icon={EmailIcon}>
            <input type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Password" icon={LockIcon}>
            <input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          </Field>

          {mode === 'signup' && (
            <div className="ay-auth-heard">
              <label className="ay-auth-heard-label" htmlFor="ay-auth-heard">Where did you hear about us?</label>
              <select id="ay-auth-heard" value={heardAbout} onChange={(e) => setHeardAbout(e.target.value)} className={heardAbout ? '' : 'is-empty'}>
                <option value="">Choose one</option>
                {HEARD_ABOUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {heardAbout === 'other' && (
                <input type="text" aria-label="Where you heard about us" placeholder="Tell us where" maxLength={HEARD_ABOUT_OTHER_MAX} value={heardOther} onChange={(e) => setHeardOther(e.target.value)} autoComplete="off" />
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div className="ay-auth-consent">
              {CONSENT_ITEMS.map((text, i) => (
                <label key={i} style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={checked[i]} onChange={() => toggleCheck(i)} style={{ width: 18, height: 18, flex: 'none', marginTop: 1, accentColor: '#F7BADD' }} />
                  <span className="ay-auth-consent-text">{text}</span>
                </label>
              ))}
            </div>
          )}

          {mode === 'signin' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: '2px 2px 10px' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMeChecked(e.target.checked)}
                style={{ width: 18, height: 18, flex: 'none', margin: 0, accentColor: 'var(--ay-ink, #3e2723)' }}
              />
              <span style={{ fontFamily: "var(--ayna-font-ui)", fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ay-ink, #3e2723)' }}>Remember me</span>
            </label>
          )}

          {error && <div className="ay-auth-error" role="alert">{error}</div>}


            {mode === 'signup' ? (
              <PrimaryButton onClick={handleSignUp} disabled={loading}>
                <span>{loading ? 'Creating account…' : 'Create my account'}</span>
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={handleSignIn} disabled={loading}>
                <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              </PrimaryButton>
            )}
          </div>

          <div className="ay-auth-or" aria-hidden="true"><span>or</span></div>

          <div className="ay-auth-social">
            <GoogleButton onClick={handleGoogle} disabled={googleLoading || appleLoading || loading} />
            <AppleButton onClick={handleApple} disabled={appleLoading || googleLoading || loading} />
          </div>

          <button type="button" className="ayna-fresh-auth-switch ay-auth-link" onClick={() => {
            setError('');
            if (mode === 'signup') setMode('signin');
            else if (canSignUp) setMode('signup');
            else onStartEcosystem?.();
          }}>
            {mode === 'signup' ? 'Already have an account? Sign in' : canSignUp ? <>Don’t have an account? <b>Create one</b></> : <>Don’t have an account? <b>Build your Ecosystem</b></>}
          </button>

          <div className="ayna-fresh-auth-trust" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, opacity: 0.6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FCFBFB" strokeWidth="2" strokeLinecap="round">
              <rect x="5" y="11" width="14" height="10" rx="2.5" />
              <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
            </svg>
            <span style={{ fontFamily: "var(--ayna-font-ui)", fontSize: 'calc(11px * var(--ayna-text-scale, 1))', letterSpacing: '.6px' }}>Encrypted. Never sold.</span>
          </div>
        </>
      )}
      <LegalFooter variant="light" />
    </div>
  );
}
