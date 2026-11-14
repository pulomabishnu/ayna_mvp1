import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { haptic } from '../../utils/haptics.js';
import './app-splash.css';

/**
 * The opening moment of the iPhone app (Notion AYNA-346, "Add splash screen to app before releasing it").
 * The native launch screen (butter with the pink-shadowed "a", ios/App/App/Assets.xcassets/Splash) hands
 * over to this: the same "a" settles onto its pink shadow with one light buzz, "ayna" writes out beside
 * it, and the layer fades into the app. About 1.3 seconds, once per cold start, never on the website.
 * Reduced motion: no movement, a short fade. Tapping skips it.
 */
const SEEN_KEY = 'ayna_splash_session';

export function shouldShowSplash() {
  if (typeof window === 'undefined') return false;
  const native = Boolean(window.Capacitor?.isNativePlatform?.());
  const forced = /[?&]splash=1\b/.test(window.location?.search || '');
  if (!native && !forced) return false;
  try { if (!forced && sessionStorage.getItem(SEEN_KEY)) return false; sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode: show it */ }
  return true;
}

export default function AppSplash({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  // The "a" starts centred, where the launch screen left it, and moves over as "yna" writes out.
  const restRef = useRef(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => { setShift((restRef.current?.offsetWidth || 0) / 2); }, []);
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const buzz = reduced ? null : window.setTimeout(() => haptic('light'), 380);
    const out = window.setTimeout(() => setLeaving(true), reduced ? 350 : 1050);
    const done = window.setTimeout(() => onDone?.(), reduced ? 550 : 1350);
    return () => { if (buzz) window.clearTimeout(buzz); window.clearTimeout(out); window.clearTimeout(done); };
  }, [onDone]);
  return (
    <div className={`ay-splash${leaving ? ' is-leaving' : ''}`} role="presentation" aria-hidden="true" onClick={() => onDone?.()}>
      <div className="ay-splash__mark" style={{ '--shift': `${shift}px` }}>
        <span className="ay-splash__a">
          <span className="ay-splash__shadow">a</span>
          <span className="ay-splash__ink">a</span>
        </span>
        <span ref={restRef} className="ay-splash__rest">yna</span>
      </div>
    </div>
  );
}
