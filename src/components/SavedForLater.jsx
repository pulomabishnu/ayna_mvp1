import React, { useMemo, useState } from 'react';
import {
  CATEGORY_LABELS,
  getProfileMatchPercentForProduct,
  getRecommendationMatchesAndRest,
  getRecommendations,
} from '../data/products';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import { SAVED_FILTERS, buildSavedEntries, countSavedFilters, matchesSavedFilter } from '../utils/savedItems';
import { hasProfileSignal } from '../utils/whyMatch';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import MatchGauge from './MatchGauge';
import './savedForLater.css';

function eyebrowFor(product) {
  return String(CATEGORY_LABELS[product.category] || product.category || 'Product')
    .replace(/^[^\w]+\s*/, '')
    .toUpperCase();
}

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="wishlist-heart-icon">
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

function ProductLink({ product, onOpenProduct, className, children }) {
  return (
    <a
      className={className}
      href={productHref(product)}
      onClick={(e) => {
        if (!isPlainLeftClick(e)) return;
        e.preventDefault();
        onOpenProduct?.(product);
      }}
    >
      {children}
    </a>
  );
}

function StatusBadge({ inEcosystem }) {
  return (
    <span className={`saved-badge ${inEcosystem ? 'saved-badge--eco' : 'saved-badge--new'}`}>
      {inEcosystem ? 'In ecosystem' : 'Not tried'}
    </span>
  );
}

// Same check as the product page's Safety note (hasFlaggedRecall): a concern
// already written in the catalog's recall/safety text. Never shown as an
// all-clear when we simply have no data.
function RecallChip() {
  return <span className="saved-recall">Safety note</span>;
}

function EcosystemAction({ item, inEcosystem, onAddToEcosystem, variant = 'link' }) {
  if (inEcosystem) {
    return <span className={`saved-eco saved-eco--${variant} is-in`}>In your ecosystem</span>;
  }
  return (
    <button
      type="button"
      className={`saved-eco saved-eco--${variant}`}
      onClick={() => onAddToEcosystem?.(item)}
    >
      Add to ecosystem
    </button>
  );
}

function SavedItem({ entry, matchPercent, onOpenProduct, onToggleSaved, onAddToEcosystem }) {
  const { item, product, inEcosystem, flagged } = entry;
  return (
    <article className="saved-item">
      <ProductLink product={product} onOpenProduct={onOpenProduct} className="saved-item__link">
        <div className="saved-item__tile">
          <ProductTileImage product={product} alt={product.name} letterNode={<ProductImageFallback />} />
          <StatusBadge inEcosystem={inEcosystem} />
          {matchPercent != null && (
            <span className="saved-item__gauge saved-match-percent">
              <MatchGauge percent={matchPercent} size={34} theme="light" />
            </span>
          )}
        </div>
        <div className="saved-item__eyebrow">{eyebrowFor(product)}</div>
        <h3 className="saved-item__name">{product.name}</h3>
        {product.price && <div className="saved-item__price">{product.price}</div>}
      </ProductLink>

      <button
        type="button"
        className="saved-heart"
        aria-label={`Remove ${product.name} from wishlist`}
        onClick={() => onToggleSaved?.(item)}
      >
        <HeartIcon filled />
      </button>

      <div className="saved-item__foot">
        {flagged && <RecallChip />}
        <EcosystemAction item={item} inEcosystem={inEcosystem} onAddToEcosystem={onAddToEcosystem} />
      </div>
    </article>
  );
}

function SingleSavedHero({ entry, matchPercent, onOpenProduct, onToggleSaved, onAddToEcosystem, onBrowse }) {
  const { item, product, inEcosystem, flagged } = entry;
  const blurb = String(product.summary || product.description || product.tagline || '').trim();
  return (
    <article className="saved-hero">
      <div className="saved-hero__media">
        <ProductLink product={product} onOpenProduct={onOpenProduct} className="saved-hero__tile">
          <ProductTileImage product={product} alt={product.name} letterNode={<ProductImageFallback />} />
        </ProductLink>
        <button
          type="button"
          className="saved-heart saved-heart--lg"
          aria-label={`Remove ${product.name} from wishlist`}
          onClick={() => onToggleSaved?.(item)}
        >
          <HeartIcon filled />
        </button>
        {matchPercent != null && (
          <span className="saved-hero__gauge saved-match-percent">
            <MatchGauge percent={matchPercent} size={54} theme="light" />
          </span>
        )}
      </div>
      <div className="saved-hero__body">
        <div className="saved-item__eyebrow">{eyebrowFor(product)}</div>
        <div className="saved-hero__titlerow">
          <ProductLink product={product} onOpenProduct={onOpenProduct} className="saved-hero__name">
            {product.name}
          </ProductLink>
          {product.price && <div className="saved-hero__price">{product.price}</div>}
        </div>
        {blurb && <p className="saved-hero__blurb">{blurb}</p>}
        <div className="saved-hero__chips">
          <StatusBadge inEcosystem={inEcosystem} />
          {flagged && <RecallChip />}
        </div>
        <div className="saved-hero__actions">
          <EcosystemAction item={item} inEcosystem={inEcosystem} onAddToEcosystem={onAddToEcosystem} variant="pill" />
          {onBrowse && (
            <button type="button" className="saved-ghost" onClick={onBrowse}>Browse more</button>
          )}
        </div>
        <p className="saved-hero__private">Saves are private. Only you see this list.</p>
      </div>
    </article>
  );
}

