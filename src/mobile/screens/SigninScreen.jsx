import { useEffect, useState } from 'react';
import ProfileSetupStep from '../../components/ProfileSetupStep.jsx';
import { picksAreasLine } from '../../utils/needAreas.js';
import LegalFooter from '../components/LegalFooter.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { hydrateCatalogProduct } from '../../data/products.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import { productImageOverride } from '../../data/productImageOverrides.js';
import { stashPendingSignupMeta } from '../../utils/pendingConsent.js';
import { AI_CONSENT_ERROR, AI_CONSENT_TEXT, LEGAL_LINKS, acknowledgementLead, consentMetadata, markAskHeardAbout } from '../../utils/signupConsent.js';
import { cleanFirstName } from '../data/intakeModel.js';
import { getSupabaseClient, setRememberMe } from '../../utils/supabaseClient.js';
import { CODE_COPY, EMAIL_CODE_LENGTH, cleanCode, isEmailNotConfirmed, verifyEmailCode } from '../../utils/authCodes.js';
import { clearError, errorSummary, firstErrorKey, revealField, warnHaptic } from '../../utils/formErrors.js';
import InlineError from '../../components/InlineError.jsx';
import '../auth.css';
import '../../styles/flow.css';

// Same one AI-processing box and acknowledgement sentence as the website
// (src/utils/signupConsent.js), onboarding audit (Oct 25). Her name comes
// from the quiz; "Where did you hear about us?" is asked after sign-up.
const ERROR_ORDER = ['email', 'password', 'aiConsent'];
const FIELD_IDS = { email: 'ay-auth-email', password: 'ay-auth-password', aiConsent: 'ay-auth-consent-ai' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const errId = (key) => `${FIELD_IDS[key]}-err`;

function Field({ label, icon, invalid = false, children }) {
  return (
    <label className={`ayna-fresh-auth-field${invalid ? ' is-invalid' : ''}`}
      style={{
        background: 'var(--ayna-surface)',
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
        <span style={{ display: 'block', fontFamily: "var(--ayna-font-ui)", fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text-muted)' }}>{label}</span>
        {children}
      </div>
    </label>
  );
}

// iOS zooms the whole page in on focus for any text input whose computed
// font-size is under 16px, then doesn't reliably zoom back out, the
// max() floor keeps that from firing without changing the size at any
// --ayna-text-scale setting that was already >= 16px.
const inputStyle = { border: 'none', outline: 'none', background: 'transparent', fontFamily: "var(--ayna-font-ui)", fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', width: '100%', padding: '3px 0 0' };

const EmailIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-border)" strokeWidth="1.75" style={{ flex: 'none' }}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </svg>
);
const LockIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-border)" strokeWidth="1.75" style={{ flex: 'none' }}>
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
        color: 'var(--ayna-heading)',
        textAlign: 'center',
        padding: 15,
        borderRadius: 14,
        fontFamily: "var(--ayna-font-ui)",
        fontWeight: 600,
        fontSize: 'calc(17px * var(--ayna-text-scale, 1))',
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
        color: '#FFEDAC',
        background: 'rgba(255,237,172,.14)',
        border: '1px solid rgba(255,237,172,.28)',
        textAlign: 'center',
        padding: 15,
        borderRadius: 14,
        fontFamily: "var(--ayna-font-ui)",
        fontWeight: 400,
        lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
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
        color: '#FFEDAC',
        background: 'rgba(255,237,172,.14)',
        border: '1px solid rgba(255,237,172,.28)',
        textAlign: 'center',
        padding: 15,
        borderRadius: 14,
        fontFamily: "var(--ayna-font-ui)",
        fontWeight: 400,
        lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <svg width="16" height="18" viewBox="0 0 16 18">
        <path fill="currentColor" d="M13.06 9.53c-.02-1.96 1.6-2.9 1.67-2.94-.91-1.33-2.33-1.51-2.84-1.53-1.21-.12-2.36.71-2.97.71-.62 0-1.55-.7-2.55-.68-1.31.02-2.53.76-3.2 1.93-1.37 2.37-.35 5.87.98 7.79.65.94 1.42 1.99 2.44 1.96.98-.04 1.35-.63 2.53-.63 1.18 0 1.51.63 2.55.6 1.05-.02 1.72-.95 2.36-1.89.75-1.08 1.05-2.13 1.06-2.18-.02-.01-2.03-.78-2.03-3.13z" />
        <path fill="currentColor" d="M11.1 3.68c.54-.65.9-1.56.8-2.46-.77.03-1.71.51-2.27 1.15-.5.57-.94 1.5-.82 2.38.86.06 1.75-.44 2.29-1.07z" />
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
  // Her picked needs' labels (QA3 M11), never product categories.
  saveAreas = [],
  firstName: intakeName = '',
}) {
  const topAreas = saveAreas || [];
  const ecoPicks = (myProducts || []).filter(Boolean);
  // Thumbnails use the catalog photo (same lookup as the product page), and
  // picks that have one go first so the row shows real products.
  const picksWithPhoto = ecoPicks.map((p) => hydrateCatalogProduct(p)).map((p) => {
    const raw = p.image || p.imageUrl || p.images?.[0];
    return { p, src: raw, hasPhoto: Boolean(productImageOverride(p) || safeProductImageSrc(raw, p.type === 'digital')) };
  }).sort((a, b) => Number(b.hasPhoto) - Number(a.hasPhoto));
  const showEcoSummary = ecoPicks.length > 0 && !authUser;
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin' | 'check-email'
  // Her first name from the quiz (asked there only).
  const firstName = cleanFirstName(intakeName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aiConsent, setAiConsent] = useState(false);
  // Remember me (sign-in): controls ONLY where the Supabase session token is
  // stored (localStorage vs sessionStorage, src/utils/supabaseClient.js).
  // Defaults on. Never deletes any account data.
  const [rememberMe, setRememberMeChecked] = useState(true);
  // Create account is only offered in the save step after the quiz (opened
  // in signup mode). Opened for sign-in, new people go build an ecosystem.
  const canSignUp = initialMode === 'signup';
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  // Per-field required errors, shown inline under each field or box.
  const [fieldErrors, setFieldErrors] = useState({});
  const [summaryAction, setSummaryAction] = useState('create your account');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  // The emailed code, same as the website (src/utils/authCodes.js).
  const [emailCode, setEmailCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [checkNote, setCheckNote] = useState('');

  // Cross-tab pickup: confirming email in a different tab establishes the
  // session there via localStorage, which fires onAuthStateChange back in
  // THIS tab through the standard storage-event mechanism (authUser flows
  // down from that). Move forward the moment that arrives instead of
  // leaving them stuck on "check your email" until they manually reopen
  // the app.
  // Email verified: photo + username first, then she's in (founder, Oct 29).
  useEffect(() => {
    if (mode === 'check-email' && authUser) setMode('profile');
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

  const toggleAiConsent = () => {
    setAiConsent((v) => !v);
    setFieldErrors((prev) => clearError(prev, 'aiConsent'));
  };
  const clearField = (key) => setFieldErrors((prev) => clearError(prev, key));
  const invalidProps = (key) => ({
    id: FIELD_IDS[key],
    'aria-invalid': fieldErrors[key] ? true : undefined,
    'aria-describedby': fieldErrors[key] ? errId(key) : undefined,
  });

  // Checks the required fields for this tap. `fields` limits it to the
  // ones that apply (Apple/Google sign-up only needs the consent box).
  // On a miss: inline messages, scroll + focus the first, warning haptic.
  const validateRequired = (fields, action) => {
    const next = {};
    const want = (k) => fields.includes(k);
    if (want('email')) {
      if (!email.trim()) next.email = 'Add your email.';
      else if (!EMAIL_RE.test(email.trim())) next.email = 'Check your email. It needs an @ and a domain, like you@email.com.';
    }
    if (want('password')) {
      if (!password) next.password = mode === 'signup' ? 'Add a password.' : 'Add your password.';
      else if (mode === 'signup' && password.length < 8) next.password = 'Use at least 8 characters for your password.';
    }
    if (want('aiConsent') && !aiConsent) next.aiConsent = AI_CONSENT_ERROR;
    setFieldErrors(next);
    setSummaryAction(action);
    const first = firstErrorKey(next, ERROR_ORDER);
    if (!first) return true;
    setError('');
    warnHaptic();
    // After React paints the messages, so centring accounts for them.
    window.requestAnimationFrame(() => revealField(document.getElementById(FIELD_IDS[first])));
    return false;
  };
  const SIGNUP_FIELDS = ['email', 'password', 'aiConsent'];
  const SOCIAL_SIGNUP_FIELDS = ['aiConsent'];
  const summary = errorSummary(fieldErrors, ['aiConsent'], summaryAction);

  const handleSignUp = async () => {
    if (!validateRequired(SIGNUP_FIELDS, 'create your account')) return;
    setError('');
    setLoading(true);
    // Signup always persists the new session (the Remember me choice is a
    // sign-in option); see src/utils/supabaseClient.js.
    setRememberMe(true);
    try {
      const { needsConfirmation } = await onSignUp({ email: email.trim(), password, firstName: firstName || undefined, metadata: consentMetadata() });
      markAskHeardAbout();
      if (needsConfirmation) { setCheckNote(CODE_COPY.emailSent(email.trim())); setEmailCode(''); setMode('check-email'); }
      else onAuthenticated(firstName || undefined);
    } catch (e) {
      if (e.code === 'email_already_exists') setMode('signin');
      setError(e.message || 'We couldn’t sign you in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateRequired(['email', 'password'], 'sign in')) return;
    setError('');
    setLoading(true);
    setRememberMe(rememberMe);
    try {
      await onSignIn({ email: email.trim(), password });
      onAuthenticated();
    } catch (e) {
      // Same as the website: an account that was never verified goes to the code step, not a dead end.
      if (isEmailNotConfirmed(e)) { setCheckNote(CODE_COPY.emailNotConfirmed); setEmailCode(''); setMode('check-email'); return; }
      setError(e.message || 'We couldn’t sign you in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    // Same gate as desktop's AuthGate.jsx handleGoogle, the three consent
    // statements above only render in signup mode, so this is the one place
    // stopping Google from creating a real account with none of them agreed
    // to. Signing in with an existing account needs no re-consent.
    if (mode === 'signup' && !validateRequired(SOCIAL_SIGNUP_FIELDS, 'continue')) return;
    setError('');
    stashPendingSignupMeta(mode === 'signup' ? { ...(firstName ? { first_name: firstName, full_name: firstName } : {}), ...consentMetadata() } : null);
    if (mode === 'signup') markAskHeardAbout();
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
    if (mode === 'signup' && !validateRequired(SOCIAL_SIGNUP_FIELDS, 'continue')) return;
    setError('');
    stashPendingSignupMeta(mode === 'signup' ? { ...(firstName ? { first_name: firstName, full_name: firstName } : {}), ...consentMetadata() } : null);
    if (mode === 'signup') markAskHeardAbout();
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
      setResendMsg(CODE_COPY.resent);
    } catch (e) {
      setResendMsg(e.message || 'Could not resend right now, try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e?.preventDefault?.();
    if (cleanCode(emailCode, EMAIL_CODE_LENGTH).length !== EMAIL_CODE_LENGTH) { setCodeError(CODE_COPY.emailPrompt); return; }
    setCodeError('');
    setVerifying(true);
    try {
      await verifyEmailCode(getSupabaseClient(), email, emailCode);
      setResendMsg(CODE_COPY.verified);
      // onAuthStateChange delivers the session; the check-email effect above then moves on.
    } catch (err) {
      setCodeError(err.message || CODE_COPY.wrongOrExpired);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="ayna-fresh-auth ay-auth"
      style={{
        flex: 1,
        overflowY: 'auto',
        background: '#3e2723',
        color: '#FFEDAC',
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
      </button>
      {mode === 'profile' && authUser ? (
        <div className="ay-psetup-card">
          <ProfileSetupStep supabase={getSupabaseClient()} user={authUser} firstName={firstName} onDone={() => onAuthenticated(firstName || undefined)} />
        </div>
      ) : mode === 'check-email' ? (
        <>
          <div style={{ flex: 1 }} />
          <div className="ay-auth-check-title">
            Almost there.
          </div>
          <div className="ay-auth-check-copy">
            {checkNote || CODE_COPY.emailSent(email.trim())} It comes from ayna (puloma@aynahealth.co). Check your spam folder if you don't see it.
          </div>
          <form className="ay-auth-code" onSubmit={handleVerifyCode} noValidate>
            <label className={`ayna-fresh-auth-field${codeError ? ' is-invalid' : ''}`} htmlFor="ay-auth-email-code">
              <span>Verification code</span>
              <input
                id="ay-auth-email-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={CODE_COPY.emailPlaceholder}
                maxLength={EMAIL_CODE_LENGTH}
                value={emailCode}
                onChange={(e) => { setEmailCode(cleanCode(e.target.value, EMAIL_CODE_LENGTH)); setCodeError(''); }}
                aria-invalid={codeError ? true : undefined}
                aria-describedby={codeError ? 'ay-auth-code-err' : undefined}
                style={inputStyle}
              />
            </label>
            {codeError && <div id="ay-auth-code-err" className="ay-auth-check-msg" role="alert">{codeError}</div>}
            <PrimaryButton onClick={handleVerifyCode} disabled={verifying}>{verifying ? 'Checking…' : 'Verify and continue'}</PrimaryButton>
          </form>
          {resendMsg && <div className="ay-auth-check-msg" role="status">{resendMsg}</div>}
          <button type="button" className="ay-auth-link" disabled={resending} onClick={handleResend}>
            {resending ? 'Sending…' : 'Resend code'}
          </button>
          <div style={{ flex: 1 }} />
        </>
      ) : (
        <>
          <header className="ay-auth-head">
            {/* Offered as "save these" (onboarding audit section 6, #36 PITCH). */}
            <h1>{mode === 'signup' ? 'Save your matches' : 'Sign in'}</h1>
            {mode === 'signup' && <p>Free. We never sell your health information.</p>}
          </header>

          {mode === 'signup' && showEcoSummary && (
            <section className="ay-auth-eco" aria-label="Your ecosystem">
              <div className="ay-auth-eco-copy">
                <strong>{picksAreasLine(ecoPicks.length, topAreas.length)}</strong>
                {topAreas.length > 0 && <span>{topAreas.slice(0, 4).join(', ')}</span>}
              </div>
              <div className="ay-auth-eco-thumbs" aria-hidden="true">
                {picksWithPhoto.slice(0, ecoPicks.length > 4 ? 3 : 4).map(({ p, src, hasPhoto }, i) => (
                  <span key={p.id || i} className={hasPhoto ? 'has-photo' : 'no-photo'}>
                    {hasPhoto
                      ? <ProductImage product={p} src={src} allowBrandLogo={p.type === 'digital'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                      : <i className="ay-auth-eco-fallback ay-auth-eco-fallback--name">{String(p.brand || p.name || '').trim().split(/\s+/)[0] || 'ayna'}</i>}
                  </span>
                ))}
                {ecoPicks.length > 4 && <span className="is-more">+{ecoPicks.length - 3}</span>}
              </div>
            </section>
          )}

          {/* Fastest way in first: Apple, then Google, then email (onboarding audit #1). */}
          <div className="ay-auth-social">
            <AppleButton onClick={handleApple} disabled={appleLoading || googleLoading || loading} />
            <GoogleButton onClick={handleGoogle} disabled={googleLoading || appleLoading || loading} />
          </div>
          <div className="ay-auth-or" aria-hidden="true"><span>or</span></div>

          <div className="ay-auth-form">

          <Field label="Email" icon={EmailIcon} invalid={Boolean(fieldErrors.email)}>
            <input type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => { setEmail(e.target.value); clearField('email'); }} style={inputStyle} {...invalidProps('email')} />
          </Field>
          <InlineError id={errId('email')}>{fieldErrors.email}</InlineError>

          <Field label="Password" icon={LockIcon} invalid={Boolean(fieldErrors.password)}>
            <input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} value={password} onChange={(e) => { setPassword(e.target.value); clearField('password'); }} style={inputStyle} {...invalidProps('password')} />
          </Field>
          <InlineError id={errId('password')}>{fieldErrors.password}</InlineError>

          {mode === 'signup' && (
            <div className="ay-auth-consent">
              <div className="ay-auth-consent-item">
                <label className={`ay-auth-consent-row${fieldErrors.aiConsent ? ' ay-check-invalid' : ''}`}>
                  <input type="checkbox" checked={aiConsent} onChange={toggleAiConsent} {...invalidProps('aiConsent')} />
                  <span className="ay-auth-consent-text">{AI_CONSENT_TEXT}</span>
                </label>
                {/* #12 Pai: trust badges beside the consent line. */}
                <p className="ay-auth-badges" aria-label="How we treat your data"><span>Never sold</span><span>Encrypted in transit</span></p>
                <InlineError id={errId('aiConsent')}>{fieldErrors.aiConsent}</InlineError>
              </div>
            </div>
          )}

          {mode === 'signin' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: '2px 2px 10px' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMeChecked(e.target.checked)}
                style={{ width: 18, height: 18, flex: 'none', margin: 0, accentColor: 'var(--legacy-ink, #3e2723)' }}
              />
              <span style={{ fontFamily: "var(--ayna-font-ui)", lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', fontWeight: 400, color: 'var(--legacy-ink, #3e2723)' }}>Remember me</span>
            </label>
          )}

          {error && <div className="ay-auth-error" role="alert">{error}</div>}
          <InlineError className="ay-inline-err--summary">{summary}</InlineError>


            {mode === 'signup' && (
              <p className="ay-auth-ack">
                {acknowledgementLead('creating an account')}{' '}
                {LEGAL_LINKS.map((l, i) => <span key={l.href}>{i > 0 && (i === LEGAL_LINKS.length - 1 ? ' and ' : ', ')}<a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a></span>)}.
              </p>
            )}
            {mode === 'signup' ? (
              <PrimaryButton onClick={handleSignUp} disabled={loading}>
                <span>{loading ? 'Creating account…' : 'Create account'}</span>
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-heading)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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


          <button type="button" className="ayna-fresh-auth-switch ay-auth-link" onClick={() => {
            setError('');
            setFieldErrors({});
            if (mode === 'signup') setMode('signin');
            else if (canSignUp) setMode('signup');
            else onStartEcosystem?.();
          }}>
            {mode === 'signup' ? 'Already have an account? Sign in' : canSignUp ? <>Don’t have an account? <b>Create one</b></> : <>Don’t have an account? <b>Build your ecosystem</b></>}
          </button>

          {mode !== 'signup' && <div className="ayna-fresh-auth-trust" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, opacity: 0.6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFEDAC" strokeWidth="2" strokeLinecap="round">
              <rect x="5" y="11" width="14" height="10" rx="2.5" />
              <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
            </svg>
            <span style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', letterSpacing: '.2px' }}>Encrypted. Never sold.</span>
          </div>}
        </>
      )}
      <LegalFooter variant="light" />
    </div>
  );
}
