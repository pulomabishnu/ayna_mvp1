import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

const KEY = 'ayna_test_cart_v1';
const readCart = () => {
  try { const cart = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(cart) ? cart : []; }
  catch { return []; }
};
const money = cents => '$' + (cents / 100).toFixed(2);

export default function CheckoutMvp({ product }) {
  const [offer, setOffer] = useState(null);
  const [cart, setCart] = useState(readCart);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const checkoutReturn = typeof window === 'undefined'
    ? null : new URLSearchParams(window.location.search).get('checkout');
  useEffect(() => {
    let current = true;
    setOffer(null);
    fetch('/api/checkout?action=product&id=' + encodeURIComponent(product.id))
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (current) setOffer(data?.enabled ? data.product : null); })
      .catch(() => {});
    return () => { current = false; };
  }, [product.id]);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (!offer && !checkoutReturn) return;
    let current = true;
    getSupabaseClient()?.auth.getSession().then(({ data }) => {
      const token = data?.session?.access_token;
      if (!token) return;
      return fetch('/api/checkout?action=orders', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.ok ? r.json() : null)
        .then(result => {
          if (!current || !result) return;
          setOrders(result.orders || []);
          const sessionId = new URLSearchParams(window.location.search).get('session_id');
          if (checkoutReturn === 'success' && (result.orders || []).some(o => o.stripe_session_id === sessionId))
            setCart([]);
        });
    }).catch(() => {});
    return () => { current = false; };
  }, [offer, checkoutReturn]);
  if (!offer && !checkoutReturn && !cart.length) return null;
  const add = () => {
    setCart(old => {
      const existing = old.find(item => item.id === offer.id);
      if (existing) return old.map(item => item.id === offer.id
        ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item);
      return [...old, { id: offer.id, name: offer.name, price_cents: offer.price_cents, quantity: 1 }];
    });
    setMessage('Added to your ayna test cart.');
  };
  const checkout = async () => {
    setBusy(true); setMessage('');
    try {
      const session = (await getSupabaseClient()?.auth.getSession())?.data?.session;
      if (!session?.access_token) { setMessage('Sign in to place a test order.'); return; }
      const response = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ action: 'create',
          cart: cart.map(({ id, quantity }) => ({ id, quantity })),
          return_path: window.location.pathname }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error('Test checkout is unavailable. Please try again.');
      window.location.assign(data.url);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <section className="ayp-buy__section" aria-label="Ayna test checkout"
    style={{ border: '2px solid #3e2723', borderRadius: 18, padding: 18, marginTop: 16, background: '#ffedac' }}>
    <strong>Checkout with ayna · test mode</strong>
    <p style={{ margin: '8px 0' }}>A test payment only. No product will ship.</p>
    {offer && <button type="button" className="ay-btn ay-btn--primary" onClick={add}>
      Add to ayna cart · {money(offer.price_cents)}
    </button>}
    {cart.length > 0 && <>
      <ul style={{ margin: '12px 0', paddingLeft: 22 }}>
        {cart.map(item => <li key={item.id}>{item.name} × {item.quantity} · {money(item.price_cents * item.quantity)}
          <button type="button" className="ayv-textbtn" onClick={() => setCart(old => old.filter(i => i.id !== item.id))}>Remove</button>
        </li>)}
      </ul>
      <button type="button" className="ay-btn ay-btn--primary" disabled={busy} onClick={checkout}>
        {busy ? 'Opening checkout…' : 'Pay with Stripe test checkout'}
      </button>
    </>}
    {checkoutReturn === 'success' && <p>Payment submitted. Your order appears below when the webhook finishes.</p>}
    {checkoutReturn === 'cancelled' && <p>Checkout cancelled. Your cart is still here.</p>}
    {message && <p role="status">{message}</p>}
    {orders.length > 0 && <div style={{ marginTop: 16 }}>
      <strong>Your recent test orders</strong>
      {orders.map(order => <p key={order.id}>
        {order.id.slice(0, 8)} · {order.status} · {money(order.total_cents)}
        {order.tracking_number && <> · Tracking: {order.tracking_url
          ? <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">{order.tracking_number}</a>
          : order.tracking_number}</>}
      </p>)}
    </div>}
  </section>;
}
