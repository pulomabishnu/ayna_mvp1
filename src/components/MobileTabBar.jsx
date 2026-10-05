import React from 'react';
import './mobileTabBar.css';

const icon = (d) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
);

const ITEMS = [
  { key: 'home', label: 'home', icon: icon('M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z') },
  { key: 'browse', label: 'browse', icon: icon('M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4-4') },
  { key: 'community', label: 'community', icon: icon('M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z') },
  { key: 'ecosystem', label: 'ecosystem', icon: icon('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z') },
];

/**
 * App-style bottom navigation for phones (hidden ≥721px, where the top nav
 * shows these links). Same four destinations as the desktop nav + logo.
 */
export default function MobileTabBar({ active, onSelect, badges = {} }) {
  return (
    <nav className="ayna-tabbar" aria-label="Main">
      {ITEMS.map((item) => {
        const on = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            className={on ? 'is-active' : ''}
            aria-current={on ? 'page' : undefined}
            onClick={() => onSelect(item.key)}
          >
            <span className="ayna-tabbar__icon">
              {item.icon}
              {badges[item.key] ? <span className="ayna-tabbar__dot" aria-label="new" /> : null}
            </span>
            <span className="ayna-tabbar__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
