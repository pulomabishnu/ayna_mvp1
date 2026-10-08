import { useEffect, useMemo, useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductImage from '../components/ProductImage.jsx';
import LibraryCard from '../components/LibraryCard.jsx';
import { getPersonalizedProductIds, MACRO_GROUPS, itemMatchesMacroGroup, CATEGORY_LABELS } from '../../data/products.js';
import { getArticlesByProfileRelevance } from '../../components/Articles.jsx';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from '../../utils/naturalLanguageSearch.js';
import { fetchSearchSuggestions } from '../../utils/fetchSearchSuggestions.js';

function imageFor(product) {
  return product?.image || product?.imageUrl || (Array.isArray(product?.images) ? product.images[0] : undefined);
}

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>;
}

function CategoryTile({ group, product, active, onClick }) {
  const image = imageFor(product);
  return (
    <button type="button" onClick={onClick} style={{ position: 'relative', height: 112, border: active ? '1.5px solid var(--ayna-purple)' : '1px solid var(--ayna-border)', borderRadius: 18, overflow: 'hidden', padding: 0, background: 'var(--ayna-bg-alt)', textAlign: 'left', cursor: 'pointer' }}>
      {image && <div style={{ position: 'absolute', inset: 0, opacity: .5 }}><ProductImage src={image} alt="" compact /></div>}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(36,28,62,.02),rgba(36,28,62,.62))' }} />
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 11, color: '#fff', fontWeight: 700, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.15 }}>{group.label}</div>
    </button>
  );
}

function ProductSkeleton() {
  return <div><div style={{ aspectRatio: '4/5', borderRadius: 16, background: 'var(--ayna-bg-alt)', animation: 'ay-skeleton 1.2s ease-in-out infinite' }}/><div style={{ width: '75%', height: 11, borderRadius: 6, background: 'var(--ayna-bg-alt)', marginTop: 9 }}/><div style={{ width: '42%', height: 9, borderRadius: 6, background: 'var(--ayna-bg-alt)', marginTop: 6 }}/></div>;
}

