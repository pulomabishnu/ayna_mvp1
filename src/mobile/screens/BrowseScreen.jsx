import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import ShopGroups from '../../components/shop/ShopGroups.jsx';
import { SHOP_GROUPS } from '../../data/catalogTaxonomy.js';
import { hasClinicalSources, CLINICAL_SOURCES_LABEL } from '../../utils/clinicalSources.js';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import DiscoverDeck from '../components/DiscoverDeck.jsx';
import CategoryNav from '../components/CategoryNav.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { featuredOrder as orderFeatured } from '../../data/packshots.js';
import AvoidChips from '../../components/explore/AvoidChips.jsx';
import useCardViews from '../../components/explore/useCardViews.js';
import { trackCardClicked, eventSurface } from '../../utils/analyticsEvents.js';
import { passesAvoid, herAvoidAttrs } from '../../components/explore/avoid.js';
import LibraryCard from '../components/LibraryCard.jsx';
import SuggestBox from '../../components/SuggestBox.jsx';
import { sentenceCase } from '../../utils/sentenceCase.js';
import { getPersonalizedProductIds, getProfileMatchPercentForProduct, getProductMatchDetailsForProduct, productSearchText, MACRO_GROUPS, itemMatchesMacroGroup, CATEGORY_LABELS, isTeenProduct } from '../../data/products.js';
import { getVerificationLinks } from '../../utils/verificationLinks.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import { scoreSearchMatch, correctedSearchQuery, searchArticles, analyzeSearch } from '../../utils/search/index.js';
import SearchAssist from '../../components/search/SearchAssist.jsx';
import { fetchSearchSuggestions } from '../../utils/fetchSearchSuggestions.js';
import { trackApp } from '../utils/appAnalytics.js';
import { featuredShopOrder, rankShopForProfile } from '../utils/shopOrder.js';
import { hasQuizAnswers } from '../utils/personalReads.js';
import { sortByBestMatch, bestMatchNeedsQuiz, shownMatchPercent } from '../../utils/bestMatchSort.js';
import { CompareToggle } from '../../components/compare/CompareControls.jsx';
import { useSheetDrag } from '../hooks/useSheetDrag.js';
import usePersistentState from '../../hooks/usePersistentState.js';
import { NeedStickers } from '../../components/shop/ShopBits.jsx';
import { FAMILIAR_PHRASES } from '../../components/shop/shopNeeds.js';
import { Ribbon } from '../../components/personality/Bits.jsx';


const FILTER_FIELDS = [
  ['category', 'Product type', [['all', 'All products']]],
  ['price', 'Price', [['all', 'Any price'], ['under-25', 'Under $25'], ['25-50', '$25–$50'], ['50-100', '$50–$100'], ['100-plus', '$100+']]],
  ['rating', 'Rating', [['all', 'Any rating'], ['4-plus', '4+ stars']]],
  ['ayna', 'Match & sources', [['all', 'Any'], ['best-match', 'Best match'], ['clinician', CLINICAL_SOURCES_LABEL], ['community', 'Community favorite'], ['ecosystem', 'In my routine']]],
  ['preference', 'Preferences', [['all', 'Any'], ['fragrance-free', 'Fragrance free'], ['sensitive-skin', 'Sensitive skin'], ['vegan', 'Vegan'], ['cruelty-free', 'Cruelty free'], ['organic', 'Organic'], ['clean-ingredients', 'Clean ingredients']]],
  ['eligibility', 'Eligibility', [['all', 'Any'], ['fsa-hsa', 'FSA/HSA eligible'], ['fsa', 'FSA eligible'], ['hsa', 'HSA eligible']]],
  ['sustainability', 'Sustainability', [['all', 'Any'], ['reusable', 'Reusable'], ['recyclable', 'Recyclable'], ['low-waste', 'Low waste'], ['packaging', 'Sustainable packaging']]],
  ['lifeStage', 'Life stage', [['all', 'Any'], ['fertility', 'Fertility'], ['pregnancy', 'Pregnancy'], ['postpartum', 'Postpartum'], ['perimenopause', 'Perimenopause'], ['menopause', 'Menopause']]],
];
const SORT_LABELS = { best: 'Best match', rating: 'Highest rated', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low' };
const EMPTY_FILTERS = Object.fromEntries(FILTER_FIELDS.map(([key]) => [key, 'all']));
const PRICE_VALUE = (item) => {
  const raw = String(item.price || item.priceDisplay || '');
  const amount = raw.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  return amount ? Number(amount[1].replaceAll(',', '')) : /^free\b/i.test(raw) ? 0 : null;
};
const RATING_VALUE = (item) => item.ratingNote ? null : Number.isFinite(Number(item.userRating)) ? Number(item.userRating) : null;
const ELIGIBILITY = (item) => {
  const menstrual = ['pad', 'tampon', 'cup', 'disc'].includes(item.category);
  const both = menstrual || item.fsaHsaEligible === true || item.fsa_hsa_eligible === true;
  return { fsa: both || item.fsaEligible === true || item.fsa_eligible === true, hsa: both || item.hsaEligible === true || item.hsa_eligible === true };
};
const PREFERENCE_TERMS = { 'fragrance-free': ['fragrance free', 'fragrance-free'], 'sensitive-skin': ['sensitive skin'], vegan: ['vegan'], 'cruelty-free': ['cruelty free', 'cruelty-free'], organic: ['organic'], 'clean-ingredients': ['clean ingredients'] };
const SUSTAINABILITY_TERMS = { reusable: ['reusable', 'reuse'], recyclable: ['recyclable', 'recycled'], 'low-waste': ['low waste', 'zero waste', 'low-waste'], packaging: ['sustainable packaging', 'plastic-free packaging', 'compostable packaging'] };

const PAGE_SIZE = 20;

function PersonalizedToggle({ on, disabled, onClick }) {
  return (
    <button type="button" className="ay-for-me" role="switch" aria-checked={on} aria-label="Show my matches only" disabled={disabled} onClick={onClick}>
      <span>My matches only</span>
      <i aria-hidden="true"><b /></i>
    </button>
  );
}


function SkeletonCard() {
  // One shared skeleton timing (.ay-skel in styles/delight.css, synced by utils/delightRuntime.js).
  return (
    <div className="ay-skel-card" aria-hidden="true">
      <div className="ay-skel" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 13 }} />
      <div className="ay-skel" style={{ height: 12, width: '70%', borderRadius: 4, marginTop: 9 }} />
      <div className="ay-skel" style={{ height: 10, width: '40%', borderRadius: 4, marginTop: 6 }} />
    </div>
  );
}

