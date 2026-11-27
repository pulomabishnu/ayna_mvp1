import { useState } from 'react';
import { PRO_ICONS } from './ProStory.jsx';

// The iPhone Pro screen's three lines (founder pick, Nov 27). Only what Pro does today.
export const APP_PRO_LINES = [
  { id: 'dashboard', icon: 'dash', t: 'See how your cycle, sleep and steps connect' },
  { id: 'connect', icon: 'watch', t: 'Link your health apps for smarter matches' },
  { id: 'ask', icon: 'chat', t: '50 Ask ayna chats a month (10x free)' },
];
import { buyWithApple, freeTrialDays, introLine, perPeriod, restoreApplePurchases, useAppleProducts } from '../../pro/appleIap.js';
import { scheduleAppleTrialReminder } from '../../pro/trialNotices.js';
import { announceProChanged } from '../../pro/paywall.js';

const TERMS_URL = 'https://www.aynahealth.co/terms-of-use';
const PRIVACY_URL = 'https://www.aynahealth.co/privacy-policy';
const APPLE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

/**
 * ayna Pro in the iPhone app, sold with Apple in-app purchase (App Review 3.1.1, Nov 25).
 * Everything Apple asks a subscription screen to show (3.1.2(c) and Schedule 2): the name, the
 * length, the price per period, that it renews automatically, how to cancel, Restore purchases,
 * and links to the Terms and the Privacy Policy. Prices come from Apple, in her currency.
 */
