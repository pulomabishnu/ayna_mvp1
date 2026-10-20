import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { EdState } from './editorial/EdPage';

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
      } catch {
        // non-fatal
      }
    });
  }, []);

  if (status === 'loading') {
    return <EdState busy><p className="ed-lead">Confirming your email…</p></EdState>;
  }

  if (status === 'error') {
    return (
      <EdState title="Confirmation link unavailable" tone="error">
        <p className="ed-lead">
          This confirmation link may be invalid or expired. Please return to ayna
          and request a new confirmation email.
        </p>
      </EdState>
    );
  }

  return (
    <EdState
      title="Your account is confirmed."
      actions={<button type="button" className="ed-btn ed-btn--primary" onClick={() => onAuthenticated(confirmedUser)}>Continue to ayna</button>}
    >
      <p className="ed-lead">
        Your email is verified and your ayna account is ready to go.
      </p>
    </EdState>
  );
}
