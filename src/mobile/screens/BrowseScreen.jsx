import { Fragment, useEffect, useRef, useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductImage from '../components/ProductImage.jsx';
import LibraryCard from '../components/LibraryCard.jsx';
import { ARTICLE_CATEGORIES } from '../data/articleRows.js';
import { getPersonalizedProductIds, getProfileMatchPercentForProduct, productSearchText, MACRO_GROUPS, itemMatchesMacroGroup, CATEGORY_LABELS } from '../../data/products.js';
import { getArticlesByProfileRelevance } from '../../components/Articles.jsx';
import { getVerificationLinks } from '../../utils/verificationLinks.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from '../../utils/naturalLanguageSearch.js';
import { fetchSearchSuggestions } from '../../utils/fetchSearchSuggestions.js';

// Fisher-Yates — uniform shuffle, unlike sort(() => Math.random() - 0.5)
// (which is biased and not a proper random permutation).
function fisherYatesShuffle(list) {
  const result = list.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const FILTER_FIELDS = [
  ['category', 'Product type', [['all', 'All products']]],
  ['price', 'Price', [['all', 'Any price'], ['under-25', 'Under $25'], ['25-50', '$25–$50'], ['50-100', '$50–$100'], ['100-plus', '$100+']]],
  ['rating', 'Rating', [['all', 'Any rating'], ['4-plus', '4+ stars']]],
  ['ayna', 'ayna', [['all', 'Any'], ['best-match', 'Best match'], ['clinician', 'Clinician backed'], ['community', 'Community favorite'], ['ecosystem', 'In my Ecosystem']]],
  ['preference', 'Preferences', [['all', 'Any'], ['fragrance-free', 'Fragrance free'], ['sensitive-skin', 'Sensitive skin'], ['vegan', 'Vegan'], ['cruelty-free', 'Cruelty free'], ['organic', 'Organic'], ['clean-ingredients', 'Clean ingredients']]],
  ['eligibility', 'Eligibility', [['all', 'Any'], ['fsa-hsa', 'FSA/HSA eligible'], ['fsa', 'FSA eligible'], ['hsa', 'HSA eligible']]],
  ['sustainability', 'Sustainability', [['all', 'Any'], ['reusable', 'Reusable'], ['recyclable', 'Recyclable'], ['low-waste', 'Low waste'], ['packaging', 'Sustainable packaging']]],
  ['lifeStage', 'Life stage', [['all', 'Any'], ['fertility', 'Fertility'], ['pregnancy', 'Pregnancy'], ['postpartum', 'Postpartum'], ['perimenopause', 'Perimenopause'], ['menopause', 'Menopause']]],
];
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

function ModeTab({ label, active, onClick }) {
  return (
    <button
      type="button"
      className="ayna-fresh-mode-tab"
      aria-pressed={active}
      onClick={onClick}
      style={{
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 600,
        fontSize: 'calc(14px * var(--ayna-text-scale, 1))',
        cursor: 'pointer',
        paddingBottom: 10,
        color: active ? 'var(--ayna-text)' : 'var(--ayna-text-faint)',
        borderBottom: '2px solid ' + (active ? '#9BF0E1' : 'transparent'),
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  );
}

function PersonalizedToggle({ on, disabled, onClick }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      title={disabled ? 'Complete your profile to personalize' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        padding: '5px 5px 5px 10px',
        borderRadius: 99,
        background: on ? 'var(--ayna-text)' : 'var(--ayna-chip-bg)',
        transition: 'background .15s',
      }}
    >
      <span style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', fontWeight: 600, color: on ? 'var(--ayna-bg)' : 'var(--ayna-text-muted)' }}>Personalized</span>
      <div
        style={{
          width: 30,
          height: 17,
          borderRadius: 99,
          background: on ? '#9BF0E1' : 'var(--ayna-chip-border)',
          position: 'relative',
          transition: 'background .15s',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 15 : 2,
            width: 13,
            height: 13,
            borderRadius: 99,
            background: '#FFFFFF',
            transition: 'left .15s',
          }}
        />
      </div>
    </div>
  );
}

function CategoryPhotoRow({ products, active, onSelect }) {
  const groups = ['all', 'period', 'intimate', 'hormones', 'fertility', 'pelvic', 'tests-devices']
    .map((id) => MACRO_GROUPS.find((group) => group.id === id)).filter(Boolean);
  return (
    <div className="ayna-shop-category-row" aria-label="Shop by category">
      {groups.map((group) => {
        const sample = group.id === 'all' ? null : products.find((product) => itemMatchesMacroGroup(product, group.id) && (product.image || product.imageUrl || product.images?.[0]));
        return <button className="ayna-shop-category" type="button" key={group.id} aria-pressed={active === group.id} onClick={() => onSelect(group.id)}><span className="ayna-shop-category-image">{sample ? <ProductImage src={sample.image || sample.imageUrl || sample.images?.[0]} alt="" allowBrandLogo={sample.type === 'digital'} style={{ objectFit: 'contain' }} /> : <span className="ayna-shop-all-mark" aria-hidden="true">a</span>}</span><span>{group.label}</span></button>;
      })}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 18, padding: 10 }}>
      <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 13, background: 'var(--ayna-chip-bg)', animation: 'ay-skeleton 1.2s ease-in-out infinite' }} />
      <div style={{ height: 12, width: '70%', background: 'var(--ayna-chip-bg)', borderRadius: 4, marginTop: 9, animation: 'ay-skeleton 1.2s ease-in-out infinite' }} />
      <div style={{ height: 10, width: '40%', background: 'var(--ayna-chip-bg)', borderRadius: 4, marginTop: 6, animation: 'ay-skeleton 1.2s ease-in-out infinite' }} />
    </div>
  );
}

