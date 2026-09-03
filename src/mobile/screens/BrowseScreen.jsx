import { useEffect, useRef, useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import CtaBanner from '../components/CtaBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import LibraryCard from '../components/LibraryCard.jsx';
import { ARTICLE_CATEGORIES } from '../data/articleRows.js';
import { getPersonalizedProductIds, MACRO_GROUPS, itemMatchesMacroGroup, CATEGORY_LABELS } from '../../data/products.js';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from '../../utils/naturalLanguageSearch.js';
import { useCardLayout } from '../hooks/useCardLayout.js';

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

const PAGE_SIZE = 20;

function ModeTab({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        paddingBottom: 10,
        color: active ? 'var(--ayna-text)' : 'var(--ayna-text-faint)',
        borderBottom: '2px solid ' + (active ? '#FFC774' : 'transparent'),
        marginBottom: -1,
      }}
    >
      {label}
    </div>
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
      <span style={{ fontSize: 12, fontWeight: 600, color: on ? 'var(--ayna-bg)' : 'var(--ayna-text-muted)' }}>For You</span>
      <div
        style={{
          width: 30,
          height: 17,
          borderRadius: 99,
          background: on ? '#FFC774' : 'var(--ayna-chip-border)',
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

function LayoutToggle({ layout, onToggle }) {
  return (
    <div
      onClick={onToggle}
      role="button"
      aria-label={layout === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: '1px solid var(--ayna-chip-border)',
        background: 'var(--ayna-chip-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 14,
        color: 'var(--ayna-text-muted)',
        marginLeft: 8,
      }}
    >
      {layout === 'grid' ? '☰' : '▦'}
    </div>
  );
}

function CategoryChipRow({ groups, active, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '0 20px 12px', scrollbarWidth: 'none' }}>
      {groups.map((g) => (
        <div
          key={g.id}
          onClick={() => onSelect(g.id)}
          style={{
            flex: 'none',
            padding: '7px 13px',
            borderRadius: 99,
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            background: active === g.id ? 'var(--ayna-text)' : 'var(--ayna-chip-bg)',
            color: active === g.id ? 'var(--ayna-bg)' : 'var(--ayna-text-muted)',
            border: '1px solid ' + (active === g.id ? 'var(--ayna-text)' : 'var(--ayna-chip-border)'),
          }}
        >
          {g.label}
        </div>
      ))}
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

// Owns its own pagination state, remounted via `key` (from the parent)
// whenever the active filters change — that gives it a fresh initial
// visibleCount naturally, instead of needing a manual reset that either
// calls setState in an effect body or reads/writes a ref during render
// (both flagged by this project's react-hooks lint rules).
function ProductGrid({ products, onOpenProduct, layout = 'grid' }) {
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
        style={
          isList
            ? { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 14px' }
            : { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11, padding: '0 20px' }
        }
      >
        {visibleProducts.map((p) => (
          <ProductCard key={p.id} product={p} variant={layout} onClick={() => onOpenProduct && onOpenProduct(p)} />
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
  ctaVariant = 'gradient',
  headerInitial = 'A',
  onOpenProduct,
  onOpenArticle,
  onOpenSaved,
  onGoEco,
  onStartQuiz,
  hasEcosystem = false,
  quizAnswers = null,
  theme = 'dark',
  onToggleTheme,
}) {
  const [mode, setMode] = useState('products');
  const [searchValue, setSearchValue] = useState('');
  const [personalized, setPersonalized] = useState(false);
  const [activeGroup, setActiveGroup] = useState('all');
  const { layout: cardLayout, toggleLayout } = useCardLayout();

  // Re-shuffled once per mount — this screen unmounts whenever you navigate
  // away (MobileApp swaps which screen component renders), so a fresh
  // shuffle happens on every visit to Browse, not just once per app load.
  const [shuffled] = useState(() => fisherYatesShuffle(products));

  const hasProfile = !!(quizAnswers?.frustrations?.length);

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
  if (personalized && hasProfile) {
    const personalizedIds = new Set(getPersonalizedProductIds(quizAnswers, null));
    filtered = filtered.filter((p) => personalizedIds.has(p.id));
  }
  if (activeGroup !== 'all') {
    filtered = filtered.filter((p) => itemMatchesMacroGroup(p, activeGroup));
  }
  const filterKey = `${searchTerm}|${personalized}|${activeGroup}`;

  const articlesById = new Map(articles.map((a) => [a.id, a]));
  const rows = ARTICLE_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.articleIds.map((id) => articlesById.get(id)).filter(Boolean),
  })).filter((row) => row.items.length > 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 40px', animation: 'ay-page .25s ease-out' }}>
      <MobileHeader
        variant={theme}
        activeTab="browse"
        initial={headerInitial}
        onOpenSaved={onOpenSaved}
        onGoEco={onGoEco}
        onToggleTheme={onToggleTheme}
      />

      <SearchBar value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 12px', borderBottom: '1px solid var(--ayna-border)', margin: '0 0 14px' }}>
        <div style={{ display: 'flex', gap: 18 }}>
          <ModeTab label="Products" active={mode === 'products'} onClick={() => setMode('products')} />
          <ModeTab label="Reads" active={mode === 'reads'} onClick={() => setMode('reads')} />
        </div>
        {mode === 'products' && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PersonalizedToggle on={personalized} disabled={!hasProfile} onClick={() => setPersonalized((v) => !v)} />
            <LayoutToggle layout={cardLayout} onToggle={toggleLayout} />
          </div>
        )}
      </div>

      {mode === 'products' && (
        <CategoryChipRow groups={MACRO_GROUPS} active={activeGroup} onSelect={setActiveGroup} />
      )}

      {/* Once the ecosystem exists, Browse stays pure browsing — the
          "update your health" prompt lives on the Ecosystem screen instead,
          after its Reads section. */}
      {!hasEcosystem && ctaVariant !== 'none' && (ctaVariant === 'gradient' || ctaVariant === 'inline') ? (
        <CtaBanner variant={ctaVariant} onClick={onStartQuiz} />
      ) : null}

      {mode === 'products' ? (
        <>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ayna-text-muted)', fontSize: 13.5 }}>
              No products match.
            </div>
          ) : (
            <ProductGrid key={filterKey} products={filtered} onOpenProduct={onOpenProduct} layout={cardLayout} />
          )}
          <div
            style={{
              margin: '22px 20px 0',
              textAlign: 'center',
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 0.8,
              color: 'var(--ayna-text-faint)',
            }}
          >
            ALL OTC · NOT A DIAGNOSIS
          </div>
        </>
      ) : rows.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ayna-text-muted)', fontSize: 13.5 }}>
          No reads yet.
        </div>
      ) : (
        rows.map((row) => (
          <div key={row.id} style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 20px 11px' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 17 }}>{row.label}</div>
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
