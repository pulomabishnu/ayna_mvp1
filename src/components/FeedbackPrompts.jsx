import React, { useEffect, useRef, useState } from 'react';
import { FEEDBACK_CAMPAIGN, setFeedbackOwner, readPurchaseQueue, writePurchaseQueue, updatePurchase, readyPurchase, removePurchase, sendFeedback } from '../utils/feedbackClient';

const REFERRALS = ['TikTok', 'Instagram', 'LinkedIn', 'Google / search', 'Friend / word of mouth', 'Event / conference', 'Brand / partner', 'Other'];
const SAFE_VIEWS = new Set(['welcome', 'hero', 'ecosystem', 'discovery', 'articles', 'product']);
function competingDialog() { return Boolean(document.querySelector('[aria-modal="true"], .v6-account-step, .v6-verify-backdrop')); }

function FeedbackDialog({ prompt, onClose }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [referral, setReferral] = useState('');
  const [other, setOther] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const card = useRef(null);
  const submitting = useRef(false);
  useEffect(() => {
    const previous = document.activeElement;
    card.current?.querySelector('button')?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  const submit = async (answer) => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setError('');
    try {
      await sendFeedback({ action: 'submit', receipt: prompt.receipt, ...(prompt.kind === 'purchase' ? { answer } : { rating, feedback, heardAboutUs: referral === 'Other' ? `Other: ${other}`.slice(0, 120) : referral }) });
      setDone(true);
    } catch { setError("Couldn't save your answer. Please try again."); }
    finally { submitting.current = false; setBusy(false); }
  };
  const onKeyDown = event => {
    if (event.key === 'Escape' && !busy) { event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const focusable = [...card.current.querySelectorAll('button:not(:disabled), textarea, select, input')].filter(el => !el.hidden);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <div className="v6-survey-backdrop ph-no-capture ph-mask" data-ph-no-capture="true" onKeyDown={onKeyDown}>
    <div ref={card} className="v6-survey-card" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <button type="button" className="v6-survey-close" aria-label="Close feedback" disabled={busy} onClick={onClose}>✕</button>
      <h2 id="feedback-title">{done ? 'Thank you!' : prompt.kind === 'purchase' ? 'Did you buy this item?' : 'How are you liking ayna?'}</h2>
      {done ? <><p>Your anonymous answer was saved.</p><button type="button" className="v6-survey-submit" onClick={onClose}>Done</button></> : <>
        <p className="v6-survey-sub">{prompt.kind === 'purchase' ? `${prompt.name}${prompt.variant ? ` — ${prompt.variant}` : ''}` : 'A quick, optional check-in.'}</p>
        <p className="v6-survey-sub">Answers aren’t linked to your account. Please leave out personal details.</p>
        {prompt.kind === 'purchase' ? <div className="v6-survey-actions">
          <button type="button" className="v6-survey-submit" disabled={busy} onClick={() => submit('yes')}>Yes</button>
          <button type="button" className="v6-survey-skip" disabled={busy} onClick={() => submit('no')}>No</button>
        </div> : <>
          <div className="v6-survey-stars" role="group" aria-label="Rate ayna from 1 to 5 stars">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" className={`v6-survey-star${value <= rating ? ' is-filled' : ''}`} aria-pressed={rating === value} aria-label={`${value} star${value === 1 ? '' : 's'}`} disabled={busy} onClick={() => setRating(value)}>★</button>)}</div>
          <textarea className="v6-survey-textarea" aria-label="Optional feedback" maxLength={600} value={feedback} disabled={busy} onChange={e => setFeedback(e.target.value)} placeholder="Anything you want to tell us? (optional)" />
          <select className="v6-account-input v6-survey-select" aria-label="How did you hear about us?" value={referral} disabled={busy} onChange={e => setReferral(e.target.value)}><option value="">How did you hear about us? (optional)</option>{REFERRALS.map(item => <option key={item}>{item}</option>)}</select>
          {referral === 'Other' && <input className="v6-account-input" aria-label="Where did you hear about us?" maxLength={110} value={other} disabled={busy} onChange={e => setOther(e.target.value)} />}
          <div className="v6-survey-actions"><button type="button" className="v6-survey-submit" disabled={busy || !rating} onClick={() => submit()}>Send feedback</button><button type="button" className="v6-survey-skip" disabled={busy} onClick={onClose}>Not now</button></div>
        </>}
        <p role="status" className="v6-survey-status">{busy ? 'Saving…' : error}</p>
      </>}
    </div>
  </div>;
}

export default function FeedbackPrompts({ user, authLoading, currentView }) {
  const [prompt, setPrompt] = useState(null);
  const active = useRef(false);
  const view = useRef(currentView);
  const surveyReceipt = useRef(null);
  useEffect(() => { view.current = currentView; }, [currentView]);
  const checked = useRef(new Set());
  useEffect(() => {
    if (!authLoading) {
      const owner = user?.id || null;
      setFeedbackOwner(owner);
      writePurchaseQueue(readPurchaseQueue().filter(row => !row.prompted && (row.owner || null) === owner));
    }
  }, [user?.id, authLoading]);
  useEffect(() => {
    const departure = () => {
      writePurchaseQueue(readPurchaseQueue().map(row => ({ ...row, departed: true })));
    };
    const showPurchase = () => {
      if (document.visibilityState !== 'visible' || !document.hasFocus() || active.current || competingDialog() || !SAFE_VIEWS.has(currentView)) return;
      const row = readyPurchase(readPurchaseQueue());
      if (!row) return;
      active.current = true;
      updatePurchase(row.id, { prompted: true });
      setPrompt({ ...row, kind: 'purchase' });
    };
    const visibility = () => document.visibilityState === 'hidden' ? departure() : showPurchase();
    window.addEventListener('blur', departure);
    window.addEventListener('focus', showPurchase);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('ayna-purchase-ready', showPurchase);
    // Re-check after another dialog closes, but never prompt without a departure.
    const timer = setInterval(showPurchase, 1500);
    return () => {
      clearInterval(timer);
      window.removeEventListener('blur', departure);
      window.removeEventListener('focus', showPurchase);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('ayna-purchase-ready', showPurchase);
    };
  }, [currentView]);
  useEffect(() => {
    if (authLoading || !user?.id) return;
    const key = `${FEEDBACK_CAMPAIGN}:${user.id}`;
    let cancelled = false;
    const timer = setInterval(async () => {
      if (cancelled || !SAFE_VIEWS.has(view.current) || document.visibilityState !== 'visible' || active.current || competingDialog() || readPurchaseQueue().length) return;
      if (surveyReceipt.current) {
        active.current = true;
        setPrompt({ kind: 'survey', receipt: surveyReceipt.current });
        surveyReceipt.current = null;
        return;
      }
      if (checked.current.has(key)) return;
      checked.current.add(key);
      active.current = true;
      try {
        const result = await sendFeedback({ action: 'claim-survey' }, true);
        if (!cancelled && result.claimed) surveyReceipt.current = result.receipt;
      } catch {
        checked.current.delete(key);
      } finally { active.current = false; }
    }, 8000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [user?.id, authLoading]);
  const close = () => {
    if (prompt?.kind === 'purchase') removePurchase(prompt.id);
    setPrompt(null); active.current = false;
  };
  return prompt ? <FeedbackDialog key={prompt.receipt} prompt={prompt} onClose={close} /> : null;
}