export default function ApplePaywallSheet({ titleId, unlocking, signedOut, onSignIn, onClose, feature, track }) {
  const { status, products } = useAppleProducts(true);
  const [plan, setPlan] = useState('year');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const chosen = products[plan] || products.year || products.month || null;
  const plans = ['year', 'month'].map((id) => products[id]).filter(Boolean);

  const buy = async () => {
    if (busy || !chosen) return;
    setBusy('buy'); setError(''); setNote('');
    track?.('pro_checkout_started', { plan: chosen.plan, store: 'apple' });
    try {
      const out = await buyWithApple(chosen.plan);
      if (out === 'success') {
        const days = freeTrialDays(chosen);
        track?.(days ? 'pro_trial_started' : 'pro_purchase_completed', { plan: chosen.plan, store: 'apple', ...(days ? { source: feature || 'paywall' } : {}) });
        if (days) scheduleAppleTrialReminder(days, perPeriod(chosen));
        setNote(days ? 'Your free trial has started. Cancel anytime in Profile › Settings › Manage subscription.' : 'You’re Pro. Thank you.');
        window.setTimeout(onClose, days ? 2400 : 1200);
      }
      else if (out === 'pending') setNote('Your purchase is waiting for approval. Pro unlocks as soon as it goes through.');
    } catch (e) {
      if (e?.code === 'sign_in_required') { onSignIn?.(); return; }
      track?.('pro_checkout_failed', { plan: chosen.plan, store: 'apple', error_code: e?.code || 'unknown' });
      // Charged but not saved yet: say so (Apple redelivers it; Restore purchases also works). Anything else: nothing was charged.
      setError(e?.code === 'verify_failed' ? e.message : 'The purchase didn’t go through. Nothing was charged.');
    } finally { setBusy(''); }
  };

  const restore = async () => {
    if (busy) return;
    setBusy('restore'); setError(''); setNote('');
    try {
      const out = await restoreApplePurchases();
      if (out.restored) { announceProChanged(); setNote('Restored. ayna Pro is on.'); window.setTimeout(onClose, 1200); }
      else setNote(out.otherAccount ? 'This Apple ID’s ayna Pro belongs to a different ayna account. Sign in with that account to use it.' : 'No active ayna Pro subscription was found for this Apple ID.');
    } catch (e) { setError(e?.message || 'Couldn’t restore right now. Try again in a minute.'); }
    finally { setBusy(''); }
  };

  const intro = introLine(chosen);
  const price = perPeriod(chosen);
  const period = chosen?.periodUnit || 'period';
  // Nov 27: the free trial is Apple's intro offer on each plan; the main button starts it. 3.1.2(c): the billed amount
  // stays the most prominent price (the button and the big number), the trial is the smaller line.
  const trialDays = freeTrialDays(chosen);

  return (
    <>
      <header className="pro-sheet__head">
        <span className="pro-sheet__grab" aria-hidden="true" />
        <button type="button" className="pro-sheet__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <h2 id={titleId} className="pro-sheet__title">Get ayna <em>Pro</em></h2>
        {unlocking && <p className="pro-sheet__lede">Unlock <b>{unlocking}</b>.</p>}
      </header>
      <div className="pro-sheet__body">
        <ul className="pro-app__feats" aria-label="What ayna Pro adds">
          {/* Nov 27 (founder: "we need people to buy"): three lines that say what she gets. */}
          {APP_PRO_LINES.map((f) => (
            <li key={f.id}><span className="pro-app__icon" aria-hidden="true"><svg viewBox="0 0 24 24">{PRO_ICONS[f.icon]}</svg></span>{f.t}</li>
          ))}
        </ul>

        {status === 'loading' && <p className="pro-sheet__billing" role="status">Loading prices…</p>}
        {(status === 'error' || status === 'empty') && <p className="pro-sheet__error" role="alert">ayna Pro isn’t available to buy right now. Try again later.</p>}
        {plans.length > 0 && (
          <div className="pro-sheet__plans" role="radiogroup" aria-label="Choose a plan">
            {plans.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={chosen?.id === p.id} className={`pro-plan${chosen?.id === p.id ? ' is-on' : ''}`} disabled={Boolean(busy)} onClick={() => setPlan(p.plan)}>
                <span className="pro-plan__top"><span className="pro-plan__dot" aria-hidden="true" /><span className="pro-plan__label">{p.plan === 'year' ? 'Yearly' : 'Monthly'}</span></span>
                <span className="pro-plan__amount"><strong className="pro-plan__price">{p.displayPrice}</strong><span className="pro-plan__per">/{p.periodUnit === 'year' ? 'year' : 'month'}</span></span>
                {introLine(p) && <span className="pro-plan__sub">{introLine(p)}</span>}
              </button>
            ))}
          </div>
        )}

        {error && <p className="pro-sheet__error" role="alert">{error}</p>}
        {note && <p className="pro-sheet__billing" role="status">{note}</p>}

        {signedOut
          ? <button type="button" className="pro-sheet__cta" onClick={onSignIn}>Sign in to get ayna Pro</button>
          : <button type="button" className="pro-sheet__cta" disabled={!chosen || Boolean(busy)} aria-busy={busy === 'buy' ? 'true' : undefined} onClick={buy}>{busy === 'buy' ? 'Opening the App Store…' : chosen ? `Subscribe · ${trialDays ? price : intro || price}` : 'Subscribe'}</button>}

        {chosen && (
          <p className="pro-sheet__billing pro-app__fine">
            {/* Everything Apple requires (3.1.2): length, price, renewal, how to cancel. As short as it can be (Nov 26). */}
            ayna Pro {chosen.plan === 'year' ? 'Yearly' : 'Monthly'}: {trialDays ? `${price} after a ${trialDays}-day free trial` : intro ? `${intro}, then ${price}` : price}, charged to your Apple ID. Renews automatically unless canceled at least 24 hours before the {trialDays ? 'trial' : period} ends{trialDays ? '; cancel before then and you pay nothing' : ''}. Cancel anytime in Settings › Subscriptions.
          </p>
        )}
        <p className="pro-sheet__billing pro-app__fine">
          <a href={TERMS_URL} target="_blank" rel="noopener noreferrer">Terms of Use</a> · <a href={APPLE_EULA_URL} target="_blank" rel="noopener noreferrer">Apple’s EULA</a> · <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        </p>
        <div className="pro-app__row">
          {!signedOut && <button type="button" className="pro-app__link" onClick={restore} disabled={Boolean(busy)}>{busy === 'restore' ? 'Restoring…' : 'Restore purchases'}</button>}
          <button type="button" className="pro-app__link" onClick={onClose}>Not now</button>
        </div>
      </div>
    </>
  );
}
