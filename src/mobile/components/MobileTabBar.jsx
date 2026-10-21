import { useEffect, useRef } from 'react';
import { MAIN_TABS, TabIcon } from '../../components/nav/tabs.jsx';

// One tab set for the app and the phone website (src/components/nav/tabs.jsx):
// Library · Shop · Ecosystem (centre) · Community · You.
const tabs = MAIN_TABS.map((t) => [t.key, t.label]);

export default function MobileTabBar({ active, onHome, onBrowse, onCommunity, onLibrary, onProfile }) {
  const actions = { library: onLibrary, home: onHome, browse: onBrowse, community: onCommunity, profile: onProfile };
  // No seam (founder, Oct 21): the bar is the page colour and shows its hairline
  // only while the screen's content runs on under it (iOS scroll-edge behaviour).
  const navRef = useRef(null);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof document.elementFromPoint !== 'function') return undefined;
    let frame = 0;
    const read = () => {
      frame = 0;
      const r = nav.getBoundingClientRect();
      let el = document.elementFromPoint(r.left + r.width / 2, r.top - 2);
      let over = false;
      while (el && el !== document.body) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) { over = el.scrollTop + el.clientHeight < el.scrollHeight - 2; break; }
        el = el.parentElement;
      }
      nav.classList.toggle('is-over', over);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(read); };
    schedule();
    const t = window.setTimeout(schedule, 600);
    document.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      document.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      window.clearTimeout(t);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [active]);
  return <nav ref={navRef} className="ayna-bottom-nav" aria-label="Main navigation">
    {tabs.map(([key, label]) => <button type="button" key={key} className={`${active === key ? 'is-active' : ''}${key === 'home' ? ' is-center' : ''}`} onClick={actions[key]} aria-current={active === key ? 'page' : undefined} data-tab-target={key}>
      {key === 'home' ? <span className="ay-nav-center" aria-hidden="true"><TabIcon kind={key} on={active === key} /></span> : <TabIcon kind={key} on={active === key} />}
      <span>{label}</span>
    </button>)}
  </nav>;
}
