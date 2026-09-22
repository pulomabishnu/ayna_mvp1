import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function EmailConfirmed({ onAuthenticated }) {
  const [status, setStatus] = useState('loading');
  const [confirmedUser, setConfirmedUser] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setStatus('manual'); return; }

    const hash = new URLSearchParams(window.location.hash.slice(1));
    // Scrub the fragment immediately. The client uses Supabase's `implicit`
    // flow, so access AND refresh tokens arrive in window.location.hash — and
    // they were left there, meaning a long-lived refresh token for a women's
    // health account sat in browser history, in `document.location`, and
    // readable by any third-party script on the page.
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (_) { /* non-fatal */ }
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    if (accessToken && refreshToken) {
      // Supabase returned tokens — establish the session.
      // Safari and an installed app do not share browser storage. Confirming
      // here makes the account eligible to sign in, but the app must establish
      // its own session when the user returns to it.
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (!error && data.session?.user) {
            setConfirmedUser(data.session.user);
            setStatus('confirmed');
            window.close();
          } else {
            setStatus('manual');
          }
        });
    } else {
      // No tokens in URL — email confirmed but no auto-login.
      // Existing tab will stay where it is; user signs in manually.
      setStatus('manual');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') {
    return (
      <div style={wrap}>
        <p style={{ color: 'var(--color-text-muted, #666)' }}>Confirming your email…</p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={circle}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 11l5 5L18 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Email confirmed!</h2>
      <p style={{ color: 'var(--color-text-muted, #666)', maxWidth: '340px', lineHeight: 1.6, margin: 0 }}>
        This page is only for older confirmation links. New ayna signups verify with the code sent by email. Return to ayna and enter your verification code, or request a new code from the sign-in screen.
      </p>
      {confirmedUser && <button type="button" onClick={() => onAuthenticated(confirmedUser)} style={{ border: 0, borderRadius: '10px', background: '#FF7417', color: '#fff', padding: '12px 20px', cursor: 'pointer' }}>Continue in this browser</button>}
    </div>
  );
}

const wrap = {
  minHeight: '100dvh', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  gap: '1.25rem', padding: '2rem', textAlign: 'center',
  background: 'var(--color-bg, #fff)',
};

const circle = {
  width: '3.5rem', height: '3.5rem', borderRadius: '50%',
  background: 'var(--color-primary, #7C3AED)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
