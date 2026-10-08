const paths = {
  home: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1Z',
  explore: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.5 5.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z',
  community: 'M5 5h14v10H9l-4 4V5Z',
  ecosystem: 'M12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm14 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM8 15l2.2-4M16 15l-2.2-4',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0',
};

function NavIcon({ type, active }) {
  const d = paths[type];
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={type === 'explore' && active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function BottomNav({ active, onHome, onExplore, onCommunity, onEcosystem, onProfile }) {
  const items = [
    ['home', 'Home', onHome],
    ['explore', 'Explore', onExplore],
    ['community', 'Community', onCommunity],
    ['ecosystem', 'Ecosystem', onEcosystem],
    ['profile', 'Profile', onProfile],
  ];
  return (
    <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, padding: '7px 10px max(8px, env(safe-area-inset-bottom))', background: 'rgba(255,252,249,.97)', borderTop: '1px solid var(--ayna-border)', backdropFilter: 'blur(16px)', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
      {items.map(([key, label, onClick]) => {
        const isActive = active === key;
        return (
          <button key={key} type="button" onClick={onClick} style={{ border: 0, background: 'transparent', minHeight: 49, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: isActive ? 'var(--ayna-deep-space)' : 'var(--ayna-text-faint)', fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', fontWeight: isActive ? 750 : 600, cursor: 'pointer' }}>
            <NavIcon type={key} active={isActive} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
