import React, { useEffect, useMemo, useState } from 'react';
import LandingV2 from '../LandingV2.jsx';
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
import { Chip, Band, ScallopEdge } from '../ui/ay';
import BrandStrip from '../ui/ay/BrandStrip.jsx';
import SlideToStart from '../ui/SlideToStart.jsx';
import { Rain, HeroSearch, BrandBar } from './kit.jsx';
import { PLANS, PAID_TERM_STARTS } from '../../pro/plans.js';
import { useProStatus } from '../../pro/useProStatus.js';
import './web-landing.css';

/* The website's / (founder, Oct 27 10:40: "i liked how we had the website
 * ... optimize it for web"). The v2 website home is back, desktop-first, with
 * the raining cut-outs brought into its hero. Styles: src/styles/home.css
 * (hm-*), uq-landing.css (colour-blocked bands) and ./web-landing.css (the
 * hero, Pro and the closing note).
 *
 * The sequence (the hero and the bar were approved Oct 27; below them,
 * founder 13:44, one idea and one picture a section):
 *   1 hero: everything centred (title, Slide to start, search, How we match)
 *     over a faded layer of real products falling as cut-outs (./kit.jsx)
 *   2 partner marquee, pink seam (Pause motion stops it and the rain)
 *   3 does this sound familiar? a checkerboard of phrases and photos, butter
 *   4 this week's picks, the same butter: need chips and four big cards
 *   5 how ayna fits it to you: three photo steps and four big numbers, espresso
 *     then the brown and pink BrandStrip
 *   6 reads + community, butter (pink is an accent only, founder 13:58)
 *   7 ayna Pro (Early Access, links to /pro), espresso
 *     then the BrandStrip again
 *   8 founders: half photo, half butter
 *   9 the last ask: the promise and Slide to start, espresso, running into
 *     the medical note
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
   and everything centred on top (13:01: big, not crowded): a big two-line
   title with "your body." in pink, one line on what ayna connects, the search, Slide to start (the welcome
   tip's anchor) and How we match. The brown and pink bar runs under it. */
function Hero({ cta, onSearch, onViewHowItWorks, banner = null }) {
  return (
    <section className="wl-hero" aria-labelledby="hm-hero-title">
      <div className="wl-hero__band">
        <Rain cols={4} onInk className="wl-rain" />
        <div className="wl-hero__in">
          {/* One promise on the website and the app (landing audit 4 and 9). */}
          <h1 id="hm-hero-title" className="wl-title">Find what fits <span>your body.</span></h1>
          <p className="wl-one">Your products, routine and health data, finally in one place.</p>
          <SlideToStart className="wl-sts" tour="landing-start" size="lg" hint={null} label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
          <HeroSearch onSearch={onSearch} className="wl-search" />
          <a className="wl-how" href="/how-it-works" onClick={(e) => { if (!onViewHowItWorks || !isPlainLeftClick(e)) return; e.preventDefault(); onViewHowItWorks(); }}>How we match<Arrow /></a>
          {banner && <div className="wl-banner">{banner}</div>}
        </div>
      </div>
      <ScallopEdge shape="wave" tone="ink" className="wl-edge" />
    </section>
  );
}

/* ======================================================================
   Below the hero (founder, Oct 27 13:44: "fix the rest of the landing page
   look at the inspo ... its still ugly ... i love the pink and brown bar
   thing can u integrate more"). One idea and one picture per section, big
   type, little text, in the order the best consumer-health pages use:
   the problem, the products, how it works with the proof, reads and the
   community, Pro, who we are, then one last ask.
   Inspo moves: the Feel Fits pain-point checkerboard (4dfb3fbd), the PITCH
   half-photo / half-colour split (audits/v3/inspo/36) and one oversized
   closing line (FEEL FITS, the act). The brown and pink BrandStrip marks the
   two turns of the page.
   ====================================================================== */

// Core needs lead (periods, intimate care, menopause, pelvic floor); creams, sleep and gadgets come after.
const CORE = /pad|tampon|cup|disc|period|intimate|vaginal|menopause|pelvic|uti|cramp|fertility|postpartum|pregnan/i;
function weeklyLineup() {
  const list = getWeeklyTrendingLineup(ALL_PRODUCTS).map((x) => x.product)
    .filter((p) => p?.image && NEEDS_PHOTO(p) && !/sex|intimacy|toy/i.test(String(p.category || '')) && !/\banal\b|vibrator|dildo|mouth tape/i.test(String(p.name || '')));
  const core = list.filter((p) => CORE.test(`${p.category} ${(p.healthFunctions || []).join(' ')}`));
  return [...core, ...list.filter((p) => !core.includes(p))];
}

