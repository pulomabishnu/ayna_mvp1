import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function AuthCallback({ onAuthenticated }) {
  const [status, setStatus] = useState('loading');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setStatus('error'); return; }

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') || searchParams.get('type');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');


    if (errorDesc) {
      setStatus('error');
      setDebugInfo(`Error from Supabase: ${errorDesc}`);
      return;
    }

    const isEmailConfirmation = type === 'signup' || type === 'email_change';
    if (isEmailConfirmation) {
      setStatus('confirmed');
      return;
    }

    // If tokens are in the URL hash, set the session explicitly
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error || !data.session?.user) {
            setStatus('error');
            setDebugInfo(`setSession error: ${error?.message}`);
          } else {
            onAuthenticated(data.session.user);
          }
        });
      return;
    }

    // No tokens in hash — fall back to getSession (handles PKCE code exchange if Supabase did it server-side)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { onAuthenticated(session.user); return; }

      // Last resort: listen for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
          subscription.unsubscribe();
          onAuthenticated(session.user);
        }
      });

      // If nothing after 10s, show error
      const t = setTimeout(() => {
        subscription.unsubscribe();
        setStatus('error');
      }, 10000);

      return () => { clearTimeout(t); subscription.unsubscribe(); };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'confirmed') {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center',
        background: 'var(--color-bg, #fff)',
      }}>
        <div style={{ fontSize: '2.5rem' }}>✓</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>You're all set!</h2>
        <p style={{ color: 'var(--color-text-muted, #666)', maxWidth: '360px', lineHeight: 1.6, margin: 0 }}>
          Your email has been confirmed. You can close this tab and return to Ayna to sign in.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#b42318', fontWeight: 600 }}>Could not complete sign-in.</p>
        <p style={{ color: '#666', fontSize: '0.85rem', maxWidth: '400px' }}>{debugInfo || 'Please return to Ayna and try again.'}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
      <p style={{ color: 'var(--color-text-muted, #666)' }}>Signing you in…</p>
    </div>
  );
}
