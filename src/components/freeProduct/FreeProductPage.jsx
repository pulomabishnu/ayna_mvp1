import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/free-product.css';
import ViewSkeleton from '../skeletons/ViewSkeleton';
import ProductTileImage from '../ProductTileImage';
import ProductReel from './ProductReel';
import InfoHero from '../info/InfoHero.jsx';
import {
  FEEDBACK_MIN_CHARS,
  FEEDBACK_QUESTIONS,
  FULFILLMENT_LABELS,
  REFERRAL_STATUS_LABELS,
  US_STATES,
  answerLength,
  joinLinkFor,
  remainingLabel,
  validateFeedbackAnswer,
  validateShipping,
} from '../../utils/freeProductCampaign';
import * as api from './campaignClient';
import { prefersReducedMotion } from './campaignClient';

/*
 * /free-product          progress: account, 3 answers, 3 friends
 * /free-product/reward   the spin, the claim, and what happens after
 *
 * Every state is drawn from GET /api/campaign. The page never decides
 * eligibility itself; it only shows what the server says.
 */

const Icon = {
  check: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>,
  dot: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" strokeDasharray="3 3" /></svg>,
  half: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><path d="M12 5a7 7 0 010 14z" fill="currentColor" /></svg>,
  arrow: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  copy: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 012-2h9" /></svg>,
  share: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7 9l5-5 5 5M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" /></svg>,
  x: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>,
};

const draftKey = (uid, key) => `ayna_fp_draft_v1:${uid}:${key}`;
const readDraft = (uid, key) => { try { return window.localStorage.getItem(draftKey(uid, key)) || ''; } catch { return ''; } };
const writeDraft = (uid, key, v) => { try { window.localStorage.setItem(draftKey(uid, key), v); } catch { /* private mode */ } };
const clearDraft = (uid, key) => { try { window.localStorage.removeItem(draftKey(uid, key)); } catch { /* private mode */ } };

const pendingClaimKey = (spinId) => `ayna_fp_claim_v1:${spinId}`;

function useToast() {
  const [msg, setMsg] = useState('');
  const timer = useRef(null);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2400);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = <p className="fp-toast-region" role="status" aria-live="polite">{msg ? <span className="fp-toast">{msg}</span> : null}</p>;
  return [node, show];
}

/* ------------------------------- Small pieces ------------------------------- */

/* The 3 + 3 = 1 equation inside one card, the result as a round seal (#28 Blush). */
function Equation({ compact = false }) {
  return (
    <ol className={`fp-eq${compact ? ' is-compact' : ''}`} aria-label="3 thoughtful answers plus 3 friends who join ayna equals 1 free product you pick">
      <li className="fp-eq__tile"><b>3</b><span>thoughtful answers</span></li>
      <li className="fp-eq__op" aria-hidden="true">+</li>
      <li className="fp-eq__tile"><b>3</b><span>friends who join</span></li>
      <li className="fp-eq__op" aria-hidden="true">=</li>
      <li className="fp-eq__tile fp-eq__seal"><b>1</b><span>free product, your pick</span></li>
    </ol>
  );
}

/**
 * The campaign rules, said plainly so nobody feels misled (info-pages audit
 * issue 4). Written only from what the campaign already enforces: the answer
 * checks in utils/freeProductCampaign.js, the verified-referral rule, the
 * limited pool, respins, a final claim, one per person.
 */
function Rules({ minChars = FEEDBACK_MIN_CHARS }) {
  return (
    <section className="fp-rules" aria-labelledby="fp-rules-h">
      <h2 id="fp-rules-h">How it works</h2>
      <ol>
        <li><b>Substantial feedback.</b> Answer 3 short questions in your own words, at least {minChars} characters each. Repeated, copied or near-identical answers don’t count.</li>
        <li><b>3 verified friends.</b> A friend counts once they make a new ayna account with your link and verify it. Clicks and invites alone don’t count.</li>
        <li><b>A limited pool.</b> Products are limited and go to whoever claims them first.</li>
        <li><b>Respin until you claim.</b> Not for you? Spin again. You can claim anything you landed on.</li>
        <li><b>Claiming is final.</b> Once you claim a product, it’s yours and can’t be swapped.</li>
        <li><b>One per person.</b> One free product per person.</li>
      </ol>
      <p className="fp-muted">Your free product is a thank-you for your feedback and referrals.</p>
    </section>
  );
}

/** Page header: the shared InfoHero (butter, breadcrumb, H1 36px). No colour bands, no eyebrow labels. */
function PageHead({ title, lead, center = false, headingRef, children }) {
  // Same InfoHero as the other info pages, photo on the white scalloped plate included (loop A).
  return (
    <InfoHero className={`fp-head${center ? ' is-center' : ''}`} title={title} lede={lead} crumb="Free product" headingRef={headingRef} photo={center ? null : '/landing/bag-tubes.webp'}>
      {children}
    </InfoHero>
  );
}

