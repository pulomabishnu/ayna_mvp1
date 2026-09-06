import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import SubscriptionPaywallModal from './SubscriptionPaywallModal';
import {
    ALL_PRODUCTS,
    getEcosystemAlternatives,
    getRecommendationExplanation,
} from '../data/products';
import ProductTileImage, { resolveCatalogProductImage, ProductImageFallback } from './ProductTileImage';
import CareNearYouPanel from './CareNearYouPanel';
import EcosystemBubbles, { ECOSYSTEM_AREAS, resolveEcosystemProductArea } from './EcosystemBubbles';
import EcosystemShelf from './EcosystemShelf';
import LlmRecommendationsLoadingBlock from './LlmRecommendationsLoadingBlock';
import { generateTieredRecommendations } from '../utils/recommendationEngine';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import {
    fetchLlmRecommendations,
    buildIdFromFingerprint,
    loadLearningMemory,
    saveLearningMemory,
    fingerprintIntake,
    loadCachedLlmRecommendations,
    saveCachedLlmRecommendations,
    loadFetchedLlmFingerprint,
    saveFetchedLlmFingerprint,
} from '../utils/fetchLlmRecommendations';
import { resolveProductImage, isPlaceholderProductImage, safeProductImageSrc } from '../utils/resolveProductImage';
import { getPricePerUnitLabel } from '../utils/pricePerUnit';
import { deriveBrandSearchContext } from '../utils/productBrandContext.js';
import { getSupabaseClient } from '../utils/supabaseClient';
import {
    subscribeToGeneration,
    notifyGeneration,
    discardGeneration,
    activeGenerations,
    GENERATION_ABANDON_GRACE_MS,
} from '../utils/ecosystemGenerationStore';
import { loadPhoneNumberForUser } from '../utils/phoneNumberStore';
import posthog from 'posthog-js';

// Ecosystem products are stored as a full snapshot of the product object at
// the moment they're added (toggleMyProduct in App.jsx), not a live ID
// reference — see ProductTileImage.jsx (shared with SavedForLater.jsx,
// EcosystemShelf.jsx, TrackedItems.jsx, Comparison.jsx, Recalls.jsx,
// OmittedProducts.jsx, AynaLanding.jsx, Recommendations.jsx — every place
// that renders one of these snapshots) for the full history of why a
// synchronous catalog lookup alone isn't enough and a live resolution
// fallback is needed too.

const AYNA_SMS_NUMBER = import.meta.env.VITE_AYNA_SMS_NUMBER || '';
const SMS_CARD_DISMISS_KEY = 'ayna_sms_card_dismissed_at';
const SMS_CARD_RESHOWN_KEY = 'ayna_sms_card_last_reshown_at';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Sidebar area-breakdown bar/legend colors, in the order shelfAreaBreakdown
// sorts by count (largest first) — real design tokens (index.css), not new colors.
const SHELF_AREA_COLORS = ['var(--color-navy)', 'var(--color-plum)', 'var(--color-terracotta)', 'var(--color-amber)', 'var(--color-amber-deep)'];

const SYNC_SOURCES = [
  { id: 'apple-health', label: 'Apple Health' },
  { id: 'strava', label: 'Strava' },
  { id: 'garmin', label: 'Garmin' },
  { id: 'flo', label: 'Flo' },
  { id: 'whoop', label: 'Whoop' },
  { id: 'oura', label: 'Oura Ring' },
  { id: 'google-fit', label: 'Google Fit' },
];

// Clicking "Swap" on a product, or an area bubble, used to always land on
// unfiltered Browse — the specific area clicked was received then discarded
// (found live, 2026-08-24 bug bash: "Sleep" showed tampons and supplements,
// nothing sleep-related). An area with more than one underlying catalog
// category (e.g. "Period" covers pads/tampons/cups/discs/...) maps to
// Discovery's broader initialMacroGroup, so every category in it stays
// visible; a single-category area (Clinicians -> telehealth, Supplements ->
// supplement — EcosystemBubbles' own additions, not real MACRO_GROUPS
// entries) maps to the narrower initialCategory instead, since there's only
// one real thing to show either way.
function exploreAreaOptions(area) {
  const categories = Array.isArray(area?.categories) ? area.categories : [];
  if (categories.length > 1) return { initialMacroGroup: area.key };
  if (categories.length === 1) return { initialCategory: categories[0] };
  return '';
}

function buildAynaVCardDataUri(phoneNumber) {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Ayna',
    `TEL;TYPE=CELL:${phoneNumber}`,
    'END:VCARD',
  ].join('\n');
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;
}

const CONCERN_LABEL_MAP = {
  'period care (pads, tampons, cups, discs, underwear)': 'Period Care',
  'cramp and pain relief (devices, supplements, heat)': 'Cramp & Pain Relief',
  'hormone balance (supplements, lifestyle)': 'Hormone Balance',
  'hormonal bloating': 'Hormonal Bloating',
  'pcos management (supplements, telehealth, apps)': 'PCOS Management',
  'endometriosis management (supplements, devices, telehealth)': 'Endometriosis Support',
  'fertility and conception (supplements, trackers, telehealth)': 'Fertility & Conception',
  'uti support': 'UTI Support',
  'sti support': 'STI Support',
  'gut and vaginal health (probiotics, ph balance)': 'Gut & Vaginal Health',
  'perimenopause and menopause support': 'Perimenopause & Menopause',
  'sexual health and comfort (lubricants, pelvic floor)': 'Sexual Health & Comfort',
  'mental health and cycle mood support': 'Mental Health & Cycle Mood',
  'sleep and energy': 'Sleep & Energy',
  'skin and hair (hormone-related)': 'Skin & Hair',
  'telehealth and provider matching': 'Telehealth & Provider Matching',
  'find safer products': 'Safer Products',
  'manage symptoms': 'Symptom Management',
  'track my cycle': 'Cycle Tracking',
  'understand my condition': 'Understanding My Condition',
  'find a provider or specialist': 'Provider Matching',
  'build my health routine': 'Building a Health Routine',
  'reduce chemical exposure': 'Reducing Chemical Exposure',
  'support fertility / ttc': 'Fertility Support',
  'manage perimenopause or menopause': 'Perimenopause & Menopause',
  'improve my gut or vaginal health': 'Gut & Vaginal Health',
  'find mental health support for cycle symptoms': 'Mental Health Support',
  'learn what ingredients to avoid for my conditions': 'Ingredient Safety',
};

function normalizeConcernLabel(raw) {
  if (!raw) return raw;
  const key = String(raw).toLowerCase().trim();
  if (CONCERN_LABEL_MAP[key]) return CONCERN_LABEL_MAP[key];
  // Keyword fallback for LLM-embellished variants
  if (key.includes('routine') || key.includes('build my health') || key.includes('apps and services')) return 'Building a Health Routine';
  if (key.includes('pcos') || key.includes('polycystic')) return 'PCOS Management';
  if (key.includes('endometriosis') || key.includes('endo')) return 'Endometriosis Support';
  if (key.includes('hormone balance') || key.includes('hormonal bloating')) return 'Hormone Balance';
  if (key.includes('period care') || key.includes('menstrual')) return 'Period Care';
  if (key.includes('cramp') || key.includes('pain relief')) return 'Cramp & Pain Relief';
  if (key.includes('fertil') || key.includes('ttc') || key.includes('conception')) return 'Fertility & Conception';
  if (key.includes('menopause') || key.includes('perimenopause')) return 'Perimenopause & Menopause';
  if (key.includes('vaginal') || key.includes('gut health') || key.includes('probiotic')) return 'Gut & Vaginal Health';
  if (key.includes('uti') || key.includes('urinary')) return 'UTI Support';
  if (key.includes('mental health') || key.includes('mood')) return 'Mental Health & Cycle Mood';
  if (key.includes('sleep') || key.includes('energy') || key.includes('fatigue')) return 'Sleep & Energy';
  if (key.includes('skin') || key.includes('hair') || key.includes('acne')) return 'Skin & Hair';
  if (key.includes('telehealth') || key.includes('provider') || key.includes('specialist')) return 'Telehealth & Provider Matching';
  if (key.includes('sexual health') || key.includes('pelvic floor') || key.includes('lubricant')) return 'Sexual Health & Comfort';
  if (key.includes('safer') || key.includes('ingredient') || key.includes('chemical')) return 'Safer Products';
  if (key.includes('cycle tracking') || key.includes('track my cycle')) return 'Cycle Tracking';
  return raw;
}

/** Full card for “By function” ecosystem grid: image (letter-tile fallback), brand, summary, price, health function, Details + Remove */
function EcosystemFunctionProductCard({
    product,
    healthFunctionLabel,
    onOpenProduct,
    onToggleProduct,
    seedEntry,
    quizResults,
    healthProfile,
    onSwapSeedProduct,
    onGoToSearch,
    precomputedAlternatives = [],
    isInEcosystem = false,
    recommendationReason = '',
    concernLabel = '',
}) {
    const [imgError, setImgError] = useState(false);
    const [resolvedCardImage, setResolvedCardImage] = useState('');
    const [triedResolveFallback, setTriedResolveFallback] = useState(false);
    const perUnitPrice = getPricePerUnitLabel(product);
    const { brandName } = deriveBrandSearchContext(product);
    const brandDisplay = brandName || 'N/A';
    const rawSummary = (product.summary || '').trim();
    const summaryShort = rawSummary.length > 110 ? `${rawSummary.slice(0, 107)}…` : rawSummary;
    // resolvedCardImage came back from the server's type-aware
    // /api/product-image resolution — trust it as-is rather than re-running
    // it through isPlaceholderProductImage, which doesn't know the product
    // is 'digital' and would reject a legitimate app/telehealth logo again.
    // Same reasoning for the resolveCatalogProductImage(product) fallback below:
    // its own product.image can itself already be a server-resolved value
    // merged in by the caller (recommendedSwapByKey/tier.product rendering
    // above), and resolveCatalogProductImage() already gates its own catalog
    // lookups internally — wrapping the result in safeProductImageSrc again
    // re-applies the type-blind heuristic to that already-vetted value.
    const displayImage = resolvedCardImage || resolveCatalogProductImage(product) || '';

    useEffect(() => {
        setImgError(false);
        setResolvedCardImage('');
        setTriedResolveFallback(false);
    }, [product?.id, product?.image, product?.name, product?.brand]);

    const handleImageError = useCallback(() => {
        if (triedResolveFallback || !product?.name) {
            setImgError(true);
            return;
        }
        setTriedResolveFallback(true);
        resolveProductImage(product.name, product.brand || '', product.url || '', product.type || '').then((url) => {
            if (url) {
                setResolvedCardImage(url);
                setImgError(false);
                return;
            }
            setImgError(true);
        });
    }, [triedResolveFallback, product?.name, product?.brand]);

    return (
        <div
            className="card"
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '0.65rem',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-soft)',
                borderRadius: 'var(--radius-md)',
                overflow: 'visible',
            }}
        >
            {/* Concern label fixed at top so alternatives section never shifts it */}
            <div style={{ marginBottom: '0.35rem' }}>
                <span style={{
                    fontSize: '0.68rem', fontWeight: '700',
                    display: 'inline-block', maxWidth: '100%',
                    padding: '0.22rem 0.5rem',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-primary)', color: '#fff',
                }}>
                    {(concernLabel || healthFunctionLabel).replace(/\s*\(.*?\)/g, '').trim()}
                </span>
            </div>
            <div
                style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    maxHeight: '96px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--color-secondary-fade)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                    border: '1px solid var(--color-border)',
                }}
            >
                {imgError || !displayImage ? (
                    <ProductImageFallback />
                ) : (
                    <img
                        src={displayImage}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', boxSizing: 'border-box' }}
                        onError={handleImageError}
                    />
                )}
            </div>
            <h4 style={{ fontSize: '0.88rem', margin: '0 0 0.25rem', lineHeight: 1.25, color: 'var(--color-text-main)' }}>
                {product.name}
                {product.outOfBusiness && (
                    <span style={{ fontSize: '0.6rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-bg)', padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-pill)', marginLeft: '0.25rem', verticalAlign: 'middle' }}>
                        No longer sold
                    </span>
                )}
            </h4>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '0 0 0.35rem', fontWeight: '600' }}>{brandDisplay}</p>
            {summaryShort ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-main)', lineHeight: 1.4, margin: '0 0 0.5rem', flex: 1 }}>{summaryShort}</p>
            ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: '0 0 0.5rem', flex: 1 }}>No summary in database.</p>
            )}
            {recommendationReason ? (
                <p style={{ fontSize: '0.72rem', color: 'var(--color-primary-hover)', margin: '0 0 0.45rem', lineHeight: 1.35 }}>
                    <strong>Why this fits you:</strong> {recommendationReason}
                </p>
            ) : null}
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-primary)', marginBottom: perUnitPrice ? '0.1rem' : '0.35rem' }}>
                {product.price || product.stage || 'N/A'}
            </div>
            {perUnitPrice ? (
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>{perUnitPrice}</div>
            ) : null}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, minWidth: '72px', fontSize: '0.75rem', padding: '0.35rem 0.45rem' }}
                    onClick={() => onOpenProduct(product)}
                >
                    Details
                </button>
                <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1, minWidth: '72px', fontSize: '0.75rem', padding: '0.35rem 0.45rem' }}
                    onClick={() => onToggleProduct(product)}
                    title={isInEcosystem ? 'Remove from ecosystem' : 'Add to ecosystem'}
                >
                    {isInEcosystem ? 'Remove' : 'Add'}
                </button>
            </div>
            <EcosystemProductAlternatives
                product={product}
                seedEntry={seedEntry}
                quizResults={quizResults}
                healthProfile={healthProfile}
                onSwap={onSwapSeedProduct}
                onGoToSearch={onGoToSearch}
                precomputedAlternatives={precomputedAlternatives}
            />
        </div>
    );
}

