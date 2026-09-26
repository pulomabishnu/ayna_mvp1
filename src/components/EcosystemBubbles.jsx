import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_PRODUCTS,
  CATEGORY_LABELS,
  MACRO_GROUPS,
  productSearchText,
  getProfileMatchLabelsForProduct,
  getRecommendationExplanation,
} from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

const CURRENT_CATEGORY_BY_ID = new Map(ALL_PRODUCTS.map((product) => [product.id, product.category]));
const WEAK_FALLBACK_KEYWORDS = new Set(['cycle']);
const MAX_AREAS = 5;

const AREAS = [
  ...MACRO_GROUPS.filter((group) => group.id !== 'all').map((group) => ({ key: group.id, label: group.label, categories: group.categories })),
  { key: 'care', label: 'Clinicians', categories: ['telehealth'] },
  { key: 'supplements', label: 'Supplements', categories: ['supplement'] },
];

// Small rotating accent palette for the dot next to the selected area's name
// in the product card — the orbit-mockup reference hardcoded a tint per
// (fixed, 3-area) example; our areas are dynamic, so this cycles instead.
const AREA_TINTS = ['#E9C9D6', '#CBC3E8', '#F6D7B0', '#BFE0D6', '#F3B8B0', '#C9DCEE'];

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

// Same circular-orbit math the reference mockup uses: seats spread evenly
// around the ring, slowly rotating (phase), each with a small independent
// vertical "breathing" bob so they don't move in lockstep.
function seatPosition(index, total, phase, t, reduceMotion) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 4 + phase;
  const bob = reduceMotion ? 0 : Math.sin(t / 900 + index * 1.7) * 0.6;
  return { x: 50 + 38 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) + bob };
}

