import { useEffect, useRef, useState } from 'react';
import '../styles/eco-view-tabs.css';
import '../styles/eco-page.css';
import '../styles/ecosystem-best.css';
import { useSlidingInk } from './eco/ecoMotion';

/**
 * Website Ecosystem: a "Products | Dashboard" switch at the top of the page,
 * the same two views the app's Ecosystem screen has. Products is the page as
 * it was; Dashboard is the website health dashboard (WebHealth, passed in so
 * it is the same component /health renders). The choice lives in the URL
 * (?view=dashboard) so a link can open the dashboard directly.
 * onHero: the Products view opens with the espresso hero (signed in with
 * shelves), so the switch sits on that hero's background.
 */
const TABS = [['products', 'Products'], ['dashboard', 'Dashboard']];

function readEcoView() {
  try { return new URLSearchParams(window.location.search).get('view') === 'dashboard' ? 'dashboard' : 'products'; } catch { return 'products'; }
}

export default function EcosystemViewTabs({ dashboard, onHero = false, children }) {
  const [view, setView] = useState(readEcoView);
  const tabRefs = useRef({});
  const listRef = useRef(null);
  const ink = useSlidingInk(listRef, view);

  // Back/Forward onto /ecosystem?view=… shows the matching view.
  useEffect(() => {
    const onPop = () => setView(readEcoView());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const choose = (id, { focus = false } = {}) => {
    setView(id);
    try {
      const url = new URL(window.location.href);
      if (id === 'dashboard') url.searchParams.set('view', 'dashboard');
      else url.searchParams.delete('view');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* history unavailable: the view still switches */ }
    if (focus) tabRefs.current[id]?.focus();
  };

  // Arrow keys, Home and End move between the two tabs (WAI-ARIA tabs pattern).
  const onKeyDown = (e) => {
    const i = TABS.findIndex(([id]) => id === view);
    const next = { ArrowRight: (i + 1) % TABS.length, ArrowLeft: (i - 1 + TABS.length) % TABS.length, Home: 0, End: TABS.length - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    choose(TABS[next][0], { focus: true });
  };

  // No dashboard passed: My ecosystem under You (Today is its own tab now), so
  // the page is the products view alone, under its awning, with no switch.
  if (!dashboard) {
    return (
      <>
        <div className="eco-awning" aria-hidden="true" />
        <div className="ay-ecoview2__panel">{children}</div>
      </>
    );
  }

  return (
    <>
      {/* Over the Products hero the strip takes the hero's espresso, so the
          switch reads as the top of that block rather than a band above it. */}
      {/* The striped awning: the Ecosystem's own top band (sky and butter, scalloped). */}
      <div className="eco-awning" aria-hidden="true" />
      <div className={`ay-container ay-tabs ay-ecoview2${onHero && view === 'products' ? ' is-onhero' : ''}`}>
        <div className="ay-tabs__list eco-inklist" role="tablist" aria-label="Ecosystem view" onKeyDown={onKeyDown} ref={listRef}>
          <span className="eco-ink" aria-hidden="true" style={ink} />
          {TABS.map(([id, label]) => (
            <button
              key={id}
              ref={(el) => { tabRefs.current[id] = el; }}
              type="button"
              role="tab"
              id={`ay-ecoview-tab-${id}`}
              aria-selected={view === id}
              data-ink-on={view === id ? 'true' : undefined}
              aria-controls="ay-ecoview-panel"
              tabIndex={view === id ? 0 : -1}
              className={`ay-tabs__tab${view === id ? ' is-on' : ''}`}
              onClick={() => choose(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div id="ay-ecoview-panel" className="ay-ecoview2__panel" role="tabpanel" aria-labelledby={`ay-ecoview-tab-${view}`}>
        {view === 'dashboard' ? dashboard : children}
      </div>
    </>
  );
}
