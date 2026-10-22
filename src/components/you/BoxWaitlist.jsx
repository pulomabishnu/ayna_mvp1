import React, { useState } from 'react';
import { apiUrl } from '../../utils/apiUrl.js';

/*
 * "Monthly box" waitlist card (focus group asks). Tests interest before we
 * build anything: email plus an optional "what would you want in it".
 * Calm states: idle, saving, saved, couldn't save (input kept).
 */
export default function BoxWaitlist({ variant = 'web', email: knownEmail = '' }) {
  const app = variant === 'app';
  const [email, setEmail] = useState(knownEmail || '');
  const [wants, setWants] = useState('');
  const [state, setState] = useState(() => { try { return localStorage.getItem('ayna_box_waitlist_v1') ? 'saved' : 'idle'; } catch { return 'idle'; } });
  const submit = async (e) => {
    e.preventDefault();
    if (state === 'saving') return;
    setState('saving');
    try {
      const r = await fetch(apiUrl('/api/box-waitlist'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify({ email: email.trim(), wants: wants.trim(), source: app ? 'app-you' : 'you', platform: app ? 'app' : 'web' }) });
      if (r.ok) {
        try { localStorage.setItem('ayna_box_waitlist_v1', String(Date.now())); } catch { /* fine */ }
        setState('saved');
        return;
      }
      const data = await r.json().catch(() => ({}));
      setState(r.status === 400 ? `error:${data.error || 'Check your email and try again.'}` : 'error:Couldn’t save, try again later.');
    } catch {
      setState('error:Couldn’t save, try again later.');
    }
  };
  const err = state.startsWith('error:') ? state.slice(6) : '';
  return (
    <section className={app ? 'ay-you-section' : 'wy-sec'} aria-labelledby="ay-box-h">
      <h2 className={app ? 'ay-you-h2' : 'ay-group__title'} id="ay-box-h">Monthly box</h2>
      <div className="ay-group is-padded ay-box">
        {state === 'saved' ? (
          <p className="ay-box__done" role="status">You’re on the list. We’ll email you if we start the box.</p>
        ) : (
          <form className="ay-box__form" onSubmit={submit} noValidate>
            <p className="ay-box__lede">A box of period and wellness products each month, matched to you. Want it?</p>
            <label className="ay-box__label" htmlFor="ay-box-email">Email</label>
            <input id="ay-box-email" className="ay-box__input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={Boolean(err) || undefined} aria-describedby={err ? 'ay-box-err' : undefined} />
            <label className="ay-box__label" htmlFor="ay-box-wants">What would you want in it? <small>Optional</small></label>
            <input id="ay-box-wants" className="ay-box__input" type="text" maxLength={300} value={wants} onChange={(e) => setWants(e.target.value)} />
            {err && <p className="ay-box__err" id="ay-box-err" role="alert">{err}</p>}
            <button type="submit" className="ay-btn ay-btn--secondary cm-small" disabled={state === 'saving'}>{state === 'saving' ? 'Joining…' : 'Join the waitlist'}</button>
          </form>
        )}
      </div>
    </section>
  );
}
