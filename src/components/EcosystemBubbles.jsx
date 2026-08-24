import React, { useMemo, useState } from 'react';
import { CATEGORY_LABELS, getProfileMatchLabelsForProduct } from '../data/products';

/**
 * "This is your ecosystem." — mockup board 1d, the circular layout.
 *
 * A centre bubble for the person, one satellite per area of care she has
 * products in, and dashed satellites for the areas she doesn't. Selecting a
 * satellite fills the card on the right; the product name in that card opens
 * the same product modal Discovery opens, so a product looks identical
 * wherever it is clicked from.
 */

/** Board 1d's canvas. Positions are computed against it, then scaled to fit. */
const CANVAS = 560;
const CANVAS_H = 520;
const CENTRE = { x: 280, y: 260 };
const ORBIT = 178;
const BUBBLE = 128;

/** Care areas, and the catalog categories that roll up into each. */
const AREAS = [
  { key: 'cycle', label: 'Cycle care', categories: ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief'] },
  { key: 'pelvic-floor', label: 'Pelvic floor', categories: ['pelvic-floor', 'pelvic-health'] },
  { key: 'postpartum', label: 'Postpartum', categories: ['postpartum', 'pregnancy'] },
  { key: 'intimate', label: 'Intimate care', categories: ['intimate-care', 'sex-tech', 'incontinence'] },
  { key: 'supplements', label: 'Supplements', categories: ['supplement', 'hormone-monitoring'] },
  { key: 'sleep', label: 'Sleep', categories: ['mental-health'] },
  { key: 'care', label: 'Clinicians', categories: ['telehealth'] },
];

/** How many satellites to draw at most, so the ring stays legible. */
const MAX_SATELLITES = 6;

function displayNameFromUser(user, healthProfile, quizResults) {
  const meta = user?.user_metadata || {};
  const intake = quizResults?.fullHealthIntake || {};
  const raw =
    meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name ||
    healthProfile?.firstName || healthProfile?.first_name || healthProfile?.name ||
    intake?.firstName || intake?.first_name || intake?.name || '';
  const first = String(raw).trim().split(/\s+/).filter(Boolean)[0] || '';
  return first;
}

/** Evenly spaces satellites around the ring, starting at 12 o'clock. */
function seatPosition(index, total) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  return {
    left: CENTRE.x + ORBIT * Math.sin(angle) - BUBBLE / 2,
    top: CENTRE.y - ORBIT * Math.cos(angle) - BUBBLE / 2,
  };
}

