import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '../../utils/apiUrl.js';
import { fetchWithTimeout } from '../../utils/network.js';
import '../../components/today/today-plan.css';

/**
 * Beta feedback, inside the app (focus group, Nov 11: TestFlight's own feedback is hidden, "a
 * dedicated feedback button in a prominent place"). Anywhere can open it with
 * openFeedback(); it sends to the team through the same /api/contact route as Profile > Contact.
 * Only what she types, the screen she was on and the platform go with it. No health data.
 */
export const OPEN_FEEDBACK_EVENT = 'ayna:open-feedback';
export function openFeedback() {
  try { window.dispatchEvent(new CustomEvent(OPEN_FEEDBACK_EVENT)); } catch { /* old browser */ }
}

const KINDS = ['Something is broken', 'Confusing', 'An idea', 'I like this'];

export default function FeedbackSheet({ authUser = null }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(KINDS[0]);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [screen, setScreen] = useState('');
  useEffect(() => {
    const on = () => { setScreen(String(window.__aynaScreen || '')); setStatus('idle'); setOpen(true); };
    window.addEventListener(OPEN_FEEDBACK_EVENT, on);
    return () => window.removeEventListener(OPEN_FEEDBACK_EVENT, on);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open || typeof document === 'undefined') return null;

  const myEmail = authUser?.email || email.trim();
  const name = String(authUser?.user_metadata?.first_name || '').trim() || 'ayna tester';
  const ready = message.trim().length >= 10 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(myEmail) && status !== 'sending';
  const send = async () => {
    if (!ready) return;
    setStatus('sending');
    const platform = (() => { try { return window.Capacitor?.getPlatform?.() || 'web'; } catch { return 'web'; } })();
    try {
      const res = await fetchWithTimeout(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.length >= 2 ? name : 'ayna tester',
          email: myEmail,
          reason: 'Feedback or Feature Request',
          subject: `App feedback: ${kind}${screen ? ` (${screen})` : ''}`,
          message: `${message.trim()}\n\nScreen: ${screen || 'unknown'} · Platform: ${platform}`,
        }),
      });
      if (!res.ok) throw new Error('send');
      setStatus('sent');
      setMessage('');
    } catch {
      setStatus('error');
    }
  };

  const host = document.querySelector('.ayna-mobile') || document.body;
  return createPortal(
    <div className="ay-tp-layer">
      <div className="ay-tp-dim" aria-hidden="true" onClick={() => setOpen(false)} />
      <section className="ay-tp-sheet ay-fb" role="dialog" aria-modal="true" aria-labelledby="ay-fb-h">
        <span className="ay-tp-sheet__grab" aria-hidden="true" />
        <button type="button" className="ay-tp-sheet__x" aria-label="Close" onClick={() => setOpen(false)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        {status === 'sent' ? <>
          <p className="ay-tp-sheet__kicker">Thank you</p>
          <h2 id="ay-fb-h">Got it. The team reads every one.</h2>
          <button type="button" className="ay-tp-goal ay-tp-goal--wide" onClick={() => setOpen(false)}>Done</button>
        </> : <>
          <p className="ay-tp-sheet__kicker">ayna beta</p>
          <h2 id="ay-fb-h">Send feedback</h2>
          <div className="ay-tp-goals__presets is-sheet" role="radiogroup" aria-label="What kind">{KINDS.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>{k}</button>
          ))}</div>
          <label className="ay-tp-goalform__label" htmlFor="ay-fb-msg">What happened?</label>
          <textarea id="ay-fb-msg" className="ay-tp-goalform__input ay-fb__msg" rows={5} maxLength={2000} placeholder="Tell us what you tapped and what you expected." value={message} onChange={(e) => setMessage(e.target.value)} />
          {!authUser?.email && <>
            <label className="ay-tp-goalform__label" htmlFor="ay-fb-email">Your email, so we can reply</label>
            <input id="ay-fb-email" className="ay-tp-goalform__input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </>}
          <p className="ay-fb__note">We send what you write, the screen you were on and your phone type. No health data.</p>
          {status === 'error' && <p className="ay-fb__err" role="alert">We couldn&rsquo;t send it. Check your connection and try again.</p>}
          <button type="button" className="ay-tp-goal ay-tp-goal--wide" disabled={!ready} onClick={send}>{status === 'sending' ? 'Sending…' : 'Send'}</button>
        </>}
      </section>
    </div>,
    host,
  );
}
