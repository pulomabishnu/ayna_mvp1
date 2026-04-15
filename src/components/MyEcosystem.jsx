import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    HEALTH_FUNCTIONS,
    ALL_PRODUCTS,
    detectDuplicates,
    getEcosystemAlternatives,
    getEcosystemSeedFromQuiz,
} from '../data/products';
import { getInteractions } from '../data/interactions';
import CareNearYouPanel from './CareNearYouPanel';
import { getRecommendedArticles } from './Articles';
import { inferTagsFromHealthProfile, saveHealthProfile } from '../utils/healthDataProfile';
import { generateTieredRecommendations } from '../utils/recommendationEngine';

function EcosystemProductAlternatives({ product, seedEntry, quizResults, healthProfile, onSwap, onGoToSearch, precomputedAlternatives = [] }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const alternatives = useMemo(() => {
        if (Array.isArray(precomputedAlternatives) && precomputedAlternatives.length > 0) {
            return precomputedAlternatives.slice(0, 3);
        }
        return seedEntry ? getEcosystemAlternatives(product.id, seedEntry.tag, quizResults || {}, healthProfile, 3) : [];
    }, [precomputedAlternatives, product.id, seedEntry, quizResults, healthProfile]);
    useEffect(() => {
        if (!open) return;
        const close = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    if (!seedEntry) return null;
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
                Top 3 alternatives · {seedEntry.frustration}
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

/** Estimate monthly cost in USD from a price string. Returns null if unparseable. */
function estimateMonthlyCost(priceStr, product) {
    if (!priceStr || typeof priceStr !== 'string') return null;
    const s = priceStr.trim();
    const category = product?.category || '';
    const isReusable = /reusable|per pair|per pair/i.test(s) || ['cup', 'disc', 'period-underwear'].includes(category);

    // Explicit per month: e.g. "$10/month" or "Clue Plus $10/month"
    const perMonthMatch = s.match(/\$(\d+)(?:\.\d+)?\s*\/?\s*month/i);
    if (perMonthMatch) return parseFloat(perMonthMatch[1]);

    // Range: $25–$38 → use average
    const rangeMatch = s.match(/\$(\d+)\s*[–\-]\s*\$(\d+)/);
    if (rangeMatch) {
        const avg = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
        if (/per pair|underwear|pair/i.test(s)) return avg / 18; // ~18 months life
        return avg;
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
}) {
    const [profileEditOpen, setProfileEditOpen] = useState(false);
    const [conditionsDraft, setConditionsDraft] = useState('');
    const [medicationsDraft, setMedicationsDraft] = useState('');
    const [allergiesDraft, setAllergiesDraft] = useState('');
    const [notesDraft, setNotesDraft] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('function'); // 'function' or 'integration'
    const [interactionSelection, setInteractionSelection] = useState(new Set()); // product ids for interaction check
    const [expandedConcern, setExpandedConcern] = useState('');
    const [expandedSubByConcern, setExpandedSubByConcern] = useState({});

    const myProductIds = Object.keys(myProducts);
    const myProductList = Object.values(myProducts);
    const { functionMap, duplicates } = useMemo(() => detectDuplicates(myProductIds, myProducts), [myProductIds, myProducts]);
    const ecosystemStartups = useMemo(() => myProductList.filter(p => !ALL_PRODUCTS.find(x => x.id === p.id)), [myProductList]);
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

    /** One row per intake concern: top pick + top 3 alternatives (strictly concern-driven). */
    const seededConcernsList = useMemo(() => {
        const intake = quizResults?.fullHealthIntake || null;
        if (intake && Object.keys(intake).length > 0) {
            const tiered = generateTieredRecommendations(intake);
            return tiered
                .map((entry) => {
                    const topTier = Array.isArray(entry.tiers) ? entry.tiers[0] : null;
                    const topProduct = topTier?.product || null;
                    if (!topProduct) return null;
                    return {
                        product: topProduct,
                        seedEntry: { frustration: entry.concern, tag: '' },
                        alternatives: Array.isArray(topTier?.alternatives) ? topTier.alternatives.slice(0, 3) : [],
                    };
                })
                .filter(Boolean);
        }

        if (!quizResults?.frustrations?.length) return [];
        const order = quizResults.frustrations;
        const entries = Object.entries(ecosystemSeedMeta || {});
        const byFrustration = new Map();
        if (entries.length) {
            entries.forEach(([pid, meta]) => {
                const p = myProducts[pid];
                if (p && meta?.frustration && !byFrustration.has(meta.frustration)) {
                    byFrustration.set(meta.frustration, { product: p, seedEntry: meta, alternatives: [] });
                }
            });
        }
        if (byFrustration.size === 0) {
            const { seedMeta } = getEcosystemSeedFromQuiz(quizResults, healthProfile);
            order.forEach((f) => {
                const pid = Object.keys(seedMeta).find((id) => seedMeta[id].frustration === f && myProducts[id]);
                if (pid) byFrustration.set(f, { product: myProducts[pid], seedEntry: seedMeta[pid], alternatives: [] });
            });
        }
        const rows = [];
        order.forEach((f) => {
            if (byFrustration.has(f)) rows.push(byFrustration.get(f));
        });
        byFrustration.forEach((row, f) => {
            if (!order.includes(f)) rows.push(row);
        });
        return rows;
    }, [ecosystemSeedMeta, myProducts, quizResults, healthProfile]);

    const seededProductIds = useMemo(() => new Set(seededConcernsList.map((r) => r.product.id)), [seededConcernsList]);
    const intakeTieredRecommendations = useMemo(() => {
        const intake = quizResults?.fullHealthIntake || null;
        if (!intake || Object.keys(intake).length === 0) return [];
        return generateTieredRecommendations(intake);
    }, [quizResults]);
    const showCategoryFlowOnly = intakeTieredRecommendations.length > 0;

    const hasNonSeededProducts = useMemo(
        () => myProductList.some((p) => !seededProductIds.has(p.id)),
        [myProductList, seededProductIds]
    );

    const ecosystemArticles = useMemo(
        () => getRecommendedArticles(quizResults || {}, healthProfile),
        [quizResults, healthProfile]
    );

    useEffect(() => {
        if (!profileEditOpen) return;
        const hp = healthProfile;
        setConditionsDraft((hp?.conditions || []).join(', '));
        setMedicationsDraft((hp?.medications || []).join(', '));
        setAllergiesDraft((hp?.allergies || []).join(', '));
        setNotesDraft(hp?.notes || '');
    }, [profileEditOpen, healthProfile]);

    const handleSaveHealthProfileDraft = () => {
        const base = healthProfile || {
            conditions: [], medications: [], allergies: [], notes: '',
            sources: { appleHealth: false, googleFit: false, fhir: false, manual: true },
        };
        const next = saveHealthProfile({
            ...base,
            conditions: conditionsDraft.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean),
            medications: medicationsDraft.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean),
            allergies: allergiesDraft.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean),
            notes: notesDraft,
        });
        onHealthProfileUpdate?.(next);
        setProfileEditOpen(false);
    };

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

                {/* Summary stats first — matches the main ecosystem dashboard layout */}
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
                        <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: '700' }}>Doctor Prep</div>
                    </div>
                </div>

                {/* Category -> Subcategory -> Top pick + alternatives (post-intake primary flow) */}
                {showCategoryFlowOnly && (
                    <div style={{ maxWidth: '960px', margin: '0 auto var(--spacing-xl)', padding: '0 0.25rem' }}>
                        <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem', textAlign: 'center', color: 'var(--color-text-main)' }}>
                            Your personalized recommendations
                        </h3>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.1rem' }}>
                            Category → subcategory symptoms → top pick for you, with 3 alternatives.
                        </p>
                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {intakeTieredRecommendations.map((entry) => (
                                <div key={entry.concern} className="card" style={{ padding: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedConcern((prev) => (prev === entry.concern ? '' : entry.concern))}
                                        style={{
                                            width: '100%',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            textAlign: 'left',
                                            padding: 0,
                                        }}
                                    >
                                        <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-main)' }}>{entry.concern}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{expandedConcern === entry.concern ? '▼' : '▶'}</span>
                                    </button>
                                    {expandedConcern === entry.concern && (
                                        <div style={{ marginTop: '0.7rem', display: 'grid', gap: '0.65rem' }}>
                                            {entry.tiers.map((tier) => {
                                                const tierKey = tier.id || tier.name;
                                                const subLabel = tier.subcategory || tier.name;
                                                const open = expandedSubByConcern[entry.concern] === tierKey;
                                                return (
                                                    <div key={tierKey} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedSubByConcern((prev) => ({ ...prev, [entry.concern]: prev[entry.concern] === tierKey ? '' : tierKey }))}
                                                            style={{
                                                                width: '100%',
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                textAlign: 'left',
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <span style={{ fontSize: '0.93rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{subLabel}</span>
                                                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{open ? '▼' : '▶'}</span>
                                                        </button>
                                                        {open && (
                                                            <div style={{ marginTop: '0.6rem' }}>
                                                                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onOpenProduct(tier.product)}
                                                                        style={{
                                                                            width: '62px',
                                                                            height: '62px',
                                                                            borderRadius: 'var(--radius-md)',
                                                                            overflow: 'hidden',
                                                                            border: '1px solid var(--color-border)',
                                                                            background: 'none',
                                                                            padding: 0,
                                                                            cursor: 'pointer',
                                                                            flexShrink: 0,
                                                                        }}
                                                                        aria-label={`Open ${tier.product.name}`}
                                                                    >
                                                                        <img src={tier.product.image} alt={tier.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    </button>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: '700' }}>Top pick for you</div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onOpenProduct(tier.product)}
                                                                            style={{ border: 'none', background: 'none', padding: 0, color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}
                                                                        >
                                                                            {tier.product.name}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {tier.matchExplanation && (
                                                                    <p style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', margin: '0.35rem 0 0.45rem', lineHeight: 1.45 }}>
                                                                        <strong>Match:</strong> {tier.matchExplanation}
                                                                    </p>
                                                                )}
                                                                <details>
                                                                    <summary style={{ cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                                                                        3 alternatives
                                                                    </summary>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.45rem' }}>
                                                                        {(tier.alternatives || []).slice(0, 3).map((alt) => (
                                                                            <button
                                                                                key={alt.id}
                                                                                type="button"
                                                                                className="btn btn-outline"
                                                                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                                                                                onClick={() => onOpenProduct(alt)}
                                                                            >
                                                                                {alt.name}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </details>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Legacy seeded concern row cards */}
                {!showCategoryFlowOnly && seededConcernsList.length > 0 && (
                    <div style={{ maxWidth: '960px', margin: '0 auto var(--spacing-xl)', padding: '0 0.25rem' }}>
                        <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem', textAlign: 'center', color: 'var(--color-text-main)' }}>
                            Your ecosystem
                        </h3>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                            Your top suggested pick per concern is already saved here. Open the menu to compare the next best matches.
                        </p>
                        <div
                            className="ecosystem-seed-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: '1rem',
                            }}
                        >
                            {seededConcernsList.map(({ product, seedEntry, alternatives = [] }) => (
                                <div
                                    key={product.id}
                                    className="card"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        padding: '1rem',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface-soft)',
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'var(--color-primary)',
                                            margin: '0 0 0.65rem',
                                        }}
                                    >
                                        {seedEntry.frustration}
                                    </p>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer', marginBottom: '0.35rem' }}
                                        onClick={() => onOpenProduct(product)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onOpenProduct(product);
                                            }
                                        }}
                                    >
                                        <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                                            <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span
                                                style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em',
                                                    color: 'white',
                                                    background: 'var(--color-primary)',
                                                    padding: '0.15rem 0.45rem',
                                                    borderRadius: 'var(--radius-pill)',
                                                    display: 'inline-block',
                                                    marginBottom: '0.35rem',
                                                }}
                                            >
                                                In your ecosystem
                                            </span>
                                            <h4 style={{ fontSize: '0.98rem', margin: '0 0 0.2rem', lineHeight: 1.3, color: 'var(--color-text-main)' }}>{product.name}</h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{product.price || product.stage}</span>
                                        </div>
                                    </div>
                                    <EcosystemProductAlternatives
                                        product={product}
                                        seedEntry={seedEntry}
                                        quizResults={quizResults}
                                        healthProfile={healthProfile}
                                        onSwap={onSwapSeedProduct}
                                        onGoToSearch={onGoToSearch}
                                        precomputedAlternatives={alternatives}
                                    />
                                </div>
                            ))}
                        </div>
                        <style>{`
              @media (max-width: 800px) {
                .ecosystem-seed-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
              }
              @media (max-width: 520px) {
                .ecosystem-seed-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
                    </div>
                )}

                {!showCategoryFlowOnly && seededConcernsList.length > 0 && hasNonSeededProducts && (
                    <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
                        Below: the rest of your products by category (your top picks per concern stay above).
                    </p>
                )}
                {!showCategoryFlowOnly && (
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add a Product or App</button>
                    <div style={{ background: 'var(--color-surface-soft)', padding: '0.25rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)', display: 'flex' }}>
                        <button
                            onClick={() => setViewMode('function')}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', border: 'none', fontSize: '0.85rem', cursor: 'pointer',
                                background: viewMode === 'function' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'function' ? 'var(--shadow-sm)' : 'none',
                                fontWeight: viewMode === 'function' ? '600' : '500'
                            }}
                        >By Function</button>
                        <button
                            onClick={() => setViewMode('integration')}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', border: 'none', fontSize: '0.85rem', cursor: 'pointer',
                                background: viewMode === 'integration' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'integration' ? 'var(--shadow-sm)' : 'none',
                                fontWeight: viewMode === 'integration' ? '600' : '500'
                            }}
                        >By Integration</button>
                    </div>
                </div>
                )}

                {!showCategoryFlowOnly && (myProductList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>Your ecosystem is empty.</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>Add the products and apps you currently use and we'll organize them for you.</p>
                    </div>
                ) : (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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

                                {Object.entries(functionMap).map(([fn, products]) => {
                                    const rest = products.filter((p) => !seededProductIds.has(p.id));
                                    if (rest.length === 0) return null;
                                    return (
                                    <div key={fn} style={{ marginBottom: '1.75rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{HEALTH_FUNCTIONS[fn]?.icon}</span> {HEALTH_FUNCTIONS[fn]?.label}
                                            {duplicates[fn] && <span style={{ fontSize: '0.75rem', background: '#F8F9FA', color: 'var(--color-text-main)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>overlap</span>}
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{HEALTH_FUNCTIONS[fn]?.desc}</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {rest.map((product) => {
                                                const seedEntry = ecosystemSeedMeta[product.id];
                                                return (
                                                    <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '0.75rem 1rem' }}>
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
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{product.price}</span>
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase',
                                                                padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)',
                                                                background: product.type === 'physical' ? 'var(--color-surface-contrast)' : 'var(--color-primary)',
                                                                color: 'white',
                                                            }}>
                                                                {product.type}
                                                            </span>
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
                                {ecosystemStartups.length > 0 && (
                                    <div style={{ marginBottom: '1.75rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            🚀 Startups in your ecosystem
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Released products you added from our startup list.</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {ecosystemStartups.map(product => (
                                                <div key={product.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => onOpenProduct(product)}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                                                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{product.name}{product.outOfBusiness && <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>}</h4>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{product.stage || product.tagline}</span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase',
                                                        padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)',
                                                        background: 'var(--color-primary-hover)', color: 'white'
                                                    }}>
                                                        Startup
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {Object.entries(integrationMap).map(([int, products]) => {
                                    const rest = products.filter((p) => !seededProductIds.has(p.id));
                                    if (rest.length === 0) return null;
                                    return (
                                    <div key={int}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: int === 'No Integration' ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                                            {int === 'No Integration' ? '📦 Standalone Products' : `✨ Syncs with ${int}`}
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {rest.map((product) => {
                                                const seedEntry = ecosystemSeedMeta[product.id];
                                                return (
                                                    <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '0.75rem 1rem' }}>
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
                ))}

                {ecosystemArticles.length > 0 && (
                    <div style={{ maxWidth: '720px', margin: '0 auto var(--spacing-xl)', padding: '0 0.25rem' }}>
                        <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', textAlign: 'center' }}>Health articles</h3>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                            Evidence-based reads matched to your profile.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {ecosystemArticles.map((art) => (
                                <li key={art.id}>
                                    <button
                                        type="button"
                                        onClick={() => onOpenArticle?.(art.id)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.85rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface-soft)',
                                            cursor: 'pointer',
                                            fontFamily: 'var(--font-body)',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-main)', display: 'block' }}>{art.title}</span>
                                        {art.teaser && (
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'block', lineHeight: 1.45 }}>
                                                {(art.teaser || '').slice(0, 140)}{(art.teaser || '').length > 140 ? '…' : ''}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {typeof onViewRecommendedArticles === 'function' && (
                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" style={{ fontSize: '0.9rem' }} onClick={onViewRecommendedArticles}>
                                    Browse all articles
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <CareNearYouPanel
                    quizResults={quizResults}
                    healthProfile={healthProfile}
                    userZipCode={userZipCode}
                    onZipCodeChange={onZipCodeChange}
                    onOpenProduct={onOpenProduct}
                />

                {/* Health profile: quiz + imported / manual context */}
                <div className="card" style={{ maxWidth: '720px', margin: '0 auto var(--spacing-xl)', padding: '1.5rem', fontFamily: 'var(--font-body)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.35rem', color: 'var(--color-text-main)' }}>Your health profile</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                Concerns from your quiz, plus conditions and meds you add here, shape recommendations.
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {typeof onBuildEcosystem === 'function' && (
                                <button type="button" className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={onBuildEcosystem}>
                                    Update quiz / concerns
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn btn-outline"
                                style={{ fontSize: '0.85rem' }}
                                onClick={() => setProfileEditOpen((o) => !o)}
                            >
                                {profileEditOpen ? 'Close editor' : 'Add or fix diagnoses & meds'}
                            </button>
                        </div>
                    </div>
                    {quizResults?.frustrations?.length > 0 && (
                        <div style={{ marginBottom: '0.85rem' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', margin: '0 0 0.4rem' }}>Concerns & goals</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {quizResults.frustrations.map((f) => (
                                    <span
                                        key={f}
                                        style={{
                                            fontSize: '0.82rem',
                                            padding: '0.25rem 0.65rem',
                                            borderRadius: 'var(--radius-pill)',
                                            background: 'var(--color-secondary-fade)',
                                            color: 'var(--color-text-main)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {(healthProfile?.conditions?.length > 0 || healthProfile?.fhirSummary?.conditions?.length > 0) && (
                        <div style={{ marginBottom: '0.85rem' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', margin: '0 0 0.4rem' }}>Conditions & diagnoses</p>
                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text-main)' }}>
                                {[...(healthProfile.conditions || []), ...(healthProfile.fhirSummary?.conditions || [])].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                    )}
                    {(healthProfile?.medications?.length > 0 || healthProfile?.fhirSummary?.medications?.length > 0) && (
                        <div style={{ marginBottom: '0.85rem' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', margin: '0 0 0.4rem' }}>Medications</p>
                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text-main)' }}>
                                {[...(healthProfile.medications || []), ...(healthProfile.fhirSummary?.medications || [])].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                    )}
                    {healthProfile?.allergies?.length > 0 && (
                        <div style={{ marginBottom: '0.85rem' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', margin: '0 0 0.4rem' }}>Allergies</p>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{healthProfile.allergies.join(' · ')}</p>
                        </div>
                    )}
                    {healthProfile?.notes && (
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Notes: {healthProfile.notes}</p>
                    )}
                    {!quizResults?.frustrations?.length && !inferTagsFromHealthProfile(healthProfile).length && !healthProfile?.conditions?.length && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                            Complete the quiz or add conditions below so picks and articles match you better.
                        </p>
                    )}
                    {profileEditOpen && (
                        <div
                            style={{
                                marginTop: '1.25rem',
                                paddingTop: '1.25rem',
                                borderTop: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                            }}
                        >
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Conditions (comma-separated)</label>
                            <input
                                value={conditionsDraft}
                                onChange={(e) => setConditionsDraft(e.target.value)}
                                placeholder="e.g. PCOS, endometriosis"
                                style={{
                                    padding: '0.65rem 0.85rem',
                                    fontSize: '0.95rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    fontFamily: 'var(--font-body)',
                                    outline: 'none',
                                }}
                            />
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Medications</label>
                            <input
                                value={medicationsDraft}
                                onChange={(e) => setMedicationsDraft(e.target.value)}
                                placeholder="e.g. levothyroxine 50mcg"
                                style={{
                                    padding: '0.65rem 0.85rem',
                                    fontSize: '0.95rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    fontFamily: 'var(--font-body)',
                                    outline: 'none',
                                }}
                            />
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Allergies</label>
                            <input
                                value={allergiesDraft}
                                onChange={(e) => setAllergiesDraft(e.target.value)}
                                placeholder="e.g. latex, penicillin"
                                style={{
                                    padding: '0.65rem 0.85rem',
                                    fontSize: '0.95rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    fontFamily: 'var(--font-body)',
                                    outline: 'none',
                                }}
                            />
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Notes</label>
                            <textarea
                                value={notesDraft}
                                onChange={(e) => setNotesDraft(e.target.value)}
                                rows={3}
                                style={{
                                    padding: '0.65rem 0.85rem',
                                    fontSize: '0.95rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    fontFamily: 'var(--font-body)',
                                    outline: 'none',
                                    resize: 'vertical',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-primary" style={{ fontSize: '0.9rem' }} onClick={handleSaveHealthProfileDraft}>
                                    Save profile
                                </button>
                                <button type="button" className="btn btn-outline" style={{ fontSize: '0.9rem' }} onClick={() => setProfileEditOpen(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {typeof onBuildEcosystem === 'function' && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{
                                padding: '0.75rem 1.75rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                boxShadow: '0 4px 14px rgba(217, 76, 147, 0.35)',
                            }}
                            onClick={onBuildEcosystem}
                        >
                            Build me my ecosystem!
                        </button>
                    </div>
                )}

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
        </>
    );
}


