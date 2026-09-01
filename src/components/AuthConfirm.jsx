import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function AuthConfirm({ onAuthenticated }) {
  const [status, setStatus] = useState('loading');
  const [confirmedUser, setConfirmedUser] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setStatus('error');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type') || 'email';

    if (!tokenHash) {
      setStatus('error');
      return;
    }

    supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    }).then(({ data, error }) => {
      if (error || !data.session?.user) {
        setStatus('error');
        return;
      }

      setConfirmedUser(data.session.user);
      setStatus('success');

      try {
        window.history.replaceState(null, '', '/confirmed');
      } catch (_) {
        // non-fatal
      }
    });
  }, []);

  if (status === 'loading') {
    return (
      <div style={wrap}>
        <p style={muted}>Confirming your email…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={wrap}>
        <h2 style={heading}>Confirmation link unavailable</h2>
        <p style={muted}>
          This confirmation link may be invalid or expired. Please return to ayna
          and request a new confirmation email.
        </p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={circle}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 style={heading}>Your account has been confirmed!</h2>

      <p style={muted}>
        Your email is verified and your ayna account is ready to go.
      </p>

      <button
        type="button"
        onClick={() => onAuthenticated(confirmedUser)}
        style={button}
      >
        Continue to ayna
      </button>
    </div>
  );
}

const wrap = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.25rem',
  padding: '2rem',
  textAlign: 'center',
  background: '#fff',
};

const circle = {
  width: '3.5rem',
  height: '3.5rem',
  borderRadius: '50%',
  background: '#FF7417',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const heading = {
  margin: 0,
  fontSize: '1.6rem',
  fontWeight: 700,
  color: '#292524',
};

const muted = {
  margin: 0,
  color: '#78716C',
  maxWidth: '380px',
  lineHeight: 1.6,
};

const button = {
  marginTop: '0.5rem',
  border: 0,
  borderRadius: '10px',
  background: '#FF7417',
  color: '#FFFFFF',
  padding: '14px 28px',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
};
