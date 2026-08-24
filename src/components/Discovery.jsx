import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS, SYMPTOM_TO_SUPPLEMENTS, filterPrescriptionCareGate } from '../data/products';
import { loadProductCatalog } from '../utils/productCatalog';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from '../utils/naturalLanguageSearch';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { isPartnerBrandItem } from '../utils/partnerBrands';
import { fetchSearchSuggestions } from '../utils/fetchSearchSuggestions';
import { RELEASED_STARTUPS } from '../data/startups';
import { getAynaRating } from '../data/aynaReviews';
import Disclaimer from './Disclaimer';
import { getPricePerUnitLabel } from '../utils/pricePerUnit';
import { fetchDsldProducts } from '../utils/fetchDsldProducts';
import { enrichLlmProductForDiscovery } from '../utils/enrichLlmProductForDiscovery';
import { resolveProductImage, isPlaceholderProductImage, safeProductImageSrc } from '../utils/resolveProductImage';
import posthog from 'posthog-js';
import GlossaryTerm from './GlossaryTerm';
import { productHref, isPlainLeftClick } from '../utils/productRoute';

const MACRO_GROUPS = [
    { id: 'all', label: 'All', categories: [], keywords: [] },
    { id: 'period', label: 'Period', categories: ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief'], keywords: ['period', 'menstrual'] },
    // 'ph' used to be a bare keyword here and matched any product whose copy happened to
    // contain the substring "ph" — e.g. Nature Made Iron ("#1 pharmacist recommended"), Wisp
    // ("pharmacy pickup"), and Apple Health ("built into iPhone") all satisfied it despite
    // having nothing to do with intimate care. Scoped to the actual phrasing real vaginal-pH
    // products use (see e.g. p-honeypot-wash, p-good-clean-love, p-v-wash) instead.
    { id: 'intimate', label: 'Intimate Care', categories: ['intimate-care'], keywords: ['vaginal', 'vulva', 'intimate', 'moisturizer', 'ph balance', 'ph-balanced', 'ph balanced', 'ph level', 'ph support'] },
    { id: 'sexual', label: 'Sexual Wellness', categories: ['sex-tech'], keywords: ['lubricant', 'lube', 'condom', 'sexual wellness', 'intimacy'] },
    { id: 'birth-control', label: 'Birth Control', categories: ['contraception'], keywords: ['contraception', 'contraceptive', 'emergency contraception', 'barrier'] },
    { id: 'fertility', label: 'Fertility', categories: ['fertility'], keywords: ['fertility', 'ovulation', 'conceive', 'conception'] },
    { id: 'pregnancy', label: 'Pregnancy', categories: ['pregnancy'], keywords: ['pregnancy', 'prenatal'] },
    { id: 'postpartum', label: 'Postpartum', categories: ['postpartum'], keywords: ['postpartum', 'lactation', 'breastfeeding', 'perineal'] },
    { id: 'breast', label: 'Breast Care', categories: ['breast-care', 'lactation'], keywords: ['breast', 'breastfeeding', 'nipple', 'pump', 'lactation'] },
    { id: 'pelvic', label: 'Pelvic', categories: ['pelvic-floor', 'pelvic-health', 'incontinence'], keywords: ['pelvic', 'kegel', 'bladder', 'incontinence', 'bladder leak'] },
    { id: 'menopause', label: 'Menopause', categories: ['menopause'], keywords: ['menopause', 'perimenopause', 'hot flash'] },
    // 'supplement' is a product-TYPE category shared by dozens of unrelated items (iron for
    // anemia, plain vitamin D, omega-3 for cramps, etc.) — it used to be listed here directly,
    // which meant EVERY supplement in the catalog satisfied the Hormones chip regardless of what
    // it actually treats. Matching is now scoped to the real concern taxonomy instead: the
    // 'hormone-monitoring' category, the 'hormone-balance' healthFunction (checked exactly via
    // healthFunctions below, not folded into the general keyword text blob — a substring scan
    // would otherwise let something like the unrelated 'fitness-cycle' healthFunction slug
    // falsely satisfy the 'cycle' keyword), and the keywords below.
    { id: 'hormones', label: 'Hormones', categories: ['hormone-monitoring'], healthFunctions: ['hormone-balance'], keywords: ['pms', 'pcos', 'cycle', 'hormone', 'hormonal'] },
    // Bare 'skin'/'moisturizer' catch vulvar/vulva-balm copy ("vulvar skin", "arousal
    // moisturizers") and an incontinence liner's "skin comfort formula" claim — all real
    // catalog phrasing, just not about the facial/body skincare this chip means. Those
    // product types are excluded from the keyword scan below (see excludeCategories in
    // itemMatchesMacroGroup) rather than trying to enumerate every mismatched phrase.
    { id: 'skin', label: 'Skin', categories: ['skin', 'skincare', 'body-care'], keywords: ['skin', 'cleanser', 'moisturizer', 'spf', 'acne', 'hyperpigmentation'], excludeCategories: ['intimate-care', 'sex-tech', 'incontinence'] },
    // Same class of bug as Skin above: 'thinning' and 'hair' were catching "vaginal dryness
    // and thinning" (a menopause GSM symptom, not hair thinning) and "ingrown hairs...on the
    // bikini line" (intimate-area exfoliation, not hair care). excludeCategories keeps those
    // out of the keyword scan. Note: with these excluded, this chip currently has zero
    // legitimate matches in the catalog — there are no real shampoo/scalp/hair-loss products
    // in src/data/*.js (confirmed by grep), so the chip won't appear in the UI (availableMacroGroups
    // hides chips with no matches) until real hair-care products are added. Not fabricating
    // placeholder products to fill it — flagging as a genuine catalog content gap instead.
    { id: 'hair', label: 'Hair', categories: ['hair', 'haircare'], keywords: ['hair', 'scalp', 'shampoo', 'conditioner', 'thinning'], excludeCategories: ['intimate-care', 'menopause'] },
    { id: 'gut', label: 'Gut', categories: ['gut-health'], keywords: ['gut', 'bloating', 'fiber', 'probiotic'] },
    // 'stress' alone matched incontinence products' clinical term "stress incontinence"/
    // "stress or urge bladder leaks" (a bladder-control classification, unrelated to mental
    // stress) — stripped via NEGATED_CONCERN_PHRASES below rather than dropping the keyword,
    // since "stress" genuinely belongs here for its real (psychological) sense.
    { id: 'sleep-stress', label: 'Sleep + Stress', categories: ['mental-health'], keywords: ['sleep', 'stress', 'relaxation'] },
    { id: 'pain-recovery', label: 'Pain + Recovery', categories: ['pain-relief', 'cramp-relief', 'recovery'], keywords: ['pain', 'cramp', 'heat therapy', 'recovery', 'muscle'] },
    // 'test' used to be a bare keyword and matched "clinically tested" (Honey Pot wash),
    // "gynecologist-tested" (Luna wash), and even "testosterone" (spearmint PCOS tea) — none
    // of which are diagnostic tests/devices. Scoped to the phrasing real test products use
    // (p-azo-test's "test strips", p-winx-uti-test-treat's "rapid test").
    { id: 'tests-devices', label: 'Tests + Devices', categories: ['tracker', 'diagnostics', 'hormone-monitoring'], keywords: ['test strip', 'test kit', 'rapid test', 'diagnostic test', 'lab test', 'tracker', 'wearable', 'monitor'] },
];

// Some product copy legitimately advertises the ABSENCE of a property — e.g. Neycher's
// intimate-care line describing itself as "hormone-free" / "non-hormonal" — rather than the
// presence of it. A naive substring match on a concern keyword like "hormone" can't tell "this
// product is about hormones" apart from "this product explicitly contains none," so it was
// mis-filing hormone-free vulva balm/moisturizing gel under the Hormones chip. Strip these
// negated phrases out before keyword matching so a chip only surfaces products that are
// actually about the concern, not ones that merely deny it.
//
// Broadened beyond pure negation to the same underlying problem in a different shape: a
// keyword's word/phrase appearing in copy for an unrelated reason.
//   - "outside your period" (Neycher: usage timing, not a period product), "not menstrual
//     flow", "distinct from a menstrual panty liner", and "rather than menstrual blood"
//     (incontinence pads explicitly contrasting themselves with period products) were all
//     satisfying the Period chip's 'period'/'menstrual' keywords despite each one denying
//     the very thing the keyword is meant to detect.
//   - "stress incontinence" / "stress or urge bladder leaks" / "stress and urge incontinence"
//     are a clinical bladder-control term, not the Sleep + Stress chip's intended
//     (psychological) sense of "stress" — was surfacing incontinence pads under that chip.
const NEGATED_CONCERN_PHRASES = [
    /non-?\s?hormonal/g,
    /hormone-?\s?free/g,
    /outside your period/g,
    /not\s+(?:for\s+)?menstrual/g,
    /distinct from a\s+menstrual/g,
    /rather than menstrual/g,
    /stress\s+(?:(?:or|and)\s+urge\s+)?(?:bladder\s+)?(?:incontinence|leaks?)/g,
];

function productSearchText(item) {
    const raw = [
        item?.category, item?.name, item?.brand, item?.summary, item?.description, item?.tagline,
        ...(Array.isArray(item?.badges) ? item.badges : []),
        ...(Array.isArray(item?.tags) ? item.tags : []),
        item?.eligibility, item?.sustainability, item?.lifeStage,
    ].filter(Boolean).join(' ').toLowerCase();
    return NEGATED_CONCERN_PHRASES.reduce((t, re) => t.replace(re, ' '), raw);
}

function itemMatchesMacroGroup(item, groupId) {
    if (!groupId || groupId === 'all') return true;
    const group = MACRO_GROUPS.find((g) => g.id === groupId);
    if (!group) return true;
    if (group.categories.includes(item?.category)) return true;
    // Structured concern tags (e.g. 'hormone-balance') are checked as an exact membership test,
    // not folded into the free-text keyword scan below — that keeps a slug like the unrelated
    // 'fitness-cycle' healthFunction from accidentally satisfying a keyword such as 'cycle'.
    if (Array.isArray(group.healthFunctions) && Array.isArray(item?.healthFunctions) &&
        item.healthFunctions.some((hf) => group.healthFunctions.includes(hf))) return true;
    // Some chips' keywords are inherently ambiguous outside their own product domain (e.g.
    // "skin"/"moisturizer" legitimately describe vulvar-care copy; "thinning" legitimately
    // describes vaginal-tissue thinning) — excludeCategories lets a chip opt specific
    // product-type categories out of the free-text keyword scan below (they can still match
    // via an explicit categories/healthFunctions hit above) so e.g. a vulva balm doesn't
    // surface under "Skin" just because its copy happens to say "skin."
    if (Array.isArray(group.excludeCategories) && group.excludeCategories.includes(item?.category)) return false;
    const text = productSearchText(item);
    return group.keywords.some((keyword) => text.includes(keyword));
}

// Exported for unit testing of the category-chip filtering logic (see
// Discovery.macroGroupFilter.test.js) — not used by any other component.
export { MACRO_GROUPS, productSearchText, itemMatchesMacroGroup, resolveBrowseAiRoundQuery };

/** Natural-language phrase for the browse-AI extension's `query` param — prefers the
 * more specific active scope (a chosen sub-category) over the broader macro group, and
 * returns '' when browsing is fully unscoped (both 'all'), which the caller treats as
 * "not eligible to auto-generate" (a single LLM call needs a specific product type to
 * stay safe/bounded, per the anti-fabrication rules in api/search-suggestions.js). */
function buildBrowseAiQueryText(categoryFilter, macroGroup) {
    if (categoryFilter && categoryFilter !== 'all') {
        return CATEGORY_LABELS[categoryFilter] || categoryFilter.replace(/-/g, ' ');
    }
    const group = MACRO_GROUPS.find((g) => g.id === macroGroup);
    if (group && group.id !== 'all') {
        return `${group.label} products`;
    }
    return '';
}

/** Resolves what a single browse-AI round (runBrowseAiRound) should actually send, unifying
 * two callers: (1) browse mode, no typed query — uses the synthesized category/macro-group
 * label text; (2) typed-search "Load more" continuation — uses the user's own submitted text
 * verbatim, per qTrimForAi, rather than a synthesized label. Also decides the "batch N" cache-
 * busting suffix (see the fetchSearchSuggestions caching note at the runBrowseAiRound call
 * site). For a typed search, roundIndexAtCallTime starts at 0 (a fresh browseAiRounds
 * accumulator per query) but the initial one-shot fetch (runAiSearch) already consumed "batch
 * 1" with the plain query text before any round-based continuation runs — so this round is
 * really the SECOND batch overall; effectiveRoundIndex accounts for that with a +1 so the
 * very first continuation round doesn't resend the identical query runAiSearch just used
 * (which would just hit fetchSearchSuggestions' cache and return already-seen duplicates).
 * Returns null when there's no query text to send at all (unscoped browse). Exported for unit
 * testing — see Discovery.macroGroupFilter.test.js. */
function resolveBrowseAiRoundQuery(qTrimForAi, categoryFilter, macroGroup, roundIndexAtCallTime) {
    const isTypedSearchContinuation = Boolean(qTrimForAi);
    const baseQueryText = isTypedSearchContinuation ? qTrimForAi : buildBrowseAiQueryText(categoryFilter, macroGroup);
    if (!baseQueryText) return null;
    const effectiveRoundIndex = isTypedSearchContinuation ? roundIndexAtCallTime + 1 : roundIndexAtCallTime;
    const queryText = effectiveRoundIndex > 0
        ? `${baseQueryText} (batch ${effectiveRoundIndex + 1} of several — suggest different specific products than earlier batches, avoid repeating brand names already covered)`
        : baseQueryText;
    return { queryText, isTypedSearchContinuation };
}

function getExplicitEligibility(item) {
    // Never infer reimbursement eligibility from product names, image URLs, or copy.
    // Only structured fields supplied by the catalog are authoritative enough to filter on.
    const combined = item?.fsaHsaEligible === true || item?.fsa_hsa_eligible === true;
    const fsa = combined || item?.fsaEligible === true || item?.fsa_eligible === true;
    const hsa = combined || item?.hsaEligible === true || item?.hsa_eligible === true;
    return { fsa, hsa };
}

function matchesPreference(item, filter) {
    if (filter === 'all') return true;
    const text = productSearchText(item);
    const exact = {
        'fragrance-free': ['fragrance free', 'fragrance-free'],
        'sensitive-skin': ['sensitive skin'],
        vegan: ['vegan'],
        'cruelty-free': ['cruelty free', 'cruelty-free'],
        organic: ['organic'],
        'clean-ingredients': ['clean ingredients'],
    };
    return (exact[filter] || []).some((needle) => text.includes(needle));
}

function hasClinicianSupport(item) {
    const doctor = item?.verificationLinks?.doctor;
    const links = Array.isArray(doctor) ? doctor : Array.isArray(doctor?.links) ? doctor.links : [];
    return Boolean(item?.doctorOpinion || item?.clinicianOpinion || item?.clinicianReview || links.length > 0);
}

function hasCommunitySupport(item, reviewBucket) {
    const rating = item?.ratingNote ? null : (getAynaRating(item, reviewBucket) ?? (item?.userRating != null ? Number(item.userRating) : null));
    const reviewCount = Array.isArray(reviewBucket?.reviews) ? reviewBucket.reviews.length : 0;
    const community = item?.verificationLinks?.community;
    const communityLinks = Array.isArray(community) ? community : Array.isArray(community?.links) ? community.links : [];
    return (Number.isFinite(rating) && rating >= 4) || reviewCount > 0 || Boolean(item?.communityReview) || communityLinks.length > 0;
}

function isSponsoredItem(item) {
    return item?.sponsored === true || item?.isSponsored === true || String(item?.placementType || '').toLowerCase() === 'sponsored';
}

function getExplicitMatchPercent(item) {
    const candidates = [
        item?.aynaMatch,
        item?.aynaMatchPercent,
        item?.matchPercent,
        item?.matchPercentage,
        item?.personalizationScore,
    ];
    for (const value of candidates) {
        if (value == null || value === '') continue;
        const numeric = typeof value === 'string' ? Number(value.replace('%', '').trim()) : Number(value);
        if (!Number.isFinite(numeric)) continue;
        const normalized = numeric > 0 && numeric <= 1 ? numeric * 100 : numeric;
        if (normalized >= 0 && normalized <= 100) return Math.round(normalized);
    }
    return null;
}

function matchesSustainability(item, filter) {
    if (filter === 'all') return true;
    const text = productSearchText(item);
    const map = {
        reusable: ['reusable', 'reuse'],
        recyclable: ['recyclable', 'recycled'],
        'low-waste': ['low waste', 'zero waste', 'low-waste'],
        packaging: ['sustainable packaging', 'plastic-free packaging', 'compostable packaging'],
    };
    return (map[filter] || []).some((term) => text.includes(term));
}

function matchesLifeStage(item, filter) {
    if (filter === 'all') return true;
    return itemMatchesMacroGroup(item, filter === 'perimenopause' ? 'menopause' : filter);
}

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
    { value: 'default', label: 'Best Match' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
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

function truncateCardSummary(text, max = 200) {
    if (!text || typeof text !== 'string') return '';
    const t = text.trim();
    if (t.length <= max) return t;
    // Prefer stopping at the end of a full sentence within the limit, so the
    // card teaser reads as one complete thought instead of trailing off
    // mid-clause — full detail is always one tap away in Details.
    const truncated = t.slice(0, max);
    const lastSentenceEnd = Math.max(truncated.lastIndexOf('. '), truncated.lastIndexOf('! '), truncated.lastIndexOf('? '));
    if (lastSentenceEnd > max * 0.4) {
        return truncated.slice(0, lastSentenceEnd + 1).trim();
    }
    return `${truncated.trimEnd()}…`;
}

/** Shared profile/dislikes context builder for the AI search-suggestion calls —
 * used by both the typed-search flow (runAiSearch) and the browse-mode AI
 * extension (runBrowseAiRound) so the two can't drift on what "personalized"
 * means. Pure extraction of what runAiSearch already computed inline; the
 * returned values are unchanged from before this was factored out. */
function buildAiProfileContext(personalizationFilter, quizResults) {
    const intake = quizResults?.fullHealthIntake || null;
    const profileSummary = personalizationFilter && intake ? [
        intake.primaryConcerns?.length ? `Concerns: ${intake.primaryConcerns.slice(0, 5).join(', ')}` : '',
        intake.conditions?.length ? `Conditions: ${intake.conditions.filter(c => c !== 'none').join(', ')}` : '',
        intake.productPreferences?.length ? `Preferences: ${intake.productPreferences.join(', ')}` : '',
        intake.goals?.length ? `Goals: ${intake.goals.join(', ')}` : '',
    ].filter(Boolean).join('. ') : '';
    const dislikedProducts = personalizationFilter ? (intake?.dislikedProductsText || '') : '';
    const dislikedTerms = dislikedProducts.split(/[,\n]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 1);
    return { profileSummary, dislikedProducts, dislikedTerms };
}

export default function Discovery({ trackedProducts, toggleTrackProduct, myProducts, onToggleProduct, joinedWaitlists, toggleJoinWaitlist, omittedProducts, toggleOmitProduct, setCurrentView, onOpenProduct, initialSearch, recommendedProductIds, aynaReviews = {}, initialCategory, initialPadFlow, initialPadPreference, initialPadUseCase, initialSymptom, hasQuizFrustrations = false, hasHealthImport = false, quizResults = null, savedProducts = {}, onToggleSaved, user = null, onRequirePersonalizeAuth = null }) {
    const [macroGroup, setMacroGroup] = useState(() => {
        if (!initialCategory || initialCategory === 'all') return 'all';
        return MACRO_GROUPS.find(g => g.categories.includes(initialCategory))?.id || 'all';
    });
    const [categoryFilter, setCategoryFilter] = useState(initialCategory || 'all');
    const [typeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState(initialSearch || '');
    const [submittedQuery, setSubmittedQuery] = useState(initialSearch || '');
    const [sortBy, setSortBy] = useState('default');
    // Freshly generated on every mount — Discovery unmounts/remounts on each navigation to it,
    // so this reshuffles the browsing grid's default order every time a user lands on the page,
    // without reshuffling mid-visit as filters/sort change.
    const [shuffleSeed] = useState(() => Math.random().toString(36).slice(2));
    // Personalization requires an actual account (quiz results / health import /
    // real recommendations all live behind login) -- never on for a logged-out
    // visitor, regardless of any of those other signals somehow being truthy.
    const [personalizationFilter, setPersonalizationFilter] = useState(Boolean(user) && (Boolean(recommendedProductIds?.length) || hasQuizFrustrations || hasHealthImport));
    const [showFilters, setShowFilters] = useState(false);
    const [priceFilter, setPriceFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [eligibilityFilter, setEligibilityFilter] = useState('all');
    const [sustainabilityFilter, setSustainabilityFilter] = useState('all');
    const [lifeStageFilter, setLifeStageFilter] = useState('all');
    const [aynaFilter, setAynaFilter] = useState('all');
    const [preferenceFilter, setPreferenceFilter] = useState('all');

    const personalizationInitialized = useRef(false);
    useEffect(() => {
        if (!personalizationInitialized.current && user && (recommendedProductIds?.length || hasQuizFrustrations || hasHealthImport)) {
            setPersonalizationFilter(true);
            personalizationInitialized.current = true;
        }
    }, [recommendedProductIds, hasQuizFrustrations, hasHealthImport]);
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
    // Browse-mode AI extension (no-query browsing): fully separate from the
    // aiSuggestions/runAiSearch state above so the typed-search flow can't be
    // entangled by it. browseAiSuggestions accumulates across "Load more"
    // rounds (unlike aiSuggestions, which is replaced wholesale per search);
    // browseAiRounds bounds how many generation rounds a single browse
    // context gets (see MAX_BROWSE_AI_ROUNDS below).
    const [browseAiSuggestions, setBrowseAiSuggestions] = useState([]);
    const [browseAiRounds, setBrowseAiRounds] = useState(0);
    const [browseAiLoading, setBrowseAiLoading] = useState(false);
    const browseAiAbortRef = useRef(null);
    const [dsldProducts, setDsldProducts] = useState([]);
    const [dsldLoading, setDsldLoading] = useState(false);
    const [resolvedImages, setResolvedImages] = useState({});
    // Pagination: rendering every matching product as a full DOM card at once
    // (previously up to the whole ~159+ product catalog, unconditionally) was
    // the actual render-cost bottleneck — not image loading, which already had
    // caching/concurrency limits. "Load more" reveals additional batches
    // instead of mounting everything up front.
    const PAGE_SIZE = 30;
    // Bounds how many browse-AI generation rounds a single browse context
    // (macro group + category + personalization) can trigger. Raised from 2
    // to 10 per explicit direction: browsing a category should feel
    // effectively endless (there are real products in every category well
    // beyond what the static catalog holds), not stop after one extra
    // batch. Still bounded, not literally infinite — a genuinely
    // open-ended browse session (someone holding "Load more") shouldn't be
    // able to run unlimited paid LLM calls, but 10 rounds x ~8 items is
    // ~80 additional real products per category before it stops offering
    // more, which is the point where the model would likely be repeating
    // itself anyway.
    const MAX_BROWSE_AI_ROUNDS = 10;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const recommendedSet = useMemo(() => new Set(recommendedProductIds || []), [recommendedProductIds]);
    const recommendedRank = useMemo(() => new Map((recommendedProductIds || []).map((id, index) => [id, index])), [recommendedProductIds]);

    // AI-discovered products (api/discover-products.js), human-approved only —
    // /api/products already filters to is_active=true, and a discovered row is
    // never is_active until scripts/review-discovered-products.mjs approves it
    // (see supabase/product_catalog_discovery.sql). This is additive on top of
    // the bundled catalog, not a replacement for it: loadProductCatalog() falls
    // back to the bundled copy on any failure, so filtering to source==='discovered'
    // here means a fallback response (source:'bundled') just contributes nothing,
    // never duplicates the bundled products it already contains.
    const [discoveredProducts, setDiscoveredProducts] = useState([]);
    React.useEffect(() => {
        let cancelled = false;
        loadProductCatalog().then(({ products, source }) => {
            if (cancelled || source === 'bundled') return;
            setDiscoveredProducts(products.filter((p) => p.source === 'discovered'));
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

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
        // discoveredProducts are already the client-ready shape /api/products
        // returns (toClientProduct in api/products.js), so no mapping needed —
        // just stamp isStartup like the other two sources for consistent shape.
        const discovered = filterPrescriptionCareGate(discoveredProducts).map(p => ({ ...p, isStartup: false }));
        return [...products, ...releasedAsProducts, ...discovered];
    }, [discoveredProducts]);

    const availableMacroGroups = useMemo(
        () => MACRO_GROUPS.filter((group) => group.id === 'all' || combined.some((item) => itemMatchesMacroGroup(item, group.id))),
        [combined]
    );


    const availableSubcategories = useMemo(() => {
        const categories = new Set(
            combined
                .filter((item) => itemMatchesMacroGroup(item, macroGroup))
                .map((item) => item.category)
                .filter(Boolean)
        );
        return Array.from(categories).sort((a, b) => (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b));
    }, [combined, macroGroup]);

    const filtered = useMemo(() => {
        const applyFilters = (items, skipCategory = false) => items.filter((item) => {
            if (omittedProducts[item.id]) return false;
            if (personalizationFilter && recommendedSet.size > 0 && !recommendedSet.has(item.id)) return false;
            // Major Browse category chips. Match explicit categories first and
            // fall back to real catalog wording so newer Skin/Hair/etc. products
            // can participate without changing the data schema.
            if (!skipCategory && !itemMatchesMacroGroup(item, macroGroup)) return false;
            // Sub-category filter within the selected group
            if (!skipCategory && categoryFilter !== 'all' && item.category !== categoryFilter) return false;
            if (typeFilter !== 'all' && item.type !== typeFilter) return false;
            if (!skipCategory && categoryFilter === 'pad' && !padMatchesSubFilters(item, padFlowFilter, padPreferenceFilter, padUseCaseFilter)) return false;
            if (!skipCategory && categoryFilter === 'supplement' && symptomFilter !== 'all') {
                const ids = SYMPTOM_TO_SUPPLEMENTS[symptomFilter];
                if (ids && !ids.includes(item.id)) return false;
            }

            const numericPrice = getSortPrice(item);
            if (priceFilter === 'under-25' && !(numericPrice != null && numericPrice < 25)) return false;
            if (priceFilter === '25-50' && !(numericPrice != null && numericPrice >= 25 && numericPrice <= 50)) return false;
            if (priceFilter === '50-100' && !(numericPrice != null && numericPrice > 50 && numericPrice <= 100)) return false;
            if (priceFilter === '100-plus' && !(numericPrice != null && numericPrice > 100)) return false;

            if (ratingFilter === '4-plus') {
                const rating = item.ratingNote ? null : (getAynaRating(item, aynaReviews[item.id]) ?? (item.userRating != null ? Number(item.userRating) : null));
                if (!(Number.isFinite(rating) && rating >= 4)) return false;
            }

            const eligibility = getExplicitEligibility(item);
            if (eligibilityFilter === 'fsa' && !eligibility.fsa) return false;
            if (eligibilityFilter === 'hsa' && !eligibility.hsa) return false;
            if (eligibilityFilter === 'fsa-hsa' && !(eligibility.fsa || eligibility.hsa)) return false;

            if (aynaFilter === 'best-match' && !(getExplicitMatchPercent(item) != null || recommendedSet.has(item.id))) return false;
            if (aynaFilter === 'clinician' && !hasClinicianSupport(item)) return false;
            if (aynaFilter === 'community' && !hasCommunitySupport(item, aynaReviews[item.id])) return false;
            if (aynaFilter === 'ecosystem' && !myProducts?.[item.id]) return false;
            if (!matchesPreference(item, preferenceFilter)) return false;

            if (!matchesSustainability(item, sustainabilityFilter)) return false;
            if (!matchesLifeStage(item, lifeStageFilter)) return false;
            return true;
        });

        let list = applyFilters(combined);

        const qTrim = submittedQuery.trim();
        let scoreById = null;
        if (qTrim) {
            const scoreItem = (item) => ({
                item,
                matchScore: scoreQueryAgainstProduct(qTrim, buildSearchTextForItem(item, CATEGORY_LABELS), buildIdentityTextForItem(item, CATEGORY_LABELS)),
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
            const browsingWithoutTextQuery = !scoreById;
            list = [...list].sort((a, b) => {
                const m = matchTieBreak(a, b);
                if (m !== 0) return m;
                // When personalized results are on, preserve the real recommendation engine's
                // ranking instead of manufacturing a new match order in the UI.
                if (personalizationFilter && recommendedSet.size > 0) {
                    const ra = recommendedRank.has(a.id) ? recommendedRank.get(a.id) : Number.MAX_SAFE_INTEGER;
                    const rb = recommendedRank.has(b.id) ? recommendedRank.get(b.id) : Number.MAX_SAFE_INTEGER;
                    if (ra !== rb) return ra - rb;
                }
                // Brand partners are pinned to the top of the default browsing sort
                // (but not when personalized results are on — a partnership doesn't
                // buy placement in a real recommendation, only visibility on the
                // page you browse freely, per How We Make Money).
                if (browsingWithoutTextQuery && !personalizationFilter) {
                    const pa = isPartnerBrandItem(a) ? 1 : 0;
                    const pb = isPartnerBrandItem(b) ? 1 : 0;
                    if (pa !== pb) return pb - pa;
                }
                const baseA = getQualityScore(a, aynaReviews);
                const baseB = getQualityScore(b, aynaReviews);
                const qa = baseA + (browsingWithoutTextQuery ? shuffleJitter(a, shuffleSeed, baseA) : 0);
                const qb = baseB + (browsingWithoutTextQuery ? shuffleJitter(b, shuffleSeed, baseB) : 0);
                return qb - qa;
            });
            if (browsingWithoutTextQuery && !personalizationFilter) {
                list = applyColdStartFloor(list, PAGE_SIZE);
            }
        }
        return list;
    }, [combined, macroGroup, categoryFilter, typeFilter, omittedProducts, submittedQuery, sortBy, personalizationFilter, recommendedSet, recommendedRank, aynaReviews, padFlowFilter, padPreferenceFilter, padUseCaseFilter, symptomFilter, shuffleSeed, priceFilter, ratingFilter, eligibilityFilter, sustainabilityFilter, lifeStageFilter, aynaFilter, preferenceFilter, myProducts]);

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

    const qTrimForAi = submittedQuery.trim();

    const enrichedAiSuggestions = useMemo(
        () => (Array.isArray(aiSuggestions) ? aiSuggestions.map((p) => enrichLlmProductForDiscovery(p)) : []),
        [aiSuggestions]
    );

    // Stable key for the active browse/search scope — used to know when the browse-AI
    // accumulator below belongs to a *different* context (user picked a new macro
    // group/category/personalization, or typed a new search) and needs to reset rather
    // than keep accumulating onto a stale scope. Includes qTrimForAi so submitting a new
    // typed query resets the "Load more" round accumulator instead of continuing to
    // append results for whatever was previously searched.
    const browseAiContextKey = useMemo(
        () => `${macroGroup}|${categoryFilter}|${personalizationFilter ? '1' : '0'}|${qTrimForAi}`,
        [macroGroup, categoryFilter, personalizationFilter, qTrimForAi]
    );
    const browseAiContextKeyRef = useRef(browseAiContextKey);

    useEffect(() => {
        if (browseAiContextKeyRef.current === browseAiContextKey) return;
        browseAiContextKeyRef.current = browseAiContextKey;
        if (browseAiAbortRef.current) { browseAiAbortRef.current.abort(); browseAiAbortRef.current = null; }
        setBrowseAiSuggestions([]);
        setBrowseAiRounds(0);
        setBrowseAiLoading(false);
    }, [browseAiContextKey]);

    // Abort any in-flight browse-AI request on unmount.
    useEffect(() => () => { if (browseAiAbortRef.current) browseAiAbortRef.current.abort(); }, []);

    const enrichedBrowseAiSuggestions = useMemo(
        () => (Array.isArray(browseAiSuggestions) ? browseAiSuggestions.map((p) => enrichLlmProductForDiscovery(p)) : []),
        [browseAiSuggestions]
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
        // Round-accumulated AI suggestions (from "Load more" — browse-mode rounds when no
        // text query is active, or typed-search continuation rounds once the initial
        // one-shot search above has already run) are appended the same way, deduped
        // against the catalog AND anything already added above. browseAiContextKey (which
        // now includes qTrimForAi) already guarantees this accumulator gets reset to []
        // whenever the query/scope changes, so there's no risk of a stale query's rounds
        // leaking into a new one — no need to also gate this merge on !qTrimForAi.
        if (enrichedBrowseAiSuggestions.length > 0) {
            const outNames = new Set(out.map((p) => (p.name || '').trim().toLowerCase()).filter(Boolean));
            for (const p of enrichedBrowseAiSuggestions) {
                const n = (p.name || '').trim().toLowerCase();
                if (n && outNames.has(n)) continue;
                outNames.add(n);
                out.push(p);
            }
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
                score: scoreQueryAgainstProduct(qTrimForAi, buildSearchTextForItem(item, CATEGORY_LABELS), buildIdentityTextForItem(item, CATEGORY_LABELS)),
            }));
            scored.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));
            return scored.map((x) => x.item);
        }
        return out;
    }, [filtered, enrichedAiSuggestions, enrichedBrowseAiSuggestions, qTrimForAi]);

    useEffect(() => {
        // Only resolve images for what's actually rendered (visibleCount),
        // not a flat 80 — pagination already caps the DOM to what's visible,
        // so this now naturally scales with it instead of doing extra work
        // for cards the user hasn't scrolled/paged to yet.
        const visible = gridItems.slice(0, visibleCount);
        const missing = visible
            .filter((item) => item && item.id && item.name)
            .filter((item) => resolvedImages[item.id] === undefined)
            .filter((item) => isPlaceholderProductImage(item.image, item.type === 'digital'));
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
                const url = await resolveProductImage(item.name, item.brand || '', item.url || '', item.type || '');
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
        const { profileSummary, dislikedProducts, dislikedTerms } = buildAiProfileContext(personalizationFilter, quizResults);
        try {
            const { suggestions, querySummary, relatedSearches, error } = await fetchSearchSuggestions({
                query, category, symptom, signal: ac.signal,
                personalized: personalizationFilter,
                profileSummary,
                dislikedProducts,
                // Claude generates roughly linearly with requested count — each
                // suggestion carries a full schema (summary, tags, retailers,
                // search terms, safety note), so asking for 20 of them is what
                // made every search feel slow (multi-second generation before
                // anything new could render). Catalog matches (in `filtered`)
                // already render instantly regardless of this call, so cutting
                // the AI request down trades "more invented suggestions" for
                // "results show up fast" — the better trade for a live per-
                // keystroke search.
                maxResults: personalizationFilter ? 6 : 8,
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

    // AI-round extension used for BOTH "Load more" cases: (1) browse-mode, generating
    // more AI-suggested products for the currently-selected macro group / category with
    // no text query active, and (2) typed-search continuation, generating more results
    // for the query the user already submitted once results and gridItems.length there
    // (or an appended-since-visited "Load more") caught up with what runAiSearch's
    // initial one-shot fetch (round 0) returned. Both share the exact same
    // fetchSearchSuggestions utility, anti-fabrication API, round-batching, and dedup
    // logic — only the query text source differs (typed text verbatim vs. a synthesized
    // category-label phrase), which is why they were unified into one function instead of
    // typed search getting its own separate, weaker one-shot-only mechanism.
    const runBrowseAiRound = useCallback(async (contextKeyAtCallTime, roundIndexAtCallTime) => {
        // fetchSearchSuggestions session-caches by (query, category, symptom, maxResults) —
        // an identical query on a later round would just replay an earlier round's cached
        // response verbatim (every item then gets deduped away, silently wasting the round).
        // Confirmed live: with only a single "later round" variant text, rounds 3+ all sent
        // the exact same string as round 2 and fired back-to-back in under a second (cache
        // hits resolve near-instantly) instead of ever reaching the network for genuinely new
        // suggestions. See resolveBrowseAiRoundQuery for how each round gets a distinct
        // "batch N" cache-busting suffix, and how typed-search continuation rounds avoid
        // colliding with runAiSearch's own initial fetch.
        const resolved = resolveBrowseAiRoundQuery(qTrimForAi, categoryFilter, macroGroup, roundIndexAtCallTime);
        if (!resolved) return;
        const { queryText, isTypedSearchContinuation } = resolved;
        if (browseAiAbortRef.current) browseAiAbortRef.current.abort();
        const ac = new AbortController();
        browseAiAbortRef.current = ac;
        setBrowseAiLoading(true);
        const { profileSummary, dislikedProducts, dislikedTerms } = buildAiProfileContext(personalizationFilter, quizResults);
        try {
            const { suggestions } = await fetchSearchSuggestions({
                query: queryText,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
                symptom: isTypedSearchContinuation ? symptomFilter : undefined,
                signal: ac.signal,
                personalized: personalizationFilter,
                profileSummary,
                dislikedProducts,
                maxResults: personalizationFilter ? 6 : 8,
            });
            if (ac.signal.aborted) return;
            // The context may have changed (user switched category/group) while
            // this request was in flight — discard stale results instead of
            // leaking them into a different scope's accumulator. The reset
            // effect above already cleared browseAiSuggestions/Rounds for the
            // new context, so just bail here.
            if (browseAiContextKeyRef.current !== contextKeyAtCallTime) return;
            setBrowseAiLoading(false);
            let freshCount = 0;
            setBrowseAiSuggestions((prev) => {
                // Dedup against catalog matches, whatever's already accumulated
                // for this browse context, and the search-flow's AI suggestions —
                // mirrors the dedup gridItems already does above.
                const existingNames = new Set([
                    ...filtered.map((p) => (p.name || '').trim().toLowerCase()),
                    ...prev.map((p) => (p.name || '').trim().toLowerCase()),
                    ...enrichedAiSuggestions.map((p) => (p.name || '').trim().toLowerCase()),
                ].filter(Boolean));
                const fresh = (Array.isArray(suggestions) ? suggestions : []).filter((s) => {
                    const nameAndBrand = `${s.name || ''} ${s.brand || ''}`.toLowerCase();
                    if (dislikedTerms.some((term) => nameAndBrand.includes(term))) return false;
                    const n = (s.name || '').trim().toLowerCase();
                    if (n && existingNames.has(n)) return false;
                    if (n) existingNames.add(n);
                    return true;
                });
                freshCount = fresh.length;
                return [...prev, ...fresh];
            });
            // A round that adds nothing new (Claude repeated itself, or this
            // category is genuinely tapped out) is a real signal to stop
            // rather than burn through the remaining round budget on more
            // no-op calls — jump straight to the cap instead of r + 1.
            setBrowseAiRounds((r) => (freshCount > 0 ? r + 1 : MAX_BROWSE_AI_ROUNDS));
        } catch (e) {
            if (e?.name === 'AbortError') return;
            setBrowseAiLoading(false);
            // Count a failed round against the cap too, so a persistent server
            // error can't cause the trigger effect below to retry indefinitely —
            // the round budget is about bounding calls, not just successes.
            if (browseAiContextKeyRef.current === contextKeyAtCallTime) setBrowseAiRounds((r) => r + 1);
        }
    }, [categoryFilter, macroGroup, personalizationFilter, quizResults, filtered, enrichedAiSuggestions, qTrimForAi, symptomFilter]);

    // Fires the next AI round exactly when "Load more" would otherwise vanish with
    // nothing left to show, in either mode:
    //   - Browse mode (no typed query): a specific scope actually selected (never for the
    //     fully-unscoped "All" view — too unbounded for one LLM call).
    //   - Typed-search continuation: gated on the initial one-shot fetch (runAiSearch)
    //     having actually finished (searchSubmitted && !aiLoading) — otherwise this would
    //     double-fire a first AI round in parallel with runSearch's own initial call for
    //     the same query. A typed query is specific enough on its own that the "All"
    //     scope restriction below doesn't apply to it.
    // Both share: under the round cap, not already loading, and visibleCount has caught up
    // to everything currently available (catalog + AI so far).
    useEffect(() => {
        if (qTrimForAi) {
            if (!searchSubmitted || aiLoading) return;
        } else if (macroGroup === 'all' && categoryFilter === 'all') {
            return;
        }
        if (browseAiRounds >= MAX_BROWSE_AI_ROUNDS) return;
        if (browseAiLoading) return;
        if (gridItems.length > visibleCount) return;
        runBrowseAiRound(browseAiContextKey, browseAiRounds);
    }, [qTrimForAi, searchSubmitted, aiLoading, macroGroup, categoryFilter, browseAiRounds, browseAiLoading, gridItems.length, visibleCount, browseAiContextKey, runBrowseAiRound]);

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

    const clearBrowseFilters = () => {
        setMacroGroup('all');
        setCategoryFilter('all');
        setPriceFilter('all');
        setRatingFilter('all');
        setEligibilityFilter('all');
        setSustainabilityFilter('all');
        setLifeStageFilter('all');
        setAynaFilter('all');
        setPreferenceFilter('all');
        setPersonalizationFilter(false);
        setSortBy('default');
        setSearchQuery('');
        setSubmittedQuery('');
        setSearchSubmitted(false);
        setAiSuggestions([]);
        setAiRelatedSearches([]);
    };

    return (
        <section className="container animate-fade-in-up ayna-browse" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <div className="ayna-browse__heading">
                <div>
                    <p className="ayna-browse__eyebrow">{personalizationFilter && recommendedSet.size > 0 ? 'For you' : 'Browse'}</p>
                    <h2>Shop</h2>
                </div>
            </div>

            <form onSubmit={handleSmartSearch} className="ayna-browse__search">
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value.trim()) setSubmittedQuery(''); }}
                    placeholder="Search products"
                    aria-label="Search products"
                />
            </form>

            <div className="ayna-browse__categories" aria-label="Product categories">
                {availableMacroGroups.map((group) => (
                    <button
                        key={group.id}
                        type="button"
                        className={macroGroup === group.id ? 'is-active' : ''}
                        onClick={() => {
                            setMacroGroup(group.id);
                            setCategoryFilter('all');
                            setSubmittedQuery('');
                            setSearchQuery('');
                            setSearchSubmitted(false);
                            setAiSuggestions([]);
                            setAiRelatedSearches([]);
                        }}
                    >
                        {group.label}
                    </button>
                ))}
            </div>

            <div className="ayna-browse__toolbar">
                <div className="ayna-browse__toolbar-left">
                    <button type="button" className="ayna-browse__filter-button" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
                        Filters
                    </button>
                    <label className="ayna-browse__personalized-toggle">
                        <input
                            type="checkbox"
                            checked={personalizationFilter}
                            onChange={(e) => {
                                if (!user) {
                                    // Checkbox visually can't move without a real change event,
                                    // but there's nothing to personalize without an account —
                                    // send them to sign in/up instead of silently flipping state
                                    // that has no effect (or, worse, none they can see why).
                                    onRequirePersonalizeAuth?.();
                                    return;
                                }
                                setPersonalizationFilter(e.target.checked);
                            }}
                        />
                        <span>Personalized</span>
                    </label>
                </div>
                <label className="ayna-browse__sort">
                    <span>Sort</span>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.value === 'default' && recommendedSet.size === 0 ? 'Featured' : option.label}</option>)}
                    </select>
                </label>
            </div>

            {showFilters && (
                <div className="ayna-browse__filters">
                    <label>
                        <span>Product type</span>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                            <option value="all">All</option>
                            {availableSubcategories.map((category) => (
                                <option key={category} value={category}>{CATEGORY_LABELS[category] || category.replace(/-/g, ' ')}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>Price</span>
                        <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                            <option value="all">Any</option>
                            <option value="under-25">Under $25</option>
                            <option value="25-50">$25–$50</option>
                            <option value="50-100">$50–$100</option>
                            <option value="100-plus">$100+</option>
                        </select>
                    </label>
                    <label>
                        <span>Rating</span>
                        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                            <option value="all">Any</option>
                            <option value="4-plus">4+ stars</option>
                        </select>
                    </label>
                    <label>
                        <span>Ayna</span>
                        <select value={aynaFilter} onChange={(e) => setAynaFilter(e.target.value)}>
                            <option value="all">Any</option>
                            <option value="best-match">Best Match</option>
                            <option value="clinician">Clinician Backed</option>
                            <option value="community">Community Favorite</option>
                            <option value="ecosystem">In My Ecosystem</option>
                        </select>
                    </label>
                    <label>
                        <span>Preferences</span>
                        <select value={preferenceFilter} onChange={(e) => setPreferenceFilter(e.target.value)}>
                            <option value="all">Any</option>
                            <option value="fragrance-free">Fragrance Free</option>
                            <option value="sensitive-skin">Sensitive Skin</option>
                            <option value="vegan">Vegan</option>
                            <option value="cruelty-free">Cruelty Free</option>
                            <option value="organic">Organic</option>
                            <option value="clean-ingredients">Clean Ingredients</option>
                        </select>
                    </label>
                    <label>
                        <span>Eligibility</span>
                        <select value={eligibilityFilter} onChange={(e) => setEligibilityFilter(e.target.value)}>
                            <option value="all">Any</option>
                            <option value="fsa-hsa">FSA/HSA Eligible</option>
                            <option value="fsa">FSA Eligible</option>
                            <option value="hsa">HSA Eligible</option>
                        </select>
                    </label>
                    <label>
                        <span>Sustainability</span>
                        <select value={sustainabilityFilter} onChange={(e) => setSustainabilityFilter(e.target.value)}>
                            <option value="all">Any</option>
                            <option value="reusable">Reusable</option>
                            <option value="recyclable">Recyclable</option>
                            <option value="low-waste">Low Waste</option>
                            <option value="packaging">Sustainable Packaging</option>
                        </select>
                    </label>
                    <label>
                        <span>Life stage</span>
                        <select value={lifeStageFilter} onChange={(e) => setLifeStageFilter(e.target.value)}>
                            <option value="all">Any</option>
                            <option value="fertility">Fertility</option>
                            <option value="pregnancy">Pregnancy</option>
                            <option value="postpartum">Postpartum</option>
                            <option value="perimenopause">Perimenopause</option>
                            <option value="menopause">Menopause</option>
                        </select>
                    </label>
                    <button type="button" className="ayna-browse__clear" onClick={clearBrowseFilters}>Clear</button>
                </div>
            )}

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
            <div className="ayna-browse__grid">
                {gridItems.slice(0, visibleCount).map((item, idx) => {
                    // A defined (even empty-string) resolvedImages[item.id] came back
                    // from the server's type-aware /api/product-image resolution —
                    // trust it as-is below rather than re-running it through
                    // isPlaceholderProductImage, which doesn't know the product is
                    // 'digital' and would reject a legitimate app/telehealth logo.
                    // Only the unresolved (undefined) raw catalog fallback still needs
                    // that heuristic, since it was never server-vetted.
                    const resolvedItemImage = resolvedImages[item.id];
                    const cardImageSrc = resolvedItemImage !== undefined ? resolvedItemImage : item.image;
                    const imageStillLoading = resolvedItemImage === undefined && isPlaceholderProductImage(item.image, item.type === 'digital');
                    const tileLetter = (item.brand || item.name || '?').trim().charAt(0).toUpperCase();
                    const matchPercent = getExplicitMatchPercent(item);
                    const eligibility = getExplicitEligibility(item);
                    const eligibilityLabel = eligibility.fsa && eligibility.hsa ? 'FSA/HSA' : eligibility.fsa ? 'FSA' : eligibility.hsa ? 'HSA' : '';
                    const isWishlisted = !!savedProducts[item.id];
                    const isInEcosystem = !!myProducts[item.id];
                    const categoryLabel = CATEGORY_LABELS[item.category] || (item.category ? item.category.replace(/-/g, ' ') : 'Product');

                    return (
                        <article
                            key={item.id}
                            className="ayna-discover-card ayna-browse-card"
                            style={{ animation: `fadeInUp 0.4s ${Math.min(idx * 0.04, 0.24)}s backwards` }}
                        >
                            <a
                                className="ayna-browse-card__link"
                                href={productHref(item.id)}
                                onClick={(e) => {
                                    if (!isPlainLeftClick(e)) return;
                                    e.preventDefault();
                                    onOpenProduct?.(item);
                                }}
                            >
                                <div className="ayna-discover-card__tile">
                                    {cardImageSrc && (resolvedItemImage !== undefined || !isPlaceholderProductImage(cardImageSrc, item.type === 'digital')) ? (
                                        <>
                                            <img
                                                src={cardImageSrc}
                                                alt={item.name}
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.nextElementSibling;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                            <span className="ayna-discover-card__letter" style={{ display: 'none' }}>{tileLetter}</span>
                                        </>
                                    ) : imageStillLoading ? (
                                        <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
                                    ) : (
                                        <span className="ayna-discover-card__letter">{tileLetter}</span>
                                    )}
                                    {matchPercent != null && <span className="ayna-browse-card__match">{matchPercent}% Match</span>}
                                    {isInEcosystem && <span className="ayna-browse-card__ecosystem">In ecosystem</span>}
                                </div>
                                <div className="ayna-discover-card__body">
                                    <div className="ayna-browse-card__labels">
                                        <span className="ayna-discover-card__category">{categoryLabel}</span>
                                        {isSponsoredItem(item) && <span className="ayna-browse-card__sponsored">Sponsored</span>}
                                        {eligibilityLabel && <span className="ayna-browse-card__eligibility">{eligibilityLabel}</span>}
                                    </div>
                                    <h3 className="ayna-discover-card__name">{item.name}</h3>
                                    <span className="ayna-discover-card__price">{item.price || item.stage || ''}</span>
                                </div>
                            </a>
                            <button
                                type="button"
                                className={`ayna-browse-card__wishlist ${isWishlisted ? 'is-saved' : ''}`}
                                aria-label={isWishlisted ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
                                aria-pressed={isWishlisted}
                                onClick={() => onToggleSaved?.(item)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
                            </button>
                        </article>
                    );
                })}
            </div>
            {gridItems.length === 0 && (
                <div className="ayna-browse__empty">
                    <p>No matches.</p>
                    <button type="button" onClick={clearBrowseFilters}>Clear filters</button>
                </div>
            )}
            {gridItems.length > visibleCount ? (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        style={{ padding: '0.7rem 1.75rem' }}
                    >
                        Load more
                    </button>
                </div>
            ) : browseAiLoading ? (
                // A browse-AI round is fetching more results for this scope in the
                // background — show a disabled, clearly-labeled state instead of
                // "Load more" just disappearing (which would look broken) or being
                // clickable and double-firing a request.
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        type="button"
                        className="btn btn-outline"
                        disabled
                        style={{ padding: '0.7rem 1.75rem', opacity: 0.7, cursor: 'default' }}
                    >
                        Finding more…
                    </button>
                </div>
            ) : null}
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
                                <div style={{ height: '120px', width: '100%', overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg, #F3EADC, #EFE3D2)' }}>
                                    {safeProductImageSrc(product.image) ? (
                                        <img src={safeProductImageSrc(product.image)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px', boxSizing: 'border-box' }} onError={(e) => handleImageErrorWithRetry(e, () => { e.currentTarget.style.display = 'none'; })} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-secondary-fade), #f3e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>NIH</div>
                                    )}
                                    <span style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-pill)', fontSize: '0.68rem', fontWeight: '700' }}>
                                        NIH verified
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
                                            {myProducts?.[product.id] ? 'Added' : 'Add'}
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
            <Disclaimer compact style={{ marginTop: '2rem', textAlign: 'center' }} />
        </section>
    );
}


