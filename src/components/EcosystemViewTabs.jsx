import { useEffect, useRef, useState } from 'react';
import '../styles/eco-view-tabs.css';

/**
 * Website Ecosystem: a "Products | Dashboard" switch at the top of the page,
 * the same two views the app's Ecosystem screen has. Products is the page as
 * it was; Dashboard is the website health dashboard (WebHealth, passed in so
 * it is the same component /health renders). The choice lives in the URL
 * (?view=dashboard) so a link can open the dashboard directly.
 */
const TABS = [['products', 'Products'], ['dashboard', 'Dashboard']];

function readEcoView() {
  try { return new URLSearchParams(window.location.search).get('view') === 'dashboard' ? 'dashboard' : 'products'; } catch { return 'products'; }
}

export default function EcosystemViewTabs({ dashboard, children }) {
  const [view, setView] = useState(readEcoView);
  const tabRefs = useRef({});

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

  return (
    <>
      <div className="ay-ecoview">
        <div className="ay-ecoview__tabs" role="tablist" aria-label="Ecosystem view" onKeyDown={onKeyDown}>
          {TABS.map(([id, label]) => (
            <button
              key={id}
              ref={(el) => { tabRefs.current[id] = el; }}
              type="button"
              role="tab"
              id={`ay-ecoview-tab-${id}`}
              aria-selected={view === id}
              aria-controls="ay-ecoview-panel"
              tabIndex={view === id ? 0 : -1}
              className={view === id ? 'is-on' : undefined}
              onClick={() => choose(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div id="ay-ecoview-panel" className="ay-ecoview__panel" role="tabpanel" aria-labelledby={`ay-ecoview-tab-${view}`}>
        {view === 'dashboard' ? dashboard : children}
      </div>
    </>
  );
}
