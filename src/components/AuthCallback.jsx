import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function AuthCallback({ onAuthenticated }) {
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setStatus('error'); return; }

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
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

    // Flush consent stored before OAuth redirect into user metadata (fire-and-forget)
    function flushPendingConsent() {
      try {
        const raw = sessionStorage.getItem('ayna_pending_consent');
        if (!raw) return;
        sessionStorage.removeItem('ayna_pending_consent');
        const consent = JSON.parse(raw);
        supabase.auth.updateUser({ data: consent }).catch(() => {});
      } catch (_) {}
    }

    // OAuth — set session and navigate to ecosystem
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error || !data.session?.user) {
            setStatus('error');
            setErrorMsg(error?.message || 'Could not establish session.');
          } else {
            flushPendingConsent();
            onAuthenticated(data.session.user);
          }
        });
      return;
    }

    // Fallback: check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { flushPendingConsent(); onAuthenticated(session.user); return; }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          subscription.unsubscribe();
          flushPendingConsent();
          onAuthenticated(session.user);
        }
      });

      const t = setTimeout(() => {
        subscription.unsubscribe();
        setStatus('error');
        setErrorMsg('Sign-in timed out. Please return to Ayna and try again.');
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
          Your email has been confirmed. You can close this tab and sign in to Ayna.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#b42318', fontWeight: 600 }}>Could not complete sign-in.</p>
        <p style={{ color: '#666', fontSize: '0.85rem', maxWidth: '400px' }}>{errorMsg || 'Please return to Ayna and try again.'}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--color-text-muted, #666)' }}>Signing you in…</p>
    </div>
  );
}
