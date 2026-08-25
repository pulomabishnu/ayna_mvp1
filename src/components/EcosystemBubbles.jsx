import React, { useMemo, useState } from 'react';
import { CATEGORY_LABELS, MACRO_GROUPS, getProfileMatchLabelsForProduct } from '../data/products';

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

/**
 * Care areas, and the catalog categories that roll up into each — derived from
 * MACRO_GROUPS (../data/products), the same taxonomy Discovery's category
 * chips use, rather than a separately hand-maintained list. That list used to
 * live only here and had drifted out of sync with the real category set
 * (missing birth control, breast care, menopause, skin, hair, gut, pain
 * relief, tests + devices...), so a product in any of those categories
 * silently fell into a generic "Other" bubble instead of a properly named one
 * (found live, Aditi 2026-08-24: a sleep product added to an ecosystem should
 * get its own "Sleep" bubble, not "Other"). 'telehealth' isn't one of
 * MACRO_GROUPS' chips (Discovery doesn't filter by it) but still deserves its
 * own area here, so it's added back explicitly.
 */
const AREAS = [
  ...MACRO_GROUPS.filter((g) => g.id !== 'all').map((g) => ({ key: g.id, label: g.label, categories: g.categories })),
  { key: 'care', label: 'Clinicians', categories: ['telehealth'] },
  // MACRO_GROUPS deliberately excludes the bare 'supplement' category from every
  // area (see its own comment: one flat "Supplements" chip would be useless for
  // FILTERING ~40 unrelated supplements down by what they treat). That reasoning
  // is specific to Discovery's filter chips — here, someone just wants to see
  // "the supplements in my ecosystem" as one group, so it's added back only here.
  { key: 'supplements', label: 'Supplements', categories: ['supplement'] },
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

    const filledCapped = filled.slice(0, MAX_SATELLITES);
    // One "Add More" seat, not one dashed seat per empty area (was AREAS not
    // yet covered, up to MAX_SATELLITES - filled.length of them, each
    // pre-suggesting a specific category to fill — Aditi/team decided this
    // should instead be a single affordance to Browse and pick anything,
    // not the app pre-choosing which gaps look most fillable). Only shown
    // when there's an actual empty seat in the ring to put it in.
    const addMoreSeat = { key: '__add-more__', label: 'Add More', products: [], gap: true };
    const seats = filledCapped.length < MAX_SATELLITES ? [...filledCapped, addMoreSeat] : filledCapped;

    return { seats, covered: filled.length };
  }, [myProducts]);

  const selected = seats.find((s) => s.key === selectedKey) || seats.find((s) => !s.gap) || null;

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
              <span className="eco-bubble__label">{seat.gap ? '' : seat.label}</span>
              <span className="eco-bubble__count">
                {seat.gap ? seat.label : `${seat.products.length} pick${seat.products.length === 1 ? '' : 's'}`}
              </span>
            </button>
          );
        })}
      </div>
      </div>

      <div className="eco-bubbles__side">
        <h2 className="eco-bubbles__title">This is your ecosystem.</h2>
        <p className="eco-bubbles__lede">
          Each circle is an area of care. Tap one to see what&apos;s in it and why. The dashed
          circle adds more.
        </p>

        {selected && !selected.gap && selected.products.length > 0 ? (
          <div className="eco-bubbles__card">
            <div className="eco-bubbles__card-label">{selected.label} · Selected</div>
            {selected.products.map((product) => {
              // Every product this area covers gets its own row — this card
              // used to show only products[0], so a "2 picks" area silently
              // hid its second product with no way to see or act on it here.
              const labels = getProfileMatchLabelsForProduct(product, quizResults, healthProfile);
              const line = labels.length ? `Matched on ${labels.slice(0, 3).join(', ')}.` : '';
              return (
                <div key={product.id} className="eco-bubbles__card-product">
                  <button
                    type="button"
                    className="eco-bubbles__card-name"
                    onClick={() => onOpenProduct?.(product)}
                  >
                    {product.name}
                  </button>
                  {line && <div className="eco-bubbles__card-body">{line}</div>}
                  <div className="eco-bubbles__card-actions">
                    <button type="button" onClick={() => onExploreArea?.(selected)}>Swap</button>
                    <button type="button" onClick={() => onOpenProduct?.(product)}>Why this?</button>
                  </div>
                </div>
              );
            })}
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
