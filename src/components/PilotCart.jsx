import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { loadProductCatalog } from '../utils/productCatalog';
import { productHref } from '../utils/productRoute';
import { useCart, setCartQuantity, removeFromCart, lineKey, CART_MAX_QTY } from '../utils/pilotCart';
import AuthGate from './AuthGate';
import './PilotBuyButton.css';
import './PilotCart.css';

function CartImage({ src }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt="" width="72" height="72" loading="lazy" onError={() => setFailed(true)} /> : <div className="pilot-cart__noimg" aria-hidden="true" />;
}
const money = cents => `$${(cents / 100).toFixed(2)}`;
const REASONS = {
  price_needed: 'This option’s price still needs to be confirmed. Remove it to check out, or request the price on its product page.',
  unavailable: 'This item isn’t available for ayna checkout right now. Please remove it.',
  invalid_price: 'This item can’t be priced right now. Please remove it.',
};

export default function PilotCart() {
  const cart = useCart();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const cancelled = new URLSearchParams(window.location.search).has('pilot_cancelled');
  const cartSignature = useMemo(() => JSON.stringify(cart), [cart]);

  useEffect(() => {
    let active = true;
    loadProductCatalog().then(({ products }) => { if (active) setCatalog(Object.fromEntries(products.map(p => [p.id, p]))); }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Every line is priced again by the server each time the cart changes.
  useEffect(() => {
    let active = true;
    if (!cart.length) { setQuote(null); return () => { active = false; }; }
    setLoading(true);
    fetch('/api/pilot-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'quote', items: cart }) })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Unable to price your cart.'); return data; })
      .then(data => { if (active) { setQuote(data); setError(''); } })
      .catch(e => { if (active) { setQuote(null); setError(e.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // cartSignature is the cart's content; `cart` itself changes identity only when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature]);

  const quoted = useMemo(() => new Map((quote?.lines || []).map(line => [lineKey(line), line])), [quote]);
  // Totals are only trustworthy for the cart they were calculated for.
  const fresh = Boolean(quote) && !loading && quote.lines.length === cart.length && cart.every(line => { const q = quoted.get(lineKey(line)); return q && q.quantity === line.quantity; });
  const ready = fresh && quote.ready && quote.totals;

  async function checkout() {
    setBusy(true); setError('');
    try {
      const client = getSupabaseClient();
      const session = client && (await client.auth.getSession()).data?.session;
      if (!session) { setShowAuth(true); return; }
      const key = `ayna-pilot-attempt:${session.user.id}:cart:${cartSignature}`;
      const attemptId = sessionStorage.getItem(key) || crypto.randomUUID();
      sessionStorage.setItem(key, attemptId);
      const res = await fetch('/api/pilot-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ items: cart, attemptId, source: 'cart' }),
      });
      const data = await res.json();
      if (data.restart) sessionStorage.removeItem(key);
      if (!res.ok) { if (data.lines) setQuote(q => ({ ...(q || {}), lines: data.lines, ready: false, totals: null })); throw new Error(data.error); }
      window.location.assign(data.url);
    } catch (e) { setError(e.message || 'Unable to start checkout.'); }
    finally { setBusy(false); }
  }

  const test = quote?.paymentMode !== 'live';
  return <main className="pilot-cart">
    <a href="/">← Keep shopping</a>
    <h1>Your cart</h1>
    {test && quote && <p className="pilot-cart__sub">Stripe test mode. No real payment.</p>}
    {cancelled && <p role="status" className="pilot-cart__note">Checkout cancelled. Your cart is saved.</p>}
    {!cart.length && <p>Your cart is empty. Choose a size and quantity on a product page and add it here.</p>}
    {cart.length > 0 && <div className="pilot-cart__layout" aria-busy={loading}>
      <ul className="pilot-cart__lines">
        {cart.map(line => {
          const priced = quoted.get(lineKey(line));
          const product = catalog[line.productId];
          const name = priced?.name || product?.name || line.productId;
          const unavailable = priced && !priced.available;
          return <li key={lineKey(line)} className={unavailable ? 'pilot-cart__line pilot-cart__line--problem' : 'pilot-cart__line'}>
            <CartImage src={product?.image} />
            <div className="pilot-cart__info">
              <a href={`${productHref(line.productId)}${line.variantId ? `?variantId=${encodeURIComponent(line.variantId)}` : ''}`}><strong>{name}</strong></a>
              {priced?.variantLabel && <span className="pilot-cart__variant">{priced.variantLabel}</span>}
              {priced?.available && <span className="pilot-cart__unit">{money(priced.unitCents)} each</span>}
              {unavailable && <span role="alert" className="pilot-cart__problem">{REASONS[priced.reason] || REASONS.unavailable}</span>}
              <div className="pilot-cart__controls">
                <span className="pilot-qty" role="group" aria-label={`Quantity for ${name}`}>
                  <button type="button" aria-label="Decrease quantity" disabled={line.quantity <= 1} onClick={() => setCartQuantity(line.productId, line.variantId, line.quantity - 1)}>−</button>
                  <output>{line.quantity}</output>
                  <button type="button" aria-label="Increase quantity" disabled={line.quantity >= CART_MAX_QTY} onClick={() => setCartQuantity(line.productId, line.variantId, line.quantity + 1)}>+</button>
                </span>
                <button type="button" className="pilot-cart__remove" onClick={() => removeFromCart(line.productId, line.variantId)}>Remove</button>
              </div>
            </div>
            <div className="pilot-cart__linetotal">{priced?.available && priced.quantity === line.quantity ? money(priced.lineCents) : '—'}</div>
          </li>;
        })}
      </ul>
      <aside className="pilot-cart__summary" aria-label="Order summary">
        <h2>Order summary</h2>
        {ready ? <>
          <dl>
            <div><dt>Items</dt><dd>{money(quote.totals.merchandise)}</dd></div>
            <div><dt>ayna service fee ({quote.serviceFeePercent ?? 10}%)</dt><dd>{money(quote.totals.fee)}</dd></div>
            <div><dt>Payment processing</dt><dd>{money(quote.totals.processing)}</dd></div>
            <div><dt>Tax</dt><dd className="pilot-cart__taxnote">{quote.taxIncluded ? 'Included when it applies' : 'Not added in test checkout'}</dd></div>
            <div className="pilot-cart__total"><dt>Total you pay</dt><dd>{money(quote.totals.total)}</dd></div>
          </dl>
          <p className="pilot-cart__fine">{quote.taxIncluded ? 'Stripe works out any tax from your shipping address inside this total, so the amount you see here is the amount charged.' : 'This is the amount you will be charged. Shipping address is collected securely by Stripe.'}</p>
        </> : <p className="pilot-cart__fine">{loading ? 'Updating prices…' : quote && !quote.ready ? 'Fix the highlighted items to see your total.' : ''}</p>}
        <button type="button" className="pdp-btn pdp-btn--navy" disabled={!ready || busy} onClick={checkout}>{busy ? 'One moment…' : ready ? `Checkout · ${money(quote.totals.total)}` : 'Checkout'}</button>
        {error && <p role="alert" className="pilot-cart__error">{error}</p>}
        <p className="pilot-cart__fine"><a href="/pilot/orders">My orders</a></p>
      </aside>
    </div>}
    {showAuth && <AuthGate isModal context="login" onSkip={() => setShowAuth(false)} onAuthenticated={(u, session) => { if (!u || !session) return; setShowAuth(false); checkout(); }} />}
  </main>;
}
