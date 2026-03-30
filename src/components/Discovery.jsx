import React, { useState, useMemo } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS, SYMPTOM_TO_SUPPLEMENTS } from '../data/products';
import { RELEASED_STARTUPS } from '../data/startups';
import { getAynaRating } from '../data/aynaReviews';
import Disclaimer from './Disclaimer';
import FindYourPadModal from './FindYourPadModal';

const ALL_CATEGORIES = ['all', 'pad', 'tampon', 'cup', 'disc', 'period-underwear', 'supplement', 'tracker', 'telehealth', 'mental-health', 'fitness', 'diagnostics', 'hormone-monitoring', 'menopause', 'fertility', 'pelvic-health', 'pelvic-floor', 'cramp-relief', 'postpartum', 'pregnancy', 'sex-tech', 'intimate-care', 'contraception'];
const TYPE_FILTERS = ['all', 'physical', 'digital', 'startup'];

/** Extract a numeric price for sorting (rough proxy: first $ amount, or monthly equivalent when obvious). */
function getSortPrice(item) {
    const s = (item.price || item.stage || '').toString().trim();
    const perMonth = s.match(/\$(\d+)(?:\.\d+)?\s*\/?\s*month/i);
    if (perMonth) return parseFloat(perMonth[1]);
    const range = s.match(/\$(\d+)\s*[–\-]\s*\$(\d+)/);
    if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
    const single = s.match(/\$(\d+)(?:\.\d+)?/);
    if (single) return parseFloat(single[1]);
    return null;
}

/** Score for default sort: top rated + positive clinical/social/scientific consensus + safety first. */
function getQualityScore(item, aynaReviews = {}) {
    const v = item.verificationLinks || {};
    const hasLinks = (section) => {
        if (!section) return 0;
        const links = Array.isArray(section) ? section : (section.links || (section.url ? [section] : []));
        return (links.length > 0 ? 1 : 0);
    };
    const clinical = hasLinks(v.doctor);
    const social = hasLinks(v.community);
    const scientific = hasLinks(v.scientific);
    const consensusScore = clinical + social + scientific;
    const aynaRating = getAynaRating(item, aynaReviews[item.id]);
    const baseRating = item.ratingNote ? 0 : (item.userRating != null ? Number(item.userRating) / 5 : 0);
    const rating = item.ratingNote ? 0 : (aynaRating != null ? aynaRating / 5 : baseRating);
    const safetyOk = !(item.safety?.recalls && String(item.safety.recalls).includes('⚠️')) ? 1 : 0;
    return (rating * 2) + consensusScore + safetyOk;
}

const SORT_OPTIONS = [
    { value: 'default', label: 'Best match (rating, consensus & safety)' },
    { value: 'price-asc', label: 'Price: low to high' },
    { value: 'price-desc', label: 'Price: high to low' },
    { value: 'rating', label: 'Best rated' },
];

// Pad sub-filters: flow, preference, use case
const PAD_FLOW_OPTIONS = [
    { value: 'all', label: 'All flow' },
    { value: 'heavy', label: 'Heavy flow', tag: 'heavy-flow' },
    { value: 'regular', label: 'Regular' },
    { value: 'light', label: 'Light / Liners', matchText: ['liner', 'light'] },
];
const PAD_PREFERENCE_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'organic', label: 'Organic', tag: 'organic' },
    { value: 'mainstream', label: 'Mainstream' },
    { value: 'budget', label: 'Budget', tag: 'cost' },
];
const PAD_USE_CASE_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'overnight', label: 'Overnight', matchText: ['overnight'] },
    { value: 'active', label: 'Active', matchText: ['active', 'flexible', 'workout', 'athletic'] },
    { value: 'everyday', label: 'Everyday' },
];

