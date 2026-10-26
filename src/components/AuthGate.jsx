import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseClient, setRememberMe } from '../utils/supabaseClient';
import { CODE_COPY, EMAIL_CODE_LENGTH, SMS_CODE_LENGTH, cleanCode, codeErrorText, isEmailNotConfirmed, verifyEmailCode } from '../utils/authCodes.js';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { stashPendingConsent, stashPendingSignupMeta } from '../utils/pendingConsent.js';
import { pendingReferralMeta } from '../utils/freeProductCampaign.js';
import { AI_CONSENT_ERROR, AI_CONSENT_TEXT, acknowledgementLead, LEGAL_LINKS, consentMetadata, markAskHeardAbout } from '../utils/signupConsent.js';
import { cleanFirstName } from '../mobile/data/intakeModel.js';
import { clearError, errorSummary, firstErrorKey, revealField, warnHaptic } from '../utils/formErrors.js';
import InlineError from './InlineError.jsx';
import '../styles/audit-qya.css';
import './AuthGate.css';
import { maskedChange, formatUsPhone } from '../utils/inputMask.js';

// One short line per tab (audit AU01).
const SUBTITLES = { signup: 'Free. We never sell your health information.', signin: 'Sign in to your ayna account.' };

/** Visible label above an input, with its error underneath (audit AU03). */
function Field({ id, label, error, children }) {
  return <div className="ay-auth-field">
    <label htmlFor={id}>{label}</label>
    {children}
    <InlineError id={`${id}-err`}>{error}</InlineError>
  </div>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Onboarding audit (Oct 25): email + password only (her name comes from the
// quiz), one required AI-processing box; the acknowledgements and 18+ are
// one sentence above the button (src/utils/signupConsent.js).
const ERROR_ORDER = ['email', 'password', 'aiConsent'];
const FIELD_IDS = { email: 'auth-email', password: 'auth-password', aiConsent: 'auth-consent-ai' };

/** Scrolls to and focuses the first field in `errors` (inside `root`). */
function revealFirstError(errors, root) {
  const first = firstErrorKey(errors, ERROR_ORDER);
  if (!first) return;
  warnHaptic();
  window.requestAnimationFrame(() => revealField((root || document).querySelector(`#${FIELD_IDS[first]}`)));
}

/** The required AI-processing checkbox, with the trust badges beside it (audit section 11). */
export function AiConsentBox({ id, checked, onChange, error }) {
  return <div className="ay-auth-check-item ay-auth-ai">
    <label className={`ay-auth-check${error ? ' ay-check-invalid' : ''}`}>
      <input id={id} type="checkbox" name="consent-ai" checked={checked} onChange={onChange}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} />
      <span>{AI_CONSENT_TEXT}</span>
    </label>
    <p className="ay-auth-badges" aria-label="How we treat your data"><span>Never sold</span><span>Encrypted in transit</span></p>
    <InlineError id={`${id}-err`}>{error}</InlineError>
  </div>;
}

/** The acknowledgements + legal links as one sentence (above the button). */
export function AcknowledgementLine({ action = 'creating an account', className = 'ay-auth-ack' }) {
  return <p className={className}>
    {acknowledgementLead(action)}{' '}
    {LEGAL_LINKS.map((l, i) => <React.Fragment key={l.href}>
      {i > 0 && (i === LEGAL_LINKS.length - 1 ? ' and ' : ', ')}
      <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
    </React.Fragment>)}.
  </p>;
}

export default function AuthGate({ isModal = false, embedded = false, onSkip, context, feature = '', onBeforeOAuthRedirect, onStartEcosystem, initialMode, summary = null, allowSignup = false, onAuthenticated, firstName: intakeName = '', title = '' }) {
  useEscapeToClose(isModal, onSkip);
  // 'signup' | 'signin'. An account can only be created in the save step after
  // the quiz (allowSignup). Every other entry point is sign-in only, with
  // "Don't have an account? Build your ecosystem" starting the quiz instead.
  const [mode, setMode] = useState(() => (allowSignup && initialMode !== 'signin' ? 'signup' : 'signin'));
  // Her first name from the quiz (asked there only, never again here).
  const firstName = cleanFirstName(intakeName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [summaryAction, setSummaryAction] = useState('create your account');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  // Remember me (sign-in): controls ONLY where the Supabase session token is
  // stored (localStorage vs sessionStorage, src/utils/supabaseClient.js).
  // Defaults on. Never deletes any account data.
  // Off by default: on a shared or library computer a health app should not stay signed in.
  const [rememberMe, setRememberMeChecked] = useState(false);
  // Name fields only when the quiz gave one.
  const nameMeta = firstName ? { first_name: firstName, full_name: firstName } : {};
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
  const isSignup = allowSignup && mode === 'signup';
  // Per-feature sign-in titles that name the action (walkthrough P1-23,
  // docs/terminology.md), not "Sign in to use posting".
  const FEATURE_TITLES = {
    posting: 'Sign in to post', reactions: 'Sign in to mark posts helpful', 'saved posts': 'Sign in to save posts',
    reviews: 'Sign in to write a review', playlists: 'Sign in to make a playlist', 'friend recommendations': 'Sign in to recommend to a friend',
    questions: 'Sign in to ask a question', Community: 'Sign in to join Community', 'Ask ayna': 'Sign in to ask ayna',
    'appointment prep': 'Sign in to prepare for an appointment', 'recall alerts': 'Sign in to get recall alerts', comparisons: 'Sign in to compare products',
    'your hidden products': 'Sign in to see your hidden products', 'your health profile': 'Sign in to edit your answers', 'ayna by text': 'Sign in to text ayna',
    'screening reminders': 'Sign in to see screening reminders', 'account settings': 'Sign in to manage your account', 'health data': 'Sign in to connect health data',
  };
  // Why we are asking, when the user came from a specific door (Saved heart, My ecosystem).
  const CONTEXT_COPY = {
    saved: { title: 'Looking for what you saved?', line: 'Sign in to see what you saved.' },
    'save-item': { title: 'Save this to your ayna', line: 'Sign in to keep products, resources and recommendations in one place. New here? Start with the quiz, then save.' },
    // Logged-out copy from the UX spec (24): say what she gets, not "Sign in required".
    ecosystem: { title: 'Build your health ecosystem', line: 'Sign in to save your health interests, matches and recommendations in one place.' },
    personalize: { title: 'See how well this matches you', line: 'Create your health profile to see your personalized match and why.' },
    feature: { title: feature ? (FEATURE_TITLES[feature] || `Sign in for ${feature}`) : 'This needs an account', line: 'Take the short quiz to start, or sign in if you already have an account.' },
    login: { title: 'Sign in', line: 'Welcome to ayna. New here? Start with the quiz.' },
  };
  const ctxCopy = !isSignup ? CONTEXT_COPY[context] : null;
  const cardRef = useRef(null);
  useEffect(() => {
    if (!isModal) return undefined;
    const prev = document.activeElement;
    const t = window.setTimeout(() => cardRef.current?.querySelector('input, button')?.focus(), 30);
    return () => { window.clearTimeout(t); try { prev?.focus?.(); } catch { /* element gone */ } };
  }, [isModal]);
  const subtitle = ctxCopy ? ctxCopy.line : SUBTITLES[mode];
  // Sign-up is offered as "save these" (onboarding audit section 6).
  const signupTitle = title || 'Save your matches';

  // Password reset (2026-09-22 audit): the emailed link lands on
  // /auth/callback, which handles type=recovery with a new-password form.
  const [resetting, setResetting] = useState(false);
  // Forgot password is its own small step with its own email field (it used to
  // answer the click with an error asking for the email first).
  const [resetView, setResetView] = useState(false);
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setError('');
    setSuccessMsg('');
    if (!cleanEmail) { setFieldErrors((prev) => ({ ...prev, email: 'Add the email you signed up with.' })); return; }
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

  // The AI-processing consent stays an explicit, unticked-by-default choice.
  const toggleAiConsent = () => {
    setAiConsent((v) => !v);
    setFieldErrors((prev) => clearError(prev, 'aiConsent'));
  };
  const clearFieldError = (key) => setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  const fieldProps = (key) => ({
    'aria-invalid': fieldErrors[key] ? true : undefined,
    'aria-describedby': fieldErrors[key] ? `auth-${key}-err` : undefined,
  });
  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Add your email.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Check your email. It needs an @ and a domain, like you@email.com.';
    if (!password) next.password = isSignup ? 'Add a password.' : 'Add your password.';
    else if (isSignup && password.length < 8) next.password = 'Use at least 8 characters for your password.';
    if (isSignup && !aiConsent) next.aiConsent = AI_CONSENT_ERROR;
    setFieldErrors(next);
    setSummaryAction(isSignup ? 'create your account' : 'sign in');
    revealFirstError(next, cardRef.current);
    return Object.values(next).every((v) => !v);
  };

  // Shared signup gate for the paths that skip validate(): Google, Apple and
  // phone. Returns true when the one required consent is ticked, setting
  // the field error otherwise.
  const signupPrereqsOk = () => {
    if (!isSignup) return true;
    const next = {};
    if (!aiConsent) next.aiConsent = AI_CONSENT_ERROR;
    // Only what this path needs, so stale email/password messages don't linger.
    setFieldErrors(next);
    setSummaryAction('continue');
    if (Object.keys(next).length) {
      revealFirstError(next, cardRef.current);
      return false;
    }
    return true;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setSuccessMsg('');
    setResendMsg('');
    setNeedsConfirmation(false);
    setLoading(true);
    // Applies to the session this submit is about to create. Signup always
    // persists (no checkbox there); the sign-in checkbox decides otherwise.
    setRememberMe(isSignup ? true : rememberMe);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: 'https://www.aynahealth.co/confirmed',
            data: {
              ...pendingReferralMeta(),
              ...nameMeta,
              ...consentMetadata(),
            },
          },
        });
        if (error) throw error;
        // "Where did you hear about us?" comes after sign-up, optional.
        if (data.user?.identities?.length !== 0) markAskHeardAbout();
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
          setSuccessMsg(CODE_COPY.emailSent(cleanEmail));
          setNeedsConfirmation(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          // Real, known failure mode (found live 2026-08-25): a user whose
          // email was never verified tries to sign in anyway. Offer the
          // verification code step right here instead of a dead-end error.
          if (isEmailNotConfirmed(error)) {
            setNeedsConfirmation(true);
            setEmailSignupStep('code');
            setEmailCode('');
            setSuccessMsg(CODE_COPY.emailNotConfirmed);
          }
          throw error;
        }
        if (!data?.session?.user) throw new Error('Sign-in succeeded but no session was created. Please try again.');
        setSuccessMsg('Signed in. Welcome back…');
        onAuthenticated?.(data.user || data.session.user, data.session);
      }
    } catch (err) {
      setError(err.message || 'We couldn’t sign you in. Check your email and password, then try again.');
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
      setResendMsg(CODE_COPY.resent);
    } catch (err) {
      setResendMsg(err.message || 'Could not resend right now. Try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!supabase || !email) return;
    if (cleanCode(emailCode, EMAIL_CODE_LENGTH).length !== EMAIL_CODE_LENGTH) {
      setError(CODE_COPY.emailPrompt);
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      // Same check, length and words as the app (src/utils/authCodes.js).
      const data = await verifyEmailCode(supabase, email, emailCode);
      setNeedsConfirmation(false);
      setResendMsg('');
      setSuccessMsg(CODE_COPY.verified);
      onAuthenticated?.(data.user || data.session.user, data.session);
    } catch (err) {
      setError(err.message || CODE_COPY.wrongOrExpired);
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
    // Phone signup creates the account too, so the same consent and
    // heard-about requirements apply.
    if (!signupPrereqsOk()) return;
    setError('');
    setLoading(true);
    setRememberMe(true);
    try {
      const e164 = normalizePhoneE164(phoneNumber);
      if (!e164) throw new Error('Please enter a valid 10-digit phone number.');
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164,
        options: {
          data: {
            ...pendingReferralMeta(),
            ...nameMeta,
            ...consentMetadata(),
          },
        },
      });
      if (error) throw error;
      markAskHeardAbout();
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
        token: cleanCode(phoneCode, SMS_CODE_LENGTH),
        type: 'sms',
      });
      if (error) throw error;
      // Session now exists. Hand it to App directly (main, 2026-09: waiting
      // only on onAuthStateChange could hang), the SIGNED_IN handler still runs.
      if (data?.session?.user) onAuthenticated?.(data.user || data.session.user, data.session);
    } catch (err) {
      setError(codeErrorText(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!signupPrereqsOk()) return;
    if (!supabase) {
      setError('Supabase is not configured. Check environment variables.');
      return;
    }
    setError('');
    setGoogleLoading(true);
    // Before the redirect: the flag must already be set when /auth/callback
    // writes the returned session (setSession) through the storage adapter.
    setRememberMe(isSignup ? true : rememberMe);
    try {
      // Persist consent so AuthCallback can write it to user metadata after the
      // redirect, ONLY when the boxes were actually ticked (signup mode).
      // Supabase's Google provider auto-provisions an account for any unseen
      // Google address, so a first-time visitor using "Sign in" still gets an
      // account; recording consent for her would claim agreement she never
      // gave. App shows ConsentGate (below) to any OAuth account with no
      // consent on record instead (main, 2026-09).
      if (isSignup) {
        stashPendingSignupMeta({ ...nameMeta, ...consentMetadata() });
        stashPendingConsent();
        markAskHeardAbout();
      } else {
        stashPendingSignupMeta(null);
      }
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

  const handleApple = async () => {
    if (!signupPrereqsOk()) return;
    if (!supabase) {
      setError('Supabase is not configured. Check environment variables.');
      return;
    }
    setError('');
    setAppleLoading(true);
    // Same as handleGoogle: set before the redirect so the callback's
    // setSession lands in the chosen store.
    setRememberMe(isSignup ? true : rememberMe);
    try {
      // Same reasoning as handleGoogle just above: Apple's provider also
      // auto-provisions an account for any unseen Apple ID.
      if (isSignup) {
        stashPendingSignupMeta({ ...nameMeta, ...consentMetadata() });
        stashPendingConsent();
        markAskHeardAbout();
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
    setAiConsent(false);
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
    background: 'rgba(62, 39, 35, 0.6)',
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
      <div
        className="ay-auth-card"
        style={styles.card}
        ref={cardRef}
        {...(isModal ? { role: 'dialog', 'aria-modal': 'true', 'aria-label': ctxCopy ? ctxCopy.title : 'Sign in to ayna' } : {})}
        onKeyDown={isModal ? (e) => {
          if (e.key !== 'Tab' || !cardRef.current) return;
          const f = [...cardRef.current.querySelectorAll('button, a[href], input, select, textarea')].filter((el) => !el.disabled && el.offsetParent !== null);
          if (!f.length) return;
          const first = f[0]; const last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        } : undefined}
      >
        {isModal && onSkip && (
          <button type="button" className="ay-auth-close" onClick={onSkip} style={styles.closeBtn} aria-label="Close">×</button>
        )}

        <div className="ay-auth-logo" style={styles.logo}>ayna</div>
        {ctxCopy && <h2 className="ay-auth-context-title">{ctxCopy.title}</h2>}
        {isSignup && <h2 className="ay-auth-context-title">{signupTitle}</h2>}
        <p className="ay-auth-tagline" style={styles.tagline}>{subtitle}</p>
        {!isSignup && !allowSignup && onStartEcosystem && (
          <div className="ay-auth-doors">
            <button type="button" className="ay-auth-doors__new" onClick={onStartEcosystem}>
              <b>New here? See my matches</b>
              <span>A short quiz, then products matched to you</span>
            </button>
            <p className="ay-auth-doors__or">or sign in</p>
          </div>
        )}

        {!supabase && (
          // Without this, a missing/blank .env.local silently disabled the
          // email/password submit button with zero feedback, clicking it
          // did nothing, no error, no console output, nothing to search for.
          // The Google button already surfaced this same problem via its own
          // error state; email/password had no equivalent, so it looked
          // exactly like a hang rather than a config gap.
          // (Public copy: no env var names on a live page.)
          <p style={styles.configWarning}>
            Sign-in isn't available on this device right now because ayna can't reach its sign-in service. Check your connection and reopen the app.
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
              <div style={{ color: '#f97316', fontWeight: 600, fontSize: 14, letterSpacing: '0.04em', marginBottom: '0.75rem' }}>ayna</div>
              <h2 id="phone-coming-soon-title" style={{ margin: '0 0 0.75rem', fontSize: 'var(--ay-fs-section)', color: '#1c1917' }}>
                Phone sign-up is coming soon
              </h2>
              <p style={{ margin: '0 0 1.5rem', color: '#57534e', lineHeight: 1.6 }}>
                We’re still putting the finishing touches on phone verification. For now, please create your ayna account with Apple, Google or email.
              </p>
              <button
                type="button"
                onClick={() => setShowPhoneNotice(false)}
                style={{ width: '100%', border: 'none', borderRadius: '12px', padding: '0.9rem 1rem', background: '#f97316', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
              >
                Continue with email
              </button>
            </div>
          </div>
        )}

        {/* Fastest way in first: Apple, then Google, then "or", then email (onboarding audit #1). */}
        {!resetView && <>
          <div className="ay-auth-oauth" style={styles.oauthRow}>
            <button
              type="button"
              onClick={handleApple}
              disabled={appleLoading}
              style={{
                ...styles.googleBtn,
              }}
            >
              <AppleIcon />
              {appleLoading ? 'Redirecting…' : 'Continue with Apple'}
            </button>

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
          </div>
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine} />
          </div>
        </>}

        {resetView ? (
          <form className="ay-auth-reset" onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} noValidate>
            <h3 className="ay-auth-reset__h">Reset your password</h3>
            <p className="ay-auth-reset__p">Enter the email you signed up with and we’ll send you a link to choose a new password.</p>
            <div className="ay-auth-field">
              <label htmlFor="auth-reset-email">Email</label>
              <input id="auth-reset-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }} {...fieldProps('email')} />
              <InlineError id="auth-email-err">{fieldErrors.email}</InlineError>
            </div>
            {error && <p className="ay-auth-err" role="alert">{error}</p>}
            {successMsg && <p className="ay-auth-ok" role="status">{successMsg}</p>}
            <button type="submit" className="ay-auth-submit" disabled={resetting}>{resetting ? 'Sending…' : 'Send reset link'}</button>
            <button type="button" className="ay-auth-linkbtn" onClick={() => { setResetView(false); setError(''); setSuccessMsg(''); }}>Back to sign in</button>
          </form>
        ) : (
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

          {isSignup && authMethod === 'phone' ? (
            phoneStep === 'number' ? (
              <input
                type="tel"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(maskedChange(e, formatUsPhone))}
                required
                style={styles.input}
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
                  placeholder={CODE_COPY.smsPlaceholder}
                  aria-label={CODE_COPY.smsPrompt}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(cleanCode(e.target.value, SMS_CODE_LENGTH))}
                  required
                  style={styles.input}
                  autoComplete="one-time-code"
                  maxLength={SMS_CODE_LENGTH}
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
                  placeholder={CODE_COPY.emailPlaceholder}
                  value={emailCode}
                  onChange={(e) => setEmailCode(cleanCode(e.target.value, EMAIL_CODE_LENGTH))}
                  style={styles.input}
                  autoComplete="one-time-code"
                  maxLength={EMAIL_CODE_LENGTH}
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
                style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 14, padding: '0.25rem', lineHeight: 1 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {isSignup && !fieldErrors.password && <p className="ay-auth-hint">At least 8 characters.</p>}
          </Field>
          {!isSignup && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label className="ay-auth-remember">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMeChecked(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="ay-auth-linkbtn ay-auth-forgot"
                onClick={() => { setError(''); setSuccessMsg(''); setFieldErrors({}); setResetView(true); }}
              >
                Forgot password?
              </button>
            </div>
          )}
          {isSignup && (
            <AiConsentBox id={FIELD_IDS.aiConsent} checked={aiConsent} onChange={toggleAiConsent} error={fieldErrors.aiConsent} />
          )}
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}
          <InlineError className="ay-inline-err--summary">{errorSummary(fieldErrors, ['aiConsent'], summaryAction)}</InlineError>
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

          {isSignup && !(authMethod === 'email' && emailSignupStep === 'code') && !(authMethod === 'phone' && phoneStep === 'code') && <AcknowledgementLine />}
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
              {authMethod === 'email' ? (
                <button type="button" className="ay-auth-linkbtn" onClick={() => setShowPhoneNotice(true)}>Use my phone number instead</button>
              ) : (
                <button type="button" className="ay-auth-linkbtn" onClick={() => switchAuthMethod('email')}>Use email instead</button>
              )}
            </p>
          )}
        </form>
        )}

        {!isSignup && (
          <p style={styles.fine}>
            ayna is for adults 18+. By continuing you agree to our{' '}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Privacy Policy</a>
            {' '}and{' '}
            <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Terms of Use</a>.
          </p>
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
 * mode, which skips the create-account form. Same one AI-processing box and
 * acknowledgement sentence as sign-up (incl. 18+). "Where did you hear about
 * us?" follows, optional (HeardAboutPrompt). She can agree, or sign out.
 * Rendered by App.jsx (main, 2026-09).
 */
export function ConsentGate({ onAgreed, onDecline }) {
  const [aiConsent, setAiConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const gateRef = useRef(null);
  const boxId = 'consent-gate-ai';

  const submit = async () => {
    if (!aiConsent) {
      setFieldError(AI_CONSENT_ERROR);
      setError('');
      warnHaptic();
      window.requestAnimationFrame(() => revealField(gateRef.current?.querySelector(`#${boxId}`)));
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) { setError('Sign-in is unavailable right now. Please try again later.'); return; }
    setSaving(true);
    setError('');
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ data: consentMetadata() });
      if (updateError) throw updateError;
      markAskHeardAbout();
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
        background: 'rgba(62, 39, 35, 0.6)', zIndex: 1710, padding: '96px 16px 24px',
      }}
    >
      <div className="ay-auth-card" style={styles.card} ref={gateRef}>
        <div className="ay-auth-logo" style={styles.logo}>ayna</div>
        <p id="ay-consent-gate-title" className="ay-auth-tagline" style={styles.tagline}>One more step to finish setting up your account.</p>
        <div style={styles.form}>
          <AiConsentBox id={boxId} checked={aiConsent} error={fieldError}
            onChange={() => { setAiConsent((v) => !v); setFieldError(''); setError(''); }} />
          {error && <p className="ay-auth-err" role="alert">{error}</p>}
          <AcknowledgementLine action="continuing" />
          <button
            type="button"
            className="ay-auth-submit"
            onClick={submit}
            disabled={saving}
            style={{ ...styles.primaryBtn, ...(saving ? styles.primaryBtnDisabled : {}) }}
          >
            {saving ? 'Saving…' : 'Agree and continue'}
          </button>
        </div>
        <button type="button" onClick={onDecline} style={styles.skipBtn}>No thanks, sign me out</button>
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
    fontSize: 'var(--ay-fs-section)',
    color: 'var(--color-text-main)',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
    zIndex: 2,
  },
  logo: {
    fontFamily: 'var(--ay-serif)',
    fontSize: 'var(--ay-fs-title)',
    fontWeight: '500',
    color: '#281B3D',
    textAlign: 'center',
    letterSpacing: '-0.01em',
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: 14,
    color: '#6E6275',
    textAlign: 'center',
    margin: '-0.15rem 1.5rem 0.25rem',
    lineHeight: 1.45,
  },
  configWarning: {
    fontSize: 12.5,
    color: '#3e2723',
    background: 'rgba(247, 186, 221, 0.45)',
    border: '1px solid #f7badd',
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
    fontSize: 14,
    fontWeight: '500',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    fontFamily: 'var(--ay-sans)',
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
    fontSize: 14,
    border: '1.4px solid #E7E0D4',
    borderRadius: '12px',
    background: '#FFFFFF',
    color: '#2C2333',
    outline: 'none',
    fontFamily: 'var(--ay-sans)',
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
    fontSize: 12.5,
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'var(--ay-sans)',
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
    fontSize: 12.5,
    color: 'var(--color-text-muted)',
    lineHeight: 1.4,
  },
  legalNotice: {
    fontSize: 12.5,
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
    fontSize: 14,
    fontWeight: '600',
    background: '#E4B25E',
    color: '#1E1430',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    marginTop: '0.25rem',
    fontFamily: 'var(--ay-sans)',
  },
  primaryBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  error: {
    fontSize: 12.5,
    color: '#B91C1C',
    margin: 0,
    lineHeight: 1.4,
  },
  success: {
    fontSize: 12.5,
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
    fontSize: 12.5,
    color: 'var(--color-text-muted)',
  },
  oauthRow: {
    display: 'flex',
    gap: '0.65rem',
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.7rem 0.35rem',
    fontSize: 12.5,
    fontWeight: '500',
    background: '#FFFFFF',
    color: '#2C2333',
    border: '1.4px solid #E7E0D4',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    fontFamily: 'var(--ay-sans)',
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
    fontSize: 12.5,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    lineHeight: 1.45,
    margin: '0.25rem 0 0',
  },
  skipBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    fontSize: 12.5,
    cursor: 'pointer',
    textDecoration: 'underline',
    textAlign: 'center',
    padding: '0.25rem',
    fontFamily: 'var(--ay-sans)',
  },
};
