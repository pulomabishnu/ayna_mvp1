import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from '../ProductCard';
import { toast } from '../../utils/toast';

/* "Your shelves": one row per area of care, products as the same polaroid
   card used in the Shop, scrolling sideways with an Add tile at the end.
   Shelves can be renamed, recoloured, reordered and products moved; that
   layout is kept in this browser only and never touches her products. */
const STORE = 'ayna.drawers.v1';
function loadCustom() {
  try { const v = JSON.parse(window.localStorage.getItem(STORE) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
function saveCustom(v) {
  try { window.localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* private mode: this visit only */ }
}
const PAINTS = [
  { id: 'butter', label: 'Butter', bg: '#ffedac' },
  { id: 'rose', label: 'Rose', bg: '#f7badd' },
  { id: 'sky', label: 'Sky', bg: '#769ebe' },
];

function Row({ children, label }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    read();
    el.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => { el.removeEventListener('scroll', read); window.removeEventListener('resize', read); };
  }, [children]);
  const page = (d) => { const el = ref.current; if (el) el.scrollBy({ left: d * el.clientWidth * 0.85, behavior: 'smooth' }); };
  return (
    <div className="ay-shelf__rowwrap">
      <ul className="ay-shelf__row" ref={ref} aria-label={label}>{children}</ul>
      {!(edge.start && edge.end) && (
        <div className="ay-shelf__nav">
          <button type="button" onClick={() => page(-1)} disabled={edge.start} aria-label={`Scroll ${label} back`}>←</button>
          <button type="button" onClick={() => page(1)} disabled={edge.end} aria-label={`Scroll ${label} forward`}>→</button>
        </div>
      )}
    </div>
  );
}

export default function ShelfRows({ groups, onOpenProduct, onToggleProduct, onAddMore }) {
  const [custom, setCustom] = useState(loadCustom);
  const [editing, setEditing] = useState(null);
  const [painting, setPainting] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const drag = useRef(null);
  const update = (fn) => setCustom((prev) => { const next = fn(prev); saveCustom(next); return next; });
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
  useEffect(() => {
    const on = (e) => { const el = document.getElementById(`eco-area-${e.detail}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    window.addEventListener('ay-open-area', on);
    return () => window.removeEventListener('ay-open-area', on);
  }, []);
  const nameOf = (g) => (custom.names && custom.names[g.key]) || g.label;
  const paintOf = (g) => PAINTS.find((x) => x.id === (custom.paints || {})[g.key]) || null;
  const moveProduct = (pid, toKey) => update((c) => ({ ...c, moves: { ...(c.moves || {}), [pid]: toKey } }));
  const moveShelf = (fromKey, toKey) => update((c) => {
    const cur = arranged.map((g) => g.key);
    const from = cur.indexOf(fromKey); const to = cur.indexOf(toKey);
    if (from < 0 || to < 0 || from === to) return c;
    cur.splice(to, 0, cur.splice(from, 1)[0]);
    return { ...c, order: cur };
  });
  const isCustomised = Boolean(Object.keys(custom.names || {}).length || Object.keys(custom.paints || {}).length || Object.keys(custom.moves || {}).length || (custom.order || []).length);

  return (
    <div className="ay-shelves">
      {isCustomised && (
        <div className="ay-shelves__bar">
          <button type="button" className="ay-shelves__reset" onClick={() => update(() => ({}))}>Reset layout</button>
        </div>
      )}
      {arranged.map((group) => {
        const paint = paintOf(group);
        return (
          <section
            key={group.key}
            id={`eco-area-${group.key}`}
            className={`ay-shelf${dragOver === group.key ? ' is-drop' : ''}`}
            style={paint ? { '--shelf-tab': paint.bg } : undefined}
            aria-labelledby={`eco-area-title-${group.key}`}
            onDragOver={(e) => { if (drag.current) { e.preventDefault(); if (dragOver !== group.key) setDragOver(group.key); } }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(null);
              const d = drag.current; drag.current = null;
              if (!d) return;
              if (d.type === 'product' && d.from !== group.key) moveProduct(d.id, group.key);
              if (d.type === 'shelf') moveShelf(d.key, group.key);
            }}
          >
            <header className="ay-shelf__head">
              <span
                className="ay-shelf__grip"
                draggable
                title="Drag to move this shelf"
                aria-hidden="true"
                onDragStart={(e) => { drag.current = { type: 'shelf', key: group.key }; try { e.dataTransfer.setData('text/plain', group.key); } catch { /* ignore */ } }}
                onDragEnd={() => { drag.current = null; setDragOver(null); }}
              >⋮⋮</span>
              {editing === group.key ? (
                <form className="ay-shelf__rename" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get('n') || '').trim().slice(0, 40); update((c) => { const names = { ...(c.names || {}) }; if (v && v !== group.label) names[group.key] = v; else delete names[group.key]; return { ...c, names }; }); setEditing(null); }}>
                  <label className="sr-only" htmlFor={`rn-${group.key}`}>Shelf name</label>
                  <input id={`rn-${group.key}`} name="n" defaultValue={nameOf(group)} maxLength={40} autoFocus onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null); }} onBlur={(e) => e.currentTarget.form?.requestSubmit()} />
                </form>
              ) : (
                <h3 className="ay-shelf__name" id={`eco-area-title-${group.key}`}>{nameOf(group)}</h3>
              )}
              <span className="ay-shelf__count">{group.products.length}</span>
              <span className="ay-shelf__tools">
                <button type="button" className="ay-shelf__tool" onClick={() => setEditing(group.key)} aria-label={`Rename ${nameOf(group)}`} title="Rename">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" /></svg>
                </button>
                <button type="button" className="ay-shelf__tool" onClick={() => setPainting(painting === group.key ? null : group.key)} aria-expanded={painting === group.key} aria-label={`Change colour of ${nameOf(group)}`} title="Colour">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-1.9 2-1.9H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z" /></svg>
                </button>
              </span>
              {painting === group.key && (
                <span className="ay-shelf__paints" role="group" aria-label="Shelf colour">
                  {PAINTS.map((pt) => (
                    <button key={pt.id} type="button" className="ay-paint" style={{ background: pt.bg }} aria-label={pt.label} title={pt.label} onClick={() => { update((c) => ({ ...c, paints: { ...(c.paints || {}), [group.key]: pt.id } })); setPainting(null); }} />
                  ))}
                </span>
              )}
              {onAddMore && group.key !== 'other' && <button type="button" className="ay-shelf__add" onClick={() => onAddMore(group)}>+ Add</button>}
            </header>
            <Row label={nameOf(group)}>
              {group.products.map((p) => (
                <li
                  key={p.id}
                  draggable
                  onDragStart={(e) => { drag.current = { type: 'product', id: p.id, from: group.key }; try { e.dataTransfer.setData('text/plain', p.id); } catch { /* ignore */ } }}
                  onDragEnd={() => { drag.current = null; setDragOver(null); }}
                >
                  <ProductCard
                    product={p}
                    onOpen={onOpenProduct}
                    action={(
                      // One "⋯" per card (was a Move select plus an unlabeled ×).
                      <details className="ay-shelf__menu">
                        <summary aria-label={`Options for ${p.name}`}>⋯</summary>
                        <div className="ay-shelf__menu-list" role="menu">
                          {arranged.length > 1 && <p className="ay-shelf__menu-h">Move to shelf</p>}
                          {arranged.length > 1 && arranged.filter((g) => g.key !== group.key).map((g) => (
                            <button key={g.key} type="button" role="menuitem" onClick={(e) => { e.currentTarget.closest('details').open = false; moveProduct(p.id, g.key); }}>{nameOf(g)}</button>
                          ))}
                          {onToggleProduct && (
                            <button type="button" role="menuitem" className="is-remove" onClick={(e) => {
                              e.currentTarget.closest('details').open = false;
                              onToggleProduct(p);
                              toast(`Removed ${p.name}`, { label: 'Undo', onClick: () => onToggleProduct(p) });
                            }}>Remove from my ecosystem</button>
                          )}
                        </div>
                      </details>
                    )}
                  />
                </li>
              ))}
              {onAddMore && group.key !== 'other' && (
                <li>
                  <button type="button" className="ay-shelf__addtile" onClick={() => onAddMore(group)}>
                    <span aria-hidden="true">+</span>
                    Add to {nameOf(group)}
                  </button>
                </li>
              )}
            </Row>
          </section>
        );
      })}
    </div>
  );
}
