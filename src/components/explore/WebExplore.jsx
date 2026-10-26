import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../ProductCard.jsx';
import ReadCard from '../library/ReadCard.jsx';
import ServiceCard from '../cards/ServiceCard.jsx';
import NeedTiles from './NeedTiles.jsx';
import CardRail, { CardGrid } from './CardRail.jsx';
import { needGroups } from './needGroups.js';
import { Chip, ChipRow, StickerButton, OutlineButton } from '../ui/ay';
import { featuredOrder } from '../../data/packshots.js';
import { rankReadsForProfile } from '../../mobile/utils/personalReads.js';
import { trackCardClicked, eventSurface } from '../../utils/analyticsEvents.js';
import { ARTICLES } from '../Articles.jsx';
import { ExploreHeader } from './ExploreNav.jsx';
import { FOR_YOU_EMPTY } from '../nav/mainTabs.js';
import { ALL_PRODUCTS, getProductById, getProductMatchDetailsForProduct, filterPrescriptionCareGate, fitsHerProfile } from '../../data/products.js';
import { RELEASED_STARTUPS, SERVICE_FORMATS, serviceFacts } from '../../data/startups.js';
import { matchBadge, isSafetyHold } from '../../utils/matchDisplay.js';
import { whyLine } from '../../utils/whyLine.js';
import { matchBreakdownFor } from '../pdp/decision.js';
import { searchExplore, matchTopics, splitCatalog, isService } from '../../utils/search/exploreSearch.js';
import { searchSuggestions } from '../../utils/search/index.js';
import { readRecentSearches, rememberSearch, clearRecentSearches } from '../../utils/search/recentSearches.js';
import { searchCommunityTolerant } from '../../utils/search/communitySearch.js';
import { searchCommunity } from '../../utils/community/communityStore.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { postLine } from '../../hooks/useSavedPosts.js';
import { FAMILIAR_PHRASES } from '../shop/shopNeeds.js';

