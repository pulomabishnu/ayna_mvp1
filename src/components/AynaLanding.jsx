import React, { useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import { handleImageErrorWithRetry } from '../utils/imageRetry';

/**
 * Landing page — a direct port of boards 1a and 1c of the Aug 2026 desktop
 * mockup ("Ayna Mockups").
 *
 *   1a  first-time visitor: gradient hero, search, "Tell us about your body
 *       once" band, then Shop.
 *   1c  returning user with an ecosystem: "Welcome back" hero with the
 *       ecosystem summary card, then a personalized Shop.
 *
 * The mockup's decision notes are what settle the shape here: the shop lives
 * on the landing page for everyone, the pre-ecosystem section is called Shop
 * (not "Curated for you"), and returning users get rebuild-or-browse rather
 * than being sent straight back into the quiz.
 *
 * Numbers below are the mockup's literal values, not the app's design tokens,
 * because the point is to reproduce those two boards.
 */

/** The eight products in board 1a's Shop grid, with the mockup's own category eyebrows. */
const SHOP_LINEUP = [
  { id: 'p-lola-pad', label: 'PADS' },
  { id: 'p-elvie-trainer', label: 'PELVIC FLOOR' },
  { id: 'p-wuka-underwear', label: 'PERIOD WEAR' },
  { id: 'p-b-complex', label: 'SUPPLEMENTS' },
  { id: 'p-silverette-cups', label: 'POSTPARTUM' },
  { id: 'p-neycher-vaginal-moisturizer', label: 'INTIMATE CARE' },
  { id: 'p-lola-tampon', label: 'TAMPONS' },
  { id: 'p-dame-arc', label: 'INTIMACY' },
];

const CHIPS = ['Postpartum recovery', 'Organic pads', 'Pelvic floor', 'Supplements for cramps'];

const SHOP_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'cycle', label: 'Cycle' },
  { key: 'postpartum', label: 'Postpartum' },
  { key: 'pelvic-floor', label: 'Pelvic floor' },
];

/** Which catalog categories each mockup filter pill covers. */
const FILTER_CATEGORIES = {
  cycle: ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief'],
  postpartum: ['postpartum', 'pregnancy'],
  'pelvic-floor': ['pelvic-floor'],
};

/**
 * Turn a free-text query into the discovery view's filter options, so the hero
 * search and the chips land on a pre-filtered feed instead of a raw text search.
 * Carried over from the previous hero — the routing rules are unchanged.
 */
function discoveryTargetFor(text) {
  const q = String(text || '').trim();
  if (!q) return '';
  const lower = q.toLowerCase();

  if (lower.includes('pad')) {
    const opts = { query: q, initialCategory: 'pad' };
    if (lower.includes('organic')) opts.initialPadPreference = 'organic';
    else if (lower.includes('overnight')) opts.initialPadUseCase = 'overnight';
    else if (lower.includes('heavy')) opts.initialPadFlow = 'heavy';
    return opts;
  }
  if (lower.includes('postpartum') || lower.includes('breastfeeding') || lower.includes('nursing')) {
    return { query: q, initialCategory: 'postpartum' };
  }
  if (lower.includes('prenatal') || (lower.includes('pregnancy') && !lower.includes('postpartum'))) {
    return { query: q, initialCategory: (lower.includes('prenatal') || lower.includes('vitamin')) ? 'supplement' : 'pregnancy' };
  }
  if (lower.includes('supplement')) {
    const opts = { query: q, initialCategory: 'supplement' };
    if (lower.includes('cramps')) opts.initialSymptom = 'cramps';
    else if (lower.includes('pcos')) opts.initialSymptom = 'pcos';
    return opts;
  }
  if (lower.includes('pelvic floor')) {
    return { query: q, initialCategory: 'pelvic-floor' };
  }
  return q;
}

