import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import SubscriptionPaywallModal from './SubscriptionPaywallModal';
import {
    HEALTH_FUNCTIONS,
    ALL_PRODUCTS,
    CATEGORY_LABELS,
    detectDuplicates,
    getEcosystemAlternatives,
    getRecommendationExplanation,
} from '../data/products';
import { getInteractions } from '../data/interactions';
import CareNearYouPanel from './CareNearYouPanel';
import LlmRecommendationsLoadingBlock from './LlmRecommendationsLoadingBlock';
import HealthDataImport from './HealthDataImport';
import { generateTieredRecommendations } from '../utils/recommendationEngine';
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
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
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

const AYNA_SMS_NUMBER = import.meta.env.VITE_AYNA_SMS_NUMBER || '';
const SMS_CARD_DISMISS_KEY = 'ayna_sms_card_dismissed_at';
const SMS_CARD_RESHOWN_KEY = 'ayna_sms_card_last_reshown_at';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
    const displayImage = resolvedCardImage || product.image || '';

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
        resolveProductImage(product.name, product.brand || '', product.url || '').then((url) => {
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
                    <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: '2rem', lineHeight: 1, color: 'rgba(176, 122, 58, 0.55)' }} aria-hidden>
                        {(product.brand || product.name || '?').trim().charAt(0).toUpperCase()}
                    </span>
                ) : (
                    <img
                        src={displayImage}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                                    <img src={a.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(160deg, #F3EADC, #EFE3D2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: '1.25rem', color: 'rgba(176, 122, 58, 0.55)' }} aria-hidden>
                                {(alt.brand || alt.name || '?').trim().charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-main)', lineHeight: 1.3 }}>{alt.name}</div>
                    {alt.brand && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{alt.brand}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
                        <button type="button" className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }} onClick={() => onToggleProduct(alt)}>
                            {inEco ? '✓ In ecosystem' : '+ Add to Ecosystem'}
                        </button>
                        <button type="button" className="btn btn-primary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }} onClick={() => onOpenProduct(alt)}>
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
            <div style={{ height: '96px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                {imgSrc ? (
                    <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(160deg, #F3EADC, #EFE3D2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: '1.5rem', color: 'rgba(176, 122, 58, 0.55)' }} aria-hidden>
                            {(product.brand || product.name || '?').trim().charAt(0).toUpperCase()}
                        </span>
                    </div>
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
                    <button type="button" className="btn btn-primary" style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem' }} onClick={() => onOpenProduct(product)}>
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
    const cat = String(product.category || '').toLowerCase();
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
    const [ecosystemPageMode, setEcosystemPageMode] = useState('overview');
    const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
    const [showSyncPaywall, setShowSyncPaywall] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const viewMode = 'function';
    const [interactionSelection, setInteractionSelection] = useState(new Set()); // product ids for interaction check
    const [ecosystemCompareOpen, setEcosystemCompareOpen] = useState({});
    const [ecosystemAltMiniKey, setEcosystemAltMiniKey] = useState('');
    const [llmTiered, setLlmTiered] = useState([]);
    const [llmLoading, setLlmLoading] = useState(false);
    const [llmError, setLlmError] = useState('');
    const [llmLoadStartedAt, setLlmLoadStartedAt] = useState(0);
    // Last known-good complete recommendation set — restored if a rebuild is cancelled mid-flight.
    const previousLlmTieredRef = useRef([]);
    const [resolvedImages, setResolvedImages] = useState({});
    const [healthDataImportOpen, setHealthDataImportOpen] = useState(false);
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
    // Areas of care: myProductList grouped by category, for the circular summary at the top of the page.
    const careAreas = useMemo(() => {
        const byCategory = new Map();
        myProductList.forEach((p) => {
            const key = p.category || 'other';
            if (!byCategory.has(key)) byCategory.set(key, []);
            byCategory.get(key).push(p);
        });
        return Array.from(byCategory.entries())
            .map(([category, items]) => ({
                category,
                label: CATEGORY_LABELS[category] || (category.charAt(0).toUpperCase() + category.slice(1)),
                count: items.length,
            }))
            .sort((a, b) => b.count - a.count);
    }, [myProductList]);
    const { functionMap } = useMemo(() => detectDuplicates(myProductIds, myProducts), [myProductIds, myProducts]);
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

    const integrationMap = useMemo(() => {
        const map = {};
        myProductList.forEach(p => {
            const integrations = Array.isArray(p.integrations) ? p.integrations : (p.integrations ? [p.integrations] : ['No Integration']);
            integrations.forEach(int => {
                if (!map[int]) map[int] = [];
                map[int].push(p);
            });
        });
        return map;
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

    const interactionProductList = useMemo(() => {
        return myProductList.filter(p => interactionSelection.has(p.id));
    }, [myProductList, interactionSelection]);
    const interactionResults = useMemo(() => getInteractions(interactionProductList), [interactionProductList]);
    const toggleInteractionSelect = (product) => {
        setInteractionSelection(prev => {
            const next = new Set(prev);
            if (next.has(product.id)) next.delete(product.id);
            else next.add(product.id);
            return next;
        });
    };

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
                setLlmLoadStartedAt(0);
                return undefined;
            }
            if (alreadyFetchedForFingerprint) {
                // A prior failed generation used to poison this intake forever:
                // the fingerprint was recorded even when no recommendations were
                // cached, so a reload would refuse to try again. If there is no
                // cached payload, retry normally instead of trapping the user.
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
            setLlmLoadStartedAt(rec.startedAt);
        };

        const unsubscribe = subscribeToGeneration(intakeFingerprint, onUpdate, (rec) => {
            const intake = quizResults?.fullHealthIntake || null;
            console.log('[Ayna LLM] Starting fetch. Concerns:', intake?.primaryConcerns?.length ?? 0, '| goals:', intake?.goals?.length ?? 0, '| intake null?', !intake);

            rec.controller = new AbortController();
            rec.startedAt = Date.now();
            rec.loading = true;
            rec.error = '';
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
                    // 4 x 3 covers the server's MAX_CONCERNS cap of 12.
                    const BATCH_SIZE = 3;
                    const NUM_BATCHES = 4;
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
                            rec.error = "You've already generated your Ayna ecosystem. Regenerating is a premium feature. Email pulomabishnu@gmail.com to upgrade.";
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
                        const missed = Array.from(new Set(partialConcerns)).slice(0, 4).join(', ');
                        rec.error = `Some recommendations couldn’t be generated (${missed}). Tap “Refresh recommendations” to retry those.`;
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
        const enrichedProducts = recommendedProductsForDisplay
            .flatMap(section =>
                (section.tiers || []).map(tier => {
                    const product = tier?.product;
                    if (!product) return null;
                    return {
                        ...product,
                        // Always re-derive from concern — never trust healthFunctions the LLM may have added
                        healthFunctions: inferHealthFunctionsFromLlm(product, section.concern, tier?.subcategory || ''),
                        _llmAlternatives: (tier.alternatives || []).filter(p => p && p.id !== product.id).slice(0, 3),
                        _llmConcern: section.concern || '',
                    };
                })
            )
            .filter(Boolean);
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
                const url = await resolveProductImage(item.name, item.brand || '', item.url || '');
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
        const recommendedProducts = recommendedProductsForDisplay
            .flatMap((s) => (Array.isArray(s?.tiers) ? s.tiers : []))
            .flatMap((tier) => [tier?.product, ...(Array.isArray(tier?.alternatives) ? tier.alternatives : [])])
            .filter(Boolean);
        const productsNeedingImage = [...myProductList, ...recommendedProducts]
            .filter((p) => p && p.id && p.name)
            .filter((p) => resolvedImages[p.id] === undefined)
            .filter((p) => isPlaceholderProductImage(p.image));
        if (productsNeedingImage.length === 0) return undefined;
        const cancelledRef = { cancelled: false };
        resolveImagesBounded(productsNeedingImage, cancelledRef);
        return () => { cancelledRef.cancelled = true; };
    }, [myProductList, recommendedProductsForDisplay, resolvedImages]);


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
        if (intakeFingerprint && previousLlmTieredRef.current.length > 0) {
            saveFetchedLlmFingerprint(intakeFingerprint);
            setLlmError('');
        } else {
            setLlmError('We stopped building your recommendations. Tap “Refresh recommendations” to try again.');
        }
    }, [intakeFingerprint]);

    const recommendedSection = hasCompletedPersonalization && (llmLoading || llmError || recommendedProductsForDisplay.length > 0 || activeTiered.length > 0) ? (
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
                <div className="eco-overview-shell">
                    <div className="eco-overview-head">
                        <div>
                            <p className="eco-overview-eyebrow">Your ecosystem</p>
                            <h1>This is your ecosystem.</h1>
                            <p>{myProductList.length ? `${myProductList.length} product${myProductList.length === 1 ? '' : 's'} across ${careAreas.length} care area${careAreas.length === 1 ? '' : 's'}.` : 'Start with a few picks. Ayna will organize them here.'}</p>
                        </div>
                        <div className="eco-overview-switch" role="group" aria-label="Ecosystem view">
                            <button type="button" className={ecosystemPageMode === 'overview' ? 'is-active' : ''} onClick={() => setEcosystemPageMode('overview')}>Overview</button>
                            <button type="button" className={ecosystemPageMode === 'details' ? 'is-active' : ''} onClick={() => setEcosystemPageMode('details')}>Details</button>
                        </div>
                    </div>

                    {ecosystemPageMode === 'overview' && llmLoading && (
                        <div className="eco-overview-status">Building your matches…</div>
                    )}
                    {ecosystemPageMode === 'overview' && llmError && !llmLoading && (
                        <div className="eco-overview-status eco-overview-status--error">
                            Couldn&apos;t refresh. <button type="button" onClick={handleRefreshRecommendations}>Try again</button>
                        </div>
                    )}

                    {ecosystemPageMode === 'overview' && (
                        <>
                            <div className="eco-overview-grid">
                                <div className="eco-overview-scorecard">
                                    <div className="eco-overview-ring">
                                        <div>
                                            <strong>{myProductList.length}</strong>
                                            <span>products</span>
                                        </div>
                                    </div>
                                    <div className="eco-overview-mini-stats">
                                        <div><strong>{careAreas.length}</strong><span>care areas</span></div>
                                        <div><strong>{estimatedMonthlyTotal.counted > 0 ? `$${estimatedMonthlyTotal.total.toFixed(0)}` : '—'}</strong><span>est. / month</span></div>
                                    </div>
                                </div>

                                <div className="eco-overview-areas">
                                    <div className="eco-overview-section-label">Coverage</div>
                                    {careAreas.length > 0 ? careAreas.slice(0, 6).map((area) => {
                                        const maxCount = Math.max(1, ...careAreas.map((item) => item.count));
                                        const width = Math.max(16, Math.round((area.count / maxCount) * 100));
                                        return (
                                            <div key={area.category} className="eco-overview-area-row">
                                                <span>{area.label}</span>
                                                <div><i style={{ width: `${width}%` }} /></div>
                                                <strong>{area.count}</strong>
                                            </div>
                                        );
                                    }) : (
                                        <button type="button" className="eco-overview-empty" onClick={onBuildEcosystem}>Build your ecosystem</button>
                                    )}
                                </div>
                            </div>

                            {myProductList.length > 0 && (
                                <div className="eco-overview-products">
                                    <div className="eco-overview-products-head">
                                        <div>
                                            <div className="eco-overview-section-label">Current</div>
                                            <h2>Your products</h2>
                                        </div>
                                        <button type="button" onClick={() => setEcosystemPageMode('details')}>See details</button>
                                    </div>
                                    <div className="eco-overview-products-grid">
                                        {myProductList.slice(0, 6).map((product) => (
                                            <button type="button" key={product.id} className="eco-overview-product" onClick={() => onOpenProduct?.(product)}>
                                                <span className="eco-overview-product__image">
                                                    {product.image ? <img src={product.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <b>{String(product.brand || product.name || '?').charAt(0).toUpperCase()}</b>}
                                                </span>
                                                <span className="eco-overview-product__meta">{CATEGORY_LABELS[product.category] || product.category || 'Product'}</span>
                                                <strong>{product.name}</strong>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="eco-overview-actions">
                                {typeof onBuildEcosystem === 'function' && <button type="button" className="btn btn-primary" onClick={onBuildEcosystem}>{myProductList.length ? 'Rebuild ecosystem' : 'Build ecosystem'}</button>}
                                {typeof onEditHealthProfile === 'function' && <button type="button" className="btn btn-outline" onClick={onEditHealthProfile}>Update profile</button>}
                                <button type="button" className="btn btn-outline" onClick={() => setEcosystemPageMode('details')}>More details</button>
                            </div>
                        </>
                    )}
                </div>

                {ecosystemPageMode === 'details' && (
                    <div className="eco-details-clean">
                        <div className="eco-details-clean__intro">
                            <div>
                                <p className="eco-overview-section-label">Current</p>
                                <h2>Your products</h2>
                                <p>Everything you use, grouped by care area.</p>
                            </div>
                            <div className="eco-details-clean__intro-actions">
                                {typeof onBuildEcosystem === 'function' && (
                                    <button type="button" className="btn btn-primary" onClick={onBuildEcosystem}>Rebuild</button>
                                )}
                                {typeof onGoToSearch === 'function' && (
                                    <button type="button" className="btn btn-outline" onClick={() => onGoToSearch('')}>Browse</button>
                                )}
                            </div>
                        </div>

                        {careAreas.length > 0 ? (
                            <div className="eco-details-clean__groups">
                                {careAreas.map((area) => {
                                    const products = myProductList.filter((product) => (product.category || 'other') === area.category);
                                    return (
                                        <section key={area.category} className="eco-details-clean__group">
                                            <div className="eco-details-clean__group-head">
                                                <div>
                                                    <span>{area.label}</span>
                                                    <strong>{products.length}</strong>
                                                </div>
                                            </div>
                                            <div className="eco-details-clean__rows">
                                                {products.map((product) => (
                                                    <div key={product.id} className="eco-details-clean__row">
                                                        <button type="button" className="eco-details-clean__product" onClick={() => onOpenProduct?.(product)}>
                                                            <span className="eco-details-clean__thumb">
                                                                {product.image ? <img src={product.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <b>{String(product.brand || product.name || '?').charAt(0).toUpperCase()}</b>}
                                                            </span>
                                                            <span>
                                                                <strong>{product.name}</strong>
                                                                <small>{product.brand || CATEGORY_LABELS[product.category] || 'Product'}{product.price ? ` · ${product.price}` : ''}</small>
                                                            </span>
                                                        </button>
                                                        <div className="eco-details-clean__row-actions">
                                                            <button type="button" onClick={() => onOpenProduct?.(product)}>View</button>
                                                            <button type="button" onClick={() => onToggleProduct?.(product)}>Remove</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        ) : (
                            <button type="button" className="eco-overview-empty" onClick={onBuildEcosystem}>Build your ecosystem</button>
                        )}

                        <div className="eco-details-clean__footer">
                            {typeof onEditHealthProfile === 'function' && <button type="button" onClick={onEditHealthProfile}>Update profile</button>}
                            {typeof onOpenDoctorPrep === 'function' && <button type="button" onClick={onOpenDoctorPrep}>Doctor prep</button>}
                            <button type="button" onClick={() => setShowAdvancedDetails((value) => !value)}>{showAdvancedDetails ? 'Hide more tools' : 'More tools'}</button>
                        </div>
                    </div>
                )}

                <div className={ecosystemPageMode === 'details' && showAdvancedDetails ? 'eco-legacy-details' : 'eco-legacy-details eco-legacy-details--hidden'}>
                {careAreas.length > 0 && (
                    <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                        <p style={{
                            fontFamily: 'var(--font-label)', fontSize: '0.7rem', fontWeight: 500,
                            letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-amber-deep)',
                            marginBottom: '1.25rem',
                        }}>
                            Your ecosystem
                        </p>
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                            gap: '1.5rem 1.25rem', maxWidth: '640px', margin: '0 auto',
                        }}>
                            {careAreas.map((area) => (
                                <div key={area.category} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '104px' }}>
                                    <div style={{
                                        width: '92px', height: '92px', borderRadius: '50%',
                                        background: 'var(--hero-gradient)', color: '#fff',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: 'var(--shadow-md)',
                                    }}>
                                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 600, lineHeight: 1 }}>{area.count}</span>
                                        <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>{area.count === 1 ? 'pick' : 'picks'}</span>
                                    </div>
                                    <span style={{
                                        fontFamily: 'var(--font-label)', fontSize: '0.62rem', fontWeight: 500,
                                        letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)',
                                        textAlign: 'center', lineHeight: 1.3,
                                    }}>
                                        {area.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto var(--spacing-xl)' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '2.25rem' }}>My Cabinet</h2>
                </div>

                {smsCardShown && (
                    <div style={{
                        position: 'relative', maxWidth: '700px', margin: '0 auto var(--spacing-lg)',
                        background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
                    }}>
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
                                        <a
                                            className="btn btn-outline"
                                            href={buildAynaVCardDataUri(AYNA_SMS_NUMBER)}
                                            download="Ayna.vcf"
                                        >
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
                                <button type="button" className="btn btn-primary" onClick={onOpenPhoneVerify}>
                                    Verify your number
                                </button>
                            </>
                        )}
                    </div>
                )}

                {llmError && !llmLoading && (
                    <div style={{ textAlign: 'center', padding: '0.75rem', marginBottom: '1rem', background: '#FEF2F2', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                        We couldn't build your ecosystem: {typeof llmError === 'string' ? llmError : JSON.stringify(llmError)}. <button type="button" style={{ background: 'none', border: 'none', color: '#991B1B', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', padding: 0 }} onClick={handleRefreshRecommendations}>Try again</button>
                    </div>
                )}

                {/* SECTION 1. My Ecosystem */}
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', textAlign: 'center', color: 'var(--color-text-main)' }}>My Ecosystem</h3>
                <div style={{
                    display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
                    marginBottom: 'var(--spacing-lg)',
                }}>
                    {myProductList.length > 0 && (
                        <div style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px' }} title={estimatedMonthlyTotal.counted < estimatedMonthlyTotal.totalItems ? 'Some products don\'t show a clear monthly cost (like one-time visits), so your real total may be higher.' : undefined}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                                {estimatedMonthlyTotal.counted > 0
                                    ? `$${estimatedMonthlyTotal.total.toFixed(2)}${estimatedMonthlyTotal.counted < estimatedMonthlyTotal.totalItems ? '+' : ''}`
                                    : 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Estimated per month</div>
                        </div>
                    )}
                    <div style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>{myProductList.length}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Products Tracked</div>
                    </div>
                    <div style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-surface-contrast)' }}>{Object.keys(functionMap).length}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Health Functions</div>
                    </div>
                    <div style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px', cursor: 'pointer' }} onClick={onOpenDoctorPrep}>
                        <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: '700' }}>Appointment Prep</div>
                    </div>
                </div>

                {/* Action bar: Import Health Data + Retake Quiz */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 'var(--spacing-lg)' }}>
                    <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => setHealthDataImportOpen(true)}
                    >
                        Import Health Data
                    </button>
                    {typeof onBuildEcosystem === 'function' && (
                        <button type="button" className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={onBuildEcosystem}>
                            Retake Quiz
                        </button>
                    )}
                    {typeof onEditHealthProfile === 'function' && (
                        <button type="button" className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={onEditHealthProfile}>
                            Update Health Profile
                        </button>
                    )}
                </div>

                {/* Health data sync. Premium feature */}
                {(() => {
                    const SYNC_SOURCES = [
                        { id: 'apple-health', label: 'Apple Health' },
                        { id: 'strava', label: 'Strava' },
                        { id: 'garmin', label: 'Garmin' },
                        { id: 'flo', label: 'Flo' },
                        { id: 'whoop', label: 'Whoop' },
                        { id: 'oura', label: 'Oura Ring' },
                        { id: 'google-fit', label: 'Google Fit' },
                    ];
                    return (
                        <div style={{ marginBottom: 'var(--spacing-lg)', padding: '1.25rem 1.5rem', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
                                    Sync wearable &amp; app data
                                </span>
                                {!isPremium && (
                                    <span style={{ fontSize: '0.7rem', background: 'var(--color-secondary-fade)', color: 'var(--color-primary)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)', fontWeight: '600' }}>
                                        Premium
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {SYNC_SOURCES.map(src => (
                                    <button
                                        key={src.id}
                                        type="button"
                                        onClick={() => !isPremium && setShowSyncPaywall(true)}
                                        title={isPremium ? `Connect ${src.label}` : `${src.label}. Requires Ayna Premium`}
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
                        </div>
                    );
                })()}

                

                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add a Product or App</button>
                </div>

                {/* Only block when there is genuinely no usable ecosystem yet. */}
                {llmLoading && llmTiered.length === 0 && myProductList.length === 0 && (
                    llmLoadStartedAt > 0
                        ? <LlmRecommendationsLoadingBlock loadStartedAt={llmLoadStartedAt} compact onCancel={handleCancelRecommendations} />
                        : <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Building your ecosystem…</div>
                )}
                {llmError && !llmLoading && (
                    <div style={{ textAlign: 'center', padding: '1.5rem', background: '#FEF2F2', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid #FCA5A5' }}>
                        <p style={{ color: '#991B1B', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{typeof llmError === 'string' ? llmError : JSON.stringify(llmError)}</p>
                        <button type="button" className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={handleRefreshRecommendations}>Try again</button>
                    </div>
                )}

                {(myProductList.length === 0 && !llmLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>Your ecosystem is empty.</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>Answer a few health questions to build your ecosystem, or add products yourself.</p>
                    </div>
                ) : myProductList.length > 0 ? (
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {viewMode === 'function' ? (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {Object.entries(functionMap)
                                        .filter(([fn]) => fn !== 'leak-protection')
                                        .map(([fn, products]) => {
                                            if (products.length === 0) return null;
                                            return (
                                                <section key={fn}>
                                                    <div style={{ marginBottom: '0.65rem' }}>
                                                        <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>
                                                            {HEALTH_FUNCTIONS[fn]?.label}
                                                        </h3>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>{HEALTH_FUNCTIONS[fn]?.desc}</p>
                                                    </div>
                                                    <div className="ecosystem-product-grid">
                                                        {products.map((product) => {
                                                            const seedEntry = ecosystemSeedMeta[product.id];
                                                            const p = resolvedImages[product.id] ? { ...product, image: resolvedImages[product.id] } : product;
                                                            return (
                                                                <EcosystemFunctionProductCard
                                                                    key={product.id}
                                                                    product={p}
                                                                    healthFunctionLabel={HEALTH_FUNCTIONS[fn]?.label || fn}
                                                                    onOpenProduct={onOpenProduct}
                                                                    onToggleProduct={onToggleProduct}
                                                                    seedEntry={seedEntry}
                                                                    quizResults={quizResults}
                                                                    healthProfile={healthProfile}
                                                                    onSwapSeedProduct={onSwapSeedProduct}
                                                                    onGoToSearch={onGoToSearch}
                                                                    precomputedAlternatives={p._llmAlternatives || []}
                                                                    concernLabel={p._llmConcern || ''}
                                                                    isInEcosystem
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            );
                                        })}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {Object.entries(integrationMap).map(([int, products]) => {
                                    const rest = products;
                                    if (rest.length === 0) return null;
                                    return (
                                    <div key={int}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: int === 'No Integration' ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                                            {int === 'No Integration' ? 'Standalone Products' : `Syncs with ${int}`}
                                        </h3>
                                        <div className="ecosystem-product-grid">
                                            {rest.map((product) => {
                                                const seedEntry = ecosystemSeedMeta[product.id];
                                                return (
                                                    <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '0.75rem 1rem', minHeight: '110px' }}>
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                                                            onClick={() => onOpenProduct(product)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenProduct(product); } }}
                                                        >
                                                            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                                                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                            <div style={{ flexGrow: 1, minWidth: 0 }}>
                                                                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{product.name}{product.outOfBusiness && <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>}</h4>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{product.stage || product.category}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                                                                {product.isStartup && (
                                                                    <span style={{ fontSize: '0.65rem', background: 'var(--color-primary-hover)', color: 'white', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-pill)', fontWeight: '600' }}>Startup</span>
                                                                )}
                                                                {Array.isArray(product.integrations) ? product.integrations.map((i) => (
                                                                    <span key={i} style={{ fontSize: '0.65rem', background: 'var(--color-secondary)', color: 'var(--color-text-main)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-pill)', fontWeight: '600' }}>{i}</span>
                                                                )) : product.integrations && (
                                                                    <span style={{ fontSize: '0.65rem', background: 'var(--color-secondary)', color: 'var(--color-text-main)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-pill)', fontWeight: '600' }}>{product.integrations}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <EcosystemProductAlternatives
                                                            product={product}
                                                            seedEntry={seedEntry}
                                                            quizResults={quizResults}
                                                            healthProfile={healthProfile}
                                                            onSwap={onSwapSeedProduct}
                                                            onGoToSearch={onGoToSearch}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : null)}

                {/* Safety & interactions: compare 2+ products */}
                {myProductList.length >= 2 && (
                    <div style={{ marginBottom: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto var(--spacing-xl)' }}>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
                            Safety & interactions
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Pick 2 or more products to see if they're safe to use together.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {myProductList.map(p => {
                                const selected = interactionSelection.has(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => toggleInteractionSelect(p)}
                                        style={{
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: 'var(--radius-pill)',
                                            border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            background: selected ? 'var(--color-secondary-fade)' : 'var(--color-surface-soft)',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            fontWeight: selected ? '600' : '500'
                                        }}
                                    >
                                        {selected ? '✓ ' : ''}{p.name}
                                    </button>
                                );
                            })}
                        </div>
                        {interactionProductList.length >= 2 && (
                            <div style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Comparing: {interactionProductList.map(p => p.name).join(', ')}</h4>
                                {interactionResults.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                        We didn't find any known safety issues between these. This isn't medical advice. Ask your doctor if you're not sure.
                                    </p>
                                ) : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {interactionResults.map((r, i) => (
                                            <li key={i} style={{
                                                marginBottom: '0.75rem',
                                                padding: '0.75rem',
                                                background: r.severity === 'high' ? '#FEF2F2' : r.severity === 'medium' ? '#FFFBEB' : 'white',
                                                borderLeft: `4px solid ${r.severity === 'high' ? '#DC2626' : r.severity === 'medium' ? '#F59E0B' : '#6B7280'}`,
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.9rem'
                                            }}>
                                                <span style={{ fontWeight: '600', color: r.severity === 'high' ? '#B91C1C' : 'var(--color-text-main)' }}>
                                                    {r.productNames.join(' + ')}
                                                </span>
                                                <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-main)' }}>{r.message}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                                    onClick={() => setInteractionSelection(new Set())}
                                >
                                    Clear selection
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!llmLoading && (
                    <>
                        <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', textAlign: 'center', color: 'var(--color-text-main)', marginTop: 'var(--spacing-xl)' }}>Care Recommended for You</h3>
                        <CareNearYouPanel
                            quizResults={quizResults}
                            healthProfile={healthProfile}
                            userZipCode={userZipCode}
                            onZipCodeChange={onZipCodeChange}
                            onOpenProduct={onOpenProduct}
                            onEditHealthProfile={onEditHealthProfile}
                        />
                    </>
                )}

                {typeof onBuildEcosystem === 'function' && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{
                                padding: '0.75rem 1.75rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                boxShadow: '0 2px 12px rgba(217, 111, 12, 0.25)',
                            }}
                            onClick={onBuildEcosystem}
                        >
                            Rebuild my whole ecosystem
                        </button>
                    </div>
                )}
                </div>
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
                                            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            {healthDataImportOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 2000,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                        overflowY: 'auto', padding: '2rem 1rem',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setHealthDataImportOpen(false); }}
                >
                    <div style={{ position: 'relative', width: '100%', maxWidth: '860px' }}>
                        <button
                            type="button"
                            onClick={() => setHealthDataImportOpen(false)}
                            aria-label="Close"
                            style={{
                                position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 1,
                                background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)',
                                borderRadius: '50%', width: '36px', height: '36px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.1rem', cursor: 'pointer', color: 'var(--color-text-main)',
                            }}
                        >
                            ✕
                        </button>
                        <HealthDataImport onUpdate={(saved) => {
                            onHealthProfileUpdate?.(saved);
                        }} />
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
