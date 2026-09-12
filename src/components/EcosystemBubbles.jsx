import React, { useEffect, useMemo, useState } from 'react';
import {
  ALL_PRODUCTS,
  CATEGORY_LABELS,
  MACRO_GROUPS,
  productSearchText,
  getProfileMatchLabelsForProduct,
  getProfileMatchPercentForProduct,
  getRecommendationExplanation,
} from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

const CURRENT_CATEGORY_BY_ID = new Map(ALL_PRODUCTS.map((product) => [product.id, product.category]));
const WEAK_FALLBACK_KEYWORDS = new Set(['cycle']);

function scoreGroupMatch(product, group) {
  if (Array.isArray(group.excludeCategories) && group.excludeCategories.includes(product?.category)) return 0;
  let score = 0;
  if (
    Array.isArray(group.healthFunctions) &&
    Array.isArray(product?.healthFunctions) &&
    product.healthFunctions.some((healthFunction) => group.healthFunctions.includes(healthFunction))
  ) score += 50;
  const text = productSearchText(product);
  const matched = (group.keywords || []).filter((keyword) => text.includes(keyword));
  score += matched.reduce((sum, keyword) => sum + (WEAK_FALLBACK_KEYWORDS.has(keyword) ? 1 : keyword.length), 0);
  return score;
}

function resolveArea(product, areas) {
  const category = CURRENT_CATEGORY_BY_ID.get(product?.id) || product?.category;
  if (category) {
    const exact = areas.find((area) => area.categories.includes(category));
    if (exact) return exact;
  }

  const best = MACRO_GROUPS
    .filter((group) => group.id !== 'all' && Array.isArray(group.keywords))
    .map((group) => ({ id: group.id, score: scoreGroupMatch(product, group) }))
    .reduce((winner, current) => (current.score > (winner?.score || 0) ? current : winner), null);

  return best ? areas.find((area) => area.key === best.id) : null;
}

const CANVAS = 560;
const CANVAS_H = 520;
const CENTRE = { x: 280, y: 260 };
const ORBIT = 178;
const BUBBLE = 128;
const MAX_SATELLITES = 6;

const AREAS = [
  ...MACRO_GROUPS.filter((group) => group.id !== 'all').map((group) => ({
    key: group.id,
    label: group.label,
    categories: group.categories,
  })),
  { key: 'care', label: 'Clinicians', categories: ['telehealth'] },
  { key: 'supplements', label: 'Supplements', categories: ['supplement'] },
];

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

function scoreForProduct(product, quizResults, healthProfile) {
  const explicit = Number(product?.matchPercentage ?? product?.matchScore ?? product?.score);
  if (Number.isFinite(explicit)) {
    const normalized = explicit <= 1 ? Math.round(explicit * 100) : Math.round(explicit);
    if (normalized > 0 && normalized <= 100) return normalized;
  }
  try {
    const profileScore = getProfileMatchPercentForProduct?.(product, quizResults, healthProfile);
    if (Number.isFinite(profileScore)) return Math.max(1, Math.min(100, Math.round(profileScore)));
  } catch (_) {}
  return null;
}

function Arrow({ direction = 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === 'left' ? 'm14.5 5-7 7 7 7' : 'm9.5 5 7 7-7 7'} />
    </svg>
  );
}

