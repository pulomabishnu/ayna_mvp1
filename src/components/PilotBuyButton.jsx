import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { addToCart, cartCount, useCart, CART_MAX_QTY } from '../utils/pilotCart';
import AuthGate from './AuthGate';
import './PilotBuyButton.css';

const money = cents => `$${(cents / 100).toFixed(2)}`;

export default function PilotBuyButton({ productId, variantId = '', needsVariant = false, onAvailabilityChange }) {
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState(null);
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const cart = useCart();
  const waitingForSize = needsVariant && !variantId;

  // A new size or product starts over at quantity 1.
  useEffect(() => { setQuantity(1); setRequested(false); setError(''); setNotice(''); }, [productId, variantId]);

  // The price always comes from the server for this exact size and quantity.
  useEffect(() => {
    let active = true;
    if (waitingForSize) return () => { active = false; };
    fetch(`/api/pilot-checkout?productId=${encodeURIComponent(productId)}&variantId=${encodeURIComponent(variantId)}&quantity=${quantity}`)
      .then(r => r.json())
      .then(data => { if (active) setQuote({ ...data, requestedQuantity: quantity }); })
      .catch(() => { if (active) setQuote(null); });
    return () => { active = false; };
  }, [productId, variantId, quantity, waitingForSize]);

  // Ignore an answer that belongs to a different size or product.
  const current = !waitingForSize && quote && quote.productId === productId && quote.variantId === variantId ? quote : null;
  const enabled = Boolean(current?.enabled);
  const requestable = Boolean(current?.requestable);
  const available = enabled || requestable;
  const priced = enabled && current.requestedQuantity === quantity;
  const paymentMode = current?.paymentMode === 'live' ? 'live' : 'test';
  const taxIncluded = current?.taxIncluded === true;

  useEffect(() => { onAvailabilityChange?.(available); }, [available, onAvailabilityChange]);
  if (!available && !waitingForSize) return null;

  function add() {
    setError(''); setNotice('');
    const result = addToCart(productId, variantId, quantity);
    if (result.full) setError('Your cart is full. Check out or remove an item first.');
    else if (result.capped) setNotice(`Added. A cart holds up to ${CART_MAX_QTY} of one item, so we kept it at ${CART_MAX_QTY}.`);
    else setNotice(`Added ${quantity} to your cart.`);
  }

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
        if (data.checkoutAvailable) { setQuote(null); throw new Error('The price is ready. Click Buy now again to review it.'); }
        if (!res.ok) throw new Error(data.error);
        setRequested(true);
        return;
      }
      // A new attempt id for every different cart, so a changed quantity never reuses an old checkout.
      const key = `ayna-pilot-attempt:${session.user.id}:${productId}|${variantId}|${quantity}`;
      const attemptId = sessionStorage.getItem(key) || crypto.randomUUID();
      sessionStorage.setItem(key, attemptId);
      const res = await fetch('/api/pilot-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ items: [{ productId, variantId, quantity }], attemptId }),
      });
      const data = await res.json();
      if (data.restart) sessionStorage.removeItem(key);
      if (!res.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (e) { setError(e.message || 'Unable to start checkout.'); }
    finally { setBusy(false); }
  }

  const count = cartCount(cart);
  return <div className="pilot-purchase">
    {enabled && <div className="pilot-qty" role="group" aria-label="Quantity">
      <span className="pilot-qty__label">Quantity</span>
      <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
      <output aria-live="polite">{quantity}</output>
      <button type="button" aria-label="Increase quantity" disabled={quantity >= CART_MAX_QTY} onClick={() => setQuantity(q => Math.min(CART_MAX_QTY, q + 1))}>+</button>
    </div>}
    <div className="pilot-purchase__buttons">
      {enabled && <button type="button" className="pdp-btn pdp-btn--outline" disabled={busy || !priced} onClick={add}>Add to cart</button>}
      <button type="button" className="pdp-btn pdp-btn--navy" disabled={busy || requested || waitingForSize || !available || (enabled && !priced)} onClick={buy}>{busy ? 'One moment…' : waitingForSize ? 'Choose a size' : 'Buy now'}</button>
    </div>
    <div className="pilot-purchase__details">
      {current?.variantLabel && <span className="pilot-purchase__variant">Checkout pack: {current.variantLabel}</span>}
      {priced && current.total != null && <span className="pilot-purchase__total">{money(current.total)} total <span>{quantity > 1 ? `for ${quantity} × ${money(current.unitCents)} items, ` : ''}including Ayna and processing fees{taxIncluded ? ' and applicable tax' : ''}</span></span>}
      {requestable && !requested && <span>We’ll confirm this exact option’s price and email you a checkout link. No payment is taken yet.</span>}
      {requested && <span role="status">Request received. No payment was taken. We’ll email you when checkout is ready.</span>}
      {notice && <span role="status" className="pilot-purchase__added">{notice} <a href="/pilot/cart">View cart</a></span>}
      {paymentMode === 'test' && available && <span className="pilot-purchase__test">Test checkout · no real charge</span>}
      <span className="pilot-purchase__links">{count > 0 && <><a href="/pilot/cart">Cart ({count})</a> · </>}<a href="/pilot/orders">My {paymentMode === 'test' ? 'test ' : ''}orders</a></span>
    </div>
    {new URLSearchParams(window.location.search).has('pilot_cancelled') && <p>Checkout cancelled. You can try again.</p>}
    {error && <p role="alert" style={{ color: '#b42318', fontWeight: 600 }}>{error}</p>}
    {showAuth && <AuthGate isModal context="login" onSkip={() => setShowAuth(false)} onAuthenticated={(u, session) => { if (!u || !session) return; setShowAuth(false); buy(); }} />}
  </div>;
}