// AI-search loading state: a coarse checkerboard "pixel" pattern that
// materializes in via steps() (a chunky, non-smooth animation) rather than
// the plain fade SkeletonCard uses above, this is a live network+LLM call
// (real latency, not instant like the local catalog filter), so it reads as
// a distinct, more eventful kind of waiting.
function PixelateCard() {
  const pixelStyle = {
    background: 'repeating-conic-gradient(var(--ayna-chip-bg) 0% 25%, var(--ayna-border) 0% 50%) 50% / 12px 12px',
    animation: 'ay-pixelate 900ms steps(5, end) infinite alternate',
  };
  return (
    <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 18, padding: 10 }}>
      <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 13, ...pixelStyle }} />
      <div style={{ height: 12, width: '70%', borderRadius: 4, marginTop: 9, ...pixelStyle }} />
      <div style={{ height: 10, width: '40%', borderRadius: 4, marginTop: 6, ...pixelStyle }} />
    </div>
  );
}

function PixelateGrid({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11, padding: '0 20px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <PixelateCard key={i} />
      ))}
    </div>
  );
}

// Owns its own pagination state, remounted via `key` (from the parent)
// whenever the active filters change, that gives it a fresh initial
// visibleCount naturally, instead of needing a manual reset that either
// calls setState in an effect body or reads/writes a ref during render
// (both flagged by this project's react-hooks lint rules).
function ProductGrid({ products, onOpenProduct, layout = 'grid', quizAnswers = null, onOpenWhyMatch, onStartQuiz, showOnboarding = false, savedProducts = {}, onToggleSaved, matchOpts, onPickPhrase = null, afterFirstRow = null }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  // Card CTR (all-pages brief v3): views of the cards on screen, and taps below.
  const gridRef = useRef(null);
  useCardViews(gridRef, 'app_products', [products.length, visibleCount, products[0]?.id]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < products.length && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((v) => Math.min(v + PAGE_SIZE, products.length));
            setLoadingMore(false);
          }, 350);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [products.length, visibleCount, loadingMore]);

  const visibleProducts = products.slice(0, visibleCount);
  const isList = layout === 'list';

  return (
    <>
      <div
        ref={gridRef}
        className={`ayna-editorial-product-grid${isList ? ' is-list-layout' : ''}`}
        style={
          isList
            ? { display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }
            : { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11, padding: '0 20px' }
        }
      >
        {visibleProducts.map((p, index) => (
          <Fragment key={p.id}>
            <ProductCard product={p} variant={layout} onClick={() => { trackCardClicked({ surface: eventSurface(), where: 'app_products', product_id: p.id, position: index }); if (onOpenProduct) onOpenProduct(p); }} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} onSeeMatch={quizAnswers ? null : onStartQuiz} isSaved={!!savedProducts[p.id]} onToggleSaved={onToggleSaved} matchOpts={matchOpts} />
            {showOnboarding && index === Math.min(3, visibleProducts.length - 1) && <section className="ayna-figma-discover-cta"><button type="button" onClick={onStartQuiz}>Get matched <span aria-hidden="true">→</span></button></section>}
            {afterFirstRow && index === Math.min(isList ? 0 : 1, visibleProducts.length - 1) && <div className="ay-grid-note" style={{ gridColumn: '1 / -1' }}>{afterFirstRow}</div>}
            {onPickPhrase && index === 7 && <div className="ay-app-ribbon"><Ribbon items={FAMILIAR_PHRASES} label="Searches people make" onPick={onPickPhrase} tab={<span className="ay-ribbon__tab is-label">Does this sound familiar?</span>} className="ay-ribbon--pink" /></div>}
          </Fragment>
        ))}
        {loadingMore && !isList && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
      </div>
      {visibleCount < products.length && <div ref={sentinelRef} style={{ height: 1 }} />}
    </>
  );
}

