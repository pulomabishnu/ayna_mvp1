import React, { useEffect, useId, useRef, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';
import { checkCommunityText, CRISIS_LINE } from '../utils/communityRules';
import '../styles/suggest.css';

// Anonymous "Suggest a product" / "Suggest a read" box, shared by the website
// (Shop, Library) and the app (Browse, Library). Sends only the suggestion text
// to /api/suggestions: no name, no email, no user id, no auth header.

// Same text rules as Community (slurs, harassment, explicit content, promo
// codes, personal contact info). Crisis language is never blocked.
function checkWithRules(...texts) {
  const results = texts.filter(Boolean).map((t) => checkCommunityText(t));
  const hit = results.find((r) => r.blocked);
  return { message: hit ? hit.message : '', crisis: results.some((r) => r.crisis) };
}

const QUEUE_KEY = 'ayna_suggest_queue_v1';
const readQueue = () => { try { const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); return Array.isArray(q) ? q : []; } catch { return []; } };
const writeQueue = (q) => { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-5))); } catch { /* private mode */ } };

async function postSuggestion(payload) {
  const res = await fetch(apiUrl('/api/suggestions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, error: data?.error };
}

// Suggestions that could not reach the server (offline, or the table is not
// live yet) wait here and are retried quietly the next time a box mounts.
let flushing = false;
async function flushQueue() {
  if (flushing) return;
  const queue = readQueue();
  if (!queue.length) return;
  flushing = true;
  const left = [];
  for (const item of queue) {
    try {
      const r = await postSuggestion(item);
      if (!r.ok && r.status >= 500) left.push(item);
    } catch {
      left.push(item);
    }
  }
  writeQueue(left);
  flushing = false;
}

const COPY = {
  product: { title: "Can't find it?", sub: 'Tell us what to add to Shop.', open: 'Suggest a product' },
  read: { title: 'Want a read on something?', sub: 'Tell us what to write about next.', open: 'Suggest a read' },
};

const Icon = ({ kind }) => (kind === 'read' ? (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z" /></svg>
) : (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
));

export default function SuggestBox({ mode = 'product', variant = 'web', context = 'shop', prefill = '', className = '' }) {
  const uid = useId();
  const [kind, setKind] = useState(mode === 'read' ? 'read' : 'product');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');
  const [productName, setProductName] = useState('');
  const [link, setLink] = useState('');
  const [reason, setReason] = useState('');
  const [topic, setTopic] = useState('');
  const [trap, setTrap] = useState('');
  const [crisis, setCrisis] = useState(false);
  const firstField = useRef(null);
  const thanksRef = useRef(null);

  useEffect(() => { flushQueue(); }, []);
  useEffect(() => { if (open && status === 'idle') firstField.current?.focus({ preventScroll: true }); }, [open, kind, status]);
  useEffect(() => { if (status === 'sent') thanksRef.current?.focus({ preventScroll: true }); }, [status]);

  const copy = COPY[kind];
  const canSend = kind === 'product' ? productName.trim().length >= 2 : topic.trim().length >= 3;

  const reset = () => {
    setProductName(''); setLink(''); setReason(''); setTopic(''); setError(''); setStatus('idle'); setCrisis(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSend || status === 'sending') return;
    setError('');
    setStatus('sending');
    const rules = kind === 'product' ? checkWithRules(productName, reason) : checkWithRules(topic);
    if (rules.message) { setError(rules.message); setStatus('idle'); return; }
    setCrisis(rules.crisis);
    const payload = kind === 'product'
      ? { kind, productName: productName.trim(), link: link.trim(), reason: reason.trim(), context, platform: variant === 'app' ? 'app' : 'web', website: trap }
      : { kind, topic: topic.trim(), context, platform: variant === 'app' ? 'app' : 'web', website: trap };
    try {
      const r = await postSuggestion(payload);
      if (r.ok) { setStatus('sent'); return; }
      if (r.status >= 500) { writeQueue([...readQueue(), payload]); setStatus('sent'); return; }
      setError(r.error || 'That did not send. Try again?');
      setStatus('idle');
    } catch {
      writeQueue([...readQueue(), payload]);
      setStatus('sent');
    }
  };

  const rootClass = `ay-suggest is-${variant}${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`;

  if (!open) {
    return (
      <section className={rootClass} aria-labelledby={`${uid}-t`}>
        <div className="ay-suggest__intro">
          <span className={`ay-suggest__icon is-${kind}`}><Icon kind={kind} /></span>
          <div className="ay-suggest__copy">
            <h2 id={`${uid}-t`}>{copy.title}</h2>
            <p>{copy.sub} Anonymous.</p>
          </div>
          <button type="button" className="ay-suggest__btn" onClick={() => { if (prefill && !productName.trim()) setProductName(prefill); setOpen(true); setStatus('idle'); }}>{copy.open}</button>
        </div>
      </section>
    );
  }

  if (status === 'sent') {
    return (
      <section className={`${rootClass} is-sent`} aria-labelledby={`${uid}-t`}>
        <div className="ay-suggest__thanks" ref={thanksRef} tabIndex={-1} role="status">
          <span className="ay-suggest__check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
          <div className="ay-suggest__copy">
            <h2 id={`${uid}-t`}>Thank you!</h2>
            <p>{kind === 'product' ? 'Got it. We look at every product idea.' : 'Got it. It goes on our reading list.'}</p>
            {crisis && <p className="ay-suggest__crisis">{CRISIS_LINE}</p>}
          </div>
          <div className="ay-suggest__thanks-actions">
            <button type="button" className="ay-suggest__ghost" onClick={reset}>Send another</button>
            <button type="button" className="ay-suggest__ghost is-quiet" onClick={() => { reset(); setOpen(false); }}>Done</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={rootClass} aria-labelledby={`${uid}-t`}>
      <form className="ay-suggest__form" onSubmit={submit} noValidate>
        <div className="ay-suggest__head">
          <h2 id={`${uid}-t`}>{kind === 'product' ? 'Suggest a product' : 'Suggest a read'}</h2>
          <button type="button" className="ay-suggest__close" aria-label="Close" onClick={() => { setOpen(false); setError(''); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="ay-suggest__seg" role="radiogroup" aria-label="What are you suggesting?">
          {[['product', 'Product'], ['read', 'Read']].map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={kind === id} className={kind === id ? 'is-on' : ''} onClick={() => { setKind(id); setError(''); }}>
              <Icon kind={id} />{label}
            </button>
          ))}
        </div>

        {kind === 'product' ? (
          <div className="ay-suggest__fields">
            <label className="ay-suggest__field">
              <span>Product or brand</span>
              <input ref={firstField} value={productName} onChange={(e) => setProductName(e.target.value)} maxLength={120} placeholder="e.g. a period underwear brand" autoComplete="off" required />
            </label>
            <label className="ay-suggest__field">
              <span>Link <em>optional</em></span>
              <input value={link} onChange={(e) => setLink(e.target.value)} maxLength={300} placeholder="https://" inputMode="url" autoComplete="off" />
            </label>
            <label className="ay-suggest__field">
              <span>Why it should be here <em>optional</em></span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} placeholder="What it helps with, why you like it" />
            </label>
          </div>
        ) : (
          <div className="ay-suggest__fields">
            <label className="ay-suggest__field">
              <span>Topic or question</span>
              <textarea ref={firstField} value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} rows={3} placeholder="e.g. Is it normal for my cycle to change after 35?" required />
            </label>
          </div>
        )}
        <label className="ay-suggest__trap" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label>

        {error && <p className="ay-suggest__error" role="alert">{error}</p>}

        <div className="ay-suggest__foot">
          <p className="ay-suggest__anon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            Anonymous. No name, email or account attached.
          </p>
          <button type="submit" className="ay-suggest__btn" disabled={!canSend || status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  );
}