function padMatchesSubFilters(item, padFlow, padPreference, padUseCase) {
    if (item.category !== 'pad') return true;
    const tags = new Set(item.tags || []);
    const text = [(item.name || ''), (item.summary || '')].join(' ').toLowerCase();

    if (padFlow !== 'all') {
        if (padFlow === 'heavy' && !tags.has('heavy-flow')) return false;
        if (padFlow === 'light') {
            const hasLight = PAD_FLOW_OPTIONS.find(o => o.value === 'light')?.matchText?.some(m => text.includes(m));
            if (!hasLight) return false;
        }
        if (padFlow === 'regular') {
            if (tags.has('heavy-flow')) return false;
            const hasLight = PAD_FLOW_OPTIONS.find(o => o.value === 'light')?.matchText?.some(m => text.includes(m));
            if (hasLight) return false;
        }
    }
    if (padPreference !== 'all') {
        if (padPreference === 'organic' && !tags.has('organic')) return false;
        if (padPreference === 'budget' && !tags.has('cost')) return false;
        if (padPreference === 'mainstream' && tags.has('organic')) return false;
    }
    if (padUseCase !== 'all') {
        const opt = PAD_USE_CASE_OPTIONS.find(o => o.value === padUseCase);
        if (opt?.matchText) {
            const hasMatch = opt.matchText.some(m => text.includes(m));
            if (!hasMatch) return false;
        }
        if (padUseCase === 'everyday') {
            const hasOvernight = text.includes('overnight');
            const hasActive = ['active', 'flexible', 'workout', 'athletic'].some(m => text.includes(m));
            if (hasOvernight || hasActive) return false;
        }
    }
    return true;
}

