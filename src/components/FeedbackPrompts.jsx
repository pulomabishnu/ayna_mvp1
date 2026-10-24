import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CharRing from './ui/CharRing.jsx';
import { isOverLimit } from '../utils/charLimit.js';
import { FEEDBACK_CAMPAIGN, markSurveySeen, surveySeenRecently, setFeedbackOwner, readPurchaseQueue, writePurchaseQueue, updatePurchase, readyPurchase, removePurchase, sendFeedback } from '../utils/feedbackClient';
import './feedbackPrompts.css';

const REFERRALS = ['TikTok', 'Instagram', 'LinkedIn', 'Google / search', 'Friend / word of mouth', 'Event / conference', 'Brand / partner', 'Other'];
const PURCHASE_PROMPTS_ON = false;
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
  const purchase = prompt.kind === 'purchase';
  return <div className="v6-survey-backdrop ay-sheet-backdrop ph-no-capture ph-mask" data-ph-no-capture="true" onKeyDown={onKeyDown}>
    <div ref={card} className="v6-survey-card ay-sheet" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div className="ay-sheet__strip" aria-hidden="true"><span>{done ? 'Saved' : purchase ? 'Quick check-in' : 'Feedback'}</span></div>
      <button type="button" className="v6-survey-close ay-sheet__close" aria-label="Close feedback" disabled={busy} onClick={onClose}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      <h2 id="feedback-title" className="ay-sheet__title">{done ? 'Thanks for answering.' : purchase ? 'Did you buy this item?' : 'How are you liking ayna?'}</h2>
      {done ? <><p className="ay-sheet__sub">Your anonymous answer was saved.</p><div className="ay-sheet__actions"><button type="button" className="v6-survey-submit ay-btn ay-btn--primary" onClick={onClose}>Done</button></div></> : <>
        <p className="v6-survey-sub ay-sheet__sub">{purchase ? `${prompt.name}${prompt.variant ? `, ${prompt.variant}` : ''}` : 'A quick, optional check-in.'}</p>
        {!purchase && <p className="v6-survey-sub ay-sheet__note">Answers aren’t linked to your account. Please leave out personal details.</p>}
        {purchase ? <div className="v6-survey-actions ay-sheet__actions">
          <button type="button" className="v6-survey-submit ay-btn ay-btn--primary" disabled={busy} onClick={() => submit('yes')}>Yes</button>
          <button type="button" className="v6-survey-skip ay-btn ay-btn--secondary" disabled={busy} onClick={() => submit('no')}>No</button>
        </div> : <>
          <div className="v6-survey-stars ay-stars" role="group" aria-label="Rate ayna from 1 to 5 stars">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" className={`v6-survey-star ay-stars__star${value <= rating ? ' is-filled' : ''}`} aria-pressed={rating === value} aria-label={`${value} star${value === 1 ? '' : 's'}`} disabled={busy} onClick={() => setRating(value)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z" /></svg></button>)}</div>
          <label className="ay-field-label" htmlFor="ay-survey-text">Anything you want to tell us? <span>(optional)</span></label>
          <span className="ay-charfield"><textarea id="ay-survey-text" className="v6-survey-textarea ay-field ay-field--area" value={feedback} disabled={busy} onChange={e => setFeedback(e.target.value)} placeholder="What you like, what's missing" aria-invalid={isOverLimit(feedback, 600) || undefined} /><CharRing value={feedback} max={600} /></span>
          <label className="ay-field-label" htmlFor="ay-survey-heard">How did you hear about us? <span>(optional)</span></label>
          <select id="ay-survey-heard" className="v6-account-input v6-survey-select ay-field ay-field--select" aria-label="How did you hear about us?" value={referral} disabled={busy} onChange={e => setReferral(e.target.value)}><option value="">How did you hear about us? (optional)</option>{REFERRALS.map(item => <option key={item}>{item}</option>)}</select>
          {referral === 'Other' && <input className="v6-account-input ay-field" aria-label="Where did you hear about us?" placeholder="Where did you hear about us?" maxLength={110} value={other} disabled={busy} onChange={e => setOther(e.target.value)} />}
          <div className="v6-survey-actions ay-sheet__actions"><button type="button" className="v6-survey-submit ay-btn ay-btn--primary" disabled={busy || !rating || isOverLimit(feedback, 600)} onClick={() => submit()}>Send feedback</button><button type="button" className="v6-survey-skip ay-btn ay-btn--secondary" disabled={busy} onClick={onClose}>Not now</button></div>
        </>}
        <p role="status" className="v6-survey-status ay-sheet__status">{busy ? 'Saving…' : error}</p>
      </>}
    </div>
  </div>;
}

export default function FeedbackPrompts({ user, authLoading, currentView, safeViews = SAFE_VIEWS }) {
  const [prompt, setPrompt] = useState(null);
  const active = useRef(false);
  const view = useRef(currentView);
  const safe = useRef(safeViews);
  useEffect(() => { safe.current = safeViews; }, [safeViews]);
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
      // Purchase check-ins ("Did you buy this item?") are off (founder, Oct 20).
      if (!PURCHASE_PROMPTS_ON) return;
      if (document.visibilityState !== 'visible' || !document.hasFocus() || active.current || competingDialog() || !safe.current.has(currentView)) return;
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
      if (cancelled || !safe.current.has(view.current) || document.visibilityState !== 'visible' || active.current || competingDialog() || readPurchaseQueue().length) return;
      if (surveyReceipt.current) {
        active.current = true;
        markSurveySeen(user.id);
        setPrompt({ kind: 'survey', receipt: surveyReceipt.current, view: view.current });
        surveyReceipt.current = null;
        return;
      }
      if (checked.current.has(key)) return;
      checked.current.add(key);
      // Asked, closed or answered on this device in the last 14 days: don't ask the server.
      if (surveySeenRecently(user.id)) return;
      active.current = true;
      try {
        const result = await sendFeedback({ action: 'claim-survey' }, true);
        if (!cancelled && result.claimed) surveyReceipt.current = result.receipt;
      } catch {
        // If the survey service is down, ask once per visit, not every 8 seconds.
      } finally { active.current = false; }
    }, 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [user?.id, authLoading]);
  useEffect(() => {
    if (prompt?.view && prompt.view !== currentView) {
      setPrompt(null);
      active.current = false;
    }
  }, [currentView, prompt]);
  const close = () => {
    if (prompt?.kind === 'purchase') removePurchase(prompt.id);
    // Closing counts as asked, and an answer restarts the 14 days too.
    else if (prompt?.kind === 'survey' && user?.id) markSurveySeen(user.id);
    setPrompt(null); active.current = false;
  };
  // Keep the fixed backdrop centered even when an ancestor of the app is transformed.
  return prompt ? createPortal(<FeedbackDialog key={prompt.receipt} prompt={prompt} onClose={close} />, document.body) : null;
}
