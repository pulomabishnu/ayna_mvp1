// Order agreed Oct 11: Library · Shop · Ecosystem (centre, raised) · Community · You
const tabs = [
  ['library', 'Library'],
  ['browse', 'Shop'],
  ['home', 'Ecosystem'],
  ['community', 'Community'],
  ['profile', 'You'],
];

function TabIcon({ kind }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (kind === 'library') return <svg {...common}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z" /><path d="M7 8h1.5M16 8h1.5" /></svg>;
  if (kind === 'home') return <svg {...common}><circle cx="12" cy="13" r="3" /><circle cx="12" cy="4.5" r="1.8" /><circle cx="5" cy="18" r="1.8" /><circle cx="19" cy="18" r="1.8" /><path d="M12 10V6.3M9.5 14.6l-3 2.2M14.5 14.6l3 2.2" /></svg>;
  if (kind === 'browse') return <svg {...common}><path d="M4 8h16l-1 12H5L4 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
  if (kind === 'community') return <svg {...common}><path d="M4 5h16v11H9l-5 4V5Z" /><path d="M8 10h8m-8 3h5" /></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="3.3" /><path d="M5 20c0-3.3 2.8-5.5 7-5.5s7 2.2 7 5.5" /></svg>;
}

export default function MobileTabBar({ active, onHome, onBrowse, onCommunity, onLibrary, onProfile }) {
  const actions = { library: onLibrary, home: onHome, browse: onBrowse, community: onCommunity, profile: onProfile };
  return <nav className="ayna-bottom-nav" aria-label="Main navigation">
    {tabs.map(([key, label]) => <button type="button" key={key} className={`${active === key ? 'is-active' : ''}${key === 'home' ? ' is-center' : ''}`} onClick={actions[key]} aria-label={label} aria-current={active === key ? 'page' : undefined}>
      {key === 'home' ? <span className="ay-nav-center" aria-hidden="true"><TabIcon kind={key} /></span> : <TabIcon kind={key} />}
      <span>{label}</span>
    </button>)}
  </nav>;
}
