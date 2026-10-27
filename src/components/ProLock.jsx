import { useId, useState } from 'react';
import { openProPaywall, proFeatureName, proLockLine } from '../pro/paywall.js';
import SubscriptionPaywallModal from './SubscriptionPaywallModal.jsx';
import '../styles/pro-v4.css';

export function LockIcon({ size = 22 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="15.5" r="1.5" fill="currentColor" /></svg>;
}

/** The brown and pink checker frame. Its four edges march clockwise, slowly; static with reduced motion. */
export function CheckerFrame({ className = '', children }) {
  return <div className={`pro-frame ${className}`.trim()}>
    <span className="pro-frame__edge is-top" aria-hidden="true" />
    <span className="pro-frame__edge is-right" aria-hidden="true" />
    <span className="pro-frame__edge is-bottom" aria-hidden="true" />
    <span className="pro-frame__edge is-left" aria-hidden="true" />
    <div className="pro-frame__inner">{children}</div>
  </div>;
}

/**
 * ayna's one locked state, used by every paywall: the checker frame, a lock,
 * "Get ayna Pro to unlock" with the feature's name, one strong button that
 * opens the Pro sheet, and a quiet "Not now".
 *
 *   variant="page"    a gated screen (Reads, appointment prep, wearables)
 *   variant="inline"  a limit she just hit (Ask ayna, playlists, ecosystem update)
 *
 * "Not now" calls onNotNow (usually Back); without one it folds the card into
 * a one-line reminder so the page stays usable.
 */
export default function ProLock({
  feature, title, context = '', line, variant = 'page', onNotNow, native = false,
  error = '', onRetry, children,
}) {
  const uid = useId();
  const [folded, setFolded] = useState(false);
  const [localSheet, setLocalSheet] = useState(false);
  const name = title || proFeatureName(feature);
  const unlock = () => {
    if (!openProPaywall({ feature, featureName: name })) setLocalSheet(true);
  };
  const sheet = localSheet && <SubscriptionPaywallModal feature={feature} featureName={name} onClose={() => setLocalSheet(false)} />;

  if (folded) {
    return <div className={`pro-lock-fold pro-lock-fold--${variant}`}>
      <span className="pro-lock-fold__icon"><LockIcon size={18} /></span>
      <span className="pro-lock-fold__text">{name} is part of ayna Pro</span>
      <button type="button" className="pro-lock-fold__go" onClick={unlock}>Get ayna Pro</button>
      {sheet}
    </div>;
  }

  return <section className={`pro-lock pro-lock--${variant}`} aria-labelledby={`${uid}-t`}>
    <CheckerFrame>
      <div className="pro-lock__card">
        <span className="pro-lock__seal"><LockIcon size={variant === 'inline' ? 20 : 26} /></span>
        <div className="pro-lock__text">
          <p className="pro-lock__kicker">Get ayna Pro to unlock</p>
          <h2 id={`${uid}-t`} className="pro-lock__title">{name}</h2>
          {context && <p className="pro-lock__context">{context}</p>}
          <p className="pro-lock__line">{line || proLockLine(feature)}</p>
          {children}
          {error && <p className="pro-lock__error" role="status">{error}{onRetry && <> <button type="button" className="pro-lock__retry" onClick={onRetry}>Check again</button></>}</p>}
        </div>
        <div className="pro-lock__actions">
          <button type="button" className="pro-lock__cta" onClick={unlock}>
            <LockIcon size={18} />Get ayna Pro
          </button>
          <button type="button" className="pro-lock__quiet" onClick={() => (onNotNow ? onNotNow() : setFolded(true))}>Not now</button>
          {native && <p className="pro-lock__fine">Already a Pro member? Sign in with the ayna account that has your membership.</p>}
        </div>
      </div>
    </CheckerFrame>
    {sheet}
  </section>;
}
