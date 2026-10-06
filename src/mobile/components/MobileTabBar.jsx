const icons = {
  home: <><circle cx="12" cy="11.5" r="3" /><circle cx="5" cy="5.5" r="2" /><circle cx="19" cy="5.5" r="2" /><circle cx="12" cy="19" r="2" /><path d="m6.6 6.9 3.1 2.7m7.7-2.7-3.1 2.7M12 14.5V17" /></>,
  browse: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
  community: <><path d="M20 11.5a7.5 7.5 0 0 1-10.8 6.7L4 20l1.8-5.2A7.5 7.5 0 1 1 20 11.5Z" /><path d="M9 11h6M9 14h4" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
};

const tabs = [
  ['home', 'Ecosystem'],
  ['browse', 'Browse'],
  ['community', 'Community'],
  ['profile', 'Profile'],
];

export default function MobileTabBar({ active, hasEcosystem = false, onHome, onBrowse, onCommunity, onProfile }) {
  const actions = { home: onHome, browse: onBrowse, community: onCommunity, profile: onProfile };
  return <nav className="ayna-bottom-nav" aria-label="Main navigation">
    {tabs.map(([key, label]) => <button type="button" key={key} className={active === key ? 'is-active' : ''} onClick={actions[key]} aria-current={active === key ? 'page' : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[key]}</svg>
      <span>{key === 'home' && hasEcosystem ? 'My Ecosystem' : label}</span>
    </button>)}
  </nav>;
}
