import React from 'react';
import { Plate, Bento, Tile } from '../ui/ay';
import { useCatalogReady } from '../../data/catalog.js';
import { needStickers } from '../shop/shopNeeds.js';
import './explore-shared.css';

// Bento tones and sizes for the Needs tab (uniqueness pass, Oct 26): one big pink tile, one wide
// espresso tile, then calm butter / deeper-butter tiles with a second pink and espresso for rhythm.
const BENTO = [['pink', 'big'], ['ink', 'wide'], ['butter', ''], ['deep', ''], ['deep', ''], ['pink', ''], ['butter', ''], ['ink', '']];

/**
 * "By need" tiles (#9 Nectar: needs on plates with a label; #22 the act.:
 * a tiny arrow; #25 Rhode: stacked on a phone): her words, a real product
 * photo for each on the same plate as the product cards. Website and app.
 * `bento`: the Needs tab's mixed-size, mixed-tone grid (#455687ac intelly bento).
 */
export default function NeedTiles({ onPick, active = '', className = '', max = 8, bento = false }) {
  useCatalogReady(); // the photos come from the catalog, which loads after first paint
  const tiles = needStickers().slice(0, max);
  if (!tiles.length) return null;
  if (bento) {
    return (
      <Bento className={`ay-needbento ${className}`.trim()} role="group" aria-label="Explore by need">
        {tiles.map((n, i) => {
          const [tone, span] = BENTO[i % BENTO.length];
          return (
            <Tile key={n.id} as="button" type="button" tone={tone} span={span} className="ay-needbento__tile"
              aria-pressed={active.toLowerCase() === n.query.toLowerCase()} onClick={() => onPick?.(n.query)}>
              <span className="ay-needbento__label">{n.label} <span aria-hidden="true">→</span></span>
              <Plate src={n.image} alt="" fallback={n.label} className="ay-needbento__plate" />
            </Tile>
          );
        })}
      </Bento>
    );
  }
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
