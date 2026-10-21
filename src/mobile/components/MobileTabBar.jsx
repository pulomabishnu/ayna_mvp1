import { MAIN_TABS, TabIcon } from '../../components/nav/tabs.jsx';

// One tab set for the app and the phone website (src/components/nav/tabs.jsx):
// Library · Shop · Ecosystem (centre) · Community · You.
const tabs = MAIN_TABS.map((t) => [t.key, t.label]);

export default function MobileTabBar({ active, onHome, onBrowse, onCommunity, onLibrary, onProfile }) {
  const actions = { library: onLibrary, home: onHome, browse: onBrowse, community: onCommunity, profile: onProfile };
  return <nav className="ayna-bottom-nav" aria-label="Main navigation">
    {tabs.map(([key, label]) => <button type="button" key={key} className={`${active === key ? 'is-active' : ''}${key === 'home' ? ' is-center' : ''}`} onClick={actions[key]} aria-current={active === key ? 'page' : undefined} data-tab-target={key}>
      {key === 'home' ? <span className="ay-nav-center" aria-hidden="true"><TabIcon kind={key} on={active === key} /></span> : <TabIcon kind={key} on={active === key} />}
      <span>{label}</span>
    </button>)}
  </nav>;
}
