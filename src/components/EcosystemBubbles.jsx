import React, { useEffect, useMemo, useState } from 'react';
import {
  ALL_PRODUCTS,
  CATEGORY_LABELS,
  MACRO_GROUPS,
  productSearchText,
  getProfileMatchLabelsForProduct,
} from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

const CURRENT_CATEGORY_BY_ID = new Map(ALL_PRODUCTS.map((product) => [product.id, product.category]));
const WEAK_FALLBACK_KEYWORDS = new Set(['cycle']);
const MAX_AREAS = 5;

const AREAS = [
  ...MACRO_GROUPS
    .filter((group) => group.id !== 'all')
    .map((group) => ({ key: group.id, label: group.label, categories: group.categories })),
  { key: 'care', label: 'Clinicians', categories: ['telehealth'] },
  { key: 'supplements', label: 'Supplements', categories: ['supplement'] },
];

const AREA_ACCENTS = ['#A9647A', '#4E3866', '#D98A52', '#F0A84B', '#242A52'];

function scoreGroupMatch(product, group) {
  if (Array.isArray(group.excludeCategories) && group.excludeCategories.includes(product?.category)) return 0;
  let score = 0;
  if (
    Array.isArray(group.healthFunctions) &&
    Array.isArray(product?.healthFunctions) &&
    product.healthFunctions.some((value) => group.healthFunctions.includes(value))
  ) {
    score += 50;
  }
  const text = productSearchText(product);
  const matched = (group.keywords || []).filter((keyword) => text.includes(keyword));
  score += matched.reduce((sum, keyword) => sum + (WEAK_FALLBACK_KEYWORDS.has(keyword) ? 1 : keyword.length), 0);
  return score;
}

