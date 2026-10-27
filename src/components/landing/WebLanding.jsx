import React, { useEffect, useMemo, useState } from 'react';
import MedicalNote from '../MedicalNote.jsx';
import { sentenceCase } from '../../utils/sentenceCase.js';
import { useRecommendationViews } from '../../utils/recommendationAnalytics';
import { productsForNeed } from '../landingNeeds';
import { isPlainLeftClick } from '../../utils/productRoute';
import { isPartnerBrandItem } from '../../utils/partnerBrands';
import { getWeeklyTrendingLineup } from '../../utils/trendingLineup';
import { ALL_PRODUCTS, MACRO_GROUPS, basicsProductIds, useCatalogReady } from '../../data/catalog.js';
import { shopCatalogCounts } from '../../data/catalogCounts.js';
import { brandOf } from '../../mobile/data/brandFallback.js';
import ProductCard from '../ProductCard';
import { useLatestAnnouncement } from '../../hooks/useLatestAnnouncement';
import '../../styles/editorial.css';
import '../../styles/home.css';
import '../../styles/loop-a-landing.css';
import '../../styles/uq-landing.css';
import Photo from '../ui/Photo.jsx';
import { Chip, Band, Bento, Tile, SnapCarousel, ScallopEdge } from '../ui/ay';
import SlideToStart from '../ui/SlideToStart.jsx';
import { Rain, HeroSearch, BrandBar } from './kit.jsx';
import './web-landing.css';

/* The website's / (founder, Oct 27 10:40: "i liked how we had the website
 * ... optimize it for web"). The v2 website home is back, desktop-first, with
 * the raining cut-outs brought into its hero. Styles: src/styles/home.css
 * (hm-*), uq-landing.css (colour-blocked bands) and ./web-landing.css (the
 * hero, Pro and the closing note).
 *
 * Colour-blocked bands, adjacent bands never the same colour:
 *   1 hero: everything centred (a moderate title, search, Slide to start)
 *     over a faded layer of real products falling as cut-outs (./kit.jsx)
 *   2 partner marquee, pink seam (Pause motion stops it and the rain)
 *   3 does this sound familiar + needs, butter band
 *   4 how it works as a Bento (steps + catalog numbers), espresso band
 *   5 reads + community, pink band
 *   6 ayna Pro (Early Access, links to /pro), espresso band
 *   7 founders, butter band, then the medical note
 * One page for everyone; signed in with a profile, the main action is
 * "Go to your Home". Nothing on the page is sticky. */

const NEEDS_PHOTO = (p) => !/tampon tribe|herau|r[eè]sa/i.test(`${p?.brand || ''} ${p?.name || ''}`);

const Arrow = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>);

/* CTAs that go somewhere are links (open in a new tab, copy the address), not buttons. */
function Go({ href, onGo, className, children }) {
  return <a className={className} href={href} onClick={(e) => { if (!onGo || !isPlainLeftClick(e)) return; e.preventDefault(); onGo(); }}>{children}</a>;
}

/* ---------- 1. hero ----------
   Founder, Oct 27 11:32-11:36: the rain in the back, faded; the title in the
   middle, not huge; clean, but keep the fun and the brown and pink bar.
   The espresso band she liked, ending in the wavy edge, with the falling
   cut-outs as a faded layer on both sides (soft butter circles on espresso)
   and everything centred on top: a two-line title with a pink highlighter
   swipe on "your body.", one line, the search, Slide to start (the welcome
   tip's anchor) and How we match. The brown and pink bar runs under it. */
function Hero({ cta, onSearch, onViewHowItWorks, banner = null }) {
  return (
    <section className="wl-hero" aria-labelledby="hm-hero-title">
      <div className="wl-hero__band">
        <Rain cols={4} onInk className="wl-rain" />
        <div className="wl-hero__in">
          {/* One promise on the website and the app (landing audit 4 and 9). */}
          <h1 id="hm-hero-title" className="wl-title">Find what fits <span><mark>your body.</mark></span></h1>
          <p className="wl-lead">Women’s health products matched to you, with the evidence beside each one.</p>
          <HeroSearch onSearch={onSearch} className="wl-search" />
          <SlideToStart className="wl-sts" tour="landing-start" label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
          <a className="wl-how" href="/how-it-works" onClick={(e) => { if (!onViewHowItWorks || !isPlainLeftClick(e)) return; e.preventDefault(); onViewHowItWorks(); }}>How we match<Arrow /></a>
          {banner && <div className="wl-banner">{banner}</div>}
        </div>
      </div>
      <ScallopEdge shape="wave" tone="ink" className="wl-edge" />
    </section>
  );
}

