import { useEffect, useRef, useState } from 'react';
import { requestPro } from '../utils/proApi.js';
import './proAccess.css';

const date = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : '';
const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function ProAccess({ user, onSignIn }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const attempt = useRef({});
  const userId = user?.id;
  const returning = new URLSearchParams(window.location.search).get('checkout');
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    let timer;
    let polls = 0;
    const load = async () => {
      try {
        const result = await requestPro({ signal: controller.signal });
        if (controller.signal.aborted) return;
        setStatus({ ...result, userId }); setError('');
        if (returning === 'success' && !result.active && polls++ < 10) timer = setTimeout(load, 2000);
      } catch (e) { if (!controller.signal.aborted) setError(e.message); }
    };
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [userId, refresh, returning]);
  const current = status?.userId === user?.id ? status : null;
  const checkout = async plan => {
    if (busy) return;
    setBusy(true); setError('');
    // Retrying a failed network request reuses the same Stripe Checkout Session.
    const key = `${user.id}:${plan}`;
    attempt.current[key] ||= crypto.randomUUID();
    try {
      const result = await requestPro({ plan, requestId: attempt.current[key] });
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Checkout is unavailable. Please try again.');
      window.location.assign(url.href);
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return <section className="pro-access" aria-labelledby="pro-title">
    <p className="pro-access__eyebrow">ayna Early Access</p>
    <h1 id="pro-title">ayna Pro</h1>
    {!user ? <><p>Sign in to see your Pro access or choose an early-access plan.</p><button className="ay-btn ay-btn--primary" onClick={onSignIn}>Sign in</button></> : <>
      {current?.active ? <>
        <h2>Your Pro access is active.</h2>
        {current.temporaryUntil && <p>Temporary focus-group access ends {new Date(current.temporaryUntil).toLocaleString()}.</p>}
        {current.plan ? <p>{current.launchAt ? `Your prepaid ${current.plan} starts ${date(current.termStartsAt)} and ends ${date(current.termEndsAt)}.` : `Your first ${current.plan} starts at public launch. Until then, enjoy early access at no extra cost.`}</p> : <p>You have Pro access on your account.</p>}
      </> : <>
        <p>Buy your first month or year at the Early Access price today and unlock ayna Pro right away. We won’t start counting your purchased month or year until the January 2027 launch.</p>
        {current?.launchAt && <p>Public launch: {date(current.launchAt)}.</p>}
        {returning === 'success' && <p role="status">We’re waiting for payment confirmation. Pro unlocks as soon as your payment is confirmed.</p>}
        {returning === 'canceled' && <p>Checkout was canceled. You can choose a plan when you’re ready.</p>}
        {current && !current.offerOpen && <p>The early-access offer is currently closed.</p>}
        <p className="pro-access__note">Beta access is included at no extra cost. After your purchased period ends, your plan renews at $8.99/month or $90/year unless canceled. Cancel renewal anytime from this page.</p>
      </>}
        {current?.offerOpen && !current.hasPurchase && (!current.active || current.temporaryUntil) && <div className="pro-access__plans">{current.plans.map(plan => <button className="pro-access__plan" key={plan.id} disabled={busy} onClick={() => checkout(plan.id)}>
          <span>{plan.label}</span><del>{money(plan.regularAmount)}</del><strong>{money(plan.amount)} now</strong><span>{plan.id === 'year' ? '50% off your first year' : 'Save $4 on your first month'}</span><span>Then {money(plan.regularAmount)}/{plan.id}, unless canceled</span>
        </button>)}</div>}
      {!current && !error && <p role="status">Loading Pro…</p>}
      {busy && <p role="status">Updating Pro…</p>}
      {error && <p role="alert">{error}</p>}
      {current?.autoRenew && <button className="ay-btn ay-btn--secondary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await requestPro({ action: 'cancel_renewal' }); setRefresh(n => n + 1); } catch(e) { setError(e.message); } finally { setBusy(false); } }}>Cancel renewal</button>}
      {current?.hasPurchase && !current.autoRenew && <p>Automatic renewal is off. Your paid access remains until the end of your purchased period.</p>}
      <button className="ay-btn ay-btn--secondary" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Refresh access</button>
      {current?.isAdmin && <details className="pro-access__admin"><summary>Focus-group access</summary><p>Grant up to four hours of Pro without payment. Access expires automatically.</p><form onSubmit={async e => {
        e.preventDefault(); const form = new FormData(e.currentTarget); const action = e.nativeEvent.submitter?.value || 'focus_grant';
        setBusy(true); setError('');
        try { await requestPro({ action, userId: form.get('userId'), minutes: Number(form.get('minutes')) }); setRefresh(n => n + 1); }
        catch(e) { setError(e.message); } finally { setBusy(false); }
      }}><label>Participant account ID<input name="userId" required pattern="[0-9a-fA-F-]{36}" /></label><label>Minutes<input name="minutes" type="number" min="1" max="240" defaultValue="60" /></label><button disabled={busy} value="focus_grant">Grant temporary Pro</button><button disabled={busy} value="focus_revoke">End temporary Pro</button></form></details>}

    </>}
  </section>;
}
