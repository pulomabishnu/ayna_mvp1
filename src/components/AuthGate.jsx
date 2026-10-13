import React, { useState } from 'react';
import { getGooglePkceClient, getSupabaseClient } from '../utils/supabaseClient';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { CONSENT_VERSION, stashPendingConsent, stashPendingSignupMeta } from '../utils/pendingConsent.js';
import { HEARD_ABOUT_OPTIONS, HEARD_ABOUT_OTHER_MAX, heardAboutMetadata } from '../utils/heardAbout.js';
import '../styles/audit-qya.css';
import './AuthGate.css';

// One short line per tab (audit AU01).
const SUBTITLES = { signup: 'Make your shop yours.', signin: 'Welcome back.' };

/** Visible label above an input, with its error underneath (audit AU03). */
function Field({ id, label, error, children }) {
  return <div className="ay-auth-field">
    <label htmlFor={id}>{label}</label>
    {children}
    {error && <p id={`${id}-err`} className="ay-auth-err" role="alert">{error}</p>}
  </div>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Three statements, one checkbox each. The AI statement's wording and the
// 18+ confirmation come from the 2026-09 legal hardening on main (ayna
// accounts are 18+ only); the 18+ confirmation is its own sentence on the
// third statement so the form keeps three boxes.
const CONSENT_ITEMS = [
  'The health information I share with ayna is self-reported wellness information, not a clinical record.',
  'When I intentionally use an AI-powered feature, limited relevant wellness context may be processed by an external AI provider to generate my requested response. ayna minimizes the context sent, protects it in transit, and does not sell it.',
  'ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider. I confirm that I am at least 18 years old.',
];

const AGE_REQUIREMENT_VERSION = '18plus-v1';
/** "Where did you hear about us?" as the label string main's admin reviews
 * (api/reviews-admin.js) read from `heard_about_us`, written next to our
 * structured `heard_about` / `heard_about_other` fields. */
function heardAboutUsLabel(value, otherText) {
  const option = HEARD_ABOUT_OPTIONS.find((o) => o.value === value);
  if (!option) return '';
  const other = String(otherText || '').trim().replace(/\s+/g, ' ').slice(0, HEARD_ABOUT_OTHER_MAX);
  return value === 'other' && other ? `Other: ${other}` : option.label;
}

/** Consent + 18+ fields recorded on every new account (all signup paths and ConsentGate). */
function consentMetadata() {
  const now = new Date().toISOString();
  return {
    consent_given_at: now,
    consent_version: CONSENT_VERSION,
    age_18_confirmed: true,
    age_18_confirmed_at: now,
    age_requirement_version: AGE_REQUIREMENT_VERSION,
  };
}

export default function AuthGate({ isModal = false, embedded = false, onSkip, context, onBeforeOAuthRedirect, onStartEcosystem, initialMode, summary = null, allowSignup = false, onAuthenticated }) {
  useEscapeToClose(isModal, onSkip);
  // 'signup' | 'signin'. An account can only be created in the save step after
  // the quiz (allowSignup). Every other entry point is sign-in only, with
  // "Don't have an account? Build your ecosystem" starting the quiz instead.
  const [mode, setMode] = useState(() => (allowSignup && initialMode !== 'signin' ? 'signup' : 'signin'));
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checked, setChecked] = useState([false, false, false]);
  // Optional "Where did you hear about us?" (saved in user metadata).
  const [heardAbout, setHeardAbout] = useState('');
  const [heardOther, setHeardOther] = useState('');
  const heardLabel = heardAboutUsLabel(heardAbout, heardOther);
  const heardMeta = { ...heardAboutMetadata(heardAbout, heardOther), ...(heardLabel ? { heard_about_us: heardLabel } : {}) };
  // Two real signups reported never getting a confirmation email
  // (2026-08-25), Supabase's built-in email sender has a very low rate
  // limit and no delivery guarantee, so a signup silently succeeding with
  // no email actually arriving is a known, real failure mode, not a fluke.
  // Can't fix the underlying sender from this codebase (Supabase Dashboard
  // → Authentication → Email/SMTP settings, outside this repo), but a
  // resend option means a stuck user isn't just left staring at "check your
  // inbox" forever.
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  // Email signups verify with the 8-digit code Supabase emails ('details' ->
  // 'code'), not a confirmation link (main, 2026-09).
  const [emailSignupStep, setEmailSignupStep] = useState('details');
  const [emailCode, setEmailCode] = useState('');
  // Signup via native Supabase phone-OTP auth instead of email/password
  // requested 2026-08-25 as an alternative for anyone whose confirmation
  // email never arrives (see the resend feature above). Fully independent
  // of email confirmation: a verified phone creates/signs in the account
  // directly, no email step involved at all. Requires Twilio to actually be
  // configured as Supabase's SMS provider (Authentication → Phone in the
  // Supabase Dashboard), this code can't set that up, only use it once set.
  const [authMethod, setAuthMethod] = useState('email');
  const [showPhoneNotice, setShowPhoneNotice] = useState(false);
  const [phoneStep, setPhoneStep] = useState('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  const supabase = getSupabaseClient();
  const allConsented = checked.every(Boolean);
  const isSignup = allowSignup && mode === 'signup';
  const subtitle = isSignup && summary ? 'Save your matches. Create an account to keep them.' : SUBTITLES[mode];

  // Password reset (2026-09-22 audit): the emailed link lands on
  // /auth/callback, which handles type=recovery with a new-password form.
  const [resetting, setResetting] = useState(false);
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setError('');
    setSuccessMsg('');
    if (!cleanEmail) { setFieldErrors((prev) => ({ ...prev, email: 'Add your email, then tap "Forgot password?".' })); return; }
    if (!supabase) return;
    setResetting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (resetError) throw resetError;
      setSuccessMsg(`If an account exists for ${cleanEmail}, we sent a link to reset your password.`);
    } catch (e) {
      setError(e?.message || 'Could not send a reset email right now. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  // Health-data consent stays explicit: one checkbox per statement.
  const toggleCheck = (i) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
    setFieldErrors((prev) => (prev.consent ? { ...prev, consent: '' } : prev));
  };
  const clearFieldError = (key) => setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  const fieldProps = (key) => ({
    'aria-invalid': fieldErrors[key] ? true : undefined,
    'aria-describedby': fieldErrors[key] ? `auth-${key}-err` : undefined,
  });
  const validate = () => {
    const next = {};
    if (isSignup && !firstName.trim()) next.firstName = 'Add your first name.';
    if (!email.trim()) next.email = 'Add your email.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'That email doesn’t look right.';
    if (!password) next.password = 'Add your password.';
    else if (isSignup && password.length < 8) next.password = 'Use at least 8 characters.';
    if (isSignup && !allConsented) next.consent = 'Please tick all three to continue.';
    setFieldErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setSuccessMsg('');
    setResendMsg('');
    setNeedsConfirmation(false);
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (isSignup) {
        const cleanFirstName = firstName.trim();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: 'https://www.aynahealth.co/confirmed',
            data: {
              ...heardMeta,
              first_name: cleanFirstName,
              full_name: cleanFirstName,
              ...consentMetadata(),
            },
          },
        });
        if (error) throw error;
        if (data.user?.identities?.length === 0) {
          setError('An account with this email already exists. Sign in instead.');
          setMode('signin');
          return;
        }
        if (data.session) {
          // Supabase already returned a live session, meaning this project's
          // "Confirm email" setting is off, no confirmation email is coming.
          // Telling her to go check her inbox here would be actively wrong:
          // she's already signed in, which App.jsx's onAuthStateChange handler
          // is about to act on.
          setSuccessMsg('You\'re all set. Signing you in...');
          onAuthenticated?.(data.user || data.session.user, data.session);
        } else {
          setEmailSignupStep('code');
          setEmailCode('');
          setSuccessMsg(`We sent a verification code to ${cleanEmail}. Enter it below to finish creating your account.`);
          setNeedsConfirmation(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          // Real, known failure mode (found live 2026-08-25): a user whose
          // email was never verified tries to sign in anyway. Offer the
          // verification code step right here instead of a dead-end error.
          if (error.code === 'email_not_confirmed' || /email[_ ]not[_ ]confirmed|confirm your email|not verified/i.test(error.message || '')) {
            setNeedsConfirmation(true);
            setEmailSignupStep('code');
            setEmailCode('');
            setSuccessMsg('Your email still needs verification. Enter the code from your email below.');
          }
          throw error;
        }
        if (!data?.session?.user) throw new Error('Sign-in succeeded but no session was created. Please try again.');
        setSuccessMsg('Signed in. Welcome back…');
        onAuthenticated?.(data.user || data.session.user, data.session);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMsg('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: 'https://www.aynahealth.co/confirmed' },
      });
      if (error) throw error;
      setResendMsg('New code sent. Check your inbox and spam folder.');
    } catch (err) {
      setResendMsg(err.message || 'Could not resend right now. Try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!supabase || !email) return;
    const token = emailCode.replace(/\D/g, '').slice(0, 8);
    if (!/^\d{8}$/.test(token)) {
      setError('Enter the 8-digit verification code from your email.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'email',
      });
      if (error) throw error;
      if (!data?.session) {
        throw new Error('Your email was verified, but we could not start your session. Please sign in.');
      }
      setNeedsConfirmation(false);
      setResendMsg('');
      setSuccessMsg('Email verified. Signing you in...');
      onAuthenticated?.(data.user || data.session.user, data.session);
    } catch (err) {
      setError(
        /expired|invalid|token/i.test(err?.message || '')
          ? 'That code is invalid or expired. Request a new code and try again.'
          : (err.message || 'Could not verify that code. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Same US-default E.164 normalization as the server's normalizeE164
  // (api/_otp.js), kept independent since that one's server-only, but
  // matching it means a number that works for one phone feature works for
  // this one too, no surprise "invalid number" for something the rest of
  // the app already accepts.
  const normalizePhoneE164 = (raw) => {
    const trimmed = String(raw || '').trim();
    if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed;
    const digits = trimmed.replace(/[^\d]/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return null;
  };

  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    // Phone signup creates the account too, so the same consent bar applies.
    if (!allConsented) {
      setFieldErrors((prev) => ({ ...prev, consent: 'Please tick all three to continue.' }));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const e164 = normalizePhoneE164(phoneNumber);
      if (!e164) throw new Error('Please enter a valid 10-digit phone number.');
      const cleanFirstName = firstName.trim();
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164,
        options: {
          data: {
            ...heardMeta,
            first_name: cleanFirstName,
            full_name: cleanFirstName,
            ...consentMetadata(),
          },
        },
      });
      if (error) throw error;
      setPhoneNumber(e164);
      setPhoneStep('code');
    } catch (err) {
      setError(err.message || 'Could not send a code right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: phoneCode.trim(),
        type: 'sms',
      });
      if (error) throw error;
      // Session now exists. Hand it to App directly (main, 2026-09: waiting
      // only on onAuthStateChange could hang), the SIGNED_IN handler still runs.
      if (data?.session?.user) onAuthenticated?.(data.user || data.session.user, data.session);
    } catch (err) {
      setError(err.message || 'That code is wrong or expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (isSignup && !allConsented) {
      setFieldErrors((prev) => ({ ...prev, consent: 'Please tick all three to continue.' }));
      return;
    }
    const googleClient = getGooglePkceClient();
    if (!googleClient) {
      setError('Supabase is not configured. Check environment variables.');
      return;
    }
    setError('');
    setGoogleLoading(true);
    try {
      // Record consent only after the signup boxes are checked.
      // Supabase's Google provider auto-provisions an account for any unseen
      // Google address, so a first-time visitor using "Sign in" still gets an
      // account; recording consent for her would claim agreement she never
      // gave. App shows ConsentGate (below) to any OAuth account with no
      // consent on record instead (main, 2026-09).
      if (isSignup) {
        stashPendingSignupMeta({ ...heardMeta, ...consentMetadata() });
        stashPendingConsent();
      } else {
        stashPendingSignupMeta(null);
      }
      if (onBeforeOAuthRedirect) onBeforeOAuthRedirect();
      const { error } = await googleClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Could not sign in with Google.');
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    if (isSignup && !allConsented) {
      setFieldErrors((prev) => ({ ...prev, consent: 'Please tick all three to continue.' }));
      return;
    }
    if (!supabase) {
      setError('Supabase is not configured. Check environment variables.');
      return;
    }
    setError('');
    setAppleLoading(true);
    try {
      // Same reasoning as handleGoogle just above: Apple's provider also
      // auto-provisions an account for any unseen Apple ID.
      if (isSignup) {
        stashPendingSignupMeta({ ...heardMeta, ...consentMetadata() });
        stashPendingConsent();
      } else {
        stashPendingSignupMeta(null);
      }
      if (onBeforeOAuthRedirect) onBeforeOAuthRedirect();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Could not sign in with Apple.');
      setAppleLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setFieldErrors({});
    setSuccessMsg('');
    setAuthMethod('email');
    setPhoneStep('number');
    setChecked([false, false, false]);
    setEmailSignupStep('details');
    setEmailCode('');
    setNeedsConfirmation(false);
    setResendMsg('');
  };

  const switchAuthMethod = (next) => {
    setAuthMethod(next);
    setError('');
    setSuccessMsg('');
    setNeedsConfirmation(false);
    setPhoneStep('number');
    setEmailSignupStep('details');
    setEmailCode('');
    setResendMsg('');
  };

  const overlayStyle = isModal ? {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflowY: 'auto',
    // Ink at 60% over everything, header included (audit AU04).
    background: 'rgba(29, 26, 43, 0.6)',
    zIndex: 1700,
    padding: '96px 16px 24px',
  } : embedded ? {
    // Inline on a page (no overlay), e.g. a landing section.
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: 'transparent',
    padding: 0,
  } : {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    padding: '1.5rem',
  };

  return (
    <div
      className={isModal ? 'ay-auth-overlay' : undefined}
      style={overlayStyle}
      onClick={isModal && onSkip ? (e) => { if (e.target === e.currentTarget) onSkip(); } : undefined}
    >
      <div className="ay-auth-card" style={styles.card}>
        {isModal && onSkip && (
          <button type="button" className="ay-auth-close" onClick={onSkip} style={styles.closeBtn} aria-label="Close">×</button>
        )}

        <div className="ay-auth-logo" style={styles.logo}>ayna</div>
        <p className="ay-auth-tagline" style={styles.tagline}>{subtitle}</p>

        {!supabase && (
          // Without this, a missing/blank .env.local silently disabled the
          // email/password submit button with zero feedback, clicking it
          // did nothing, no error, no console output, nothing to search for.
          // The Google button already surfaced this same problem via its own
          // error state; email/password had no equivalent, so it looked
          // exactly like a hang rather than a config gap.
          // (Public copy: no env var names on a live page.)
          <p style={styles.configWarning}>
            Sign-in isn't configured on this device: the connection is unavailable. Please try again later.
          </p>
        )}

        {isSignup && summary && (
          <div className="ay-auth-summary">
            <div className="ay-auth-summary__thumbs" aria-hidden="true">
              {(summary.products || []).slice(0, 4).map((p) => (
                <span key={p.id}>{p.image ? <img src={p.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : null}</span>
              ))}
            </div>
            <div>
              <strong>{summary.count} pick{summary.count === 1 ? '' : 's'}{summary.areas?.length ? ` · ${summary.areas.length} area${summary.areas.length === 1 ? '' : 's'}` : ''}</strong>
              <span>{(summary.areas || []).slice(0, 3).join(', ')}</span>
            </div>
          </div>
        )}

        {allowSignup && <div className="ay-auth-toggle" style={styles.toggleRow}>
          <button
            type="button"
            className={isSignup ? 'is-on' : ''}
            style={{ ...styles.toggleBtn, ...(isSignup ? styles.toggleBtnActive : {}) }}
            onClick={() => switchMode('signup')}
          >
            Create account
          </button>
          <button
            type="button"
            className={!isSignup ? 'is-on' : ''}
            style={{ ...styles.toggleBtn, ...(!isSignup ? styles.toggleBtnActive : {}) }}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
        </div>}

        {showPhoneNotice && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-coming-soon-title"
            onClick={() => setShowPhoneNotice(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(28, 25, 23, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', zIndex: 1200 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '20px', padding: '2rem', boxShadow: '0 18px 50px rgba(28, 25, 23, 0.18)', textAlign: 'center' }}
            >
              <div style={{ color: '#f97316', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>ayna</div>
              <h2 id="phone-coming-soon-title" style={{ margin: '0 0 0.75rem', fontSize: '1.4rem', color: '#1c1917' }}>
                Phone sign-up is coming soon
              </h2>
              <p style={{ margin: '0 0 1.5rem', color: '#57534e', lineHeight: 1.6 }}>
                We’re still putting the finishing touches on phone verification. For now, please create your ayna account with email or Google.
              </p>
              <button
                type="button"
                onClick={() => setShowPhoneNotice(false)}
                style={{ width: '100%', border: 'none', borderRadius: '12px', padding: '0.9rem 1rem', background: '#f97316', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
              >
                Continue with email
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={
            isSignup && authMethod === 'phone'
              ? (phoneStep === 'number' ? handleSendPhoneOtp : handleVerifyPhoneOtp)
              : authMethod === 'email' && emailSignupStep === 'code'
                ? handleVerifyEmailOtp
                : handleEmailAuth
          }
          style={styles.form}
          noValidate
        >
          {isSignup && authMethod === 'phone' && (
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={!allConsented || phoneStep === 'code'}
              style={{ ...styles.input, ...((!allConsented || phoneStep === 'code') ? styles.inputDisabled : {}) }}
              autoComplete="given-name"
              maxLength={50}
            />
          )}

          {isSignup && authMethod === 'phone' ? (
            phoneStep === 'number' ? (
              <input
                type="tel"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={!allConsented}
                style={{ ...styles.input, ...(!allConsented ? styles.inputDisabled : {}) }}
                autoComplete="tel"
              />
            ) : (
              <>
                <p style={{ ...styles.success, color: 'var(--color-text-muted)' }}>
                  We texted a code to {phoneNumber}.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  required
                  style={styles.input}
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => { setPhoneStep('number'); setPhoneCode(''); setError(''); }}
                  style={{ ...styles.link, background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                >
                  Change number
                </button>
              </>
            )
          ) : authMethod === 'email' && emailSignupStep === 'code' ? (
            <>
              <p style={{ ...styles.success, color: 'var(--color-text-muted)' }}>
                Enter the verification code sent to <strong>{email}</strong>.
              </p>
              <Field id="auth-email-code" label="Verification code">
                <input
                  id="auth-email-code"
                  name="emailCode"
                  type="text"
                  inputMode="numeric"
                  placeholder="8-digit code"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  style={styles.input}
                  autoComplete="one-time-code"
                  maxLength={8}
                  autoFocus
                />
              </Field>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="ay-auth-linkbtn"
                  onClick={() => {
                    setEmailSignupStep('details');
                    setEmailCode('');
                    setError('');
                    setSuccessMsg('');
                    setResendMsg('');
                  }}
                >
                  Change email
                </button>
                <button type="button" className="ay-auth-linkbtn" onClick={handleResend} disabled={resending}>
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
              </div>
              {resendMsg && <p style={{ ...styles.success, margin: 0 }}>{resendMsg}</p>}
            </>
          ) : (
            <>
          {isSignup && (
            <Field id="auth-firstName" label="First name" error={fieldErrors.firstName}>
              <input
                id="auth-firstName"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearFieldError('firstName'); }}
                style={styles.input}
                autoComplete="given-name"
                maxLength={50}
                {...fieldProps('firstName')}
              />
            </Field>
          )}
          <Field id="auth-email" label="Email" error={fieldErrors.email}>
            <input
              id="auth-email"
              name="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
              style={styles.input}
              autoComplete="email"
              {...fieldProps('email')}
            />
          </Field>
          <Field id="auth-password" label="Password" error={fieldErrors.password}>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                style={{
                  ...styles.input,
                  width: '100%', boxSizing: 'border-box', paddingRight: '4rem',
                }}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                {...fieldProps('password')}
              />
              <button
                type="button"
                className="ay-auth-show"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '0.25rem', lineHeight: 1 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {isSignup && !fieldErrors.password && <p className="ay-auth-hint">At least 8 characters.</p>}
          </Field>
          {!isSignup && (
            <button
              type="button"
              className="ay-auth-linkbtn ay-auth-forgot"
              onClick={handleForgotPassword}
              disabled={resetting}
              style={{ alignSelf: 'flex-start' }}
            >
              {resetting ? 'Sending reset link…' : 'Forgot password?'}
            </button>
          )}
          {isSignup && (
            <div className="ay-auth-field ay-auth-heard">
              <label htmlFor="auth-heard">Where did you hear about us? <span className="ay-auth-optional">Optional</span></label>
              <select id="auth-heard" name="heardAbout" value={heardAbout} onChange={(e) => setHeardAbout(e.target.value)} className={heardAbout ? '' : 'is-empty'}>
                <option value="">Choose one</option>
                {HEARD_ABOUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {heardAbout === 'other' && (
                <input id="auth-heard-other" name="heardAboutOther" type="text" aria-label="Where you heard about us" placeholder="Tell us where" maxLength={HEARD_ABOUT_OTHER_MAX}
                  value={heardOther} onChange={(e) => setHeardOther(e.target.value)} style={styles.input} autoComplete="off" />
              )}
            </div>
          )}
          {isSignup && (
            <fieldset className="ay-auth-consent" aria-describedby={fieldErrors.consent ? 'auth-consent-err' : undefined}>
              <legend>How we handle your data</legend>
              {CONSENT_ITEMS.map((text, i) => (
                <label key={text} className="ay-auth-check">
                  <input
                    type="checkbox"
                    name={`consent-${i + 1}`}
                    checked={checked[i]}
                    onChange={() => toggleCheck(i)}
                    aria-invalid={fieldErrors.consent && !checked[i] ? true : undefined}
                  />
                  <span>{text}</span>
                </label>
              ))}
              {fieldErrors.consent && <p id="auth-consent-err" className="ay-auth-err" role="alert">{fieldErrors.consent}</p>}
            </fieldset>
          )}
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}
          {successMsg && <p style={styles.success}>{successMsg}</p>}
          {needsConfirmation && authMethod === 'email' && emailSignupStep !== 'code' && (
            <p style={{ ...styles.error, color: 'var(--color-text-muted)' }}>
              Your email still needs verification.{' '}
              <button
                type="button"
                onClick={() => { setEmailSignupStep('code'); setEmailCode(''); setError(''); }}
                style={{ ...styles.link, background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
              >
                Enter verification code
              </button>
              <br />
              Didn&apos;t get a code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{ ...styles.link, background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: resending ? 'not-allowed' : 'pointer' }}
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
              {resendMsg && <><br />{resendMsg}</>}
            </p>
          )}

          <button
            type="submit"
            className="ay-auth-submit"
            disabled={loading || !supabase}
            style={{
              ...styles.primaryBtn,
            }}
          >
            {loading
              ? 'Please wait…'
              : isSignup && authMethod === 'phone'
                ? (phoneStep === 'number' ? 'Send code' : 'Verify')
                : authMethod === 'email' && emailSignupStep === 'code'
                  ? 'Verify email'
                  : isSignup ? 'Create account' : 'Sign in'}
          </button>
          {isSignup && (
            <p className="ay-auth-legal">
              ayna accounts are for adults 18+. By creating an account you agree to our{' '}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              {', '}
              <a href="/consumer-health-data.html" target="_blank" rel="noopener noreferrer">Consumer Health Data Privacy Notice</a>
              {' '}and{' '}
              <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">Terms of Use</a>.
              {' '}
              {authMethod === 'email' ? (
                <button type="button" className="ay-auth-linkbtn" onClick={() => setShowPhoneNotice(true)}>Use my phone number instead</button>
              ) : (
                <button type="button" className="ay-auth-linkbtn" onClick={() => switchAuthMethod('email')}>Use email instead</button>
              )}
            </p>
          )}
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <div className="ay-auth-oauth" style={styles.oauthRow}>
          <button type="button" onClick={handleGoogle} disabled={googleLoading} style={{ ...styles.googleBtn, width: 'min(280px, 100%)' }}>
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <button
            type="button"
            onClick={handleApple}
            disabled={appleLoading}
            style={{
              ...styles.googleBtn,
              width: 'min(280px, 100%)',
            }}
          >
            <AppleIcon />
            {appleLoading ? 'Redirecting…' : 'Continue with Apple'}
          </button>
        </div>

        {!isSignup && (
          <p style={styles.fine}>
            ayna is for adults 18+. By continuing you agree to our{' '}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Privacy Policy</a>
            {' '}and{' '}
            <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Terms of Use</a>.
          </p>
        )}

        {!isSignup && !allowSignup && onStartEcosystem && (
          <button type="button" className="ay-auth-new" onClick={onStartEcosystem}>
            Don’t have an account? <b>Build your ecosystem</b>
          </button>
        )}
        {!isSignup && (
          <p style={styles.fine}>New to ayna? Continuing with Google or Apple creates your account. We&apos;ll ask you to confirm a few statements first.</p>
        )}

        {isModal && onSkip && context !== 'login' && (
          <button type="button" onClick={onSkip} style={styles.skipBtn}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Shown to a signed-in Google/Apple user whose account has no recorded
 * consent, i.e. one auto-created by "Continue with Google/Apple" in sign-in
 * mode, which skips the create-account form where the three statements
 * (incl. 18+) and "Where did you hear about us?" are collected. She can
 * agree, or sign out. Rendered by App.jsx (main, 2026-09).
 */
export function ConsentGate({ onAgreed, onDecline }) {
  const [checked, setChecked] = useState([false, false, false]);
  const [heardAbout, setHeardAbout] = useState('');
  const [heardOther, setHeardOther] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const allChecked = checked.every(Boolean);

  const submit = async () => {
    if (!allChecked) { setError('Please tick all three to continue.'); return; }
    const supabase = getSupabaseClient();
    if (!supabase) { setError('Sign-in is unavailable right now. Please try again later.'); return; }
    setSaving(true);
    setError('');
    const label = heardAboutUsLabel(heardAbout, heardOther);
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          ...heardAboutMetadata(heardAbout, heardOther),
          ...(label ? { heard_about_us: label } : {}),
          ...consentMetadata(),
        },
      });
      if (updateError) throw updateError;
      onAgreed?.(data?.user || null);
    } catch (err) {
      setError(err?.message || 'Could not save that. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div
      className="ay-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ay-consent-gate-title"
      style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto',
        background: 'rgba(29, 26, 43, 0.6)', zIndex: 1710, padding: '96px 16px 24px',
      }}
    >
      <div className="ay-auth-card" style={styles.card}>
        <div className="ay-auth-logo" style={styles.logo}>ayna</div>
        <p id="ay-consent-gate-title" className="ay-auth-tagline" style={styles.tagline}>One more step. Please confirm the following to finish setting up your account.</p>
        <div style={styles.form}>
          <div className="ay-auth-field ay-auth-heard">
            <label htmlFor="consent-gate-heard">Where did you hear about us? <span className="ay-auth-optional">Optional</span></label>
            <select id="consent-gate-heard" name="heardAbout" value={heardAbout} onChange={(e) => setHeardAbout(e.target.value)} className={heardAbout ? '' : 'is-empty'}>
              <option value="">Choose one</option>
              {HEARD_ABOUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {heardAbout === 'other' && (
              <input name="heardAboutOther" type="text" aria-label="Where you heard about us" placeholder="Tell us where" maxLength={HEARD_ABOUT_OTHER_MAX}
                value={heardOther} onChange={(e) => setHeardOther(e.target.value)} style={styles.input} autoComplete="off" />
            )}
          </div>
          <fieldset className="ay-auth-consent">
            <legend>How we handle your data</legend>
            {CONSENT_ITEMS.map((text, i) => (
              <label key={text} className="ay-auth-check">
                <input
                  type="checkbox"
                  name={`consent-gate-${i + 1}`}
                  checked={checked[i]}
                  onChange={() => { setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v))); setError(''); }}
                />
                <span>{text}</span>
              </label>
            ))}
          </fieldset>
          {error && <p className="ay-auth-err" role="alert">{error}</p>}
          <button
            type="button"
            className="ay-auth-submit"
            onClick={submit}
            disabled={saving}
            style={{ ...styles.primaryBtn, ...(!allChecked || saving ? styles.primaryBtnDisabled : {}) }}
          >
            {saving ? 'Saving…' : 'Agree and continue'}
          </button>
          <p className="ay-auth-legal">
            ayna accounts are for adults 18+. By continuing you agree to our{' '}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            {', '}
            <a href="/consumer-health-data.html" target="_blank" rel="noopener noreferrer">Consumer Health Data Privacy Notice</a>
            {' '}and{' '}
            <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">Terms of Use</a>.
          </p>
        </div>
        <button type="button" onClick={onDecline} style={styles.skipBtn}>No thanks, sign me out</button>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#000000" d="M13.06 9.53c-.02-1.96 1.6-2.9 1.67-2.94-.91-1.33-2.33-1.51-2.84-1.53-1.21-.12-2.36.71-2.97.71-.62 0-1.55-.7-2.55-.68-1.31.02-2.53.76-3.2 1.93-1.37 2.37-.35 5.87.98 7.79.65.94 1.42 1.99 2.44 1.96 0.98-.04 1.35-.63 2.53-.63 1.18 0 1.51.63 2.55.6 1.05-.02 1.72-.95 2.36-1.89.75-1.08 1.05-2.13 1.06-2.18-.02-.01-2.03-.78-2.03-3.13z"/>
      <path fill="#000000" d="M11.1 3.68c.54-.65.9-1.56.8-2.46-.77.03-1.71.51-2.27 1.15-.5.57-.94 1.5-.82 2.38.86.06 1.75-.44 2.29-1.07z"/>
    </svg>
  );
}

const styles = {
  card: {
    position: 'relative',
    background: '#FBF8F2',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 34px 80px rgba(24, 18, 36, 0.34)',
    padding: '1.65rem 2rem 1.6rem',
    margin: '0 auto',
    width: '100%',
    maxWidth: '440px',
    maxHeight: 'calc(100dvh - 2rem)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid #E7E0D4',
    borderRadius: '50%',
    fontSize: '1.35rem',
    color: 'var(--color-text-main)',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
    zIndex: 2,
  },
  logo: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.9rem',
    fontWeight: '500',
    color: '#281B3D',
    textAlign: 'center',
    letterSpacing: '-0.01em',
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: '0.875rem',
    color: '#6E6275',
    textAlign: 'center',
    margin: '-0.15rem 1.5rem 0.25rem',
    lineHeight: 1.45,
  },
  configWarning: {
    fontSize: '0.78rem',
    color: '#92400E',
    background: '#FEF3C7',
    border: '1px solid #FDE68A',
    borderRadius: 'var(--radius-sm)',
    padding: '0.6rem 0.75rem',
    lineHeight: 1.45,
    margin: 0,
  },
  toggleRow: {
    display: 'flex',
    background: '#F1E7D6',
    borderRadius: '999px',
    padding: '4px',
    gap: '4px',
    border: '1px solid rgba(209, 154, 62, 0.12)',
  },
  toggleBtn: {
    flex: 1,
    padding: '0.55rem 0',
    fontSize: '0.85rem',
    fontWeight: '500',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    fontFamily: 'var(--font-body)',
  },
  toggleBtnActive: {
    background: '#FFFFFF',
    color: '#281B3D',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(60, 40, 20, 0.10)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  input: {
    width: '100%',
    padding: '0.78rem 0.9rem',
    fontSize: '0.9rem',
    border: '1.4px solid #E7E0D4',
    borderRadius: '12px',
    background: '#FFFFFF',
    color: '#2C2333',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'border-color var(--transition-fast)',
  },
  inputDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  consentSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem 0.8rem',
    background: '#F1E7D6',
    borderRadius: '12px',
    border: '1px solid #E7E0D4',
    marginTop: '0.15rem',
  },
  consentToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'none',
    border: 'none',
    padding: '0.15rem 0',
    color: '#281B3D',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },

  consentDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
    marginTop: '0.65rem',
  },

  consentItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: '0.15rem',
    flexShrink: 0,
    width: '15px',
    height: '15px',
    accentColor: '#281B3D',
    cursor: 'pointer',
  },
  consentText: {
    fontSize: '0.74rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.4,
  },
  legalNotice: {
    fontSize: '0.72rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.45,
    margin: '-0.1rem 0 0',
    textAlign: 'center',
  },
  link: {
    color: 'var(--color-primary)',
    textDecoration: 'underline',
  },
  primaryBtn: {
    padding: '0.82rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    background: '#E4B25E',
    color: '#1E1430',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    marginTop: '0.25rem',
    fontFamily: 'var(--font-body)',
  },
  primaryBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  error: {
    fontSize: '0.8rem',
    color: '#B91C1C',
    margin: 0,
    lineHeight: 1.4,
  },
  success: {
    fontSize: '0.8rem',
    color: '#15803D',
    margin: 0,
    lineHeight: 1.4,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--color-border)',
    display: 'block',
  },
  dividerText: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
  },
  oauthRow: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.7rem 0.35rem',
    fontSize: '0.76rem',
    fontWeight: '500',
    background: '#FFFFFF',
    color: '#2C2333',
    border: '1.4px solid #E7E0D4',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    fontFamily: 'var(--font-body)',
    textAlign: 'center',
    // No forced nowrap: at the narrowest phone widths the card itself is
    // narrower than 2*(button content), so keeping nowrap here overflowed
    // the card instead of wrapping, minWidth:0 lets the flex item actually
    // shrink so it can wrap to two lines there instead of clipping.
    minWidth: 0,
    flex: 1,
  },
  googleBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  fine: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    lineHeight: 1.45,
    margin: '0.25rem 0 0',
  },
  skipBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    textAlign: 'center',
    padding: '0.25rem',
    fontFamily: 'var(--font-body)',
  },
};