function StatusLine({ done, partial, children }) {
  return (
    <p className={`fp-statusline${done ? ' is-done' : partial ? ' is-partial' : ''}`}>
      <i>{done ? Icon.check : partial ? Icon.half : Icon.dot}</i>
      <span>{children}</span>
    </p>
  );
}

function Cta({ children, onClick, disabled, type = 'button', busy }) {
  return (
    <button type={type} className="fp-cta" onClick={onClick} disabled={disabled} aria-busy={busy || undefined}>
      <span>{children}</span>
      <span className="fp-cta__arrow" aria-hidden="true">{Icon.arrow}</span>
    </button>
  );
}

function Notice({ tone = 'butter', children, action }) {
  return (
    <div className={`fp-notice tone-${tone}`} role={tone === 'alert' ? 'alert' : undefined}>
      <div>{children}</div>
      {action}
    </div>
  );
}

/* --------------------------------- Feedback --------------------------------- */

function FeedbackCard({ index, q, saved, minChars, userId, allSaved, onSaved, locked }) {
  const [value, setValue] = useState(() => readDraft(userId, q.key) || saved?.response || '');
  const [editing, setEditing] = useState(!saved?.complete);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const len = answerLength(value);
  const id = `fp-fb-${q.key}`;
  const done = saved?.complete && !editing;

  useEffect(() => { if (saved?.complete && !readDraft(userId, q.key)) setEditing(false); }, [saved?.complete, userId, q.key]);

  const onChange = (e) => {
    const v = e.target.value;
    setValue(v);
    writeDraft(userId, q.key, v);
    if (error) setError('');
    if (!started.current && v.trim()) { started.current = true; api.track('campaign_feedback_started', { question: q.key }); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const others = allSaved.filter((f) => f.key !== q.key).map((f) => f.response);
    const check = validateFeedbackAnswer(value, others, { minChars });
    if (!check.ok) { setError(check.message); return; }
    setBusy(true);
    try {
      const res = await api.saveFeedback(q.key, value);
      clearDraft(userId, q.key);
      setEditing(false);
      api.track('campaign_feedback_piece_completed', { question: q.key, charCount: len });
      onSaved(res.status);
    } catch (err) {
      setError(err.body?.message || (err.code === 'network' ? "Couldn't reach ayna. Your answer is saved on this device, try again." : err.code === 'already_claimed' ? 'Your reward is claimed, so answers are locked.' : 'That did not save. Try again in a moment.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={`fp-fb${done ? ' is-done' : ''}`} onSubmit={submit} noValidate>
      <div className="fp-fb__head">
        <span className="fp-fb__num" aria-hidden="true">{index + 1}</span>
        <h3>{q.title}</h3>
        {done && <span className="fp-pill tone-sky"><i>{Icon.check}</i>Done</span>}
      </div>
      <label htmlFor={id} className="fp-fb__q">{q.question}</label>
      {done ? (
        <>
          <p className="fp-fb__saved">{saved.response}</p>
          {!locked && <button type="button" className="fp-link" onClick={() => { setValue(saved.response); setEditing(true); }}>Edit answer</button>}
        </>
      ) : (
        <>
          <textarea
            id={id}
            rows={4}
            value={value}
            onChange={onChange}
            placeholder={q.placeholder}
            aria-describedby={`${id}-count ${id}-err`}
            aria-invalid={error ? 'true' : undefined}
            maxLength={1500}
            disabled={locked}
          />
          <div className="fp-fb__foot">
            <span id={`${id}-count`} className={`fp-count${len >= minChars ? ' is-met' : ''}`}>
              {len >= minChars && <i>{Icon.check}</i>}
              {len} / {minChars} minimum characters
            </span>
            <button type="submit" className="fp-btn" disabled={busy || locked}>{busy ? 'Saving…' : saved ? 'Save changes' : 'Save answer'}</button>
          </div>
          <p id={`${id}-err`} className="fp-fb__err" role={error ? 'alert' : undefined}>{error}</p>
        </>
      )}
    </form>
  );
}

/* --------------------------------- Referrals -------------------------------- */

function Friends({ status, user, toast }) {
  const link = joinLinkFor(user.id);
  const required = status.campaign.referralsRequired;
  const counted = status.referrals.filter((r) => r.counts);
  const pending = status.referrals.filter((r) => r.status === 'unverified');
  const ignored = status.referrals.filter((r) => !r.counts && r.status !== 'unverified');
  const slots = [...counted, ...pending];
  while (slots.length < required) slots.push(null);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast('Link copied');
      api.track('campaign_referral_link_copied');
    } catch {
      toast('Select the link to copy it');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: 'ayna', text: "I'm using ayna to find health products that actually fit. Join with my link:", url: link });
      api.track('campaign_referral_link_shared', { method: 'native' });
    } catch { /* dismissed */ }
  };

  return (
    <>
      <div className="fp-link-row">
        <label htmlFor="fp-ref-link" className="fp-sr">Your invite link</label>
        <input id="fp-ref-link" readOnly value={link || ''} onFocus={(e) => e.target.select()} />
        <button type="button" className="fp-btn" onClick={copy}><i>{Icon.copy}</i>Copy</button>
        {canShare && <button type="button" className="fp-btn is-ghost" onClick={share}><i>{Icon.share}</i>Share</button>}
      </div>
      <p className="fp-muted">A friend counts once they make a new ayna account with your link and verify it. Clicks and invites alone don't count.</p>
      <p className="fp-friends__count"><b>{Math.min(counted.length, required)} of {required}</b> friends verified</p>
      <ol className="fp-friends">
        {slots.map((r, i) => (
          <li key={i} className={r ? `is-${r.status}` : 'is-waiting'}>
            <span className="fp-friends__who">{r?.label ? `Friend ${i + 1} · ${r.label}` : `Friend ${i + 1}`}</span>
            <StatusLine done={r?.counts} partial={r?.status === 'unverified'}>
              {r ? REFERRAL_STATUS_LABELS[r.status] : 'Waiting'}
            </StatusLine>
          </li>
        ))}
      </ol>
      {ignored.length > 0 && (
        <details className="fp-details">
          <summary>{ignored.length} sign-up{ignored.length === 1 ? '' : 's'} that don't count</summary>
          <ul>{ignored.map((r, i) => <li key={i}>{r.label || 'Someone'}: {REFERRAL_STATUS_LABELS[r.status]}</li>)}</ul>
        </details>
      )}
    </>
  );
}

