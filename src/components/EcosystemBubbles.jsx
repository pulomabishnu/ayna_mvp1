import React, { useMemo, useState } from 'react';
import {
  ALL_PRODUCTS,
  CATEGORY_LABELS,
  MACRO_GROUPS,
  productSearchText,
  getProfileMatchLabelsForProduct,
  getRecommendationExplanation,
  getProfileMatchPercentForProduct,
} from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

const CURRENT_CATEGORY_BY_ID = new Map(ALL_PRODUCTS.map((p) => [p.id, p.category]));
const WEAK_FALLBACK_KEYWORDS = new Set(['cycle']);

function scoreGroupMatch(product, group) {
  if (Array.isArray(group.excludeCategories) && group.excludeCategories.includes(product?.category)) return 0;
  let score = 0;
  if (Array.isArray(group.healthFunctions) && Array.isArray(product?.healthFunctions) &&
      product.healthFunctions.some((hf) => group.healthFunctions.includes(hf))) score += 50;
  const text = productSearchText(product);
  const matched = (group.keywords || []).filter((keyword) => text.includes(keyword));
  score += matched.reduce((sum, keyword) => sum + (WEAK_FALLBACK_KEYWORDS.has(keyword) ? 1 : keyword.length), 0);
  return score;
}

function resolveArea(product, areas) {
  const category = CURRENT_CATEGORY_BY_ID.get(product?.id) || product?.category;
  if (category) {
    const area = areas.find((candidate) => candidate.categories.includes(category));
    if (area) return area;
  }
  const best = MACRO_GROUPS
    .filter((group) => group.id !== 'all' && Array.isArray(group.keywords))
    .map((group) => ({ id: group.id, score: scoreGroupMatch(product, group) }))
    .reduce((max, current) => (current.score > (max?.score || 0) ? current : max), null);
  return best ? areas.find((area) => area.key === best.id) : null;
}

const CANVAS = 560;
const CANVAS_H = 520;
const CENTRE = { x: 280, y: 260 };
const ORBIT = 178;
const BUBBLE = 112;

