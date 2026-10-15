import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/free-product.css';
import ViewSkeleton from '../skeletons/ViewSkeleton';
import ProductTileImage from '../ProductTileImage';
import ProductReel from './ProductReel';
import {
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

function Equation({ compact = false }) {
  return (
    <ol className={`fp-eq${compact ? ' is-compact' : ''}`} aria-label="3 thoughtful answers plus 3 friends who join ayna equals 1 free product you pick">
      <li className="fp-eq__tile tone-butter"><b>3</b><span>thoughtful answers</span></li>
      <li className="fp-eq__op" aria-hidden="true">+</li>
      <li className="fp-eq__tile tone-peri"><b>3</b><span>friends who join</span></li>
      <li className="fp-eq__op" aria-hidden="true">=</li>
      <li className="fp-eq__tile tone-pink"><b>1</b><span>free product, your pick</span></li>
    </ol>
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
        {done && <span className="fp-pill tone-mint"><i>{Icon.check}</i>Done</span>}
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
        <li className={`fp-step tone-butter${status.verified ? ' is-done' : ''}`} ref={accountRef}>
          <span className="fp-step__n" aria-hidden="true">1</span>
          <h2>Your account</h2>
          <p className="fp-step__big">{status.verified ? 'Verified' : 'Not verified'}</p>
          <StatusLine done={status.verified}>{status.verified ? 'All set' : 'Confirm your email or phone'}</StatusLine>
          {!status.verified && <p className="fp-muted">Sign out, then sign back in with your email or phone. We'll send a code to confirm it's you.</p>}
        </li>
        <li className={`fp-step tone-peri${fbDone ? ' is-done' : ''}`}>
          <span className="fp-step__n" aria-hidden="true">2</span>
          <h2>Your feedback</h2>
          <p className="fp-step__big">{status.feedbackComplete}/{c.feedbackRequired} <small>completed</small></p>
          <StatusLine done={fbDone} partial={status.feedbackComplete > 0}>{fbDone ? 'Thank you' : `${c.feedbackRequired - status.feedbackComplete} to go`}</StatusLine>
        </li>
        <li className={`fp-step tone-pink${frDone ? ' is-done' : ''}`}>
          <span className="fp-step__n" aria-hidden="true">3</span>
          <h2>Your referrals</h2>
          <p className="fp-step__big">{Math.min(status.referralsVerified, c.referralsRequired)}/{c.referralsRequired} <small>verified friends</small></p>
          <StatusLine done={frDone} partial={status.referralsVerified > 0}>{frDone ? 'All in' : `${c.referralsRequired - status.referralsVerified} to go`}</StatusLine>
        </li>
      </ul>

      <div className="fp-ctabar">
        {status.eligible ? (
          status.inventoryAvailable ? (
            <Cta onClick={onUnlock}>Unlock my free product</Cta>
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

      <p className="fp-fine">Products are limited and go to whoever claims them first. One free product per person. Claiming a product is final.</p>
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
        {product.category && <span className="fp-pill">{String(product.category).replace(/[-_]/g, ' ')}</span>}
        {summary && <p className="fp-result__summary">{summary}</p>}
      </div>
    </article>
  );
}

function ConfirmDialog({ product, busy, onConfirm, onCancel }) {
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
        <p id="fp-confirm-body">Once you claim this product, your reward is locked in and you won't be able to spin for another one.</p>
        <div className="fp-dialog__actions">
          <button type="button" className="fp-btn is-ink" ref={confirmRef} onClick={onConfirm} disabled={busy} aria-busy={busy || undefined}>{busy ? 'Claiming…' : 'Yes, claim it'}</button>
          <button type="button" className="fp-btn is-ghost" onClick={onCancel} disabled={busy}>Keep spinning</button>
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
      <h1 tabIndex={-1} ref={headingRef} className="fp-h1">It's <span className="fp-mark tone-pink">yours.</span></h1>
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

function RewardView({ status, user, onRefresh, onBack, toast, setStatus }) {
  const [current, setCurrent] = useState(status.lastSpin || null); // { spinId, product }
  const [spinning, setSpinning] = useState(false);
  const [settled, setSettled] = useState(Boolean(status.lastSpin));
  const [confirming, setConfirming] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [problem, setProblem] = useState(null); // { tone, text }
  const [announce, setAnnounce] = useState('');
  const spinCount = useRef(status.spins || 0);
  const headingRef = useRef(null);
  const currentRef = useRef(current);
  currentRef.current = current;
  const pool = status.pool || [];

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
      else if (err.code === 'already_claimed' || err.code === 'not_eligible' || err.code === 'campaign_inactive') onRefresh();
      else if (err.code === 'slow_down') setProblem({ tone: 'soft', text: "That's a lot of spins. Give it a minute, then try again." });
      else setProblem({ tone: 'alert', text: "Couldn't reach ayna. Nothing was lost, try spinning again." });
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
    setTimeout(() => headingRef.current?.focus({ preventScroll: false }), 30);
  }, []);

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
        setProblem({ tone: 'butter', text: "That one was just claimed. Spin again and we'll find you another." });
        setCurrent(null);
        onRefresh();
      } else if (err.code === 'already_claimed') {
        onRefresh();
      } else if (err.code === 'stale_spin') {
        setProblem({ tone: 'soft', text: 'That spin was replaced by a newer one. Spin again to keep going.' });
        setCurrent(null);
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

  if (!status.inventoryAvailable && !current) {
    return (
      <div className="fp-reward">
        <h1 className="fp-h1">Your free product is unlocked.</h1>
        <Notice tone="soft"><b>Every product has been claimed for now.</b> You're still eligible and we've saved your spot. We'll email you as soon as we add more.</Notice>
        <button type="button" className="fp-link" onClick={onBack}>Back to your progress</button>
      </div>
    );
  }

  return (
    <div className="fp-reward">
      <header className="fp-reward__head">
        <h1 className="fp-h1">Your free product is <span className="fp-mark tone-peri">unlocked.</span></h1>
        <p className="fp-sub">Spin for something you'll actually want. Spin as many times as you like. Claiming one is final.</p>
      </header>

      {pool.length > 0 && <ProductReel pool={pool} spinning={spinning} result={current} onSettled={onSettled} />}
      <p className="fp-sr" aria-live="polite">{announce}</p>

      {problem && <Notice tone={problem.tone} action={<button type="button" className="fp-btn" onClick={doSpin} disabled={spinning}>Spin again</button>}>{problem.text}</Notice>}

      {spinning && <p className="fp-spin-hint" role="status">Finding something for you…</p>}

      {!spinning && current && settled && (
        <div className="fp-reward__result">
          <h2 className="fp-sr" tabIndex={-1} ref={headingRef}>Your spin</h2>
          <ResultCard product={current.product} />
          <div className="fp-reward__actions">
            <Cta onClick={() => setConfirming(true)}>Claim this</Cta>
            <button type="button" className="fp-btn is-ghost is-lg" onClick={doSpin}>Spin again</button>
          </div>
          <p className="fp-muted">Not for you? Spin again.</p>
        </div>
      )}

      {!spinning && !current && !problem && (
        <div className="fp-reward__actions is-start">
          <Cta onClick={doSpin}>Spin</Cta>
        </div>
      )}

      {confirming && current && (
        <ConfirmDialog product={current.product} busy={claiming} onConfirm={confirmClaim} onCancel={() => setConfirming(false)} />
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
    api.getCampaignStatus().then(
      (s) => { if (active) { setStatus(s); setLoadError(null); } },
      (err) => { if (active) setLoadError(err.code || 'error'); },
    );
    return () => { active = false; };
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
        <h1 className="fp-h1">Give us your thoughts. Get something <span className="fp-mark">on us.</span></h1>
        <p className="fp-sub">Tell us what you really think of ayna, bring three friends, and pick a free product.</p>
        <Equation />
        <div className="fp-intro__actions">
          <Cta onClick={onSignIn}>Sign in to start</Cta>
          <button type="button" className="fp-link" onClick={onStartQuiz}>New to ayna? Start with six questions</button>
        </div>
        <p className="fp-fine">Products are limited and go to whoever claims them first. One free product per person.</p>
      </div>
    );
  } else if (!status) {
    content = (
      <Notice tone="alert" action={<button type="button" className="fp-btn" onClick={load}>Try again</button>}>
        {loadError === 'auth_required' ? 'Your session ended. Sign in again to see your progress.' : "We couldn't load your progress. Nothing you did is lost."}
      </Notice>
    );
  } else if (!status.campaign || (!status.campaign.launched && !status.claim)) {
    content = (
      <div className="fp-intro">
        <h1 className="fp-h1">Nothing to earn right now.</h1>
        <p className="fp-sub">This isn't running at the moment. Keep an eye on your inbox.</p>
      </div>
    );
  } else if (status.claim) {
    content = <ClaimedView claim={status.claim} user={user} onUpdated={(c) => setStatus((s) => ({ ...s, claim: c }))} onBack={() => go('free-product')} />;
  } else if (status.campaign.ended) {
    content = (
      <div className="fp-intro">
        <h1 className="fp-h1">This one has wrapped up.</h1>
        <p className="fp-sub">Thank you to everyone who sent us feedback and brought friends. Your answers still help us build ayna.</p>
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
          <h1 className="fp-h1">Not unlocked yet.</h1>
          <p className="fp-sub">{remainingLabel(status) || 'Finish every step first.'}</p>
          <Cta onClick={() => go('free-product')}>See what's left</Cta>
        </div>
      );
  } else {
    content = (
      <>
        <header className="fp-head">
          <h1 className="fp-h1">Your free product progress</h1>
          <p className="fp-sub">{status.eligible ? 'Your free product is unlocked.' : "Three thoughtful answers and three friends who join ayna. Then you pick something free."}</p>
          <Equation compact />
        </header>
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
