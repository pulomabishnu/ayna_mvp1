import React, { useEffect, useState } from 'react';
import { getSupabaseClient, getWebGoogleOAuthClient } from '../utils/supabaseClient';
import { flushPendingConsent } from '../utils/pendingConsent.js';

export default function AuthCallback({ onAuthenticated }) {
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setStatus('error'); return; }

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    // Scrub the fragment immediately. The client uses Supabase's `implicit`
    // flow for non-Google auth, so access AND refresh tokens can arrive in
    // window.location.hash. They must not sit in browser history or remain
    // readable from document.location after we have captured them.
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch { /* non-fatal */ }
    const searchParams = new URLSearchParams(window.location.search);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const authCode = searchParams.get('code');
    const type = hashParams.get('type') || searchParams.get('type');
    const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

    if (errorDesc) {
      setStatus('error');
      setErrorMsg(errorDesc);
      return;
    }

    // Email confirmation, just show the success message
    if (type === 'signup' || type === 'email_change') {
      setStatus('confirmed');
      return;
    }

    // Password reset link (web or app "Forgot password?"): establish the
    // short-lived recovery session, then ask for a new password below.
    if (type === 'recovery') {
      if (!accessToken || !refreshToken) {
        setStatus('error');
        setErrorMsg('This reset link is invalid or has expired. Request a new one from the sign-in screen.');
        return;
      }
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) { setStatus('error'); setErrorMsg(error.message); return; }
          setStatus('recovery');
        });
      return;
    }

    // A mobile-initiated Google sign-in (src/mobile/hooks/useSupabaseAuth.js)
    // sets this before redirecting, since this callback page always renders
    // via the DESKTOP App.jsx (main.jsx picks App vs MobileApp purely by URL
    // path, before any of this runs), send it back to /mobile-preview
    // instead of running desktop's own post-auth navigation. The flag is
    // read but deliberately left set: MobileApp.jsx clears it itself only
    // once it confirms the session actually arrived there, so a redirect
    // that somehow failed to establish one doesn't leave a stale flag
    // making some later, unrelated sign-in look like "just completed".
    function finishAuth(user) {
      let returnToMobile = false;
      try { returnToMobile = localStorage.getItem('ayna_mobile_oauth_pending') === '1'; } catch { /* ignore */ }
      if (returnToMobile) {
        const mobileUrl = new URL('/mobile-preview', window.location.origin);
        const currentParams = new URLSearchParams(window.location.search);

        for (const key of ['x-vercel-protection-bypass', 'x-vercel-set-bypass-cookie']) {
          const value = currentParams.get(key);
          if (value) mobileUrl.searchParams.set(key, value);
        }

        window.location.replace(mobileUrl.toString());
        return;
      }
      onAuthenticated(user);
    }

    // Web Google OAuth now uses an isolated PKCE client. Supabase returns a
    // short-lived `?code=` here; exchange it using the same sessionStorage
    // that holds the verifier, then copy the resulting session into the main
    // app client. This does not create/replace user data: it only establishes
    // the browser session for the user Supabase already authenticated.
    if (authCode) {
      const googleClient = getWebGoogleOAuthClient();
      if (!googleClient) {
        setStatus('error');
        setErrorMsg('Could not establish the Google sign-in session. Please try again.');
        return;
      }

      // The code is single-use. Remove it from browser history immediately so
      // refresh/back cannot accidentally attempt a second exchange.
      try {
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete('code');
        const cleanSearch = cleanParams.toString();
        window.history.replaceState(null, '', `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}`);
      } catch { /* non-fatal */ }

      googleClient.auth.exchangeCodeForSession(authCode)
        .then(async ({ data, error }) => {
          if (error || !data?.session?.user) {
            setStatus('error');
            setErrorMsg(error?.message || 'Could not establish the Google sign-in session.');
            return;
          }

          const session = data.session;
          const { data: mainData, error: mainError } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          if (mainError || !mainData?.session?.user) {
            setStatus('error');
            setErrorMsg(mainError?.message || 'Could not establish session.');
            return;
          }

          void flushPendingConsent(supabase);
          finishAuth(mainData.session.user);
        })
        .catch((error) => {
          setStatus('error');
          setErrorMsg(error?.message || 'Could not establish the Google sign-in session.');
        });
      return;
    }

    // OAuth, set session and navigate to ecosystem
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error || !data.session?.user) {
            setStatus('error');
            setErrorMsg(error?.message || 'Could not establish session.');
          } else {
            void flushPendingConsent(supabase);
            finishAuth(data.session.user);
          }
        });
      return;
    }

    // Fallback: check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { void flushPendingConsent(supabase); finishAuth(session.user); return; }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          subscription.unsubscribe();
          void flushPendingConsent(supabase);
          finishAuth(session.user);
        }
      });

      const t = setTimeout(() => {
        subscription.unsubscribe();
        setStatus('error');
        setErrorMsg('Sign-in timed out. Please return to ayna and try again.');
      }, 10000);

      return () => { clearTimeout(t); subscription.unsubscribe(); };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'recovery' || status === 'recovered') {
    return <PasswordRecoveryForm done={status === 'recovered'} onDone={() => setStatus('recovered')} />;
  }

  if (status === 'confirmed') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center', background: 'var(--color-bg, #fff)' }}>
        <div style={{ fontSize: '2.5rem' }}>✓</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>You're all set!</h2>
        <p style={{ color: 'var(--color-text-muted, #666)', maxWidth: '360px', lineHeight: 1.6, margin: 0 }}>
          Your email has been confirmed. You can close this tab and sign in to ayna.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#b42318', fontWeight: 600 }}>Could not complete sign-in.</p>
        <p style={{ color: '#666', fontSize: '0.85rem', maxWidth: '400px' }}>{errorMsg || 'Please return to ayna and try again.'}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--color-text-muted, #666)' }}>Signing you in…</p>
    </div>
  );
}

function PasswordRecoveryForm({ done, onDone }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const box = { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.9rem', padding: '2rem', textAlign: 'center' };
  const input = { width: '100%', maxWidth: 320, padding: '0.8rem 1rem', borderRadius: 12, border: '1px solid #d6d3d1', fontSize: '1rem', boxSizing: 'border-box' };
  if (done) {
    return (
      <div style={box}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Password updated</h2>
        <p style={{ color: '#666', maxWidth: 360, lineHeight: 1.6, margin: 0 }}>You can now sign in to ayna with your new password, on the website or in the app.</p>
      </div>
    );
  }
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (pw.length < 8) { setErr('Use at least 8 characters.'); return; }
    if (pw !== pw2) { setErr('Those passwords do not match.'); return; }
    const supabase = getSupabaseClient();
    if (!supabase) { setErr('Could not reach ayna. Please try again.'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) { setErr(error.message || 'Could not update your password.'); return; }
    onDone();
  };
  return (
    <form onSubmit={submit} style={box}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Set a new password</h2>
      <input type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} style={input} />
      <input type="password" autoComplete="new-password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={input} />
      {err && <p style={{ color: '#b42318', margin: 0, fontSize: '0.9rem' }}>{err}</p>}
      <button type="submit" disabled={saving} style={{ padding: '0.8rem 1.6rem', borderRadius: 99, border: 'none', background: '#262a52', color: '#fff', fontWeight: 600, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  );
}
