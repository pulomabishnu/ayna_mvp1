import React, { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { getSupabaseClient } from '../utils/supabaseClient';

async function getAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Sign in again to manage your account data.');
  const { data, error } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (error || !token) throw new Error('Your session expired. Sign in again and retry.');
  return { supabase, token };
}

function browserGlobalPrivacyControl() {
  try {
    return typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true;
  } catch {
    return false;
  }
}

function readAnalyticsOptOut() {
  try {
    return browserGlobalPrivacyControl() || posthog.has_opted_out_capturing?.() === true;
  } catch {
    return browserGlobalPrivacyControl();
  }
}

export default function AccountDataControls({ onOpenDeleteAccount }) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [analyticsOptedOut, setAnalyticsOptedOut] = useState(readAnalyticsOptOut);
  const gpcEnabled = browserGlobalPrivacyControl();

  useEffect(() => {
    if (!gpcEnabled) return;
    try { posthog.opt_out_capturing?.(); } catch { /* PostHog may not be configured in dev */ }
    setAnalyticsOptedOut(true);
  }, [gpcEnabled]);

  const toggleAnalytics = () => {
    if (gpcEnabled) return;
    const nextOptedOut = !analyticsOptedOut;
    try {
      if (nextOptedOut) posthog.opt_out_capturing?.();
      else posthog.opt_in_capturing?.();
      setAnalyticsOptedOut(nextOptedOut);
      setMessage(nextOptedOut ? 'Usage analytics are now off on this browser.' : 'Usage analytics are now on on this browser.');
    } catch {
      setMessage('Analytics settings are unavailable right now.');
    }
  };

  const downloadData = async () => {
    if (busy) return;
    setBusy('download');
    setMessage('');
    try {
      const { token } = await getAccessToken();
      const res = await fetch('/api/account-data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Could not prepare your download. Please try again.');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `ayna-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      setMessage('Your ayna data download is ready.');
    } catch (e) {
      setMessage(e?.message || 'Could not download your data.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-soft)' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Your data & privacy</div>
      <p style={{ margin: '0 0 0.85rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
        Control usage analytics, download a copy of the account data ayna stores, or permanently delete your account and user-linked data.
      </p>

      <div style={{ padding: '0.8rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '220px', flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Usage analytics</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', lineHeight: 1.45, marginTop: '0.2rem' }}>
              Helps us understand which screens and products are useful. Raw health-search text, account email and direct health-account identifiers are excluded from PostHog analytics, and session recording is off.
              {gpcEnabled ? ' Your browser is sending Global Privacy Control, so analytics remain off.' : ''}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            role="switch"
            aria-checked={!analyticsOptedOut}
            aria-label="Usage analytics"
            onClick={toggleAnalytics}
            disabled={gpcEnabled}
            style={{ minWidth: '125px' }}
          >
            {analyticsOptedOut ? 'Analytics off' : 'Analytics on'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline" onClick={downloadData} disabled={!!busy}>
          {busy === 'download' ? 'Preparing…' : 'Download my data'}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onOpenDeleteAccount?.()}
          disabled={!!busy}
          style={{ color: '#b42318', borderColor: '#f0b8b2' }}
        >
          Delete my account
        </button>
      </div>

      {message && <p role="status" style={{ margin: '0.75rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{message}</p>}
    </div>
  );
}
