import React from 'react';
import { Plate } from '../ui/ay';
import { useCatalogReady } from '../../data/catalog.js';
import { needStickers } from '../shop/shopNeeds.js';
import './explore-shared.css';

/**
 * "By need" tiles (#9 Nectar: needs on plates with a label; #22 the act.:
 * a tiny arrow; #25 Rhode: stacked on a phone): her words, a real product
 * photo for each on the same plate as the product cards. Website and app.
 */
export default function NeedTiles({ onPick, active = '', className = '', max = 8 }) {
  useCatalogReady(); // the photos come from the catalog, which loads after first paint
  const tiles = needStickers().slice(0, max);
  if (!tiles.length) return null;
  return (
    <ul className={`ay-needtiles ${className}`.trim()} aria-label="Explore by need">
      {tiles.map((n) => (
        <li key={n.id}>
          <button type="button" className="ay-needtile" aria-pressed={active.toLowerCase() === n.query.toLowerCase()} onClick={() => onPick?.(n.query)}>
            <Plate src={n.image} alt="" fallback={n.label} className="ay-needtile__plate" />
            <span className="ay-needtile__label">{n.label} <span aria-hidden="true">→</span></span>
          </button>
        </li>
      ))}
    </ul>
  );
}
