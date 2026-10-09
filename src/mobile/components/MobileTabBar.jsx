const tabs = [
  ['home', 'Home'],
  ['browse', 'Shop'],
  ['community', 'Community'],
  ['ask', 'Ask'],
  ['profile', 'Me'],
];

function TabIcon({ kind }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (kind === 'home') return <svg {...common}><path d="M3 20h18M5 17V7h14v10M5 10h14M9 7V4h6v3" /><path d="M8 13h3v4H8m5-4h3v4h-3" /></svg>;
  if (kind === 'browse') return <svg {...common}><path d="M4 8h16l-1 12H5L4 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
  if (kind === 'community') return <svg {...common}><path d="M4 5h16v11H9l-5 4V5Z" /><path d="M8 10h8m-8 3h5" /></svg>;
  if (kind === 'ask') return <svg {...common}><path d="M4 5h16v12H9l-5 3V5Z" /><path d="M10 10a2 2 0 1 1 3.4 1.4c-.9.6-1.4 1-1.4 2.1m0 2h.01" /></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="3.3" /><path d="M5 20c0-3.3 2.8-5.5 7-5.5s7 2.2 7 5.5" /></svg>;
}

export default function MobileTabBar({ active, onHome, onBrowse, onCommunity, onAskAyna, onProfile }) {
  const actions = { home: onHome, browse: onBrowse, community: onCommunity, ask: onAskAyna, profile: onProfile };
  return <nav className="ayna-bottom-nav" aria-label="Main navigation">
    {tabs.map(([key, label]) => <button type="button" key={key} className={active === key ? 'is-active' : ''} onClick={actions[key]} aria-label={key === 'ask' ? 'Ask ayna' : label} aria-current={active === key ? 'page' : undefined}>
      <TabIcon kind={key} />
      <span>{label}</span>
    </button>)}
  </nav>;
}
