import { useEffect, useRef, useState } from 'react';
import { haptic } from '../../utils/haptics.js';

// App-wide connection status (deep round 2). A native app tells you it lost
// the network once, in one place (a 4-second status, not a bar that stays), instead of each screen guessing: before
// this, Community showed a "Join Community" form and endless skeletons, the
// Shop's photos turned into broken-image icons, and only Ask ayna said
// "You're offline". iOS apps (Mail, Music, App Store) use a slim status line
// under the navigation bar; this is that, in ayna's ink.
//
// It also marks images that fail to load (data-broken) so a missing photo is
// an empty tile, never the browser's broken-image glyph. ProductImage keeps
// its own letter fallback; a later successful load clears the mark.
export default function OfflineBanner({ rootRef }) {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const [backOnline, setBackOnline] = useState(false);
  const [showOff, setShowOff] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  const timer = useRef(0);

  useEffect(() => {
    // Transient, like a toast (founder rule: nothing stays put on screen
    // while the page scrolls). It says it once, then the screens' own
    // offline states carry on (Community, Ask ayna, Startups).
    const goOff = () => {
      window.clearTimeout(timer.current);
      setBackOnline(false); setOnline(false); setShowOff(true); haptic('warning');
      timer.current = window.setTimeout(() => setShowOff(false), 4000);
    };
    const goOn = () => {
      setOnline(true);
      setShowOff(false);
      setBackOnline(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setBackOnline(false), 2400);
    };
    if (navigator.onLine === false) timer.current = window.setTimeout(() => setShowOff(false), 4000);
    window.addEventListener('offline', goOff);
    window.addEventListener('online', goOn);
    return () => { window.removeEventListener('offline', goOff); window.removeEventListener('online', goOn); window.clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    const root = rootRef?.current;
    if (!root) return undefined;
    const onError = (event) => { const t = event.target; if (t && t.tagName === 'IMG') t.setAttribute('data-broken', ''); };
    const onLoad = (event) => { const t = event.target; if (t && t.tagName === 'IMG' && t.hasAttribute('data-broken')) t.removeAttribute('data-broken'); };
    root.addEventListener('error', onError, true);
    root.addEventListener('load', onLoad, true);
    return () => { root.removeEventListener('error', onError, true); root.removeEventListener('load', onLoad, true); };
  }, [rootRef]);

  if (online ? !backOnline : !showOff) return null;
  return (
    <div className={`ay-net${online ? ' is-back' : ''}`} role="status" aria-live="polite">
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {online
          ? <path d="m5 12 5 5L20 7" />
          : <><path d="M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 10.7 5M5 12.6a10 10 0 0 1 3.4-2M19 12.6a10 10 0 0 0-2.3-1.6M8.6 16.4a5 5 0 0 1 5.4-.8" /><circle cx="12" cy="20" r=".6" fill="currentColor" /><path d="M3 3l18 18" /></>}
      </svg>
      <span>{online ? 'Back online' : 'You’re offline. Saved items still open.'}</span>
    </div>
  );
}