const ROW = 8;
const plainClick = (e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

// The same items the Shop lists: the catalog (prescription gate applied) and released services.
function exploreCatalog() {
  return [
    ...filterPrescriptionCareGate(ALL_PRODUCTS),
    ...RELEASED_STARTUPS.map((s) => ({ ...s, type: 'digital', summary: s.description || s.tagline, price: s.stage || '' })),
  ];
}

function readQuery() {
  try { return new URLSearchParams(window.location.search).get('q') || ''; } catch { return ''; }
}

function useCommunityPosts(query) {
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
 * Explore on the website (founder, Oct 24 2026; UX spec 11 and 26): search
 * across everything, then For you, Health topics, Products, Services and
 * Resources. Products is the Shop and Resources is the Library (App.jsx
 * mounts those pages under the same header); this page is the overview and
 * the For you, Categories and Services tabs. Search covers the full catalog:
 * her profile ranks and annotates (the % match), it never hides results.
 */
export default function WebExplore({
  section = 'overview', onSection, quizResults = null, healthProfile = null, matchOpts, savedProducts = {}, myProducts = {},
  onToggleSaved, onOpenProduct, onOpenArticle, onStartQuiz, onOpenCommunityPost, onOpenCommunity, recommendedProductIds = [],
}) {
  const [query, setQuery] = useState(readQuery);
  const [serviceFormat, setServiceFormat] = useState('');
  const q = query.trim();
  // As she types: suggestions, matching categories, and her recent searches (team direction 54).
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState(readRecentSearches);
  const commit = (text) => { setQuery(text); setRecent(rememberSearch(text)); setFocused(false); };
  const suggestions = useMemo(() => (q.length >= 2 ? searchSuggestions(q, { limit: 5, kinds: ['need', 'category', 'brand', 'product'] }) : []), [q]);
  const typedTopics = useMemo(() => (q.length >= 2 ? matchTopics(q).slice(0, 3) : []), [q]);
  // The query lives in ?q= so a search can be shared and survives a refresh.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (q.length >= 2) url.searchParams.set('q', q); else url.searchParams.delete('q');
      const next = `${url.pathname}${url.search}${url.hash}`;
      if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(window.history.state, '', next);
    } catch { /* history unavailable */ }
  }, [q]);
  const catalog = useMemo(() => exploreCatalog(), []);
  // Same split as the app (QA3 M8): services (startups and catalog services like Visana, Midi) apart from products.
  const { products, services } = useMemo(() => splitCatalog(catalog), [catalog]);
  const searching = q.length >= 2;
  const results = useMemo(() => (searching ? searchExplore(q, { items: catalog, articles: ARTICLES }) : null), [searching, q, catalog]);
  const posts = useCommunityPosts(searching ? q : '');
  const hasProfile = Boolean(quizResults);
  const forYou = useMemo(() => (hasProfile ? (recommendedProductIds || []).map((id) => getProductById(id)).filter(Boolean).slice(0, ROW) : []), [hasProfile, recommendedProductIds]);

  const detailsOf = (p) => (hasProfile ? getProductMatchDetailsForProduct(p, quizResults, healthProfile, matchOpts) : null);
  const card = (p, i, source) => {
    const details = detailsOf(p);
    const badge = details ? matchBadge(details) : null;
    const pct = badge ? badge.percent : null;
    // The reason line from the one engine's breakdown (src/matching), else the why line.
    const why = pct != null ? (matchBreakdownFor(p, details).reason || whyLine(p, details)) : '';
    const common = { key: p.id, isSaved: !!savedProducts[p.id], onToggleSaved, matchPercent: pct, matchHold: isSafetyHold(details), matchLabel: badge ? badge.label : '', why,
      onSeeMatch: !hasProfile && onStartQuiz ? () => onStartQuiz() : null };
    const open = (item) => { trackCardClicked({ surface: eventSurface(), where: source, product_id: item.id, position: i }); onOpenProduct?.(item, { source, position: i }); };
    if (isService(p)) return <ServiceCard {...common} service={p} onOpen={open} />;
    return <ProductCard {...common} product={p} inEcosystem={!!myProducts[p.id]} onOpen={open} />;
  };
  const productRow = (items, source) => <CardRail items={items} source={source} render={card} />;
  const grid = (items, source) => <CardGrid items={items} source={source} render={card} />;
  const readRow = (items) => <ul className="wx-reads">{items.map((a) => <li key={a.id}><ReadCard article={a} layout="rail" href={`/library/${a.id}`} onOpen={() => onOpenArticle?.(a.id)} /></li>)}</ul>;
  const pickTopic = (label) => { commit(label); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const topicChips = (items, label = 'Needs') => <ChipRow label={label} className="wx-topics">{items.map((t) => <Chip key={t.key} onClick={() => pickTopic(t.label)}>{t.label}</Chip>)}</ChipRow>;
  const head = (id, title, all = null) => <div className="wx-head"><h2 className="ay-h2" id={id}>{title}</h2>{all}</div>;
  const allLink = (key, label, search = '') => {
    const href = { products: '/explore/products', resources: '/explore/resources', topics: '/explore/topics', services: '/explore/services' }[key];
    return <a className="wx-all" href={href} onClick={(e) => { if (!plainClick(e)) return; e.preventDefault(); onSection?.(key, search); }}>{label}</a>;
  };
  // Products for the For you rail: Featured order (packshots she can buy now first, pre-orders last).
  const firstLook = useMemo(() => featuredOrder(products).slice(0, ROW), [products]);
  const forYouReads = useMemo(() => (hasProfile ? rankReadsForProfile(ARTICLES, quizResults).slice(0, 6) : []), [hasProfile, quizResults]);

  let body;
  if (searching) {
    const r = results;
    body = <div className="wx-results" aria-live="polite">
      {r.total === 0 && posts.length === 0 && <p className="wx-empty">Nothing matches “{q}” yet. Try a symptom, a topic or a product type.</p>}
      {r.topics.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-topics">{head('wx-r-topics', 'Needs')}{topicChips(r.topics)}</section>}
      {r.products.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-products">{head('wx-r-products', 'Products', allLink('products', `See all ${r.products.length} in Products`, q))}{productRow(r.products.slice(0, ROW), 'explore_search')}</section>}
      {r.services.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-services">{head('wx-r-services', 'Services')}{productRow(r.services.slice(0, ROW), 'explore_search')}</section>}
      {r.resources.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-res">{head('wx-r-res', 'Reads', allLink('resources', 'All reads'))}{readRow(r.resources.slice(0, 4))}</section>}
      {posts.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-comm">{head('wx-r-comm', 'Community', onOpenCommunity && <button type="button" className="wx-all" onClick={() => onOpenCommunity(q)}>Search Community</button>)}
        <ul className="wx-posts">{posts.map((p) => { const line = postLine(p, 160); return <li key={p.id}><a href={`/community/p/${p.id}`} onClick={(e) => { if (!plainClick(e)) return; e.preventDefault(); onOpenCommunityPost?.(p.id); }}><small>{line.kind}</small><span>{line.text}</span></a></li>; })}</ul>
      </section>}
    </div>;
  } else if (section === 'topics') {
    body = <>
      {/* By need tiles first (her words, a real product each), then the topics as grouped chips. */}
      <section className="wx-sec wx-needs" aria-labelledby="wx-needs-h">{head('wx-needs-h', 'By need')}<NeedTiles onPick={pickTopic} /></section>
      <section className="wx-sec" aria-labelledby="wx-topics-h">{head('wx-topics-h', 'All needs')}
        <div className="wx-groups">{needGroups().map((g) => <div key={g.id} className="wx-group"><h3 className="wx-group__h" id={`wx-g-${g.id}`}>{g.label}</h3>{topicChips(g.topics, g.label)}</div>)}</div>
      </section>
      {/* The "Does this sound familiar?" phrases (team direction 17). */}
      <section className="wx-sec" aria-labelledby="wx-phrases-h">{head('wx-phrases-h', 'Searches people make')}<ChipRow label="Searches people make" className="wx-topics">{FAMILIAR_PHRASES.map((t) => <Chip key={t} onClick={() => pickTopic(t)}>{t}</Chip>)}</ChipRow></section>
    </>;
  } else if (section === 'services') {
    const formats = SERVICE_FORMATS.filter((f) => services.some((x) => serviceFacts(x).format === f));
    const shown = serviceFormat ? services.filter((x) => serviceFacts(x).format === serviceFormat) : services;
    body = <section className="wx-sec" aria-labelledby="wx-services-h">{head('wx-services-h', `Services (${services.length})`)}
      <ChipRow label="Filter services by format" className="wx-formats">
        <Chip selected={!serviceFormat} onClick={() => setServiceFormat('')}>All</Chip>
        {formats.map((f) => <Chip key={f} selected={serviceFormat === f} onClick={() => setServiceFormat(serviceFormat === f ? '' : f)}>{f}</Chip>)}
      </ChipRow>
      {grid(shown, 'explore_services')}
    </section>;
  } else {
    // For you. Signed out: one "Get your match" strip, needs, a first look at
    // products and reads. With a profile: her picks and reads for her.
    body = <>
      {hasProfile && forYou.length > 0
        ? <section className="wx-sec" aria-labelledby="wx-foryou-h">{head('wx-foryou-h', 'Picked for you', allLink('products', 'See all'))}{productRow(forYou, 'explore_for_you')}</section>
        : <section className="wx-sec wx-sec--strip" aria-labelledby="wx-foryou-h">
          <h2 className="ay-sr" id="wx-foryou-h">For you</h2>
          {hasProfile
            // She answered, nothing fits yet (QA M4): say so, never ask her to make a profile again.
            ? <div className="wx-strip"><p>{FOR_YOU_EMPTY}</p><OutlineButton onClick={() => { setQuery(''); onSection?.('products', ''); }}>Browse all products</OutlineButton></div>
            : <div className="wx-strip"><p>See how well each product matches you, and why.</p>{onStartQuiz && <StickerButton onClick={onStartQuiz}>Get your match</StickerButton>}</div>}
        </section>}
      {!hasProfile && <section className="wx-sec" aria-labelledby="wx-needs-h">{head('wx-needs-h', 'By need', allLink('topics', 'All needs'))}<NeedTiles onPick={pickTopic} max={4} className="is-row" /></section>}
      {!(hasProfile && forYou.length > 0) && <section className="wx-sec" aria-labelledby="wx-products-h">{head('wx-products-h', 'Products', allLink('products', 'See all products'))}{productRow((hasProfile ? products.filter((p) => fitsHerProfile(p, quizResults, healthProfile, matchOpts)) : firstLook).slice(0, ROW), 'explore_overview')}</section>}
      <section className="wx-sec" aria-labelledby="wx-res-h">{head('wx-res-h', forYouReads.length ? 'Reads for you' : 'Reads', allLink('resources', `All ${ARTICLES.length} reads`))}{readRow(forYouReads.length ? forYouReads : ARTICLES.slice(0, 6))}</section>
    </>;
  }

  return <div className="wx" data-tour="explore">
    <ExploreHeader active={section} stickers={forYou} onGo={(key) => { setQuery(''); onSection?.(key, ''); }}>
      <form className="wx-search" data-tour="explore-search" role="search" onSubmit={(e) => { e.preventDefault(); if (q.length >= 2) commit(q); }}
        onFocus={() => setFocused(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
        <label>
          <span className="ay-sr">Search Explore</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input id="wx-q" type="search" name="q" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setFocused(false); }} placeholder="Search products, symptoms, topics, services..." autoComplete="off" aria-describedby={focused ? 'wx-suggest' : undefined} />
          {query && <button type="button" className="wx-clear" onClick={() => setQuery('')} aria-label="Clear search">Clear</button>}
        </label>
        {focused && (q.length < 2 ? recent.length > 0 : suggestions.length + typedTopics.length > 0) && (
          <div className="wx-suggest" id="wx-suggest">
            {q.length < 2 ? <>
              <div className="wx-suggest__head"><span>Recent searches</span><button type="button" onClick={() => setRecent(clearRecentSearches())}>Clear</button></div>
              <ul>{recent.map((r) => <li key={r}><button type="button" onClick={() => commit(r)}>{r}</button></li>)}</ul>
            </> : <>
              {typedTopics.length > 0 && <><div className="wx-suggest__head"><span>Needs</span></div>
                <ul>{typedTopics.map((t) => <li key={t.key}><button type="button" onClick={() => commit(t.label)}>{t.label}</button></li>)}</ul></>}
              {suggestions.length > 0 && <><div className="wx-suggest__head"><span>Suggestions</span></div>
                <ul>{suggestions.slice(0, 5).map((x) => <li key={`${x.kind}-${x.label}`}><button type="button" onClick={() => commit(x.query || x.label)}>{x.label}</button></li>)}</ul></>}
            </>}
          </div>
        )}
      </form>
    </ExploreHeader>
    <div className="ay-container wx-body">{body}</div>
  </div>;
}
