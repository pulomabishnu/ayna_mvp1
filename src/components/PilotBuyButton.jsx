import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import AuthGate from './AuthGate';
import './PilotBuyButton.css';

export default function PilotBuyButton({ productId, variantId = '', needsVariant = false, onAvailabilityChange }) {
  const [enabled, setEnabled] = useState(false);
  const [requestable, setRequestable] = useState(false);
  const [requested, setRequested] = useState(false);
  const [total, setTotal] = useState(null);
  const [variantLabel, setVariantLabel] = useState(null);
  const [paymentMode, setPaymentMode] = useState('test');
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  useEffect(() => {
    let active = true;
    setEnabled(false); setRequestable(false); setRequested(false); setTotal(null); setVariantLabel(null);
    onAvailabilityChange?.(false);
    if (needsVariant && !variantId) return () => { active = false; };
    fetch(`/api/pilot-checkout?productId=${encodeURIComponent(productId)}&variantId=${encodeURIComponent(variantId)}`).then(r => r.json()).then(c => {
      if (active) { const matches = c.productId === productId && c.variantId === variantId; const available = matches && (c.enabled || c.requestable); setEnabled(matches && c.enabled); setRequestable(matches && c.requestable); setPaymentMode(c.paymentMode === 'live' ? 'live' : 'test'); setTaxIncluded(c.taxIncluded === true); onAvailabilityChange?.(available); setTotal(c.total); setVariantLabel(c.variantLabel || null); }
    }).catch(() => {});
    return () => { active = false; };
  }, [productId, variantId, needsVariant, onAvailabilityChange]);
  if (!enabled && !requestable && !(needsVariant && !variantId)) return null;
  async function buy() {
    setBusy(true); setError('');
    try {
      const client = getSupabaseClient();
      const session = client && (await client.auth.getSession()).data?.session;
      // Signed out (preview domains don't share the aynahealth.co login): open the
      // sign-in modal instead of failing quietly; checkout resumes after sign-in.
      if (!session) { setShowAuth(true); return; }
      if (requestable) {
        const res = await fetch('/api/pilot-request', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ productId, variantId }),
        });
        const data = await res.json();
        if (data.checkoutAvailable) { setRequestable(false); setEnabled(true); throw new Error('The test price is ready. Click Buy now again to review it.'); }
        if (!res.ok) throw new Error(data.error);
        setRequested(true);
        return;
      }
      const key = `ayna-pilot-attempt:${session.user.id}:${productId}:${variantId}`;
      const attemptId = sessionStorage.getItem(key) || crypto.randomUUID();
      sessionStorage.setItem(key, attemptId);
      const res = await fetch('/api/pilot-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ productId, variantId, attemptId }),
      });
      const data = await res.json();
      if (data.restart) sessionStorage.removeItem(key);
      if (!res.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (e) { setError(e.message || 'Unable to start checkout.'); }
    finally { setBusy(false); }
  }
  return <div className="pilot-purchase">
    <button className="pdp-btn pdp-btn--navy" disabled={busy || requested || (needsVariant && !variantId) || (!enabled && !requestable)} onClick={buy}>{busy ? 'One moment…' : needsVariant && !variantId ? 'Choose a size' : 'Buy now'}</button>
    <div className="pilot-purchase__details">
      {variantLabel && <span className="pilot-purchase__variant">Checkout pack: {variantLabel}</span>}
      {total != null && <span className="pilot-purchase__total">${(total / 100).toFixed(2)} total <span>including Ayna and processing fees{taxIncluded ? ' and applicable tax' : ''}</span></span>}
      {requestable && !requested && <span>We’ll confirm this exact option’s price and email you a checkout link. No payment is taken yet.</span>}
      {requested && <span role="status">Request received. No payment was taken. We’ll email you when checkout is ready.</span>}
      {paymentMode === 'test' && <span className="pilot-purchase__test">Test checkout · no real charge</span>}
      <a href="/pilot/orders">My {paymentMode === 'test' ? 'test ' : ''}orders</a>
    </div>
    {new URLSearchParams(window.location.search).has('pilot_cancelled') && <p>Checkout cancelled. You can try again.</p>}
    {error && <p role="alert" style={{ color: '#b42318', fontWeight: 600 }}>{error}</p>}
    {showAuth && <AuthGate isModal context="login" onSkip={() => setShowAuth(false)} onAuthenticated={(u, session) => { if (!u || !session) return; setShowAuth(false); buy(); }} />}
  </div>;
}