export default function EcosystemBubbles({
  myProducts = {},
  quizResults = null,
  healthProfile = null,
  user = null,
  onOpenProduct,
  onExploreArea,
}) {
  const [selectedKey, setSelectedKey] = useState(null);

  const { seats, covered } = useMemo(() => {
    const products = Object.values(myProducts || {});
    const byArea = new Map();
    products.forEach((p) => {
      const area = AREAS.find((a) => a.categories.includes(p.category));
      const key = area ? area.key : 'other';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key).push(p);
    });

    const filled = AREAS
      .filter((a) => byArea.has(a.key))
      .map((a) => ({ ...a, products: byArea.get(a.key), gap: false }));

    // Anything left over that didn't map to a named area still deserves a seat.
    if (byArea.has('other')) {
      filled.push({ key: 'other', label: 'Other', products: byArea.get('other'), gap: false });
    }

    const gaps = AREAS
      .filter((a) => !byArea.has(a.key))
      .slice(0, Math.max(0, MAX_SATELLITES - filled.length))
      .map((a) => ({ ...a, products: [], gap: true }));

    return { seats: [...filled, ...gaps].slice(0, MAX_SATELLITES), covered: filled.length };
  }, [myProducts]);

  const selected = seats.find((s) => s.key === selectedKey) || seats.find((s) => !s.gap) || null;
  const selectedProduct = selected && !selected.gap ? selected.products[0] : null;

  // Cheap enough to just compute; wrapping it in useMemo keyed on a value that
  // is itself derived each render buys nothing.
  const matchLabels = selectedProduct
    ? getProfileMatchLabelsForProduct(selectedProduct, quizResults, healthProfile)
    : [];
  const matchLine = matchLabels.length ? `Matched on ${matchLabels.slice(0, 3).join(', ')}.` : '';

  const name = displayNameFromUser(user, healthProfile, quizResults) || 'You';
  const centreTags = useMemo(() => {
    const tags = [];
    if (quizResults?.lifeStage) tags.push(String(quizResults.lifeStage));
    if (covered > 0) tags.push(`${covered} area${covered === 1 ? '' : 's'} covered`);
    return tags.join(' · ').toUpperCase();
  }, [quizResults, covered]);

  return (
    <section className="eco-bubbles mockup-page">
      {/* .eco-bubbles__canvas is a fixed 560x520 (CANVAS/CANVAS_H) so every
          bubble's JS-computed left/top stays correct — it's visually shrunk
          on narrower screens with transform:scale, which is paint-only and
          does NOT reduce the box's layout footprint. Without this wrapper
          reserving the real (post-scale) space via CSS, the still-560px-wide
          canvas overflowed its grid track on mobile (found live: 598px of
          content in a 390px viewport). */}
      <div className="eco-bubbles__canvas-wrap">
      <div className="eco-bubbles__canvas" style={{ width: CANVAS, height: CANVAS_H }}>
        <div className="eco-bubbles__ring" />

        <div className="eco-bubbles__centre">
          <div className="eco-bubbles__centre-name">{name}</div>
          {centreTags && <div className="eco-bubbles__centre-tags">{centreTags}</div>}
        </div>

        {seats.map((seat, i) => {
          const pos = seatPosition(i, seats.length);
          const isSelected = selected && seat.key === selected.key;
          return (
            <button
              key={seat.key}
              type="button"
              className={`eco-bubble${seat.gap ? ' eco-bubble--gap' : ''}${isSelected ? ' eco-bubble--selected' : ''}`}
              style={{ left: pos.left, top: pos.top, width: BUBBLE, height: BUBBLE }}
              onClick={() => (seat.gap ? onExploreArea?.(seat) : setSelectedKey(seat.key))}
              aria-pressed={!seat.gap && isSelected}
            >
              <span className="eco-bubble__label">{seat.label}</span>
              <span className="eco-bubble__count">
                {seat.gap ? 'Add +' : `${seat.products.length} pick${seat.products.length === 1 ? '' : 's'}`}
              </span>
            </button>
          );
        })}
      </div>
      </div>

      <div className="eco-bubbles__side">
        <h2 className="eco-bubbles__title">This is your ecosystem.</h2>
        <p className="eco-bubbles__lede">
          Each circle is an area of care. Tap one to see what&apos;s in it and why. Dashed circles are
          gaps we can fill.
        </p>

        {selected && !selected.gap && selectedProduct ? (
          <div className="eco-bubbles__card">
            <div className="eco-bubbles__card-label">{selected.label} · Selected</div>
            <button
              type="button"
              className="eco-bubbles__card-name"
              onClick={() => onOpenProduct?.(selectedProduct)}
            >
              {selectedProduct.name}
            </button>
            {matchLine && <div className="eco-bubbles__card-body">{matchLine}</div>}
            <div className="eco-bubbles__card-actions">
              <button type="button" onClick={() => onExploreArea?.(selected)}>Swap</button>
              <button type="button" onClick={() => onOpenProduct?.(selectedProduct)}>Why this?</button>
            </div>
          </div>
        ) : (
          <div className="eco-bubbles__card">
            <div className="eco-bubbles__card-label">Nothing here yet</div>
            <div className="eco-bubbles__card-body">
              Add a product to an area and it will show up here with the reason it was matched.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export { AREAS as ECOSYSTEM_AREAS, CATEGORY_LABELS };
