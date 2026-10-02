import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function PilotBuyButton({ productId }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/pilot-checkout').then(r => r.json()).then(c => {
      if (active) setEnabled(c.enabled && c.productId === productId);
    }).catch(() => {});
    return () => { active = false; };
  }, [productId]);
  if (!enabled) return null;
  async function buy() {
    setBusy(true); setError('');
    try {
      const client = getSupabaseClient();
      const session = client && (await client.auth.getSession()).data?.session;
      if (!session) throw new Error('Please sign in to ayna, then return to this product to buy.');
      const key = `ayna-pilot-attempt:${session.user.id}:${productId}`;
      const attemptId = sessionStorage.getItem(key) || crypto.randomUUID();
      sessionStorage.setItem(key, attemptId);
      const res = await fetch('/api/pilot-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ productId, attemptId }),
      });
      const data = await res.json();
      if (data.restart) sessionStorage.removeItem(key);
      if (!res.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (e) { setError(e.message || 'Unable to start checkout.'); }
    finally { setBusy(false); }
  }
  return <div>
    <button className="pdp-btn pdp-btn--navy" disabled={busy} onClick={buy}>{busy ? 'Opening checkout…' : 'Buy on ayna — test'}</button>
    <small style={{ display: 'block' }}>Test payment only · no shipment</small>
    <a href="/pilot/orders">My test orders</a>
    {new URLSearchParams(window.location.search).has('pilot_cancelled') && <p>Checkout cancelled. You can try again.</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
