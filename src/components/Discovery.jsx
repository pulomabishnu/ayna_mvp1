import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS, SYMPTOM_TO_SUPPLEMENTS, filterPrescriptionCareGate } from '../data/products';
import { buildSearchTextForItem, scoreQueryAgainstProduct } from '../utils/naturalLanguageSearch';
import { fetchSearchSuggestions } from '../utils/fetchSearchSuggestions';
import { RELEASED_STARTUPS } from '../data/startups';
import { getAynaRating } from '../data/aynaReviews';
import Disclaimer from './Disclaimer';
import { getPricePerUnitLabel } from '../utils/pricePerUnit';
import { fetchDsldProducts } from '../utils/fetchDsldProducts';
import { enrichLlmProductForDiscovery } from '../utils/enrichLlmProductForDiscovery';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';
import posthog from 'posthog-js';
import GlossaryTerm from './GlossaryTerm';
import { isPartnerBrandItem } from '../utils/partnerBrands';

const SEARCH_SUGGESTION_POOL = [
    'most comfortable easy to use menstrual cup',
    'best supplement for bloating',
    'organic pads for heavy flow',
    'period underwear for overnight leaks',
    'pelvic floor trainer for postpartum recovery',
    'best magnesium for period cramps',
    'ovulation tracker that actually works',
    'menopause hot flash relief',
    'ashwagandha for hormonal balance',
    'probiotic for vaginal health',
    'gentle tampons for sensitive skin',
    'fertility tracker for trying to conceive',
    'best prenatal vitamin',
    'natural remedy for PMS mood swings',
    'reusable menstrual disc for swimming',
    'supplement for PCOS symptoms',
    'best lube for vaginal dryness',
    'sleep support for perimenopause',
    'iron supplement for heavy periods',
    'kegel exerciser for bladder control',
    'evening primrose oil for breast tenderness',
    'travel-friendly menstrual cup',
    'vaginal moisturizer for dryness',
    'best telehealth for birth control',
    'postpartum recovery essentials',
];

