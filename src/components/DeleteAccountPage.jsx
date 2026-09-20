import React, { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { getSupabaseClient } from '../utils/supabaseClient';

const REASON_OPTIONS = [
  'Not what I expected',
  "Didn't find it useful",
  'Privacy or data concerns',
  'Switching to another service',
  'Too many emails or notifications',
  'Technical issues',
  'No longer need it',
  'Other',
];

// Set right before redirecting away for a Google re-confirmation, so this
// page knows to skip straight to the confirm step when the browser comes
// back to it via the auth-callback -> pendingAction('delete-account') path.
const REAUTH_PENDING_KEY = 'ayna_delete_reauth_pending';

function clearAynaStorage(store) {
  if (!store) return;
  const keys = [];
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key && /^ayna(?:_|:)/i.test(key)) keys.push(key);
  }
  keys.forEach((key) => store.removeItem(key));
}

function clearLocalAynaData() {
  try { clearAynaStorage(window.localStorage); } catch { /* private mode */ }
  try { clearAynaStorage(window.sessionStorage); } catch { /* private mode */ }
}

export default function DeleteAccountPage({ onBack }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Step 1: prove it's really you, the same way you normally log in.
  // Step 2: say why you're leaving, then confirm the delete.
  const [step, setStep] = useState('reauth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [reauthBusy, setReauthBusy] = useState(false);
  const [reauthError, setReauthError] = useState('');

  const [reason, setReason] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) { setLoadingUser(false); return; }
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        setUser(data?.user || null);
        // Coming back from the Google re-confirmation redirect: that round
        // trip through Google *is* the re-auth, so skip straight to step 2.
        let resumed = false;
        try {
          if (sessionStorage.getItem(REAUTH_PENDING_KEY) === '1') {
            sessionStorage.removeItem(REAUTH_PENDING_KEY);
            resumed = true;
          }
        } catch (_) { /* private mode */ }
        if (resumed) setStep('confirm');
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const hasPassword = identities.some((i) => i.provider === 'email');
  const hasPhone = identities.some((i) => i.provider === 'phone');
  const hasGoogle = identities.some((i) => i.provider === 'google');
  // Prefer the strongest method an account actually has. Most accounts only
  // have one identity, so this just picks it.
  const reauthMethod = hasPassword ? 'password' : hasPhone ? 'phone' : hasGoogle ? 'google' : null;

  const handlePasswordReauth = async () => {
    if (!email.trim() || !password || reauthBusy) return;
    setReauthBusy(true);
    setReauthError('');
    const supabase = getSupabaseClient();
    if (!supabase) { setReauthError('Sign in again to delete your account.'); setReauthBusy(false); return; }
    const { error: reauthErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (reauthErr) {
      setReauthError('That email or password is incorrect.');
      setReauthBusy(false);
      return;
    }
    setReauthBusy(false);
    setStep('confirm');
  };

  const handleSendOtp = async () => {
    if (reauthBusy || !user?.phone) return;
    setReauthBusy(true);
    setReauthError('');
    const supabase = getSupabaseClient();
    if (!supabase) { setReauthError('Sign in again to delete your account.'); setReauthBusy(false); return; }
    const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: user.phone });
    if (otpErr) {
      setReauthError('Could not send a code. Please try again.');
      setReauthBusy(false);
      return;
    }
    setOtpSent(true);
    setReauthBusy(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || reauthBusy) return;
    setReauthBusy(true);
    setReauthError('');
    const supabase = getSupabaseClient();
    if (!supabase) { setReauthError('Sign in again to delete your account.'); setReauthBusy(false); return; }
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      phone: user.phone,
      token: otpCode.trim(),
      type: 'sms',
    });
    if (verifyErr) {
      setReauthError('That code is wrong or expired.');
      setReauthBusy(false);
      return;
    }
    setReauthBusy(false);
    setStep('confirm');
  };

  const handleGoogleReauth = async () => {
    if (reauthBusy) return;
    setReauthBusy(true);
    setReauthError('');
    const supabase = getSupabaseClient();
    if (!supabase) { setReauthError('Sign in again to delete your account.'); setReauthBusy(false); return; }
    try {
      sessionStorage.setItem(REAUTH_PENDING_KEY, '1');
      sessionStorage.setItem('ayna_pending_auth_action', 'delete-account');
    } catch (_) { /* private mode */ }
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (oauthErr) {
      try { sessionStorage.removeItem(REAUTH_PENDING_KEY); } catch (_) {}
      setReauthError('Could not start Google sign-in.');
      setReauthBusy(false);
    }
    // On success the browser navigates away to Google; nothing else to do here.
  };

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    setError('');

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Sign in again to delete your account.');
      setBusy(false);
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (sessionError || !token) throw new Error('Your session expired. Sign in again and retry.');

      try {
        posthog.capture('account_deletion_requested', {
          reason: reason || 'not specified',
          hasDetails: reasonDetails.trim().length > 0,
        });
      } catch (_) { /* analytics unavailable */ }

      const res = await fetch('/api/account-delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm: 'DELETE',
          reason: reason || undefined,
          reasonDetails: reasonDetails.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('We could not delete your account. Nothing else will be changed; please retry.');

      clearLocalAynaData();
      try { posthog.reset?.(); } catch { /* analytics unavailable */ }
      try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* user is already deleted server-side */ }
      window.location.replace('/');
    } catch (e) {
      setError(e?.message || 'Could not delete your account.');
      setBusy(false);
    }
  };

  const labelStyle = { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem', marginBottom: '0.9rem' };
  const inputStyle = { padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem' };

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '640px' }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.45rem', color: '#8a1c13' }}>Delete your account</h2>
          <button type="button" className="btn btn-outline" onClick={onBack} disabled={busy || reauthBusy}>
            Back
          </button>
        </div>

        <p style={{ margin: '0 0 1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          This permanently deletes your ayna account, health intake, imported health profile, ecosystem, saved/tracked/hidden products, reviews, learning memory, phone/SMS records, notification preferences, and other account-linked data. Active-tab ayna caches on this browser are cleared too. This cannot be undone.
        </p>

        {loadingUser && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading your account…</p>
        )}

        {!loadingUser && step === 'reauth' && (
          <>
            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600 }}>
              First, confirm it's you by logging in again.
            </p>

            {reauthMethod === 'password' && (
              <>
                <label style={labelStyle}>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={reauthBusy}
                    autoComplete="username"
                    style={{ ...inputStyle, maxWidth: '320px' }}
                  />
                </label>
                <label style={labelStyle}>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={reauthBusy}
                    autoComplete="current-password"
                    style={{ ...inputStyle, maxWidth: '320px' }}
                  />
                </label>
                {reauthError && <p role="status" style={{ margin: '0 0 0.9rem', color: '#8a1c13', fontSize: '0.85rem' }}>{reauthError}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePasswordReauth}
                    disabled={!email.trim() || !password || reauthBusy}
                  >
                    {reauthBusy ? 'Checking…' : 'Log in to continue'}
                  </button>
                </div>
              </>
            )}

            {reauthMethod === 'phone' && (
              <>
                {!otpSent ? (
                  <>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.9rem' }}>
                      We'll text a verification code to the phone number on your account to confirm it's you.
                    </p>
                    {reauthError && <p role="status" style={{ margin: '0 0 0.9rem', color: '#8a1c13', fontSize: '0.85rem' }}>{reauthError}</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-primary" onClick={handleSendOtp} disabled={reauthBusy}>
                        {reauthBusy ? 'Sending…' : 'Send code'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <label style={labelStyle}>
                      Verification code
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        disabled={reauthBusy}
                        style={{ ...inputStyle, maxWidth: '220px' }}
                      />
                    </label>
                    {reauthError && <p role="status" style={{ margin: '0 0 0.9rem', color: '#8a1c13', fontSize: '0.85rem' }}>{reauthError}</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-primary" onClick={handleVerifyOtp} disabled={!otpCode.trim() || reauthBusy}>
                        {reauthBusy ? 'Verifying…' : 'Verify'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {reauthMethod === 'google' && (
              <>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.9rem' }}>
                  You'll be asked to confirm your Google account.
                </p>
                {reauthError && <p role="status" style={{ margin: '0 0 0.9rem', color: '#8a1c13', fontSize: '0.85rem' }}>{reauthError}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-primary" onClick={handleGoogleReauth} disabled={reauthBusy}>
                    {reauthBusy ? 'Redirecting…' : 'Continue with Google'}
                  </button>
                </div>
              </>
            )}

            {!reauthMethod && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" onClick={() => setStep('confirm')}>
                  Continue
                </button>
              </div>
            )}
          </>
        )}

        {!loadingUser && step === 'confirm' && (
          <>
            <label style={labelStyle}>
              Reason for leaving (optional, helps us improve)
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
                style={inputStyle}
              >
                <option value="">Prefer not to say</option>
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>

            {reason === 'Other' && (
              <label style={labelStyle}>
                Tell us more (optional)
                <textarea
                  rows={2}
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  disabled={busy}
                  maxLength={600}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </label>
            )}

            {error && <p role="status" style={{ margin: '0 0 0.9rem', color: '#8a1c13', fontSize: '0.85rem' }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={onBack} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                style={{
                  padding: '0.55rem 0.9rem',
                  border: 0,
                  borderRadius: 'var(--radius-md)',
                  background: '#b42318',
                  color: 'white',
                  fontWeight: 700,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.55 : 1,
                }}
              >
                {busy ? 'Deleting…' : 'Permanently delete account'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
