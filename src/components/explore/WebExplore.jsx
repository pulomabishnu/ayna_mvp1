import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../ProductCard.jsx';
import ReadCover from '../library/ReadCover.jsx';
import { minutesFor } from '../library/readTime.js';
import { ARTICLES } from '../Articles.jsx';
import { ExploreHeader } from './ExploreNav.jsx';
import { FOR_YOU_EMPTY } from '../nav/mainTabs.js';
import { ALL_PRODUCTS, getProductById, getProductMatchDetailsForProduct, filterPrescriptionCareGate, fitsHerProfile } from '../../data/products.js';
import { RELEASED_STARTUPS } from '../../data/startups.js';
import { matchBadge, isSafetyHold } from '../../utils/matchDisplay.js';
import { whyLine } from '../../utils/whyLine.js';
import { matchBreakdownFor } from '../pdp/decision.js';
import { HEALTH_TOPICS, searchExplore, matchTopics } from '../../utils/search/exploreSearch.js';
import { searchSuggestions } from '../../utils/search/index.js';
import { readRecentSearches, rememberSearch, clearRecentSearches } from '../../utils/search/recentSearches.js';
import { searchCommunityTolerant } from '../../utils/search/communitySearch.js';
import { searchCommunity } from '../../utils/community/communityStore.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { postLine } from '../../hooks/useSavedPosts.js';
import { FAMILIAR_PHRASES } from '../shop/shopNeeds.js';
import { NeedStickers } from '../shop/ShopBits.jsx';

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
  const serviceIds = useMemo(() => new Set(RELEASED_STARTUPS.map((s) => String(s.id))), []);
  const products = useMemo(() => catalog.filter((p) => !serviceIds.has(String(p.id))), [catalog, serviceIds]);
  const services = useMemo(() => catalog.filter((p) => serviceIds.has(String(p.id))), [catalog, serviceIds]);
  const searching = q.length >= 2;
  const results = useMemo(() => (searching ? searchExplore(q, { items: catalog, articles: ARTICLES }) : null), [searching, q, catalog]);
  const posts = useCommunityPosts(searching ? q : '');
  const hasProfile = Boolean(quizResults);
  const forYou = useMemo(() => (hasProfile ? (recommendedProductIds || []).map((id) => getProductById(id)).filter(Boolean).slice(0, ROW) : []), [hasProfile, recommendedProductIds]);

  const card = (p, i, source) => {
    const details = hasProfile ? getProductMatchDetailsForProduct(p, quizResults, healthProfile, matchOpts) : null;
    const badge = details ? matchBadge(details) : null;
    const pct = badge ? badge.percent : null;
    return <ProductCard key={p.id} product={p} matchPercent={pct} matchHold={isSafetyHold(details)} matchLabel={badge ? badge.label : ''} why={pct != null ? (matchBreakdownFor(p, details).reason || whyLine(p, details)) : ''}
      onSeeMatch={!hasProfile && onStartQuiz ? () => onStartQuiz() : null}
      isSaved={!!savedProducts[p.id]} inEcosystem={!!myProducts[p.id]} onToggleSaved={onToggleSaved}
      onOpen={(item) => onOpenProduct?.(item, { source, position: i })} />;
  };
  const productRow = (items, source) => <div className="wx-row">{items.map((p, i) => card(p, i, source))}</div>;
  const readRow = (items) => <ul className="wx-reads">{items.map((a) => <li key={a.id}>
    <a href={`/library/${a.id}`} onClick={(e) => { if (!plainClick(e)) return; e.preventDefault(); onOpenArticle?.(a.id); }}>
      <ReadCover article={a} minutes={minutesFor(a)} />
      <span>{a.title}</span>
    </a>
  </li>)}</ul>;
  const topicChips = (items) => <div className="wx-topics" role="group" aria-label="Categories">{items.map((t) => <button key={t.key} type="button" className="ay-chip" onClick={() => { commit(t.label); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t.label}</button>)}</div>;
  const head = (id, title, all = null) => <div className="wx-head"><h2 className="ay-h2" id={id}>{title}</h2>{all}</div>;
  const allLink = (key, label, search = '') => {
    const href = { products: '/explore/products', resources: '/explore/resources', topics: '/explore/topics', services: '/explore/services' }[key];
    return <a className="wx-all" href={href} onClick={(e) => { if (!plainClick(e)) return; e.preventDefault(); onSection?.(key, search); }}>{label}</a>;
  };

  let body;
  if (searching) {
    const r = results;
    body = <div className="wx-results" aria-live="polite">
      {r.total === 0 && posts.length === 0 && <p className="wx-empty">Nothing matches “{q}” yet. Try a symptom, a topic or a product type.</p>}
      {r.topics.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-topics">{head('wx-r-topics', 'Categories')}{topicChips(r.topics)}</section>}
      {r.products.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-products">{head('wx-r-products', 'Products', allLink('products', `See all ${r.products.length} in Products`, q))}{productRow(r.products.slice(0, ROW), 'explore_search')}</section>}
      {r.services.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-services">{head('wx-r-services', 'Services')}{productRow(r.services.slice(0, ROW), 'explore_search')}</section>}
      {r.resources.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-res">{head('wx-r-res', 'Resources', allLink('resources', 'All reads'))}{readRow(r.resources.slice(0, 4))}</section>}
      {posts.length > 0 && <section className="wx-sec" aria-labelledby="wx-r-comm">{head('wx-r-comm', 'Community', onOpenCommunity && <button type="button" className="wx-all" onClick={() => onOpenCommunity(q)}>Search Community</button>)}
        <ul className="wx-posts">{posts.map((p) => { const line = postLine(p, 160); return <li key={p.id}><a href={`/community/p/${p.id}`} onClick={(e) => { if (!plainClick(e)) return; e.preventDefault(); onOpenCommunityPost?.(p.id); }}><small>{line.kind}</small><span>{line.text}</span></a></li>; })}</ul>
      </section>}
    </div>;
  } else if (section === 'topics') {
    body = <>
      {/* The approved "Shop by need" photo stickers (a real product per need) lead the one browse tab. */}
      <section className="wx-sec wx-needs" aria-labelledby="wx-needs-h">{head('wx-needs-h', 'By need')}<NeedStickers onPick={(text) => { commit(text); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></section>
      <section className="wx-sec" aria-labelledby="wx-topics-h">{head('wx-topics-h', 'Categories')}<p className="wx-note">Pick one to see products, services, reads and what the Community says.</p>{topicChips(HEALTH_TOPICS)}</section>
      {/* The "Does this sound familiar?" phrases, moved here from the product grid (team direction 17). */}
      <section className="wx-sec" aria-labelledby="wx-phrases-h">{head('wx-phrases-h', 'Searches people make')}<div className="wx-topics" role="group" aria-label="Searches people make">{FAMILIAR_PHRASES.map((t) => <button key={t} type="button" className="ay-chip" onClick={() => { commit(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t}</button>)}</div></section>
    </>;
  } else if (section === 'services') {
    body = <section className="wx-sec" aria-labelledby="wx-services-h">{head('wx-services-h', 'Services')}<p className="wx-note">Telehealth, at-home tests, apps and programs from women’s health companies.</p><div className="ay-product-grid wx-grid">{services.map((p, i) => card(p, i, 'explore_services'))}</div></section>;
  } else {
    // For you: her picks when she has a profile; otherwise one invite and a
    // first look at the catalog. Categories, Products, Services and Resources
    // each have their own tab, so they are not repeated here (direction 17).
    body = <>
      {hasProfile && forYou.length > 0
        ? <section className="wx-sec" aria-labelledby="wx-foryou-h">{head('wx-foryou-h', 'Picked for you', allLink('products', 'See all'))}{productRow(forYou, 'explore_for_you')}</section>
        : <section className="wx-sec" aria-labelledby="wx-foryou-h">
          <h2 className="ay-sr" id="wx-foryou-h">For you</h2>
          {hasProfile
            // She answered, nothing fits yet (QA M4): say so, never ask her to make a profile again.
            ? <div className="wx-invite is-empty">
              <h3>{FOR_YOU_EMPTY}</h3>
              <button type="button" className="ay-btn ay-btn--primary" onClick={() => { setQuery(''); onSection?.('products', ''); }}>Browse all products</button>
            </div>
            : <div className="wx-invite">
              <h3>See how well this matches you</h3>
              <p>Create your health profile to see your personalized match and why.</p>
              {onStartQuiz && <button type="button" className="ay-btn ay-btn--primary" onClick={onStartQuiz}>Create your health profile</button>}
            </div>}
        </section>}
      {!(hasProfile && forYou.length > 0) && <section className="wx-sec" aria-labelledby="wx-products-h">{head('wx-products-h', 'Products', allLink('products', 'See all products'))}{productRow((hasProfile ? products.filter((p) => fitsHerProfile(p, quizResults, healthProfile, matchOpts)) : products).slice(0, ROW), 'explore_overview')}</section>}
      <section className="wx-sec" aria-labelledby="wx-res-h">{head('wx-res-h', 'Resources', allLink('resources', `All ${ARTICLES.length} reads`))}{readRow(ARTICLES.slice(0, 6))}</section>
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
              {typedTopics.length > 0 && <><div className="wx-suggest__head"><span>Categories</span></div>
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