// products.js/ALL_PRODUCTS is a static array bundled into the app, not a
// paginated network endpoint, this app has no live backend for the
// catalog. "Infinite scroll" is therefore client-side batching over that
// same real array (same fields/images), revealed progressively as the user
// scrolls, rather than network-fetched pages.
export default function BrowseScreen({
  products = [],
  articles = [],
  savedProducts = {},
  onToggleSaved,
  ctaVariant = 'gradient',
  headerInitial = 'A',
  onOpenProduct,
  onOpenArticle,
  onOpenSaved,
  onGoEco,
  onGoCommunity,
  onStartQuiz,
  hasEcosystem = false,
  myProducts = [],
  // "Not for me" ids and the memoized engine behavior object (MobileApp).
  omittedProducts = {},
  matchOpts,
  quizAnswers = null,
  theme = 'dark',
  onToggleTheme,
  onOpenProfile,
  onOpenWhyMatch,
  // Controlled from MobileApp.jsx (and persisted there) so the toggle
  // survives this screen unmounting when the user navigates away (e.g. to
  // My ecosystem) and back, it should stay on until the user explicitly
  // turns it off, not reset just because they left the tab.
  personalized: personalizedProp,
  onPersonalizedChange,
  onGoLibrary,
  // Search to open with (an ecosystem shelf's "Shop" link for one need).
  initialSearch = '',
  // Mounted inside Explore (Products): Explore owns the header and the page title.
  embedded = false,
  // Inside Explore: the page title for the pink header band ("Shop", "Services"), with the search in the band.
  bandTitle = '',
  // Explore's Products or Services toggle, shown on the same row as the need chips.
  typeToggle = null,
}) {
  const mode = 'products'; // Reads moved to the Library tab
  const [searchValue, setSearchValue] = useState(initialSearch || '');
  // Falls back to local state only if no controlled value is passed in
  // (keeps this component usable/testable standalone).
  const [personalizedLocal, setPersonalizedLocal] = useState(false);
  const personalized = personalizedProp ?? personalizedLocal;
  const setPersonalized = (updater) => {
    const next = typeof updater === 'function' ? updater(personalized) : updater;
    if (onPersonalizedChange) onPersonalizedChange(next);
    else setPersonalizedLocal(next);
  };
  // Area, filters and sort survive a refresh (usePersistentState, localStorage).
  const [activeGroup, setActiveGroup] = usePersistentState('app-shop:area', 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeck, setShowDeck] = useState(false);
  const filterButtonRef = useRef(null);
  const filterCloseRef = useRef(null);
  const filterSheetRef = useRef(null);
  const { grabberProps: filterGrabber } = useSheetDrag(() => setShowFilters(false), filterSheetRef);
  useEffect(() => {
    if (!showFilters) return undefined;
    filterCloseRef.current?.focus();
    const handleFilterKeys = (event) => {
      if (event.key === 'Escape') {
        setShowFilters(false);
        filterButtonRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(filterSheetRef.current?.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled)') || [])];
      if (focusable.length < 2) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
      if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    };
    window.addEventListener('keydown', handleFilterKeys);
    return () => window.removeEventListener('keydown', handleFilterKeys);
  }, [showFilters]);
  const [storedFilters, setFilters] = usePersistentState('app-shop:filters', EMPTY_FILTERS);
  const filters = { ...EMPTY_FILTERS, ...(storedFilters || {}) };
  const [sortBy, setSortBy] = usePersistentState('app-shop:sort', 'default');
  // "Leave out" chips (Explore audit v3, #17), same as the website: only products labeled free of each one.
  const [avoidAttrs, setAvoidAttrs] = useState([]);
  const myAvoid = useMemo(() => herAvoidAttrs(quizAnswers), [quizAnswers]);
  const quick = [['Under $25', 'price', 'under-25'], ['FSA/HSA eligible', 'eligibility', 'fsa-hsa'], ['Fragrance free', 'preference', 'fragrance-free'], [CLINICAL_SOURCES_LABEL, 'ayna', 'clinician']];
  const cardLayout = 'grid';
  // AI fallback for a typed search the local catalog scoring found nothing
  // for, same /api/search-suggestions the desktop Discovery page falls
  // back to (see fetchSearchSuggestions.js), not a separate mechanism.
  const [aiState, setAiState] = useState({ query: '', loading: false, suggestions: [], error: null });

  // Default order (shopOrder.js): the Featured order, fixed across loads;
  // with quiz answers, ranked by the matching
  // engine so what fits her age, life stage and budget comes first.
  // With a profile the default order is always hers (UX 12): the switch only
  // narrows the set. Partner placement never reorders it (see below).
  const rankByProfile = hasQuizAnswers(quizAnswers);
  // QA3 M8: one fixed order on every load, the website's Featured order
  // (packshots she can buy now first, pre-orders last); no session shuffle.
  const shuffled = useMemo(() => {
    const base = featuredShopOrder(products);
    return rankByProfile ? rankShopForProfile(base, quizAnswers, matchOpts) : base;
  }, [products, rankByProfile, quizAnswers, matchOpts]);

  // frustrations is the legacy desktop quiz shape; the real current mobile
  // intake (IntakeScreen.jsx) never sets it at all, it produces
  // fullHealthIntake.supportSelections/primaryConcerns instead, so relying
  // on frustrations alone meant "For You" personalization was permanently
  // disabled for every real mobile user who'd actually completed the quiz.
  const hasProfile = !!(
    quizAnswers?.frustrations?.length
    || quizAnswers?.fullHealthIntake?.supportSelections?.length
    || quizAnswers?.fullHealthIntake?.primaryConcerns?.length
  );

  // Real filtering, reuses the site's own scoreQueryAgainstProduct/
  // buildSearchTextForItem/buildIdentityTextForItem (naturalLanguageSearch.js)
  // and getPersonalizedProductIds/itemMatchesMacroGroup (products.js), the
  // exact same search-scoring and personalization/category-matching
  // functions the desktop Discovery page already uses, not a separate,
  // weaker matching system. This is why terms like "PCOS" or "hair
  // thinning" now work here too: scoreQueryAgainstProduct already knows the
  // real term aliases (e.g. pcos -> polycystic/ovarian) and scores natural-
  // language queries, unlike a plain substring check.
  const searchTermRaw = searchValue.trim();
  const searchTerm = searchTermRaw.toLowerCase();
  const visible = shuffled.filter((p) => !omittedProducts[p.id]);
  let filtered = visible;
  if (searchTermRaw) {
    filtered = visible
      .map((p) => ({
        item: p,
        matchScore: scoreSearchMatch(searchTermRaw, p),
      }))
      .filter((x) => x.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((x) => x.item);
  }
  // Captured before the personalized/category filters narrow `filtered`
  // further, the AI fallback below should trigger on "the typed search
  // itself found nothing in the catalog", not "this narrower filtered view
  // happens to be empty because of an unrelated active filter".
  const searchScored = filtered;
  // PostHog: one search_performed once she stops typing (same event as the
  // website; the query text itself is never sent, only its length).
  const searchResultCount = searchScored.length;
  useEffect(() => {
    if (searchTermRaw.length < 2) return undefined;
    const t = setTimeout(() => trackApp('search_performed', { queryLength: searchTermRaw.length, category: activeGroup, resultCount: searchResultCount }), 1200);
    return () => clearTimeout(t);
    // resultCount is read at fire time; re-running on it would double-count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTermRaw, activeGroup]);
  // "My matches only" narrows browsing to her matches. A typed search must
  // still find every catalog product (focus group: Resa Rhythm Bracelet was
  // hidden, so she assumed it did not exist), so non-matches that fit the
  // search are kept aside and shown below as a labelled "More results" group.
  const narrowToMatches = personalized && hasProfile;
  const personalizedIds = narrowToMatches ? new Set(getPersonalizedProductIds(quizAnswers, null, matchOpts)) : null;
  if (activeGroup !== 'all') {
    filtered = filtered.filter((p) => itemMatchesMacroGroup(p, activeGroup));
  }
  if (avoidAttrs.length) filtered = filtered.filter((p) => passesAvoid(p, avoidAttrs));
  filtered = filtered.filter((item) => {
    // ayna is 18+: products made for teens are not listed (same rule as the website's Shop, so both count the same).
    if (isTeenProduct(item)) return false;
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    const price = PRICE_VALUE(item);
    if (filters.price === 'under-25' && !(price != null && price < 25)) return false;
    if (filters.price === '25-50' && !(price != null && price >= 25 && price <= 50)) return false;
    if (filters.price === '50-100' && !(price != null && price > 50 && price <= 100)) return false;
    if (filters.price === '100-plus' && !(price != null && price > 100)) return false;
    if (filters.rating === '4-plus' && !(RATING_VALUE(item) >= 4)) return false;
    if (filters.ayna === 'best-match' && !(getProfileMatchPercentForProduct(item, quizAnswers, null, matchOpts) >= 50)) return false;
    if (filters.ayna === 'clinician' && !hasClinicalSources(item)) return false;
    if (filters.ayna === 'community' && !(item.communityReview || getVerificationLinks(item, 'community').length || RATING_VALUE(item) >= 4)) return false;
    if (filters.ayna === 'ecosystem' && !myProducts.some((p) => String(p.id) === String(item.id))) return false;
    const eligibility = ELIGIBILITY(item);
    if (filters.eligibility === 'fsa' && !eligibility.fsa) return false;
    if (filters.eligibility === 'hsa' && !eligibility.hsa) return false;
    if (filters.eligibility === 'fsa-hsa' && !(eligibility.fsa || eligibility.hsa)) return false;
    const text = productSearchText(item);
    if (filters.preference !== 'all' && !(PREFERENCE_TERMS[filters.preference] || []).some((term) => text.includes(term))) return false;
    if (filters.sustainability !== 'all' && !(SUSTAINABILITY_TERMS[filters.sustainability] || []).some((term) => text.includes(term))) return false;
    if (filters.lifeStage !== 'all' && !itemMatchesMacroGroup(item, filters.lifeStage === 'perimenopause' ? 'menopause' : filters.lifeStage)) return false;
    return true;
  });
  if (sortBy === 'price-asc' || sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => {
    const pa = PRICE_VALUE(a); const pb = PRICE_VALUE(b);
    if (pa == null) return pb == null ? 0 : 1;
    if (pb == null) return -1;
    return sortBy === 'price-asc' ? pa - pb : pb - pa;
  });
  if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => (RATING_VALUE(b) ?? -1) - (RATING_VALUE(a) ?? -1));
  // Best match: the match % on her cards, highest first. Signed out or no
  // quiz yet, it keeps the Featured order and the quiz note shows instead.
  const canSortByMatch = hasProfile;
  const bestNeedsQuiz = bestMatchNeedsQuiz(sortBy, canSortByMatch);
  const featuredOrder = sortBy === 'default' || bestNeedsQuiz;
  if (sortBy === 'best' && canSortByMatch) {
    filtered = sortByBestMatch(filtered, (product) => shownMatchPercent(getProductMatchDetailsForProduct(product, quizAnswers, null, matchOpts)));
  }
  if (sortBy === 'default' && personalized && hasProfile && !searchTermRaw) {
    const matchScores = new Map(filtered.map((product) => [
      product.id,
      shownMatchPercent(getProductMatchDetailsForProduct(product, quizAnswers, null, matchOpts)),
    ]));
    filtered = [...filtered].sort((a, b) =>
      matchScores.get(b.id) - matchScores.get(a.id));
  }
  // Brand partners pinned to the top of the default browsing sort, same
  // rule as desktop Discovery.jsx: a partnership buys visibility on the
  // page you browse freely, never placement inside an actual text search
  // or a personalized order (For You, or the default order once she has
  // quiz answers).
  if (featuredOrder && !searchTermRaw && !(personalized && hasProfile) && !rankByProfile) {
    filtered = [...filtered].sort((a, b) => (isPartnerBrandItem(b) ? 1 : 0) - (isPartnerBrandItem(a) ? 1 : 0));
    // Packshots she can buy now first, pre-orders last (Explore audit issue 6), same as the website.
    filtered = orderFeatured(filtered);
  }
  let moreResults = [];
  if (narrowToMatches) {
    if (searchTermRaw) moreResults = filtered.filter((p) => !personalizedIds.has(p.id));
    filtered = filtered.filter((p) => personalizedIds.has(p.id));
  }
  const shownTotal = filtered.length + moreResults.length;
  // Best match is always listed: first once she has a profile, last before.
  const sortChoices = canSortByMatch
    ? [['best', 'Best match'], ['default', 'Featured'], ['rating', 'Highest rated'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low']]
    : [['default', 'Featured'], ['rating', 'Highest rated'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['best', 'Best match']];
  const bestQuizNote = (
    <p className="ay-shop-sortnote" role="status">
      Take the 6-question quiz to sort by match.{' '}
      <button type="button" onClick={() => { setShowFilters(false); onStartQuiz?.(); }}>Take the quiz</button>
    </p>
  );
  const filterKey = `${searchTerm}|${personalized}|${activeGroup}|${JSON.stringify(filters)}|${sortBy}`;

  useEffect(() => {
    // Nothing to fetch, and nothing to reset either: the render logic below
    // already gates on `aiState.query === searchTermRaw`, so a stale
    // aiState from a previous search can never render once searchTermRaw
    // has changed. Resetting it here would be a synchronous setState call
    // in the effect body, which this project'''s lint rules disallow.
    if (searchTermRaw.length < 2 || searchScored.length > 0) return undefined;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setAiState({ query: searchTermRaw, loading: true, suggestions: [], error: null });
      fetchSearchSuggestions({
        source: 'app_browse',
        query: correctedSearchQuery(searchTermRaw),
        category: activeGroup !== 'all' ? activeGroup : '',
        maxResults: 20,
        signal: controller.signal,
      })
        .then(({ suggestions, error }) => {
          if (cancelled) return;
          setAiState({ query: searchTermRaw, loading: false, suggestions: suggestions || [], error: error || null });
        })
        .catch((e) => {
          if (cancelled || e?.name === 'AbortError') return;
          setAiState({ query: searchTermRaw, loading: false, suggestions: [], error: 'Couldn’t load suggestions. Check your connection, or search by product or brand name.' });
        });
    }, 600);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchTermRaw, searchScored.length, activeGroup]);

  // Applied filters, shown as removable chips under the toolbar.
  const activeFilters = FILTER_FIELDS.filter(([key]) => filters[key] !== 'all').map(([key, , options]) => [key, (options.find(([value]) => value === filters[key]) || [])[1] || CATEGORY_LABELS[filters[key]] || String(filters[key]).replaceAll('-', ' ')]);
  // The commission note left the shop list (founder, Oct 27): it stays beside every Buy button and in the footer.
  const activeFilterCount = activeFilters.length + (embedded && activeGroup !== 'all' ? 1 : 0) + (embedded ? avoidAttrs.length : 0);
  const areaLabel = (id) => sentenceCase((SHOP_GROUPS.find((g) => g.id === id) || MACRO_GROUPS.find((g) => g.id === id))?.label || String(id).replaceAll('-', ' '));
  const matchingReads = searchTermRaw.length >= 2 ? searchArticles(searchTermRaw, articles) : [];
  // SearchAssist above already says "No results for 'xyz'" in this case;
  // the grid's own empty line would say it a second time.
  const searchAnalysis = searchTermRaw.length >= 2 ? analyzeSearch(searchTermRaw) : null;
  const assistSaysNoResults = Boolean(searchAnalysis?.unknown?.length && !searchAnalysis.didYouMean && searchScored.length === 0);


  return (
    <div className="ayna-fresh-browse-screen ayna-figma-discover">
      {!embedded && <MobileHeader
        variant={theme}
        activeTab="browse"
        initial={headerInitial}
        onOpenSaved={onOpenSaved}
        onGoEco={onGoEco}
        onGoCommunity={onGoCommunity}
        onToggleTheme={onToggleTheme}
        onOpenProfile={onOpenProfile}
        title="Products"
        titleFor="ay-shop-title"
      />}

      {/* Inside Explore (team direction 17): one browsing hierarchy. Search, the
          Explore text tabs above, then one toolbar (Filters, Compare, Swipe).
          Areas, quick filters and sort all live in the Filters sheet; the
          "Searches people make" phrases moved to the Categories tab. */}
      {/* Inside Explore (founder, Oct 27: "fix the app header"): ONE compact pink band with a wavy
          edge holding the page title and the search, the family of the website Shop header. */}
      <div className={`ayna-fresh-browse-heading ayna-shop-heading${embedded ? ' is-embedded' : ''}${embedded && bandTitle ? ' ax-band' : ''}`}>
        <div className="ay-shop-titlebar">{embedded ? (bandTitle ? <h1 id="ay-shop-title" className="ax-band__title">{bandTitle}</h1> : <h2 id="ay-shop-title" className="sr-only">Products</h2>) : <h1 id="ay-shop-title">Products</h1>}{!embedded && hasProfile && <PersonalizedToggle on={personalized} disabled={!hasProfile} onClick={() => setPersonalized((v) => !v)} />}</div>
        {!embedded && <NeedStickers className="ay-app-needs" active={searchValue} onPick={(q) => setSearchValue(q)} />}
        <SearchBar placeholder={bandTitle === 'Services' ? 'Search services' : 'Search products or brands'} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }} onPick={(s) => setSearchValue(s.query)} />
        {!embedded && <div className="ay-app-quick" role="group" aria-label="Quick filters">
          {quick.map(([label, key, value]) => <button key={key} type="button" className="ayna-shop-category" aria-pressed={filters[key] === value} onClick={() => setFilters((cur) => ({ ...EMPTY_FILTERS, ...(cur || {}), [key]: (cur || {})[key] === value ? 'all' : value }))}>{label}</button>)}
        </div>}
      </div>
      {searchTermRaw.length >= 2 && <SearchAssist variant="app" query={searchTermRaw} resultCount={searchScored.length} onUse={setSearchValue} />}

      {mode === 'products' && (() => { const toolbar = <>
          {/* Five shopping groups, the areas one tap deeper (team meeting, Oct 26). */}
          {/* Founder Oct 26 18:46: one tidy shop header in the app. Row 1: the five groups in ONE
              sideways-scrolling line. Row 2: Products/Services + Filters. Row 3: My matches, Compare,
              Swipe as small pills on one line. */}
          {embedded && <div className="ayshop__chips" data-tour="explore-sections">
            <ShopGroups active={activeGroup} onPick={setActiveGroup} subs={false} label="Filter by need" className="ay-shop-groups" />
          </div>}
          {/* Founder Oct 26 19:50: "don't just stack stuff". Filters, Compare and Swipe share one sideways row. */}
          {embedded && <div className="ay-shop-extras ay-shop-tools">
            {typeToggle}
            <button ref={filterButtonRef} className="ayna-shop-filter-toggle" type="button" aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2.5" fill="var(--ayna-bg)" /><circle cx="15" cy="17" r="2.5" fill="var(--ayna-bg)" /></svg>
              Filters
              {activeFilterCount > 0 && <span aria-label={`${activeFilterCount} on`}>{activeFilterCount}</span>}
            </button>
            {hasProfile && <PersonalizedToggle on={personalized} disabled={!hasProfile} onClick={() => setPersonalized((v) => !v)} />}
            <CompareToggle className="ay-shop-compare" />
            {!searchValue.trim() && <button type="button" className="ay-discover-cta" aria-label="Swipe through products: right to save, left to skip" onClick={() => setShowDeck(true)}>
              <svg className="ay-discover-fan" viewBox="0 0 56 44" aria-hidden="true">
                <rect className="c1" x="6" y="6" width="22" height="30" rx="5" transform="rotate(-12 17 21)" />
                <rect className="c2" x="17" y="5" width="22" height="30" rx="5" />
                <rect className="c3" x="28" y="6" width="22" height="30" rx="5" transform="rotate(12 39 21)" />
              </svg>
              <span className="ay-discover-copy"><strong>Swipe</strong></span>
            </button>}
          </div>}
          {!embedded && <div className="ay-shop-toolbar">
            <button ref={filterButtonRef} className="ayna-shop-filter-toggle" type="button" aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2.5" fill="var(--ayna-bg)" /><circle cx="15" cy="17" r="2.5" fill="var(--ayna-bg)" /></svg>
              Filters
              {activeFilterCount > 0 && <span aria-label={`${activeFilterCount} on`}>{activeFilterCount}</span>}
            </button>
            <p className="ay-shop-count" role="status">{shownTotal} {shownTotal === 1 ? 'product' : 'products'}</p>
            {!searchValue.trim() && <button type="button" className="ay-discover-cta" aria-label="Swipe through products: right to save, left to skip" onClick={() => setShowDeck(true)}>
              <svg className="ay-discover-fan" viewBox="0 0 56 44" aria-hidden="true">
                <rect className="c1" x="6" y="6" width="22" height="30" rx="5" transform="rotate(-12 17 21)" />
                <rect className="c2" x="17" y="5" width="22" height="30" rx="5" />
                <rect className="c3" x="28" y="6" width="22" height="30" rx="5" transform="rotate(12 39 21)" />
              </svg>
              <span className="ay-discover-copy"><strong>Swipe</strong></span>
            </button>}
          </div>}
          {(activeFilters.length > 0 || sortBy !== 'default' || (embedded && activeGroup !== 'all')) && <div className="ay-shop-applied" role="group" aria-label="Filters on">
            {embedded && activeGroup !== 'all' && <button type="button" className="ayna-shop-category" aria-pressed="true" onClick={() => setActiveGroup('all')} aria-label={`Remove area: ${areaLabel(activeGroup)}`}>{areaLabel(activeGroup)}<span aria-hidden="true">×</span></button>}
            {sortBy !== 'default' && SORT_LABELS[sortBy] && <button type="button" className="ayna-shop-category" aria-pressed="true" onClick={() => setSortBy('default')} aria-label={`Remove sort: ${SORT_LABELS[sortBy]}`}>{SORT_LABELS[sortBy]}<span aria-hidden="true">×</span></button>}
            {activeFilters.map(([key, text]) => <button key={key} type="button" className="ayna-shop-category" aria-pressed="true" onClick={() => setFilters((current) => ({ ...current, [key]: 'all' }))} aria-label={`Remove filter: ${text}`}>{text}<span aria-hidden="true">×</span></button>)}
          </div>}
          {bestNeedsQuiz && !showFilters && bestQuizNote}
          {!embedded && <div className="ay-shop-comparerow"><CompareToggle /></div>}
          {/* Founder Oct 26: "too much overcrowded writing". The count stays on one short line here.
              Oct 27: no commission note in the shop list; it sits beside every Buy button and in the footer. */}
          {embedded && <p className="ay-shop-note is-embedded"><b role="status">{shownTotal} {shownTotal === 1 ? 'result' : 'results'}</b></p>}
        </>;
        return embedded
          ? <div className="ayna-category-index is-embedded">{toolbar}</div>
          : <CategoryNav groups={MACRO_GROUPS} active={activeGroup} onSelect={setActiveGroup} action={toolbar} />;
      })()}
      {showDeck && <DiscoverDeck products={filtered} quizAnswers={quizAnswers} matchOpts={matchOpts} savedProducts={savedProducts} onToggleSaved={onToggleSaved} onOpenProduct={(product) => { setShowDeck(false); onOpenProduct?.(product); }} onClose={() => setShowDeck(false)} />}
      {mode === 'products' && <>
        {showFilters && <div className="ayna-shop-filter-backdrop" onClick={() => setShowFilters(false)}>
          <div ref={filterSheetRef} className="ayna-shop-filter-sheet" role="dialog" aria-modal="true" aria-label="Shop filters" onClick={(event) => event.stopPropagation()}>
          <button {...filterGrabber} aria-label="Close filters" />
          <div className="ayna-shop-filter-head"><strong>Filters</strong><button ref={filterCloseRef} type="button" aria-label="Close filters" onClick={() => { setShowFilters(false); filterButtonRef.current?.focus(); }}>Close</button></div>
          <div className="ayna-shop-filter-fields">
          {/* P2-15: the same filter control as the website's sheet: chip groups (selected = pink + check), tap again to clear. */}
          <fieldset className="ay-chipgroup"><legend>Sort</legend><div className="ay-chipgroup__chips">{sortChoices.map(([value, text]) => <button key={value} type="button" className="ay-chipgroup__chip" aria-pressed={sortBy === value} onClick={() => setSortBy(value)}>{text}</button>)}</div>{bestNeedsQuiz && bestQuizNote}</fieldset>
          {embedded && <AvoidChips selected={avoidAttrs} onChange={setAvoidAttrs} mine={myAvoid} className="ay-shop-avoid" />}
          {embedded && <fieldset className="ay-chipgroup"><legend>Area</legend><div className="ay-chipgroup__chips">{SHOP_GROUPS.map((g) => <button key={g.id} type="button" className="ay-chipgroup__chip" aria-pressed={activeGroup === g.id} onClick={() => setActiveGroup(activeGroup === g.id ? 'all' : g.id)}>{g.label}</button>)}</div></fieldset>}
          {FILTER_FIELDS.map(([key, label, options]) => (
            <fieldset key={key} className="ay-chipgroup"><legend>{label}</legend><div className="ay-chipgroup__chips">
              {(key === 'category' ? [...options, ...[...new Set(products.map((p) => p.category).filter(Boolean))].sort().map((category) => [category, sentenceCase(CATEGORY_LABELS[category] || category.replaceAll('-', ' '))])] : options).filter(([value]) => value !== 'all').map(([value, text]) => (
                <button key={value} type="button" className="ay-chipgroup__chip" aria-pressed={filters[key] === value} onClick={() => setFilters((current) => ({ ...current, [key]: current[key] === value ? 'all' : value }))}>{text}</button>
              ))}
            </div></fieldset>
          ))}
          </div>
          <div className="ayna-shop-filter-actions"><button type="button" onClick={() => { setFilters(EMPTY_FILTERS); setSortBy('default'); setActiveGroup('all'); if (embedded) setAvoidAttrs([]); }}>Clear</button><button type="button" onClick={() => setShowFilters(false)}>Apply</button></div>
          </div>
        </div>}
      </>}


      {/* Once the ecosystem exists, Browse stays pure browsing, the
          "update your health" prompt lives on the Ecosystem screen instead,
          after its Reads section. */}
      {mode === 'products' ? (
        <>
          {filtered.length > 0 || moreResults.length > 0 ? (
            <>
              {/* TD 16: a search never looks empty because of the switch. Every result is
                  listed; her matches come first and the count is all results. */}
              {/* Inside Explore one row of chips stays on the page; Leave out is in the Filters sheet. */}
              {!embedded && <AvoidChips selected={avoidAttrs} onChange={setAvoidAttrs} mine={myAvoid} className="ay-shop-avoid" />}
              {narrowToMatches && searchTermRaw && (
                <p className="ay-shop-results-note" role="status">
                  {filtered.length > 0 ? 'Showing matches for you' : 'Showing all results'}
                  {' · '}
                  <button type="button" className="ay-shop-results-all" onClick={() => setPersonalized(false)}>See all {shownTotal} {shownTotal === 1 ? 'result' : 'results'}</button>
                </p>
              )}
              {filtered.length > 0 && moreResults.length > 0 && <h2 className="ay-shop-results-label">Your matches</h2>}
              {filtered.length > 0 && <ProductGrid onPickPhrase={!embedded && !searchTermRaw && activeFilterCount === 0 ? (q) => { setSearchValue(q); document.querySelector('.ayna-shop-heading')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); } : null} matchOpts={matchOpts} savedProducts={savedProducts} onToggleSaved={onToggleSaved} key={filterKey} products={filtered} onOpenProduct={onOpenProduct} layout={cardLayout} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} onStartQuiz={onStartQuiz} showOnboarding={!hasEcosystem && ctaVariant !== 'none'} />}
              {moreResults.length > 0 && <>
                {filtered.length > 0 && <h2 className="ay-shop-results-label">More results</h2>}
                <ProductGrid matchOpts={matchOpts} savedProducts={savedProducts} onToggleSaved={onToggleSaved} key={`more-${filterKey}`} products={moreResults} onOpenProduct={onOpenProduct} layout={cardLayout} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} onStartQuiz={onStartQuiz} />
              </>}
            </>
          ) : searchTermRaw.length >= 2 && aiState.loading ? (
            <>
              <div className="ay-shop-meta">
                Searching beyond our catalog…
              </div>
              <PixelateGrid />
            </>
          ) : searchTermRaw.length >= 2 && aiState.query === searchTermRaw && aiState.suggestions.length > 0 ? (
            <>
              <div className="ay-shop-meta">
                Not in our catalog yet, found via AI search
              </div>
              <ProductGrid matchOpts={matchOpts} savedProducts={savedProducts} onToggleSaved={onToggleSaved} key={`ai-${filterKey}`} products={aiState.suggestions} onOpenProduct={onOpenProduct} layout={cardLayout} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} onStartQuiz={onStartQuiz} />
            </>
          ) : assistSaysNoResults ? null : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ayna-text-muted)', fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))' }}>
              No products match.
            </div>
          )}
          {/* "Can't find it?" only when the typed search found nothing in the catalog. */}
          {!(searchTermRaw.length >= 2 && aiState.loading) && !(searchTermRaw && searchScored.length > 0) && (
            <div className="ay-app-suggest-wrap">
              <SuggestBox variant="app" context="app-shop" prefill={searchTermRaw} />
            </div>
          )}
          <div
            style={{
              margin: '22px 20px 0',
              textAlign: 'center',
              fontFamily: "var(--ayna-font-ui)",
              fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
              color: 'var(--ayna-text-faint)',
            }}
          >
            Over-the-counter options. Not a diagnosis.
          </div>
          {matchingReads.length > 0 && <section style={{ marginTop: 25 }} aria-label="Related reads">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 20px 12px' }}>
              <strong style={{ fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Learn about this</strong>
              <button type="button" onClick={() => onGoLibrary?.()} style={{ border: 0, background: 'transparent', color: 'var(--ayna-accent-dark)', fontWeight: 600 }}>All reads →</button>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 6px' }}>
              {matchingReads.slice(0, 4).map((article) => <LibraryCard key={article.id} article={article} onClick={() => onOpenArticle?.(article)} />)}
            </div>
          </section>}
        </>
      ) : null}
    </div>
  );
}