function displayNameFromEmail(email) {
  if (!email) return '';
  const local = email.split('@')[0] || '';
  const first = local.split(/[.+_-]/)[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function productById(id) {
  return ALL_PRODUCTS.find((p) => p.id === id) || null;
}

/** Cream tile with the product photo, falling back to the mockup's initial-on-cream block. */
function ProductTile({ product, aspectRatio = 1, radius = 10, badge, showHeart }) {
  const [broken, setBroken] = useState(false);
  const src = broken ? '' : (product.image || '');
  const initial = String(product.name || '?').trim().charAt(0).toUpperCase();

  return (
    <div
      className="ayna-landing-tile"
      style={{
        aspectRatio: String(aspectRatio),
        borderRadius: `${radius}px`,
        background: 'linear-gradient(160deg, #F3EADC, #EFE3D2)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '12px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={(e) => handleImageErrorWithRetry(e, () => setBroken(true))}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '14px',
          }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: "400 40px 'Playfair Display', serif",
            color: '#D9A96B',
          }}
        >
          {initial}
        </span>
      )}

      {badge && (
        <span style={{
          position: 'relative',
          font: "500 9px 'DM Mono', monospace",
          letterSpacing: '0.08em',
          background: 'rgba(255,255,255,0.9)',
          padding: '5px 9px',
          borderRadius: '999px',
          color: '#B4732A',
        }}>
          {badge}
        </span>
      )}
      {showHeart && (
        <span aria-hidden style={{ position: 'relative', marginLeft: 'auto', fontSize: '12px', color: '#B49A78' }}>♡</span>
      )}
    </div>
  );
}

/** Board 1a's Shop grid: 4-up, cream tiles, DM Mono eyebrow, Playfair name, muted price. */
function ShopGrid({ items, onOpenProduct }) {
  return (
    <div className="ayna-landing-shop-grid">
      {items.map(({ product, label, badge }) => (
        <button
          key={product.id}
          type="button"
          className="ayna-landing-shop-card"
          onClick={() => onOpenProduct?.(product)}
        >
          <ProductTile product={product} badge={badge} />
          <div style={{
            font: "500 9.5px 'DM Mono', monospace",
            letterSpacing: '0.1em',
            color: '#C0761F',
            marginTop: '12px',
          }}>
            {label}
          </div>
          <div style={{
            font: "400 16px/1.3 'Playfair Display', serif",
            marginTop: '4px',
            color: '#171429',
          }}>
            {product.name}
          </div>
          <div style={{ fontSize: '12.5px', color: '#6f6880', marginTop: '3px' }}>
            {product.price}
          </div>
        </button>
      ))}
    </div>
  );
}