const AREAS = [
  ...MACRO_GROUPS.filter((group) => group.id !== 'all').map((group) => ({
    key: group.id,
    label: group.label,
    categories: group.categories,
  })),
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

function ProductThumb({ product }) {
  return (
    <div className="eco-bubbles__product-image">
      <ProductTileImage
        product={product}
        alt={product?.name || ''}
        imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
        letterNode={<ProductImageFallback compact />}
      />
    </div>
  );
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
  const [productIndex, setProductIndex] = useState(0);
  const [whyOpen, setWhyOpen] = useState(false);

  const { seats, covered } = useMemo(() => {
    const products = Object.values(myProducts || {});
    const byArea = new Map();

    products.forEach((product) => {
      const area = resolveArea(product, AREAS);
      const key = area ? area.key : 'other';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key).push(product);
    });

    const filled = AREAS
      .filter((area) => byArea.has(area.key))
      .map((area) => ({ ...area, products: byArea.get(area.key), gap: false }));

    if (byArea.has('other')) {
      filled.push({ key: 'other', label: 'Other', products: byArea.get('other'), gap: false, categories: [] });
    }

    const filledCapped = filled.slice(0, MAX_SATELLITES);
    const addMoreSeat = { key: '__add-more__', label: 'Add more', products: [], gap: true, categories: [] };
    const withAdd = filledCapped.length < MAX_SATELLITES ? [...filledCapped, addMoreSeat] : filledCapped;

    return { seats: withAdd, covered: filled.length };
  }, [myProducts]);

  const selected = seats.find((seat) => seat.key === selectedKey) || seats.find((seat) => !seat.gap) || null;
  const selectedProducts = selected?.products || [];
  const safeIndex = selectedProducts.length ? Math.min(productIndex, selectedProducts.length - 1) : 0;
  const product = selectedProducts[safeIndex] || null;

  const name = displayNameFromUser(user, healthProfile, quizResults) || 'you';
  const score = product ? getProfileMatchPercentForProduct(product, quizResults, healthProfile) : null;
  const labels = product ? getProfileMatchLabelsForProduct(product, quizResults, healthProfile) : [];
  const explanation = product ? getRecommendationExplanation(product, quizResults, healthProfile) : null;
  const storedReason = product ? snapshotReason(product) : '';
  const whyText = explanation?.whyItWorks || storedReason ||
    (labels.length ? `Matched on ${labels.slice(0, 3).join(', ')}.` : 'This item is saved in your ecosystem.');

  const chooseSeat = (seat) => {
    setWhyOpen(false);
    setProductIndex(0);
    if (seat.gap) onExploreArea?.(seat);
    else setSelectedKey(seat.key);
  };

  const prev = () => {
    if (!selectedProducts.length) return;
    setWhyOpen(false);
    setProductIndex((current) => (current - 1 + selectedProducts.length) % selectedProducts.length);
  };

  const next = () => {
    if (!selectedProducts.length) return;
    setWhyOpen(false);
    setProductIndex((current) => (current + 1) % selectedProducts.length);
  };

  return (
    <section className="eco-bubbles">
      <div className="eco-bubbles__canvas-wrap">
        <div className="eco-bubbles__canvas" style={{ width: CANVAS, height: CANVAS_H }}>
          <div className="eco-bubbles__ring" />

          <div className="eco-bubbles__centre">
            <div className="eco-bubbles__centre-name">{name.toLowerCase()}</div>
            <div className="eco-bubbles__centre-tags">{covered ? `${covered} care areas` : 'your universe'}</div>
          </div>

          {seats.map((seat, index) => {
            const pos = seatPosition(index, seats.length);
            const isSelected = selected && seat.key === selected.key;
            return (
              <button
                key={seat.key}
                type="button"
                className={`eco-bubble${seat.gap ? ' eco-bubble--gap' : ''}${isSelected ? ' eco-bubble--selected' : ''}`}
                style={{ left: pos.left, top: pos.top, width: BUBBLE, height: BUBBLE }}
                onClick={() => chooseSeat(seat)}
                aria-pressed={!seat.gap && isSelected}
              >
                <span className="eco-bubble__label">{seat.gap ? '+' : seat.label}</span>
                <span className="eco-bubble__count">{seat.gap ? 'add more' : `${seat.products.length} ${seat.products.length === 1 ? 'pick' : 'picks'}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="eco-bubbles__side">
        <div className="dainty-eyebrow dainty-eyebrow--warm">my ecosystem</div>
        <h2 className="eco-bubbles__title">hi, {name.toLowerCase()}. this is your health universe.</h2>
        <p className="eco-bubbles__lede">Each bubble is an area of care. Tap one to see what is in it, why it was matched, and your personalized product score.</p>

        {product ? (
          <article className="eco-bubbles__card">
            <div className="eco-bubbles__card-topline">
              <span>{selected?.label}</span>
              <span>{safeIndex + 1} of {selectedProducts.length}</span>
            </div>

            <div className="eco-bubbles__selected-product">
              <ProductThumb product={product} />
              <div className="eco-bubbles__selected-copy">
                <button type="button" className="eco-bubbles__card-name" onClick={() => onOpenProduct?.(product)}>{product.name}</button>
                <div className="eco-bubbles__card-meta">{CATEGORY_LABELS[product.category] || product.category || 'Ayna pick'}</div>
                <div className="eco-bubbles__score">your ayna score · {Number.isFinite(score) ? `${score}/100` : 'personalized match'}</div>
                {labels.length > 0 && <div className="eco-bubbles__card-body">Matched on {labels.slice(0, 3).join(', ')}.</div>}
              </div>
            </div>

            {selectedProducts.length > 1 && (
              <div className="eco-bubbles__carousel">
                <button type="button" onClick={prev} aria-label="Previous product">←</button>
                <span>{safeIndex + 1} of {selectedProducts.length}</span>
                <button type="button" onClick={next} aria-label="Next product">→</button>
              </div>
            )}

            <div className="eco-bubbles__card-actions">
              <button type="button" onClick={() => onExploreArea?.(selected)}>swap</button>
              <button type="button" onClick={() => setWhyOpen((value) => !value)}>{whyOpen ? 'hide why' : 'why this?'}</button>
              {onToggleProduct && <button type="button" onClick={() => onToggleProduct(product)}>remove</button>}
            </div>

            {whyOpen && (
              <div className="eco-bubbles__why">
                <p>{whyText}</p>
                {explanation?.considerations && <p>{explanation.considerations}</p>}
                <small>Match explanations are relevance signals, not medical advice or a guarantee that a product will work for you.</small>
              </div>
            )}
          </article>
        ) : (
          <article className="eco-bubbles__card eco-bubbles__card--empty">
            <div className="eco-bubbles__card-topline"><span>your universe</span></div>
            <p className="eco-bubbles__card-body">Add a product and it will appear here inside the care area it belongs to.</p>
            <div className="eco-bubbles__card-actions"><button type="button" onClick={() => onExploreArea?.({ key: '__add-more__', gap: true, categories: [] })}>add a product</button></div>
          </article>
        )}
      </div>
    </section>
  );
}

export { AREAS as ECOSYSTEM_AREAS, CATEGORY_LABELS, resolveArea as resolveEcosystemProductArea };