function toConciseReason(text, fallback) {
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    const fb = String(fallback || '').trim();
    if (!raw) return fb;
    const firstSentence = raw.match(/[^.!?]+[.!?]?/);
    const candidate = (firstSentence ? firstSentence[0] : raw).trim();
    const maxLen = 135;
    if (candidate.length <= maxLen) return candidate;
    return `${candidate.slice(0, maxLen - 1).trim()}…`;
}

// Client-side mirror of api/llm-recommendations.js's PRESCRIPTION_DRUG_PATTERN —
// a defense-in-depth backstop for ecosystems generated before this filter
// existed (and cached), not just newly-generated ones. Keep these two lists
// in sync.
const PRESCRIPTION_DRUG_PATTERN = new RegExp(
    [
        '\\bprescription\\b', 'tranexamic', 'tranexemic', '\\blysteda\\b',
        // Hormonal birth control
        '\\byaz\\b', 'yasmin', '\\bjunel\\b', 'loestrin', 'ortho\\s*tri-?cyclen', '\\bsprintec\\b',
        'nuvaring', 'annovera', '\\bxulane\\b', '\\btwirla\\b', 'nexplanon', '\\bmirena\\b',
        'kyleena', '\\bskyla\\b', 'liletta', 'depo-?provera',
        // Hormone replacement therapy
        '\\bpremarin\\b', '\\bestrace\\b', 'prometrium', 'vivelle', 'climara', '\\bduavee\\b',
        'estring', 'evamist', 'prempro', 'activella', 'bijuva',
        // PMDD / menopause / mood
        '\\bprozac\\b', '\\bsarafem\\b', 'fluoxetine', '\\bzoloft\\b', 'sertraline',
        '\\blexapro\\b', 'escitalopram', '\\bpaxil\\b', 'paroxetine', 'effexor', 'venlafaxine',
        'wellbutrin', 'bupropion', '\\bbrisdelle\\b', '\\bveozah\\b', 'fezolinetant',
        // UTI antibiotics
        '\\bmacrobid\\b', 'nitrofurantoin', '\\bbactrim\\b', '\\bcipro\\b', 'ciprofloxacin',
        '\\bmonurol\\b', 'fosfomycin',
        // PCOS / metabolic
        '\\bmetformin\\b', 'glucophage', 'spironolactone', '\\baldactone\\b',
        // Endometriosis
        '\\borilissa\\b', 'elagolix', 'myfembree',
        // Migraine triptans (sometimes cross-recommended for hormonal headaches)
        '\\bimitrex\\b', 'sumatriptan',
        // GLP-1s (sometimes cross-recommended for PCOS/weight goals)
        '\\bozempic\\b', '\\bwegovy\\b', 'semaglutide', '\\bmounjaro\\b', '\\bzepbound\\b', 'tirzepatide',
    ].join('|'),
    'i'
);

function isBlockedRecommendationProduct(product) {
    if (!product || typeof product !== 'object') return false;
    const text = [
        product.id,
        product.name,
        product.brand,
        product.summary,
        product.whyItWorks,
        product.considerations,
        product.category,
    ]
        .filter(Boolean)
        .join(' ');
    return PRESCRIPTION_DRUG_PATTERN.test(text);
}

