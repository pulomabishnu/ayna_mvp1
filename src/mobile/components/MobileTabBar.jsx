const tabs = [
  ['home', 'Ecosystem'],
  ['browse', 'Discover'],
  ['community', 'Community'],
  ['ask', 'Ask'],
  ['profile', 'You'],
];

export default function MobileTabBar({ active, onHome, onBrowse, onCommunity, onAskAyna, onProfile }) {
  const actions = { home: onHome, browse: onBrowse, community: onCommunity, ask: onAskAyna, profile: onProfile };
  return <nav className="ayna-bottom-nav" aria-label="Main navigation">
    {tabs.map(([key, label]) => <button type="button" key={key} className={active === key ? 'is-active' : ''} onClick={actions[key]} aria-label={key === 'ask' ? 'Ask ayna' : label} aria-current={active === key ? 'page' : undefined}>
      <span>{label}</span>
    </button>)}
  </nav>;
}
