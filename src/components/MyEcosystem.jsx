import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
    HEALTH_FUNCTIONS,
    ALL_PRODUCTS,
    detectDuplicates,
    getEcosystemAlternatives,
    getRecommendationExplanation,
} from '../data/products';
import { getInteractions } from '../data/interactions';
import CareNearYouPanel from './CareNearYouPanel';
import LlmRecommendationsLoadingBlock from './LlmRecommendationsLoadingBlock';
import HealthDataImport from './HealthDataImport';
import { inferTagsFromHealthProfile } from '../utils/healthDataProfile';
import { RELEASED_STARTUPS, UNRELEASED_STARTUPS } from '../data/startups';
import { generateTieredRecommendations } from '../utils/recommendationEngine';
import {
    fetchLlmRecommendations,
    loadLearningMemory,
    saveLearningMemory,
    fingerprintIntake,
    loadCachedLlmRecommendations,
    saveCachedLlmRecommendations,
    clearCachedLlmRecommendations,
    loadFetchedLlmFingerprint,
    saveFetchedLlmFingerprint,
} from '../utils/fetchLlmRecommendations';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
import { getPricePerUnitLabel } from '../utils/pricePerUnit';
import { deriveBrandSearchContext } from '../utils/productBrandContext.js';

/** Full card for “By function” ecosystem grid: image (🌸 fallback), brand, summary, price, health function, Details + Remove */
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
    const brandDisplay = brandName || '—';
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
        resolveProductImage(product.name, product.brand || '').then((url) => {
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
            }}
        >
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
                    <span style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden>🌸</span>
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
                {product.price || product.stage || '—'}
            </div>
            {perUnitPrice ? (
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>{perUnitPrice}</div>
            ) : null}
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
        .join(' ')
        .toLowerCase();
    return /tranexamic|tranexemic|\blysteda\b/.test(text);
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
                            background: 'linear-gradient(135deg, var(--color-secondary-fade), #f3e8ff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.25rem',
                        }}>🌸</div>
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
                        background: 'linear-gradient(135deg, var(--color-secondary-fade), var(--color-primary-fade, #f3e8ff))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem',
                    }}>🌸</div>
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
                    }}>⭐ Top pick for you</span>
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
                        <span style={{ fontSize: '0.65rem', background: '#F8F9FA', color: 'var(--color-text-main)', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-pill)' }}>⚠️ Safety note</span>
                    )}
                    {product.privacy?.sellsData?.includes('❌') && (
                        <span style={{ fontSize: '0.65rem', background: 'var(--color-secondary-fade)', color: 'var(--color-text-main)', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-pill)' }}>🔒 No data selling</span>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{product.price || '—'}</span>
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
    if (c.includes('cycle tracking') || c.includes('track my cycle') || c.includes('tracking') || c.includes('wearable') || c.includes('ovulation test')) return ['cycle-tracking'];
    if (c.includes('telehealth') || c.includes('provider') || c.includes('specialist') || c.includes('doctor') || c.includes('ob/gyn') || c.includes('obgyn')) return ['telehealth'];
    if (c.includes('routine') || c.includes('health routine') || c.includes('wellness app') || c.includes('health app') || c.includes('build my health') || c.includes('women\'s health app')) return ['routine-building'];
    if (c.includes('contracept') || c.includes('birth control') || c.includes('iud') || c.includes('family planning')) return ['contraception'];
    if (c.includes('fitness') || c.includes('workout') || c.includes('exercise') || c.includes('cycle sync')) return ['fitness-cycle'];
    // "Ingredient safety" is a cross-cutting filter, not its own category — fall through to product type

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

    // Range: "$25–$38", "$25–38", "$25-38", "$25—38" → use average
    const rangeMatch = s.match(/\$(\d+(?:\.\d+)?)\s*[–—‒\-]+\s*\$?(\d+(?:\.\d+)?)/);
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

export default function MyEcosystem({
    myProducts,
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
}) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const viewMode = 'function';
    const [interactionSelection, setInteractionSelection] = useState(new Set()); // product ids for interaction check
    const [ecosystemCompareOpen, setEcosystemCompareOpen] = useState({});
    const [ecosystemAltMiniKey, setEcosystemAltMiniKey] = useState('');
    const [llmTiered, setLlmTiered] = useState([]);
    const [llmLoading, setLlmLoading] = useState(false);
    const [llmError, setLlmError] = useState('');
    const [llmLoadStartedAt, setLlmLoadStartedAt] = useState(0);
    const [resolvedImages, setResolvedImages] = useState({});
    const [healthDataImportOpen, setHealthDataImportOpen] = useState(false);
    const [recommendedSwapByKey, setRecommendedSwapByKey] = useState({});
    const [recommendedSectionOpen, setRecommendedSectionOpen] = useState({});
    const [recommendationRefreshNonce, setRecommendationRefreshNonce] = useState(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage.getItem('ayna_force_llm_refresh') === '1') {
                window.localStorage.removeItem('ayna_force_llm_refresh');
                return 1;
            }
        } catch (_) {}
        return 0;
    });
    const hasCompletedPersonalization = useMemo(() => {
        if (!quizResults) return false;
        if (quizResults?.personalizationCompleted === true) return true;
        if (quizResults?.fullHealthIntake?.personalizationCompleted === true) return true;
        return false;
    }, [quizResults]);

    const myProductIds = Object.keys(myProducts);
    const myProductList = Object.values(myProducts);
    const { functionMap, duplicates } = useMemo(() => detectDuplicates(myProductIds, myProducts), [myProductIds, myProducts]);
    const ecosystemStartups = useMemo(() => {
        const FRUSTRATION_TAG = {
            'Heavy flow': 'heavy-flow', 'Painful cramps': 'cramps', 'Hormonal bloating': 'bloating',
            'Irregular cycles': 'irregular', 'Leaks & staining': 'leaks', 'General discomfort': 'discomfort',
            'Not sure if products are safe': 'safety-concern', 'Recurrent UTIs': 'uti', 'PCOS symptoms': 'pcos',
            'Pelvic pain': 'pelvic-floor', 'Menopause symptoms': 'menopause', 'Endometriosis': 'endometriosis',
            'Fertility / TTC': 'fertility', 'Pregnancy': 'pregnancy', 'Postpartum recovery': 'postpartum',
        };
        const userTags = new Set();
        (quizResults?.frustrations || []).forEach(f => { const t = FRUSTRATION_TAG[f]; if (t) userTags.add(t); });
        (inferTagsFromHealthProfile(healthProfile) || []).forEach(t => userTags.add(t));

        const alreadyInEcosystem = new Set(myProductList.map(p => (p.name || '').toLowerCase()));

        function scoreList(list) {
            return list
                .filter(s => !alreadyInEcosystem.has(s.name.toLowerCase()))
                .map(s => {
                    let score = 0;
                    (s.tags || []).forEach(t => { if (userTags.has(t)) score += 2; });
                    (s.healthFunctions || []).forEach(fn => {
                        if (Object.keys(functionMap).includes(fn)) score += 1;
                    });
                    return { ...s, _score: score };
                })
                .sort((a, b) => b._score - a._score)
                .slice(0, 6);
        }

        return {
            // US-available brands: show all (score just determines order), no score gate
            brands: scoreList(RELEASED_STARTUPS),
            // Not-yet-US startups: only show if relevant to the user (score > 0)
            startups: scoreList(UNRELEASED_STARTUPS).filter(s => s._score > 0),
        };
    }, [myProductList, quizResults, healthProfile, functionMap]);
    const duplicateCount = Object.keys(duplicates).length;

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
        return ALL_PRODUCTS.filter(p =>
            (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
            !omittedProducts[p.id]
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
        let active = true;
        if (!intakeFingerprint) {
            // Intake is still loading from Supabase — don't clear the cache or it will
            // wipe valid recommendations before the fingerprint is available.
            setLlmTiered([]);
            setLlmLoading(false);
            setLlmError('');
            setLlmLoadStartedAt(0);
            return () => { active = false; };
        }

        // Also bypass when ecosystem is empty + personalized — means it was just cleared intentionally
        const bypassCache = recommendationRefreshNonce > 0 || (myProductList.length === 0 && hasCompletedPersonalization);
        const fetchedFingerprint = loadFetchedLlmFingerprint();
        const alreadyFetchedForFingerprint = fetchedFingerprint === intakeFingerprint;
        if (!bypassCache) {
            const cached = loadCachedLlmRecommendations(intakeFingerprint);
            if (cached) {
                setLlmTiered(cached);
                setLlmLoading(false);
                setLlmError('');
                setLlmLoadStartedAt(0);
                return () => {
                    active = false;
                };
            }
            if (alreadyFetchedForFingerprint) {
                setLlmTiered([]);
                setLlmLoading(false);
                setLlmError('');
                setLlmLoadStartedAt(0);
                return () => {
                    active = false;
                };
            }
        }

        const intake = quizResults?.fullHealthIntake || null;
        console.log('[Ayna LLM] Starting fetch — concerns:', intake?.primaryConcerns?.length ?? 0, '| goals:', intake?.goals?.length ?? 0, '| intake null?', !intake);

        (async () => {
            setLlmLoadStartedAt(Date.now());
            setLlmLoading(true);
            setLlmError('');
            try {
                const memory = loadLearningMemory();
                const accumulated = [];
                let errorCount = 0;

                // One API call per concern — each call is ~10s, well under Vercel's timeout.
                // Sending all concerns in one call hit the 60s limit after ~6 concerns.
                let totalConcerns = null;
                for (let batchIdx = 0; batchIdx < 25; batchIdx++) {
                    if (!active) return;
                    try {
                        const d = await fetchLlmRecommendations({
                            intake, trackedProducts, myProducts, omittedProducts,
                            learningMemory: memory, batchIndex: batchIdx, batchSize: 1,
                        });
                        if (!active) return;
                        if (totalConcerns === null && d?.concernsTotal != null) totalConcerns = d.concernsTotal;
                        const recs = Array.isArray(d?.recommendations) ? d.recommendations : [];
                        if (recs.length > 0) { accumulated.push(...recs); setLlmTiered([...accumulated]); }
                    } catch (e) {
                        console.error(`[Ayna LLM] concern ${batchIdx} error:`, e?.message);
                        errorCount++;
                    }
                    if (totalConcerns !== null && batchIdx >= totalConcerns - 1) break;
                }

                if (!active) return;
                const recs = accumulated;
                console.log('[Ayna LLM] Done — sections:', recs.length, '| errors:', errorCount);
                if (recs.length === 0 && errorCount > 0) throw new Error('All recommendation batches failed — please try again.');
                if (recs.length === 0) return; // nothing to do (no concerns matched)
                if (recs.length > 0) {
                    if (hasCompletedPersonalization) onLlmRecommendationsLoaded?.(recs);
                }
                if (recs.length > 0) {
                    saveCachedLlmRecommendations(intakeFingerprint, recs);
                }
                saveFetchedLlmFingerprint(intakeFingerprint);
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
                    selectedConcernHistory: Array.from(new Set([...(memory.selectedConcernHistory || []), ...((intake?.primaryConcerns || []).map((x) => String(x)))])),
                    trackedHistory: Array.from(new Set([...(memory.trackedHistory || []), ...Object.keys(trackedProducts || {})])).slice(-300),
                    ecosystemHistory: Array.from(new Set([...(memory.ecosystemHistory || []), ...Object.keys(myProducts || {})])).slice(-300),
                    omittedHistory: Array.from(new Set([...(memory.omittedHistory || []), ...Object.keys(omittedProducts || {})])).slice(-300),
                };
                saveLearningMemory(nextMemory);
            } catch (e) {
                if (!active) return;
                setLlmTiered([]);
                const errMsg = typeof e?.message === 'string' ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
                console.error('[Ayna LLM] Error:', e);
                setLlmError(errMsg || 'Could not load recommendations');
                saveFetchedLlmFingerprint(intakeFingerprint);
            } finally {
                if (active) {
                    setLlmLoading(false);
                    setLlmLoadStartedAt(0);
                }
            }
        })();

        return () => {
            active = false;
        };
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
                const tiers = (Array.isArray(entry?.tiers) ? entry.tiers : [])
                    .map((tier, tierIdx) => {
                        const tierProduct = tier?.product || null;
                        if (!tierProduct || isBlockedRecommendationProduct(tierProduct)) return null;
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
    }, [recommendedProductsForDisplay, onBuildEcosystemFromLlm, llmTiered]);

    useEffect(() => {
        if (!activeTiered || !activeTiered.length) return;
        activeTiered.forEach((entry) => {
            const product = entry.topProduct || entry.tiers?.[0]?.product;
            if (!product || !product.llmGenerated || !product.name) return;
            if (resolvedImages[product.id] !== undefined) return;
            resolveProductImage(product.name, product.brand).then((url) => {
                if (url) setResolvedImages((prev) => ({ ...prev, [product.id]: url }));
            });
            const alts = entry.alternatives || entry.tiers?.[0]?.alternatives || [];
            alts.forEach((alt) => {
                if (!alt || !alt.name || resolvedImages[alt.id] !== undefined) return;
                resolveProductImage(alt.name, alt.brand).then((url) => {
                    if (url) setResolvedImages((prev) => ({ ...prev, [alt.id]: url }));
                });
            });
        });
    }, [activeTiered]);

    useEffect(() => {
        const recommendedProducts = recommendedProductsForDisplay
            .flatMap((s) => (Array.isArray(s?.tiers) ? s.tiers : []))
            .flatMap((tier) => [tier?.product, ...(Array.isArray(tier?.alternatives) ? tier.alternatives : [])])
            .filter(Boolean);
        const productsNeedingImage = [...myProductList, ...ecosystemStartups.brands, ...ecosystemStartups.startups, ...recommendedProducts]
            .filter((p) => p && p.id && p.name)
            .filter((p) => resolvedImages[p.id] === undefined)
            .filter((p) => isPlaceholderProductImage(p.image));
        if (productsNeedingImage.length === 0) return;
        productsNeedingImage.forEach((p) => {
            resolveProductImage(p.name, p.brand || '').then((url) => {
                if (url) setResolvedImages((prev) => ({ ...prev, [p.id]: url }));
            });
        });
    }, [myProductList, ecosystemStartups, recommendedProductsForDisplay, resolvedImages]);


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
        clearCachedLlmRecommendations();
        setLlmTiered([]);
        setLlmError('');
        setRecommendationRefreshNonce((n) => n + 1);
    }, []);

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
                    title="Re-run personalized recommendations from your latest profile"
                >
                    {llmLoading ? 'Refreshing…' : 'Refresh recommendations'}
                </button>
            </div>
            {llmLoading && llmLoadStartedAt > 0 && (
                <LlmRecommendationsLoadingBlock loadStartedAt={llmLoadStartedAt} compact />
            )}
            {llmLoading && !llmLoadStartedAt && (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: '1.5rem' }}>
                    Loading recommendations…
                </p>
            )}
            {llmError && !llmLoading && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                    Could not load recommendations: {llmError}
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
                                        {section.concern}
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
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                                No recommendation tracks available for this concern yet. Try the full search.
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
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto var(--spacing-xl)' }}>
                    <div style={{
                        background: 'var(--color-secondary-fade)', color: 'var(--color-primary-hover)',
                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.875rem',
                        fontWeight: '600', marginBottom: '1rem', display: 'inline-block'
                    }}>
                        Your Health Ecosystem
                    </div>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Everything You Use, One Place</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        Track all your health products and apps. Everything here is monitored for safety by default. We'll tell you what each does, if any overlap, and if products may interact.
                    </p>
                </div>

                {llmError && !llmLoading && (
                    <div style={{ textAlign: 'center', padding: '0.75rem', marginBottom: '1rem', background: '#FEF2F2', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                        Could not build ecosystem: {typeof llmError === 'string' ? llmError : JSON.stringify(llmError)} — <button type="button" style={{ background: 'none', border: 'none', color: '#991B1B', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', padding: 0 }} onClick={handleRefreshRecommendations}>Try again</button>
                    </div>
                )}

                {/* SECTION 1 — My Ecosystem */}
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', textAlign: 'center', color: 'var(--color-text-main)' }}>My Ecosystem</h3>
                <div style={{
                    display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
                    marginBottom: 'var(--spacing-lg)',
                }}>
                    {myProductList.length > 0 && (
                        <div style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                                {estimatedMonthlyTotal.total > 0 ? `~$${estimatedMonthlyTotal.total.toFixed(0)}` : '—'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Est. per month</div>
                            {estimatedMonthlyTotal.counted < estimatedMonthlyTotal.totalItems && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                    {estimatedMonthlyTotal.totalItems - estimatedMonthlyTotal.counted} item{estimatedMonthlyTotal.totalItems - estimatedMonthlyTotal.counted !== 1 ? 's' : ''} not priced
                                </div>
                            )}
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
                    <div style={{
                        background: duplicateCount > 0 ? '#F8F9FA' : 'var(--color-secondary-fade)',
                        border: `1px solid ${duplicateCount > 0 ? '#D1D5DB' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px',
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-main)' }}>{duplicateCount}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Overlaps Found</div>
                    </div>
                    <div style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px', cursor: 'pointer' }} onClick={onOpenDoctorPrep}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>👩‍⚕️</div>
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
                        📋 Import Health Data
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

                

                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add a Product or App</button>
                </div>

                {/* Loading bar persists above the grid until all batches finish */}
                {llmLoading && (
                    llmLoadStartedAt > 0
                        ? <LlmRecommendationsLoadingBlock loadStartedAt={llmLoadStartedAt} compact />
                        : <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>🌸 Building your ecosystem…</div>
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
                        <p style={{ color: 'var(--color-text-muted)' }}>Complete the health survey to build your personalized ecosystem, or add products manually.</p>
                    </div>
                ) : myProductList.length > 0 ? (
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {viewMode === 'function' ? (
                            <>
                                {duplicateCount > 0 && (
                                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>⚠️ Overlap Detected</h3>
                                        {Object.entries(duplicates).map(([fn, products]) => (
                                            <div key={fn} style={{
                                                background: '#F3F4F6', border: '1px solid #FFE082', borderRadius: 'var(--radius-md)',
                                                padding: '1.25rem', marginBottom: '0.75rem'
                                            }}>
                                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                                    {HEALTH_FUNCTIONS[fn]?.icon} {HEALTH_FUNCTIONS[fn]?.label}: {products.length} products doing the same thing
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                                    {products.map(p => (
                                                        <span key={p.id} style={{ background: 'white', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: '500' }}>
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                    💡 You might not need all of these — consider consolidating to save money and simplify your routine.
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {Object.entries(functionMap)
                                        .filter(([fn]) => fn !== 'leak-protection')
                                        .map(([fn, products]) => {
                                            if (products.length === 0) return null;
                                            return (
                                                <section key={fn}>
                                                    <div style={{ marginBottom: '0.65rem' }}>
                                                        <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                            <span>{HEALTH_FUNCTIONS[fn]?.icon}</span> {HEALTH_FUNCTIONS[fn]?.label}
                                                            {duplicates[fn] && <span style={{ fontSize: '0.65rem', background: '#F8F9FA', color: 'var(--color-text-main)', padding: '0.12rem 0.4rem', borderRadius: 'var(--radius-pill)' }}>overlap</span>}
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
                                            {int === 'No Integration' ? '📦 Standalone Products' : `✨ Syncs with ${int}`}
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
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🛡️ Safety & interactions
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Select 2 or more products to check if they may interact or if they're safe to use together.
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
                                        No known safety interactions found between these. This doesn't replace medical advice — discuss with your provider if unsure.
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
                                                    {r.severity === 'high' ? '⚠️ ' : r.severity === 'medium' ? '⚡ ' : 'ℹ️ '}
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

                {/* US-available brands — not startups, regular products you can buy now */}
                {!llmLoading && ecosystemStartups.brands.length > 0 && (
                    <div style={{ marginBottom: '1.75rem', maxWidth: '1200px', margin: '0 auto 1.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🛍️ Women's Health Brands
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Brands with products available now, matched to your profile.</p>
                        <div className="ecosystem-product-grid">
                            {ecosystemStartups.brands.map(brand => (
                                <a key={brand.id} href={brand.url} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.85rem 1rem', cursor: 'pointer', textDecoration: 'none', color: 'inherit', height: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-soft)' }}>
                                            <img src={resolvedImages[brand.id] || brand.image} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                                        </div>
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {brand.name}
                                            </h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{brand.tagline}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', margin: 0, lineHeight: '1.35', flex: 1 }}>
                                        {brand.description}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--color-primary)', background: 'var(--color-secondary-fade)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-pill)' }}>{brand.stage}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: 'auto' }}>Shop now →</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Non-US startups — waitlist / coming soon */}
                {!llmLoading && ecosystemStartups.startups.length > 0 && (
                    <div style={{ marginBottom: '1.75rem', maxWidth: '1200px', margin: '0 auto 1.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🚀 Startups relevant to you
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Curated women's health startups matched to your profile.</p>
                        <div className="ecosystem-product-grid">
                            {ecosystemStartups.startups.map(startup => (
                                <a key={startup.id} href={startup.url} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.85rem 1rem', cursor: 'pointer', textDecoration: 'none', color: 'inherit', height: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-soft)' }}>
                                            <img src={resolvedImages[startup.id] || startup.image} alt={startup.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                                        </div>
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {startup.name}
                                                <span style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-pill)', background: 'var(--color-primary-hover)', color: 'white' }}>Startup</span>
                                            </h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{startup.tagline}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', margin: 0, lineHeight: '1.35', flex: 1 }}>
                                        {startup.description}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--color-primary)', background: 'var(--color-secondary-fade)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-pill)' }}>{startup.stage}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: 'auto' }}>Learn more →</span>
                                    </div>
                                </a>
                            ))}
                        </div>
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
                                boxShadow: '0 2px 12px rgba(111, 72, 76, 0.2)',
                            }}
                            onClick={onBuildEcosystem}
                        >
                            Rebuild my whole ecosystem
                        </button>
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
        </>
    );
}
