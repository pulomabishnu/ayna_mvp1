import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductTileImage, { ProductImageFallback } from '../ProductTileImage';
import { formatPrice, shownPriceText } from '../../utils/formatPrice';
import { brandOf } from '../../mobile/data/brandFallback.js';
import { displayName } from '../../mobile/utils/displayName.js';

/* "Your shelves" as a vanity of drawers. Each area of care is a drawer:
   closed it shows its label, count and a peek of what's inside; pulled open
   it shows the products lined up small, and tapping one opens a little
   tray with its details and actions. Nothing here is decorative data:
   every product, price and count comes from her ecosystem. */
const STORE = 'ayna.drawers.v1';
function loadCustom() {
  try { const v = JSON.parse(window.localStorage.getItem(STORE) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
function saveCustom(v) {
  try { window.localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* private mode: keep it for this visit only */ }
}
// Brand colours only, plain or as a simple pattern.
const DRAWER_PAINTS = [
  { id: 'butter', label: 'Butter', bg: '#ffedac' },
  { id: 'rose', label: 'Rose', bg: '#f7badd' },
  { id: 'sky', label: 'Sky', bg: '#769ebe' },
  { id: 'stripe', label: 'Rose stripes', bg: 'repeating-linear-gradient(90deg, #f7badd 0 14px, #ffedac 14px 28px)' },
  { id: 'gingham', label: 'Sky gingham', bg: 'repeating-linear-gradient(0deg, rgba(118,158,190,.45) 0 12px, transparent 12px 24px), repeating-linear-gradient(90deg, rgba(118,158,190,.45) 0 12px, transparent 12px 24px), #ffedac' },
  { id: 'dots', label: 'Rose dots', bg: 'radial-gradient(circle, #f7badd 0 3.5px, transparent 4px) 0 0 / 16px 16px, #ffedac' },
];

export default function ShelfDrawers({ groups, toneOf, onOpenProduct, onToggleProduct, onAddMore }) {
  const [open, setOpen] = useState(() => new Set(groups.slice(0, 1).map((g) => g.key)));
  const [picked, setPicked] = useState({});
  const [custom, setCustom] = useState(loadCustom);
  const [editing, setEditing] = useState(null);
  const [painting, setPainting] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const drag = useRef(null);
  const caseRef = useRef(null);
  // The pencil and palette sit right after each drawer's name.
  useEffect(() => {
    const place = () => {
      const root = caseRef.current;
      if (!root) return;
      root.querySelectorAll('.ay-drawer').forEach((sec) => {
        const lab = sec.querySelector('.ay-drawer__label');
        if (!lab) return;
        const end = lab.getBoundingClientRect().right - sec.getBoundingClientRect().left + 8;
        sec.style.setProperty('--name-end', `${Math.round(end)}px`);
      });
    };
    place();
    const t = window.setTimeout(place, 600);
    window.addEventListener('resize', place);
    return () => { window.clearTimeout(t); window.removeEventListener('resize', place); };
  });
  const update = (fn) => setCustom((prev) => { const next = fn(prev); saveCustom(next); return next; });
  // Her arrangement: products she moved, the drawer order she chose.
  const arranged = useMemo(() => {
    const keys = new Set(groups.map((g) => g.key));
    const moves = custom.moves || {};
    const buckets = new Map(groups.map((g) => [g.key, { ...g, products: [] }]));
    groups.forEach((g) => g.products.forEach((p) => {
      const to = moves[p.id] && keys.has(moves[p.id]) ? moves[p.id] : g.key;
      buckets.get(to).products.push(p);
    }));
    const order = (custom.order || []).filter((k) => keys.has(k));
    const rest = groups.map((g) => g.key).filter((k) => !order.includes(k));
    return [...order, ...rest].map((k) => buckets.get(k)).filter((g) => g.products.length);
  }, [groups, custom]);
  const nameOf = (g) => (custom.names && custom.names[g.key]) || g.label;
  const paintOf = (g) => DRAWER_PAINTS.find((x) => x.id === (custom.paints || {})[g.key]) || null;
  const moveProduct = (pid, toKey) => update((c) => ({ ...c, moves: { ...(c.moves || {}), [pid]: toKey } }));
  const moveDrawer = (fromKey, toKey) => update((c) => {
    const cur = arranged.map((g) => g.key);
    const from = cur.indexOf(fromKey); const to = cur.indexOf(toKey);
    if (from < 0 || to < 0 || from === to) return c;
    cur.splice(to, 0, cur.splice(from, 1)[0]);
    return { ...c, order: cur };
  });
  const isCustomised = Boolean(Object.keys(custom.names || {}).length || Object.keys(custom.paints || {}).length || Object.keys(custom.moves || {}).length || (custom.order || []).length);
  useEffect(() => {
    const on = (e) => {
      const key = e.detail;
      setOpen((prev) => (prev.has(key) ? prev : new Set([...prev, key])));
    };
    window.addEventListener('ay-open-area', on);
    return () => window.removeEventListener('ay-open-area', on);
  }, []);
  const allOpen = arranged.every((g) => open.has(g.key));
  const total = arranged.reduce((n, g) => n + g.products.length, 0);
  const toggle = (key) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <div className="ay-drawers">
      <div className="ay-drawers__bar">
        <span className="ay-drawers__sum"><b>{total}</b> product{total === 1 ? '' : 's'} in <b>{arranged.length}</b> drawer{arranged.length === 1 ? '' : 's'}<small> · rename, recolor or drag to rearrange</small></span>
        <span className="ay-drawers__btns">
          {isCustomised && <button type="button" className="ay-drawers__reset" onClick={() => update(() => ({}))}>Reset layout</button>}
          <button type="button" className="ay-drawers__all" onClick={() => setOpen(allOpen ? new Set() : new Set(arranged.map((g) => g.key)))}>
            {allOpen ? 'Close all' : 'Open all'}
          </button>
        </span>
      </div>
      <div className="ay-drawers__case" ref={caseRef}>
        {arranged.map((group, gi) => {
          const isOpen = open.has(group.key);
          const tone = toneOf(group.key);
          const sel = group.products.find((p) => p.id === picked[group.key]) || null;
          const panelId = `eco-drawer-${group.key}`;
          return (
            <section
              key={group.key}
              id={`eco-area-${group.key}`}
              className={`ay-drawer${isOpen ? ' is-open' : ''}${paintOf(group) ? ' is-painted' : ''}${dragOver === group.key ? ' is-drop' : ''}`}
              style={{ '--tone': tone.color, ...(paintOf(group) ? { '--paint-bg': paintOf(group).bg } : {}) }}
              aria-labelledby={`eco-area-title-${group.key}`}
              onDragOver={(e) => { if (drag.current) { e.preventDefault(); if (dragOver !== group.key) setDragOver(group.key); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(null);
                const d = drag.current; drag.current = null;
                if (!d) return;
                if (d.type === 'product' && d.from !== group.key) { moveProduct(d.id, group.key); setOpen((prev) => new Set([...prev, group.key])); }
                if (d.type === 'drawer') moveDrawer(d.key, group.key);
              }}
            >
              <div className="ay-drawer__bar">
                <span
                  className="ay-drawer__grip"
                  draggable
                  title="Drag to move this drawer"
                  aria-hidden="true"
                  onDragStart={(e) => { drag.current = { type: 'drawer', key: group.key }; try { e.dataTransfer.setData('text/plain', group.key); e.dataTransfer.effectAllowed = 'move'; } catch { /* ignore */ } }}
                  onDragEnd={() => { drag.current = null; setDragOver(null); }}
                >⋮⋮</span>
                {editing === group.key ? (
                  <form className="ay-drawer__rename" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get('n') || '').trim().slice(0, 40); update((c) => { const names = { ...(c.names || {}) }; if (v && v !== group.label) names[group.key] = v; else delete names[group.key]; return { ...c, names }; }); setEditing(null); }}>
                    <label className="sr-only" htmlFor={`rn-${group.key}`}>Drawer name</label>
                    <input id={`rn-${group.key}`} name="n" defaultValue={nameOf(group)} maxLength={40} autoFocus onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null); }} onBlur={(e) => e.currentTarget.form?.requestSubmit()} />
                  </form>
                ) : (
                  <span className="ay-drawer__tools">
                    <button type="button" className="ay-drawer__tool" onClick={() => setEditing(group.key)} aria-label={`Rename ${nameOf(group)}`} title="Rename">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" /></svg>
                    </button>
                    <button type="button" className="ay-drawer__tool" onClick={() => setPainting(painting === group.key ? null : group.key)} aria-expanded={painting === group.key} aria-label={`Change color of ${nameOf(group)}`} title="Color">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-1.9 2-1.9H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z" /><circle cx="7.5" cy="11" r="1.2" /><circle cx="10" cy="7" r="1.2" /><circle cx="15" cy="7" r="1.2" /></svg>
                    </button>
                  </span>
                )}
                {painting === group.key && (
                  <div className="ay-drawer__paints" role="group" aria-label="Drawer color">
                    {DRAWER_PAINTS.map((pt) => (
                      <button key={pt.id} type="button" className={`ay-paint${(custom.paints || {})[group.key] === pt.id ? ' is-on' : ''}`} style={{ background: pt.bg }} aria-label={pt.label} title={pt.label} onClick={() => { update((c) => ({ ...c, paints: { ...(c.paints || {}), [group.key]: pt.id } })); setPainting(null); }} />
                    ))}
                    <button type="button" className="ay-paint ay-paint--none" aria-label="Default color" title="Default" onClick={() => { update((c) => { const paints = { ...(c.paints || {}) }; delete paints[group.key]; return { ...c, paints }; }); setPainting(null); }}>×</button>
                  </div>
                )}
              </div>
              <h3 className="ay-drawer__h" id={`eco-area-title-${group.key}`}>
                <button type="button" className="ay-drawer__front" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(group.key)}>
                  <span className="ay-drawer__no" aria-hidden="true">{String(gi + 1).padStart(2, '0')}</span>
                  <span className="ay-drawer__label">{nameOf(group)}</span>
                  <span className="ay-drawer__count">{group.products.length} item{group.products.length === 1 ? '' : 's'}</span>
                  <span className="ay-drawer__peek" aria-hidden="true">
                    {group.products.slice(0, 5).map((p) => (
                      <span key={p.id} className="ay-drawer__dot"><ProductTileImage product={p} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} letterNode={<ProductImageFallback compact />} /></span>
                    ))}
                    {group.products.length > 5 && <span className="ay-drawer__more">+{group.products.length - 5}</span>}
                  </span>
                  <span className="ay-drawer__cta" aria-hidden="true">{isOpen ? 'Close' : 'Open'}<i>{isOpen ? '↑' : '↓'}</i></span>
                </button>
              </h3>
              <div className="ay-drawer__body" id={panelId} hidden={!isOpen}>
                <ul className="ay-drawer__tray">
                  {group.products.map((p) => {
                    const brand = brandOf(p) || p.brand || '';
                    const on = sel && sel.id === p.id;
                    return (
                      <li
                        key={p.id}
                        draggable
                        onDragStart={(e) => { drag.current = { type: 'product', id: p.id, from: group.key }; try { e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'move'; } catch { /* ignore */ } }}
                        onDragEnd={() => { drag.current = null; setDragOver(null); }}
                      >
                        <button type="button" className={`ay-item${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => setPicked((m) => ({ ...m, [group.key]: on ? null : p.id }))}>
                          <span className="ay-item__img"><ProductTileImage product={p} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} letterNode={<ProductImageFallback compact />} /></span>
                          {brand && <span className="ay-item__brand">{brand}</span>}
                          <span className="ay-item__name">{brand ? displayName(p) : p.name}</span>
                        </button>
                      </li>
                    );
                  })}
                  {onAddMore && group.key !== 'other' && (
                    <li>
                      <button type="button" className="ay-item ay-item--add" onClick={() => onAddMore(group)}>
                        <span className="ay-item__plus" aria-hidden="true">+</span>
                        <span className="ay-item__name">Add to this drawer</span>
                      </button>
                    </li>
                  )}
                </ul>
                {sel && (() => {
                  const price = formatPrice(sel);
                  const brand = brandOf(sel) || sel.brand || '';
                  return (
                    <div className="ay-drawer__detail" role="region" aria-label={`${sel.name} details`}>
                      <span className="ay-drawer__dimg" aria-hidden="true"><ProductTileImage product={sel} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} letterNode={<ProductImageFallback compact />} /></span>
                      <div className="ay-drawer__dtext">
                        {brand && <small>{brand}</small>}
                        <strong>{brand ? displayName(sel) : sel.name}</strong>
                        {shownPriceText(price.main) && <span className="ay-drawer__price">{price.main}{price.sub && <i> {price.sub}</i>}</span>}
                      </div>
                      <div className="ay-drawer__acts">
                        <button type="button" className="is-ink" onClick={() => onOpenProduct?.(sel)}>View product</button>
                        {onAddMore && group.key !== 'other' && <button type="button" onClick={() => onAddMore(group)}>Swap</button>}
                        {arranged.length > 1 && (
                          <label className="ay-drawer__move">
                            <span>Move to</span>
                            <select value={group.key} onChange={(e) => { const to = e.target.value; setPicked((m) => ({ ...m, [group.key]: null })); moveProduct(sel.id, to); setOpen((prev) => new Set([...prev, to])); }}>
                              {arranged.map((g) => <option key={g.key} value={g.key}>{nameOf(g)}</option>)}
                            </select>
                          </label>
                        )}
                        {onToggleProduct && <button type="button" className="is-x" onClick={() => { setPicked((m) => ({ ...m, [group.key]: null })); onToggleProduct(sel); }}>Remove</button>}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