// AI-search loading state: a coarse checkerboard "pixel" pattern that
// materializes in via steps() (a chunky, non-smooth animation) rather than
// the plain fade SkeletonCard uses above — this is a live network+LLM call
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
// whenever the active filters change — that gives it a fresh initial
// visibleCount naturally, instead of needing a manual reset that either
// calls setState in an effect body or reads/writes a ref during render
// (both flagged by this project's react-hooks lint rules).
function ProductGrid({ products, onOpenProduct, layout = 'grid', quizAnswers = null, onOpenWhyMatch, onStartQuiz, showOnboarding = false, savedProducts = {}, onToggleSaved }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

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
        className={`ayna-editorial-product-grid${isList ? ' is-list-layout' : ''}`}
        style={
          isList
            ? { display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }
            : { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11, padding: '0 20px' }
        }
      >
        {visibleProducts.map((p, index) => (
          <Fragment key={p.id}>
            <ProductCard product={p} variant={layout} onClick={() => onOpenProduct && onOpenProduct(p)} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} onStartQuiz={onStartQuiz} isSaved={!!savedProducts[p.id]} onToggleSaved={onToggleSaved} />
            {showOnboarding && index === Math.min(3, visibleProducts.length - 1) && <section className="ayna-figma-discover-cta"><span>See your match</span><button type="button" onClick={onStartQuiz}>Get matched <span aria-hidden="true">→</span></button></section>}
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
// paginated network endpoint — this app has no live backend for the
// catalog. "Infinite scroll" is therefore client-side batching over that
// same real array (same fields/images), revealed progressively as the user
// scrolls, rather than network-fetched pages.
export default function BrowseScreen({
  products = [],
  articles = [],
  authUser = null,
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
  quizAnswers = null,
  theme = 'dark',
  onToggleTheme,
  onOpenProfile,
  onOpenWhyMatch,
  // Controlled from MobileApp.jsx (and persisted there) so the toggle
  // survives this screen unmounting when the user navigates away (e.g. to
  // My Ecosystem) and back — it should stay on until the user explicitly
  // turns it off, not reset just because they left the tab.
  personalized: personalizedProp,
  onPersonalizedChange,
}) {
  const [mode, setMode] = useState('products');
  const [searchValue, setSearchValue] = useState('');
  // Falls back to local state only if no controlled value is passed in
  // (keeps this component usable/testable standalone).
  const [personalizedLocal, setPersonalizedLocal] = useState(false);
  const personalized = personalizedProp ?? personalizedLocal;
  const setPersonalized = (updater) => {
    const next = typeof updater === 'function' ? updater(personalized) : updater;
    if (onPersonalizedChange) onPersonalizedChange(next);
    else setPersonalizedLocal(next);
  };
  const [activeGroup, setActiveGroup] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState('default');
  const cardLayout = 'grid';
  // AI fallback for a typed search the local catalog scoring found nothing
  // for — same /api/search-suggestions the desktop Discovery page falls
  // back to (see fetchSearchSuggestions.js), not a separate mechanism.
  const [aiState, setAiState] = useState({ query: '', loading: false, suggestions: [], error: null });

  // Re-shuffled once per mount — this screen unmounts whenever you navigate
  // away (MobileApp swaps which screen component renders), so a fresh
  // shuffle happens on every visit to Browse, not just once per app load.
  const [shuffled] = useState(() => fisherYatesShuffle(products));

  // frustrations is the legacy desktop quiz shape; the real current mobile
  // intake (IntakeScreen.jsx) never sets it at all — it produces
  // fullHealthIntake.supportSelections/primaryConcerns instead — so relying
  // on frustrations alone meant "For You" personalization was permanently
  // disabled for every real mobile user who'd actually completed the quiz.
  const hasProfile = !!(
    quizAnswers?.frustrations?.length
    || quizAnswers?.fullHealthIntake?.supportSelections?.length
    || quizAnswers?.fullHealthIntake?.primaryConcerns?.length
  );

  // Real filtering — reuses the site's own scoreQueryAgainstProduct/
  // buildSearchTextForItem/buildIdentityTextForItem (naturalLanguageSearch.js)
  // and getPersonalizedProductIds/itemMatchesMacroGroup (products.js) — the
  // exact same search-scoring and personalization/category-matching
  // functions the desktop Discovery page already uses, not a separate,
  // weaker matching system. This is why terms like "PCOS" or "hair
  // thinning" now work here too: scoreQueryAgainstProduct already knows the
  // real term aliases (e.g. pcos -> polycystic/ovarian) and scores natural-
  // language queries, unlike a plain substring check.
  const searchTermRaw = searchValue.trim();
  const searchTerm = searchTermRaw.toLowerCase();
  let filtered = shuffled;
  if (searchTermRaw) {
    filtered = shuffled
      .map((p) => ({
        item: p,
        matchScore: scoreQueryAgainstProduct(
          searchTermRaw,
          buildSearchTextForItem(p, CATEGORY_LABELS),
          buildIdentityTextForItem(p, CATEGORY_LABELS)
        ),
      }))
      .filter((x) => x.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((x) => x.item);
  }
  // Captured before the personalized/category filters narrow `filtered`
  // further — the AI fallback below should trigger on "the typed search
  // itself found nothing in the catalog", not "this narrower filtered view
  // happens to be empty because of an unrelated active filter".
  const searchScored = filtered;
  if (personalized && hasProfile) {
    const personalizedIds = new Set(getPersonalizedProductIds(quizAnswers, null));
    filtered = filtered.filter((p) => personalizedIds.has(p.id));
  }
  if (activeGroup !== 'all') {
    filtered = filtered.filter((p) => itemMatchesMacroGroup(p, activeGroup));
  }
  filtered = filtered.filter((item) => {
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    const price = PRICE_VALUE(item);
    if (filters.price === 'under-25' && !(price != null && price < 25)) return false;
    if (filters.price === '25-50' && !(price != null && price >= 25 && price <= 50)) return false;
    if (filters.price === '50-100' && !(price != null && price > 50 && price <= 100)) return false;
    if (filters.price === '100-plus' && !(price != null && price > 100)) return false;
    if (filters.rating === '4-plus' && !(RATING_VALUE(item) >= 4)) return false;
    if (filters.ayna === 'best-match' && !(getProfileMatchPercentForProduct(item, quizAnswers) >= 50)) return false;
    if (filters.ayna === 'clinician' && !(item.doctorOpinion || item.clinicianOpinion || getVerificationLinks(item, 'doctor').length)) return false;
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
  if (sortBy === 'default' && personalized && hasProfile && !searchTermRaw) {
    const matchScores = new Map(filtered.map((product) => [
      product.id,
      getProfileMatchPercentForProduct(product, quizAnswers) ?? 0,
    ]));
    filtered = [...filtered].sort((a, b) =>
      matchScores.get(b.id) - matchScores.get(a.id));
  }
  // Brand partners pinned to the top of the default browsing sort — same
  // rule as desktop Discovery.jsx: a partnership buys visibility on the
  // page you browse freely, never placement inside an actual text search
  // or personalized ("For You") recommendation.
  if (sortBy === 'default' && !searchTermRaw && !(personalized && hasProfile)) {
    filtered = [...filtered].sort((a, b) => (isPartnerBrandItem(b) ? 1 : 0) - (isPartnerBrandItem(a) ? 1 : 0));
  }
  const filterKey = `${searchTerm}|${personalized}|${activeGroup}|${JSON.stringify(filters)}|${sortBy}`;

  useEffect(() => {
    // Nothing to fetch — and nothing to reset either: the render logic below
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
        query: searchTermRaw,
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
          setAiState({ query: searchTermRaw, loading: false, suggestions: [], error: 'Could not load suggestions.' });
        });
    }, 600);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchTermRaw, searchScored.length, activeGroup]);

  const articlesById = new Map(articles.map((a) => [a.id, a]));
  const matchingReads = searchTermRaw.length >= 2 ? articles
    .map((article) => {
      const title = String(article.title || '').toLowerCase();
      const details = `${(article.tags || []).join(' ')} ${article.teaser || ''}`.toLowerCase();
      return { article, score: title.includes(searchTerm) ? 2 : details.includes(searchTerm) ? 1 : 0 };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ article }) => article) : [];
  const rows = ARTICLE_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.articleIds.map((id) => articlesById.get(id)).filter(Boolean),
  })).filter((row) => row.items.length > 0);

  // Same personalization logic as the "Recommended" filter on the desktop
  // Health Articles Library (Articles.jsx's getArticlesByProfileRelevance) —
  // not a separate/weaker mobile-only scoring system. Falls back to the
  // category-grouped `rows` above when off or when there's no profile yet.
  const recommendedReads = getArticlesByProfileRelevance(quizAnswers || {}, null).filter((a) =>
    articlesById.has(a.id)
  );

  return (
    <div className="ayna-fresh-browse-screen ayna-figma-discover">
      <MobileHeader
        variant={theme}
        activeTab="browse"
        initial={headerInitial}
        onOpenSaved={onOpenSaved}
        onGoEco={onGoEco}
        onGoCommunity={onGoCommunity}
        onToggleTheme={onToggleTheme}
        onOpenProfile={onOpenProfile}
      />

      <div className="ayna-fresh-browse-heading ayna-shop-heading">
        <h1>Shop</h1>
        <SearchBar value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 12px', borderBottom: '1px solid var(--ayna-border)', margin: '0 0 14px' }}>
        <div style={{ display: 'flex', gap: 18 }}>
          <ModeTab label="Products" active={mode === 'products'} onClick={() => setMode('products')} />
          <ModeTab label="Reads" active={mode === 'reads'} onClick={() => setMode('reads')} />
        </div>
        {mode === 'products' && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PersonalizedToggle on={personalized} disabled={!hasProfile} onClick={() => setPersonalized((v) => !v)} />
          </div>
        )}
        {mode === 'reads' && (
          <PersonalizedToggle on={personalized} disabled={!hasProfile} onClick={() => setPersonalized((v) => !v)} />
        )}
      </div>

      {mode === 'products' && (
        <CategoryPhotoRow products={products} active={activeGroup} onSelect={setActiveGroup} />
      )}

      {mode === 'products' && <div style={{ padding: '0 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)} style={{ minHeight: 44, padding: '10px 16px', borderRadius: 99, border: '1px solid var(--ayna-border)', background: 'var(--ayna-surface)', color: 'var(--ayna-heading)', fontWeight: 700 }}>Filters{Object.values(filters).filter((value) => value !== 'all').length ? ` · ${Object.values(filters).filter((value) => value !== 'all').length}` : ''}</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', color: 'var(--ayna-text-muted)', fontSize: 12 }}>Sort <select aria-label="Sort products" value={sortBy} onChange={(event) => setSortBy(event.target.value)} style={{ minHeight: 44, maxWidth: 155, border: '1px solid var(--ayna-border)', borderRadius: 12, padding: '8px 10px', background: 'var(--ayna-surface)', color: 'var(--ayna-heading)' }}><option value="default">Featured</option><option value="rating">Highest rated</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
        </div>
        {showFilters && <div className="ayna-shop-filter-backdrop" onClick={() => setShowFilters(false)}>
          <div className="ayna-shop-filter-sheet" role="dialog" aria-modal="true" aria-label="Shop filters" onClick={(event) => event.stopPropagation()}>
          <div className="ayna-shop-filter-head"><strong>Filters</strong><button type="button" aria-label="Close filters" onClick={() => setShowFilters(false)}>Close</button></div>
          <div className="ayna-shop-filter-fields">
          {FILTER_FIELDS.map(([key, label, options]) => <label key={key} style={{ display: 'grid', gap: 5, color: 'var(--ayna-text-muted)', fontSize: 11, fontWeight: 600 }}>{label}<select value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))} style={{ width: '100%', minWidth: 0, minHeight: 44, border: '1px solid var(--ayna-border)', borderRadius: 10, background: 'var(--ayna-bg)', color: 'var(--ayna-heading)', padding: '8px' }}>{(key === 'category' ? [...options, ...[...new Set(products.map((p) => p.category).filter(Boolean))].sort().map((category) => [category, CATEGORY_LABELS[category] || category.replaceAll('-', ' ')])] : options).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>)}
          </div>
          <div className="ayna-shop-filter-actions"><button type="button" onClick={() => { setFilters(EMPTY_FILTERS); setSortBy('default'); }}>Clear</button><button type="button" onClick={() => setShowFilters(false)}>Show {filtered.length} products</button></div>
          </div>
        </div>}
      </div>}


      {/* Once the ecosystem exists, Browse stays pure browsing — the
          "update your health" prompt lives on the Ecosystem screen instead,
          after its Reads section. */}
      {mode === 'products' ? (
        <>
          {filtered.length > 0 ? (
            <ProductGrid savedProducts={savedProducts} onToggleSaved={onToggleSaved} key={filterKey} products={filtered} onOpenProduct={onOpenProduct} layout={cardLayout} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} onStartQuiz={onStartQuiz} showOnboarding={!hasEcosystem && ctaVariant !== 'none'} />
          ) : searchTermRaw.length >= 2 && aiState.loading ? (
            <>
              <div style={{ padding: '0 20px 14px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))', letterSpacing: 0.6, color: 'var(--ayna-text-faint)', textTransform: 'uppercase' }}>
                Searching beyond our catalog…
              </div>
              <PixelateGrid />
            </>
          ) : searchTermRaw.length >= 2 && aiState.query === searchTermRaw && aiState.suggestions.length > 0 ? (
            <>
              <div style={{ padding: '0 20px 14px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))', letterSpacing: 0.6, color: 'var(--ayna-text-faint)', textTransform: 'uppercase' }}>
                Not in our catalog yet — found via AI search
              </div>
              <ProductGrid savedProducts={savedProducts} onToggleSaved={onToggleSaved} key={`ai-${filterKey}`} products={aiState.suggestions} onOpenProduct={onOpenProduct} layout={cardLayout} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} onStartQuiz={onStartQuiz} />
            </>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ayna-text-muted)', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))' }}>
              No products match.
            </div>
          )}
          <div
            style={{
              margin: '22px 20px 0',
              textAlign: 'center',
              fontFamily: "'DM Mono',monospace",
              fontSize: 'calc(10px * var(--ayna-text-scale, 1))',
              letterSpacing: 0.8,
              color: 'var(--ayna-text-faint)',
            }}
          >
            ALL OTC · NOT A DIAGNOSIS
          </div>
          {matchingReads.length > 0 && <section style={{ marginTop: 25 }} aria-label="Related reads">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 20px 12px' }}>
              <strong style={{ fontSize: 18, color: 'var(--ayna-text)' }}>Learn about this</strong>
              <button type="button" onClick={() => setMode('reads')} style={{ border: 0, background: 'transparent', color: 'var(--ayna-accent-dark)', fontWeight: 600 }}>See reads →</button>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 6px' }}>
              {matchingReads.slice(0, 4).map((article) => <LibraryCard key={article.id} article={article} onClick={() => onOpenArticle?.(article)} />)}
            </div>
          </section>}
        </>
      ) : searchTermRaw.length >= 2 ? (
        matchingReads.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11, padding: '0 20px' }}>
          {matchingReads.map((article) => <LibraryCard key={article.id} article={article} fullWidth onClick={() => onOpenArticle?.(article)} />)}
        </div> : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ayna-text-muted)' }}>No reads match this search.</div>
      ) : personalized && hasProfile ? (
        recommendedReads.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ayna-text-muted)', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))' }}>
            No reads match your profile yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11, padding: '0 20px' }}>
            {recommendedReads.map((a) => (
              <LibraryCard key={a.id} article={a} fullWidth onClick={() => onOpenArticle && onOpenArticle(a)} />
            ))}
          </div>
        )
      ) : rows.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ayna-text-muted)', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))' }}>
          No reads yet.
        </div>
      ) : (
        rows.map((row) => (
          <div key={row.id} style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 20px 11px' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))' }}>{row.label}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
              {row.items.map((a) => (
                <LibraryCard key={a.id} article={a} onClick={() => onOpenArticle && onOpenArticle(a)} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
