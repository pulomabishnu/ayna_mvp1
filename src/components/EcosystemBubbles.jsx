import React, { useEffect, useMemo, useState } from 'react';
import {
  ALL_PRODUCTS,
  CATEGORY_LABELS,
  MACRO_GROUPS,
  productSearchText,
  getProfileMatchLabelsForProduct,
  getRecommendationExplanation,
} from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import '../v6Real.css';

const CURRENT_CATEGORY_BY_ID = new Map(ALL_PRODUCTS.map((product) => [product.id, product.category]));
const WEAK_FALLBACK_KEYWORDS = new Set(['cycle']);
const MAX_AREAS = 5;

const AREAS = [
  ...MACRO_GROUPS.filter((group) => group.id !== 'all').map((group) => ({ key: group.id, label: group.label, categories: group.categories })),
  { key: 'care', label: 'Clinicians', categories: ['telehealth'] },
  { key: 'supplements', label: 'Supplements', categories: ['supplement'] },
];

function scoreGroupMatch(product, group) {
  if (Array.isArray(group.excludeCategories) && group.excludeCategories.includes(product?.category)) return 0;
  let score = 0;
  if (Array.isArray(group.healthFunctions) && Array.isArray(product?.healthFunctions) && product.healthFunctions.some((value) => group.healthFunctions.includes(value))) score += 50;
  const text = productSearchText(product);
  const matched = (group.keywords || []).filter((keyword) => text.includes(keyword));
  score += matched.reduce((sum, keyword) => sum + (WEAK_FALLBACK_KEYWORDS.has(keyword) ? 1 : keyword.length), 0);
  return score;
}

function resolveArea(product, areas = AREAS) {
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

function displayNameFromUser(user, healthProfile, quizResults) {
  const meta = user?.user_metadata || {};
  const intake = quizResults?.fullHealthIntake || {};
  const raw = meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name ||
    healthProfile?.firstName || healthProfile?.first_name || healthProfile?.name ||
    intake?.firstName || intake?.first_name || intake?.name || '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || 'you';
}

function rawProductScore(product) {
  const raw = product?.matchPercentage ?? product?.matchScore ?? product?.score;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const normalized = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
    return Math.max(0, Math.min(100, normalized));
  }
  return null;
}

function personalizedScore(product, quizResults, healthProfile) {
  const explicit = rawProductScore(product);
  if (explicit != null) return explicit;
  const labels = getProfileMatchLabelsForProduct(product, quizResults, healthProfile);
  const key = String(product?.id || product?.name || 'ayna');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  return Math.min(98, 86 + Math.min(labels.length * 2, 8) + (Math.abs(hash) % 4));
}

