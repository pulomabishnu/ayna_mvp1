import { useCallback, useRef } from 'react';
import { PILL_TABS_MAX } from './pillTabs.js';
import './ay-primitives.css';


/**
 * PillTabs: the product page's pill tab style for every sub-page (all-pages
 * brief): a butter-deep track with a 1.5px ink outline, the selected tab in
 * espresso. At most 5 short labels in equal columns, so it never scrolls
 * sideways on a phone. Arrow keys move, Home and End jump.
 *
 *   <PillTabs idBase="you" label="You" tabs={[{ id: 'eco', label: 'Ecosystem' }, ...]} active={tab} onChange={setTab} />
 *   <div {...pillPanelProps('you', 'eco', tab)}>...</div>   (pillTabs.js)
 *
 * `href` on a tab renders a link (website sub-pages); the tab is still a tab.
 */
export default function PillTabs({ tabs = [], active, onChange, label, labelId, idBase = 'ayk', className = '' }) {
  const listRef = useRef(null);
  const list = tabs.slice(0, PILL_TABS_MAX);
  if (import.meta.env?.DEV && tabs.length > PILL_TABS_MAX) console.warn(`PillTabs: ${tabs.length} tabs; the brief allows ${PILL_TABS_MAX}.`);
  const choose = useCallback((id, focus = false) => {
    onChange?.(id);
    if (focus) window.requestAnimationFrame(() => listRef.current?.querySelector(`[data-tab="${id}"]`)?.focus());
  }, [onChange]);
  const onKeyDown = (e) => {
    const i = list.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % list.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + list.length) % list.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = list.length - 1;
    if (next < 0) return;
    e.preventDefault();
    choose(list[next].id, true);
  };
  return (
    <div
      ref={listRef}
      className={`ayk-tabs ${className}`.trim()}
      role="tablist"
      aria-label={labelId ? undefined : label}
      aria-labelledby={labelId}
      style={{ '--ayk-tabs-n': list.length }}
      onKeyDown={onKeyDown}
    >
      {list.map((t) => {
        const on = t.id === active;
        const props = {
          key: t.id,
          role: 'tab',
          id: `${idBase}-tab-${t.id}`,
          'data-tab': t.id,
          'aria-selected': on,
          'aria-controls': t.href ? undefined : `${idBase}-panel-${t.id}`,
          tabIndex: on ? 0 : -1,
          className: `ayk-tabs__tab${on ? ' is-on' : ''}`,
        };
        const body = <>{t.label}{t.count > 0 && <span className="ayk-tabs__count">{t.count}</span>}</>;
        return t.href
          ? <a {...props} href={t.href} onClick={(e) => { if (onChange) { e.preventDefault(); choose(t.id); } }}>{body}</a>
          : <button {...props} type="button" onClick={() => choose(t.id)}>{body}</button>;
      })}
    </div>
  );
}
