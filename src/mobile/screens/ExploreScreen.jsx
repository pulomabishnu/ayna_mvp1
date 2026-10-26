import { useEffect, useMemo, useState } from 'react';
import { Seal } from '../../components/personality/Bits.jsx';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import ProductCard from '../components/ProductCard.jsx';
import LibraryScreen from './LibraryScreen.jsx';
import ReadCard from '../../components/library/ReadCard.jsx';
import ServiceCard from '../../components/cards/ServiceCard.jsx';
import NeedTiles from '../../components/explore/NeedTiles.jsx';
import { needGroups } from '../../components/explore/needGroups.js';
import { Chip, ChipRow, PillTabs, StickerButton, OutlineButton } from '../../components/ui/ay';
import { featuredOrder } from '../../data/packshots.js';
import { SERVICE_FORMATS, serviceFacts } from '../../data/startups.js';
import { productMatch } from '../utils/matchScore.js';
import { matchBadge, isSafetyHold } from '../../utils/matchDisplay.js';
import { matchBreakdownFor } from '../../components/pdp/decision.js';
import { trackCardClicked, eventSurface } from '../../utils/analyticsEvents.js';
import { AppRow, AppGrid } from './ExploreRows.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import BrowseScreen from './BrowseScreen.jsx';
import { APP_EXPLORE_SECTIONS as EXPLORE_SECTIONS, FOR_YOU_EMPTY } from '../../components/nav/mainTabs.js';
import { searchExplore, splitCatalog, isService } from '../../utils/search/exploreSearch.js';
import { searchCommunityTolerant } from '../../utils/search/communitySearch.js';
import { searchCommunity } from '../../utils/community/communityStore.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { rankReadsForProfile } from '../utils/personalReads.js';
import { readRecentSearches, rememberSearch, clearRecentSearches } from '../../utils/search/recentSearches.js';
import { FAMILIAR_PHRASES } from '../../components/shop/shopNeeds.js';
import { fitsHerProfile } from '../../data/catalog.js';
import '../explore.css';
import '../explore-v9.css';

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
 * Explore in the app (Explore audit, Oct 25): search on top, then the same
 * five sections as the website as pill tabs that never scroll: For you ·
 * Needs · Products · Services · Reads. Products is the whole Shop (filters,
 * sort, Best match unchanged); Reads is the Library's reads. Browsing works
 * with no profile at all.
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
  const [serviceFormat, setServiceFormat] = useState('');
  const { products: catalog, services } = useMemo(() => splitCatalog(products), [products]);
  const results = useMemo(() => (searching ? searchExplore(q, { items: products, articles }) : null), [searching, q, products, articles]);
  const posts = useCommunityResults(searching ? q : '');
  const hasProfile = Boolean(lastQuizAnswers || quizAnswers);
  const forYouReads = useMemo(() => (hasProfile ? rankReadsForProfile(articles, quizAnswers || lastQuizAnswers).slice(0, 4) : []), [hasProfile, articles, quizAnswers, lastQuizAnswers]);
  const forYouProducts = hasProfile ? suggestedEcosystemProducts.slice(0, ROW) : [];
  const go = (key, search = '') => { setQuery(''); onExploreSection?.(key, search); };

  const card = (p, i = 0, where = 'app_explore') => {
    const open = () => { trackCardClicked({ surface: eventSurface(), where, product_id: p.id, position: i }); onOpenProduct?.(p); };
    if (isService(p)) {
      const d = hasProfile ? productMatch(p, quizAnswers || lastQuizAnswers, matchOpts) : null;
      const badge = d ? matchBadge(d) : null;
      return <div className="ax-item" key={p.id}><ServiceCard service={p} as="button" onOpen={open} isSaved={!!savedProducts[p.id]} onToggleSaved={onToggleSaved}
        matchPercent={badge ? badge.percent : null} matchHold={isSafetyHold(d)} matchLabel={badge ? badge.label : ''} why={badge ? (matchBreakdownFor(p, d).reason || '') : ''}
        onShowWhy={onOpenWhyMatch} onSeeMatch={!hasProfile && onStartQuiz ? () => onStartQuiz() : null} /></div>;
    }
    return <div className="ax-item" key={p.id}><ProductCard product={p} onClick={open} quizAnswers={quizAnswers} matchOpts={matchOpts} onOpenWhyMatch={onOpenWhyMatch} isSaved={!!savedProducts[p.id]} onToggleSaved={onToggleSaved} onSeeMatch={!hasProfile && onStartQuiz ? () => onStartQuiz() : null} /></div>;
  };
  const productRow = (items, where) => <AppRow items={items} where={where} render={card} />;
  const readRow = (items) => <div className="ax-row is-reads">{items.map((a) => <div className="ax-item is-read" key={a.id}><ReadCard article={a} layout="rail" onOpen={() => onOpenArticle?.(a)} /></div>)}</div>;
  const pick = (label) => { setQuery(label); setRecent(rememberSearch(label)); };
  const topicChips = (items, label = 'Needs') => <ChipRow label={label} className="ax-topics">{items.map((t) => <Chip key={t.key} onClick={() => pick(t.label)}>{t.label}</Chip>)}</ChipRow>;

  const chips = <nav className="ax-sections" data-tour="explore-sections" aria-label="Explore sections">
    <PillTabs idBase="ax" label="Explore sections" active={section} onChange={(key) => go(key)} tabs={EXPLORE_SECTIONS.map((s) => ({ id: s.key, label: s.label }))} />
  </nav>;
  const top = (withSearch) => <header className="ax-top">
    <h1 className="ax-title">Explore</h1>
    <Seal className="ax-seal" />
    {withSearch && <SearchBar placeholder="Search products, symptoms, topics, services..." ariaLabel="Search Explore" value={query} onChange={(e) => setQuery(e.target.value)} suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }} onPick={(s) => setQuery(s.query)} />}
    {withSearch && q.length < 2 && recent.length > 0 && <div className="ax-recent" role="group" aria-label="Recent searches"><span>Recent</span>{recent.map((r) => <button type="button" key={r} onClick={() => setQuery(r)}>{r}</button>)}<button type="button" className="ax-recent__clear" onClick={() => setRecent(clearRecentSearches())}>Clear</button></div>}
    {chips}
  </header>;

  // Products: the existing Shop, under Explore's header.
  if (section === 'products') {
    return <div className="ax ax--embed" data-tour="explore">
      <MobileHeader onOpenSaved={onOpenSaved} />
      {top(false)}
      {/* Products only (QA3 M8): services live in the Services tab. */}
      <BrowseScreen {...props} products={catalog} embedded />
    </div>;
  }
  // Reads: the Library's reads, now a tab of Explore (Explore audit: "Reads" everywhere).
  if (section === 'resources') {
    return <div className="ax ax--embed" data-tour="explore">
      <MobileHeader onOpenSaved={onOpenSaved} />
      {top(false)}
      <LibraryScreen {...props} embedded />
    </div>;
  }

  let body;
  if (searching) {
    const r = results;
    const none = r.total === 0 && posts.length === 0;
    body = <div className="ax-results" aria-live="polite">
      {none && <p className="ax-empty">Nothing matches “{q}” yet. Try a symptom, a topic or a product type.</p>}
      {r.topics.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-topics"><SectionHead id="ax-r-topics" title="Needs" />{topicChips(r.topics)}</section>}
      {r.products.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-products"><SectionHead id="ax-r-products" title="Products" onAll={() => go('products', q)} allLabel={`See all ${r.products.length}`} />{productRow(r.products.slice(0, ROW), 'app_explore_search')}</section>}
      {r.services.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-services"><SectionHead id="ax-r-services" title="Services" />{productRow(r.services.slice(0, ROW), 'app_explore_search')}</section>}
      {r.resources.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-res"><SectionHead id="ax-r-res" title="Reads" onAll={() => go('resources')} allLabel="All reads" />{readRow(r.resources.slice(0, 4))}</section>}
      {posts.length > 0 && <section className="ax-sec" aria-labelledby="ax-r-comm"><SectionHead id="ax-r-comm" title="Community" onAll={onGoCommunity} allLabel="Open Community" />
        <ul className="ax-posts">{posts.map((p) => <li key={p.id}><button type="button" onClick={() => onOpenCommunityPost?.(p.id)}><small>{postKind(p)}</small><span>{String(p.body || '').slice(0, 140)}{String(p.body || '').length > 140 ? '…' : ''}</span></button></li>)}</ul>
      </section>}
    </div>;
  } else if (section === 'topics') {
    body = <>
      <section className="ax-sec" aria-labelledby="ax-needs-h"><SectionHead id="ax-needs-h" title="By need" /><div className="ax-pad"><NeedTiles onPick={pick} /></div></section>
      <section className="ax-sec" aria-labelledby="ax-topics-h"><SectionHead id="ax-topics-h" title="All needs" />
        <div className="ax-groups">{needGroups().map((g) => <div key={g.id} className="ax-group"><h3 className="ax-group__h">{g.label}</h3>{topicChips(g.topics, g.label)}</div>)}</div>
      </section>
      {/* The "Does this sound familiar?" phrases (team direction 17). */}
      <section className="ax-sec" aria-labelledby="ax-phrases-h"><SectionHead id="ax-phrases-h" title="Searches people make" />
        <ChipRow label="Searches people make" className="ax-topics">{FAMILIAR_PHRASES.map((t) => <Chip key={t} onClick={() => pick(t)}>{t}</Chip>)}</ChipRow>
      </section>
    </>;
  } else if (section === 'services') {
    const formats = SERVICE_FORMATS.filter((f) => services.some((x) => serviceFacts(x).format === f));
    const shown = serviceFormat ? services.filter((x) => serviceFacts(x).format === serviceFormat) : services;
    body = <section className="ax-sec" aria-labelledby="ax-services-h"><SectionHead id="ax-services-h" title={`Services (${services.length})`} />
      <ChipRow label="Filter services by format" className="ax-topics ax-formats">
        <Chip selected={!serviceFormat} onClick={() => setServiceFormat('')}>All</Chip>
        {formats.map((f) => <Chip key={f} selected={serviceFormat === f} onClick={() => setServiceFormat(serviceFormat === f ? '' : f)}>{f}</Chip>)}
      </ChipRow>
      <AppGrid items={shown} where="app_explore_services" render={card} />
    </section>;
  } else {
    // For you: her picks, or one "Get your match" strip, needs and a first look.
    body = <>
      <section className="ax-sec" aria-labelledby="ax-foryou-h">
        {hasProfile && forYouProducts.length > 0
          ? <><SectionHead id="ax-foryou-h" title="Picked for you" onAll={() => go('products')} allLabel="See all" />{productRow(forYouProducts, 'app_explore_for_you')}</>
          : hasProfile
            // She answered, nothing fits yet (QA M4): say so, never ask her to make a profile again.
            ? <><h2 id="ax-foryou-h" className="sr-only">For you</h2><div className="ax-strip"><p>{FOR_YOU_EMPTY}</p><OutlineButton onClick={() => go('products')}>Browse all products</OutlineButton></div></>
            : <><h2 id="ax-foryou-h" className="sr-only">For you</h2><div className="ax-strip"><p>See how well each product matches you, and why.</p>{onStartQuiz && <StickerButton onClick={onStartQuiz}>Get your match</StickerButton>}</div></>}
      </section>
      {!hasProfile && <section className="ax-sec" aria-labelledby="ax-needs-h"><SectionHead id="ax-needs-h" title="By need" onAll={() => go('topics')} allLabel="All needs" /><div className="ax-pad"><NeedTiles onPick={pick} max={4} className="is-row" /></div></section>}
      {!(hasProfile && forYouProducts.length > 0) && <section className="ax-sec" aria-labelledby="ax-products-h"><SectionHead id="ax-products-h" title="Products" onAll={() => go('products')} allLabel="See all" />{productRow((hasProfile ? catalog.filter((p) => fitsHerProfile(p, quizAnswers || lastQuizAnswers, null, matchOpts || undefined)) : featuredOrder(catalog)).slice(0, ROW), 'app_explore_overview')}</section>}
      {(forYouReads.length > 0 || articles.length > 0) && <section className="ax-sec" aria-labelledby="ax-res-h"><SectionHead id="ax-res-h" title={forYouReads.length ? 'Reads for you' : 'Reads'} onAll={() => go('resources')} allLabel="All reads" />{readRow(forYouReads.length ? forYouReads : articles.slice(0, 4))}</section>}
    </>;
  }

  return <div className="ax" data-tour="explore">
    <MobileHeader onOpenSaved={onOpenSaved} />
    {top(true)}
    {body}
    <LegalFooter />
  </div>;
}