export default function BrowseScreen({
  products = [],
  articles = [],
  headerInitial = 'A',
  onOpenProduct,
  onOpenArticle,
  onOpenSaved,
  onGoEco,
  onStartQuiz,
  hasEcosystem = false,
  quizAnswers = null,
  theme = 'light',
  onOpenProfile,
  onOpenWhyMatch,
  personalized: personalizedProp,
  onPersonalizedChange,
}) {
  const [searchValue, setSearchValue] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [personalizedLocal, setPersonalizedLocal] = useState(true);
  const personalized = personalizedProp ?? personalizedLocal;
  const setPersonalized = (value) => onPersonalizedChange ? onPersonalizedChange(value) : setPersonalizedLocal(value);
  const [aiState, setAiState] = useState({ query: '', loading: false, suggestions: [] });

  const hasProfile = !!(
    quizAnswers?.frustrations?.length
    || quizAnswers?.fullHealthIntake?.supportSelections?.length
    || quizAnswers?.fullHealthIntake?.primaryConcerns?.length
  );

  const searchTerm = searchValue.trim();
  const scored = useMemo(() => {
    if (!searchTerm) return products;
    return products
      .map((p) => ({ p, score: scoreQueryAgainstProduct(searchTerm, buildSearchTextForItem(p, CATEGORY_LABELS), buildIdentityTextForItem(p, CATEGORY_LABELS)) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);
  }, [products, searchTerm]);

  let filtered = scored;
  if (personalized && hasProfile) {
    const ids = new Set(getPersonalizedProductIds(quizAnswers, null));
    filtered = filtered.filter((p) => ids.has(p.id));
  }
  if (activeGroup !== 'all') filtered = filtered.filter((p) => itemMatchesMacroGroup(p, activeGroup));

  useEffect(() => {
    if (searchTerm.length < 2 || scored.length > 0) return undefined;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setAiState({ query: searchTerm, loading: true, suggestions: [] });
      fetchSearchSuggestions({ query: searchTerm, category: activeGroup !== 'all' ? activeGroup : '', maxResults: 12, signal: controller.signal })
        .then(({ suggestions }) => { if (!cancelled) setAiState({ query: searchTerm, loading: false, suggestions: suggestions || [] }); })
        .catch(() => { if (!cancelled) setAiState({ query: searchTerm, loading: false, suggestions: [] }); });
    }, 550);
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, [searchTerm, scored.length, activeGroup]);

  const groups = MACRO_GROUPS.filter((g) => g.id !== 'all').slice(0, 6);
  const categorySamples = groups.map((g) => products.find((p) => itemMatchesMacroGroup(p, g.id)) || null);
  const recommendedReads = hasProfile ? getArticlesByProfileRelevance(quizAnswers || {}, null).slice(0, 4) : articles.slice(0, 4);
  const displayProducts = filtered.length ? filtered : (aiState.query === searchTerm ? aiState.suggestions : []);

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 44, background: 'var(--ayna-bg)', animation: 'ay-page .2s ease-out' }}>
      <MobileHeader variant={theme} activeTab="browse" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={onGoEco} onOpenProfile={onOpenProfile} />

      <section style={{ padding: '12px 20px 0' }}>
        <div style={{ fontSize: 'calc(28px * var(--ayna-text-scale, 1))', fontWeight: 750, letterSpacing: '-.035em', color: 'var(--ayna-heading)' }}>Explore</div>
        <div style={{ marginTop: 5, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Products, symptoms, questions, ingredients.</div>

        <div style={{ marginTop: 16, height: 48, borderRadius: 15, border: '1px solid var(--ayna-border)', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', color: 'var(--ayna-text-faint)' }}>
          <SearchIcon />
          <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search ayna" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'var(--ayna-text)', font: 'inherit', fontSize: 'calc(14px * var(--ayna-text-scale, 1))' }}/>
          {searchValue && <button type="button" onClick={() => setSearchValue('')} style={{ border: 0, background: 'transparent', color: 'var(--ayna-text-faint)', fontSize: 18, cursor: 'pointer' }}>×</button>}
        </div>
      </section>

      {!searchTerm && (
        <>
          <section style={{ padding: '24px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>What are you looking for?</h2>
              <button type="button" onClick={() => setActiveGroup('all')} style={{ border: 0, background: 'transparent', color: 'var(--ayna-mauve)', fontSize: 11, fontWeight: 700 }}>All</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
              {groups.map((g, i) => <CategoryTile key={g.id} group={g} product={categorySamples[i]} active={activeGroup === g.id} onClick={() => setActiveGroup(activeGroup === g.id ? 'all' : g.id)} />)}
            </div>
          </section>

          {!hasProfile && !hasEcosystem && (
            <section style={{ margin: '24px 20px 0', borderRadius: 20, background: 'var(--ayna-deep-space)', color: '#fff', padding: 18 }}>
              <div style={{ fontWeight: 750, fontSize: 17 }}>Make this more personal</div>
              <div style={{ opacity: .75, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>Tell ayna what you care about and we’ll prioritize better matches.</div>
              <button type="button" onClick={onStartQuiz} style={{ marginTop: 14, border: 0, borderRadius: 11, background: '#fff', color: 'var(--ayna-deep-space)', padding: '10px 13px', fontWeight: 750 }}>Personalize</button>
            </section>
          )}
        </>
      )}

      <section style={{ padding: '26px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'calc(18px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>{searchTerm ? `Results for “${searchTerm}”` : 'Curated for you'}</h2>
            {!searchTerm && <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', marginTop: 3 }}>{personalized && hasProfile ? 'Based on your profile' : 'A mix worth exploring'}</div>}
          </div>
          {hasProfile && !searchTerm && (
            <button type="button" onClick={() => setPersonalized(!personalized)} style={{ border: 0, background: 'transparent', color: personalized ? 'var(--ayna-purple)' : 'var(--ayna-text-faint)', fontWeight: 700, fontSize: 11.5 }}>{personalized ? 'For You' : 'All'}</button>
          )}
        </div>

        {aiState.loading && !displayProducts.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>{Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}</div>
        ) : displayProducts.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '20px 12px' }}>
            {displayProducts.slice(0, searchTerm ? 18 : 10).map((p) => <ProductCard key={p.id} product={p} onClick={() => onOpenProduct?.(p)} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} />)}
          </div>
        ) : (
          <div style={{ padding: '34px 0', color: 'var(--ayna-text-muted)', fontSize: 13 }}>Nothing matched that yet.</div>
        )}
      </section>

      {!searchTerm && recommendedReads.length > 0 && (
        <section style={{ padding: '30px 0 0' }}>
          <div style={{ padding: '0 20px 12px' }}>
            <h2 style={{ margin: 0, fontSize: 'calc(18px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>Worth knowing</h2>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
            {recommendedReads.map((a) => <LibraryCard key={a.id} article={a} onClick={() => onOpenArticle?.(a)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