/* ---------- 3. does this sound familiar? (butter) ----------
   The Feel Fits pain-point tiles (4dfb3fbd): each phrase is an espresso
   tile beside its photo, laid as a checkerboard that echoes the brown and
   pink bar (pink only as the accent, founder 13:58). Each phrase is a common need from the quiz (WebIntake.jsx
   COMMON_NEEDS), said the way people say it; these are prompts, not
   testimonials. Each pair is one link to that need in the Shop. */
const FAMILIAR = [
  { q: 'My cramps knock me out every month.', need: 'Cramps or period pain', photo: '/landing/pajamas-overhead.webp' },
  { q: 'I bleed through everything.', need: 'Heavy periods', photo: '/landing/sink-flatlay.webp' },
  { q: 'I leak a little when I sneeze.', need: 'Bladder leakage or incontinence', photo: '/landing/curlers-call.webp' },
  { q: 'Things feel dry down there.', need: 'Vaginal dryness', photo: '/landing/robe-vanity.webp' },
];
function Familiar({ onSearch }) {
  return (
    <section className="wlx-fam" aria-labelledby="wlx-fam-h">
      <div className="hm-wrap">
        <h2 id="wlx-fam-h" className="wlx-h2 wlx-fam__h">Does this sound familiar?</h2>
        <ul className="wlx-check">
          {FAMILIAR.map((t) => (
            <li key={t.q} className="wlx-check__item">
              <a className="wlx-check__link" href={`/explore/products?q=${encodeURIComponent(t.need)}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onSearch?.(t.need); }}>
                <span className="wlx-check__txt">
                  <span className="wlx-check__q">“{t.q}”</span>
                  <span className="wlx-check__go">See what helps <Arrow /></span>
                </span>
                <span className="wlx-check__ph"><Photo src={t.photo} alt="" sizes="(max-width: 767px) 50vw, 300px" loading="lazy" decoding="auto" /></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 4. the products (butter, the same band) ----------
   The approved Shop cards (19c492f2): big square photos, little text. The
   need chips switch the four; with none picked they are this week's picks
   (signed in: her top picks). */
const SHOWN_NEEDS = 6;
function Picks({ onOpenProduct, onViewDiscovery, picks = null }) {
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
    <section className="wlx-picks" aria-labelledby="wlx-picks-h">
      <div className="hm-wrap">
        <header className="hm-head wlx-head">
          <h2 id="wlx-picks-h" className="wlx-h2" aria-live="polite">{listName}</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/explore/products" onGo={() => onViewDiscovery?.('')}><span className="hm-head__long">See all products</span><span className="hm-head__short">See all<span className="ed-sr"> products</span></span><Arrow /></Go>
        </header>
        <div className="hm-chips wlx-chips" role="group" aria-label="Choose a need">
          {needs.length ? <>
            {needs.map((n) => (<Chip key={n.id} selected={n.id === need?.id} onClick={() => setId(n.id === id ? null : n.id)}>{n.label}</Chip>))}
            <Go className="ayk-chip hm-chips__all" href="/explore/products" onGo={() => onViewDiscovery?.('')}>All needs<Arrow /></Go>
          </> : [0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="hm-chips__skel" aria-hidden="true" />)}
        </div>
        <ul className="hm-stickers wlx-cards" key={need?.id || 'picks'} aria-label={loading ? 'Loading products' : listName}>
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
    </section>
  );
}

/* ---------- 5. how ayna fits it to you (espresso) ----------
   Three real steps (so the numbers are steps), each a tall photo carrying the
   piece of ayna it describes, then the catalog in four big numbers. */
const STEPS = [
  { t: 'Answer a few short questions', d: 'About your body, your life stage and what you avoid.', ui: 'quiz', src: '/landing/hiw-questions-cabinet.webp', pos: '50% 35%' },
  { t: 'We check the evidence', d: 'Across products, apps and care.', ui: 'evidence', src: '/landing/hiw-evidence-reading.webp', pos: '50% 40%' },
  { t: 'You decide', d: 'Nothing is bought until you say so.', ui: 'decide', src: '/landing/hiw-decide-basket.webp', pos: '50% 45%' },
];
// Real life-stage options from the quiz (intakeModel LIFE_STAGE_LABELS), so the first step shows who ayna is for.
const STAGE_CHIPS = ['Regular periods', 'Postpartum', 'Perimenopause', 'Post-menopause'];
const LEVELS = [
  { n: 3, word: 'Strong evidence' },
  { n: 2, word: 'Some evidence' },
  { n: 1, word: 'Limited evidence' },
];
function StepUI({ kind }) {
  if (kind === 'quiz') return <span className="wlx-ui is-quiz" aria-hidden="true">{STAGE_CHIPS.map((c, i) => <span key={c} className={`ay-chip${i === 2 ? ' is-on' : ''}`}>{c}</span>)}</span>;
  if (kind === 'decide') return <span className="wlx-ui is-decide" aria-hidden="true"><span className="wlx-ui__btn">Save</span><span className="wlx-ui__btn is-quiet">Compare</span></span>;
  // the three evidence levels as the meter ayna shows on every product
  return (
    <ul className="wlx-ui is-meter" aria-label="The three evidence levels">
      {LEVELS.map((l) => (
        <li key={l.n} className="ay-meter" data-level={l.n}>
          <span className="ay-meter__word">{l.word}</span>
          <span className="ay-meter__bars" role="img" aria-label={`${l.n} of 3`}>{[1, 2, 3].map((b) => <i key={b} />)}</span>
        </li>
      ))}
    </ul>
  );
}
/* proof: every number is counted from the catalog when it loads (nothing typed in). */
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
function HowEvidence({ onViewHowItWorks, onViewArticles }) {
  const nums = useCatalogNumbers() || [null, null, null, null];
  return (
    <Band tone="ink" className="hm-sec hm-band wlx-how" aria-labelledby="wlx-how-h">
      <div className="hm-wrap">
        <header className="hm-head wlx-head">
          <h2 id="wlx-how-h" className="wlx-h2">How ayna fits it to you</h2>
          <Go className="ay-btn ay-btn--text hm-head__all" href="/how-it-works" onGo={onViewHowItWorks}><span className="hm-head__long">The full method</span><span className="hm-head__short">See all<span className="ed-sr"> of the method</span></span><Arrow /></Go>
        </header>
        <p className="wlx-how__lead">Unsupported claims are labeled, not upgraded into facts.</p>
        <ol className="wlx-steps">
          {STEPS.map((s, i) => (
            <li key={s.t} className={`wlx-step is-${s.ui}`}>
              <span className="wlx-step__ph">
                <Photo src={s.src} alt="" sizes="(max-width: 767px) 92vw, 400px" style={{ objectPosition: s.pos }} loading="lazy" decoding="auto" />
                <StepUI kind={s.ui} />
              </span>
              <span className="wlx-step__n" aria-hidden="true">{i + 1}</span>
              <h3 className="wlx-step__t"><span className="ed-sr">Step {i + 1}: </span>{s.t}</h3>
              <p className="wlx-step__d">{s.d}</p>
            </li>
          ))}
        </ol>
        <ul className="wlx-stats" aria-busy={nums[0] ? undefined : 'true'}>
          {nums.map((s, i) => (s
            ? <li key={i}><b>{s.n.toLocaleString('en-US')}</b><span>{s.label}</span></li>
            : <li key={i} className="is-skel" aria-hidden="true"><b>&nbsp;</b><span>&nbsp;</span></li>))}
        </ul>
        <Go className="ay-btn ay-btn--text wlx-how__more" href="/explore/resources" onGo={onViewArticles}>Read our sources<Arrow /></Go>
      </div>
    </Band>
  );
}

/* ---------- 6. reads + community (butter; no pink fills, founder 13:58) ----------
   One lead read with a big photo, two more beside it, then the Community as
   a half-photo / half-butter split (PITCH). */
const LEAD_READS = [
  { id: 'heavy-bleeding', title: 'Heavy menstrual bleeding', source: 'UpToDate · ACOG · CDC', src: '/landing/articles-heavy-bleeding-satin.webp', alt: 'Pads and tampons scattered on red satin' },
  { id: 'period-pain-when-to-seek-care', title: 'Period Pain: When to Seek Care', source: 'ACOG · UpToDate · Mayo Clinic', src: '/landing/articles-period-pain-hotwater.webp', alt: 'A woman in striped pajamas holding a hot water bottle' },
  { id: 'pcos-basics', title: 'PMOS: What It Is and How It’s Managed', source: 'ACOG · Endocrine Society · UpToDate', src: '/landing/articles-pcos-mirror.webp', alt: 'Red lips reflected in a small red compact mirror' },
];
function Reads({ onViewArticle, onViewArticles }) {
  const open = (id) => { if (onViewArticle) onViewArticle(id); else onViewArticles?.(); };
  return (
    <>
      <header className="hm-head wlx-head">
        <h2 id="wlx-reads-h" className="wlx-h2">Quick reads about your body, with sources</h2>
        <Go className="ay-btn ay-btn--text hm-head__all" href="/explore/resources" onGo={onViewArticles}><span className="hm-head__long">Open the Library</span><span className="hm-head__short">See all<span className="ed-sr"> reads in the Library</span></span><Arrow /></Go>
      </header>
      <ul className="wlx-reads">
        {LEAD_READS.map((r, i) => (
          <li key={r.id} className={i ? 'is-small' : 'is-lead'}>
            <a className="wlx-read" href={`/library/${r.id}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); open(r.id); }}>
              <span className="wlx-read__ph"><Photo src={r.src} alt={r.alt} sizes={i ? '(max-width: 767px) 96px, 200px' : '(max-width: 767px) 92vw, 720px'} loading="lazy" decoding="auto" /></span>
              <span className="wlx-read__text">
                <strong className="wlx-read__t">{r.title}</strong>
                <small className="wlx-read__src">Sources: {String(r.source || '').replace(/\s*·\s*/g, ', ')}</small>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
/* the Community: its photo, the latest ayna news, and one real post once there is one */
function Community({ onViewCommunity, posts = [] }) {
  const news = useLatestAnnouncement();
  const post = posts[0];
  const anon = post && (post.is_anonymous || !post.author_id);
  const who = post && (anon ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member');
  return (
    <article className="wlx-comm" aria-labelledby="wlx-comm-h">
      <span className="wlx-comm__ph"><Photo sizes="(max-width: 767px) 92vw, 640px" src="/landing/story-reviews-phones.webp" alt="Friends in a circle looking down at their phones, blue sky above" loading="lazy" decoding="auto" /></span>
      <div className="wlx-comm__copy">
        <h3 id="wlx-comm-h" className="wlx-comm__h">Real talk about what women actually use.</h3>
        <p className="wlx-comm__news"><span className="wlx-pill">ayna news</span> {news ? news.title : 'ayna Community is open.'}</p>
        {post && (
          <button type="button" className="wlx-post" onClick={() => onViewCommunity?.()}>
            <span className="wlx-post__meta">{post.kind === 'question' ? 'Question' : post.kind === 'review' ? 'Review' : 'Post'} from {who}</span>
            <span className="wlx-post__body">{post.body}</span>
          </button>
        )}
        <Go className="ay-btn ay-btn--secondary" href="/community" onGo={onViewCommunity}>{news ? 'Read it in Community' : 'Read reviews and questions'}<Arrow /></Go>
      </div>
    </article>
  );
}
function ReadsCommunity({ onViewArticle, onViewArticles, onViewCommunity, posts }) {
  return (
    <Band tone="butter" className="hm-sec hm-band wlx-rc" aria-labelledby="wlx-reads-h">
      <div className="hm-wrap">
        <Reads onViewArticle={onViewArticle} onViewArticles={onViewArticles} />
        <Community onViewCommunity={onViewCommunity} posts={posts} />
      </div>
    </Band>
  );
}

/* ---------- 7. ayna Pro (espresso) ----------
   Early Access prices (src/components/SubscriptionPaywallModal.jsx on main),
   as static text, and Learn more to /pro. */
function Pro({ pro = false, offerOpen = null }) {
  const month = PLANS.find((x) => x.id === 'month');
  const year = PLANS.find((x) => x.id === 'year');
  return (
    <Band tone="ink" className="hm-sec hm-band wl-pro" aria-labelledby="wl-pro-h">
      <div className="hm-wrap wl-pro__grid">
        <div className="wl-pro__copy">
          <span className="wl-pro__tag">{pro ? 'ayna Pro' : 'ayna Pro · Early Access'}</span>
          <h2 id="wl-pro-h" className="wlx-h2">{pro ? 'You’re on ayna Pro.' : 'More of ayna, when you want it.'}</h2>
          <p className="wl-pro__body">{pro
            ? 'Connect your health data, see your dashboard and use up to 50 Ask ayna chats a month.'
            : 'Connect your health data, go deeper on your patterns and lift the free limits. Matches, safety notes and evidence stay free.'}</p>
          <a className="wl-pro__more" href={pro ? '/health-data' : '/pro'}>{pro ? 'Connect health data' : 'See what Pro includes'}<Arrow /></a>
        </div>
        {!pro && (offerOpen === false
          ? <p className="wl-pro__closed">The Early Access offer is closed right now.</p>
          : <div className="wl-pro__side">
            <ul className="wl-pro__prices">
              <li><small>Monthly</small><b>{month.price}</b><s>{month.regular}</s><em>first month</em></li>
              <li className="is-best"><small>Yearly</small><b>{year.price}</b><s>{year.regular}</s><em>first year</em></li>
            </ul>
            <p className="wl-pro__terms">Unlock Pro now. Your paid term starts {PAID_TERM_STARTS}, then renews at the regular price unless you cancel.</p>
          </div>)}
      </div>
    </Band>
  );
}

/* ---------- 8. founders (butter) ----------
   The PITCH split: the photo runs to the page edge on one half, the words sit
   on butter on the other. The Wefunder card lives on /about. */
function Founders({ onViewAbout }) {
  return (
    <Band tone="butter" className="hm-band wlx-us" aria-labelledby="wlx-us-h">
      <figure className="wlx-us__ph">
        <Photo sizes="(max-width: 767px) 100vw, 50vw" src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" loading="lazy" decoding="auto" width="1800" height="1198" />
        <figcaption>Puloma, Eliz &amp; Ameera</figcaption>
      </figure>
      <div className="wlx-us__copy">
        <h2 id="wlx-us-h" className="wlx-h2">Built by three women who wanted better answers.</h2>
        <p className="wlx-us__p">We met at Cornell, bringing different experiences to the same question: why does understanding our options require so much searching?</p>
        <Go className="ay-btn ay-btn--secondary" href="/about" onGo={onViewAbout}>Meet us</Go>
      </div>
    </Band>
  );
}

/* ---------- 9. the last ask (espresso) ----------
   The promise once more, as big as the page gets, and Slide to start. */
function FinalCta({ cta }) {
  return (
    <Band tone="ink" className="hm-band wlx-end" aria-labelledby="wlx-end-h">
      <div className="hm-wrap wlx-end__in">
        <h2 id="wlx-end-h" className="wlx-end__h">Find what fits <span>your body.</span></h2>
        <SlideToStart className="wlx-end__sts" size="lg" label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
      </div>
    </Band>
  );
}

/* ---------- page ---------- */
// One page for everyone (the ayna logo opens it signed in or out). Signed in
// with a profile, the main action is "Go to your Home", the phrases step
// aside and the shop cards drop "See your match". `communityPosts` are the
// most helpful Powder Room posts (one is shown, in the Community half).
export default function WebLanding({ signedIn = false, userId = null, hasProfile = false, onStartQuiz, onGoHome, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, communityPosts = [], heroBanner = null }) {
  const rest = useAfterHeroPaint();
  const { active: pro, offerOpen } = useProStatus(signedIn ? userId : null);
  const home = Boolean(signedIn && hasProfile && onGoHome);
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: onGoHome }
    : { label: 'Get my matches', slide: 'Slide to find your matches', go: onStartQuiz };
  return (
    <div id="ay-landing" className="ed ed-home hm hm-uq wl">
      <Hero cta={cta} onSearch={onSearch} onViewHowItWorks={onViewHowItWorks} banner={home ? null : heroBanner} />
      <BrandBar onOpen={onViewWaitlist} />
      {/* Under the falling pictures: the original website's sections (founder, Oct 27 19:18: keep the
          raining pictures and widgets, and use the original website for the rest). */}
      <div className="wl-classic">
        <LandingV2 bodyOnly onStartQuiz={home ? onGoHome : onStartQuiz} onViewDiscovery={onViewDiscovery} onOpenProduct={onOpenProduct} onViewArticles={onViewArticles} onViewArticle={onViewArticle} onViewAbout={onViewAbout} onViewWaitlist={onViewWaitlist} onViewCommunity={onViewCommunity} onViewHowItWorks={onViewHowItWorks} onSearch={onSearch} communityPosts={communityPosts} />
      </div>
      {rest && <>
      <Pro pro={pro === true} offerOpen={offerOpen} />
      <div className="wl-turn" aria-hidden="true" />
      <FinalCta cta={cta} />
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