function ProductVisual({ product }) {
  return (
    <div style={{ width: 68, height: 68, borderRadius: 18, background: '#FFFCF9', padding: 8, display: 'grid', placeItems: 'center', flex: 'none' }}>
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
  const scores = useMemo(
    () => Object.values(myProducts || {}).map((product) => personalizedScore(product, quizResults, healthProfile)).filter(Number.isFinite),
    [myProducts, quizResults, healthProfile],
  );

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

  // Orbit seats: real areas + one synthetic "add more" seat, capped the same
  // way the bubble list was before.
  const seatDefs = useMemo(() => {
    const real = areas.map((area, i) => ({ key: area.key, label: area.label, count: `${area.products.length} pick${area.products.length === 1 ? '' : 's'}`, tint: AREA_TINTS[i % AREA_TINTS.length], add: false }));
    if (areas.length < MAX_AREAS) real.push({ key: '__add-more__', label: '+', count: 'add more', tint: null, add: true });
    return real;
  }, [areas]);

  const orbitRef = useRef(null);
  const phaseRef = useRef(0);
  const pausedRef = useRef(false);
  const lastRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    function tick(t) {
      const dt = lastRef.current ? Math.min(t - lastRef.current, 50) : 0;
      lastRef.current = t;
      const speed = reduceMotion ? 0 : (pausedRef.current ? 0.15 : 1);
      phaseRef.current += dt * 0.000045 * speed * Math.PI * 2 / 6;
      const root = orbitRef.current;
      if (root) {
        const seatEls = root.querySelectorAll('[data-seat]');
        const n = seatEls.length;
        seatEls.forEach((el, i) => {
          const p = seatPosition(i, n, phaseRef.current, t, reduceMotion);
          el.style.left = `${p.x}%`;
          el.style.top = `${p.y}%`;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Deterministic "starfield" — stable across renders (seeded, not Math.random).
  const stars = useMemo(() => Array.from({ length: 22 }, (_, i) => {
    const r = (n) => { const x = Math.sin(i * 928.37 + n * 17.13) * 10000; return x - Math.floor(x); };
    return { x: (r(1) * 96 + 2).toFixed(1), y: (r(2) * 96 + 2).toFixed(1), size: r(3) > 0.8 ? 4 : 2, o: (0.25 + r(4) * 0.5).toFixed(2) };
  }), []);

  const selTint = selectedArea ? AREA_TINTS[Math.max(0, areas.findIndex((a) => a.key === selectedArea.key)) % AREA_TINTS.length] : '#F0A84B';

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFCF9',
        fontFamily: "'DM Sans',system-ui,sans-serif",
        background: 'radial-gradient(ellipse 60% 55% at 78% 45%, rgba(122,78,110,.55), transparent 70%), radial-gradient(ellipse 50% 45% at 100% 100%, rgba(162,96,60,.45), transparent 70%), radial-gradient(ellipse 45% 40% at 0% 0%, rgba(36,42,82,.9), transparent 70%), linear-gradient(135deg,#262b52 0%,#33305c 40%,#48355f 70%,#6a4659 100%)',
      }}
    >
      <div style={{ maxWidth: 1420, width: '100%', margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(20px,5vw,64px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 'clamp(20px,3vw,40px)', alignItems: 'center' }}>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div style={{ font: "500 12px 'DM Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#E39A5E' }}>Your ecosystem</div>
          <h1 style={{ margin: 0, font: "500 clamp(26px,3.2vw,42px)/1.12 'Playfair Display',Georgia,serif", letterSpacing: '-.02em', color: '#FFFCF9' }}>
            hi, {name}. this is your <em style={{ fontStyle: 'italic', fontWeight: 500, color: '#F0A84B' }}>health universe.</em>
          </h1>
          <p style={{ margin: 0, maxWidth: 540, fontSize: 14, lineHeight: 1.5, color: 'rgba(255,252,249,.78)' }}>
            Each bubble is an area of care. Tap one to see what&apos;s in it, why it was matched, and your personalized product score.
          </p>

          {selectedProduct ? (
            <article style={{ maxWidth: 600, borderRadius: 20, padding: 14, background: 'rgba(255,252,249,.07)', border: '1px solid rgba(255,252,249,.14)', boxShadow: '0 24px 60px rgba(20,16,40,.25)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: selTint, boxShadow: '0 0 0 4px rgba(255,252,249,.08)' }} />
                  <span style={{ font: "500 11px 'DM Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#FFEFD6' }}>
                    {selectedArea?.label} · {safeIndex + 1} of {selectedProducts.length}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={previousProduct} disabled={selectedProducts.length <= 1} aria-label="Previous product" style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,252,249,.2)', background: 'transparent', color: '#FFFCF9', cursor: 'pointer', fontSize: 14, display: 'grid', placeItems: 'center' }}>‹</button>
                  <button type="button" onClick={nextProduct} disabled={selectedProducts.length <= 1} aria-label="Next product" style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,252,249,.2)', background: 'transparent', color: '#FFFCF9', cursor: 'pointer', fontSize: 14, display: 'grid', placeItems: 'center' }}>›</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '68px minmax(0,1fr)', gap: 14, alignItems: 'center' }}>
                <ProductVisual product={selectedProduct} />
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => onOpenProduct?.(selectedProduct)}
                    style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', color: '#FFFCF9', font: "500 clamp(15px,1.3vw,18px)/1.2 'Playfair Display',Georgia,serif" }}
                  >
                    {selectedProduct.name}
                  </button>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,252,249,.7)' }}>{CATEGORY_LABELS[selectedProduct?.category] || selectedArea?.label} · matched to your saved preferences</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                    {score != null && <span style={{ font: "500 11px 'DM Mono',monospace", color: '#242A52', background: '#F0A84B', borderRadius: 999, padding: '4px 9px' }}>ayna score {score}/100</span>}
                    <button type="button" onClick={() => setWhyOpen((v) => !v)} style={{ border: 0, background: 'transparent', color: '#FFFCF9', padding: 0, cursor: 'pointer', fontSize: 12.5, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                      {whyOpen ? 'hide why' : 'why this?'}
                    </button>
                  </div>
                </div>
              </div>
              {whyOpen && (
                <div style={{ borderTop: '1px solid rgba(255,252,249,.12)', paddingTop: 8, fontSize: 12.5, lineHeight: 1.5, color: 'rgba(255,252,249,.82)', maxHeight: 120, overflowY: 'auto' }}>
                  {whyText}
                  {explanation?.considerations && <div style={{ marginTop: 5, fontSize: 11.5, color: 'rgba(255,252,249,.55)' }}>{explanation.considerations}</div>}
                  <div style={{ marginTop: 5, fontSize: 11.5, color: 'rgba(255,252,249,.55)' }}>Match explanations are relevance signals, not medical advice.</div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    <button type="button" onClick={() => onExploreArea?.(selectedArea)} style={{ border: 0, background: 'transparent', color: '#F0A84B', padding: 0, cursor: 'pointer', fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 3 }}>swap</button>
                    {onToggleProduct && <button type="button" onClick={() => onToggleProduct(selectedProduct)} style={{ border: 0, background: 'transparent', color: '#F0A84B', padding: 0, cursor: 'pointer', fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 3 }}>remove</button>}
                  </div>
                </div>
              )}
            </article>
          ) : (
            <article style={{ maxWidth: 600, borderRadius: 20, padding: 16, background: 'rgba(255,252,249,.07)', border: '1px solid rgba(255,252,249,.14)' }}>
              <strong style={{ font: "500 16px 'Playfair Display',Georgia,serif" }}>nothing here yet.</strong>
              <p style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,252,249,.75)' }}>Add a product and it will show up here with its match context.</p>
            </article>
          )}

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span><strong style={{ font: "500 16px 'Playfair Display',Georgia,serif" }}>{Object.keys(myProducts || {}).length}</strong> <small style={{ fontSize: 12, color: 'rgba(255,252,249,.6)' }}>products saved</small></span>
            <span><strong style={{ font: "500 16px 'Playfair Display',Georgia,serif" }}>{areas.length}</strong> <small style={{ fontSize: 12, color: 'rgba(255,252,249,.6)' }}>care areas</small></span>
            <span><strong style={{ font: "500 16px 'Playfair Display',Georgia,serif" }}>{scores.length ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length) : '—'}</strong> <small style={{ fontSize: 12, color: 'rgba(255,252,249,.6)' }}>average ayna score</small></span>
          </div>
        </section>

        <section style={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <div
            ref={orbitRef}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
            style={{ position: 'relative', width: 'min(400px,86%)', aspectRatio: '1', containerType: 'inline-size' }}
          >
            <div style={{ position: 'absolute', inset: '4%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,189,199,.10) 0%, rgba(201,189,199,.04) 45%, transparent 70%)' }} />
            <div style={{ position: 'absolute', inset: '12%', borderRadius: '50%', border: '1.5px dashed rgba(255,239,214,.22)' }} />
            <div style={{ position: 'absolute', inset: '30%', borderRadius: '50%', border: '1px solid rgba(255,239,214,.08)' }} />

            {stars.map((s, i) => (
              <span key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, borderRadius: '50%', background: '#FFEFD6', opacity: s.o }} />
            ))}

            <div style={{ position: 'absolute', left: '50%', top: '50%', width: '30%', aspectRatio: '1', transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'linear-gradient(160deg, #FFEFD6 0%, #F3C28A 35%, #D98A6A 70%, #8C5A78 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#2a2346', zIndex: 2 }}>
              <strong style={{ font: "600 clamp(20px,5cqw,34px)/1 'Playfair Display',Georgia,serif" }}>{name}</strong>
              <span style={{ font: "500 clamp(9px,1.8cqw,11px) 'DM Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase' }}>{areas.length} areas covered</span>
            </div>

            {seatDefs.map((seat, i) => {
              const active = !seat.add && selectedArea?.key === seat.key;
              const initial = seatPosition(i, seatDefs.length, 0, 0, true);
              return (
                <button
                  key={seat.key}
                  type="button"
                  data-seat={i}
                  onClick={() => (seat.add ? onExploreArea?.({ key: '__add-more__', label: 'Add more', gap: true }) : setSelectedKey(seat.key))}
                  aria-pressed={active}
                  style={{
                    position: 'absolute',
                    left: `${initial.x}%`,
                    top: `${initial.y}%`,
                    width: '21%',
                    aspectRatio: '1',
                    transform: 'translate(-50%,-50%)',
                    borderRadius: '50%',
                    border: active ? '3px solid #F0A84B' : (seat.add ? '1.5px dashed rgba(255,239,214,.4)' : '0'),
                    background: seat.add ? 'rgba(255,252,249,.03)' : '#FFFCF9',
                    boxShadow: active ? '0 0 0 6px rgba(240,168,75,.18)' : 'none',
                    color: seat.add ? '#FFEFD6' : '#2a2346',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    zIndex: 3,
                    transition: 'box-shadow .3s, background .3s',
                  }}
                >
                  <span style={{ font: `500 clamp(12px,2.5cqw,16px)/1 ${seat.add ? "'DM Sans',sans-serif" : "'Playfair Display',Georgia,serif"}` }}>{seat.label}</span>
                  <span style={{ font: "500 clamp(9px,1.7cqw,11px) 'DM Mono',monospace", letterSpacing: '.06em', padding: '3px 8px', borderRadius: 999, background: seat.add ? 'transparent' : 'rgba(255,252,249,.55)' }}>{seat.count}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}

export { AREAS as ECOSYSTEM_AREAS, CATEGORY_LABELS, resolveArea as resolveEcosystemProductArea };