function pickRandomSuggestions(count = 5) {
    const pool = [...SEARCH_SUGGESTION_POOL];
    const picked = [];
    while (picked.length < count && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
}

const MACRO_GROUPS = [
    { id: 'all', label: 'All Products', icon: '🔍', categories: [] },
    { id: 'period-cycle', label: 'Period & Cycle Care', icon: '🩸', categories: ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief'] },
    { id: 'hormonal-balance', label: 'Hormonal Balance', icon: '⚖️', categories: ['supplement', 'hormone-monitoring'] },
    { id: 'gut-vaginal-urinary', label: 'Gut, Vaginal & Urinary', icon: '🌸', categories: ['intimate-care'] },
    { id: 'fertility', label: 'Fertility & Reproductive Health', icon: '🤰', categories: ['fertility', 'pregnancy', 'postpartum', 'contraception'] },
    { id: 'menopause', label: 'Menopause & Perimenopause', icon: '🍂', categories: ['menopause'] },
    { id: 'pelvic-health', label: 'Pelvic Health', icon: '💪', categories: ['pelvic-floor', 'pelvic-health'] },
    { id: 'sexual-wellness', label: 'Sexual Wellness', icon: '🔥', categories: ['sex-tech', 'intimate-care'] },
    { id: 'mental-sleep', label: 'Mental Health & Sleep', icon: '🧠', categories: ['mental-health'] },
    { id: 'fitness', label: 'Fitness & Movement', icon: '💃', categories: ['fitness'] },
    { id: 'diagnostics-tracking', label: 'Diagnostics & Tracking', icon: '📊', categories: ['tracker', 'diagnostics', 'hormone-monitoring'] },
    { id: 'supplements', label: 'Supplements', icon: '💊', categories: ['supplement'] },
    { id: 'telehealth', label: 'Telehealth & Care', icon: '🏥', categories: ['telehealth'] },
];

/** Board 1h's four filter pills, mapped onto the existing macro-group / category filters. */
const SHOP_FILTERS = [
    { key: 'all', label: 'All', group: 'all', category: 'all' },
    { key: 'cycle', label: 'Cycle', group: 'period-cycle', category: 'all' },
    { key: 'postpartum', label: 'Postpartum', group: 'all', category: 'postpartum' },
    { key: 'pelvic-floor', label: 'Pelvic floor', group: 'pelvic-health', category: 'all' },
];

// Kept for sub-filter pills within a selected group
const ALL_CATEGORIES = ['all', 'pad', 'tampon', 'cup', 'disc', 'period-underwear', 'supplement', 'tracker', 'telehealth', 'mental-health', 'fitness', 'diagnostics', 'hormone-monitoring', 'menopause', 'fertility', 'pelvic-health', 'pelvic-floor', 'cramp-relief', 'postpartum', 'pregnancy', 'sex-tech', 'intimate-care', 'contraception'];

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
function hasVerificationLinks(section) {
    if (!section) return 0;
    const links = Array.isArray(section) ? section : (section.links || (section.url ? [section] : []));
    return (links.length > 0 ? 1 : 0);
}

// A brand-new/smaller-company product with zero citations usually means Ayna's content team
// hasn't researched it yet, not evidence the product is bad — this is the single source of
// truth for "cold-start" status, shared by getQualityScore's neutral-default scoring and by
// applyColdStartFloor's page-1 visibility guarantee below, so the two can't drift apart.
function isColdStartItem(item) {
    const v = item.verificationLinks || {};
    return !(hasVerificationLinks(v.doctor) || hasVerificationLinks(v.community) || hasVerificationLinks(v.scientific));
}

function getQualityScore(item, aynaReviews = {}) {
    const v = item.verificationLinks || {};
    const clinical = hasVerificationLinks(v.doctor);
    const social = hasVerificationLinks(v.community);
    const scientific = hasVerificationLinks(v.scientific);
    // Treat "not yet researched" as a neutral middle value rather than a penalty — see
    // isColdStartItem above for why zero citations isn't evidence against a product.
    const hasAnyConsensus = clinical || social || scientific;
    const consensusScore = hasAnyConsensus ? (clinical + social + scientific) : 1.5;
    const aynaRating = getAynaRating(item, aynaReviews[item.id]);
    const hasRating = !item.ratingNote && (aynaRating != null || item.userRating != null);
    const baseRating = item.ratingNote ? 0 : (item.userRating != null ? Number(item.userRating) / 5 : 0);
    const ratedValue = item.ratingNote ? 0 : (aynaRating != null ? aynaRating / 5 : baseRating);
    // Same idea for rating: no rating yet isn't evidence of a bad product, just an unrated one —
    // default to a neutral 0.7 (out of 1) instead of 0.
    const rating = hasRating ? ratedValue : 0.7;
    const safetyOk = !(item.safety?.recalls && String(item.safety.recalls).includes('⚠️')) ? 1 : 0;
    return (rating * 2) + consensusScore + safetyOk;
}

// Deterministic per-(item, seed) hash in [0, 1) — same seed always reorders the same way (so a
// single landing's grid doesn't jitter as filters/sort re-render), but a fresh seed each time the
// component mounts (see shuffleSeed in Discovery) produces a different order on the next visit.
function hashToUnitInterval(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 100000) / 100000;
}

const SHUFFLE_JITTER_RANGE = 1.5;

// getQualityScore's neutral cold-start defaults (above) close most of the gap for unrated/
// uncited products, but ~119 of 154 catalog products still cluster in a narrow band near the
// max score (curated content checks nearly every box for most of the catalog), so a cold-start
// product's ~3.9 is still a couple points below that cluster's floor. The standard ±1.5 jitter
// can't close that on its own — give cold-start items a wider band so they get a real (if
// occasional) shot at page-1 visibility instead of a guaranteed spot near the very bottom.
const COLD_START_QUALITY_THRESHOLD = 4.5;
const COLD_START_JITTER_RANGE = 3;

function shuffleJitter(item, seed, baseScore = 0) {
    const range = baseScore < COLD_START_QUALITY_THRESHOLD ? COLD_START_JITTER_RANGE : SHUFFLE_JITTER_RANGE;
    return hashToUnitInterval(`${seed}:${item?.id || ''}`) * range;
}

// Even with the wider cold-start jitter band above, simulating the real catalog (154 products +
// 39 released startups, ~28% of which are cold-start) across 500 random shuffle seeds showed only
// ~14% average page-1 representation for cold-start items, and worse: 35 of the 55 cold-start
// items never once landed on page 1 across all 500 seeds — jitter alone concentrates luck on
// whichever cold-start items happen to hash favorably for a given seed, not a fair rotation across
// all of them. This guarantees a floor instead of leaving it to chance: after the score+jitter sort,
// if fewer than COLD_START_PAGE_FLOOR cold-start items made it into the first `pageSize` results,
// promote the highest score+jitter-ranked cold-start items that didn't (still using the SAME jitter
// roll for this seed, so which items get promoted still rotates seed to seed) into those spots,
// displacing the lowest-ranked non-partner items at the bottom of the page. 6/30 (20%) is a
// deliberately conservative floor — below cold-start's ~28% catalog share, so this narrows the gap
// without displacing enough established, well-reviewed products to feel like a regression for
// users who came for the curated content. Partner-pinned items are never displaced.
const COLD_START_PAGE_FLOOR = 6;

function applyColdStartFloor(rankedList, pageSize) {
    const page = rankedList.slice(0, pageSize);
    const rest = rankedList.slice(pageSize);
    const coldOnPage = page.filter(isColdStartItem).length;
    const shortfall = COLD_START_PAGE_FLOOR - coldOnPage;
    if (shortfall <= 0) return rankedList;

    const promotable = rest.filter(isColdStartItem).slice(0, shortfall);
    if (promotable.length === 0) return rankedList;

    // Displace from the bottom of the page upward, never touching partner-pinned items —
    // those stay pinned regardless of this guarantee.
    const displaceable = [];
    for (let i = page.length - 1; i >= 0 && displaceable.length < promotable.length; i--) {
        if (!isPartnerBrandItem(page[i])) displaceable.push(i);
    }
    const newPage = [...page];
    displaceable.forEach((pageIdx, i) => {
        if (i < promotable.length) newPage[pageIdx] = promotable[i];
    });
    const promotedIds = new Set(promotable.map((p) => p.id));
    const remainingRest = rest.filter((p) => !promotedIds.has(p.id));
    return [...newPage, ...remainingRest];
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

export default function Discovery({ trackedProducts, toggleTrackProduct, myProducts, onToggleProduct, joinedWaitlists, toggleJoinWaitlist, omittedProducts, toggleOmitProduct, setCurrentView, onOpenProduct, initialSearch, recommendedProductIds, aynaReviews = {}, initialCategory, initialPadFlow, initialPadPreference, initialPadUseCase, initialSymptom, hasQuizFrustrations = false, hasHealthImport = false, quizResults = null }) {
    const [macroGroup, setMacroGroup] = useState(() => {
        if (!initialCategory || initialCategory === 'all') return 'all';
        return MACRO_GROUPS.find(g => g.categories.includes(initialCategory))?.id || 'all';
    });
    const [categoryFilter, setCategoryFilter] = useState(initialCategory || 'all');
    const [typeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState(initialSearch || '');
    const [submittedQuery, setSubmittedQuery] = useState(initialSearch || '');
    const [sortBy] = useState('default');
    // Freshly generated on every mount — Discovery unmounts/remounts on each navigation to it,
    // so this reshuffles the browsing grid's default order every time a user lands on the page,
    // without reshuffling mid-visit as filters/sort change.
    const [shuffleSeed] = useState(() => Math.random().toString(36).slice(2));
    // Freshly picked on every mount, same reasoning as shuffleSeed above — a new
    // set of 5 suggestion pills each time the user lands on Discovery.
    const [searchSuggestions] = useState(() => pickRandomSuggestions(5));
    const [personalizationFilter, setPersonalizationFilter] = useState(hasQuizFrustrations || hasHealthImport);
    const personalizationInitialized = useRef(false);
    useEffect(() => {
        if (!personalizationInitialized.current && (hasQuizFrustrations || hasHealthImport)) {
            setPersonalizationFilter(true);
            personalizationInitialized.current = true;
        }
    }, [hasQuizFrustrations, hasHealthImport]);
    const [padFlowFilter, setPadFlowFilter] = useState(initialPadFlow || 'all');
    const [padPreferenceFilter, setPadPreferenceFilter] = useState(initialPadPreference || 'all');
    const [padUseCaseFilter, setPadUseCaseFilter] = useState(initialPadUseCase || 'all');
    const [symptomFilter] = useState(initialSymptom || 'all');
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [, setAiQuerySummary] = useState('');
    const [aiRelatedSearches, setAiRelatedSearches] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [, setAiError] = useState(null);
    const [searchSubmitted, setSearchSubmitted] = useState(false);
    const aiAbortRef = useRef(null);
    const debounceRef = useRef(null);
    const [dsldProducts, setDsldProducts] = useState([]);
    const [dsldLoading, setDsldLoading] = useState(false);
    const [resolvedImages, setResolvedImages] = useState({});
    // Pagination: rendering every matching product as a full DOM card at once
    // (previously up to the whole ~159+ product catalog, unconditionally) was
    // the actual render-cost bottleneck — not image loading, which already had
    // caching/concurrency limits. "Load more" reveals additional batches
    // instead of mounting everything up front.
    const PAGE_SIZE = 30;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const recommendedSet = useMemo(() => new Set(recommendedProductIds || []), [recommendedProductIds]);

    React.useEffect(() => {
        if (initialSearch !== undefined) {
            setSearchQuery(initialSearch);
            setSubmittedQuery(initialSearch || '');
        }
    }, [initialSearch]);

    // Mirror the submitted query into ?q= so a tab discard/reload while browsing
    // Discovery (or coming back to a backgrounded tab that got reloaded) restores
    // what was searched, not just the page you were on. App.jsx seeds the initial
    // query from this same param on load; this keeps it current as the user
    // types further searches that never go back through App.jsx.
    React.useEffect(() => {
        const url = new URL(window.location.href);
        const q = submittedQuery.trim();
        if (q) url.searchParams.set('q', q);
        else url.searchParams.delete('q');
        if (url.search !== window.location.search) {
            window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
        }
    }, [submittedQuery]);

    React.useEffect(() => {
        if (initialCategory) setCategoryFilter(initialCategory);
    }, [initialCategory]);

    React.useEffect(() => {
        if (initialPadFlow) setPadFlowFilter(initialPadFlow);
        if (initialPadPreference) setPadPreferenceFilter(initialPadPreference);
        if (initialPadUseCase) setPadUseCaseFilter(initialPadUseCase);
    }, [initialPadFlow, initialPadPreference, initialPadUseCase]);

    const combined = useMemo(() => {
        // Ayna doesn't sell or dispense prescriptions, so prescription-only items
        // (birth control requiring an Rx, HRT patches/inserts, etc.) never show as
        // shoppable products here — searching what they treat (e.g. "hormone
        // replacement therapy") surfaces telehealth providers that prescribe it instead.
        const products = filterPrescriptionCareGate(ALL_PRODUCTS).map(p => ({ ...p, isStartup: false }));
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
        const applyFilters = (items, skipCategory = false) => items.filter((item) => {
            if (omittedProducts[item.id]) return false;
            if (personalizationFilter && recommendedSet.size > 0 && !recommendedSet.has(item.id)) return false;
            // Macro group filter
            if (!skipCategory && macroGroup !== 'all') {
                const grp = MACRO_GROUPS.find(g => g.id === macroGroup);
                if (grp?.categories.length > 0 && !grp.categories.includes(item.category)) return false;
            }
            // Sub-category filter within the selected group
            if (!skipCategory && categoryFilter !== 'all' && item.category !== categoryFilter) return false;
            if (typeFilter !== 'all' && item.type !== typeFilter) return false;
            if (!skipCategory && categoryFilter === 'pad' && !padMatchesSubFilters(item, padFlowFilter, padPreferenceFilter, padUseCaseFilter)) return false;
            if (!skipCategory && categoryFilter === 'supplement' && symptomFilter !== 'all') {
                const ids = SYMPTOM_TO_SUPPLEMENTS[symptomFilter];
                if (ids && !ids.includes(item.id)) return false;
            }
            return true;
        });

        let list = applyFilters(combined);

        const qTrim = submittedQuery.trim();
        let scoreById = null;
        if (qTrim) {
            const scoreItem = (item) => ({
                item,
                matchScore: scoreQueryAgainstProduct(qTrim, buildSearchTextForItem(item, CATEGORY_LABELS)),
            });
            let scored = list.map(scoreItem).filter((x) => x.matchScore > 0);

            if (categoryFilter !== 'all') {
                const bestScopedScore = scored.reduce((max, x) => Math.max(max, x.matchScore), 0);
                const broadList = applyFilters(combined, true);
                const broadScored = broadList.map(scoreItem).filter((x) => x.matchScore > 0);
                const bestBroadScore = broadScored.reduce((max, x) => Math.max(max, x.matchScore), 0);
                // Widen past the active category tab whenever nothing in it matched, or something
                // outside it matches meaningfully better — e.g. searching "heating pad for cramps"
                // while browsing the Pads tab should surface the actual heating pad, not just period
                // pads that happen to share the word "pad" with the query.
                if (scored.length === 0 || bestBroadScore > bestScopedScore) {
                    scored = broadScored;
                }
            }

            list = scored.map((x) => x.item);
            scoreById = new Map(scored.map((x) => [x.item.id, x.matchScore]));
        }

        const matchTieBreak = (a, b) => {
            if (!scoreById) return 0;
            return (scoreById.get(b.id) ?? 0) - (scoreById.get(a.id) ?? 0);
        };

        if (sortBy === 'price-asc') {
            list = [...list].sort((a, b) => {
                const pa = getSortPrice(a);
                const pb = getSortPrice(b);
                if (pa == null && pb == null) {
                    const m = matchTieBreak(a, b);
                    if (m !== 0) return m;
                    return 0;
                }
                if (pa == null) return 1;
                if (pb == null) return -1;
                if (pa !== pb) return pa - pb;
                return matchTieBreak(a, b);
            });
        } else if (sortBy === 'price-desc') {
            list = [...list].sort((a, b) => {
                const pa = getSortPrice(a);
                const pb = getSortPrice(b);
                if (pa == null && pb == null) {
                    const m = matchTieBreak(a, b);
                    if (m !== 0) return m;
                    return 0;
                }
                if (pa == null) return 1;
                if (pb == null) return -1;
                if (pa !== pb) return pb - pa;
                return matchTieBreak(a, b);
            });
        } else if (sortBy === 'rating') {
            list = [...list].sort((a, b) => {
                const ra = a.ratingNote ? null : (getAynaRating(a, aynaReviews[a.id]) ?? (a.userRating != null ? Number(a.userRating) : null));
                const rb = b.ratingNote ? null : (getAynaRating(b, aynaReviews[b.id]) ?? (b.userRating != null ? Number(b.userRating) : null));
                if (ra == null && rb == null) return matchTieBreak(a, b);
                if (ra == null) return 1;
                if (rb == null) return -1;
                if (rb !== ra) return rb - ra;
                return matchTieBreak(a, b);
            });
        } else {
            const partnerAndJitter = !scoreById;
            // Partner-brand pinning only applies while the user is browsing unpersonalized —
            // once Personalized is on, this is effectively the recommendation engine, and per
            // the How We Make Money policy partner brands are surfaced higher on Discovery but
            // never in the recommendation engine.
            const partnerPinEnabled = partnerAndJitter && !personalizationFilter;
            list = [...list].sort((a, b) => {
                const m = matchTieBreak(a, b);
                if (m !== 0) return m;
                // Pure browsing (no active text-match score) — partner-brand items are pinned
                // ahead of everything else, then a per-visit random jitter keeps the catalog from
                // rendering in the exact same order every time someone lands on the page. Text
                // searches (scoreById set) keep relying purely on quality score as the tiebreak.
                if (partnerPinEnabled) {
                    const pa = isPartnerBrandItem(a) ? 1 : 0;
                    const pb = isPartnerBrandItem(b) ? 1 : 0;
                    if (pa !== pb) return pb - pa;
                }
                const baseA = getQualityScore(a, aynaReviews);
                const baseB = getQualityScore(b, aynaReviews);
                const qa = baseA + (partnerAndJitter ? shuffleJitter(a, shuffleSeed, baseA) : 0);
                const qb = baseB + (partnerAndJitter ? shuffleJitter(b, shuffleSeed, baseB) : 0);
                return qb - qa;
            });
            // Only for pure browsing (not text search — scoreById relevance ranking is never
            // reordered by this) — see applyColdStartFloor above for why jitter alone isn't enough.
            if (partnerAndJitter) list = applyColdStartFloor(list, PAGE_SIZE);
        }
        return list;
    }, [combined, macroGroup, categoryFilter, typeFilter, omittedProducts, submittedQuery, sortBy, personalizationFilter, recommendedSet, aynaReviews, padFlowFilter, padPreferenceFilter, padUseCaseFilter, symptomFilter, shuffleSeed]);

    // Back to the first page whenever the underlying result set actually
    // changes (new filter/search/sort) — not when AI suggestions arrive later
    // (gridItems depends on those too, but `filtered` deliberately doesn't).
    // Adjusted during render (React's recommended pattern for "reset state
    // when a derived value changes"), not in an effect — that would cost an
    // extra render pass for something that's cheap to just do inline.
    const [prevFiltered, setPrevFiltered] = useState(filtered);
    if (filtered !== prevFiltered) {
        setPrevFiltered(filtered);
        setVisibleCount(PAGE_SIZE);
    }

    // Which of board 1h's pills is lit. A filter that arrived from a search or a
    // landing chip may not correspond to any pill, in which case none is lit.
    const activeShopFilter = useMemo(() => {
        if (categoryFilter === 'postpartum') return 'postpartum';
        if (macroGroup === 'period-cycle') return 'cycle';
        if (macroGroup === 'pelvic-health' || categoryFilter === 'pelvic-floor') return 'pelvic-floor';
        if (macroGroup === 'all' && categoryFilter === 'all') return 'all';
        return null;
    }, [macroGroup, categoryFilter]);

    const qTrimForAi = submittedQuery.trim();

    const enrichedAiSuggestions = useMemo(
        () => (Array.isArray(aiSuggestions) ? aiSuggestions.map((p) => enrichLlmProductForDiscovery(p)) : []),
        [aiSuggestions]
    );

    const gridItems = useMemo(() => {
        // Union real catalog matches for the submitted query with AI suggestions,
        // in both browsing and search modes. This used to show ONLY AI results
        // once a search was submitted, discarding catalog matches entirely — so
        // a query the local scorer already matches correctly (e.g. "menstrual
        // cup" via the cup/menstrual alias in naturalLanguageSearch.js) showed 0
        // results whenever the AI call failed, rate-limited, or returned empty,
        // even though the identical query via a category-chip click found the
        // product instantly through `filtered`.
        const catalog = filtered;
        const names = new Set(catalog.map((p) => (p.name || '').trim().toLowerCase()).filter(Boolean));
        const out = [...catalog];
        for (const p of enrichedAiSuggestions) {
            const n = (p.name || '').trim().toLowerCase();
            if (n && names.has(n)) continue;
            out.push(p);
        }
        // The AI suggestions above are appended in whatever order Claude returned
        // them — the prompt asks it to rank by relevance, but that's advisory,
        // not enforced, so the model's first pick is sometimes a weaker/tangential
        // match while later ones are spot-on. Re-score everything (catalog items
        // included) against the query with the same deterministic scorer used for
        // catalog search, and stable-sort by it, so card #1 is always the actual
        // best match rather than whatever position an LLM happened to put it in.
        if (qTrimForAi) {
            const scored = out.map((item, idx) => ({
                item,
                idx,
                score: scoreQueryAgainstProduct(qTrimForAi, buildSearchTextForItem(item, CATEGORY_LABELS)),
            }));
            scored.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));
            return scored.map((x) => x.item);
        }
        return out;
    }, [filtered, enrichedAiSuggestions, qTrimForAi]);

    useEffect(() => {
        // Only resolve images for what's actually rendered (visibleCount),
        // not a flat 80 — pagination already caps the DOM to what's visible,
        // so this now naturally scales with it instead of doing extra work
        // for cards the user hasn't scrolled/paged to yet.
        const visible = gridItems.slice(0, visibleCount);
        const missing = visible
            .filter((item) => item && item.id && item.name)
            .filter((item) => resolvedImages[item.id] === undefined)
            .filter((item) => isPlaceholderProductImage(item.image));
        if (missing.length === 0) return;

        // Bounded worker pool. This used to fire one request per item with no
        // cap — up to 80 concurrent serverless invocations against a metered
        // image API from a single render, because every AI suggestion carries a
        // placeholder image. The shared cache and in-flight dedup made it cheap,
        // but the burst was still 80 parallel calls.
        let cancelled = false;
        const queue = [...missing];
        const CONCURRENCY = 5;

        const worker = async () => {
            while (!cancelled) {
                const item = queue.shift();
                if (!item) return;
                const url = await resolveProductImage(item.name, item.brand || '', item.url || '');
                if (cancelled) return;
                // Record '' as well: gating on `if (url)` left a no-image product
                // permanently `undefined`, so it was re-selected and re-resolved
                // on every run of this effect (resolvedImages is in its own deps).
                setResolvedImages((prev) => (prev[item.id] !== undefined ? prev : { ...prev, [item.id]: url || '' }));
            }
        };

        Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
            .catch((e) => console.warn('[Ayna] image resolution failed:', e?.message));

        return () => { cancelled = true; };
    }, [gridItems, resolvedImages, visibleCount]);

    const runAiSearch = useCallback(async (query, category, symptom) => {
        if (aiAbortRef.current) aiAbortRef.current.abort();
        const ac = new AbortController();
        aiAbortRef.current = ac;
        setAiLoading(true);
        setAiSuggestions([]);
        setAiRelatedSearches([]);
        setAiError(null);
        setAiQuerySummary('');
        const intake = quizResults?.fullHealthIntake || null;
        const profileSummary = personalizationFilter && intake ? [
            intake.primaryConcerns?.length ? `Concerns: ${intake.primaryConcerns.slice(0, 5).join(', ')}` : '',
            intake.conditions?.length ? `Conditions: ${intake.conditions.filter(c => c !== 'none').join(', ')}` : '',
            intake.productPreferences?.length ? `Preferences: ${intake.productPreferences.join(', ')}` : '',
            intake.goals?.length ? `Goals: ${intake.goals.join(', ')}` : '',
        ].filter(Boolean).join('. ') : '';
        const dislikedProducts = personalizationFilter ? (intake?.dislikedProductsText || '') : '';
        const dislikedTerms = dislikedProducts.split(/[,\n]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 1);
        try {
            const { suggestions, querySummary, relatedSearches, error } = await fetchSearchSuggestions({
                query, category, symptom, signal: ac.signal,
                personalized: personalizationFilter,
                profileSummary,
                dislikedProducts,
                maxResults: personalizationFilter ? 10 : 20,
            });
            if (ac.signal.aborted) return;
            setAiLoading(false);
            const filteredSuggestions = (Array.isArray(suggestions) ? suggestions : []).filter(s => {
                const nameAndBrand = `${s.name || ''} ${s.brand || ''}`.toLowerCase();
                return !dislikedTerms.some(term => nameAndBrand.includes(term));
            });
            setAiSuggestions(filteredSuggestions);
            setAiQuerySummary(typeof querySummary === 'string' ? querySummary : '');
            setAiRelatedSearches(Array.isArray(relatedSearches) ? relatedSearches : []);
            setAiError(error || null);
        } catch (e) {
            if (e?.name === 'AbortError') return;
            setAiLoading(false);
            setAiError(e?.message || 'Could not load suggestions');
        }
    }, [personalizationFilter, quizResults]);

    useEffect(() => {
        if (qTrimForAi.length < 2) {
            if (aiAbortRef.current) { aiAbortRef.current.abort(); aiAbortRef.current = null; }
            setAiSuggestions([]);
            setAiQuerySummary('');
            setAiRelatedSearches([]);
            setAiLoading(false);
            setAiError(null);
            setSearchSubmitted(false);
        }
    }, [qTrimForAi]);

    useEffect(() => {
        const q = submittedQuery.trim();
        if (q.length < 3) { setDsldProducts([]); return; }
        const supplementKeywords = /supplement|vitamin|mineral|probiotic|omega|magnesium|iron|folate|inositol|myo|d3|b12|zinc|calcium|collagen|ashwagandha|vitex|evening primrose|berberine|spearmint|saw palmetto/i;
        if (!supplementKeywords.test(q) && categoryFilter !== 'supplement') { setDsldProducts([]); return; }
        const t = setTimeout(async () => {
            setDsldLoading(true);
            const products = await fetchDsldProducts(q, 6);
            setDsldProducts(products);
            setDsldLoading(false);
        }, 700);
        return () => clearTimeout(t);
    }, [submittedQuery, categoryFilter]);

    const runSearch = (rawQuery) => {
        const q = (rawQuery || '').trim();
        if (!q || q.length < 2) return;
        setSearchQuery(q);
        posthog.capture('search_performed', { queryLength: q.length });
        const qLower = q.toLowerCase();

        // Cancel any pending debounce — we're going immediate
        clearTimeout(debounceRef.current);
        setSubmittedQuery(q);
        setSearchSubmitted(true);

        const categoryNudges = [
            { test: (s) => s.includes('underwear') || s.includes('panty') || s.includes('panties'), cat: 'period-underwear' },
            { test: (s) => (s.includes('pad') || s.includes('pads')) && !s.includes('underwear'), cat: 'pad' },
            { test: (s) => s.includes('tampon'), cat: 'tampon' },
            { test: (s) => (s.includes('cup') && s.includes('menstrual')) || (s.includes('cup') && !s.includes('supplement')), cat: 'cup' },
            { test: (s) => s.includes('disc') && !s.includes('discover'), cat: 'disc' },
            { test: (s) => s.includes('menopause') || s.includes('perimenopause'), cat: 'menopause' },
            { test: (s) => s.includes('pregnancy') || s.includes('prenatal'), cat: 'pregnancy' },
            { test: (s) => s.includes('postpartum') || s.includes('breastfeeding') || s.includes('nursing'), cat: 'postpartum' },
            { test: (s) => s.includes('fertility') || s.includes('conceive') || s.includes('ttc'), cat: 'fertility' },
            { test: (s) => s.includes('cramp') || s.includes('dysmenorrhea'), cat: 'cramp-relief' },
            { test: (s) => s.includes('pelvic floor') || s.includes('kegel'), cat: 'pelvic-floor' },
            { test: (s) => s.includes('tracker') || s.includes('tracking') || s.includes('wearable'), cat: 'tracker' },
        ];

        let resolvedCategory = categoryFilter;
        for (const { test, cat } of categoryNudges) {
            if (test(qLower)) { setCategoryFilter(cat); resolvedCategory = cat; break; }
        }

        if (qLower.includes('waitlist') || qLower.includes('startup')) {
            if (setCurrentView) setCurrentView('waitlist');
            return;
        } else if (qLower.includes('ecosystem') || qLower.includes('routine')) {
            if (setCurrentView) setCurrentView('ecosystem');
            return;
        } else if (qLower.includes('quiz') || qLower.includes('assess')) {
            if (setCurrentView) setCurrentView('quiz');
            return;
        }

        // Trigger AI search immediately with resolved category
        runAiSearch(q, resolvedCategory, symptomFilter);
    };

    const handleSmartSearch = (e) => {
        e.preventDefault();
        runSearch(searchQuery);
    };

    return (
        <section className="discovery-shop animate-fade-in-up">
            {/* Board 1h header: Shop, the result count, filter pills, personalization toggle */}
            <div className="mockup-page discovery-shop__head">
                <div>
                    <div className="discovery-shop__title">Shop</div>
                    <div className="discovery-shop__count">
                        {gridItems.length} product{gridItems.length === 1 ? '' : 's'}
                        {personalizationFilter && (hasQuizFrustrations || hasHealthImport) ? ', matched to your health profile' : ''}
                    </div>
                </div>
                <div className="discovery-shop__controls">
                    <div className="discovery-shop__filters">
                        {SHOP_FILTERS.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                className={activeShopFilter === f.key ? 'is-active' : undefined}
                                onClick={() => { setMacroGroup(f.group); setCategoryFilter(f.category); }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="discovery-shop__personalize"
                        role="switch"
                        aria-checked={personalizationFilter}
                        onClick={() => setPersonalizationFilter((v) => !v)}
                    >
                        Personalized
                        <span className={`discovery-shop__switch ${personalizationFilter ? 'is-on' : ''}`}>
                            <span />
                        </span>
                    </button>
                </div>
            </div>

            <div className="mockup-page discovery-shop__search">
                <form onSubmit={handleSmartSearch}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value.trim()) setSubmittedQuery(''); }}
                        placeholder="What are you looking for?"
                        aria-label="Search products and articles"
                    />
                </form>
                <div className="discovery-shop__suggestions">
                    {searchSuggestions.map((term) => (
                        <button key={term} type="button" onClick={() => runSearch(term)}>
                            {term}
                        </button>
                    ))}
                </div>
            </div>

          <div className="mockup-page">
            {/* Loading state for explicit search */}
            {searchSubmitted && aiLoading && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(252px, 1fr))', gap: '1.5rem' }}>
                        {Array.from({ length: 8 }, (_, i) => (
                            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }} aria-hidden="true">
                                <div className="skeleton-shimmer" style={{ height: '118px', width: '100%' }} />
                                <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div className="skeleton-shimmer" style={{ height: '0.7rem', width: '40%', borderRadius: '4px' }} />
                                    <div className="skeleton-shimmer" style={{ height: '1rem', width: '85%', borderRadius: '4px' }} />
                                    <div className="skeleton-shimmer" style={{ height: '0.8rem', width: '100%', borderRadius: '4px' }} />
                                    <div className="skeleton-shimmer" style={{ height: '0.8rem', width: '70%', borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Product Grid */}
            {(!searchSubmitted || !aiLoading) && (
            <>
            <div className="discovery-grid">
                {gridItems.slice(0, visibleCount).map((item, idx) => {
                    const isStartup = item.isStartup === true;
                    const releasedStartup = isStartup && item.productReleased === true;
                    const isInEcosystem = !!myProducts[item.id];
                    const isJoined = isStartup && !releasedStartup && !!joinedWaitlists[item.id];
                    const perUnitPrice = getPricePerUnitLabel(item);

                    const cardImageSrc = resolvedImages[item.id] || item.image;
                    // Distinguishes "still fetching an image" from "resolved, none
                    // found" — both previously showed the identical AYNA fallback
                    // block, so a card that was actively loading looked permanently
                    // image-less rather than in progress.
                    const imageStillLoading = resolvedImages[item.id] === undefined && isPlaceholderProductImage(item.image);

                    // Board 1h puts one small badge in the tile's top-left corner.
                    const badge = recommendedSet?.has(item.id) ? 'MATCH'
                        : isStartup ? 'STARTUP'
                        : item.category === 'telehealth' ? 'TELEHEALTH'
                        : item.type === 'digital' ? 'APP'
                        : item.isEmergingBrand ? 'BRAND'
                        : null;

                    const eyebrow = String(CATEGORY_LABELS[item.category] || item.category || 'Startup')
                        .replace(/^[^\w]+\s*/, '')
                        .toUpperCase();

                    const displayRating = getAynaRating(item, aynaReviews[item.id]) ?? item.userRating;

                    return (
                        <div
                            key={item.id}
                            className="discovery-card"
                            role="button"
                            tabIndex={0}
                            aria-label={`${item.name} — open details`}
                            onClick={() => onOpenProduct(item)}
                            onKeyDown={(e) => {
                                if (e.key !== 'Enter' && e.key !== ' ') return;
                                e.preventDefault();
                                onOpenProduct(item);
                            }}
                            style={{ animation: `fadeInUp 0.4s ${Math.min(idx * 0.05, 0.3)}s backwards` }}
                        >
                            <div className="discovery-card__tile">
                                {cardImageSrc && !isPlaceholderProductImage(cardImageSrc) ? (
                                    <img
                                        src={cardImageSrc}
                                        alt=""
                                        loading="lazy"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                ) : imageStillLoading ? (
                                    <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
                                ) : (
                                    <span className="discovery-card__initial" aria-hidden="true">
                                        {String(item.brand || item.name || '?').trim().charAt(0).toUpperCase()}
                                    </span>
                                )}
                                {badge && <span className="discovery-card__badge">{badge}</span>}
                                <button
                                    type="button"
                                    className={`discovery-card__heart ${isInEcosystem ? 'is-on' : ''}`}
                                    aria-pressed={isInEcosystem}
                                    aria-label={isInEcosystem ? `Remove ${item.name} from your ecosystem` : `Add ${item.name} to your ecosystem`}
                                    onClick={(e) => { e.stopPropagation(); onToggleProduct(item); }}
                                >
                                    {isInEcosystem ? '♥' : '♡'}
                                </button>
                            </div>

                            <div className="discovery-card__eyebrow">{eyebrow}</div>
                            <div className="discovery-card__name">{item.name}</div>
                            <div className="discovery-card__price">
                                {isStartup ? item.stage : item.price}
                                {!isStartup && perUnitPrice ? ` · ${perUnitPrice}` : ''}
                                {displayRating != null ? ` · ★ ${Number(displayRating).toFixed(1)}` : ''}
                            </div>

                            {item.outOfBusiness && (
                                <div className="discovery-card__flag">No longer sold — kept so you can still check safety info</div>
                            )}

                            {isStartup && !releasedStartup && (
                                <button
                                    type="button"
                                    className="discovery-card__join"
                                    onClick={(e) => { e.stopPropagation(); toggleJoinWaitlist(item); }}
                                >
                                    {isJoined ? 'On the waitlist' : 'Join waitlist'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            {gridItems.length > visibleCount && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        style={{ padding: '0.7rem 1.75rem' }}
                    >
                        Load more ({gridItems.length - visibleCount} more)
                    </button>
                </div>
            )}
            </>
            )}

            {/* Related searches */}
            {searchSubmitted && !aiLoading && aiRelatedSearches.length > 0 && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                        {aiRelatedSearches.map((term) => (
                            <button
                                key={term}
                                type="button"
                                onClick={() => { setSearchQuery(term); setSubmittedQuery(term); setSearchSubmitted(true); runAiSearch(term, categoryFilter, symptomFilter); }}
                                style={{
                                    padding: '0.4rem 0.9rem',
                                    borderRadius: 'var(--radius-pill)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface-soft)',
                                    color: 'var(--color-text-main)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                }}
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {(dsldLoading || dsldProducts.length > 0) && (
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--color-text-main)' }}>
                        Verified Supplements from the <GlossaryTerm term="NIH" />
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                        These supplement labels were checked against the government's official database.
                    </p>
                    {dsldLoading && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Checking the government database…</p>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                        {dsldProducts.map((product) => (
                            <div key={product.id} className="card hover-lift" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '120px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-secondary-fade), #f3e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>💊</div>
                                    )}
                                    <span style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-pill)', fontSize: '0.68rem', fontWeight: '700' }}>
                                        ✓ NIH Verified
                                    </span>
                                </div>
                                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    {product.brand && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: '600', marginBottom: '0.15rem' }}>{product.brand}</div>}
                                    <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.35rem', lineHeight: 1.3 }}>{product.name}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', lineHeight: 1.4, flexGrow: 1 }}>{product.summary}</p>
                                    {product.url && (
                                        <a href={product.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'inline-block' }}>
                                            View NIH label →
                                        </a>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                                        <button className="btn btn-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', flex: 1 }}
                                            onClick={() => onToggleProduct && onToggleProduct(product)}>
                                            {myProducts?.[product.id] ? '✓ Added' : '+ Add'}
                                        </button>
                                        <button className="btn btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', flex: 1 }}
                                            onClick={() => onOpenProduct && onOpenProduct(product)}>
                                            Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
            <Disclaimer compact style={{ marginTop: '2rem', textAlign: 'center' }} />
        </section>
    );
}


