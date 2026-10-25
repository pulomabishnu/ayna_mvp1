import { useEffect, useMemo, useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import ProductCard from '../components/ProductCard.jsx';
import LibraryCard from '../components/LibraryCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import BrowseScreen from './BrowseScreen.jsx';
import { APP_EXPLORE_SECTIONS as EXPLORE_SECTIONS } from '../../components/nav/mainTabs.js';
import { HEALTH_TOPICS, searchExplore, splitCatalog } from '../../utils/search/exploreSearch.js';
import { searchCommunityTolerant } from '../../utils/search/communitySearch.js';
import { searchCommunity } from '../../utils/community/communityStore.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { rankReadsForProfile } from '../utils/personalReads.js';
import { readRecentSearches, rememberSearch, clearRecentSearches } from '../../utils/search/recentSearches.js';
import { FAMILIAR_PHRASES } from '../../components/shop/shopNeeds.js';
import '../explore.css';

const ROW = 8;

function SectionHead({ id, title, onAll, allLabel }) {
  return <div className="ax-head"><h2 id={id}>{title}</h2>{onAll && <button type="button" className="ax-all" onClick={onAll}>{allLabel}</button>}</div>;
}

function postKind(post) {
  return post?.kind === 'question' ? 'Question' : post?.kind === 'review' ? 'Review' : 'Post';
}

/** Community posts for a query (needs the network; quiet when it fails or is signed out of reach). */
function useCommunityResults(query) {
  const [state, setState] = useState({ q: '', posts: [] });
  useEffect(() => {
    const q = String(query || '').trim();
    if (q.length < 2) return undefined;
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    let live = true;
    const t = window.setTimeout(() => {
      searchCommunityTolerant(searchCommunity, supabase, q, 4)
        .then((r) => { if (live) setState({ q, posts: (r?.posts || []).slice(0, 4) }); })
        .catch(() => { if (live) setState({ q, posts: [] }); });
    }, 300);
    return () => { live = false; window.clearTimeout(t); };
  }, [query]);
  return state.q === String(query || '').trim() ? state.posts : [];
}

/**
 * Explore (UX spec 11): search on top, then For you, Categories, Products,
 * Services. Products is the whole Shop (filters, sort, Best match unchanged).
 * In the app the reads have their own tab, Library (founder, Oct 24 20:12):
 * "All reads" and "Resources" links here open that tab. Browsing works with
 * no profile at all.
 */
export default function ExploreScreen(props) {
  const {
    exploreSection = 'overview', onExploreSection, products = [], articles = [], quizAnswers = null,
    lastQuizAnswers = null, matchOpts, savedProducts = {}, onToggleSaved, onOpenProduct, onOpenArticle, onOpenSaved,
    onOpenWhyMatch, onStartQuiz, suggestedEcosystemProducts = [], onOpenCommunityPost, onGoCommunity,
  } = props;
  const section = EXPLORE_SECTIONS.some((s) => s.key === exploreSection) ? exploreSection : 'overview';
  const [query, setQuery] = useState('');
  const q = query.trim();
  // Recent searches on this phone (team direction 54); a search counts once it has settled.
  const [recent, setRecent] = useState(readRecentSearches);
  useEffect(() => {
    if (q.length < 3) return undefined;
    const t = window.setTimeout(() => setRecent(rememberSearch(q)), 1500);
    return () => window.clearTimeout(t);
  }, [q]);
  const searching = q.length >= 2 && (section === 'overview' || section === 'topics' || section === 'services');
  const { products: catalog, services } = useMemo(() => splitCatalog(products), [products]);
  const results = useMemo(() => (searching ? searchExplore(q, { items: products, articles }) : null), [searching, q, products, articles]);
  const posts = useCommunityResults(searching ? q : '');
  const hasProfile = Boolean(lastQuizAnswers || quizAnswers);
  const forYouReads = useMemo(() => (hasProfile ? rankReadsForProfile(articles, quizAnswers || lastQuizAnswers).slice(0, 4) : []), [hasProfile, articles, quizAnswers, lastQuizAnswers]);
  const forYouProducts = hasProfile ? suggestedEcosystemProducts.slice(0, ROW) : [];
  const go = (key, search = '') => { setQuery(''); onExploreSection?.(key, search); };

  const card = (p) => <div className="ax-item" key={p.id}><ProductCard product={p} onClick={() => onOpenProduct?.(p)} quizAnswers={quizAnswers} matchOpts={matchOpts} onOpenWhyMatch={onOpenWhyMatch} isSaved={!!savedProducts[p.id]} onToggleSaved={onToggleSaved} /></div>;
  const productRow = (items) => <div className="ax-row">{items.map(card)}</div>;
  const readRow = (items) => <div className="ax-row is-reads">{items.map((a) => <div className="ax-item is-read" key={a.id}><LibraryCard article={a} onClick={() => onOpenArticle?.(a)} /></div>)}</div>;
  const topicChips = (items) => <div className="ax-topics" role="group" aria-label="Categories">{items.map((t) => <button type="button" key={t.key} onClick={() => { setQuery(t.label); setRecent(rememberSearch(t.label)); }}>{t.label}</button>)}</div>;

  const chips = <nav className="ax-sections" data-tour="explore-sections" aria-label="Explore sections">
    {EXPLORE_SECTIONS.map((s) => <button type="button" key={s.key} aria-current={section === s.key ? 'page' : undefined} className={section === s.key ? 'is-on' : ''} onClick={() => go(s.key)}>{s.label}</button>)}
  </nav>;

  // Products: the existing Shop, under Explore's header.
  if (section === 'products') {
    return <div className="ax ax--embed" data-tour="explore">
      <MobileHeader onOpenSaved={onOpenSaved} />
      <header className="ax-top"><h1 className="ax-title">Explore</h1>{chips}</header>
      <BrowseScreen {...props} embedded />
    </div>;
  }

  let body;
  if (searching) {
    const r = results;
    const none = r.total === 0 && posts.length === 0;
    body = <div className="ax-results" aria-live="polite">
      {none && <p className="ax-empty">Nothing matches “{q}” yet. Try a symptom, a topic or a product type.</p>}
      {r.topics.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-topics"><SectionHead id="ax-r-topics" title="Categories" />{topicChips(r.topics)}</section>}
      {r.products.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-products"><SectionHead id="ax-r-products" title="Products" onAll={() => go('products', q)} allLabel={`See all ${r.products.length}`} />{productRow(r.products.slice(0, ROW))}</section>}
      {r.services.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-services"><SectionHead id="ax-r-services" title="Services" />{productRow(r.services.slice(0, ROW))}</section>}
      {r.resources.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-res"><SectionHead id="ax-r-res" title="Reads" onAll={() => go('resources')} allLabel="Open Library" />{readRow(r.resources.slice(0, 4))}</section>}
      {posts.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-comm"><SectionHead id="ax-r-comm" title="Community" onAll={onGoCommunity} allLabel="Open Community" />
        <ul className="ax-posts">{posts.map((p) => <li key={p.id}><button type="button" onClick={() => onOpenCommunityPost?.(p.id)}><small>{postKind(p)}</small><span>{String(p.body || '').slice(0, 140)}{String(p.body || '').length > 140 ? '…' : ''}</span></button></li>)}</ul>
      </section>}
    </div>;
  } else if (section === 'topics') {
    body = <>
      <section className="ax-sec" aria-labelledby="ax-topics-h"><SectionHead id="ax-topics-h" title="Categories" /><p className="ax-note">Pick one to see products, services, reads and what the Community says.</p>{topicChips(HEALTH_TOPICS)}</section>
      {/* The "Does this sound familiar?" phrases, moved here from the product grid (team direction 17). */}
      <section className="ax-sec" aria-labelledby="ax-phrases-h"><SectionHead id="ax-phrases-h" title="Searches people make" />
        <div className="ax-topics" role="group" aria-label="Searches people make">{FAMILIAR_PHRASES.map((t) => <button type="button" key={t} onClick={() => { setQuery(t); setRecent(rememberSearch(t)); }}>{t}</button>)}</div>
      </section>
    </>;
  } else if (section === 'services') {
    body = <section className="ax-sec" aria-labelledby="ax-services-h"><SectionHead id="ax-services-h" title="Services" /><p className="ax-note">Telehealth, at-home tests, apps and programs from women’s health companies.</p><div className="ax-grid">{services.map(card)}</div></section>;
  } else {
    // For you: her picks, or one invite and a first look. The other sections
    // have their own tabs, so nothing is repeated here (team direction 17).
    body = <>
      <section className="ax-sec" aria-labelledby="ax-foryou-h">
        {hasProfile && forYouProducts.length > 0
          ? <><SectionHead id="ax-foryou-h" title="Picked for you" onAll={() => go('products')} allLabel="See all" />{productRow(forYouProducts)}</>
          : <><h2 id="ax-foryou-h" className="sr-only">For you</h2><div className="ax-invite">
            <h3>See how well this matches you</h3>
            <p>Create your health profile to see your personalized match and why.</p>
            {onStartQuiz && <button type="button" className="ax-invite__go" onClick={onStartQuiz}>Create your health profile</button>}
          </div></>}
      </section>
      {!(hasProfile && forYouProducts.length > 0) && <section className="ax-sec" aria-labelledby="ax-products-h"><SectionHead id="ax-products-h" title="Products" onAll={() => go('products')} allLabel="See all" />{productRow(catalog.slice(0, ROW))}</section>}
      {(forYouReads.length > 0 || articles.length > 0) && <section className="ax-sec" aria-labelledby="ax-res-h"><SectionHead id="ax-res-h" title={forYouReads.length ? 'Reads for you' : 'Reads'} onAll={() => go('resources')} allLabel="Open Library" />{readRow(forYouReads.length ? forYouReads : articles.slice(0, 4))}</section>}
    </>;
  }

  return <div className="ax" data-tour="explore">
    <MobileHeader onOpenSaved={onOpenSaved} />
    <header className="ax-top">
      <h1 className="ax-title">Explore</h1>
      <SearchBar placeholder="Search products, symptoms, topics, services..." ariaLabel="Search Explore" value={query} onChange={(e) => setQuery(e.target.value)} suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }} onPick={(s) => setQuery(s.query)} />
      {q.length < 2 && recent.length > 0 && <div className="ax-recent" role="group" aria-label="Recent searches"><span>Recent</span>{recent.map((r) => <button type="button" key={r} onClick={() => setQuery(r)}>{r}</button>)}<button type="button" className="ax-recent__clear" onClick={() => setRecent(clearRecentSearches())}>Clear</button></div>}
      {chips}
    </header>
    {body}
    <LegalFooter />
  </div>;
}
