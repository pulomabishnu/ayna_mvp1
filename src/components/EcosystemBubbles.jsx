import React, { useMemo, useState } from 'react';
import {
  ALL_PRODUCTS,
  CATEGORY_LABELS,
  MACRO_GROUPS,
  productSearchText,
  getProfileMatchLabelsForProduct,
  getRecommendationExplanation,
} from '../data/products';

// A product added to the ecosystem is stored as a frozen JSON snapshot
// (user_ecosystems.product_data, see src/utils/ecosystemStore.js) taken at
// the moment it was added — not re-fetched from the catalog on load. Its own
// `category` field can't always be trusted even once the area taxonomy
// itself is complete:
//   1. An older snapshot can predate a category being assigned at all, or
//      predate a later reclassification.
//   2. A product that was never in the catalog at all — an AI-generated
//      recommendation from api/llm-recommendations.js — has a freeform
//      category rather than one constrained to this site's taxonomy.
const CURRENT_CATEGORY_BY_ID = new Map(ALL_PRODUCTS.map((p) => [p.id, p.category]));

const WEAK_FALLBACK_KEYWORDS = new Set(['cycle']);

function scoreGroupMatch(product, group) {
  if (Array.isArray(group.excludeCategories) && group.excludeCategories.includes(product?.category)) return 0;
  let score = 0;
  if (Array.isArray(group.healthFunctions) && Array.isArray(product?.healthFunctions) &&
      product.healthFunctions.some((hf) => group.healthFunctions.includes(hf))) score += 50;
  const text = productSearchText(product);
  const matched = (group.keywords || []).filter((k) => text.includes(k));
  score += matched.reduce((sum, k) => sum + (WEAK_FALLBACK_KEYWORDS.has(k) ? 1 : k.length), 0);
  return score;
}

function resolveArea(product, areas) {
  const category = CURRENT_CATEGORY_BY_ID.get(product?.id) || product?.category;
  if (category) {
    const area = areas.find((a) => a.categories.includes(category));
    if (area) return area;
  }
  const best = MACRO_GROUPS
    .filter((g) => g.id !== 'all' && Array.isArray(g.keywords))
    .map((g) => ({ id: g.id, score: scoreGroupMatch(product, g) }))
    .reduce((max, cur) => (cur.score > (max?.score || 0) ? cur : max), null);
  return best ? areas.find((a) => a.key === best.id) : null;
}

/** Board 1d's canvas. Positions are computed against it, then scaled to fit. */
const CANVAS = 560;
const CANVAS_H = 520;
const CENTRE = { x: 280, y: 260 };
const ORBIT = 178;
const BUBBLE = 128;

const AREAS = [
  ...MACRO_GROUPS.filter((g) => g.id !== 'all').map((g) => ({ key: g.id, label: g.label, categories: g.categories })),
  { key: 'care', label: 'Clinicians', categories: ['telehealth'] },
  { key: 'supplements', label: 'Supplements', categories: ['supplement'] },
];

const MAX_SATELLITES = 6;

function displayNameFromUser(user, healthProfile, quizResults) {
  const meta = user?.user_metadata || {};
  const intake = quizResults?.fullHealthIntake || {};
  const raw =
    meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name ||
    healthProfile?.firstName || healthProfile?.first_name || healthProfile?.name ||
    intake?.firstName || intake?.first_name || intake?.name || '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || '';
}

function seatPosition(index, total) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  return {
    left: CENTRE.x + ORBIT * Math.sin(angle) - BUBBLE / 2,
    top: CENTRE.y - ORBIT * Math.cos(angle) - BUBBLE / 2,
  };
}

function snapshotReason(product) {
  const candidates = [
    product?.recommendationReason,
    product?.whyThis,
    product?.aynaMatchReason,
    product?._llmReason,
    product?._llmConcern,
  ];
  return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

export default function EcosystemBubbles({
  myProducts = {},
  quizResults = null,
  healthProfile = null,
  user = null,
  onOpenProduct,
  onExploreArea,
  onToggleProduct,
}) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [whyOpenProductId, setWhyOpenProductId] = useState(null);

  const { seats, covered } = useMemo(() => {
    const products = Object.values(myProducts || {});
    const byArea = new Map();
    products.forEach((p) => {
      const area = resolveArea(p, AREAS);
      const key = area ? area.key : 'other';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key).push(p);
    });

    const filled = AREAS
      .filter((a) => byArea.has(a.key))
      .map((a) => ({ ...a, products: byArea.get(a.key), gap: false }));

    if (byArea.has('other')) {
      filled.push({ key: 'other', label: 'Other', products: byArea.get('other'), gap: false });
    }

    const filledCapped = filled.slice(0, MAX_SATELLITES);
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
              onClick={() => {
                setWhyOpenProductId(null);
                if (seat.gap) onExploreArea?.(seat);
                else setSelectedKey(seat.key);
              }}
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
              const labels = getProfileMatchLabelsForProduct(product, quizResults, healthProfile);
              const line = labels.length ? `Matched on ${labels.slice(0, 3).join(', ')}.` : '';
              const explanation = getRecommendationExplanation(product, quizResults, healthProfile);
              const storedReason = snapshotReason(product);
              const whyText = explanation?.whyItWorks ||
                (storedReason ? `Why it could work: ${storedReason}` : '') ||
                line ||
                'This product is in your ecosystem, but a specific personalized match reason is not available for this saved item.';
              const isWhyOpen = whyOpenProductId === product.id;

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
                    <button
                      type="button"
                      onClick={() => setWhyOpenProductId(isWhyOpen ? null : product.id)}
                      aria-expanded={isWhyOpen}
                    >
                      {isWhyOpen ? 'Hide why' : 'Why this?'}
                    </button>
                    {onToggleProduct && (
                      <button
                        type="button"
                        className="eco-bubbles__card-remove"
                        onClick={() => onToggleProduct(product)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {isWhyOpen && (
                    <div
                      className="eco-bubbles__card-body"
                      style={{ marginTop: '0.55rem', paddingTop: '0.55rem', borderTop: '1px solid var(--color-border)' }}
                    >
                      {whyText}
                      {explanation?.considerations && (
                        <div style={{ marginTop: '0.35rem', color: 'var(--color-text-muted)' }}>
                          {explanation.considerations}
                        </div>
                      )}
                      <div style={{ marginTop: '0.35rem', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                        Match explanations are relevance signals, not medical advice or a guarantee that a product will work for you.
                      </div>
                    </div>
                  )}
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

export { AREAS as ECOSYSTEM_AREAS, CATEGORY_LABELS, resolveArea as resolveEcosystemProductArea };
