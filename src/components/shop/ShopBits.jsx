import { useRef } from 'react';
import { needStickers } from './shopNeeds.js';
import './shop-bits.css';

/* Shop by need: die-cut photo stickers (a real product for each need, white
   die-cut border, thin espresso outline, a small tilt). Tapping one searches
   the Shop for that need. Board: Bordeaux stickers + Feel Fits need tiles,
   rebuilt as ayna paper stickers. */
export function NeedStickers({ active = '', onPick, className = '' }) {
  const stickers = needStickers();
  if (!stickers.length) return null;
  return (
    <ul className={`ay-needstickers ${className}`} aria-label="Shop by need">
      {stickers.map((n, i) => (
        <li key={n.id} style={{ '--tilt': `${[-3, 2, -1.5, 3, -2.5, 1.5, -2, 2.5][i % 8]}deg` }}>
          <button type="button" className="ay-needsticker" aria-pressed={active.toLowerCase() === n.query.toLowerCase()} onClick={() => onPick?.(n.query)}>
            <span className="ay-needsticker__die"><img src={n.image} alt="" width="160" height="160" loading="lazy" decoding="async" /></span>
            <span className="ay-needsticker__label">{n.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* Folder tabs for the Shop's areas: one row of file-folder tabs standing on a
   rule, the selected one raised in pink with a product peeking out of it.
   Tabs pattern (WAI-ARIA APG): arrow keys move, Home/End jump, the grid below
   is the panel. */
export function FolderTabs({ tabs, active, onSelect, label = 'Areas', photoFor, panelId }) {
  const listRef = useRef(null);
  const onKey = (e) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === active);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onSelect(tabs[next].id);
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-tab="${tabs[next].id}"]`)?.focus());
  };
  return (
    <div className="ay-folders" role="tablist" aria-label={label} ref={listRef} onKeyDown={onKey}>
      {tabs.map((t, i) => {
        const on = t.id === active;
        const photo = on ? photoFor?.(t.id) : '';
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            data-tab={t.id}
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
            className={`ay-folder-tab is-${['butter', 'sky', 'pink'][i % 3]}${on ? ' is-on' : ''}`}
            onClick={() => onSelect(t.id)}
          >
            {photo && <span className="ay-folder-tab__peek" aria-hidden="true"><img src={photo} alt="" width="56" height="56" decoding="async" /></span>}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ⌘K / Ctrl K hint inside a search field, only on devices with a keyboard
   and a fine pointer, hidden while typing or focused. */
export function KbdHint({ hidden }) {
  if (hidden) return null;
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  return <kbd className="ay-kbd ay-kbd--field" aria-hidden="true">{mac ? '⌘K' : 'Ctrl K'}</kbd>;
}