function EcosystemProductAlternatives({ product, seedEntry, quizResults, healthProfile, onSwap, onGoToSearch, precomputedAlternatives = [] }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const alternatives = useMemo(() => {
        if (Array.isArray(precomputedAlternatives) && precomputedAlternatives.length > 0) {
            return precomputedAlternatives
                .filter(Boolean)
                .filter((p) => !isBlockedRecommendationProduct(p))
                .slice(0, 3);
        }
        const generated = seedEntry?.tag != null ? getEcosystemAlternatives(product.id, seedEntry.tag, quizResults || {}, healthProfile, 3) : [];
        return generated
            .filter(Boolean)
            .filter((p) => !isBlockedRecommendationProduct(p))
            .slice(0, 3);
    }, [precomputedAlternatives, product.id, seedEntry, quizResults, healthProfile]);
    useEffect(() => {
        if (!open) return;
        const close = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const hasPrecomputed = Array.isArray(precomputedAlternatives) && precomputedAlternatives.length > 0;
    if (!seedEntry && !hasPrecomputed) return null;
    const frustrationLabel = seedEntry?.frustration || 'Alternatives';
    return (
        <div
            ref={rootRef}
            style={{
                marginTop: '0.65rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--color-border)',
                width: '100%',
                position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <p
                style={{
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    color: 'var(--color-text-muted)',
                    margin: '0 0 0.4rem',
                    fontFamily: 'var(--font-body)',
                }}
            >
                Top 3 alternatives · {frustrationLabel}
            </p>
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    fontSize: '0.88rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: '500',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-soft)',
                    color: 'var(--color-text-main)',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <span style={{ flex: 1, minWidth: 0, color: 'var(--color-text-muted)' }}>Compare or swap for another top pick…</span>
                <span aria-hidden style={{ flexShrink: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{open ? '▴' : '▾'}</span>
            </button>
            {open && (
                <ul
                    role="listbox"
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '100%',
                        marginTop: '0.35rem',
                        zIndex: 50,
                        listStyle: 'none',
                        padding: '0.35rem',
                        margin: 0,
                        maxHeight: '280px',
                        overflowY: 'auto',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-soft)',
                        boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    {alternatives.map((a) => (
                        <li key={a.id} role="option">
                            <button
                                type="button"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.65rem',
                                    padding: '0.5rem 0.55rem',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontFamily: 'var(--font-body)',
                                }}
                                onClick={() => {
                                    onSwap?.(product.id, a);
                                    setOpen(false);
                                }}
                            >
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: 'var(--radius-sm)',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg)',
                                    }}
                                >
                                    {safeProductImageSrc(a.image, a.type === 'digital') ? (
                                        <img src={safeProductImageSrc(a.image, a.type === 'digital')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <ProductImageFallback compact />
                                    )}
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--color-text-main)', lineHeight: 1.35 }}>
                                    {a.name}
                                </span>
                            </button>
                        </li>
                    ))}
                    <li style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.25rem', paddingTop: '0.35rem' }}>
                        <button
                            type="button"
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.55rem',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-secondary-fade)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                color: 'var(--color-primary)',
                                fontFamily: 'var(--font-body)',
                            }}
                            onClick={() => {
                                onGoToSearch?.();
                                setOpen(false);
                            }}
                        >
                            Search all products →
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}

function IntakeRecAltMini({ alt, myProducts, onToggleProduct, onOpenProduct, resolvedImages = {} }) {
    const imgSrc = resolvedImages[alt.id] || (alt?.image && String(alt.image).trim()) || '';
    const buyUrl = alt?.url && /^https:\/\//i.test(String(alt.url).trim()) ? String(alt.url).trim() : '';
    const inEco = !!myProducts[alt.id];
    return (
        <div
            className="card"
            style={{
                padding: '0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-soft)',
            }}
        >
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                    {imgSrc ? (
                        <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <ProductImageFallback compact />
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-main)', lineHeight: 1.3 }}>{alt.name}</div>
                    {alt.brand && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{alt.brand}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
                        <button type="button" className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }} onClick={() => onToggleProduct(alt)}>
                            {inEco ? '✓ In ecosystem' : '+ Add to Ecosystem'}
                        </button>
                        <button type="button" className="btn btn-primary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }} onClick={() => onOpenProduct(alt, { source: 'recommendation' })}>
                            Details
                        </button>
                        {buyUrl && (
                            <a href={buyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', textDecoration: 'none' }}>
                                Buy ↗
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function IntakeRecommendationsProductCard({
    product,
    tierSubLabel,
    quizResults,
    healthProfile,
    trackedProducts,
    myProducts,
    onToggleProduct,
    onOpenProduct,
    showTopPickBadge,
    compareKey,
    compareOpen,
    onToggleCompare,
    alternatives,
    altMiniKey,
    onSelectAltMini,
    resolvedImages = {},
}) {
    const isTracked = !!trackedProducts[product.id];
    const isInEcosystem = !!myProducts[product.id];
    const hasIndependentClinician = product?.clinicianOpinionSource === 'independent' && String(product?.clinicianAttribution || '').trim().length > 0;
    const engine = getRecommendationExplanation(product, quizResults, healthProfile);
    const useLlmNarrative = product?.whyItWorks != null && String(product.whyItWorks).trim().length > 0;
    const whyItWorks = useLlmNarrative ? String(product.whyItWorks).trim() : engine.whyItWorks;
    const considerations = useLlmNarrative ? (String(product.considerations || '').trim() || null) : engine.considerations;
    const imgSrc = resolvedImages[product.id] || (product?.image && String(product.image).trim()) || '';
    const buyUrl = product.url && /^https:\/\//i.test(String(product.url).trim()) ? String(product.url).trim() : '';
    const recallTxt = (product.safety?.recalls || '').trim();
    const showNoRecallsTag = recallTxt && !recallTxt.includes('⚠️');
    const showRecallWarning = recallTxt && recallTxt.includes('⚠️');
    const alts = Array.isArray(alternatives) ? alternatives.slice(0, 3) : [];
    const compareOn = !!compareOpen[compareKey];
    const selectedMiniAlt =
        !compareOn && altMiniKey && altMiniKey.startsWith(`${compareKey}::`)
            ? alts.find((a) => `${compareKey}::${a.id}` === altMiniKey)
            : null;

    return (
        <div className="card hover-lift" style={{
            padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            position: 'relative', marginBottom: '0.35rem',
        }}
        >
            <div style={{ height: '96px', width: '100%', overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg, #F3EADC, #EFE3D2)' }}>
                {imgSrc ? (
                    <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', boxSizing: 'border-box' }} />
                ) : (
                    <ProductImageFallback />
                )}
                <span style={{
                    position: 'absolute', top: '0.45rem', left: '0.45rem',
                    background: product.type === 'physical' ? 'var(--color-surface-contrast)' : 'var(--color-primary)',
                    color: 'white', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-pill)',
                    fontSize: '0.62rem', fontWeight: '600', textTransform: 'uppercase',
                }}>
                    {product.type === 'physical' ? 'Physical' : 'Digital'}
                </span>
                {isTracked && (
                    <span style={{
                        position: 'absolute', top: '0.45rem', right: '0.45rem',
                        background: 'var(--color-primary)', color: 'white', padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-pill)', fontSize: '0.62rem', fontWeight: '600',
                    }}>✓ Tracked</span>
                )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center', padding: '0.35rem 0.55rem', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                {showTopPickBadge && (
                    <span style={{
                        background: 'linear-gradient(135deg, #FEF9C3, #FDE68A)', color: '#854D0E',
                        padding: '0.22rem 0.55rem', borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontWeight: '700',
                        border: '1px solid #FACC15',
                    }}>Top pick for you</span>
                )}
                {hasIndependentClinician ? (
                    <span style={{
                        background: '#DCFCE7', color: '#166534', padding: '0.22rem 0.55rem',
                        borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontWeight: '700',
                    }}>Independent clinician verified</span>
                ) : (
                    <span style={{
                        background: '#FEF3C7', color: '#92400E', padding: '0.22rem 0.55rem',
                        borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontWeight: '700',
                    }}>No independent clinician opinion yet</span>
                )}
            </div>
            <div style={{ padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {tierSubLabel && (
                    <p style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--color-text-muted)', margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tierSubLabel}</p>
                )}
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.25rem', lineHeight: 1.25 }}>{product.name}</h3>
                {product.dsldVerified && (
                    <span style={{ fontSize: '0.6rem', background: '#DCFCE7', color: '#166534', padding: '0.12rem 0.4rem', borderRadius: 'var(--radius-pill)', fontWeight: '700', display: 'inline-block', marginBottom: '0.35rem' }}>
                        ✓ NIH Verified Supplement
                    </span>
                )}
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>{(product.summary || '').length > 120 ? `${(product.summary || '').slice(0, 117)}…` : (product.summary || '')}</p>
                {whyItWorks && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-primary-hover)', fontWeight: '500', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                        {(whyItWorks || '').length > 140 ? `${whyItWorks.slice(0, 137)}…` : whyItWorks}
                    </p>
                )}
                {considerations && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', lineHeight: 1.35, fontStyle: 'italic' }}>
                        {(considerations || '').length > 120 ? `${considerations.slice(0, 117)}…` : considerations}
                    </p>
                )}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {showNoRecallsTag && (
                        <span style={{ fontSize: '0.65rem', background: 'var(--color-secondary-fade)', color: 'var(--color-text-main)', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-pill)' }}>✓ No recalls</span>
                    )}
                    {showRecallWarning && (
                        <span style={{ fontSize: '0.65rem', background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-pill)' }}>Safety note</span>
                    )}
                    {product.privacy?.sellsData?.includes('❌') && (
                        <span style={{ fontSize: '0.65rem', background: 'var(--color-secondary-fade)', color: 'var(--color-text-main)', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-pill)' }}>No data selling</span>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{product.price || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                    <button type="button" className="btn btn-outline" style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem' }} onClick={() => onToggleProduct(product)}>
                        {isInEcosystem ? '✓ Added' : '+ Add'}
                    </button>
                    <button type="button" className="btn btn-outline" style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem' }} onClick={() => onToggleCompare(compareKey)}>
                        {compareOn ? 'Hide compare' : 'Compare'}
                    </button>
                    <button type="button" className="btn btn-primary" style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem' }} onClick={() => onOpenProduct(product, { source: 'recommendation' })}>
                        Details
                    </button>
                    {buyUrl && (
                        <a href={buyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                            Buy ↗
                        </a>
                    )}
                </div>
                {alts.length > 0 && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>3 alternatives</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {alts.map((alt) => {
                                const mk = `${compareKey}::${alt.id}`;
                                const pillOpen = altMiniKey === mk;
                                return (
                                    <button
                                        key={alt.id}
                                        type="button"
                                        className="btn btn-outline"
                                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', borderRadius: 'var(--radius-pill)' }}
                                        onClick={() => onSelectAltMini(pillOpen ? '' : mk)}
                                    >
                                        {alt.name}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedMiniAlt && (
                            <div style={{ marginTop: '0.55rem' }}>
                                <IntakeRecAltMini alt={selectedMiniAlt} myProducts={myProducts} onToggleProduct={onToggleProduct} onOpenProduct={onOpenProduct} resolvedImages={resolvedImages} />
                            </div>
                        )}
                        {compareOn && (
                            <div style={{ marginTop: '0.65rem', display: 'grid', gap: '0.5rem' }}>
                                {alts.map((alt) => (
                                    <IntakeRecAltMini key={`cmp-${alt.id}`} alt={alt} myProducts={myProducts} onToggleProduct={onToggleProduct} onOpenProduct={onOpenProduct} resolvedImages={resolvedImages} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function inferHealthFunctionsFromLlm(product, concern = '', tierSubcategory = '') {
    // Strip parenthetical detail from concern for cleaner matching
    const c = String(concern).toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
    const cat = String(product.type || '').toLowerCase();
    const type = String(product.type || '').toLowerCase();
    const sub = String(tierSubcategory || '').toLowerCase();

    // ── Concern is the primary signal — all product types go under the same concern category ──
    if (c.includes('pcos') || c.includes('polycystic')) return ['pcos-management'];
    if (c.includes('endometriosis') || c.includes('endo')) return ['endometriosis'];
    if (c.includes('hormone balance') || c.includes('hormonal') || c.includes('bloating') || c.includes('thyroid') || c.includes('irregular cycle') || c.includes('irregular period')) return ['hormone-balance'];
    if (c.includes('period care') || c.includes('menstrual collection') || c.includes('period underwear') || c.includes('pad') || c.includes('tampon') || c.includes('cup') || c.includes('disc')) return ['menstrual-collection'];
    if (c.includes('cramp') || c.includes('pain relief') || c.includes('dysmenorrhea')) return ['cramp-relief'];
    if (c.includes('sleep') || c.includes('energy') || c.includes('fatigue') || c.includes('brain fog') || c.includes('insomnia') || c.includes('tired')) return ['sleep-energy'];
    if (c.includes('mental health') || c.includes('mood') || c.includes('anxiety') || c.includes('depression') || c.includes('stress') || c.includes('emotional')) return ['mental-health'];
    if (c.includes('gut') || c.includes('vaginal') || c.includes('ph balance') || c.includes('probiotic') || c.includes('microbiome') || c.includes('bacterial') || c.includes('yeast')) return ['vaginal-health'];
    if (/\buti\b/.test(c) || c.includes('urinary tract') || c.includes('urinary infection')) return ['uti-prevention'];
    if (/\bsti\b/.test(c) || c.includes('sexually transmitted') || c.includes('sexual health') || c.includes('pelvic floor') || c.includes('lubricant') || c.includes('intimacy') || c.includes('libido') || c.includes('vulva') || c.includes('vaginal dryness')) return ['sexual-health'];
    if (c.includes('fertil') || c.includes('ttc') || c.includes('conception') || c.includes('trying to conceive') || c.includes('prenatal') || c.includes('ovulation')) return ['fertility'];
    if (c.includes('menopause') || c.includes('perimenopause') || c.includes('hot flash') || c.includes('night sweat')) return ['perimenopause'];
    if (c.includes('skin') || c.includes('hair') || c.includes('acne') || c.includes('breakout') || c.includes('hair loss') || c.includes('nail')) return ['skin-hair'];
    if (c.includes('cycle tracking') || c.includes('track my cycle') || c.includes('tracking') || c.includes('ovulation test')) return ['cycle-tracking'];
    if (c.includes('contracept') || c.includes('birth control') || c.includes('iud') || c.includes('family planning')) return ['contraception'];
    if (c.includes('fitness') || c.includes('workout') || c.includes('exercise') || c.includes('cycle sync')) return ['fitness-cycle'];
    // For 'telehealth', 'routine', and 'wearable' concerns: only digital products go into those categories.
    // Supplements and physical devices from these concerns should fall through to product-type categorisation
    // (e.g. Thorne Inositol from a 'routine' concern → pcos-management via category, not routine-building).
    const isDigital = type === 'digital' || cat.includes('telehealth') || sub.includes('telehealth') || sub.includes('app');
    if (c.includes('telehealth') || c.includes('provider') || c.includes('specialist') || c.includes('doctor') || c.includes('ob/gyn') || c.includes('obgyn')) {
        if (isDigital) return ['telehealth'];
        // fall through for supplements / physical products
    }
    if (c.includes('routine') || c.includes('health routine') || c.includes('wellness app') || c.includes('health app') || c.includes('build my health') || c.includes('women\'s health app') || c.includes('wearable')) {
        if (isDigital) return ['routine-building'];
        // fall through for supplements / physical products
    }

    // ── Fallback to product category / type if concern didn't match ──
    if (cat === 'telehealth' || sub.includes('telehealth') || cat.includes('telehealth')) return ['telehealth'];
    if (type === 'digital' || sub.includes('app') || cat.includes('app') || cat.includes('platform')) return ['routine-building'];
    if (cat === 'pad' || cat === 'tampon' || cat === 'cup' || cat === 'disc' || cat === 'liner' || cat === 'period-underwear') return ['menstrual-collection'];
    if (cat.includes('cramp') || cat.includes('heat') || cat.includes('tens') || cat.includes('pain')) return ['cramp-relief'];
    if (cat.includes('vaginal') || cat.includes('intimate') || cat.includes('ph') || cat.includes('probiotic')) return ['vaginal-health'];
    if (/\buti\b/.test(cat) || cat.includes('urinary')) return ['uti-prevention'];
    if (/\bsti\b/.test(cat) || cat.includes('sexual') || cat.includes('lubricant')) return ['sexual-health'];
    if (cat.includes('contraception') || cat.includes('birth control')) return ['contraception'];
    if (cat.includes('mental') || cat.includes('therapy') || cat.includes('meditation') || cat.includes('anxiety')) return ['mental-health'];
    if (cat.includes('fitness') || cat.includes('workout') || cat.includes('exercise')) return ['fitness-cycle'];
    if (cat.includes('skin') || cat.includes('hair') || cat.includes('acne')) return ['skin-hair'];
    if (cat.includes('sleep') || cat.includes('energy') || cat.includes('fatigue')) return ['sleep-energy'];
    if (cat.includes('fertility') || cat.includes('prenatal') || cat.includes('ovulation')) return ['fertility'];
    if (cat.includes('menopause') || cat.includes('peri')) return ['perimenopause'];
    if (cat.includes('pcos') || cat.includes('hormone')) return ['pcos-management'];

    // ── True last resort: digital → routine-building, physical → hormone-balance ──
    // Never map LLM products to 'supplement' — that category is for legacy DB products only
    return type === 'digital' ? ['routine-building'] : ['hormone-balance'];
}

/** Estimate monthly cost in USD from a price string. Returns null if unparseable. */
function estimateMonthlyCost(priceStr, product) {
    if (!priceStr || typeof priceStr !== 'string') return null;
    const s = priceStr.trim();
    const category = product?.category || '';
    const isReusable = /reusable|per pair|per pair/i.test(s) || ['cup', 'disc', 'period-underwear'].includes(category);

    // Explicit per month: e.g. "$10/month" or "Clue Plus $10/month"
    const perMonthMatch = s.match(/\$(\d+)(?:\.\d+)?\s*\/?\s*month/i);
    if (perMonthMatch) return parseFloat(perMonthMatch[1]);

    // Range: "$25–$38", "$25–38", "$25-38" → use average. Only real
    // range-separator characters here — a literal '.' or ' ' would false-match
    // any two dollar amounts sitting near each other in the string.
    const rangeMatch = s.match(/\$(\d+(?:\.\d+)?)\s*[–‒\-]+\s*\$?(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
        const avg = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
        if (/per pair|underwear|pair/i.test(s)) return avg / 18; // ~18 months life
        if (/one.?time|one purchase|reusable|device|wearable|ring|tracker/i.test(s)) return avg / 24;
        // Supplements and consumables: treat range as monthly price
        if (/supplement|vitamin|probiotic|powder|capsule|tablet|softgel|tea|extract/i.test(s + ' ' + category)) return avg;
        // Telehealth: initial visit price is not monthly — skip to avoid inflating estimate
        if (/initial|visit|consult|appointment/i.test(s)) return null;
        return avg; // default: treat as monthly consumable
    }

    // Single price: $8 or $29
    const singleMatch = s.match(/\$(\d+)(?:\.\d+)?/);
    const price = singleMatch ? parseFloat(singleMatch[1]) : null;
    if (price == null) return null;

    // "for 60 capsules" etc → assume 2-month supply
    const forMatch = s.match(/for\s*(\d+)\s*(?:capsules|softgels|tablets|pads|tampons)/i);
    if (forMatch) {
        const count = parseInt(forMatch[1], 10);
        if (count >= 30 && count <= 120) return price / (count / 30); // ~monthly
        if (count < 30) return price; // small pack = ~1 month
        return price / 2; // 60 = 2 months typical
    }

    // "$14 for 12 (disposable)" → ~2 packs per 2 months
    if (/disposable/i.test(s)) {
        const dMatch = s.match(/\$(\d+)(?:\.\d+)?\s+for\s+\d+/i);
        if (dMatch) return parseFloat(dMatch[1]) / 2;
    }

    // "$8 for 18" (pads/tampons) → ~1 pack per month
    const forPacksMatch = s.match(/\$(\d+)(?:\.\d+)?\s+for\s+\d+/i);
    if (forPacksMatch && (category.includes('pad') || category.includes('tampon'))) {
        return parseFloat(forPacksMatch[1]);
    }
    if (forPacksMatch) return parseFloat(forPacksMatch[1]); // other "for N" consumables

    // Reusable: "10 years" or "up to 10 years"
    if (/\d+\s*years?|reusable\s*(?:up to)?\s*\d+/i.test(s)) {
        const yearsMatch = s.match(/(\d+)\s*years?|reusable\s*(?:up to)?\s*(\d+)/i);
        const years = yearsMatch ? parseFloat(yearsMatch[1] || yearsMatch[2]) : 5;
        return price / (years * 12);
    }

    // Reusable (cup, disc) without years
    if (/reusable/i.test(s) || ['cup', 'disc'].includes(category)) return price / 60; // 5 years

    // Per pair (underwear)
    if (/per pair|pair/i.test(s)) return price / 18;

    // "Free" only (no paid tier mentioned)
    if (/^free\s*$/i.test(s.replace(/\(.*\)/g, '').trim())) return 0;

    // Supplements/consumables with single price (e.g. "$28") → treat as monthly
    if (/supplement|vitamin|probiotic|powder|capsule|tablet|softgel|tea|extract/i.test(s + ' ' + category)) return price;
    // One-time physical device → amortize over 24 months
    if (/device|wearable|ring|tracker|one.?time/i.test(s)) return price / 24;
    // Telehealth single visit price → not monthly
    if (/initial|visit|consult|appointment/i.test(s)) return null;

    return null;
}

// activeGenerations / subscribeToGeneration / notifyGeneration / discardGeneration /
// GENERATION_ABANDON_GRACE_MS moved to ../utils/ecosystemGenerationStore (imported
// above) so the global EcosystemGenerationBar (App.jsx) can observe an in-flight
// generation from any page, not just while MyEcosystem itself is mounted.

export default function MyEcosystem({
    myProducts,
    ecosystemOrder = [],
    onToggleProduct,
    trackedProducts,
    toggleTrackProduct,
    toggleOmitProduct,
    omittedProducts,
    onOpenProduct,
    onOpenDoctorPrep,
    onBuildEcosystem,
    onEditHealthProfile,
    quizResults = null,
    healthProfile = null,
    userZipCode = '',
    onZipCodeChange,
    ecosystemSeedMeta = {},
    onSwapSeedProduct,
    onGoToSearch,
    onHealthProfileUpdate,
    onViewRecommendedArticles,
    onOpenArticle,
    onLlmRecommendationsLoaded,
    onBuildEcosystemFromLlm,
    onOpenPhoneVerify,
    user = null,
    userSession = null,
    isPremium = false,
}) {
    const [showAddModal, setShowAddModal] = useState(false);
    useEscapeToClose(showAddModal, () => setShowAddModal(false));
    const [showMoreTools, setShowMoreTools] = useState(false);
    const careNearYouDetailsRef = useRef(null);
    const [showSyncPaywall, setShowSyncPaywall] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [ecosystemCompareOpen, setEcosystemCompareOpen] = useState({});
    const [ecosystemAltMiniKey, setEcosystemAltMiniKey] = useState('');
    const [llmTiered, setLlmTiered] = useState([]);
    const [llmLoading, setLlmLoading] = useState(false);
    const [llmError, setLlmError] = useState('');
    // Distinct from llmError: some concerns didn't generate but others DID —
    // the ecosystem is functionally built, just missing a couple of sections.
    // Kept separate so this never renders under the "We couldn't build your
    // ecosystem" framing, which used to fire for this case too (see rec.error
    // vs rec.partialConcerns below).
    const [llmPartialConcerns, setLlmPartialConcerns] = useState([]);
    const [llmLoadStartedAt, setLlmLoadStartedAt] = useState(0);
    // Last known-good complete recommendation set — restored if a rebuild is cancelled mid-flight.
    const previousLlmTieredRef = useRef([]);
    const [resolvedImages, setResolvedImages] = useState({});
    const [recommendedSwapByKey, setRecommendedSwapByKey] = useState({});
    const [recommendedSectionOpen, setRecommendedSectionOpen] = useState({});
    const [recommendationRefreshNonce, setRecommendationRefreshNonce] = useState(() => {
        try {
            // sessionStorage, not localStorage: the read-then-remove is not atomic
            // across tabs, and two tabs landing on /ecosystem together is a
            // designed flow (email confirmation broadcasts auth cross-tab). Both
            // read '1' and both ran a full ecosystem build against the same
            // one-per-lifetime quota.
            if (typeof window !== 'undefined' && window.sessionStorage.getItem('ayna_force_llm_refresh') === '1') {
                window.sessionStorage.removeItem('ayna_force_llm_refresh');
                return 1;
            }
        } catch (_) {}
        return 0;
    });
    const [phoneNumberInfo, setPhoneNumberInfo] = useState(null);
    const [smsCardCopied, setSmsCardCopied] = useState(false);
    const [smsCardShown, setSmsCardShown] = useState(() => {
        try {
            const dismissedAt = Number(window.localStorage.getItem(SMS_CARD_DISMISS_KEY) || 0);
            if (!dismissedAt) return true;
            return Date.now() - dismissedAt >= THIRTY_DAYS_MS;
        } catch {
            return true;
        }
    });

    useEffect(() => {
        if (!user?.id) {
            setPhoneNumberInfo(null);
            return;
        }
        const supabase = getSupabaseClient();
        if (!supabase) return;
        let active = true;
        loadPhoneNumberForUser(supabase, user.id)
            .then((row) => { if (active) setPhoneNumberInfo(row); })
            .catch(() => { if (active) setPhoneNumberInfo(null); });
        return () => { active = false; };
    }, [user?.id]);

    // No SMS activity in 30+ days: re-show the card even if dismissed, but only once per month.
    useEffect(() => {
        if (smsCardShown) return;
        if (!phoneNumberInfo?.is_verified) return;
        const lastSmsAt = phoneNumberInfo.last_sms_at ? new Date(phoneNumberInfo.last_sms_at).getTime() : 0;
        const inactiveLongEnough = !lastSmsAt || Date.now() - lastSmsAt >= THIRTY_DAYS_MS;
        if (!inactiveLongEnough) return;
        try {
            const lastReshownAt = Number(window.localStorage.getItem(SMS_CARD_RESHOWN_KEY) || 0);
            if (Date.now() - lastReshownAt < THIRTY_DAYS_MS) return;
            window.localStorage.setItem(SMS_CARD_RESHOWN_KEY, String(Date.now()));
        } catch { /* ignore storage errors */ }
        setSmsCardShown(true);
    }, [smsCardShown, phoneNumberInfo]);

    const handleDismissSmsCard = () => {
        try { window.localStorage.setItem(SMS_CARD_DISMISS_KEY, String(Date.now())); } catch { /* ignore storage errors */ }
        setSmsCardShown(false);
    };

    const handleCopySmsNumber = () => {
        if (!AYNA_SMS_NUMBER) return;
        navigator.clipboard?.writeText(AYNA_SMS_NUMBER).then(() => {
            setSmsCardCopied(true);
            setTimeout(() => setSmsCardCopied(false), 2000);
        }).catch(() => {});
    };

    const hasCompletedPersonalization = useMemo(() => {
        if (!quizResults) return false;
        if (quizResults?.personalizationCompleted === true) return true;
        if (quizResults?.fullHealthIntake?.personalizationCompleted === true) return true;
        return false;
    }, [quizResults]);

    // Use ecosystemOrder for stable card positions; fall back to insertion order
    const myProductIds = ecosystemOrder.length ? ecosystemOrder.filter(id => myProducts[id]) : Object.keys(myProducts);
    const myProductList = myProductIds.map(id => myProducts[id]).filter(Boolean);
    // Broader "shelf" areas (Cycle care, Pelvic floor, Clinicians, ...) — the
    // same grouping EcosystemBubbles/EcosystemShelf use, matching the mockup's
    // sidebar row labels. Groups by care AREA, not raw catalog category (e.g.
    // 'pad', 'tampon' would otherwise be separate rows) — too fine-grained
    // for a sidebar summary.
    const shelfAreaBreakdown = useMemo(() => {
        const byArea = new Map();
        myProductList.forEach((p) => {
            const area = resolveEcosystemProductArea(p, ECOSYSTEM_AREAS);
            const key = area ? area.key : 'other';
            if (!byArea.has(key)) byArea.set(key, []);
            byArea.get(key).push(p);
        });
        const filled = ECOSYSTEM_AREAS
            .filter((a) => byArea.has(a.key))
            .map((a) => ({ ...a, count: byArea.get(a.key).length }))
            .sort((a, b) => b.count - a.count);
        const gap = ECOSYSTEM_AREAS.find((a) => !byArea.has(a.key)) || null;
        const clinicianCount = byArea.get('care')?.length || 0;
        return { filled, gap, clinicianCount };
    }, [myProductList]);
    const estimatedMonthlyTotal = useMemo(() => {
        let total = 0;
        let counted = 0;
        myProductList.forEach(p => {
            const priceStr = p.price || p.stage;
            const est = estimateMonthlyCost(priceStr, p);
            if (est != null && !Number.isNaN(est)) {
                total += est;
                counted += 1;
            }
        });
        return { total: Math.round(total * 100) / 100, counted, totalItems: myProductList.length };
    }, [myProductList]);
    const filteredProducts = useMemo(() => {
        const words = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (!words.length) return ALL_PRODUCTS.filter(p => !omittedProducts[p.id]);
        const haystack = (p) => [
            p.name, p.brand, p.category,
            ...(Array.isArray(p.tags) ? p.tags : []),
            ...(Array.isArray(p.searchTerms) ? p.searchTerms : []),
        ].filter(Boolean).join(' ').toLowerCase();
        return ALL_PRODUCTS.filter(p =>
            !omittedProducts[p.id] && words.every(w => haystack(p).includes(w))
        );
    }, [searchTerm, omittedProducts]);

    const intakeTieredRecommendations = useMemo(() => {
        if (!hasCompletedPersonalization) return [];
        const intake = quizResults?.fullHealthIntake || null;
        if (!intake || Object.keys(intake).length === 0) return [];
        return generateTieredRecommendations(intake);
    }, [quizResults, hasCompletedPersonalization]);

    const intakeFingerprint = useMemo(
        () => (hasCompletedPersonalization ? fingerprintIntake(quizResults?.fullHealthIntake || null) : ''),
        [quizResults, hasCompletedPersonalization]
    );

    useEffect(() => {
        if (!intakeFingerprint) {
            // Intake is still loading from Supabase — don't clear the cache or it will
            // wipe valid recommendations before the fingerprint is available.
            setLlmTiered([]);
            setLlmLoading(false);
            setLlmError('');
            setLlmPartialConcerns([]);
            setLlmLoadStartedAt(0);
            return undefined;
        }

        // Only bypass cache for explicit user actions: quiz complete, profile update, rebuild button
        const bypassCache = recommendationRefreshNonce > 0;
        const fetchedFingerprint = loadFetchedLlmFingerprint();
        const alreadyFetchedForFingerprint = fetchedFingerprint === intakeFingerprint;
        if (!bypassCache) {
            const cached = loadCachedLlmRecommendations(intakeFingerprint);
            if (cached) {
                setLlmTiered(cached);
                previousLlmTieredRef.current = cached;
                setLlmLoading(false);
                setLlmError('');
                setLlmPartialConcerns([]);
                setLlmLoadStartedAt(0);
                return undefined;
            }
            if (alreadyFetchedForFingerprint) {
                // A prior failed generation used to poison this intake forever:
                // the fingerprint was recorded even when no recommendations were
                // cached, so a reload would refuse to try again. If there is no
                // cached payload, retry normally instead of trapping the user —
                // the instant local ecosystem below already gives her something
                // useful while this retry runs, so there's no need to interrupt
                // her with an error just because a past attempt didn't cache.
                console.warn('[Ayna] previous recommendation attempt has no cache; retrying');
            }
        } else {
            // Explicit refresh: any existing record for this fingerprint (in-flight
            // or otherwise) reflects stale intent — replace it, don't attach to it.
            discardGeneration(intakeFingerprint);
        }

        const onUpdate = (rec) => {
            setLlmTiered(rec.tiered);
            setLlmLoading(rec.loading);
            setLlmError(rec.error);
            setLlmPartialConcerns(rec.partialConcerns || []);
            setLlmLoadStartedAt(rec.startedAt);
        };

        const unsubscribe = subscribeToGeneration(intakeFingerprint, onUpdate, (rec) => {
            const intake = quizResults?.fullHealthIntake || null;
            console.log('[Ayna LLM] Starting fetch. Concerns:', intake?.primaryConcerns?.length ?? 0, '| goals:', intake?.goals?.length ?? 0, '| intake null?', !intake);

            rec.controller = new AbortController();
            rec.startedAt = Date.now();
            rec.loading = true;
            rec.error = '';
            rec.partialConcerns = [];
            rec.tiered = [];
            notifyGeneration(rec);

            // Local-first: give the user a usable ecosystem immediately.
            // The LLM batches below still run and can refine these matches later.
            const instantLocal = generateTieredRecommendations(intake);
            if (Array.isArray(instantLocal) && instantLocal.length > 0) {
                rec.tiered = instantLocal;
                notifyGeneration(rec);
            }

            (async () => {
                // Per-attempt state — the shared record only needs the fields
                // consumers read (tiered/loading/error/startedAt); these are
                // internal to this one generation run.
                let limitReached = false;
                let authFailed = false;
                const partialConcerns = [];
                try {
                    const memory = loadLearningMemory();
                    const accumulated = [];
                    let errorCount = 0;

                    // Small batches, more of them, run in parallel across separate
                    // serverless invocations. Each invocation now handles 3 concerns
                    // at concurrency 3, so it finishes well inside the 60s function
                    // ceiling instead of needing a 252s budget that never existed.
                    // 7 x 3 covers the server's MAX_CONCERNS cap of 20 (raised from
                    // 6 x 3 / cap 18 on 2026-08-25, when the quiz grew from 16 to 18
                    // checkbox options — same silent-truncation risk as the original
                    // 12/4 bug if this isn't kept in lockstep with the server cap;
                    // keeping BATCH_SIZE at 3 rather than raising it preserves the
                    // per-invocation timing this was already tuned for, just runs one
                    // more invocation in parallel).
                    const BATCH_SIZE = 3;
                    const NUM_BATCHES = 7;
                    const buildId = buildIdFromFingerprint(intakeFingerprint);
                    let doneCount = 0;

                    const authToken = userSession?.access_token;
                    await new Promise(resolveAll => {
                        Array.from({ length: NUM_BATCHES }, (_, i) => {
                            fetchLlmRecommendations(
                                { intake, trackedProducts, myProducts, omittedProducts, learningMemory: memory, batchIndex: i, batchSize: BATCH_SIZE, buildId },
                                { authToken, signal: rec.controller.signal }
                            )
                            .then(d => {
                                if (rec.cancelled) return;
                                const recs = Array.isArray(d?.recommendations) ? d.recommendations : [];
                                if (d?.partial && Array.isArray(d.failedConcerns) && d.failedConcerns.length) {
                                    // The server now reports which concerns produced
                                    // nothing. Without this the user just sees fewer
                                    // sections than she asked for, with no signal.
                                    partialConcerns.push(...d.failedConcerns);
                                    // Reason travels with the response so this is
                                    // diagnosable from the browser console alone — a
                                    // live 2026-08-22 incident (2 concerns failed
                                    // ~20s in) was undiagnosable after the fact
                                    // because nothing captured *why*, and by the
                                    // time anyone checked, Vercel's log retention
                                    // no longer had it.
                                    if (Array.isArray(d.failedConcernReasons) && d.failedConcernReasons.length) {
                                        console.warn('[Ayna LLM] Concern failures this batch:', d.failedConcernReasons);
                                    }
                                }
                                if (recs.length > 0) {
                                    accumulated.push(...recs);
                                }
                            })
                            .catch(e => {
                                console.error(`[Ayna LLM] batch ${i} error:`, e?.status || '', e?.message);
                                if (e?.status === 429) {
                                    limitReached = true;
                                } else if (e?.status === 401) {
                                    authFailed = true;
                                }
                                errorCount++;
                            })
                            .finally(() => { if (++doneCount === NUM_BATCHES) resolveAll(); });
                        });
                    });

                    if (rec.cancelled) return;
                    const recs = accumulated;
                    console.log('[Ayna LLM] Done. Sections:', recs.length, '| errors:', errorCount);

                    // Swap in the completed AI result only after all batches finish.
                    // Until then, keep the instant local ecosystem stable.
                    if (recs.length > 0) {
                        rec.tiered = recs;
                        notifyGeneration(rec);
                    }

                    if (recs.length === 0 && errorCount > 0) {
                        // Preserve intentional auth/quota behavior, but do not make
                        // the core ecosystem depend on the LLM endpoint being up.
                        // The app already has a vetted local recommendation engine;
                        // use it as an immediate fallback for network/5xx/404/timeouts.
                        if (limitReached) {
                            rec.error = "You've already generated your ayna ecosystem. Regenerating is a premium feature. Email puloma@aynahealth.co to upgrade.";
                            notifyGeneration(rec);
                            return;
                        }
                        if (authFailed) {
                            rec.error = 'Your session expired. Please sign in again.';
                            notifyGeneration(rec);
                            return;
                        }

                        const fallbackRecs = generateTieredRecommendations(intake);
                        if (Array.isArray(fallbackRecs) && fallbackRecs.length > 0) {
                            console.warn('[Ayna LLM] all remote batches failed; using local recommendation fallback');
                            rec.tiered = fallbackRecs;
                            rec.error = '';
                            notifyGeneration(rec);
                            if (hasCompletedPersonalization) onLlmRecommendationsLoaded?.(fallbackRecs);
                            const fallbackCached = saveCachedLlmRecommendations(intakeFingerprint, fallbackRecs);
                            if (fallbackCached) saveFetchedLlmFingerprint(intakeFingerprint);
                            return;
                        }

                        throw new Error('We couldn’t build recommendations right now. Please try again.');
                    }
                    if (recs.length === 0) return; // nothing to do (no concerns matched)
                    if (recs.length > 0) {
                        if (hasCompletedPersonalization) onLlmRecommendationsLoaded?.(recs);
                    }
                    let cachedOk = false;
                    if (recs.length > 0) {
                        cachedOk = saveCachedLlmRecommendations(intakeFingerprint, recs);
                        previousLlmTieredRef.current = recs;
                    }
                    // Only mark this intake "already fetched" if there is something to
                    // come back to. Recording it after a failed cache write is what
                    // produced a permanently empty ecosystem with no error.
                    if (cachedOk) saveFetchedLlmFingerprint(intakeFingerprint);
                    if (partialConcerns.length > 0) {
                        // NOT rec.error — this branch only runs when recs.length > 0
                        // (the recs.length === 0 case above already returned), so the
                        // ecosystem DID build, just missing a couple of sections. Every
                        // rec.error reader in this file renders an alarming "We
                        // couldn't build your ecosystem" banner, which used to fire
                        // here too and told a user who got 10/12 sections that the
                        // whole build failed. Keep this as its own field so it can get
                        // its own, accurate, non-alarming treatment.
                        rec.partialConcerns = Array.from(new Set(partialConcerns)).slice(0, 4);
                        notifyGeneration(rec);
                    }
                    const recommendedProductIds = recs.flatMap((entry) =>
                        (entry?.tiers || []).flatMap((tier) =>
                            [tier?.product?.id, ...((tier?.alternatives || []).map((a) => a?.id))].filter(Boolean)
                        )
                    );
                    const nextMemory = {
                        ...memory,
                        interactionCount: (memory.interactionCount || 0) + 1,
                        lastConcerns: Array.isArray(intake?.primaryConcerns) ? intake.primaryConcerns.map((x) => String(x)) : [],
                        lastSeenAt: new Date().toISOString(),
                        shownProductIds: Array.from(new Set([...(memory.shownProductIds || []), ...recommendedProductIds])).slice(-300),
                        // Was the only one of these without a cap; the whole memory
                        // object is written to user_learning_memory on every build.
                        selectedConcernHistory: Array.from(new Set([...(memory.selectedConcernHistory || []), ...((intake?.primaryConcerns || []).map((x) => String(x)))])).slice(-100),
                        trackedHistory: Array.from(new Set([...(memory.trackedHistory || []), ...Object.keys(trackedProducts || {})])).slice(-300),
                        ecosystemHistory: Array.from(new Set([...(memory.ecosystemHistory || []), ...Object.keys(myProducts || {})])).slice(-300),
                        omittedHistory: Array.from(new Set([...(memory.omittedHistory || []), ...Object.keys(omittedProducts || {})])).slice(-300),
                    };
                    saveLearningMemory(nextMemory);
                } catch (e) {
                    if (rec.cancelled) return;
                    rec.tiered = [];
                    const errMsg = typeof e?.message === 'string' ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
                    console.error('[Ayna LLM] Error:', e);
                    rec.error = errMsg || 'Could not load recommendations';
                    // Never mark a failed request as fetched. Doing so prevents the
                    // same intake from retrying on reload even though no cache exists.
                    notifyGeneration(rec);
                } finally {
                    if (!rec.cancelled) {
                        rec.loading = false;
                        rec.startedAt = 0;
                        notifyGeneration(rec);
                    }
                    // Only remove the map entry if it's still *this* record — a
                    // cancel/refresh that discarded this generation may have
                    // already replaced it with a newer one under the same key.
                    if (activeGenerations.get(intakeFingerprint) === rec) activeGenerations.delete(intakeFingerprint);
                }
            })();
        });

        return unsubscribe;
    }, [intakeFingerprint, hasCompletedPersonalization, recommendationRefreshNonce]);

    const activeTiered = useMemo(
        () => (llmTiered.length > 0 ? llmTiered : intakeTieredRecommendations),
        [llmTiered, intakeTieredRecommendations]
    );
    const recommendedProductsForDisplay = useMemo(() => {
        if (!hasCompletedPersonalization) return [];
        if (!Array.isArray(activeTiered) || activeTiered.length === 0) return [];
        const blockedConcernLabels = new Set(['general discomfort']);

        const concernPriority = [
            ...(Array.isArray(quizResults?.frustrations) ? quizResults.frustrations : []),
            ...(Array.isArray(quizResults?.fullHealthIntake?.primaryConcerns) ? quizResults.fullHealthIntake.primaryConcerns : []),
        ]
            .map((x) => String(x || '').trim())
            .filter(Boolean)
            .filter((x) => !blockedConcernLabels.has(x.toLowerCase()));
        const concernRank = new Map(concernPriority.map((c, i) => [c.toLowerCase(), i]));

        const sections = activeTiered
            .map((entry, idx) => {
                const concern = String(entry?.concern || concernPriority[idx] || `Concern ${idx + 1}`).trim();
                if (!concern || blockedConcernLabels.has(concern.toLowerCase())) return null;
                const concernLower = concern.toLowerCase();
                const isRoutineConcern = concernLower.includes('routine') || concernLower.includes('apps and services') ||
                    concernLower.includes('wellness app') || concernLower.includes('health app') ||
                    concernLower.includes('build my health') || concernLower.includes('wearable') ||
                    concernLower === 'build my health routine';

                const tiers = (Array.isArray(entry?.tiers) ? entry.tiers : [])
                    .map((tier, tierIdx) => {
                        const tierProduct = tier?.product || null;
                        if (!tierProduct || isBlockedRecommendationProduct(tierProduct)) return null;
                        // Routine/apps concerns: only show digital products (apps, telehealth, trackers)
                        if (isRoutineConcern) {
                            const pType = String(tierProduct.type || '').toLowerCase();
                            const pCat = String(tierProduct.category || '').toLowerCase();
                            const sub = String(tier?.subcategory || '').toLowerCase();
                            const isDigital = pType === 'digital' || pCat.includes('telehealth') ||
                                pCat.includes('app') || pCat.includes('platform') || pCat.includes('tracker') ||
                                sub.includes('app') || sub.includes('telehealth') || sub.includes('digital') || sub.includes('tracker');
                            if (!isDigital) return null;
                        }
                        const tierAltPool = Array.isArray(tier?.alternatives) ? tier.alternatives : [];
                        const tierAlternatives = tierAltPool
                            .filter(Boolean)
                            .filter((p) => !isBlockedRecommendationProduct(p))
                            .filter((p) => p.id !== tierProduct.id)
                            .slice(0, 3);
                        const tierLabel = String(tier?.subcategory || tier?.name || '').trim() || `Option ${tierIdx + 1}`;
                        return {
                            id: String(tier?.id || `tier-${tierIdx + 1}`),
                            label: tierLabel,
                            product: tierProduct,
                            alternatives: tierAlternatives,
                            matchExplanation: String(tier?.matchExplanation || '').trim(),
                            // The server generates these (ingredient and contraindication
                            // warnings tailored to endometriosis / PCOS / TTC status) and
                            // this mapping used to drop the field entirely, so they were
                            // never rendered on the primary ecosystem surface —
                            // Recommendations.jsx shows them, but that view renders the
                            // rule-based engine, not LLM output.
                            safetyFlags: Array.isArray(tier?.safetyFlags)
                                ? tier.safetyFlags.map((f) => String(f)).filter(Boolean).slice(0, 5)
                                : [],
                        };
                    })
                    .filter(Boolean);

                const fallbackTop = isBlockedRecommendationProduct(entry?.topProduct) ? null : (entry?.topProduct || null);
                const fallbackAlternatives = (Array.isArray(entry?.alternatives) ? entry.alternatives : [])
                    .filter(Boolean)
                    .filter((p) => !isBlockedRecommendationProduct(p))
                    .filter((p) => !fallbackTop || p.id !== fallbackTop.id)
                    .slice(0, 3);
                const normalizedTiers = tiers.length > 0
                    ? tiers
                    : (fallbackTop
                        ? [{
                            id: 'tier-1',
                            label: 'Top pick',
                            product: fallbackTop,
                            alternatives: fallbackAlternatives,
                            matchExplanation: '',
                        }]
                        : []);
                return {
                    id: `${concern}-${idx}`,
                    concern,
                    tag: null,
                    topProduct: normalizedTiers[0]?.product || fallbackTop || null,
                    alternatives: normalizedTiers[0]?.alternatives || fallbackAlternatives,
                    tiers: normalizedTiers,
                    notes: Array.isArray(entry?.notes) ? entry.notes : [],
                };
            })
            .filter(Boolean)
            .filter((section) => section.tiers.length > 0);

        return sections.sort((a, b) => {
            const ai = concernRank.has(a.concern.toLowerCase()) ? concernRank.get(a.concern.toLowerCase()) : Number.MAX_SAFE_INTEGER;
            const bi = concernRank.has(b.concern.toLowerCase()) ? concernRank.get(b.concern.toLowerCase()) : Number.MAX_SAFE_INTEGER;
            return ai - bi;
        });
    }, [hasCompletedPersonalization, activeTiered, quizResults]);

    useEffect(() => {
        setRecommendedSwapByKey({});
    }, [intakeFingerprint, activeTiered.length]);

    useEffect(() => {
        if (!recommendedProductsForDisplay.length) {
            setRecommendedSectionOpen({});
            return;
        }
        setRecommendedSectionOpen((prev) => {
            const next = {};
            recommendedProductsForDisplay.forEach((section) => {
                next[section.id] = Object.prototype.hasOwnProperty.call(prev, section.id) ? prev[section.id] : true;
            });
            return next;
        });
    }, [recommendedProductsForDisplay]);

    // When LLM results arrive, push ALL tier products into the ecosystem (supplement + physical + telehealth)
    useEffect(() => {
        // Guard: only fire when we have actual LLM results, not the rule-based fallback
        if (!llmTiered.length) return;
        if (!recommendedProductsForDisplay.length || !onBuildEcosystemFromLlm) return;
        // Only build the ecosystem when explicitly requested:
        // quiz completion sets ayna_force_llm_refresh → nonce=1, rebuild button increments nonce
        // Never auto-generate on page load or login, even if ecosystem is empty
        if (recommendationRefreshNonce === 0) return;
        // Each concern has 3 tiers (supplement, physical, telehealth) — add each as its own ecosystem card
        // Coverage first: put the strongest product from every distinct concern
        // into the ecosystem before adding a second or third product from any
        // one concern. This keeps broad profiles from being visually dominated
        // by several products for the same need while other selected needs are
        // pushed to the bottom.
        const enrichedProducts = [];
        const seenProductIds = new Set();
        const sectionsWithTiers = recommendedProductsForDisplay.map((section) => ({
            section,
            tiers: Array.isArray(section?.tiers) ? section.tiers : [],
        }));
        const maxTierCount = Math.max(0, ...sectionsWithTiers.map(({ tiers }) => tiers.length));

        for (let tierIndex = 0; tierIndex < maxTierCount; tierIndex += 1) {
            sectionsWithTiers.forEach(({ section, tiers }) => {
                const tier = tiers[tierIndex];
                const product = tier?.product;
                if (!product?.id || seenProductIds.has(product.id)) return;

                seenProductIds.add(product.id);
                enrichedProducts.push({
                    ...product,
                    // Always re-derive from concern — never trust healthFunctions the LLM may have added
                    healthFunctions: inferHealthFunctionsFromLlm(product, section.concern, tier?.subcategory || ''),
                    _llmAlternatives: (tier.alternatives || []).filter(p => p && p.id !== product.id).slice(0, 3),
                    _llmConcern: section.concern || '',
                });
            });
        }
        if (!enrichedProducts.length) return;
        onBuildEcosystemFromLlm(enrichedProducts);
        posthog.capture('recommendation_viewed', { concernCount: recommendedProductsForDisplay.length });
    }, [recommendedProductsForDisplay, onBuildEcosystemFromLlm, llmTiered, recommendationRefreshNonce]);

    // Bounded worker pool — mirrors the fix already applied to Discovery.jsx.
    // Both effects below used to fire one request per product with no cap: a
    // freshly-generated ecosystem can carry a top product + up to 3
    // alternatives across a dozen-plus concerns, all placeholder-imaged, so a
    // single render could burst 40-50+ concurrent /api/product-image calls.
    // Some of those got rate-limited or timed out, and a failed lookup is
    // recorded as "resolved to no image" (never retried this mount) — so
    // under load, some cards permanently kept the generic placeholder even
    // though the image existed and a later, unthrottled request would have
    // found it.
    const IMAGE_RESOLVE_CONCURRENCY = 5;
    const resolveImagesBounded = (items, cancelledRef) => {
        const queue = [...items];
        const worker = async () => {
            while (!cancelledRef.cancelled) {
                const item = queue.shift();
                if (!item) return;
                const url = await resolveProductImage(item.name, item.brand || '', item.url || '', item.type || '');
                if (cancelledRef.cancelled) return;
                setResolvedImages((prev) => (prev[item.id] !== undefined ? prev : { ...prev, [item.id]: url || '' }));
            }
        };
        Promise.all(Array.from({ length: Math.min(IMAGE_RESOLVE_CONCURRENCY, queue.length) }, worker))
            .catch((e) => console.warn('[Ayna] image resolution failed:', e?.message));
    };

    useEffect(() => {
        if (!activeTiered || !activeTiered.length) return;
        const needed = [];
        activeTiered.forEach((entry) => {
            const product = entry.topProduct || entry.tiers?.[0]?.product;
            if (product && product.llmGenerated && product.name && resolvedImages[product.id] === undefined) {
                needed.push(product);
            }
            const alts = entry.alternatives || entry.tiers?.[0]?.alternatives || [];
            alts.forEach((alt) => {
                if (alt && alt.name && resolvedImages[alt.id] === undefined) needed.push(alt);
            });
        });
        if (needed.length === 0) return undefined;
        const cancelledRef = { cancelled: false };
        resolveImagesBounded(needed, cancelledRef);
        return () => { cancelledRef.cancelled = true; };
    }, [activeTiered]);

    useEffect(() => {
        // myProductList is deliberately excluded here — ProductTileImage
        // (used everywhere "Your products" tiles render) now resolves those
        // images itself on demand. Keeping this effect's own fetch for the
        // same items too meant every ecosystem product ran two independent
        // resolveProductImage() calls per mount; resolveProductImage()'s
        // shared memCache/localStorage dedupes the network cost, but it's
        // still redundant work. recommendedProducts still needs this path —
        // it feeds IntakeRecommendationsProductCard/IntakeRecAltMini, which
        // don't use ProductTileImage.
        const recommendedProducts = recommendedProductsForDisplay
            .flatMap((s) => (Array.isArray(s?.tiers) ? s.tiers : []))
            .flatMap((tier) => [tier?.product, ...(Array.isArray(tier?.alternatives) ? tier.alternatives : [])])
            .filter(Boolean);
        const productsNeedingImage = recommendedProducts
            .filter((p) => p && p.id && p.name)
            .filter((p) => resolvedImages[p.id] === undefined)
            .filter((p) => isPlaceholderProductImage(p.image, p.type === 'digital'));
        if (productsNeedingImage.length === 0) return undefined;
        const cancelledRef = { cancelled: false };
        resolveImagesBounded(productsNeedingImage, cancelledRef);
        return () => { cancelledRef.cancelled = true; };
    }, [recommendedProductsForDisplay, resolvedImages]);


    const toggleEcosystemCompare = useCallback((k) => {
        setEcosystemCompareOpen((prev) => ({ ...prev, [k]: !prev[k] }));
        setEcosystemAltMiniKey('');
    }, []);

    const selectEcosystemAltMini = useCallback((key) => {
        setEcosystemAltMiniKey(key);
        if (key) setEcosystemCompareOpen({});
    }, []);

    const handleSwapFromRecommendedCard = useCallback((cardKey, oldProductId, newProduct) => {
        if (!cardKey || !newProduct?.id) return;
        setRecommendedSwapByKey((prev) => ({ ...prev, [cardKey]: newProduct }));
    }, []);

    const handleRefreshRecommendations = useCallback(() => {
        // Deliberately don't clear llmTiered or the cache here — the current
        // (old) ecosystem stays on screen and in cache until a full new set
        // successfully replaces it, so a cancelled rebuild has something to fall back to.
        setLlmError('');
        setRecommendationRefreshNonce((n) => n + 1);
    }, []);

    const handleCancelRecommendations = useCallback(() => {
        if (intakeFingerprint) discardGeneration(intakeFingerprint);
        setLlmTiered(previousLlmTieredRef.current);
        setLlmLoading(false);
        setLlmLoadStartedAt(0);
        // Only record "already attempted" when there is something to fall back
        // to. Cancelling a FIRST build left previousLlmTiered empty while still
        // marking the fingerprint fetched, so the next mount showed a blank
        // ecosystem with no error and no way to retry.
        setLlmPartialConcerns([]);
        if (intakeFingerprint && previousLlmTieredRef.current.length > 0) {
            saveFetchedLlmFingerprint(intakeFingerprint);
            setLlmError('');
        } else {
            setLlmError('We stopped building your recommendations. Tap “Refresh recommendations” to try again.');
        }
    }, [intakeFingerprint]);

    const recommendedSection = hasCompletedPersonalization && (llmLoading || llmError || llmPartialConcerns.length > 0 || recommendedProductsForDisplay.length > 0 || activeTiered.length > 0) ? (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Recommended for You
                    {llmLoading && <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>loading…</span>}
                </h3>
                <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                    onClick={handleRefreshRecommendations}
                    disabled={llmLoading || !hasCompletedPersonalization}
                    title="Get new picks based on your latest answers"
                >
                    {llmLoading ? 'Refreshing…' : 'Refresh recommendations'}
                </button>
            </div>
            {llmLoading && llmLoadStartedAt > 0 && (
                <LlmRecommendationsLoadingBlock loadStartedAt={llmLoadStartedAt} compact onCancel={handleCancelRecommendations} />
            )}
            {llmLoading && !llmLoadStartedAt && (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: '1.5rem' }}>
                    Loading recommendations…
                </p>
            )}
            {llmError && !llmLoading && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                    We couldn't load your recommendations: {llmError}
                </p>
            )}
            {/* Partial success, not a failure — most of the ecosystem DID build.
                Deliberately neutral styling (not the red "couldn't build" banner
                elsewhere in this file), since a couple of missing sections isn't
                the same as the whole build failing. */}
            {llmPartialConcerns.length > 0 && !llmError && !llmLoading && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: '0 0 0.75rem' }}>
                    Couldn't generate picks for {llmPartialConcerns.join(', ')} this time.{' '}
                    <button
                        type="button"
                        onClick={handleRefreshRecommendations}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                    >
                        Refresh to try again
                    </button>
                </p>
            )}
            {!llmLoading && recommendedProductsForDisplay.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {recommendedProductsForDisplay.map((section) => {
                        const isOpen = recommendedSectionOpen[section.id] === true;
                        return (
                            <div key={section.id} className="card" style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-soft)' }}>
                                <button
                                    type="button"
                                    onClick={() => setRecommendedSectionOpen((prev) => ({ ...prev, [section.id]: !isOpen }))}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        textAlign: 'left',
                                    }}
                                >
                                    <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
                                        {normalizeConcernLabel(section.concern)}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{isOpen ? 'Hide ▴' : 'Show ▾'}</span>
                                </button>
                                {isOpen && (
                                    <div style={{ marginTop: '0.65rem' }}>
                                        {Array.isArray(section.tiers) && section.tiers.length > 0 ? (
                                            <div className="ecosystem-product-grid" style={{ alignItems: 'stretch' }}>
                                                {section.tiers.map((tier, tierIdx) => {
                                                    const swapKey = `${section.id}::${tier.id || tierIdx}`;
                                                    const product = recommendedSwapByKey[swapKey] || tier.product;
                                                    if (!product) return null;
                                                    // Always rotate within the fixed 4-product pool — never repopulate
                                                    const tierPool = [tier.product, ...(tier.alternatives || [])].filter(Boolean);
                                                    const rotatedAlternatives = tierPool.filter(p => p?.id !== product.id).slice(0, 3);
                                                    const llmReason = String(product?.whyItWorks || '').trim();
                                                    const reasonRaw = getRecommendationExplanation(product, quizResults, healthProfile)?.whyItWorks || '';
                                                    const fallbackReason = String(reasonRaw).replace(/^Why it could work:\s*/i, '').trim();
                                                    const tierReason = toConciseReason(
                                                        llmReason || String(tier.matchExplanation || '').trim() || fallbackReason,
                                                        `Matched to your concern: ${section.concern}.`
                                                    );
                                                    return (
                                                        <div key={swapKey} style={{ minWidth: 0 }}>
                                                            <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                                {tier.label}
                                                            </div>
                                                            <EcosystemFunctionProductCard
                                                                product={{ ...product, image: resolvedImages[product.id] || product.image }}
                                                                healthFunctionLabel={tier.label}
                                                                onOpenProduct={onOpenProduct}
                                                                onToggleProduct={onToggleProduct}
                                                                seedEntry={{ frustration: section.concern, tag: section.tag }}
                                                                quizResults={quizResults}
                                                                healthProfile={healthProfile}
                                                                precomputedAlternatives={rotatedAlternatives}
                                                                onSwapSeedProduct={(oldProductId, newProduct) => handleSwapFromRecommendedCard(swapKey, oldProductId, newProduct)}
                                                                onGoToSearch={onGoToSearch}
                                                                isInEcosystem={!!myProducts[product.id]}
                                                                recommendationReason={tierReason}
                                                            />
                                                            {/* Ingredient / contraindication warnings the model raised for
                                                                this user's specific profile. Generated server-side and
                                                                previously discarded before reaching any UI. */}
                                                            {Array.isArray(tier.safetyFlags) && tier.safetyFlags.length > 0 && (
                                                                <p style={{
                                                                    margin: '0.4rem 0 0', fontSize: '0.72rem', lineHeight: 1.45,
                                                                    color: '#92400E', background: '#FFFBEB',
                                                                    border: '1px solid #FDE68A', borderRadius: '6px',
                                                                    padding: '0.4rem 0.55rem',
                                                                }}>
                                                                    <strong>Heads up:</strong> {tier.safetyFlags.join(' · ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                                Nothing here yet for this concern. Try searching instead.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    ) : null;

    return (
        <>
            <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
                {/* Board 2a ("Ecosystem page, restructured") from the Aug 2026
                    mockup pass: one persistent left summary, one scrolling
                    content column, nothing competing for the top of the page —
                    replaces the old Overview/Details tab switcher, which
                    duplicated "your ecosystem" as two separate stacked headers. */}
                <EcosystemBubbles
                    myProducts={myProducts}
                    quizResults={quizResults}
                    healthProfile={healthProfile}
                    user={user}
                    onOpenProduct={onOpenProduct}
                    onExploreArea={(area) => onGoToSearch?.(exploreAreaOptions(area))}
                    onToggleProduct={onToggleProduct}
                />

                {llmError && !llmLoading && (
                    <div style={{ textAlign: 'center', padding: '0.75rem', margin: '0 auto 1.5rem', maxWidth: '900px', background: '#FEF2F2', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                        Couldn&apos;t refresh your matches. <button type="button" style={{ background: 'none', border: 'none', color: '#991B1B', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', padding: 0 }} onClick={handleRefreshRecommendations}>Try again</button>
                    </div>
                )}

                <div className="eco2-body">
                    <aside className="eco2-sidebar">
                        <div className="eco2-sidebar__card">
                            <p className="eco2-sidebar__eyebrow">Your ecosystem</p>
                            {llmLoading ? (
                                <p className="eco2-sidebar__loading">Building your matches…</p>
                            ) : (
                                <>
                                    <h2 className="eco2-sidebar__count">
                                        {myProductList.length} product{myProductList.length === 1 ? '' : 's'}
                                    </h2>
                                    {(shelfAreaBreakdown.clinicianCount > 0 || estimatedMonthlyTotal.counted > 0) && (
                                        <p className="eco2-sidebar__sub">
                                            {[
                                                shelfAreaBreakdown.clinicianCount > 0 ? `${shelfAreaBreakdown.clinicianCount} clinician${shelfAreaBreakdown.clinicianCount === 1 ? '' : 's'}` : null,
                                                estimatedMonthlyTotal.counted > 0 ? `~$${estimatedMonthlyTotal.total.toFixed(0)}${estimatedMonthlyTotal.counted < estimatedMonthlyTotal.totalItems ? '+' : ''}/mo` : null,
                                            ].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                </>
                            )}
                            {shelfAreaBreakdown.filled.length > 0 && (
                                <>
                                    <div className="eco2-sidebar__bar">
                                        {shelfAreaBreakdown.filled.map((area, i) => (
                                            <i
                                                key={area.key}
                                                style={{
                                                    width: `${(area.count / myProductList.length) * 100}%`,
                                                    background: SHELF_AREA_COLORS[i % SHELF_AREA_COLORS.length],
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <ul className="eco2-sidebar__legend">
                                        {shelfAreaBreakdown.filled.map((area, i) => (
                                            <li key={area.key}>
                                                <span className="eco2-dot" style={{ background: SHELF_AREA_COLORS[i % SHELF_AREA_COLORS.length] }} />
                                                {area.label}
                                                <strong>{area.count}</strong>
                                            </li>
                                        ))}
                                        {shelfAreaBreakdown.gap && (
                                            <li className="eco2-sidebar__legend--gap">
                                                <span className="eco2-dot eco2-dot--empty" />
                                                {shelfAreaBreakdown.gap.label}
                                                {typeof onGoToSearch === 'function' && (
                                                    <button type="button" onClick={() => onGoToSearch(exploreAreaOptions(shelfAreaBreakdown.gap))}>Add</button>
                                                )}
                                            </li>
                                        )}
                                    </ul>
                                </>
                            )}
                            {typeof onBuildEcosystem === 'function' && (
                                <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={onBuildEcosystem}>
                                    {myProductList.length ? 'Rebuild' : 'Build ecosystem'}
                                </button>
                            )}
                        </div>

                        <div className="eco2-sidebar__card">
                            <p className="eco2-sidebar__eyebrow">Tools</p>
                            {typeof onEditHealthProfile === 'function' && (
                                <button type="button" className="eco2-tool-row" onClick={onEditHealthProfile}>Update profile<span>›</span></button>
                            )}
                            {typeof onOpenDoctorPrep === 'function' && (
                                <button type="button" className="eco2-tool-row" onClick={onOpenDoctorPrep}>Doctor prep<span>›</span></button>
                            )}
                            <button type="button" className="eco2-tool-row" onClick={() => setShowMoreTools(true)}>More tools<span>›</span></button>
                        </div>
                    </aside>

                    <main className="eco2-main">
                        <div className="eco2-main__head">
                            <h2>Your shelves</h2>
                            {typeof onGoToSearch === 'function' && (
                                <button type="button" className="eco2-main__fill-gaps" onClick={() => onGoToSearch('')}>Fill the gaps →</button>
                            )}
                        </div>
                        <EcosystemShelf
                            hideTitle
                            myProducts={myProducts}
                            onOpenProduct={onOpenProduct}
                            onExploreArea={(area) => onGoToSearch?.(exploreAreaOptions(area))}
                        />
                        <div style={{ textAlign: 'center', margin: '1rem 0 2rem' }}>
                            <button type="button" className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={() => setShowAddModal(true)}>+ Add something you already use</button>
                        </div>

                        <h2 className="eco2-main__details-title">Details</h2>
                        <div className="eco2-details">
                            {smsCardShown && (
                                <div className="eco2-details__sms">
                                    <button
                                        type="button"
                                        onClick={handleDismissSmsCard}
                                        aria-label="Dismiss"
                                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--color-text-muted)' }}
                                    >
                                        ✕
                                    </button>
                                    {phoneNumberInfo?.is_verified ? (
                                        <>
                                            <p style={{ margin: '0 0 0.4rem', fontWeight: 600 }}>Text Ayna to get quick health answers</p>
                                            {AYNA_SMS_NUMBER && (
                                                <p style={{ margin: '0 0 0.6rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{AYNA_SMS_NUMBER}</p>
                                            )}
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {AYNA_SMS_NUMBER && (
                                                    <a className="btn btn-outline" href={buildAynaVCardDataUri(AYNA_SMS_NUMBER)} download="Ayna.vcf">
                                                        Save to Contacts
                                                    </a>
                                                )}
                                                <button type="button" className="btn btn-outline" onClick={handleCopySmsNumber}>
                                                    {smsCardCopied ? 'Copied!' : 'Copy number'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p style={{ margin: '0 0 0.6rem', fontWeight: 600 }}>Get Ayna by text. Verify your number</p>
                                            <button type="button" className="btn btn-primary" onClick={onOpenPhoneVerify}>Verify your number</button>
                                        </>
                                    )}
                                </div>
                            )}

                            <details className="eco2-details__item" open>
                                <summary>
                                    <span>Sync wearable &amp; app data</span>
                                    <span className="eco2-details__hint">Sharpens your matches. Nothing is shared.</span>
                                </summary>
                                <div className="eco2-details__body">
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                                        {SYNC_SOURCES.map((src) => (
                                            <button
                                                key={src.id}
                                                type="button"
                                                onClick={() => !isPremium && setShowSyncPaywall(true)}
                                                title={isPremium ? `Connect ${src.label}` : `${src.label}. Requires ayna Premium`}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.4rem 0.85rem',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: 'var(--color-surface)',
                                                    fontSize: '0.82rem', fontWeight: '500',
                                                    color: isPremium ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                                                    cursor: isPremium ? 'default' : 'pointer',
                                                    opacity: isPremium ? 0.7 : 1,
                                                }}
                                            >
                                                <span>{src.label}</span>
                                                {!isPremium && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>· Premium</span>}
                                                {isPremium && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>· coming soon</span>}
                                            </button>
                                        ))}
                                    </div>
                                    <button type="button" className="btn btn-outline" style={{ fontSize: '0.85rem', opacity: 0.6, cursor: 'default' }} disabled>
                                        Coming soon
                                    </button>
                                </div>
                            </details>

                            <details className="eco2-details__item" ref={careNearYouDetailsRef}>
                                <summary>
                                    <span>Care near you</span>
                                    <span className="eco2-details__hint">Find a clinician, HRSA/Planned Parenthood links, and matching telehealth</span>
                                </summary>
                                <div className="eco2-details__body">
                                    <CareNearYouPanel
                                        compact
                                        quizResults={quizResults}
                                        healthProfile={healthProfile}
                                        userZipCode={userZipCode}
                                        onZipCodeChange={onZipCodeChange}
                                        onOpenProduct={onOpenProduct}
                                        onEditHealthProfile={onEditHealthProfile}
                                    />
                                </div>
                            </details>

                            <details className="eco2-details__item">
                                <summary>
                                    <span>Why these matches</span>
                                    <span className="eco2-details__hint">Sources and scoring behind your shelves</span>
                                </summary>
                                <div className="eco2-details__body">
                                    <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--color-text-main)' }}>
                                        ayna scores products against your intake answers — stage, goals, sensitivities,
                                        and life stage — plus published clinical, community, and safety sources per
                                        product. When the catalog has no strong fit for a concern, ayna searches for and
                                        adds a real, currently-sold product rather than leaving the shelf empty. Update
                                        your profile any time and your shelves recompute against the new answers.
                                    </p>
                                </div>
                            </details>

                        </div>
                    </main>
                </div>

                {showMoreTools && (
                    <div className="eco2-sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowMoreTools(false); }}>
                        <div className="eco2-sheet">
                            <button type="button" className="eco2-sheet__close" onClick={() => setShowMoreTools(false)} aria-label="Close">✕</button>
                            <p className="eco2-sidebar__eyebrow">More tools</p>
                            <h2 className="eco2-sheet__title">One thing you can do.</h2>
                            <button
                                type="button"
                                className="eco2-tool-row"
                                onClick={() => {
                                    setShowMoreTools(false);
                                    const el = careNearYouDetailsRef.current;
                                    if (el) {
                                        el.open = true;
                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }}
                            >
                                Find a clinician
                                <span className="eco2-tool-row__hint">In-network, near you</span>
                            </button>
                            {/* Log a symptom, check an ingredient, and export my data aren't
                                real features yet anywhere in this app — deliberately not
                                shown here rather than shipped as dead buttons. */}
                        </div>
                    </div>
                )}

            </section>

            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(43, 42, 41, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }} onClick={() => setShowAddModal(false)} className="animate-fade-in-up">
                    <div style={{
                        backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)',
                        width: '100%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: 'var(--shadow-lg)', padding: '2rem'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add to Your Ecosystem</h3>
                        <input
                            type="text"
                            placeholder="Search by name or category..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem 1rem', fontSize: '1rem',
                                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem', fontFamily: 'var(--font-body)', outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredProducts.map(product => {
                                const isAdded = !!myProducts[product.id];
                                return (
                                    <button
                                        key={product.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                                            background: isAdded ? 'var(--color-secondary-fade)' : 'transparent',
                                            border: `1px solid ${isAdded ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', width: '100%'
                                        }}
                                        onClick={() => onToggleProduct(product)}
                                    >
                                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                                            <ProductTileImage
                                                product={product}
                                                alt={product.name}
                                                imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                letterNode={<ProductImageFallback compact />}
                                            />
                                        </div>
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{product.name}{product.outOfBusiness && <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{product.category} · {product.type}</div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: isAdded ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                            {isAdded ? '✓ Added' : '+ Add'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        {showSyncPaywall && (
            <SubscriptionPaywallModal
                onClose={() => setShowSyncPaywall(false)}
                featureName="wearable and health app syncing"
            />
        )}
        </>
    );
}