export default function Discovery({ trackedProducts, toggleTrackProduct, myProducts, onToggleProduct, joinedWaitlists, toggleJoinWaitlist, omittedProducts, toggleOmitProduct, setCurrentView, onOpenProduct, isPremium, onUpgrade, initialSearch, recommendedProductIds, aynaReviews = {}, initialCategory, initialPadFlow, initialPadPreference, initialPadUseCase, initialSymptom }) {
    const [categoryFilter, setCategoryFilter] = useState(initialCategory || 'all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState(initialSearch || '');
    const [sortBy, setSortBy] = useState('default');
    const [personalizationFilter, setPersonalizationFilter] = useState(false);
    const [padFlowFilter, setPadFlowFilter] = useState(initialPadFlow || 'all');
    const [padPreferenceFilter, setPadPreferenceFilter] = useState(initialPadPreference || 'all');
    const [padUseCaseFilter, setPadUseCaseFilter] = useState(initialPadUseCase || 'all');
    const [showFindPadModal, setShowFindPadModal] = useState(false);
    const [symptomFilter, setSymptomFilter] = useState(initialSymptom || 'all');
    const recommendedSet = useMemo(() => new Set(recommendedProductIds || []), [recommendedProductIds]);

    React.useEffect(() => {
        if (initialSearch !== undefined) {
            setSearchQuery(initialSearch);
        }
    }, [initialSearch]);

    React.useEffect(() => {
        if (initialCategory) setCategoryFilter(initialCategory);
    }, [initialCategory]);

    React.useEffect(() => {
        if (initialPadFlow) setPadFlowFilter(initialPadFlow);
        if (initialPadPreference) setPadPreferenceFilter(initialPadPreference);
        if (initialPadUseCase) setPadUseCaseFilter(initialPadUseCase);
    }, [initialPadFlow, initialPadPreference, initialPadUseCase]);

    const combined = useMemo(() => {
        const products = ALL_PRODUCTS.map(p => ({ ...p, isStartup: false }));
        // Released startups appear as normal products (no startup badge); unreleased are only on Startups page
        const releasedAsProducts = RELEASED_STARTUPS.map(s => ({
            ...s,
            isStartup: false,
            type: 'digital',
            summary: s.description || s.tagline,
            price: s.stage || ''
        }));
        return [...products, ...releasedAsProducts];
    }, []);

    const filtered = useMemo(() => {
        let list = combined.filter(item => {
            if (omittedProducts[item.id]) return false;
            if (personalizationFilter && recommendedSet.size > 0 && !recommendedSet.has(item.id)) return false;
            if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
            if (typeFilter !== 'all' && item.type !== typeFilter) return false;
            if (categoryFilter === 'pad' && !padMatchesSubFilters(item, padFlowFilter, padPreferenceFilter, padUseCaseFilter)) return false;
            if (categoryFilter === 'supplement' && symptomFilter !== 'all') {
                const ids = SYMPTOM_TO_SUPPLEMENTS[symptomFilter];
                if (ids && !ids.includes(item.id)) return false;
            }

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const stopWords = new Set(['a', 'an', 'the', 'best', 'good', 'top', 'for', 'my', 'me', 'to', 'and', 'or', 'of', 'in', 'on', 'with']);
                const words = query.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
                const safetyStr = item.safety && typeof item.safety === 'object'
                    ? [item.safety.fdaStatus, item.safety.materials, item.safety.recalls, item.safety.allergens].filter(Boolean).join(' ')
                    : '';
                const searchText = [
                    item.name,
                    item.summary,
                    item.tagline,
                    item.doctorOpinion,
                    item.communityReview,
                    item.ingredients,
                    item.effectiveness,
                    safetyStr,
                    (item.tags || []).join(' '),
                    item.category,
                    CATEGORY_LABELS[item.category]
                ].filter(Boolean).join(' ').toLowerCase();

                if (words.length === 0) {
                    if (!searchText.includes(query)) return false;
                } else {
                    const wordMatches = (word) => {
                        if (searchText.includes(word)) return true;
                        if (word.endsWith('s') && searchText.includes(word.slice(0, -1))) return true;
                        if (!word.endsWith('s') && searchText.includes(word + 's')) return true;
                        return false;
                    };
                    const allWordsMatch = words.every(word => wordMatches(word));
                    if (!allWordsMatch) return false;
                }
            }

            return true;
        });

        if (sortBy === 'price-asc') {
            list = [...list].sort((a, b) => {
                const pa = getSortPrice(a);
                const pb = getSortPrice(b);
                if (pa == null && pb == null) return 0;
                if (pa == null) return 1;
                if (pb == null) return -1;
                return pa - pb;
            });
        } else if (sortBy === 'price-desc') {
            list = [...list].sort((a, b) => {
                const pa = getSortPrice(a);
                const pb = getSortPrice(b);
                if (pa == null && pb == null) return 0;
                if (pa == null) return 1;
                if (pb == null) return -1;
                return pb - pa;
            });
        } else if (sortBy === 'rating') {
            list = [...list].sort((a, b) => {
                const ra = a.ratingNote ? null : (getAynaRating(a, aynaReviews[a.id]) ?? (a.userRating != null ? Number(a.userRating) : null));
                const rb = b.ratingNote ? null : (getAynaRating(b, aynaReviews[b.id]) ?? (b.userRating != null ? Number(b.userRating) : null));
                if (ra == null && rb == null) return 0;
                if (ra == null) return 1;
                if (rb == null) return -1;
                return rb - ra;
            });
        } else {
            // default: best quality first — top rated, positive clinical/social/sci consensus, and safety
            list = [...list].sort((a, b) => {
                const qa = getQualityScore(a, aynaReviews);
                const qb = getQualityScore(b, aynaReviews);
                return qb - qa;
            });
        }
        return list;
    }, [combined, categoryFilter, typeFilter, omittedProducts, searchQuery, sortBy, personalizationFilter, recommendedSet, aynaReviews, padFlowFilter, padPreferenceFilter, padUseCaseFilter, symptomFilter]);

    const handleSmartSearch = (e) => {
        e.preventDefault();
        const q = searchQuery.toLowerCase();

        // Nudge category filters without leaving Discovery (so "period pads", "menopause", etc. still search here)
        if (q.includes('menopause')) {
            setCategoryFilter('menopause');
            return;
        }
        if (q.includes('pregnancy') || q.includes('prenatal')) {
            setCategoryFilter('pregnancy');
            return;
        }
        if (q.includes('postpartum') || q.includes('breastfeeding') || q.includes('nursing')) {
            setCategoryFilter('postpartum');
            return;
        }

        if (q.includes('waitlist') || q.includes('startup') || q.includes('new')) {
            if (setCurrentView) setCurrentView('waitlist');
        } else if (q.includes('ecosystem') || q.includes('routine')) {
            if (setCurrentView) setCurrentView('ecosystem');
        } else if (q.includes('quiz') || q.includes('assess')) {
            if (setCurrentView) setCurrentView('quiz');
        }
        // Otherwise fuzzy filter in useMemo applies to the current search query.
    };

    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', maxWidth: '700px', margin: '0 auto var(--spacing-lg)' }}>
                <div style={{
                    background: 'var(--color-secondary-fade)', color: 'var(--color-primary-hover)',
                    padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.875rem',
                    fontWeight: '600', marginBottom: '1rem', display: 'inline-block'
                }}>
                    Discovery
                </div>
                <h2 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Browse All Products</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                    Explore our curated database of women's health products and digital tools — each reviewed by doctors and real women.
                </p>
                {recommendedSet.size === 0 && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                        Complete your health profile (quiz) to unlock the &quot;For you&quot; filter on Search.
                    </p>
                )}
            </div>

            {/* Smart Search */}
            <form onSubmit={handleSmartSearch} style={{ maxWidth: '600px', margin: '0 auto 2rem', position: 'relative' }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask a question, search for a product, or type a health symptom..."
                    style={{
                        width: '100%',
                        padding: '1rem 1.5rem',
                        fontSize: '1rem',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        outline: 'none'
                    }}
                />
                <button type="submit" style={{
                    position: 'absolute',
                    right: '0.4rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.7rem 1.4rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                }}>
                    Search
                </button>
            </form>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {recommendedSet.size > 0 && (
                    <button onClick={() => setPersonalizationFilter(!personalizationFilter)} style={{
                        padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem',
                        fontWeight: '500', border: '1px solid var(--color-border)',
                        background: personalizationFilter ? 'var(--color-primary)' : 'transparent',
                        color: personalizationFilter ? 'white' : 'var(--color-text-main)',
                        cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.35rem'
                    }}>
                        ✨ For you
                    </button>
                )}
                {TYPE_FILTERS.map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)} style={{
                        padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem',
                        fontWeight: '500', border: '1px solid var(--color-border)',
                        background: typeFilter === t ? 'var(--color-primary)' : 'transparent',
                        color: typeFilter === t ? 'white' : 'var(--color-text-main)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                        {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--spacing-lg)' }}>
                {ALL_CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategoryFilter(c)} style={{
                        padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem',
                        fontWeight: '500', border: '1px solid var(--color-border)',
                        background: categoryFilter === c ? 'var(--color-surface-contrast)' : 'transparent',
                        color: categoryFilter === c ? 'white' : 'var(--color-text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                        {c === 'all' ? 'All' : (CATEGORY_LABELS[c] || c)}
                    </button>
                ))}
            </div>

            {categoryFilter === 'pad' && (
                <div style={{ marginBottom: 'var(--spacing-lg)', padding: '1rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Narrow by pad type</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Flow:</span>
                        {PAD_FLOW_OPTIONS.map(o => (
                            <button key={o.value} onClick={() => setPadFlowFilter(o.value)} style={{
                                padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem',
                                fontWeight: '500', border: '1px solid var(--color-border)',
                                background: padFlowFilter === o.value ? 'var(--color-primary)' : 'transparent',
                                color: padFlowFilter === o.value ? 'white' : 'var(--color-text-main)',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}>{o.label}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Preference:</span>
                        {PAD_PREFERENCE_OPTIONS.map(o => (
                            <button key={o.value} onClick={() => setPadPreferenceFilter(o.value)} style={{
                                padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem',
                                fontWeight: '500', border: '1px solid var(--color-border)',
                                background: padPreferenceFilter === o.value ? 'var(--color-primary)' : 'transparent',
                                color: padPreferenceFilter === o.value ? 'white' : 'var(--color-text-main)',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}>{o.label}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Use case:</span>
                        {PAD_USE_CASE_OPTIONS.map(o => (
                            <button key={o.value} onClick={() => setPadUseCaseFilter(o.value)} style={{
                                padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem',
                                fontWeight: '500', border: '1px solid var(--color-border)',
                                background: padUseCaseFilter === o.value ? 'var(--color-primary)' : 'transparent',
                                color: padUseCaseFilter === o.value ? 'white' : 'var(--color-text-main)',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}>{o.label}</button>
                        ))}
                    </div>
                </div>
            )}

            {categoryFilter === 'supplement' && (
                <div style={{ marginBottom: 'var(--spacing-lg)', padding: '1rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Browse by symptom</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button onClick={() => setSymptomFilter('all')} style={{
                            padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem',
                            fontWeight: '500', border: '1px solid var(--color-border)',
                            background: symptomFilter === 'all' ? 'var(--color-primary)' : 'transparent',
                            color: symptomFilter === 'all' ? 'white' : 'var(--color-text-main)',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}>All</button>
                        {Object.keys(SYMPTOM_TO_SUPPLEMENTS).map(symptom => (
                            <button key={symptom} onClick={() => setSymptomFilter(symptom)} style={{
                                padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem',
                                fontWeight: '500', border: '1px solid var(--color-border)',
                                background: symptomFilter === symptom ? 'var(--color-primary)' : 'transparent',
                                color: symptomFilter === symptom ? 'white' : 'var(--color-text-main)',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}>{symptom.charAt(0).toUpperCase() + symptom.slice(1)}</button>
                        ))}
                    </div>
                </div>
            )}

            {showFindPadModal && (
                <FindYourPadModal
                    onClose={() => setShowFindPadModal(false)}
                    onFind={(opts) => {
                        setPadFlowFilter(opts.initialPadFlow || 'all');
                        setPadPreferenceFilter(opts.initialPadPreference || 'all');
                        setPadUseCaseFilter(opts.initialPadUseCase || 'all');
                        setShowFindPadModal(false);
                    }}
                />
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="discovery-sort" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Sort by:</label>
                    <select
                        id="discovery-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.9rem',
                            background: 'var(--color-surface-soft)',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer'
                        }}
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Product Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
                {filtered.map((item, idx) => {
                    const isStartup = item.isStartup === true;
                    const releasedStartup = isStartup && item.productReleased === true;
                    const isInEcosystem = !!myProducts[item.id];
                    const isJoined = isStartup && !releasedStartup && !!joinedWaitlists[item.id];

                    return (
                        <div key={item.id} className="card hover-lift" style={{
                            padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            width: '280px', animation: `fadeInUp 0.4s ${Math.min(idx * 0.05, 0.3)}s backwards`,
                            border: (isInEcosystem || isJoined) ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                        }}>
                            <div style={{ height: '140px', width: '100%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-secondary-fade, #fdf2f4)' }}>
                                {item.image && item.image !== '/ayna_placeholder.png' ? (
                                    <>
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '1rem' }}>
                                            <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '0.02em' }}>AYNA</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', opacity: 0.9 }}>Your women's health assistant</span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '1rem' }}>
                                        <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '0.02em' }}>AYNA</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', opacity: 0.9 }}>Your women's health assistant</span>
                                    </div>
                                )}
                                <span style={{
                                    position: 'absolute', top: '0.5rem', left: '0.5rem',
                                    background: isStartup ? 'var(--color-primary-hover)' : (item.type === 'physical' ? 'var(--color-surface-contrast)' : 'var(--color-primary)'),
                                    color: 'white', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)',
                                    fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase'
                                }}>
                                    {isStartup ? 'Startup' : item.type}
                                </span>
                                {isInEcosystem && (
                                    <span style={{
                                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                                        background: '#10B981', color: 'white', padding: '0.2rem 0.5rem',
                                        borderRadius: 'var(--radius-pill)', fontSize: '0.65rem', fontWeight: '600'
                                    }}>
                                        In ecosystem
                                    </span>
                                )}
                                {isJoined && (
                                    <span style={{
                                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                                        background: 'var(--color-primary)', color: 'white', padding: '0.2rem 0.5rem',
                                        borderRadius: 'var(--radius-pill)', fontSize: '0.65rem', fontWeight: '600'
                                    }}>
                                        On Waitlist
                                    </span>
                                )}
                                {item.outOfBusiness && (
                                    <span style={{
                                        position: 'absolute', bottom: '0.5rem', left: '0.5rem',
                                        background: '#374151', color: 'white', padding: '0.3rem 0.6rem',
                                        borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontWeight: '700'
                                    }}>
                                        No longer sold
                                    </span>
                                )}
                            </div>
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                <span style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                    {CATEGORY_LABELS[item.category] || (item.category && item.category.charAt(0) + item.category.slice(1)) || 'Startup'}
                                </span>
                                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                                {item.outOfBusiness && (
                                    <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: '#374151', color: 'white', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: '700' }}>
                                        No longer sold — company closed. Listing kept for safety info if you have this product.
                                    </div>
                                )}
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', flexGrow: 1, marginBottom: '0.75rem', lineHeight: '1.4' }}>
                                    {item.isStartup ? item.tagline : item.summary}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.isStartup ? item.stage : item.price}</span>
                                    {(() => {
                                        const note = item.ratingNote;
                                        // When rating is unreliable or reviews incentivized, show — with note; otherwise show rating
                                        if (note) {
                                            return (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }} title={note}>—</span>
                                            );
                                        }
                                        const displayRating = getAynaRating(item, aynaReviews[item.id]) ?? item.userRating;
                                        const hasRating = displayRating != null;
                                        const tooltip = aynaReviews[item.id]?.ratings?.length
                                            ? 'Ayna rating (includes community ratings)'
                                            : hasRating ? 'Based on user reviews, clinical opinions, and scientific literature' : null;
                                        if (hasRating) {
                                            return (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }} title={tooltip}>★ {Number(displayRating).toFixed(1)}</span>
                                            );
                                        }
                                        return null;
                                    })()}
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {item.isStartup ? (
                                            releasedStartup ? (
                                                <>
                                                    <button
                                                        className={`btn ${isInEcosystem ? 'btn-outline' : 'btn-primary'}`}
                                                        style={{
                                                            padding: '0.35rem 0.7rem',
                                                            fontSize: '0.75rem',
                                                            opacity: (!isPremium && !isInEcosystem) ? 0.8 : 1
                                                        }}
                                                        onClick={() => {
                                                            if (isPremium || isInEcosystem) {
                                                                onToggleProduct(item);
                                                            } else {
                                                                onUpgrade();
                                                            }
                                                        }}
                                                    >
                                                        {isInEcosystem ? '✓' : 'Add to ecosystem'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                                                        onClick={() => setCurrentView?.('recalls')}
                                                    >
                                                        Monitor recalls
                                                    </button>
                                                    {(item.url || (item.whereToBuy && item.whereToBuy.length > 0)) && (
                                                        <div style={{ width: '100%', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', fontSize: '0.75rem' }}>
                                                                {item.url && item.url !== '#' && (item.url.startsWith('http://') || item.url.startsWith('https://')) && (
                                                                    <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>
                                                                        Website ↗
                                                                    </a>
                                                                )}
                                                                {(item.whereToBuy || []).map(shop => {
                                                                    const getStoreUrl = (s, q) => {
                                                                        if (!s || typeof s !== 'string') return 'https://www.google.com/search?q=women+health+products';
                                                                        const norm = s.trim().toLowerCase().replace(/\s+/g, '');
                                                                        if (/^[a-z0-9][a-z0-9.-]*\.(com|io|co|life|health|org|net)$/i.test(norm)) return norm.startsWith('http') ? norm : `https://${norm}`;
                                                                        if (norm.includes('amazon')) return `https://www.amazon.com/s?k=${encodeURIComponent(q || '')}`;
                                                                        if (norm.includes('target')) return `https://www.target.com/s?searchTerm=${encodeURIComponent(q || '')}`;
                                                                        if (norm.includes('walmart')) return `https://www.walmart.com/search?q=${encodeURIComponent(q || '')}`;
                                                                        if (norm.includes('cvs')) return `https://www.cvs.com/shop/search?searchTerm=${encodeURIComponent(q || '')}`;
                                                                        if (norm.includes('iherb')) return `https://www.iherb.com/search?kw=${encodeURIComponent(q || '')}`;
                                                                        return `https://www.google.com/search?q=${encodeURIComponent((q || '') + ' ' + (s || ''))}`;
                                                                    };
                                                                    const url = item.whereToBuyLinks?.[shop] || getStoreUrl(shop, item.name);
                                                                    return (
                                                                        <a key={shop} href={typeof url === 'string' && url.startsWith('http') ? url : getStoreUrl(shop, item.name)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                                                            {shop} ↗
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <button
                                                    className={`btn ${isJoined ? 'btn-outline' : 'btn-primary'}`}
                                                    style={{
                                                        padding: '0.35rem 0.7rem',
                                                        fontSize: '0.75rem',
                                                        opacity: (!isPremium && !isJoined) ? 0.8 : 1
                                                    }}
                                                    onClick={() => {
                                                        if (isPremium || isJoined) {
                                                            toggleJoinWaitlist(item);
                                                        } else {
                                                            onUpgrade();
                                                        }
                                                    }}
                                                >
                                                    {isJoined ? 'Leave' : (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            {!isPremium && <span>🔒</span>}
                                                            {isPremium ? 'Join' : 'Upgrade'}
                                                        </span>
                                                    )}
                                                </button>
                                            )
                                        ) : (
                                            <>
                                                <button className="btn btn-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }} onClick={() => onToggleProduct(item)}>
                                                    {isInEcosystem ? '✓' : '+'}
                                                </button>
                                                <button className="btn btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }} onClick={() => onOpenProduct(item)}>
                                                    Details
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <Disclaimer compact style={{ marginTop: '2rem', textAlign: 'center' }} />
        </section>
    );
}