function snapshotReason(product) {
  const candidates = [product?.recommendationReason, product?.whyThis, product?.aynaMatchReason, product?._llmReason, product?._llmConcern];
  return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

function ProductVisual({ product }) {
  return (
    <div className="v6-eco-product-image">
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

  const areas = useMemo(() => {
    const products = Object.values(myProducts || {});
    const byArea = new Map();
    products.forEach((product) => {
      const area = resolveArea(product, AREAS);
      const key = area?.key || 'other';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key).push(product);
    });

    const filled = AREAS.filter((area) => byArea.has(area.key)).map((area) => ({ ...area, products: byArea.get(area.key) }));
    if (byArea.has('other')) filled.push({ key: 'other', label: 'Other', categories: [], products: byArea.get('other') });
    return filled.slice(0, MAX_AREAS);
  }, [myProducts]);

  useEffect(() => {
    if (!selectedKey && areas[0]) setSelectedKey(areas[0].key);
    if (selectedKey && !areas.some((area) => area.key === selectedKey)) setSelectedKey(areas[0]?.key || null);
  }, [areas, selectedKey]);

  useEffect(() => {
    setProductIndex(0);
    setWhyOpen(false);
  }, [selectedKey]);

  const selectedArea = areas.find((area) => area.key === selectedKey) || areas[0] || null;
  const selectedProducts = selectedArea?.products || [];
  const safeIndex = selectedProducts.length ? productIndex % selectedProducts.length : 0;
  const selectedProduct = selectedProducts[safeIndex] || null;
  const name = displayNameFromUser(user, healthProfile, quizResults);
  const savedCount = Object.keys(myProducts || {}).length;
  const scores = useMemo(
    () => Object.values(myProducts || {}).map((product) => personalizedScore(product, quizResults, healthProfile)).filter(Number.isFinite),
    [myProducts, quizResults, healthProfile],
  );
  const average = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null;

  const labels = selectedProduct ? getProfileMatchLabelsForProduct(selectedProduct, quizResults, healthProfile) : [];
  const explanation = selectedProduct ? getRecommendationExplanation(selectedProduct, quizResults, healthProfile) : null;
  const storedReason = selectedProduct ? snapshotReason(selectedProduct) : '';
  const whyText = explanation?.whyItWorks || storedReason || (labels.length ? `Matched to ${labels.slice(0, 3).join(', ')}.` : '') || 'This product is saved in your ecosystem. A more specific personalized match explanation is not available for this saved item yet.';
  const score = selectedProduct ? personalizedScore(selectedProduct, quizResults, healthProfile) : null;

  const previousProduct = () => {
    if (!selectedProducts.length) return;
    setProductIndex((index) => (index - 1 + selectedProducts.length) % selectedProducts.length);
    setWhyOpen(false);
  };
  const nextProduct = () => {
    if (!selectedProducts.length) return;
    setProductIndex((index) => (index + 1) % selectedProducts.length);
    setWhyOpen(false);
  };

  return (
    <section className="v6-ecosystem-page">
      <div className="v6-ecosystem-panel">
        <div className="v6-eco-main">
          <div className="v6-eco-copy">
            <div className="v6-eyebrow warm">your ecosystem</div>
            <h1>hi, {name}. this is your <em>health universe.</em></h1>
            <p>Each bubble is an area of care. Tap one to see what is in it, why it was matched, and your personalized product score.</p>

            {selectedProduct ? (
              <article className="v6-eco-product-card">
                <button type="button" className="v6-eco-arrow" onClick={previousProduct} disabled={selectedProducts.length <= 1} aria-label="Previous product">‹</button>
                <ProductVisual product={selectedProduct} />
                <div className="v6-eco-product-copy">
                  <div className="v6-eco-count">{safeIndex + 1} of {selectedProducts.length}</div>
                  <button type="button" className="v6-eco-product-name" onClick={() => onOpenProduct?.(selectedProduct)}>{selectedProduct.name}</button>
                  <small>{selectedArea?.label || CATEGORY_LABELS[selectedProduct?.category] || 'Ayna'} · matched to your saved preferences</small>
                  {score != null && <em>your ayna score · {score}/100</em>}
                  <button type="button" className="v6-why-link" onClick={() => setWhyOpen((value) => !value)}>{whyOpen ? 'hide why' : 'why this?'}</button>
                </div>
                <button type="button" className="v6-eco-arrow" onClick={nextProduct} disabled={selectedProducts.length <= 1} aria-label="Next product">›</button>
                {whyOpen && (
                  <div className="v6-eco-why">
                    <p>{whyText}</p>
                    {explanation?.considerations && <small>{explanation.considerations}</small>}
                    <div className="v6-eco-actions">
                      <button type="button" onClick={() => onExploreArea?.(selectedArea)}>swap</button>
                      {onToggleProduct && <button type="button" onClick={() => onToggleProduct(selectedProduct)}>remove</button>}
                    </div>
                  </div>
                )}
              </article>
            ) : (
              <article className="v6-eco-product-card empty">
                <div><strong>nothing here yet.</strong><p>Add a product and it will show up here with its match context.</p></div>
              </article>
            )}
          </div>

          <div className="v6-universe-wrap">
            <div className="v6-orbit-ring" />
            <div className="v6-universe-center"><strong>{name}</strong><small>{areas.length} areas covered</small></div>
            {areas.map((area, index) => (
              <button
                type="button"
                key={area.key}
                className={`v6-care-bubble b${index + 1}${selectedArea?.key === area.key ? ' is-active' : ''}`}
                onClick={() => setSelectedKey(area.key)}
              >
                <strong>{area.label}</strong>
                <small>{area.products.length} pick{area.products.length === 1 ? '' : 's'}</small>
              </button>
            ))}
            {areas.length < MAX_AREAS && (
              <button type="button" className={`v6-care-bubble add b${areas.length + 1}`} onClick={() => onExploreArea?.({ key: '__add-more__', label: 'Add more', gap: true })}>
                <strong>+</strong><small>add more</small>
              </button>
            )}
          </div>
        </div>

        <div className="v6-eco-stats">
          <span><strong>{savedCount}</strong><small>products saved</small></span>
          <span><strong>{areas.length}</strong><small>care areas</small></span>
          <span><strong>{average ?? '—'}</strong><small>average ayna score</small></span>
        </div>
      </div>
    </section>
  );
}

export { AREAS as ECOSYSTEM_AREAS, CATEGORY_LABELS, resolveArea as resolveEcosystemProductArea };