/** The mockup's 38×22 pill toggle. Off = grey track, knob left; on = knob right. */
function Toggle({ on, offTrack = '#DCD5CB', onTrack = '#242A52', onKnob = '#F0A84B', ...rest }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      tabIndex={0}
      {...rest}
      style={{
        width: '38px',
        height: '22px',
        borderRadius: '999px',
        background: on ? onTrack : offTrack,
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
        flex: 'none',
        transition: 'background 0.2s ease',
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: on ? '19px' : '3px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: on ? onKnob : '#fff',
        transition: 'left 0.2s ease, background 0.2s ease',
      }} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* 1c — returning user                                                 */
/* ------------------------------------------------------------------ */

function WelcomeBack({ user, myProducts, ecosystemCount, onStartQuiz, onViewDiscovery, onViewEcosystem, onOpenProduct }) {
  const name = displayNameFromEmail(user?.email) || 'there';

  const areas = useMemo(() => {
    const byCategory = new Map();
    Object.values(myProducts || {}).forEach((p) => {
      const key = p.category || 'other';
      byCategory.set(key, (byCategory.get(key) || 0) + 1);
    });
    return Array.from(byCategory.entries())
      .map(([category, count]) => ({
        category,
        label: String(CATEGORY_LABELS[category] || category).replace(/^[^\w]+\s*/, ''),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [myProducts]);

  const picks = useMemo(() => {
    const owned = Object.values(myProducts || {});
    const ownedIds = new Set(owned.map((p) => p.id));
    const chosen = [];
    owned.slice(0, 2).forEach((p) => chosen.push({ product: p, badge: 'IN YOUR ECOSYSTEM' }));
    SHOP_LINEUP.forEach(({ id }) => {
      if (chosen.length >= 4 || ownedIds.has(id)) return;
      const p = productById(id);
      if (p) chosen.push({ product: p, badge: 'MATCH' });
    });
    return chosen.slice(0, 4);
  }, [myProducts]);

  return (
    <div className="mockup-landing mockup-landing--returning">
      <section className="ayna-landing-hero ayna-landing-hero--returning">
        <div className="mockup-page ayna-landing-welcomeback">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="ayna-landing-eyebrow">Welcome back, {name}</div>
            <h1 className="ayna-landing-headline ayna-landing-headline--returning">
              Your ecosystem is{' '}
              <span style={{ fontStyle: 'italic', color: '#F0A84B' }}>
                {ecosystemCount} product{ecosystemCount === 1 ? '' : 's'}
              </span>{' '}
              strong.
            </h1>
            <p style={{
              fontSize: '16px',
              lineHeight: 1.55,
              color: 'rgba(244,240,250,0.78)',
              maxWidth: '420px',
              margin: 0,
            }}>
              Pick up where you left off. Rebuild it around a change, or keep browsing for what's next.
            </p>
            <div style={{ display: 'flex', gap: '13px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button type="button" className="ayna-landing-btn ayna-landing-btn--amber" onClick={onStartQuiz}>
                Rebuild my ecosystem
              </button>
              <button type="button" className="ayna-landing-btn ayna-landing-btn--ghost" onClick={() => onViewDiscovery?.('')}>
                Browse products
              </button>
            </div>
          </div>

          <button type="button" className="ayna-landing-ecocard" onClick={onViewEcosystem}>
            <div style={{
              font: "500 10px 'DM Mono', monospace",
              letterSpacing: '0.1em',
              color: 'rgba(244,240,250,0.6)',
            }}>
              YOUR ECOSYSTEM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
              {areas.map((a, i) => (
                <div
                  key={a.category}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: i === areas.length - 1 ? 'none' : '1px solid rgba(244,240,250,0.14)',
                  }}
                >
                  <span style={{ font: "400 15px 'Playfair Display', serif" }}>{a.label}</span>
                  <span style={{ fontSize: '11.5px', color: '#F0A84B' }}>
                    {a.count} {a.count === 1 ? 'pick' : 'picks'}
                  </span>
                </div>
              ))}
            </div>
          </button>
        </div>
      </section>

      <section className="ayna-landing-shop ayna-landing-shop--returning">
        <div className="mockup-page">
          <div className="ayna-landing-shop-head">
            <div className="ayna-landing-shop-title ayna-landing-shop-title--returning">Shop</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px', color: '#6f6880' }}>
              Personalized to my ecosystem
              <Toggle on onTrack="#4E3866" onClick={onViewEcosystem} />
            </div>
          </div>
          <div className="ayna-landing-shop-grid ayna-landing-shop-grid--returning">
            {picks.map(({ product, badge }) => (
              <button
                key={product.id}
                type="button"
                className="ayna-landing-shop-card"
                onClick={() => onOpenProduct?.(product)}
              >
                <ProductTile product={product} aspectRatio={1.1} badge={badge} />
                <div style={{ font: "400 15px/1.3 'Playfair Display', serif", marginTop: '10px', color: '#171429' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6f6880', marginTop: '3px' }}>{product.price}</div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1a — first visit                                                    */
/* ------------------------------------------------------------------ */

function FirstVisitLanding({ onStartQuiz, onViewDiscovery, onOpenProduct, hasProfile, profileCategories }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [personalize, setPersonalize] = useState(false);

  const lineup = useMemo(
    () => SHOP_LINEUP
      .map(({ id, label }) => ({ product: productById(id), label }))
      .filter((x) => x.product),
    [],
  );

  const shown = useMemo(() => {
    let list = lineup;
    if (filter !== 'all') {
      const cats = FILTER_CATEGORIES[filter] || [];
      list = list.filter(({ product }) => cats.includes(product.category));
    }
    if (personalize && profileCategories?.length) {
      const rank = new Set(profileCategories);
      list = [...list].sort(
        (a, b) => (rank.has(b.product.category) ? 1 : 0) - (rank.has(a.product.category) ? 1 : 0),
      );
    }
    return list;
  }, [lineup, filter, personalize, profileCategories]);

  const submitSearch = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    onViewDiscovery?.(discoveryTargetFor(query));
  };

  return (
    <div className="mockup-landing">
      <section className="ayna-landing-hero">
        <div className="ayna-landing-hero-col">
          <div className="ayna-landing-eyebrow">Women&apos;s health, personalized</div>
          <h1 className="ayna-landing-headline">
            Care that&apos;s <span style={{ fontStyle: 'italic', color: '#F0A84B' }}>matched</span> to your body.
          </h1>
          <p className="ayna-landing-sub">
            Real research, doctor input, and other women&apos;s experiences. In one place.
          </p>

          <form className="ayna-landing-searchbar" onSubmit={submitSearch}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              aria-label="Search products"
            />
            <button type="submit">Search</button>
          </form>

          <div className="ayna-landing-chips">
            {CHIPS.map((chip) => (
              <button key={chip} type="button" onClick={() => onViewDiscovery?.(discoveryTargetFor(chip))}>
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="ayna-landing-band">
        <div className="mockup-page ayna-landing-band__inner">
          <div className="ayna-landing-band__copy">
            Tell us about your body once.
            <span>Six questions, and your shop rebuilds around you.</span>
          </div>
          <button type="button" className="ayna-landing-btn ayna-landing-btn--navy" onClick={onStartQuiz}>
            Build your ecosystem
          </button>
        </div>
      </section>

      <section className="ayna-landing-shop">
        <div className="mockup-page">
          <div className="ayna-landing-shop-head">
            <div className="ayna-landing-shop-title">Shop</div>
            <div className="ayna-landing-shop-controls">
              <div className="ayna-landing-filters">
                {SHOP_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={filter === f.key ? 'is-active' : undefined}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', fontSize: '12.5px', color: '#6f6880' }}>
                Personalize
                <Toggle
                  on={personalize}
                  onClick={() => {
                    if (!hasProfile) { onStartQuiz?.(); return; }
                    setPersonalize((v) => !v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    if (!hasProfile) { onStartQuiz?.(); return; }
                    setPersonalize((v) => !v);
                  }}
                />
              </div>
            </div>
          </div>

          <ShopGrid items={shown} onOpenProduct={onOpenProduct} />
        </div>
      </section>
    </div>
  );
}

export default function AynaLanding({
  onStartQuiz,
  onViewDiscovery,
  onOpenProduct,
  onViewEcosystem,
  user,
  myProducts,
  ecosystemCount = 0,
  hasProfile = false,
  profileCategories,
}) {
  if (user && ecosystemCount > 0) {
    return (
      <WelcomeBack
        user={user}
        myProducts={myProducts}
        ecosystemCount={ecosystemCount}
        onStartQuiz={onStartQuiz}
        onViewDiscovery={onViewDiscovery}
        onViewEcosystem={onViewEcosystem}
        onOpenProduct={onOpenProduct}
      />
    );
  }

  return (
    <FirstVisitLanding
      onStartQuiz={onStartQuiz}
      onViewDiscovery={onViewDiscovery}
      onOpenProduct={onOpenProduct}
      hasProfile={hasProfile}
      profileCategories={profileCategories}
    />
  );
}