// Core needs lead (periods, intimate care, menopause, pelvic floor); creams, sleep and gadgets come after.
const CORE = /pad|tampon|cup|disc|period|intimate|vaginal|menopause|pelvic|uti|cramp|fertility|postpartum|pregnan/i;
function weeklyLineup() {
  const list = getWeeklyTrendingLineup(ALL_PRODUCTS).map((x) => x.product)
    .filter((p) => p?.image && NEEDS_PHOTO(p) && !/sex|intimacy|toy/i.test(String(p.category || '')) && !/\banal\b|vibrator|dildo|mouth tape/i.test(String(p.name || '')));
  const core = list.filter((p) => CORE.test(`${p.category} ${(p.healthFunctions || []).join(' ')}`));
  return [...core, ...list.filter((p) => !core.includes(p))];
}

/* ---------- 3. does this sound familiar + needs (pink band) ----------
   Landing audit 6: the four phrases on the left; on the right six needs (plus
   All needs) and four products. With no need picked the four are this week's
   picks (signed in: her top picks). Each phrase is a common need from the quiz
   (WebIntake.jsx COMMON_NEEDS), said the way people say it; these are prompts,
   not testimonials. Signed out, every card says "See your match" (no number). */
const FAMILIAR = [
  { q: 'My cramps knock me out every month.', need: 'Cramps or period pain', photo: '/landing/pajamas-overhead.webp' },
  { q: 'I bleed through everything.', need: 'Heavy periods', photo: '/landing/sink-flatlay.webp' },
  { q: 'I leak a little when I sneeze.', need: 'Bladder leakage or incontinence', photo: '/landing/curlers-call.webp' },
  { q: 'Things feel dry down there.', need: 'Vaginal dryness', photo: '/landing/robe-vanity.webp' },
];
const SHOWN_NEEDS = 6;
function Phrases({ onSearch }) {
  return (
    // Founder Oct 26 20:17: a peeking snap carousel of photo-led cards instead of stacked rows.
    // Founder Oct 27: no stickers, so the photos carry no die-cut product on their corner any more.
    <SnapCarousel label="Does this sound familiar?" size="card" className="hm-needs-snap" items={FAMILIAR.map((t) => ({ key: t.q, node: (
      <a className="hm-needs__row" href={`/explore/products?q=${encodeURIComponent(t.need)}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onSearch?.(t.need); }}>
        <span className="hm-needs__ph"><Photo src={t.photo} alt="" sizes="(max-width: 640px) 90vw, 420px" loading="lazy" decoding="auto" /></span>
        <span className="hm-needs__quote">“{t.q}”</span>
        <span className="hm-needs__go">See what helps <Arrow /></span>
      </a>
    ) }))} />
  );
}
function NeedsBand({ onOpenProduct, onViewDiscovery, onSearch, picks = null, signedOut = true }) {
  const ready = useCatalogReady();
  const weekly = useMemo(() => (ready ? weeklyLineup().slice(0, 4) : []), [ready]);
  // Member picks: only products with a real photo, drugstore basics last.
  const personal = useMemo(() => {
    if (!picks) return null;
    const shown = picks.filter((p) => p?.image && NEEDS_PHOTO(p));
    const basics = basicsProductIds();
    return [...shown.filter((p) => !basics.has(p.id)), ...shown.filter((p) => basics.has(p.id))];
  }, [picks, ready]);
  const mine = Boolean(personal && personal.length >= 2);
  const pickItems = mine ? personal.slice(0, 4) : weekly;
  // recommendation_viewed for her top picks (not the weekly picks everyone sees).
  useRecommendationViews(mine ? pickItems : null, 'home_top_picks');
  const needs = useMemo(() => MACRO_GROUPS.filter((g) => g.id !== 'all')
    .map((g) => ({ id: g.id, label: sentenceCase(g.label), group: g.id }))
    .map((n) => ({ ...n, pool: productsForNeed(n).filter(NEEDS_PHOTO).sort((a, b) => Number(isPartnerBrandItem(b)) - Number(isPartnerBrandItem(a))) }))
    .filter((n) => n.pool.length >= 2)
    .slice(0, SHOWN_NEEDS), [ready]);
  const [id, setId] = useState(null);
  const need = needs.find((n) => n.id === id) || null;
  let four = pickItems;
  if (need) {
    const partner = need.pool.filter((p) => isPartnerBrandItem(p)).slice(0, 1);
    const rest = need.pool.filter((p) => !isPartnerBrandItem(p));
    four = [...partner, ...rest].slice(0, 4).sort((a, b) => need.pool.indexOf(a) - need.pool.indexOf(b));
  }
  const loading = !ready || (!need && four.length < 2);
  if (ready && !needs.length && four.length < 2) return null;
  const listName = need ? `${need.label} products` : mine ? 'Top picks for you' : 'This week’s picks';
  return (
    <Band tone="butter" className="hm-sec hm-needsband hm-band" aria-labelledby="hm-familiar-title">
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-familiar-title" className="hm-h2">{signedOut ? 'Does this sound familiar?' : 'Explore by need'}</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/explore/products" onGo={() => onViewDiscovery?.('')}><span className="hm-head__long">See all products</span><span className="hm-head__short">See all<span className="ed-sr"> products</span></span><Arrow /></Go>
        </header>
        <div className={`hm-needsband__grid${signedOut ? '' : ' is-single'}`}>
          {signedOut && <Phrases onSearch={onSearch} />}
          <div className="hm-shop">
            <div className="hm-chips" role="group" aria-label="Choose a need">
              {needs.length ? <>
                {needs.map((n) => (<Chip key={n.id} selected={n.id === need?.id} onClick={() => setId(n.id === id ? null : n.id)}>{n.label} <span className="hm-chips__count"><span className="ed-sr">, </span>{n.pool.length}<span className="ed-sr"> products</span></span></Chip>))}
                <Go className="ayk-chip hm-chips__all" href="/explore/products" onGo={() => onViewDiscovery?.('')}>All needs<Arrow /></Go>
              </> : [0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="hm-chips__skel" aria-hidden="true" />)}
            </div>
            <p className="hm-shop__label" aria-live="polite">{listName}</p>
            <ul className="hm-stickers" key={need?.id || 'picks'} aria-label={loading ? 'Loading products' : listName}>
              {!loading ? four.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} onOpen={onOpenProduct} className="hm-sticker" />
                </li>
              )) : [0, 1, 2, 3].map((i) => <li key={i} aria-hidden="true"><div className="hm-sticker__skel" /></li>)}
            </ul>
            {need && (
              <div className="hm-shop__foot">
                <Go className="ay-btn ay-btn--secondary" href="/explore/products" onGo={() => onViewDiscovery?.(need.group ? { initialMacroGroup: need.group } : '')}>See all {need.label.toLowerCase()} products</Go>
              </div>
            )}
          </div>
        </div>
      </div>
    </Band>
  );
}

/* ---------- 4. how it works + evidence (espresso band) ----------
   Landing audit 6: three steps (Answer, We check the evidence, You decide),
   the three-level meter inside step 2, the four catalog numbers beneath and
   the one call to action. Each step keeps its approved photo; the real piece
   of ayna it describes sits on the photo as a sticker. */
const STEPS = [
  { t: 'Answer a few short questions', d: 'About your body, your life stage and what you avoid.', ui: 'quiz', src: '/landing/hiw-questions-cabinet.webp', pos: '50% 35%' },
  { t: 'We check the evidence', d: 'Across products, apps and care.', ui: 'evidence', src: '/landing/hiw-evidence-reading.webp', pos: '50% 40%' },
  { t: 'You decide', d: 'Nothing is bought until you say so.', ui: 'decide', src: '/landing/hiw-decide-basket.webp', pos: '50% 45%' },
];
// Real life-stage options from the quiz (intakeModel LIFE_STAGE_LABELS), so the first step shows who ayna is for.
const STAGE_CHIPS = ['Regular periods', 'Postpartum', 'Perimenopause', 'Post-menopause'];
function StepUI({ kind }) {
  if (kind === 'quiz') return <span className="hm-stepui is-quiz" aria-hidden="true">{STAGE_CHIPS.map((c, i) => <span key={c} className={`ay-chip${i === 2 ? ' is-on' : ''}`}>{c}</span>)}</span>;
  if (kind === 'decide') return <span className="hm-stepui is-decide" aria-hidden="true"><span className="hm-stepui__btn">Save</span><span className="hm-stepui__btn is-quiet">Compare</span></span>;
  return null;
}
/* proof: every number is counted from the catalog when it loads (nothing typed in). */
const LEVELS = [
  { n: 3, word: 'Strong evidence', note: 'Research on the product itself.' },
  { n: 2, word: 'Some evidence', note: 'Clinical guidelines, or research on its ingredients.' },
  { n: 1, word: 'Limited evidence', note: 'Less direct research so far. We say so plainly.' },
];
function useCatalogNumbers() {
  const ready = useCatalogReady();
  return useMemo(() => {
    if (!ready || !ALL_PRODUCTS.length) return null;
    const brands = new Set();
    const sources = new Set();
    for (const p of ALL_PRODUCTS) {
      const b = String(brandOf(p) || p.brand || '').trim().toLowerCase();
      if (b) brands.add(b);
      for (const k of ['scientificCitations', 'doctorOpinionCitations', 'safetyNoteSources']) {
        for (const c of (Array.isArray(p[k]) ? p[k] : [])) {
          const u = String(c?.url || '').trim().replace(/[#?].*$/, '').replace(/\/$/, '').toLowerCase();
          if (u) sources.add(u);
        }
      }
    }
    const needs = MACRO_GROUPS.filter((g) => g.id !== 'all').length;
    // The same counts the Shop and Services pages show (one source: data/catalogCounts.js).
    const { products, services } = shopCatalogCounts();
    return [
      { n: products + services, label: `${products} products in the Shop and ${services} services` },
      { n: brands.size, label: 'brands, big and small' },
      { n: sources.size, label: 'sources linked on product pages' },
      { n: needs, label: 'areas of care, from periods to menopause' },
    ];
  }, [ready]);
}
function Levels({ className, onViewArticles }) {
  return (
    <div className={`hm-levelswrap ${className}`}>
      <ul className="hm-levels" aria-label="The three evidence levels">
        {LEVELS.map((l) => (
          <li key={l.n}>
            <span className="ay-meter" data-level={l.n}>
              <span className="ay-meter__word">{l.word}</span>
              <span className="ay-meter__bars" role="img" aria-label={`${l.n} of 3`}>{[1, 2, 3].map((b) => <i key={b} />)}</span>
            </span>
            <span className="hm-levels__note">{l.note}</span>
          </li>
        ))}
      </ul>
      <Go className="ay-btn ay-btn--text hm-levels__more" href="/explore/resources" onGo={onViewArticles}>Read our sources<Arrow /></Go>
    </div>
  );
}
/* Bento (#455687ac intelly dashboard, #007b85fd "At a Glance"): the three
   steps and the four catalog numbers as tiles of different sizes and tones on
   the espresso band, instead of a row of steps and a row of identical stats. */
function StatTile({ s, tone }) {
  if (!s) return <Tile tone={tone} as="li" className="hm-bt hm-bt--num is-skel" aria-hidden="true" />;
  return <Tile tone={tone} as="li" className="hm-bt hm-bt--num" big={s.n.toLocaleString('en-US')} caption={s.label} />;
}
function HowEvidence({ onViewHowItWorks, onViewArticles, onStartQuiz, showStart = true }) {
  const nums = useCatalogNumbers() || [null, null, null, null];
  const [s1, s2, s3] = STEPS;
  return (
    <Band tone="ink" className="hm-sec hm-how hm-band" aria-labelledby="hm-how-title">
      <div className="hm-wrap">
        <header className="hm-head">
          <h2 id="hm-how-title" className="hm-h2">How ayna fits it to you</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/how-it-works" onGo={onViewHowItWorks}><span className="hm-head__long">The full method</span><span className="hm-head__short">See all<span className="ed-sr"> of the method</span></span><Arrow /></Go>
        </header>
        <p className="hm-body hm-how__lead">ayna matches women’s health products to your answers, and shows the research beside each one. Unsupported claims are labeled, not upgraded into facts.</p>
        <Bento as="ol" className="hm-bento" aria-busy={nums[0] ? undefined : 'true'}>
          <Tile tone="butter" span="big" as="li" className="hm-bt hm-bt--photo">
            <span className="hm-bt__ph"><Photo src={s1.src} alt="" sizes="(max-width: 767px) 92vw, 600px" style={{ objectPosition: s1.pos }} loading="lazy" decoding="auto" /></span>
            <span className="hm-bt__panel">
              <span className="hm-bt__n" aria-hidden="true">1</span>
              <h3 className="hm-h3"><span className="ed-sr">Step 1: </span>{s1.t}</h3>
              <p>{s1.d}</p>
              <StepUI kind="quiz" />
            </span>
          </Tile>
          <Tile tone="pink" span="tall" as="li" className="hm-bt hm-bt--ev">
            <span className="hm-bt__n" aria-hidden="true">2</span>
            <h3 className="hm-h3"><span className="ed-sr">Step 2: </span>{s2.t}</h3>
            <p>{s2.d}</p>
            <Levels className="hm-levels--tile" onViewArticles={onViewArticles} />
          </Tile>
          <StatTile s={nums[0]} tone="butter" />
          <StatTile s={nums[1]} tone="ink" />
          <Tile tone="pink" span="wide" as="li" className="hm-bt hm-bt--decide">
            <span className="hm-bt__side"><Photo src={s3.src} alt="" sizes="(max-width: 767px) 40vw, 260px" style={{ objectPosition: s3.pos }} loading="lazy" decoding="auto" /><StepUI kind="decide" /></span>
            <span className="hm-bt__text">
              <span className="hm-bt__n" aria-hidden="true">3</span>
              <h3 className="hm-h3"><span className="ed-sr">Step 3: </span>{s3.t}</h3>
              <p>{s3.d}</p>
            </span>
          </Tile>
          <StatTile s={nums[2]} tone="butter" />
          <StatTile s={nums[3]} tone="pink" />
        </Bento>
        {/* The one call to action after the hero: it closes the method. */}
        {showStart && <div className="hm-how__cta"><Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>Get my matches<Arrow /></Go></div>}
      </div>
    </Band>
  );
}

/* ---------- 5. reads + community: two columns ---------- */
const LEAD_READS = [
  { id: 'heavy-bleeding', title: 'Heavy menstrual bleeding', teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated.', source: 'UpToDate · ACOG · CDC', src: '/landing/articles-heavy-bleeding-satin.webp', alt: 'Pads and tampons scattered on red satin', tone: 'pink' },
  { id: 'period-pain-when-to-seek-care', title: 'Period Pain: When to Seek Care', teaser: 'Normal cramps vs. signs that something else may be going on, and what clinicians may suggest.', source: 'ACOG · UpToDate · Mayo Clinic', src: '/landing/articles-period-pain-hotwater.webp', alt: 'A woman in striped pajamas holding a hot water bottle', tone: 'sky' },
  { id: 'pcos-basics', title: 'PMOS: What It Is and How It’s Managed', teaser: 'Diagnosis, symptoms, and evidence-based treatment, including lifestyle and medication.', source: 'ACOG · Endocrine Society · UpToDate', src: '/landing/articles-pcos-mirror.webp', alt: 'Red lips reflected in a small red compact mirror', tone: 'butter' },
];
function Reads({ onViewArticle, onViewArticles }) {
  const open = (id) => { if (onViewArticle) onViewArticle(id); else onViewArticles?.(); };
  return (
    <div className="hm-reads">
      <header className="hm-head">
        <h2 id="hm-reads-title" className="hm-h2">Quick reads about your body, with sources</h2>
        <a className="ay-btn ay-btn--text hm-head__all" href="/explore/resources" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onViewArticles?.(); }}><span className="hm-head__long">Open the Library</span><span className="hm-head__short">See all<span className="ed-sr"> reads in the Library</span></span><Arrow /></a>
      </header>
      {/* Plain rows (master prompt 154: no bento): photo, title, one line, sources. */}
      <ul className="hm-readlist">
        {LEAD_READS.map((r) => (
          <li key={r.id}>
            <a className="hm-readlist__row" href={`/library/${r.id}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); open(r.id); }}>
              <span className="hm-readlist__ph"><Photo src={r.src} alt={r.alt} sizes="(max-width: 767px) 96px, 128px" loading="lazy" decoding="auto" /></span>
              <span className="hm-readlist__text">
                <strong className="hm-readlist__title">{r.title}</strong>
                <small className="hm-readlist__src">Sources: {String(r.source || '').replace(/\s*·\s*/g, ', ')}</small>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
/* the Community card: its photo, the latest ayna news, and up to two real posts once there are any */
function Community({ onViewCommunity, posts = [] }) {
  const news = useLatestAnnouncement();
  return (
    <article className="hm-comm" aria-labelledby="hm-comm-title">
      <span className="hm-comm__ph"><Photo sizes="(max-width: 767px) 92vw, 460px" src="/landing/story-reviews-phones.webp" alt="Friends in a circle looking down at their phones, blue sky above" loading="lazy" decoding="auto" /></span>
      <div className="hm-comm__copy">
        <h3 id="hm-comm-title" className="hm-h3">Real talk about what women actually use.</h3>
        <div className="hm-news" aria-labelledby="hm-news-title">
          <span className="hm-tab hm-news__label">ayna news</span>
          <h3 id="hm-news-title" className="hm-h3">{news ? news.title : 'ayna Community is open.'}</h3>
          <p>{news ? news.body : 'Ask questions, review what you use and share playlists with women who get it.'}</p>
        </div>
        {posts.length > 0 && (
          <ul className="hm-posts" aria-label="From the Powder Room">
            {posts.slice(0, 2).map((post) => {
              const anon = post.is_anonymous || !post.author_id;
              const who = anon ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
              return (
                <li key={post.id}>
                  <button type="button" className="hm-post" onClick={() => onViewCommunity?.()}>
                    <span className="hm-post__meta">{post.kind === 'question' ? 'Question' : post.kind === 'review' ? 'Review' : 'Post'} from {who}</span>
                    <span className="hm-post__body">{post.body}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <Go className="ay-btn ay-btn--secondary" href="/community" onGo={onViewCommunity}>{news ? 'Read it in Community' : 'Read reviews and questions'}<Arrow /></Go>
      </div>
    </article>
  );
}
function ReadsCommunity({ onViewArticle, onViewArticles, onViewCommunity, posts }) {
  return (
    <Band tone="pink" className="hm-sec hm-rc hm-band" aria-label="Reads and Community">
      <div className="hm-wrap hm-rc__grid">
        <Reads onViewArticle={onViewArticle} onViewArticles={onViewArticles} />
        <Community onViewCommunity={onViewCommunity} posts={posts} />
      </div>
    </Band>
  );
}

/* ---------- 6. founders (butter) ----------
   The founders' photo and story (the page's one 44px statement line). The
   Wefunder card moved to /about (critique, Oct 27: no investing pitch on the
   consumer home page); the footer keeps its "Invest in ayna" link. */
function Founders({ onViewAbout }) {
  return (
    <Band tone="butter" className="hm-sec hm-us hm-band" aria-labelledby="hm-us-title">
      <div className="hm-wrap">
        <div className="hm-us__grid">
          <figure className="hm-polaroid">
            <span className="hm-polaroid__ph"><Photo sizes="(max-width: 767px) 92vw, 600px" src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" loading="lazy" decoding="auto" width="1800" height="1198" /></span>
            <figcaption>Puloma, Eliz &amp; Ameera</figcaption>
          </figure>
          <div className="hm-us__copy">
            <h2 id="hm-us-title" className="hm-h2">Built by three women who wanted better answers.</h2>
            <p className="hm-body">We met at Cornell, bringing different experiences to the same question: why does understanding our options require so much searching?</p>
            <Go className="ay-btn ay-btn--secondary" href="/about" onGo={onViewAbout}>Meet us</Go>
          </div>
        </div>
      </div>
    </Band>
  );
}

/* ---------- 6. ayna Pro (espresso) ----------
   Early Access prices (src/components/SubscriptionPaywallModal.jsx on main),
   as static text, and Learn more to /pro. */
function Pro() {
  return (
    <Band tone="ink" className="hm-sec hm-band wl-pro" aria-labelledby="wl-pro-h">
      <div className="hm-wrap wl-pro__grid">
        <div className="wl-pro__copy">
          <span className="wl-pro__tag">ayna Pro · Early Access</span>
          <h2 id="wl-pro-h" className="hm-h2">More of ayna, when you want it.</h2>
          <p className="hm-body">More Ask ayna, unlimited Reads and detailed health history. Basic matches, safety flags and evidence stay free.</p>
          <a className="hm-howlink wl-pro__more" href="/pro">Learn more<Arrow /></a>
        </div>
        <ul className="wl-pro__prices">
          <li><small>Monthly</small><b>$4.99</b><s>$8.99</s></li>
          <li><small>Yearly</small><b>$45</b><s>$90</s></li>
        </ul>
      </div>
    </Band>
  );
}

/* ---------- page ---------- */
// One page for everyone (the ayna logo opens it signed in or out). Signed in
// with a profile, the main action is "Go to your Home" and the shop cards
// drop "See your match". `communityPosts` are the most helpful Powder Room
// posts (two are shown, in the Community card).
export default function WebLanding({ signedIn = false, hasProfile = false, onStartQuiz, onGoHome, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, communityPosts = [], heroBanner = null }) {
  const rest = useAfterHeroPaint();
  const home = Boolean(signedIn && hasProfile && onGoHome);
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: onGoHome }
    : { label: 'Get my matches', slide: 'Slide to get your matches', go: onStartQuiz };
  return (
    <div id="ay-landing" className="ed ed-home hm hm-uq wl">
      <Hero cta={cta} onSearch={onSearch} onViewHowItWorks={onViewHowItWorks} banner={home ? null : heroBanner} />
      <BrandBar onOpen={onViewWaitlist} />
      <NeedsBand onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} onSearch={onSearch} signedOut={!home} />
      {rest && <>
      <HowEvidence onViewHowItWorks={onViewHowItWorks} onViewArticles={onViewArticles} onStartQuiz={onStartQuiz} showStart={!home} />
      <ReadsCommunity onViewArticle={onViewArticle} onViewArticles={onViewArticles} onViewCommunity={onViewCommunity} posts={communityPosts} />
      <Pro />
      <Founders onViewAbout={onViewAbout} />
      </>}
      <div className="wl-note"><MedicalNote className="wl-note__p" /></div>
    </div>
  );
}
/* LCP: the hero is the largest paint. Rendering the whole page in the first
   commit left it waiting behind one long task on slow phones, so everything
   after the shop band mounts once the first falling packshot is decoded (or
   after 1.2s at most). It is below the fold on every screen size. */
function useAfterHeroPaint() {
  const [ready, setReady] = useState(() => typeof window === 'undefined' || window.scrollY > 0);
  useEffect(() => {
    if (ready) return undefined;
    let done = false;
    // two frames: the hero's first paint happens before the rest of the page renders
    const go = () => { if (done) return; done = true; requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(() => setReady(true), 0))); };
    const img = document.querySelector('.wl-rain img');
    if (img?.decode) img.decode().then(go, go); else go();
    const t = window.setTimeout(go, 1200);
    return () => { done = true; window.clearTimeout(t); };
  }, [ready]);
  return ready;
}