/* ------------------------------ Progress page ------------------------------- */

function ProgressView({ status, user, onUnlock, onRefresh, toast }) {
  const c = status.campaign;
  const feedbackRef = useRef(null);
  const friendsRef = useRef(null);
  const accountRef = useRef(null);
  const fbDone = status.feedbackComplete >= c.feedbackRequired;
  const frDone = status.referralsVerified >= c.referralsRequired;
  const remaining = remainingLabel(status);

  const next = () => {
    const target = !status.verified ? accountRef : !fbDone ? feedbackRef : friendsRef;
    target.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    target.current?.querySelector('textarea, input, button')?.focus({ preventScroll: true });
  };

  return (
    <>
      <ul className="fp-steps" aria-label="What you need to do">
        <li className={`fp-step${status.verified ? ' is-done' : ''}`} ref={accountRef}>
          <span className="fp-step__n" aria-hidden="true">{status.verified ? Icon.check : 1}</span>
          <h2>Your account</h2>
          <p className="fp-step__big">{status.verified ? 'Verified' : 'Not verified'}</p>
          <StatusLine done={status.verified}>{status.verified ? 'All set' : 'Confirm your email or phone'}</StatusLine>
          {!status.verified && <p className="fp-muted">Sign out, then sign back in with your email or phone. We'll send a code to confirm it's you.</p>}
        </li>
        <li className={`fp-step${fbDone ? ' is-done' : ''}`}>
          <span className="fp-step__n" aria-hidden="true">{fbDone ? Icon.check : 2}</span>
          <h2>Your feedback</h2>
          <p className="fp-step__big">{status.feedbackComplete} of {c.feedbackRequired} <small>answers saved</small></p>
          <StatusLine done={fbDone} partial={status.feedbackComplete > 0}>{fbDone ? 'Thank you' : `${c.feedbackRequired - status.feedbackComplete} to go`}</StatusLine>
        </li>
        <li className={`fp-step${frDone ? ' is-done' : ''}`}>
          <span className="fp-step__n" aria-hidden="true">{frDone ? Icon.check : 3}</span>
          <h2>Your referrals</h2>
          <p className="fp-step__big">{Math.min(status.referralsVerified, c.referralsRequired)} of {c.referralsRequired} <small>verified friends</small></p>
          <StatusLine done={frDone} partial={status.referralsVerified > 0}>{frDone ? 'All in' : `${c.referralsRequired - status.referralsVerified} to go`}</StatusLine>
        </li>
      </ul>

      <div className="fp-ctabar">
        {status.eligible ? (
          status.inventoryAvailable ? (
            <Cta onClick={onUnlock}>Spin for my free product</Cta>
          ) : (
            <Notice tone="soft"><b>You did it, and every product has been claimed for now.</b> You're still eligible. We'll email you as soon as we add more.</Notice>
          )
        ) : (
          <>
            <Cta onClick={next}>{remaining || 'Keep going'}</Cta>
            {(status.feedbackComplete > 0 || status.referralsVerified > 0) && <p className="fp-muted">You're getting there.</p>}
          </>
        )}
      </div>

      <section className="fp-section" ref={feedbackRef} aria-labelledby="fp-fb-title">
        <div className="fp-section__head">
          <h2 id="fp-fb-title">Tell us what you really think</h2>
          <p>Three short answers, a couple of real sentences each. We read every one.</p>
        </div>
        <div className="fp-fb-grid">
          {FEEDBACK_QUESTIONS.map((q, i) => (
            <FeedbackCard
              key={q.key}
              index={i}
              q={q}
              saved={status.feedback.find((f) => f.key === q.key)}
              minChars={c.feedbackMinChars}
              userId={user.id}
              allSaved={status.feedback}
              locked={Boolean(status.claim)}
              onSaved={onRefresh}
            />
          ))}
        </div>
      </section>

      <section className="fp-section" ref={friendsRef} aria-labelledby="fp-fr-title">
        <div className="fp-section__head">
          <h2 id="fp-fr-title">Bring three friends</h2>
          <p>Send them your link. They need to be new to ayna.</p>
        </div>
        <div className="fp-panel">
          <Friends status={status} user={user} toast={toast} />
        </div>
      </section>

      <Rules minChars={c.feedbackMinChars || FEEDBACK_MIN_CHARS} />
    </>
  );
}

/* ------------------------------- Reward stage ------------------------------- */

function ResultCard({ product, headingRef }) {
  const summary = product.summary && product.summary.length > 200 ? `${product.summary.slice(0, 197).trim()}…` : product.summary;
  return (
    <article className="fp-result">
      <div className="fp-result__tile">
        <ProductTileImage product={{ id: product.productId, name: product.name, brand: product.brand, image: product.image, type: 'physical' }} alt={`${product.name}${product.brand ? ` by ${product.brand}` : ''}`} loading="eager" />
      </div>
      <div className="fp-result__body">
        {product.brand && <p className="fp-result__brand">{product.brand}</p>}
        <h2 tabIndex={-1} ref={headingRef}>{product.name}</h2>
        {product.size && <p className="fp-result__size">{product.size}</p>}
        {product.category && <span className="fp-pill tone-sky">{String(product.category).replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}</span>}
        {summary && <p className="fp-result__summary">{summary}</p>}
      </div>
    </article>
  );
}

function ConfirmDialog({ product, busy, onConfirm, onCancel, cancelLabel = 'Keep spinning' }) {
  const confirmRef = useRef(null);
  const boxRef = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    confirmRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel();
      if (e.key === 'Tab') {
        const els = boxRef.current?.querySelectorAll('button');
        if (!els?.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [busy, onCancel]);
  return (
    <div className="fp-dialog" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div className="fp-dialog__box" role="dialog" aria-modal="true" aria-labelledby="fp-confirm-title" aria-describedby="fp-confirm-body" ref={boxRef}>
        <h2 id="fp-confirm-title">Claim {product.name}?</h2>
        <p id="fp-confirm-body">Once you claim this, your reward is locked in and you can't pick another one.</p>
        <div className="fp-dialog__actions">
          <button type="button" className="fp-btn is-ink" ref={confirmRef} onClick={onConfirm} disabled={busy} aria-busy={busy || undefined}>{busy ? 'Claiming…' : 'Yes, claim it'}</button>
          <button type="button" className="fp-btn is-ghost" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ShippingForm({ user, onSaved }) {
  const [form, setForm] = useState({ fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', email: user.email || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const check = validateShipping(form);
    if (!check.ok) {
      setErrors(check.errors);
      document.getElementById(`fp-ship-${Object.keys(check.errors)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    setFailure('');
    try {
      const res = await api.saveShipping(check.value);
      api.track('reward_shipping_completed');
      onSaved(res.claim);
    } catch (err) {
      if (err.body?.errors) setErrors(err.body.errors);
      else setFailure(err.code === 'already_shipped' ? 'It has already shipped, so the address can no longer change.' : "Couldn't save that. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = (k, label, props = {}) => (
    <div className={`fp-field${props.wide ? ' is-wide' : ''}`}>
      <label htmlFor={`fp-ship-${k}`}>{label}</label>
      <input id={`fp-ship-${k}`} value={form[k]} onChange={set(k)} aria-invalid={errors[k] ? 'true' : undefined} aria-describedby={errors[k] ? `fp-ship-${k}-err` : undefined} {...props.input} />
      {errors[k] && <span id={`fp-ship-${k}-err`} className="fp-fb__err" role="alert">{errors[k]}</span>}
    </div>
  );

  return (
    <form className="fp-panel fp-ship" onSubmit={submit} noValidate>
      <h3>Where should we send it?</h3>
      <p className="fp-muted">US addresses only for now. We only use this to ship your product.</p>
      <div className="fp-ship__grid">
        {field('fullName', 'Full name', { wide: true, input: { autoComplete: 'name' } })}
        {field('addressLine1', 'Street address', { wide: true, input: { autoComplete: 'address-line1' } })}
        {field('addressLine2', 'Apt, suite, unit (optional)', { wide: true, input: { autoComplete: 'address-line2' } })}
        {field('city', 'City', { input: { autoComplete: 'address-level2' } })}
        <div className="fp-field">
          <label htmlFor="fp-ship-state">State</label>
          <select id="fp-ship-state" value={form.state} onChange={set('state')} autoComplete="address-level1" aria-invalid={errors.state ? 'true' : undefined}>
            <option value="">Choose</option>
            {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          {errors.state && <span className="fp-fb__err" role="alert">{errors.state}</span>}
        </div>
        {field('postalCode', 'ZIP', { input: { autoComplete: 'postal-code', inputMode: 'numeric' } })}
        {field('email', 'Email for shipping updates', { input: { type: 'email', autoComplete: 'email' } })}
      </div>
      {failure && <Notice tone="alert">{failure}</Notice>}
      <button type="submit" className="fp-btn is-ink" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
    </form>
  );
}

const STEPS_AFTER_CLAIM = [
  ['claimed', 'Claimed'],
  ['address', 'Address added'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
];

function ClaimedView({ claim, user, onUpdated, onBack }) {
  const headingRef = useRef(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => { headingRef.current?.focus(); }, []);
  const s = claim.fulfillmentStatus;
  const reached = {
    claimed: true,
    address: claim.hasShipping,
    shipped: s === 'shipped' || s === 'delivered',
    delivered: s === 'delivered',
  };
  const needsAddress = s === 'needs_shipping' || !claim.hasShipping;
  const date = new Date(claim.claimedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="fp-claimed">
      <PageHead title="It's yours." headingRef={headingRef} />
      <ResultCard product={claim.product} />
      <p className="fp-muted">Claimed {date}. Status: <b>{FULFILLMENT_LABELS[s] || s}</b></p>
      {s !== 'canceled' && (
        <ol className="fp-track" aria-label="Where your free product is">
          {STEPS_AFTER_CLAIM.map(([k, label]) => (
            <li key={k} className={reached[k] ? 'is-done' : ''}><i>{reached[k] ? Icon.check : Icon.dot}</i>{label}</li>
          ))}
        </ol>
      )}
      {s === 'canceled' && <Notice tone="soft">This claim was canceled. If that's unexpected, <a href="/contact">contact us</a>.</Notice>}
      {(needsAddress || editing) && (s === 'needs_shipping' || s === 'preparing') ? (
        <>
          {needsAddress && <p>One more step: add the address you want it shipped to. Our team packs and sends these ourselves, and you can check on it here anytime.</p>}
          <ShippingForm user={user} onSaved={(c) => { setEditing(false); onUpdated(c); }} />
        </>
      ) : s === 'preparing' ? (
        <p>We have your address and we're getting it ready. <button type="button" className="fp-link" onClick={() => setEditing(true)}>Change address</button></p>
      ) : null}
      <button type="button" className="fp-link" onClick={onBack}>Back to your progress</button>
    </div>
  );
}

function LandedList({ landed, currentId, onPick, disabled }) {
  if (!landed.length) return null;
  return (
    <section className="fp-landed" aria-labelledby="fp-landed-h">
      <h2 id="fp-landed-h">Your spins</h2>
      <p className="fp-muted">You can claim anything you landed on.</p>
      <ul>
        {landed.map((l, i) => {
          const on = l.spinId === currentId;
          return (
            <li key={l.spinId} className={`${on ? 'is-on' : ''}${l.available ? '' : ' is-gone'}`}>
              <div className="fp-landed__tile">
                <ProductTileImage product={{ id: l.product.productId, name: l.product.name, brand: l.product.brand, image: l.product.image, type: 'physical' }} alt="" />
              </div>
              <div className="fp-landed__body">
                <span className="fp-landed__n">Spin {landed.length - i}</span>
                <b>{l.product.name}</b>
                {l.product.brand && <span>{l.product.brand}</span>}
              </div>
              {l.available ? (
                <button type="button" className="fp-btn" onClick={() => onPick(l)} disabled={disabled || on} aria-pressed={on}>{on ? 'Showing' : 'Pick this'}</button>
              ) : (
                <span className="fp-landed__gone">Just claimed by someone else</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RewardView({ status, user, onRefresh, onBack, toast, setStatus }) {
  const maxSpins = status.campaign.maxSpins || 3;
  const [current, setCurrent] = useState(status.lastSpin || null); // { spinId, product }
  const [spinning, setSpinning] = useState(false);
  const [settled, setSettled] = useState(Boolean(status.lastSpin));
  const [confirming, setConfirming] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [problem, setProblem] = useState(null); // { tone, text, spin }
  const [announce, setAnnounce] = useState('');
  const spinCount = useRef(status.spins || 0);
  const headingRef = useRef(null);
  const currentRef = useRef(current);
  currentRef.current = current;
  const pool = status.pool || [];
  const landed = status.landed || [];
  const spinsLeft = Math.max(0, Math.min(status.spinsLeft ?? maxSpins, maxSpins - spinCount.current));
  const canSpin = Boolean(status.canSpin) && !spinning;
  const currentGone = current && landed.some((l) => l.spinId === current.spinId && !l.available);

  useEffect(() => { api.trackOnce('reward_experience_opened', {}, user.id); }, [user.id]);

  const doSpin = async () => {
    if (spinning || claiming) return;
    setProblem(null);
    const rejected = current?.product?.productId;
    setSpinning(true);
    setSettled(false);
    try {
      const res = await api.spin();
      spinCount.current = res.spinNumber || spinCount.current + 1;
      api.track(rejected ? 'reward_respun' : 'reward_spun', { spinNumber: spinCount.current, ...(rejected ? { rejectedProductId: rejected } : {}) });
      setCurrent({ spinId: res.spinId, product: res.product });
    } catch (err) {
      setSpinning(false);
      if (err.code === 'no_inventory') { setProblem({ tone: 'soft', text: 'Every product has been claimed for now.' }); onRefresh(); }
      else if (err.code === 'no_spins_left') { setProblem({ tone: 'soft', text: 'That was your last spin. Pick one of your spins below.' }); onRefresh(); }
      else if (err.code === 'already_claimed' || err.code === 'not_eligible' || err.code === 'campaign_inactive') onRefresh();
      else if (err.code === 'slow_down') setProblem({ tone: 'soft', text: 'Give it a minute, then try again.', spin: true });
      else setProblem({ tone: 'alert', text: "Couldn't reach ayna. Nothing was lost, try spinning again.", spin: true });
    }
  };

  const onSettled = useCallback(() => {
    setSpinning(false);
    setSettled(true);
    const c = currentRef.current;
    if (c) {
      setAnnounce(`You got ${c.product.name}${c.product.brand ? ` by ${c.product.brand}` : ''}.`);
      api.track('reward_product_shown', { productId: c.product.productId, spinNumber: spinCount.current });
    }
    onRefresh(); // spins left and the list of spins come from the server
    setTimeout(() => headingRef.current?.focus({ preventScroll: false }), 30);
  }, [onRefresh]);

  const pick = (l) => {
    setProblem(null);
    setCurrent({ spinId: l.spinId, product: l.product });
    setSettled(true);
    setTimeout(() => headingRef.current?.focus({ preventScroll: false }), 30);
  };

  const confirmClaim = async () => {
    if (!current || claiming) return;
    setClaiming(true);
    // Reuse the key for this spin across retries and reloads, so a repeat
    // of the same request can only ever return the same claim.
    let key;
    try { key = window.sessionStorage.getItem(pendingClaimKey(current.spinId)); } catch { key = null; }
    if (!key) {
      key = api.newIdempotencyKey();
      try { window.sessionStorage.setItem(pendingClaimKey(current.spinId), key); } catch { /* private mode */ }
    }
    api.track('reward_claim_attempted', { productId: current.product.productId, spinNumber: spinCount.current });
    try {
      const res = await api.claim(current.spinId, key);
      api.track('reward_claimed', { productId: current.product.productId, spinsBeforeClaim: spinCount.current });
      setConfirming(false);
      setStatus((s) => ({ ...s, claim: res.claim, eligible: false }));
    } catch (err) {
      setConfirming(false);
      if (err.code === 'out_of_stock') {
        api.track('reward_claim_failed', { reason: 'out_of_stock', productId: current.product.productId });
        const fresh = await onRefresh();
        const others = (fresh?.landed || []).some((l) => l.available);
        setProblem(fresh?.canSpin
          ? { tone: 'butter', text: "That one was just claimed. Spin again and we'll find you another.", spin: true }
          : { tone: 'butter', text: others ? 'That one was just claimed. Pick another one of your spins below.' : 'That one was just claimed, and so was everything else you landed on.' });
        setCurrent(null);
      } else if (err.code === 'already_claimed') {
        onRefresh();
      } else if (err.code === 'not_eligible' || err.code === 'campaign_inactive') {
        api.track('reward_claim_failed', { reason: err.code });
        onRefresh();
      } else {
        api.track('reward_claim_failed', { reason: 'network' });
        setProblem({ tone: 'alert', text: "We couldn't confirm your claim. Nothing is lost, press Claim this again and we'll pick up where we left off." });
      }
    } finally {
      setClaiming(false);
    }
  };

  if (!status.inventoryAvailable && !current && !landed.some((l) => l.available)) {
    return (
      <div className="fp-reward">
        <PageHead title="You’ve earned a free product." center />
        <Notice tone="soft"><b>Every product has been claimed for now.</b> You're still eligible and we've saved your spot. We'll email you as soon as we add more.</Notice>
        <button type="button" className="fp-link" onClick={onBack}>Back to your progress</button>
      </div>
    );
  }

  const spinsLabel = spinsLeft === 1 ? '1 spin left' : `${spinsLeft} spins left`;

  return (
    <div className="fp-reward">
      <PageHead title="You’ve earned a free product." lead={`You get ${maxSpins} spins. Claim anything you land on. Claiming is final.`} center>
        <ol className="fp-spinpips" aria-label={spinsLabel}>
          {Array.from({ length: maxSpins }, (_, i) => <li key={i} className={i < maxSpins - spinsLeft ? 'is-used' : ''} aria-hidden="true" />)}
          <li className="fp-spinpips__label">{spinsLabel}</li>
        </ol>
      </PageHead>

      {pool.length > 0 && <ProductReel pool={pool} spinning={spinning} result={current} onSettled={onSettled} />}
      <p className="fp-sr" aria-live="polite">{announce}</p>

      {problem && (
        <Notice tone={problem.tone} action={problem.spin && canSpin ? <button type="button" className="fp-btn" onClick={doSpin} disabled={spinning}>Spin again</button> : null}>{problem.text}</Notice>
      )}

      {spinning && <p className="fp-spin-hint" role="status">Finding something for you…</p>}

      {!spinning && current && settled && (
        <div className="fp-reward__result">
          <h2 className="fp-sr" tabIndex={-1} ref={headingRef}>Your pick</h2>
          <ResultCard product={current.product} />
          {currentGone ? (
            <p className="fp-muted">Someone just claimed this one. Pick another below{canSpin ? ' or spin again' : ''}.</p>
          ) : (
            <div className="fp-reward__actions">
              <Cta onClick={() => setConfirming(true)}>Claim this</Cta>
              {canSpin && <button type="button" className="fp-btn is-ghost is-lg" onClick={doSpin}>Spin again · {spinsLabel}</button>}
            </div>
          )}
          {!canSpin && !currentGone && <p className="fp-muted">That was your last spin. Claim this or pick another one of your spins.</p>}
          {canSpin && !currentGone && <p className="fp-muted">Not for you? Spin again.</p>}
        </div>
      )}

      {!spinning && !current && !problem && canSpin && (
        <div className="fp-reward__actions is-start">
          <Cta onClick={doSpin}>Spin · {spinsLabel}</Cta>
        </div>
      )}

      {!spinning && landed.length > 1 && <LandedList landed={landed} currentId={current?.spinId} onPick={pick} disabled={claiming} />}

      {confirming && current && (
        <ConfirmDialog product={current.product} busy={claiming} onConfirm={confirmClaim} onCancel={() => setConfirming(false)} cancelLabel={canSpin ? 'Keep spinning' : 'Go back'} />
      )}
      <button type="button" className="fp-link" onClick={onBack}>Back to your progress</button>
      {toast}
    </div>
  );
}

/* ---------------------------------- Page ----------------------------------- */

export default function FreeProductPage({ user, authLoading, stage = 'progress', onNavigate, onSignIn, onStartQuiz }) {
  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [toastNode, toast] = useToast();
  const viewedRef = useRef(false);

  const load = useCallback(() => api.getCampaignStatus().then(
    (s) => { setStatus(s); setLoadError(null); return s; },
    (err) => { setLoadError(err.code || 'error'); return null; },
  ), []);

  useEffect(() => {
    if (authLoading || !user) return undefined;
    let active = true;
    let retry = null;
    const get = (again) => api.getCampaignStatus().then(
      (s) => { if (active) { setStatus(s); setLoadError(null); } },
      (err) => {
        if (!active) return;
        // Just signed in: the session can still be settling. Try once more before saying it ended.
        if (err.code === 'auth_required' && again) { retry = setTimeout(() => get(false), 1500); return; }
        setLoadError(err.code || 'error');
      },
    );
    get(true);
    return () => { active = false; clearTimeout(retry); };
  }, [authLoading, user]);

  // Arrived from the announcement email (utm survives into this view).
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('utm_campaign') === 'free-product-2026' && q.get('utm_source')) {
        api.track('campaign_email_cta_clicked', { source: q.get('utm_source') });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!status?.campaign || viewedRef.current) return;
    viewedRef.current = true;
    api.track('campaign_page_viewed', {
      stage,
      verified: Boolean(status.verified),
      feedbackComplete: status.feedbackComplete,
      referralsVerified: status.referralsVerified,
      eligible: Boolean(status.eligible),
      claimed: Boolean(status.claim),
    });
  }, [status, stage]);

  // Milestones, reported once per browser.
  useEffect(() => {
    if (!status?.campaign || !user) return;
    if (status.feedbackComplete >= status.campaign.feedbackRequired) api.trackOnce('campaign_feedback_all_completed', {}, user.id);
    if (status.eligible) api.trackOnce('campaign_eligible', {}, user.id);
    let seen = 0;
    const k = `ayna_fp_verified_seen_v1:${user.id}`;
    try { seen = Number(window.localStorage.getItem(k) || 0); } catch { /* ignore */ }
    if (status.referralsVerified > seen) {
      for (let n = seen + 1; n <= status.referralsVerified; n += 1) api.track('campaign_referral_verified', { verifiedCount: n });
      try { window.localStorage.setItem(k, String(status.referralsVerified)); } catch { /* ignore */ }
    }
  }, [status, user]);

  const go = (view) => onNavigate?.(view);

  let content;
  if (authLoading || (user && !status && !loadError)) {
    content = <ViewSkeleton label="Loading your free product progress" cards={3} lines={2} onRetry={load} />;
  } else if (!user) {
    content = (
      <div className="fp-intro">
        <PageHead title="Give us your thoughts. Get something on us." lead="Tell us what you really think of ayna, bring three friends, and pick a free product." />
        <Equation />
        <div className="fp-intro__actions">
          <Cta onClick={onSignIn}>Sign in to start</Cta>
          <button type="button" className="fp-link" onClick={onStartQuiz}>New to ayna? Start with a few short questions</button>
        </div>
        <Rules />
      </div>
    );
  } else if (!status) {
    content = (
      <Notice tone="alert" action={loadError === 'auth_required' && onSignIn ? <button type="button" className="fp-btn" onClick={onSignIn}>Sign in again</button> : <button type="button" className="fp-btn" onClick={load}>Try again</button>}>
        {loadError === 'auth_required' ? 'Your session ended. Sign in again to see your progress.' : "We couldn't load your progress. Nothing you did is lost."}
      </Notice>
    );
  } else if (!status.campaign || (!status.campaign.launched && !status.claim)) {
    content = (
      <div className="fp-intro">
        <PageHead title="Nothing to earn right now." lead="This isn't running at the moment. Keep an eye on your inbox." />
      </div>
    );
  } else if (status.claim) {
    content = <ClaimedView claim={status.claim} user={user} onUpdated={(c) => setStatus((s) => ({ ...s, claim: c }))} onBack={() => go('free-product')} />;
  } else if (status.campaign.ended) {
    content = (
      <div className="fp-intro">
        <PageHead title="This one has wrapped up." lead="Thank you to everyone who sent us feedback and brought friends. Your answers still help us build ayna." />
      </div>
    );
  } else if (!status.campaign.live) {
    content = (
      <>
        <Notice tone="soft"><b>We've paused this for a moment.</b> Your progress is saved and will be here when it's back.</Notice>
        {stage === 'progress' && <ProgressView status={status} user={user} onUnlock={() => {}} onRefresh={load} toast={toast} />}
      </>
    );
  } else if (stage === 'reward') {
    content = status.eligible
      ? <RewardView status={status} user={user} onRefresh={load} onBack={() => go('free-product')} toast={toastNode} setStatus={setStatus} />
      : (
        <div className="fp-intro">
          <PageHead title="Not earned yet." lead={remainingLabel(status) || 'Finish every step first.'} />
          <Cta onClick={() => go('free-product')}>See what's left</Cta>
        </div>
      );
  } else {
    content = (
      <>
        <PageHead title="Your free product progress" lead={status.eligible ? 'You’ve earned it. Spin to pick your free product.' : 'Three thoughtful answers and three friends who join ayna. Then you pick something free.'}>
          <Equation compact />
        </PageHead>
        <ProgressView status={status} user={user} onUnlock={() => go('free-product-reward')} onRefresh={load} toast={toast} />
      </>
    );
  }

  const errorBanner = status && loadError && loadError !== 'auth_required'
    ? <Notice tone="alert" action={<button type="button" className="fp-btn" onClick={load}>Retry</button>}>We couldn't refresh just now. What you see is your last saved progress.</Notice>
    : null;

  return (
    <section className="fp mockup-page" data-stage={stage}>
      {errorBanner}
      {content}
      {stage !== 'reward' && toastNode}
    </section>
  );
}
