import React, { useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { useEscapeToClose } from '../utils/useEscapeToClose';

const SUBTITLES = {
  quiz: 'Create an account to save your health profile and keep your ecosystem across sessions.',
  browse: 'Create an account to save your discoveries and track products over time.',
  login: 'Welcome back. Sign in to access your health ecosystem.',
  personalize: 'Personalized results are matched to your health profile — sign in or create an account to turn this on.',
  default: 'Your personal women\'s health manager',
};

const CONSENT_ITEMS = [
  'I understand that the health information I enter into ayna is self-reported wellness data, not a clinical record.',
  'I understand my wellness data is processed by an external AI service to generate personalized recommendations and is NEVER sold. ayna takes rigorous measures to anonymize user data for recommendations and secure storage.',
  'I understand ayna provides wellness information only and is not a substitute for medical advice from a qualified healthcare provider.',
];

const CONSENT_VERSION = 'v1';

export default function AuthGate({ isModal = false, onSkip, context, onBeforeOAuthRedirect, redirectTo }) {
  useEscapeToClose(isModal, onSkip);
  const [mode, setMode] = useState('signup');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checked, setChecked] = useState([false, false, false]);
  // Two real signups reported never getting a confirmation email
  // (2026-08-25) — Supabase's built-in email sender has a very low rate
  // limit and no delivery guarantee, so a signup silently succeeding with
  // no email actually arriving is a known, real failure mode, not a fluke.
  // Can't fix the underlying sender from this codebase (Supabase Dashboard
  // → Authentication → Email/SMTP settings, outside this repo), but a
  // resend option means a stuck user isn't just left staring at "check your
  // inbox" forever.
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  // Signup via native Supabase phone-OTP auth instead of email/password —
  // requested 2026-08-25 as an alternative for anyone whose confirmation
  // email never arrives (see the resend feature above). Fully independent
  // of email confirmation: a verified phone creates/signs in the account
  // directly, no email step involved at all. Requires Twilio to actually be
  // configured as Supabase's SMS provider (Authentication → Phone in the
  // Supabase Dashboard) — this code can't set that up, only use it once set.
  const [authMethod, setAuthMethod] = useState('email');
  const [showPhoneNotice, setShowPhoneNotice] = useState(false);
  const [phoneStep, setPhoneStep] = useState('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);

  const supabase = getSupabaseClient();
  const subtitle = SUBTITLES[context] || SUBTITLES.default;
  const allConsented = checked.every(Boolean);
  const isSignup = mode === 'signup';

  const toggleCheck = (i) =>
    setChecked(prev => prev.map((v, idx) => (idx === i ? !v : v)));

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (isSignup && !allConsented) {
      setError("Please agree to the three statements above before creating your account.");
      return;
    }
    setError('');
    setSuccessMsg('');
    setResendMsg('');
    setNeedsConfirmation(false);
    setLoading(true);
    try {
      if (isSignup) {
        const consentAt = new Date().toISOString();
        const cleanFirstName = firstName.trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/confirmed`,
            data: {
              first_name: cleanFirstName,
              full_name: cleanFirstName,
              consent_given_at: consentAt,
              consent_version: CONSENT_VERSION,
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
          // "Confirm email" setting is off — no confirmation email is coming.
          // Telling her to go check her inbox here would be actively wrong:
          // she's already signed in, which App.jsx's onAuthStateChange handler
          // is about to act on.
          setSuccessMsg('You\'re all set. Signing you in...');
        } else {
          setSuccessMsg('Almost there! A confirmation email is on its way from ayna (puloma@aynahealth.co). Check your spam folder if you don\'t see it. Once confirmed, come back here to sign in.');
          setNeedsConfirmation(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Real, known failure mode (found live 2026-08-25): a user whose
          // confirmation email never arrived tries to sign in anyway and
          // hits this exact, stable Supabase error string. Surface a resend
          // option right here instead of a dead-end error.
          if (/email not confirmed/i.test(error.message || '')) {
            setNeedsConfirmation(true);
          }
          throw error;
        }
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
        email,
        options: { emailRedirectTo: `${window.location.origin}/confirmed` },
      });
      if (error) throw error;
      setResendMsg('Sent! Check your inbox (and spam folder) again in a minute.');
    } catch (err) {
      setResendMsg(err.message || 'Could not resend right now — try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  // Same US-default E.164 normalization as the server's normalizeE164
  // (api/_otp.js) — kept independent since that one's server-only, but
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
    setError('');
    setLoading(true);
    try {
      const e164 = normalizePhoneE164(phoneNumber);
      if (!e164) throw new Error('Please enter a valid 10-digit phone number.');
      const consentAt = new Date().toISOString();
      const cleanFirstName = firstName.trim();
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164,
        options: {
          data: {
            first_name: cleanFirstName,
            full_name: cleanFirstName,
            consent_given_at: consentAt,
            consent_version: CONSENT_VERSION,
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
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: phoneCode.trim(),
        type: 'sms',
      });
      if (error) throw error;
      // Session now exists — App.jsx's onAuthStateChange SIGNED_IN handler
      // takes it from here, same as any other sign-in path.
    } catch (err) {
      setError(err.message || 'That code is wrong or expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (isSignup && !allConsented) {
      setError("Please agree to the three statements above before continuing.");
      return;
    }
    if (!supabase) {
      setError('Supabase is not configured. Check environment variables.');
      return;
    }
    setError('');
    setGoogleLoading(true);
    try {
      // Persist consent so AuthCallback can write it to user metadata after the
      // redirect. Stored in BOTH modes: Supabase's Google provider
      // auto-provisions an account for any unseen Google address, so a
      // first-time visitor who happens to click the "Sign in" toggle used to get
      // an account created — and reach the health intake — with the consent
      // checkboxes never shown and no consent record written at all.
      try {
        sessionStorage.setItem('ayna_pending_consent', JSON.stringify({
          consent_given_at: new Date().toISOString(),
          consent_version: CONSENT_VERSION,
        }));
      } catch (_) { /* private mode */ }
      if (onBeforeOAuthRedirect) onBeforeOAuthRedirect();
      const { error } = await supabase.auth.signInWithOAuth({
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

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccessMsg('');
    setAuthMethod('email');
    setPhoneStep('number');
  };

  const switchAuthMethod = (next) => {
    setAuthMethod(next);
    setError('');
    setSuccessMsg('');
    setNeedsConfirmation(false);
    setPhoneStep('number');
  };

  const overlayStyle = isModal ? {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflowY: 'auto',
    background: 'rgba(28, 25, 23, 0.55)',
    zIndex: 1000,
    padding: '1.25rem',
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
      style={overlayStyle}
      onClick={isModal && onSkip ? (e) => { if (e.target === e.currentTarget) onSkip(); } : undefined}
    >
      <div style={styles.card}>
        {isModal && onSkip && (
          <button type="button" onClick={onSkip} style={styles.closeBtn} aria-label="Skip for now">×</button>
        )}

        <div style={styles.logo}>ayna</div>
        <p style={styles.tagline}>{subtitle}</p>

        {!supabase && (
          // Without this, a missing/blank .env.local silently disabled the
          // email/password submit button with zero feedback — clicking it
          // did nothing, no error, no console output, nothing to search for.
          // The Google button already surfaced this same problem via its own
          // error state; email/password had no equivalent, so it looked
          // exactly like a hang rather than a config gap.
          <p style={styles.configWarning}>
            Sign-in isn't configured on this device: VITE_SUPABASE_URL and
            VITE_SUPABASE_ANON_KEY are missing or empty in .env.local. Add them
            and restart the dev server.
          </p>
        )}

        <div style={styles.toggleRow}>
          <button
            type="button"
            style={{ ...styles.toggleBtn, ...(isSignup ? styles.toggleBtnActive : {}) }}
            onClick={() => switchMode('signup')}
          >
            Create account
          </button>
          <button
            type="button"
            style={{ ...styles.toggleBtn, ...(!isSignup ? styles.toggleBtnActive : {}) }}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
        </div>

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
              : handleEmailAuth
          }
          style={styles.form}
        >
          {isSignup && (
            <>
              <div style={styles.consentSection}>
                {CONSENT_ITEMS.map((text, i) => (
                  <label key={i} style={styles.consentItem}>
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      onChange={() => toggleCheck(i)}
                      style={styles.checkbox}
                    />
                    <span style={styles.consentText}>{text}</span>
                  </label>
                ))}
              </div>

              <p style={styles.legalNotice}>
                By creating an account you agree to ayna's{' '}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={styles.link}>Privacy Policy</a>
                {' '}and{' '}
                <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={styles.link}>Terms of Service</a>.
              </p>

              {authMethod === 'email' ? (
                <button
                  type="button"
                  onClick={() => setShowPhoneNotice(true)}
                  style={{ ...styles.link, background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                >
                  Use my phone number instead
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchAuthMethod('email')}
                  style={{ ...styles.link, background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                >
                  Use email instead
                </button>
              )}
            </>
          )}

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
          ) : (
            <>
          {isSignup && (
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={styles.input}
              autoComplete="given-name"
              maxLength={50}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            autoComplete="email"
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                ...styles.input,
                width: '100%', boxSizing: 'border-box', paddingRight: '2.5rem',
              }}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={isSignup ? 8 : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1rem', padding: '0.25rem', lineHeight: 1 }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}
          {successMsg && <p style={styles.success}>{successMsg}</p>}
          {needsConfirmation && authMethod === 'email' && (
            <p style={{ ...styles.error, color: 'var(--color-text-muted)' }}>
              Didn&apos;t get it?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{ ...styles.link, background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: resending ? 'not-allowed' : 'pointer' }}
              >
                {resending ? 'Sending…' : 'Resend confirmation email'}
              </button>
              {resendMsg && <><br />{resendMsg}</>}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !supabase}
            style={{
              ...styles.primaryBtn,
            }}
          >
            {loading
              ? 'Please wait…'
              : isSignup && authMethod === 'phone'
                ? (phoneStep === 'number' ? 'Send code' : 'Verify')
                : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            ...styles.googleBtn,
          }}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {!isSignup && (
          <p style={styles.fine}>
            By continuing you agree to our{' '}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Privacy Policy</a>
            {' '}and{' '}
            <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Terms of Use</a>.
          </p>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

const styles = {
  card: {
    position: 'relative',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    padding: '2rem 2rem',
    margin: '1.25rem auto',
    width: '100%',
    maxWidth: '520px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    fontSize: '1.4rem',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0.1rem 0.3rem',
  },
  logo: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.9rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  tagline: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    margin: '-0.25rem 0 0.25rem',
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
    background: 'var(--color-secondary)',
    borderRadius: 'var(--radius-pill)',
    padding: '3px',
    gap: '3px',
  },
  toggleBtn: {
    flex: 1,
    padding: '0.45rem 0',
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
    background: 'var(--color-surface)',
    color: 'var(--color-primary)',
    fontWeight: '600',
    boxShadow: 'var(--shadow-sm)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: {
    width: '100%',
    padding: '0.7rem 1rem',
    fontSize: '0.9rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface-soft)',
    color: 'var(--color-text-main)',
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
    gap: '0.6rem',
    padding: '0.85rem',
    background: 'var(--color-surface-soft)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    marginTop: '0.15rem',
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
    accentColor: 'var(--color-primary)',
    cursor: 'pointer',
  },
  consentText: {
    fontSize: '0.78rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.45,
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
    padding: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    background: 'var(--color-primary)',
    color: 'var(--color-text-light)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
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
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.65rem',
    padding: '0.7rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    background: 'var(--color-surface)',
    color: 'var(--color-text-main)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    fontFamily: 'var(--font-body)',
    width: '100%',
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
