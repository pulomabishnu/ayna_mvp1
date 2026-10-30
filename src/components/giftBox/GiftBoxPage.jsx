import React, { useEffect, useMemo, useState } from 'react';
import './gift-box.css';
import { cartTotal, checkout, loadShop, money, tokenFromPath } from './giftBoxClient';

/**
 * /gift/<link>: the monthly focus group winner picks their gift box, up to
 * their limit, and checks out for free. /gift: an admin (signed in) shops the
 * same list with no limit. Not linked from any nav.
 */

const LINK_MESSAGES = {
  invalid_link: { title: "This link doesn't work", body: 'Check you opened the full link from your email. If it still doesn’t work, reply to that email and we’ll sort it out.' },
  already_used: { title: 'Your gift box is already in', body: 'This link was for one order, and it’s been placed. We’ll email you when it ships.' },
  expired: { title: 'This link has expired', body: 'Reply to your winner email and we’ll send you a new one.' },
};

const EMPTY_SHIP = { name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', postal: '', note: '' };
const FIELD_ERRORS = { name: 'Add your name.', email: 'Add a valid email.', line1: 'Add your street address.', city: 'Add your city.', state: 'Add your state.', postal: 'Add your ZIP code.' };

function Tile({ product }) {
  // Images are hotlinked from brand sites; if one won't load, show the brand name instead of a broken icon.
  const [broken, setBroken] = useState(false);
  return (
    <div className="ay-product-card__tile">
      {product.imageUrl && !broken
        ? <img src={product.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
        : <span className="gb-nophoto">{product.brand || 'ayna'}</span>}
    </div>
  );
}

function Sheet({ label, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="ay-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ay-sheet gb-sheet" role="dialog" aria-modal="true" aria-label={label}>
        <div className="ay-sheet__strip" aria-hidden="true">{label}</div>
        <button type="button" className="ay-sheet__close" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        {children}
      </div>
    </div>
  );
}

export default function GiftBoxPage({ user, authLoading, onSignIn }) {
  const token = useMemo(() => tokenFromPath(), []);
  const [state, setState] = useState({ status: 'loading' });
  const [cart, setCart] = useState({});
  const [detail, setDetail] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [ship, setShip] = useState(EMPTY_SHIP);
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(null);
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!token && authLoading) return undefined;
    if (!token && !user) { setState({ status: 'signin' }); return undefined; }
    let alive = true;
    setState({ status: 'loading' });
    loadShop(token).then(
      (data) => { if (alive) setState({ status: 'ready', ...data }); },
      (err) => {
        if (!alive) return;
        if (!token && (err.status === 401 || err.status === 403)) setState({ status: err.status === 403 ? 'forbidden' : 'signin' });
        else if (LINK_MESSAGES[err.code]) setState({ status: 'link', code: err.code });
        else setState({ status: 'error' });
      },
    );
    return () => { alive = false; };
  }, [token, user, authLoading]);

  const products = useMemo(() => state.products || [], [state.products]);
  const isAdmin = state.mode === 'admin';
  const budget = isAdmin ? null : state.budgetCents;
  const total = cartTotal(cart, products);
  const left = budget == null ? null : budget - total;
  const lines = products.filter((p) => cart[p.id]);
  // Filter chips, in the sheet's order of first appearance.
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const shown = category ? products.filter((p) => p.category === category) : products;
  const count = lines.reduce((n, p) => n + cart[p.id], 0);

  const canAdd = (p) => (cart[p.id] || 0) < p.maxPerOrder && (left == null || p.priceCents <= left);
  const add = (p) => { if (canAdd(p)) setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 })); };
  const removeOne = (p) => setCart((c) => {
    const next = { ...c };
    if ((next[p.id] || 0) > 1) next[p.id] -= 1; else delete next[p.id];
    return next;
  });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const missing = ['name', 'email', 'line1', 'city', 'state', 'postal'].find((k) => !ship[k].trim());
    if (missing) { setFieldError(missing); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ship.email.trim())) { setFieldError('email'); return; }
    setFieldError('');
    setSubmitting(true);
    try {
      const items = lines.map((p) => ({ id: p.id, qty: cart[p.id] }));
      const result = await checkout(token, items, ship);
      setDone({ ...result, email: ship.email.trim() });
      setCheckingOut(false);
      window.scrollTo?.({ top: 0 });
    } catch (err) {
      if (err.code === 'over_budget') setSubmitError(`That's over your ${money(budget)} limit. Take something out and try again.`);
      else if (err.code === 'unavailable') setSubmitError('Something in your box was just taken off the list. Refresh the page and pick again.');
      else if (err.code === 'bad_shipping') setFieldError(err.body?.field || 'name');
      else if (LINK_MESSAGES[err.code]) { setCheckingOut(false); setState({ status: 'link', code: err.code }); }
      else setSubmitError('That didn’t go through. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key, label, props = {}) => (
    <>
      <label className="ay-field-label" htmlFor={`gb-${key}`}>{label}{props.optional ? <span> (optional)</span> : null}</label>
      <input id={`gb-${key}`} className="ay-field" value={ship[key]} aria-invalid={fieldError === key || undefined}
        onChange={(e) => setShip((s) => ({ ...s, [key]: e.target.value }))} autoComplete={props.autoComplete} type={props.type || 'text'} inputMode={props.inputMode} />
      {fieldError === key ? <p className="gb-fielderr" role="alert">{FIELD_ERRORS[key]}</p> : null}
    </>
  );

  if (state.status === 'loading') {
    return <main className="gb ay-container"><p className="ay-meta gb-pad">Loading…</p></main>;
  }
  if (state.status === 'signin' || state.status === 'forbidden') {
    return (
      <main className="gb ay-container gb-pad">
        <h1 className="ay-h2">{state.status === 'forbidden' ? 'This page is for the ayna team' : 'Sign in to open the gift box'}</h1>
        <p className="ay-meta">{state.status === 'forbidden' ? 'Winners get their own link by email.' : 'Use your ayna team account.'}</p>
        {state.status === 'signin' ? <button type="button" className="ay-btn ay-btn--primary" onClick={onSignIn}>Sign in</button> : null}
      </main>
    );
  }
  if (state.status === 'link' || state.status === 'error') {
    const msg = LINK_MESSAGES[state.code] || { title: 'Something went wrong', body: 'Refresh the page to try again.' };
    return (
      <main className="gb ay-container gb-pad">
        <h1 className="ay-h2">{msg.title}</h1>
        <p className="ay-meta">{msg.body}</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="gb">
        <header className="ay-pagehead ay-band ay-band--pink gb-head">
          <div className="ay-container">
            <h1 className="ay-h1">{isAdmin ? 'Order placed' : 'Your gift box is in'}</h1>
            <p>{isAdmin ? 'It’s on the orders list.' : `We’ll email ${done.email} when it ships.`}</p>
          </div>
        </header>
        <div className="ay-container">
          <ul className="gb-lines">
            {(done.items || []).map((it) => (
              <li key={it.id}>
                <span>{[it.brand, it.name].filter(Boolean).join(' · ')}{it.qty > 1 ? ` × ${it.qty}` : ''}</span>
                <b className="ay-num">{money(it.priceCents * it.qty)}</b>
              </li>
            ))}
          </ul>
          {isAdmin ? <a className="ay-btn ay-btn--secondary" href="/admin/gift">Back to gift box admin</a> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="gb">
      <header className="ay-pagehead ay-band ay-band--pink gb-head">
        <div className="ay-container">
          <h1 className="ay-h1">{isAdmin ? 'Gift box' : `${state.firstName ? `${state.firstName}, pick` : 'Pick'} your gift box`}</h1>
          <p>{isAdmin ? 'Admin checkout: no limit.' : `Up to ${money(budget)}. Free, and we ship it to you.`}</p>
        </div>
      </header>

      <div className="ay-container">
        <div className="gb-bar">
          <p className="gb-bar__status">
            {budget != null
              ? <><b className="ay-num">{money(left)}</b> left of {money(budget)}</>
              : <><b className="ay-num">{money(total)}</b> in your box</>}
            {count ? <span> · {count} item{count === 1 ? '' : 's'}</span> : null}
          </p>
          {budget != null ? (
            <div className="gb-meter" role="progressbar" aria-label="Limit used" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={total}>
              <i style={{ width: `${Math.min(100, (total / budget) * 100)}%` }} />
            </div>
          ) : null}
          <button type="button" className="ay-btn ay-btn--primary" disabled={!count} onClick={() => setCheckingOut(true)}>
            Check out{count ? ` (${count})` : ''}
          </button>
        </div>

        {categories.length > 1 ? (
          <div className="ay-chip-row gb-chips" role="group" aria-label="Filter by category">
            <button type="button" className="ay-chip" aria-pressed={!category} onClick={() => setCategory('')}>All</button>
            {categories.map((c) => (
              <button key={c} type="button" className="ay-chip" aria-pressed={category === c} onClick={() => setCategory(category === c ? '' : c)}>{c}</button>
            ))}
          </div>
        ) : null}

        {products.length ? (
          <ul className="ay-product-grid gb-grid">
            {shown.map((p) => {
              const inCart = cart[p.id] || 0;
              const tooMuch = left != null && p.priceCents > left && !inCart;
              return (
                <li key={p.id} className="ay-product-card">
                  <button type="button" className="ay-product-card__link gb-cardbtn" onClick={() => setDetail(p)}>
                    <Tile product={p} />
                    <div className="ay-product-card__body">
                      {p.brand ? <span className="ay-product-card__brand">{p.brand}</span> : null}
                      <span className="ay-product-card__name">{p.name}</span>
                      {p.notes ? <span className="gb-notes">{p.notes}</span> : null}
                      <span className="ay-product-card__price">{money(p.priceCents)}</span>
                    </div>
                  </button>
                  <div className="gb-add">
                    {inCart ? (
                      <div className="gb-qty" aria-label={`${p.name} in your box`}>
                        <button type="button" onClick={() => removeOne(p)} aria-label={inCart > 1 ? 'One fewer' : 'Remove'}>−</button>
                        <span className="ay-num">{inCart}</span>
                        <button type="button" onClick={() => add(p)} disabled={!canAdd(p)} aria-label="One more">+</button>
                      </div>
                    ) : (
                      <button type="button" className="ay-btn ay-btn--secondary ay-btn--block" disabled={tooMuch} onClick={() => add(p)}>
                        {tooMuch ? 'Over your limit' : 'Add'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="ay-meta gb-pad">Products are on their way. Check back soon.</p>}
      </div>

      {detail ? (
        <Sheet label={detail.brand || 'Product'} onClose={() => setDetail(null)}>
          <div className="gb-detail">
            <Tile product={detail} />
            <h2 className="ay-sheet__title">{detail.name}</h2>
            <p className="ay-sheet__sub ay-num">{money(detail.priceCents)}</p>
            {detail.notes ? <p className="gb-detail__notes">{detail.notes}</p> : null}
            {detail.productUrl ? <a className="ay-btn ay-btn--text" href={detail.productUrl} target="_blank" rel="noopener noreferrer">More about it</a> : null}
          </div>
          <div className="ay-sheet__actions">
            {cart[detail.id]
              ? <button type="button" className="ay-btn ay-btn--secondary" onClick={() => removeOne(detail)}>Remove one</button>
              : null}
            <button type="button" className="ay-btn ay-btn--primary" disabled={!canAdd(detail)} onClick={() => { add(detail); setDetail(null); }}>
              {canAdd(detail) ? (cart[detail.id] ? 'Add another' : 'Add to box') : (cart[detail.id] ? 'In your box' : 'Over your limit')}
            </button>
          </div>
        </Sheet>
      ) : null}

      {checkingOut ? (
        <Sheet label="Check out" onClose={() => !submitting && setCheckingOut(false)}>
          <form onSubmit={submit} noValidate>
            <h2 className="ay-sheet__title">Your box</h2>
            <ul className="gb-lines">
              {lines.map((p) => (
                <li key={p.id}>
                  <span>{p.name}{cart[p.id] > 1 ? ` × ${cart[p.id]}` : ''}</span>
                  <b className="ay-num">{money(p.priceCents * cart[p.id])}</b>
                  <button type="button" className="ay-btn ay-btn--text" onClick={() => removeOne(p)}>Remove</button>
                </li>
              ))}
              <li className="gb-lines__total"><span>Total</span><b className="ay-num">{money(total)}</b><span className="gb-free">You pay $0</span></li>
            </ul>

            <h3 className="gb-subhead">Where should we send it?</h3>
            {field('name', 'Full name', { autoComplete: 'name' })}
            {field('email', 'Email', { autoComplete: 'email', type: 'email', inputMode: 'email' })}
            {field('phone', 'Phone', { autoComplete: 'tel', type: 'tel', optional: true })}
            {field('line1', 'Street address', { autoComplete: 'address-line1' })}
            {field('line2', 'Apt, suite', { autoComplete: 'address-line2', optional: true })}
            <div className="gb-row">
              <div>{field('city', 'City', { autoComplete: 'address-level2' })}</div>
              <div>{field('state', 'State', { autoComplete: 'address-level1' })}</div>
              <div>{field('postal', 'ZIP', { autoComplete: 'postal-code', inputMode: 'numeric' })}</div>
            </div>
            <label className="ay-field-label" htmlFor="gb-note">Anything we should know <span>(optional)</span></label>
            <textarea id="gb-note" className="ay-field ay-field--area" placeholder="Shade, scent, size…" value={ship.note} maxLength={1000}
              onChange={(e) => setShip((s) => ({ ...s, note: e.target.value }))} />
            {!isAdmin ? <p className="ay-sheet__note gb-once">You can place one order with this link.</p> : null}
            {submitError ? <p className="gb-fielderr" role="alert">{submitError}</p> : null}
            <div className="ay-sheet__actions">
              <button type="submit" className="ay-btn ay-btn--primary" disabled={submitting || !lines.length}>
                {submitting ? 'Placing order…' : 'Place free order'}
              </button>
            </div>
          </form>
        </Sheet>
      ) : null}
    </main>
  );
}
