import React, { useEffect, useRef, useState } from 'react';
import ProductTileImage, { ProductImageFallback } from '../ProductTileImage';
import { ECOSYSTEM_AREAS, CATEGORY_LABELS } from '../EcosystemBubbles';
import { toast } from '../../utils/toast';

/* "+ Add a product" on My Ecosystem. A real dialog (labelled, × to close,
   below the site header), catalog rows that say what a product is rather
   than internal tags, and a way to add something the catalog doesn't have
   yet, which is how a real routine gets built. */

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';

export default function AddProductDialog({ products, searchTerm, onSearch, myProducts, onToggleProduct, onClose }) {
  const panelRef = useRef(null);
  const [own, setOwn] = useState(null); // { name, area } while adding something not in the catalog
  const query = searchTerm.trim();

  useEffect(() => {
    const prev = document.activeElement;
    panelRef.current?.querySelector('input')?.focus();
    return () => { if (prev && typeof prev.focus === 'function') prev.focus(); };
  }, []);

  const trap = (e) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll('button, input, select, [href]')].filter((el) => !el.disabled);
    if (!items.length) return;
    const first = items[0]; const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const addOwn = (e) => {
    e.preventDefault();
    const name = own.name.trim().slice(0, 120);
    if (!name) return;
    const area = ECOSYSTEM_AREAS.find((a) => a.key === own.area) || null;
    const category = area?.categories?.[0] || '';
    onToggleProduct({
      id: `user-${slug(name)}-${Date.now().toString(36)}`,
      name,
      category,
      type: 'user',
      userAdded: true,
      addedAt: new Date().toISOString(),
    });
    toast(`Added ${name}${area ? ` to ${area.label}` : ''}`);
    setOwn(null);
    onSearch('');
  };

  return (
    <div className="ay-addprod" onClick={onClose}>
      <div
        ref={panelRef}
        className="ay-addprod__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ay-addprod-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trap}
      >
        <header className="ay-addprod__head">
          <h2 id="ay-addprod-title">Add to your ecosystem</h2>
          <button type="button" className="ay-addprod__close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <label className="sr-only" htmlFor="ay-addprod-q">Search products</label>
        <input
          id="ay-addprod-q"
          type="search"
          className="ay-addprod__search"
          placeholder="Search by name, brand or category"
          value={searchTerm}
          onChange={(e) => { onSearch(e.target.value); setOwn(null); }}
        />

        {own ? (
          <form className="ay-addprod__own" onSubmit={addOwn}>
            <p className="ay-addprod__ownlead">Add something you already use. It goes on your shelf as you name it.</p>
            <label htmlFor="ay-own-name">Name</label>
            <input id="ay-own-name" value={own.name} maxLength={120} onChange={(e) => setOwn({ ...own, name: e.target.value })} required />
            <label htmlFor="ay-own-area">Shelf</label>
            <select id="ay-own-area" value={own.area} onChange={(e) => setOwn({ ...own, area: e.target.value })}>
              <option value="">Other</option>
              {ECOSYSTEM_AREAS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <p className="ay-addprod__note">We don’t have this one checked yet, so it won’t get a match score, sources or recall alerts.</p>
            <div className="ay-addprod__actions">
              <button type="submit" className="ay-addprod__primary">Add to my ecosystem</button>
              <button type="button" className="ay-addprod__ghost" onClick={() => setOwn(null)}>Back to search</button>
            </div>
          </form>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="ay-addprod__empty">
                <p><strong>Not in our catalog yet{query ? `: “${query}”` : ''}.</strong></p>
                <button type="button" className="ay-addprod__primary" onClick={() => setOwn({ name: query, area: '' })}>Add it anyway</button>
              </div>
            ) : (
              <ul className="ay-addprod__list">
                {products.map((product) => {
                  const isAdded = !!myProducts[product.id];
                  const label = CATEGORY_LABELS[product.category] || String(product.category || '').replace(/-/g, ' ');
                  return (
                    <li key={product.id}>
                      <button type="button" className={`ay-addprod__row${isAdded ? ' is-added' : ''}`} aria-pressed={isAdded} onClick={() => onToggleProduct(product)}>
                        <span className="ay-addprod__img">
                          <ProductTileImage product={product} alt="" letterNode={<ProductImageFallback compact />} />
                        </span>
                        <span className="ay-addprod__txt">
                          <span className="ay-addprod__name">{product.name}{product.outOfBusiness && <em> · No longer sold</em>}</span>
                          <span className="ay-addprod__meta">{[product.brand, label].filter(Boolean).join(' · ')}</span>
                        </span>
                        <span className="ay-addprod__state">{isAdded ? '✓ Added' : '+ Add'}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {products.length > 0 && query && (
              <p className="ay-addprod__foot">Can’t find it? <button type="button" className="ay-addprod__link" onClick={() => setOwn({ name: query, area: '' })}>Add it anyway</button></p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
