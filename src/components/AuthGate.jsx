import React, { useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function AuthGate() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const supabase = getSupabaseClient();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
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
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.logo}>Ayna</div>
        <p style={styles.tagline}>Your personal women's health manager</p>

        <div style={styles.toggleRow}>
          <button
            type="button"
            style={{ ...styles.toggleBtn, ...(mode === 'signin' ? styles.toggleBtnActive : {}) }}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            style={{ ...styles.toggleBtn, ...(mode === 'signup' ? styles.toggleBtnActive : {}) }}
            onClick={() => switchMode('signup')}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleEmailAuth} style={styles.form}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={mode === 'signup' ? 8 : undefined}
          />
          {error && <p style={styles.error}>{error}</p>}
          {successMsg && <p style={styles.success}>{successMsg}</p>}
          <button type="submit" disabled={loading || !supabase} style={styles.primaryBtn}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
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
          disabled={googleLoading || !supabase}
          style={styles.googleBtn}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <p style={styles.fine}>
          By continuing, you agree that your data is stored securely and never sold.
        </p>
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
  overlay: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    padding: '1.5rem',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  logo: {
    fontFamily: 'var(--font-heading)',
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
  fine: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    lineHeight: 1.45,
    margin: '0.25rem 0 0',
  },
};