function ProductImage({ product }) {
  return (
    <div className="eco-bubbles__product-image">
      <ProductTileImage
        product={product}
        alt={product?.name || ''}
        imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
        letterNode={<ProductImageFallback />}
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

  const { seats, covered, totalProducts } = useMemo(() => {
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

    const capped = filled.slice(0, MAX_SATELLITES);
    const addMore = { key: '__add-more__', label: 'Add more', products: [], gap: true, categories: [] };
    const nextSeats = capped.length < MAX_SATELLITES ? [...capped, addMore] : capped;

    return { seats: nextSeats, covered: filled.length, totalProducts: products.length };
  }, [myProducts]);

  const selected = seats.find((seat) => seat.key === selectedKey) || seats.find((seat) => !seat.gap) || null;
  const products = selected?.products || [];
  const safeIndex = products.length ? productIndex % products.length : 0;
  const product = products[safeIndex] || null;
  const name = displayNameFromUser(user, healthProfile, quizResults) || 'you';

  useEffect(() => {
    setProductIndex(0);
    setWhyOpen(false);
  }, [selected?.key]);

  useEffect(() => {
    if (!selectedKey && seats.find((seat) => !seat.gap)?.key) {
      setSelectedKey(seats.find((seat) => !seat.gap).key);
    }
  }, [seats, selectedKey]);

  const score = product ? scoreForProduct(product, quizResults, healthProfile) : null;
  const labels = product ? getProfileMatchLabelsForProduct(product, quizResults, healthProfile) : [];
  const explanation = product ? getRecommendationExplanation(product, quizResults, healthProfile) : null;
  const storedReason = product ? snapshotReason(product) : '';
  const whyText = explanation?.whyItWorks || storedReason || (labels.length ? `Matched on ${labels.slice(0, 3).join(', ')}.` : 'This product is part of your saved health ecosystem.');

  const scores = useMemo(
    () => Object.values(myProducts || {})
      .map((item) => scoreForProduct(item, quizResults, healthProfile))
      .filter(Number.isFinite),
    [myProducts, quizResults, healthProfile]
  );
  const averageScore = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;

  const previousProduct = () => {
    if (products.length < 2) return;
    setProductIndex((index) => (index - 1 + products.length) % products.length);
    setWhyOpen(false);
  };

  const nextProduct = () => {
    if (products.length < 2) return;
    setProductIndex((index) => (index + 1) % products.length);
    setWhyOpen(false);
  };

  return (
    <section className="eco-bubbles dainty-ecosystem-bubbles mockup-page">
      <div className="dainty-ecosystem-bubbles__main">
        <div className="dainty-ecosystem-bubbles__copy">
          <div className="dainty-kicker">your ecosystem</div>
          <h1>hi, {name}. this is your <em>health universe.</em></h1>
          <p>Each bubble is an area of care. Tap one to see what is in it, why it was matched, and your personalized product score.</p>

          <div className="eco-bubbles__carousel" aria-live="polite">
            {product ? (
              <>
                <button type="button" className="eco-bubbles__arrow" onClick={previousProduct} disabled={products.length < 2} aria-label="Previous product"><Arrow direction="left" /></button>
                <ProductImage product={product} />
                <div className="eco-bubbles__carousel-copy">
                  <div className="eco-bubbles__product-count">{safeIndex + 1} of {products.length}</div>
                  <button type="button" className="eco-bubbles__card-name" onClick={() => onOpenProduct?.(product)}>{product.name}</button>
                  <div className="eco-bubbles__card-body">{selected?.label} · matched to your saved preferences</div>
                  <div className="eco-bubbles__score">your ayna score · {Number.isFinite(score) ? `${score}/100` : 'not enough data yet'}</div>
                  <div className="eco-bubbles__card-actions">
                    <button type="button" onClick={() => setWhyOpen((value) => !value)}>{whyOpen ? 'hide why' : 'why this?'}</button>
                    <button type="button" onClick={() => onExploreArea?.(selected)}>swap</button>
                    {onToggleProduct && <button type="button" className="eco-bubbles__card-remove" onClick={() => onToggleProduct(product)}>remove</button>}
                  </div>
                  {whyOpen && <div className="eco-bubbles__why">{whyText}</div>}
                </div>
                <button type="button" className="eco-bubbles__arrow" onClick={nextProduct} disabled={products.length < 2} aria-label="Next product"><Arrow /></button>
              </>
            ) : (
              <div className="eco-bubbles__empty">Add products to your ecosystem and they will appear here.</div>
            )}
          </div>
        </div>

        <div className="eco-bubbles__canvas-wrap">
          <div className="eco-bubbles__canvas" style={{ width: CANVAS, height: CANVAS_H }}>
            <div className="eco-bubbles__ring" />
            <div className="eco-bubbles__centre">
              <div className="eco-bubbles__centre-name">{name}</div>
              <div className="eco-bubbles__centre-tags">{covered} area{covered === 1 ? '' : 's'} covered</div>
            </div>

            {seats.map((seat, index) => {
              const position = seatPosition(index, seats.length);
              const isSelected = selected?.key === seat.key;
              return (
                <button
                  type="button"
                  key={seat.key}
                  className={`eco-bubble${seat.gap ? ' eco-bubble--gap' : ''}${isSelected ? ' eco-bubble--selected' : ''}`}
                  style={{ left: position.left, top: position.top, width: BUBBLE, height: BUBBLE }}
                  onClick={() => {
                    if (seat.gap) onExploreArea?.(seat);
                    else setSelectedKey(seat.key);
                  }}
                  aria-pressed={!seat.gap && isSelected}
                >
                  <span className="eco-bubble__label">{seat.gap ? '+' : seat.label}</span>
                  <span className="eco-bubble__count">{seat.gap ? 'add more' : `${seat.products.length} pick${seat.products.length === 1 ? '' : 's'}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="dainty-ecosystem-bubbles__stats">
        <span><strong>{totalProducts}</strong><small>products saved</small></span>
        <span><strong>{covered}</strong><small>care areas</small></span>
        <span><strong>{averageScore || '—'}</strong><small>average ayna score</small></span>
      </div>
    </section>
  );
}

export { AREAS as ECOSYSTEM_AREAS, CATEGORY_LABELS, resolveArea as resolveEcosystemProductArea };
