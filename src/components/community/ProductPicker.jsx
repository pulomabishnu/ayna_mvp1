import React, { useMemo, useState } from 'react';
import ProductTileImage from '../ProductTileImage';
import MatchGauge from '../MatchGauge';
import { useCommunity } from './CommunityContext';
import { CATEGORY_LABELS } from '../../data/products';

/**
 * Search the existing ayna catalog (the same list Browse uses) and pick real
 * products. There is no free-text product entry anywhere in Community.
 */
export default function ProductPicker({ selected = [], onToggle, max = 3, autoFocus = false, placeholder = 'Find an ayna product' }) {
  const { productsById, matchFor } = useCommunity();
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const words = q.split(/\s+/);
    const out = [];
    for (const p of productsById.values()) {
      const hay = `${p.name} ${p.brand || ''} ${CATEGORY_LABELS[p.category] || p.category || ''}`.toLowerCase();
      if (words.every((w) => hay.includes(w))) out.push(p);
      if (out.length >= 30) break;
    }
    return out.slice(0, 8);
  }, [query, productsById]);

  const atMax = selected.length >= max;

  return (
    <div className="cm-picker">
      {selected.length > 0 && (
        <div className="cm-picker__selected">
          {selected.map((id) => {
            const p = productsById.get(id);
            if (!p) return null;
            return (
              <span key={id} className="cm-chip-selected">
                {p.name}
                <button type="button" aria-label={`Remove ${p.name}`} onClick={() => onToggle(id)}>×</button>
              </span>
            );
          })}
        </div>
      )}
      <input
        type="search"
        className="cm-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={atMax ? `Up to ${max} product${max > 1 ? 's' : ''}` : placeholder}
        aria-label="Find an ayna product"
        disabled={atMax}
        autoFocus={autoFocus}
      />
      {results.length > 0 && !atMax && (
        <ul className="cm-picker__results">
          {results.map((p) => {
            const pct = matchFor(p);
            const on = selected.includes(p.id);
            return (
              <li key={p.id}>
                <button type="button" className={on ? 'is-on' : ''} onClick={() => { onToggle(p.id); setQuery(''); }}>
                  <span className="cm-picker__tile"><ProductTileImage product={p} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                  <span className="cm-picker__text">
                    {p.brand && <small>{p.brand}</small>}
                    <span>{p.name}</span>
                  </span>
                  {pct != null && <MatchGauge percent={pct} size={26} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {query.trim().length >= 2 && results.length === 0 && (
        <p className="cm-hint">No ayna products match “{query.trim()}”.</p>
      )}
    </div>
  );
}