function resolveArea(product, areas = AREAS) {
  const category = CURRENT_CATEGORY_BY_ID.get(product?.id) || product?.category;
  if (category) {
    const direct = areas.find((candidate) => candidate.categories.includes(category));
    if (direct) return direct;
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
  const raw =
    meta.first_name ||
    meta.firstName ||
    meta.given_name ||
    meta.full_name ||
    meta.name ||
    healthProfile?.firstName ||
    healthProfile?.first_name ||
    healthProfile?.name ||
    intake?.firstName ||
    intake?.first_name ||
    intake?.name ||
    '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || 'you';
}

function rawProductScore(product) {
  const raw = product?.matchPercentage ?? product?.matchScore ?? product?.score;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  const normalized = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  return Math.max(0, Math.min(100, normalized));
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

function nodePosition(index, total) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = total <= 3 ? 36 : 40;
  return {
    left: `${50 + radius * Math.cos(angle)}%`,
    top: `${50 + radius * Math.sin(angle)}%`,
  };
}

function ProductRow({ product, score, onOpenProduct, onToggleProduct }) {
  return (
    <div className="ayna-calm-ecosystem__product-row">
      <div className="ayna-calm-ecosystem__product-image" aria-hidden="true">
        <ProductTileImage
          product={product}
          alt=""
          imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
          letterNode={<ProductImageFallback />}
        />
      </div>
      <button
        type="button"
        className="ayna-calm-ecosystem__product-main"
        onClick={() => onOpenProduct?.(product)}
      >
        <span className="ayna-calm-ecosystem__product-name">{product?.name || 'Saved product'}</span>
        <span className="ayna-calm-ecosystem__product-meta">
          {product?.brand ? `${product.brand} · ` : ''}{score}% match
        </span>
      </button>
      <button
        type="button"
        className="ayna-calm-ecosystem__remove"
        onClick={() => onToggleProduct?.(product)}
        aria-label={`Remove ${product?.name || 'product'} from ecosystem`}
      >
        Remove
      </button>
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
  const areas = useMemo(() => {
    const products = Object.values(myProducts || {});
    const byArea = new Map();

    products.forEach((product) => {
      const area = resolveArea(product, AREAS);
      const key = area?.key || 'other';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key).push(product);
    });

    const filled = AREAS
      .filter((area) => byArea.has(area.key))
      .map((area) => ({ ...area, products: byArea.get(area.key) }));

    if (byArea.has('other')) {
      filled.push({ key: 'other', label: 'Other', categories: [], products: byArea.get('other') });
    }

    return filled.slice(0, MAX_AREAS);
  }, [myProducts]);

  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    if (!areas.length) {
      setSelectedKey(null);
      return;
    }
    if (!selectedKey || !areas.some((area) => area.key === selectedKey)) {
      setSelectedKey(areas[0].key);
    }
  }, [areas, selectedKey]);

  const selectedArea = areas.find((area) => area.key === selectedKey) || areas[0] || null;
  const name = displayNameFromUser(user, healthProfile, quizResults);
  const productCount = Object.keys(myProducts || {}).length;

  if (!areas.length) {
    return (
      <section className="ayna-calm-ecosystem ayna-calm-ecosystem--empty">
        <div>
          <div className="ayna-calm-ecosystem__eyebrow">Your ecosystem</div>
          <h2>Start with what you already use.</h2>
          <p>Add products you are using, trying, or saving so ayna can keep everything in one place.</p>
          <button type="button" className="ayna-calm-ecosystem__primary" onClick={() => onExploreArea?.('')}>
            Explore products
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="ayna-calm-ecosystem">
      <div className="ayna-calm-ecosystem__intro">
        <div className="ayna-calm-ecosystem__eyebrow">Your ecosystem</div>
        <h2>{name === 'you' ? 'Everything supporting you right now.' : `${name}, here’s what’s supporting you right now.`}</h2>
        <p>{productCount} saved {productCount === 1 ? 'item' : 'items'} across {areas.length} care {areas.length === 1 ? 'area' : 'areas'}.</p>
      </div>

      <div className="ayna-calm-ecosystem__layout">
        <div className="ayna-calm-ecosystem__visual-card">
          <div className="ayna-calm-ecosystem__diagram" aria-label="Your ecosystem care areas">
            <div className="ayna-calm-ecosystem__ring ayna-calm-ecosystem__ring--outer" />
            <div className="ayna-calm-ecosystem__ring ayna-calm-ecosystem__ring--inner" />
            <div className="ayna-calm-ecosystem__center">
              <span>you</span>
              <strong>{name === 'you' ? 'You' : name}</strong>
            </div>

            {areas.map((area, index) => {
              const position = nodePosition(index, areas.length);
              const active = selectedArea?.key === area.key;
              return (
                <button
                  key={area.key}
                  type="button"
                  className={`ayna-calm-ecosystem__node${active ? ' is-active' : ''}`}
                  style={{ ...position, '--ayna-node-accent': AREA_ACCENTS[index % AREA_ACCENTS.length] }}
                  onClick={() => setSelectedKey(area.key)}
                  aria-pressed={active}
                >
                  <span className="ayna-calm-ecosystem__node-dot" />
                  <strong>{area.label}</strong>
                  <small>{area.products.length}</small>
                </button>
              );
            })}
          </div>
          <div className="ayna-calm-ecosystem__visual-footer">
            <span>{areas.length} active care areas</span>
            <button type="button" onClick={() => onExploreArea?.('')}>Add to ecosystem</button>
          </div>
        </div>

        <div className="ayna-calm-ecosystem__details">
          <div className="ayna-calm-ecosystem__details-heading">
            <div>
              <span className="ayna-calm-ecosystem__details-kicker">In your ecosystem</span>
              <h3>{selectedArea?.label}</h3>
            </div>
            <button type="button" onClick={() => onExploreArea?.(selectedArea)}>
              Explore more
            </button>
          </div>

          <div className="ayna-calm-ecosystem__product-list">
            {(selectedArea?.products || []).slice(0, 3).map((product) => (
              <ProductRow
                key={product?.id || product?.name}
                product={product}
                score={personalizedScore(product, quizResults, healthProfile)}
                onOpenProduct={onOpenProduct}
                onToggleProduct={onToggleProduct}
              />
            ))}
          </div>

          {(selectedArea?.products || []).length > 3 ? (
            <button type="button" className="ayna-calm-ecosystem__text-action" onClick={() => onExploreArea?.(selectedArea)}>
              See all {selectedArea.products.length} items
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export { AREAS as ECOSYSTEM_AREAS, CATEGORY_LABELS, resolveArea as resolveEcosystemProductArea };
