import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function AuthCallback({ onAuthenticated }) {
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setStatus('error'); return; }

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    // Scrub the fragment immediately. The client uses Supabase's `implicit`
    // flow, so access AND refresh tokens arrive in window.location.hash — and
    // they were left there, meaning a long-lived refresh token for a women's
    // health account sat in browser history, in `document.location`, and
    // readable by any third-party script on the page.
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (_) { /* non-fatal */ }
    const searchParams = new URLSearchParams(window.location.search);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type') || searchParams.get('type');
    const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

    if (errorDesc) {
      setStatus('error');
      setErrorMsg(errorDesc);
      return;
    }

    // Email confirmation — just show the success message
    if (type === 'signup' || type === 'email_change') {
      setStatus('confirmed');
      return;
    }

    // A mobile-initiated Google sign-in (src/mobile/hooks/useSupabaseAuth.js)
    // sets this before redirecting, since this callback page always renders
    // via the DESKTOP App.jsx (main.jsx picks App vs MobileApp purely by URL
    // path, before any of this runs) — send it back to /mobile-preview
    // instead of running desktop's own post-auth navigation. The flag is
    // read but deliberately left set: MobileApp.jsx clears it itself only
    // once it confirms the session actually arrived there, so a redirect
    // that somehow failed to establish one doesn't leave a stale flag
    // making some later, unrelated sign-in look like "just completed".
    function finishAuth(user) {
      let returnToMobile = false;
      try { returnToMobile = sessionStorage.getItem('ayna_mobile_oauth_pending') === '1'; } catch { /* ignore */ }
      if (returnToMobile) {
        window.location.replace('/mobile-preview');
        return;
      }
      onAuthenticated(user);
    }

    // Flush consent stored before the OAuth redirect into user metadata.
    // Awaited, retried once, and the stash is cleared ONLY after the write
    // succeeds — the old order removed it first and swallowed the failure, so a
    // transient error erased the consent record from both places.
    async function flushPendingConsent() {
      let raw = null;
      try {
        raw = sessionStorage.getItem('ayna_pending_consent');
      } catch (_) { return; }
      if (!raw) return;

      let consent;
      try {
        consent = JSON.parse(raw);
      } catch (_) {
        try { sessionStorage.removeItem('ayna_pending_consent'); } catch (_) { /* ignore */ }
        return;
      }

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const { error } = await supabase.auth.updateUser({ data: consent });
          if (!error) {
            try { sessionStorage.removeItem('ayna_pending_consent'); } catch (_) { /* ignore */ }
            return;
          }
          console.error('[Ayna] consent write failed:', error.message);
        } catch (e) {
          console.error('[Ayna] consent write threw:', e);
        }
      }
      // Left in sessionStorage deliberately so a later load can retry.
      console.error('[Ayna] consent not persisted after retries. Record retained for retry');
    }

    // OAuth — set session and navigate to ecosystem
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error || !data.session?.user) {
            setStatus('error');
            setErrorMsg(error?.message || 'Could not establish session.');
          } else {
            void flushPendingConsent();
            finishAuth(data.session.user);
          }
        });
      return;
    }

    // Fallback: check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { void flushPendingConsent(); finishAuth(session.user); return; }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          subscription.unsubscribe();
          void flushPendingConsent();
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