function EmptyState({ suggestions, suggestionsArePersonal, onBrowse, onOpenProduct, onToggleSaved }) {
  return (
    <div className="saved-empty">
      <div className="saved-empty__intro">
        <div className="saved-empty__icon" aria-hidden="true">
          <HeartIcon />
        </div>
        <h3 className="saved-empty__title">Nothing saved yet.</h3>
        <p className="saved-empty__text">Tap the heart on any product to keep it here for later.</p>
        {onBrowse && (
          <button type="button" className="saved-eco saved-eco--pill" onClick={onBrowse}>Browse products</button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="saved-empty__suggest">
          <div className="saved-empty__label">
            {suggestionsArePersonal ? 'Matches from your profile' : 'A few from the catalog'}
          </div>
          <ul className="saved-empty__list">
            {suggestions.map(({ product, matchPercent: pct }) => {
              return (
                <li key={product.id} className="saved-suggest">
                  <ProductLink product={product} onOpenProduct={onOpenProduct} className="saved-suggest__link">
                    <span className="saved-suggest__tile">
                      <ProductTileImage product={product} alt="" letterNode={<ProductImageFallback />} />
                    </span>
                    <span className="saved-suggest__copy">
                      <span className="saved-item__eyebrow">{eyebrowFor(product)}</span>
                      <span className="saved-suggest__name">{product.name}</span>
                      {product.price && <span className="saved-item__price">{product.price}</span>}
                    </span>
                    {pct != null && (
                      <span className="saved-match-percent saved-suggest__gauge">
                        <MatchGauge percent={pct} size={32} theme="light" />
                      </span>
                    )}
                  </ProductLink>
                  {onToggleSaved && (
                    <button
                      type="button"
                      className="saved-heart saved-heart--inline"
                      aria-label={`Save ${product.name} to wishlist`}
                      onClick={() => onToggleSaved(product)}
                    >
                      <HeartIcon />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

const SUGGESTION_COUNT = 3;

export default function SavedForLater({
  savedProducts = {},
  myProducts = {},
  onOpenProduct,
  onToggleSaved,
  onAddToEcosystem,
  onBrowse,
  // Optional: same profile inputs ProductModal uses, so per-item match % here
  // is the exact number shown on each product page.
  quizResults = null,
  healthProfile = null,
}) {
  const [filter, setFilter] = useState('all');

  const entries = useMemo(() => buildSavedEntries(savedProducts, myProducts), [savedProducts, myProducts]);
  const counts = useMemo(() => countSavedFilters(entries), [entries]);
  const matchById = useMemo(() => {
    const map = new Map();
    for (const { item, product } of entries) {
      map.set(item.id, getProfileMatchPercentForProduct(product, quizResults, healthProfile));
    }
    return map;
  }, [entries, quizResults, healthProfile]);

  const isEmpty = entries.length === 0;
  const isSingle = entries.length === 1;

  // Real catalog picks for the empty state: the engine's positive matches
  // when there's a profile, otherwise the first few eligible catalog items.
  const { suggestions, suggestionsArePersonal } = useMemo(() => {
    if (!isEmpty) return { suggestions: [], suggestionsArePersonal: false };
    if (hasProfileSignal(quizResults, healthProfile)) {
      const { matches } = getRecommendationMatchesAndRest(quizResults, healthProfile);
      if (matches.length > 0) {
        return {
          suggestions: matches.slice(0, SUGGESTION_COUNT).map((product) => ({
            product,
            matchPercent: getProfileMatchPercentForProduct(product, quizResults, healthProfile),
          })),
          suggestionsArePersonal: true,
        };
      }
    }
    return {
      suggestions: getRecommendations({}, null).slice(0, SUGGESTION_COUNT).map((product) => ({ product, matchPercent: null })),
      suggestionsArePersonal: false,
    };
  }, [isEmpty, quizResults, healthProfile]);

  // The chips only render with 2+ saves; a single-save hero always shows everything.
  const activeFilter = isSingle ? 'all' : filter;
  const visible = entries.filter((entry) => matchesSavedFilter(entry, activeFilter));

  return (
    <section id="ayna-wishlist" className="eco-saved mockup-page wishlist-section saved-page">
      <div className="eco-saved__head saved-page__head">
        <div className="eco-saved__title">Wishlist</div>
        {!isEmpty && (
          <div className="saved-page__count">{entries.length} saved</div>
        )}
      </div>

      {!isEmpty && !isSingle && (
        <div className="saved-chips" role="group" aria-label="Filter wishlist">
          {SAVED_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`saved-chip${activeFilter === f.key ? ' is-active' : ''}${counts[f.key] === 0 ? ' is-empty' : ''}`}
              aria-pressed={activeFilter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="saved-chip__count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          suggestions={suggestions}
          suggestionsArePersonal={suggestionsArePersonal}
          onBrowse={onBrowse}
          onOpenProduct={onOpenProduct}
          onToggleSaved={onToggleSaved}
        />
      ) : isSingle ? (
        <SingleSavedHero
          entry={entries[0]}
          matchPercent={matchById.get(entries[0].item.id) ?? null}
          onOpenProduct={onOpenProduct}
          onToggleSaved={onToggleSaved}
          onAddToEcosystem={onAddToEcosystem}
          onBrowse={onBrowse}
        />
      ) : visible.length === 0 ? (
        <p className="saved-page__none">Nothing saved under this filter.</p>
      ) : (
        <div className="saved-grid">
          {visible.map((entry) => (
            <SavedItem
              key={entry.item.id}
              entry={entry}
              matchPercent={matchById.get(entry.item.id) ?? null}
              onOpenProduct={onOpenProduct}
              onToggleSaved={onToggleSaved}
              onAddToEcosystem={onAddToEcosystem}
            />
          ))}
        </div>
      )}
    </section>
  );
}
