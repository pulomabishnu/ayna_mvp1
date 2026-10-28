import { useEffect, useId, useRef, useState } from 'react';
import { marqueeLength, openProPaywall, proFeatureName, proLockLine, roundedPerimeter } from '../pro/paywall.js';
import SubscriptionPaywallModal from './SubscriptionPaywallModal.jsx';
import '../styles/pro-v4.css';

export function LockIcon({ size = 22 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="15.5" r="1.5" fill="currentColor" /></svg>;
}

/**
 * The brown and pink checker frame (founder, Oct 27 17:14: it should "keep moving around the shape").
 * One SVG rounded rect around the box: an espresso stroke with pink dashes the size of one square on
 * top, its dash offset running a full lap every ~16s, so the squares travel round the corners like a
 * marquee. Static with reduced motion. Measured with a ResizeObserver so the dashes never leave a seam.
 */
export function CheckerFrame({ className = '', square = 12, radius = 22, children }) {
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // The padding box (inside the 1.5px outline), where the ring sits.
    const measure = () => { const w = el.clientWidth, h = el.clientHeight; setBox((b) => (b && b.w === w && b.h === h ? b : { w, h })); };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  let svg = null;
  if (box && box.w > square * 2 && box.h > square * 2) {
    const w = box.w - square, h = box.h - square, r = Math.max(0, radius - 1.5 - square / 2);
    const length = marqueeLength(roundedPerimeter(w, h, r), square);
    const rect = { x: square / 2, y: square / 2, width: w, height: h, rx: r, ry: r, fill: 'none', strokeWidth: square };
    svg = <svg className="pro-frame__ring" width={box.w} height={box.h} aria-hidden="true" focusable="false">
      <rect {...rect} className="pro-frame__base" />
      <rect {...rect} className="pro-frame__dash" pathLength={length} strokeDasharray={`${square} ${square}`} style={{ '--pro-lap': `${length}px`, '--pro-dur': `${Math.max(40, Math.round(length / 10))}s` }} />
    </svg>;
  }
  return <div ref={ref} className={`pro-frame ${className}`.trim()} style={{ '--pro-sq': `${square}px`, '--pro-r': `${radius}px` }}>
    {svg}
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
    <CheckerFrame square={variant === 'inline' ? 8 : 12} radius={variant === 'inline' ? 18 : 22}>
      <div className="pro-lock__card">
        <span className="pro-lock__seal"><LockIcon size={variant === 'inline' ? 20 : 26} /></span>
        <div className="pro-lock__text">
          <p className="pro-lock__kicker">Get ayna Pro to unlock</p>
          <h2 id={`${uid}-t`} className="pro-lock__title">{name}</h2>
          {context && <p className="pro-lock__context">{context}</p>}
          <p className="pro-lock__line">{line || proLockLine(feature)}</p>
          {!native && ['dashboard', 'wearables'].includes(feature) && <div className="pro-lock__setup">
            <ol>
              <li><b>Download ayna on your iPhone</b><p>Install the beta through TestFlight.</p><a href="https://testflight.apple.com/join/f3C9PypD" target="_blank" rel="noopener noreferrer">Download on TestFlight ↗</a></li>
              <li><b>Get ayna Pro</b><p>Sign in with the same ayna account to unlock your dashboard and connect wearables and apps.</p></li>
            </ol>
            <p className="pro-lock__expiry">Cancel anytime. Access continues until your paid period ends, then the dashboard locks again.</p>
          </div>}
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
