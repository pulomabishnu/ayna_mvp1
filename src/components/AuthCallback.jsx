import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function AuthCallback({ onAuthenticated }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setStatus('error'); return; }

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const search = new URLSearchParams(window.location.search);
    const type = hash.get('type') || search.get('type');

    const isEmailConfirmation = type === 'signup' || type === 'email_change';

    if (isEmailConfirmation) {
      setStatus('confirmed');
      return;
    }

    // OAuth or magic link — wait for Supabase to establish the session then navigate
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { onAuthenticated(session.user); return; }
    };
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        subscription.unsubscribe();
        onAuthenticated(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthenticated]);

  if (status === 'confirmed') {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center',
        fontFamily: 'var(--font-body, Arial, sans-serif)',
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
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#b42318' }}>Something went wrong. Please return to Ayna and try again.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--color-text-muted, #666)' }}>Signing you in…</p>
    </div>
  );
}
