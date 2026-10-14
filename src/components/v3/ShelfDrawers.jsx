import React, { useEffect, useState } from 'react';
import ProductTileImage, { ProductImageFallback } from '../ProductTileImage';
import { formatPrice } from '../../utils/formatPrice';
import { brandOf } from '../../mobile/data/brandFallback.js';
import { displayName } from '../../mobile/utils/displayName.js';

/* "Your shelves" as a vanity of drawers. Each area of care is a drawer:
   closed it shows its label, count and a peek of what's inside; pulled open
   it shows the products lined up small, and tapping one opens a little
   tray with its details and actions. Nothing here is decorative data:
   every product, price and count comes from her ecosystem. */
export default function ShelfDrawers({ groups, toneOf, onOpenProduct, onToggleProduct, onAddMore }) {
  const [open, setOpen] = useState(() => new Set(groups.slice(0, 1).map((g) => g.key)));
  const [picked, setPicked] = useState({});
  useEffect(() => {
    const on = (e) => {
      const key = e.detail;
      setOpen((prev) => (prev.has(key) ? prev : new Set([...prev, key])));
    };
    window.addEventListener('ay-open-area', on);
    return () => window.removeEventListener('ay-open-area', on);
  }, []);
  const allOpen = groups.every((g) => open.has(g.key));
  const total = groups.reduce((n, g) => n + g.products.length, 0);
  const toggle = (key) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <div className="ay-drawers">
      <div className="ay-drawers__bar">
        <span className="ay-drawers__sum"><b>{total}</b> product{total === 1 ? '' : 's'} in <b>{groups.length}</b> drawer{groups.length === 1 ? '' : 's'}</span>
        <button type="button" className="ay-drawers__all" onClick={() => setOpen(allOpen ? new Set() : new Set(groups.map((g) => g.key)))}>
          {allOpen ? 'Close all' : 'Open all'}
        </button>
      </div>
      <div className="ay-drawers__case">
        {groups.map((group) => {
          const isOpen = open.has(group.key);
          const tone = toneOf(group.key);
          const sel = group.products.find((p) => p.id === picked[group.key]) || null;
          const panelId = `eco-drawer-${group.key}`;
          return (
            <section key={group.key} id={`eco-area-${group.key}`} className={`ay-drawer${isOpen ? ' is-open' : ''}`} style={{ '--tone': tone.color }} aria-labelledby={`eco-area-title-${group.key}`}>
              <h3 className="ay-drawer__h" id={`eco-area-title-${group.key}`}>
                <button type="button" className="ay-drawer__front" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(group.key)}>
                  <span className="ay-drawer__no" aria-hidden="true">{tone.no}</span>
                  <span className="ay-drawer__label">{group.label}</span>
                  <span className="ay-drawer__count">{group.products.length} item{group.products.length === 1 ? '' : 's'}</span>
                  <span className="ay-drawer__peek" aria-hidden="true">
                    {group.products.slice(0, 5).map((p) => (
                      <span key={p.id} className="ay-drawer__dot"><ProductTileImage product={p} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} letterNode={<ProductImageFallback compact />} /></span>
                    ))}
                    {group.products.length > 5 && <span className="ay-drawer__more">+{group.products.length - 5}</span>}
                  </span>
                  <span className="ay-drawer__knob" aria-hidden="true" />
                </button>
              </h3>
              <div className="ay-drawer__body" id={panelId} hidden={!isOpen}>
                <ul className="ay-drawer__tray">
                  {group.products.map((p) => {
                    const brand = brandOf(p) || p.brand || '';
                    const on = sel && sel.id === p.id;
                    return (
                      <li key={p.id}>
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
                        <span className="ay-drawer__price">{price.main}{price.sub && <i> {price.sub}</i>}</span>
                      </div>
                      <div className="ay-drawer__acts">
                        <button type="button" className="is-ink" onClick={() => onOpenProduct?.(sel)}>View product</button>
                        {onAddMore && group.key !== 'other' && <button type="button" onClick={() => onAddMore(group)}>Swap</button>}
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
