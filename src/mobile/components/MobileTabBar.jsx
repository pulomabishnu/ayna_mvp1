import { useEffect, useRef } from 'react';
import { APP_TABS, TabIcon } from '../../components/nav/tabs.jsx';
import '../../styles/home-tab.css';

// The app's tabs, the same five as the website (founder, Oct 26):
// Today · Shop · Services · Community · Library. Ask ayna and You are in the header.
const toRows = (list) => list.map((t) => [t.key, t.label, !!t.center, t.icon || t.key]);

// `tabList`: the chat-first Home (focus group) names the centre tab "ayna".
export default function MobileTabBar({ active, onExplore, onHome, onAsk, onCommunity, onProfile, onServices, onLibrary, tabList = APP_TABS }) {
  const tabs = toRows(tabList);
  const actions = { explore: onExplore, home: onHome, ask: onAsk, community: onCommunity, profile: onProfile, services: onServices, library: onLibrary };
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
  return <nav ref={navRef} className={`ayna-bottom-nav is-${tabs.length}-tabs`} aria-label="Main navigation">
    {tabs.map(([key, label, center, icon]) => <button type="button" key={key} className={`${active === key ? 'is-active' : ''}${center ? ' is-center' : ''}`} onClick={actions[key]} aria-current={active === key ? 'page' : undefined} data-tab-target={key}>
      {center ? <span className="ay-nav-center" aria-hidden="true"><TabIcon kind={icon} on={active === key} /></span> : <TabIcon kind={icon} on={active === key} />}
      <span>{label}</span>
    </button>)}
  </nav>;
}
