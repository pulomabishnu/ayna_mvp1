import React, { useMemo, useRef, useState } from 'react';
import ProductTileImage from '../ProductTileImage';
import MatchGauge from '../MatchGauge';
import { useCommunity } from './CommunityContext';
import { CATEGORY_LABELS } from '../../data/products';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from '../../utils/naturalLanguageSearch';

function hasImage(p) {
  return Boolean(p?.image || p?.imageUrl || p?.image_url || p?.thumbnail || (Array.isArray(p?.images) && p.images.length));
}

/**
 * Search the existing ayna catalog with the SAME scoring Browse uses
 * (naturalLanguageSearch), so "something for cramps" or "bloat" finds what it
 * finds in Browse. Real catalog products only — no free-text products.
 * Empty + focused shows suggestions: the viewer's top matches if they have a
 * profile, otherwise a few catalog picks.
 */
export default function ProductPicker({ selected = [], onToggle, max = 3, autoFocus = false, placeholder = 'Find an ayna product' }) {
  const { productsById, matchFor, hasProfile } = useCommunity();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const [active, setActive] = useState(0);
  const blurTimer = useRef(null);

  const index = useMemo(() => [...productsById.values()].map((p) => ({
    p,
    hay: buildSearchTextForItem(p, CATEGORY_LABELS),
    id: buildIdentityTextForItem(p, CATEGORY_LABELS),
  })), [productsById]);

  const q = query.trim();
  const results = useMemo(() => {
    if (q.length < 1) return [];
    const scored = [];
    for (const row of index) {
      const s = scoreQueryAgainstProduct(q, row.hay, row.id);
      if (s > 0) scored.push({ p: row.p, s, m: matchFor(row.p) ?? -1 });
    }
    scored.sort((a, b) => b.s - a.s || b.m - a.m || (hasImage(b.p) - hasImage(a.p)));
    return scored.slice(0, 8).map((x) => x.p);
  }, [q, index, matchFor]);

  const suggestions = useMemo(() => {
    if (q) return [];
    const withImages = index.map((r) => r.p).filter(hasImage);
    if (hasProfile) {
      return withImages
        .map((p) => ({ p, m: matchFor(p) }))
        .filter((x) => x.m != null && x.m > 0)
        .sort((a, b) => b.m - a.m)
        .slice(0, 6)
        .map((x) => x.p);
    }
    return withImages.slice(0, 6);
  }, [q, index, hasProfile, matchFor]);

  const atMax = selected.length >= max;
  const list = q ? results : (focused ? suggestions : []);
  const open = !atMax && list.length > 0;

  const choose = (p) => {
    onToggle(p.id);
    setQuery('');
    setActive(0);
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % list.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + list.length) % list.length); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(list[Math.min(active, list.length - 1)]); }
    else if (e.key === 'Escape') { setFocused(false); }
  };

  return (
    <div className="cm-picker">
      {selected.length > 0 && (
        <div className="cm-picker__selected">
          {selected.map((id) => {
            const p = productsById.get(id);
            if (!p) return null;
            return (
              <span key={id} className="cm-chip-selected cm-chip-selected--product">
                <span className="cm-chip-selected__tile"><ProductTileImage product={p} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                {p.name}
                <button type="button" aria-label={`Remove ${p.name}`} onClick={() => onToggle(id)}>×</button>
              </span>
            );
          })}
        </div>
      )}
      <div className={`cm-picker__field${focused ? ' is-focused' : ''}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          className="cm-picker__input"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onFocus={() => { clearTimeout(blurTimer.current); setFocused(true); }}
          onBlur={() => { blurTimer.current = setTimeout(() => setFocused(false), 150); }}
          onKeyDown={onKeyDown}
          placeholder={atMax ? `Up to ${max} product${max > 1 ? 's' : ''}` : placeholder}
          aria-label="Find an ayna product"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          disabled={atMax}
          autoFocus={autoFocus}
          autoComplete="off"
        />
        {query && <button type="button" className="cm-picker__clear" aria-label="Clear" onClick={() => setQuery('')}>×</button>}
      </div>
      {open && (
        <div className="cm-picker__panel">
          {!q && <p className="cm-picker__label">{hasProfile ? 'your top matches' : 'suggestions'}</p>}
          <ul className="cm-picker__results" role="listbox">
            {list.map((p, i) => {
              const pct = matchFor(p);
              const on = selected.includes(p.id);
              return (
                <li key={p.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    className={`${on ? 'is-on' : ''}${i === active ? ' is-active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(p)}
                  >
                    <span className="cm-picker__tile"><ProductTileImage product={p} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                    <span className="cm-picker__text">
                      {p.brand && <small>{p.brand}</small>}
                      <span>{p.name}</span>
                      {(CATEGORY_LABELS[p.category] || p.category) && <em>{CATEGORY_LABELS[p.category] || p.category}</em>}
                    </span>
                    {pct != null && <MatchGauge percent={pct} size={28} />}
                    {on && <span className="cm-picker__check" aria-label="Added">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {q.length >= 2 && results.length === 0 && (
        <p className="cm-hint">No ayna products match “{q}”. Try a brand, a product type, or what it helps with.</p>
      )}
    </div>
  );
}
