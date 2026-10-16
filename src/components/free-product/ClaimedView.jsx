import { useEffect, useRef, useState } from 'react';
import ProductTileImage from '../ProductTileImage';
import { CATEGORY_LABELS } from '../../data/products';
import { saveShipping, track } from '../../utils/campaignClient';
import { shippingProblems, US_STATES } from '../../utils/campaignRules';

const STATUS = {
  needs_address: { label: 'Needs an address', text: 'Add where to send it below.' },
  ready_to_ship: { label: 'Address received', text: "We have your address. You can check back here for updates." },
  shipped: { label: 'Shipped', text: "It's on its way." },
  delivered: { label: 'Delivered', text: 'Enjoy it.' },
  canceled: { label: 'Canceled', text: 'This reward was canceled. Reach out on our contact page if that looks wrong.' },
};

function ShippingForm({ initial, defaultEmail, onSaved, onCancel }) {
  const [a, setA] = useState(() => initial || { fullName: '', line1: '', line2: '', city: '', state: '', postal: '', email: defaultEmail || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const set = (k) => (e) => { setA((x) => ({ ...x, [k]: e.target.value })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const found = shippingProblems(a);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`ayfp-ship-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    setMessage('');
    const r = await saveShipping(a);
    setBusy(false);
    if (r.error) {
      if (r.fields) setErrors(r.fields);
      setMessage(r.error === 'network' ? "Couldn't reach ayna. Nothing is lost. Try again." : r.error === 'already_shipped' ? 'It has already shipped, so the address can\'t change here. Reach out on our contact page.' : 'Something went wrong. Try again.');
      return;
    }
    track('shipping_info_completed');
    onSaved(r.status);
  };

  const field = (k, label, props = {}) => (
    <label className={`ayfp-field${props.wide ? ' is-wide' : ''}`} htmlFor={`ayfp-ship-${k}`}>
      <span>{label}{props.optional && <em> optional</em>}</span>
      {props.select ? (
        <select id={`ayfp-ship-${k}`} value={a[k]} onChange={set(k)} autoComplete={props.autoComplete} aria-invalid={Boolean(errors[k]) || undefined} aria-describedby={errors[k] ? `ayfp-ship-${k}-err` : undefined}>
          <option value="">State</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ) : (
        <input id={`ayfp-ship-${k}`} type={props.type || 'text'} value={a[k]} onChange={set(k)} autoComplete={props.autoComplete} inputMode={props.inputMode}
          maxLength={props.maxLength || 200} aria-invalid={Boolean(errors[k]) || undefined} aria-describedby={errors[k] ? `ayfp-ship-${k}-err` : undefined} />
      )}
      {errors[k] && <small id={`ayfp-ship-${k}-err`} className="ayfp-field__err">{errors[k]}</small>}
    </label>
  );

  return (
    <form className="ayfp-ship" onSubmit={submit} noValidate aria-labelledby="ayfp-ship-title">
      <h3 id="ayfp-ship-title">Where should we send it?</h3>
      <p className="wyou-muted ayfp-small">US addresses only. Only the ayna team sees this, and only to send your product.</p>
      <div className="ayfp-ship__grid">
        {field('fullName', 'Full name', { autoComplete: 'name', wide: true, maxLength: 120 })}
        {field('line1', 'Street address', { autoComplete: 'address-line1', wide: true })}
        {field('line2', 'Apartment, unit', { autoComplete: 'address-line2', optional: true, wide: true })}
        {field('city', 'City', { autoComplete: 'address-level2', maxLength: 100 })}
        {field('state', 'State', { autoComplete: 'address-level1', select: true })}
        {field('postal', 'ZIP', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 10 })}
        {field('email', 'Email for updates', { autoComplete: 'email', type: 'email', wide: true, maxLength: 254 })}
      </div>
      {message && <p className="ayfp-msg" role="alert">{message}</p>}
      <div className="ayfp-ship__actions">
        <button type="submit" className="wyou-btn" disabled={busy}>{busy ? 'Saving…' : 'save address'}</button>
        {onCancel && <button type="button" className="wyou-btn is-ghost" onClick={onCancel}>cancel</button>}
      </div>
    </form>
  );
}

export default function ClaimedView({ claim, userEmail, onStatus, justClaimed }) {
  const [editing, setEditing] = useState(false);
  const headingRef = useRef(null);
  useEffect(() => { if (justClaimed) headingRef.current?.focus(); }, [justClaimed]);
  if (!claim) return null;
  const p = claim.product || {};
  const st = STATUS[claim.status] || STATUS.needs_address;
  const date = claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const canEdit = ['needs_address', 'ready_to_ship'].includes(claim.status);
  const showForm = claim.status === 'needs_address' || editing;

  return (
    <section className="wyou ayfp ayfp-claimed" aria-labelledby="ayfp-claimed-title">
      <header className={`ayfp-claimed__hero${justClaimed ? ' is-new' : ''}`}>
        <h1 id="ayfp-claimed-title" ref={headingRef} tabIndex={-1}>it's yours.</h1>
        <p>Thanks for helping make ayna better.</p>
        <span className="wyou-shapes" aria-hidden="true"><i /><i /><i /></span>
      </header>

      <article className="wyou-card ayfp-claimed__card">
        <div className="ayfp-claimed__img"><ProductTileImage product={p} alt={`${p.name}${p.brand ? ` by ${p.brand}` : ''}`} loading="eager" /></div>
        <div className="ayfp-claimed__body">
          {p.brand && <span className="ayfp-result__brand">{p.brand}</span>}
          <h2>{p.name}</h2>
          {p.category && <span className="ayfp-chip">{CATEGORY_LABELS[p.category] || p.category}</span>}
          <dl className="ayfp-claimed__facts">
            <div><dt>Claimed</dt><dd>{date}</dd></div>
            <div><dt>Status</dt><dd><span className={`ayfp-status is-${claim.status}`}>{st.label}</span></dd></div>
          </dl>
          <p className="wyou-muted">{st.text}</p>
        </div>
      </article>

      <section className="wyou-card" aria-label="Shipping">
        {showForm ? (
          <ShippingForm
            initial={claim.shipping}
            defaultEmail={userEmail}
            onSaved={(next) => { setEditing(false); onStatus(next); }}
            onCancel={claim.shipping ? () => setEditing(false) : null}
          />
        ) : claim.shipping ? (
          <div className="ayfp-ship-summary">
            <div className="wyou-card-head"><h2>Sending to</h2>{canEdit && <button type="button" className="ayfp-link" onClick={() => setEditing(true)}>Edit</button>}</div>
            <address>
              {claim.shipping.fullName}<br />
              {claim.shipping.line1}{claim.shipping.line2 ? `, ${claim.shipping.line2}` : ''}<br />
              {claim.shipping.city}, {claim.shipping.state} {claim.shipping.postal}
            </address>
          </div>
        ) : <p className="wyou-muted">Questions about your product? Reach us on the <a href="/contact">contact page</a>.</p>}
      </section>
    </section>
  );
}
