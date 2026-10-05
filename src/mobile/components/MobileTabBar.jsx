const icons = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
  community: <><path d="M20 11.5a7.5 7.5 0 0 1-10.8 6.7L4 20l1.8-5.2A7.5 7.5 0 1 1 20 11.5Z" /><path d="M9 11h6M9 14h4" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
};

const tabs = [
  ['home', 'Home'],
  ['search', 'Search'],
  ['community', 'Community'],
  ['profile', 'Profile'],
];

export default function MobileTabBar({ active, onHome, onSearch, onCommunity, onProfile }) {
  const actions = { home: onHome, search: onSearch, community: onCommunity, profile: onProfile };
  return <nav className="ayna-bottom-nav" aria-label="Main navigation">
    {tabs.map(([key, label]) => <button type="button" key={key} className={active === key ? 'is-active' : ''} onClick={actions[key]} aria-current={active === key ? 'page' : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[key]}</svg>
      <span>{label}</span>
    </button>)}
  </nav>;
}
