import React, { useEffect, useMemo, useState } from 'react';
import { TESTING_WATERS_NOTICE } from '../data/investRound';
import { useRecommendationViews } from '../utils/recommendationAnalytics';
import { BASICS_PRODUCTS } from '../data/basicsProducts.js';
import { productsForNeed } from './landingNeeds';
import { isPlainLeftClick } from '../utils/productRoute';
import { isPartnerBrandItem, PARTNER_BRANDS } from '../utils/partnerBrands';
import { getWeeklyTrendingLineup } from '../utils/trendingLineup';
import { ALL_PRODUCTS, MACRO_GROUPS } from '../data/products';
import { getDailyFact } from '../data/welcomeSlides.js';
import ProductCard from './ProductCard';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import { useLatestAnnouncement } from '../hooks/useLatestAnnouncement';
import { WEFUNDER_URL, trackInvestClick } from '../data/invest';
import '../styles/editorial.css';
import { Seal, Ribbon, Sticker, Envelope } from './personality/Bits.jsx';

/* The website home. Story order (design direction, "Homepage"):
 *   what   hero (display, See my matches, search), partner brands, this week's picks
 *   why    your counter, decoded
 *   shop   shop by need (dark band) with the photo strip
 *   how    four steps
 *   proof  how we grade evidence, short reads, community (the sky band), who we are
 *   action invest in ayna, final call to action
 * Members get the same page with their name, their dashboard row and their picks.
 * Styles: src/styles/editorial.css (ed-*). Nothing animates on scroll; the two
 * moving rows follow the footer's Pause motion and reduced motion. */

const SEARCH_HINTS = ['organic pads', 'PMOS support', 'bad cramps', 'pelvic floor', 'night sweats', 'vaginal dryness', 'leaking when I sneeze', 'sleep and stress', 'UTI burning', 'heavy flow overnight', 'menopause', 'itchy down there', 'hormonal acne', 'trying to conceive', 'postpartum pads'];
const BASICS_IDS = new Set(BASICS_PRODUCTS.map((p) => p.id));
const NEEDS_PHOTO = (p) => !/tampon tribe|herau|r[eè]sa/i.test(`${p?.brand || ''} ${p?.name || ''}`);
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const HERO = [
  { src: '/landing/tub-girls.webp', alt: 'Two friends getting ready together in a bathtub, surrounded by makeup', pos: '50% 35%' },
  { src: '/landing/robe-kiss.webp', alt: 'A woman in a striped robe blowing a kiss to the mirror light', pos: '50% 30%' },
  { src: '/landing/bed-selfie.webp', alt: 'A woman lying on a bed taking a selfie, her routine laid out around her', pos: '50% 40%' },
];

const STRIP = [
  { src: '/landing/robe-vanity.webp', alt: 'A woman in a white robe at a marble vanity in a pink room' },
  { src: '/landing/sink-flatlay.webp', alt: 'A sink full of brushes, makeup and hair tools, from above' },
  { src: '/landing/laundry-duo.webp', alt: 'Two friends in curlers reading magazines on a laundry room floor' },
  { src: '/landing/sink-heels-dryer.webp', alt: 'A vintage sink piled with a hair dryer, sunglasses and heels' },
  { src: '/landing/pajamas-overhead.webp', alt: 'A woman in red striped pajamas on the phone, from above' },
  { src: '/landing/vanity-hairdryer.webp', alt: 'A woman drying her hair at a crowded bedroom vanity' },
  { src: '/landing/pad-thread-art.webp', alt: 'Red thread arranged over a white pad, as still life' },
  { src: '/landing/bag-tubes.webp', alt: 'A vintage leather bag overflowing with colorful product tubes' },
];

const Arrow = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>);

/* CTAs that go somewhere are links (open in a new tab, copy the address), not buttons. */
function Go({ href, onGo, className, children }) {
  return <a className={className} href={href} onClick={(e) => { if (!onGo || !isPlainLeftClick(e)) return; e.preventDefault(); onGo(); }}>{children}</a>;
}

/* ---------- hero ---------- */
function Search({ onSearch }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (q || focused || reducedMotion()) return undefined;
    const t = window.setInterval(() => {
      if (document.documentElement.classList.contains('ay-motion-paused')) return;
      setI((v) => (v + 1) % SEARCH_HINTS.length);
    }, 2600);
    return () => window.clearInterval(t);
  }, [q, focused]);
  return (
    <form className="ed-search" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(q); }}>
      <label>
        <span className="ed-sr">Search products</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <SmartSearchInput
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }}
          onPick={(s) => onSearch(s.query)} anchor=".ed-search" placeholder=" " enterKeyHint="search" autoComplete="off"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {!q && <span className="ed-search__hint" aria-hidden="true">Search <b key={i}>{SEARCH_HINTS[i]}</b></span>}
      </label>
      <button type="submit" aria-label="Search"><Arrow /></button>
    </form>
  );
}

function Hero({ onStartQuiz, onSearch, personal = null, banner = null }) {
  const cta = personal && (personal.ecoCount > 0 || personal.hasQuiz)
    ? <Go className="ay-btn ay-btn--primary" href="/ecosystem" onGo={personal.onOpenEcosystem}>Open my ecosystem<Arrow /></Go>
    : banner || <Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>See my matches<Arrow /></Go>;
  return (
    <section className="ed-wrap ed-hero" aria-labelledby="ed-hero-title">
      <div className="ed-hero__copy">
        {personal ? <>
          <h1 id="ed-hero-title" className="ed-display">Welcome back, {personal.name}.</h1>
          <p className="ed-lead">{personal.ecoCount > 0 ? `${personal.ecoCount} product${personal.ecoCount === 1 ? '' : 's'} in your ecosystem.` : 'Health products matched to your body.'}</p>
        </> : <>
          <h1 id="ed-hero-title" className="ed-display">Build your ecosystem.</h1>
          <p className="ed-lead">Health products matched to your body.</p>
        </>}
        <div className="ed-hero__actions">{cta}</div>
        <Search onSearch={onSearch} />
      </div>
      <div className="ed-hero__photos">
        {HERO.map((p, i) => (<span key={p.src} className="ay-frame ed-hero__ph"><img src={p.src} alt={p.alt} style={{ objectPosition: p.pos }} {...(i === 0 ? { fetchPriority: 'high' } : { loading: 'lazy' })} /></span>))}
        <Seal className="ed-hero__seal" />
      </div>
    </section>
  );
}

/* ---------- partner brands, once ---------- */
function Brands({ onViewWaitlist }) {
  const names = PARTNER_BRANDS.map((b) => b.name);
  return (
    <section className="ed-brands-band" aria-labelledby="ed-brands-title">
      <h2 id="ed-brands-title" className="ed-sr">Brands we work with</h2>
      <Ribbon
        items={names}
        label="Partner brands"
        tab={<a className="ay-ribbon__tab" href="/partners" onClick={(e) => { if (!onViewWaitlist || !isPlainLeftClick(e)) return; e.preventDefault(); onViewWaitlist(); }}>Brands we work with <span aria-hidden="true">&nbsp;→</span></a>}
      />
    </section>
  );
}

/* ---------- product shelf: one card anatomy ---------- */
function Shelf({ products, onOpenProduct, label }) {
  return (
    <ul className="ed-shelf" aria-label={label}>
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} onOpen={onOpenProduct} labels={isPartnerBrandItem(p) ? <span className="ed-partner">ayna partner</span> : null} />
        </li>
      ))}
    </ul>
  );
}

// Core needs lead (periods, intimate care, menopause, pelvic floor); creams, sleep and gadgets come after.
const CORE = /pad|tampon|cup|disc|period|intimate|vaginal|menopause|pelvic|uti|cramp|fertility|postpartum|pregnan/i;
function Picks({ onOpenProduct, onViewDiscovery, picks = null }) {
  // The first four products a new visitor sees: everyday picks, not sex tech.
  const weekly = useMemo(() => {
    const list = getWeeklyTrendingLineup(ALL_PRODUCTS).map((x) => x.product)
      .filter((p) => p?.image && NEEDS_PHOTO(p) && !/sex|intimacy|toy/i.test(String(p.category || '')) && !/\banal\b|vibrator|dildo|mouth tape/i.test(String(p.name || '')));
    const core = list.filter((p) => CORE.test(`${p.category} ${(p.healthFunctions || []).join(' ')}`));
    return [...core, ...list.filter((p) => !core.includes(p))].slice(0, 4);
  }, []);
  // Member picks: only products with a real photo, drugstore basics last.
  const personal = useMemo(() => {
    if (!picks) return null;
    const shown = picks.filter((p) => p?.image && NEEDS_PHOTO(p));
    return [...shown.filter((p) => !BASICS_IDS.has(p.id)), ...shown.filter((p) => BASICS_IDS.has(p.id))];
  }, [picks]);
  const mine = personal && personal.length >= 2;
  const items = mine ? personal.slice(0, 4) : weekly;
  // recommendation_viewed for her top picks (not the weekly picks everyone sees).
  useRecommendationViews(mine ? items : null, 'home_top_picks');
  if (items.length < 2) return null;
  return (
    <section className="ed-wrap ed-sec" aria-labelledby="ed-picks-title">
      <header className="ed-head">
        <h2 id="ed-picks-title" className="ed-h2">{mine ? 'Top picks for your needs' : 'This week’s picks'}</h2>
        <span className="ed-head__count">{items.length} products</span>
        <Go className="ay-btn ay-btn--text ed-head__all" href="/shop" onGo={() => onViewDiscovery?.('')}>See the Shop<Arrow /></Go>
      </header>
      <Shelf products={items} onOpenProduct={onOpenProduct} label={mine ? 'Top picks for your needs' : 'This week’s picks'} />
    </section>
  );
}

/* ---------- ayna is for you if: the quiz's common needs as paper notes ----------
   Same six needs the quiz offers first (WebIntake.jsx COMMON_NEEDS). Each note
   searches the Shop for that need. Sky band, notes tilt at most 2 degrees. */
const FOR_YOU = ['Period product support', 'Cramps or period pain', 'Heavy periods', 'Vaginal dryness', 'Bladder leakage or incontinence', 'Trouble sleeping'];
const TILTS = ['-1.6deg', '1.2deg', '-0.8deg', '1.8deg', '-1.2deg', '0.9deg'];
function ForYou({ onSearch, onStartQuiz }) {
  return (
    <section className="ay-band ay-band--sky ay-band--grid ay-band--scallop ed-foryou" aria-labelledby="ed-foryou-title">
      <div className="ed-wrap">
        <div className="ed-foryou__head">
          <h2 id="ed-foryou-title" className="ed-h1">ayna is for you if you’re looking for…</h2>
          <span className="ay-toggle-pill" aria-hidden="true">Personalized <b>ON</b></span>
        </div>
        <ul className="ed-foryou__notes">
          {FOR_YOU.map((t, i) => (
            <li key={t}>
              <a className={`ay-note${i % 3 === 1 ? ' ay-note--pink' : ''}${i % 2 ? ' ay-note--fold' : ''}`} style={{ '--tilt': TILTS[i] }} href={`/shop?q=${encodeURIComponent(t)}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onSearch?.(t); }}>
                <span className="ed-foryou__q">“{t}”</span>
                <span className="ed-foryou__go">See matches <Arrow /></span>
              </a>
            </li>
          ))}
        </ul>
        <Go className="ay-btn ay-btn--text" href="/quiz" onGo={onStartQuiz}>Answer six questions<Arrow /></Go>
      </div>
    </section>
  );
}

/* ---------- why: one counter photo, four parts ---------- */
const WHY = [
  { t: 'Matched to your body', d: 'See how well each product fits you, based on what you tell us.' },
  { t: 'Evidence beside each pick', d: 'What the research says, with sources, right next to the product.' },
  { t: 'Real experiences', d: 'Posts from women who have actually used it.' },
  { t: 'Your whole routine', d: 'Save what you use and see what fits next.' },
];
const SPOTS = [['27%', '24%'], ['74%', '40%'], ['20%', '66%'], ['88%', '56%']];

function Why() {
  return (
    <section className="ed-wrap ed-sec" aria-labelledby="ed-why-title">
      <div className="ed-why">
        <figure className="ed-why__photo ay-frame">
          <img src="/landing/hiw-ecosystem-vanity.webp" alt="A marble bathroom vanity by candlelight, skincare and makeup laid out around the sink" loading="lazy" />
          {SPOTS.map(([left, top], i) => <span key={left} className="ed-why__spot" style={{ left, top }} aria-hidden="true">{i + 1}</span>)}
        </figure>
        <div>
          <h2 id="ed-why-title" className="ed-h2">Your counter, decoded.</h2>
          <p className="ed-meta" style={{ marginTop: 8 }}>What ayna actually is, in four parts.</p>
          <ol className="ed-why__list">
            {WHY.map((w, i) => (
              <li key={w.t}>
                <span className="ed-why__n" aria-hidden="true">{i + 1}</span>
                <h3 className="ed-rowtitle">{w.t}</h3>
                <p>{w.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- shop by need: the dark band, then the photo strip ---------- */
function ShopBand({ onOpenProduct, onViewDiscovery }) {
  const needs = useMemo(() => MACRO_GROUPS.filter((g) => g.id !== 'all')
    .map((g) => ({ id: g.id, label: g.label, group: g.id }))
    .map((n) => ({ ...n, pool: productsForNeed(n).filter(NEEDS_PHOTO).sort((a, b) => Number(isPartnerBrandItem(b)) - Number(isPartnerBrandItem(a))) }))
    .filter((n) => n.pool.length >= 2), []);
  const [id, setId] = useState(needs[0]?.id);
  const [allChips, setAllChips] = useState(false);
  const need = needs.find((n) => n.id === id) || needs[0];
  const CHIP_MAX = 7;
  const shownNeeds = allChips ? needs : needs.slice(0, CHIP_MAX).concat(needs.slice(CHIP_MAX).filter((n) => n.id === id));
  if (!need) return null;
  const partner = need.pool.filter((p) => isPartnerBrandItem(p)).slice(0, 1);
  const rest = need.pool.filter((p) => !isPartnerBrandItem(p));
  const four = [...partner, ...rest].slice(0, 4).sort((a, b) => need.pool.indexOf(a) - need.pool.indexOf(b));
  return (
    <section className="ed-band ed-scallop" aria-labelledby="ed-shop-title">
      <div className="ed-wrap">
        <header className="ed-head">
          <h2 id="ed-shop-title" className="ed-h2">Shop by need</h2>
          <span className="ed-head__count">{need.pool.length} {need.label} products</span>
        </header>
        <div className="ed-chiprow" role="group" aria-label="Choose a need">
          {shownNeeds.map((n) => (<button key={n.id} type="button" className="ay-chip" aria-pressed={n.id === need.id} onClick={() => setId(n.id)}>{n.label}</button>))}
          {needs.length > CHIP_MAX && <button type="button" className="ay-chip" aria-expanded={allChips} onClick={() => setAllChips((v) => !v)}>{allChips ? 'Fewer' : `More (${needs.length - CHIP_MAX})`}</button>}
        </div>
        <div key={need.id}><Shelf products={four} onOpenProduct={onOpenProduct} label={`${need.label} products`} /></div>
        <div className="ed-band__foot">
          <Go className="ay-btn ay-btn--secondary" href="/shop" onGo={() => onViewDiscovery?.(need.group ? { initialMacroGroup: need.group } : '')}>See all {need.label} products</Go>
          <Go className="ay-btn ay-btn--text" href="/shop" onGo={() => onViewDiscovery?.('')}>Browse the whole Shop</Go>
        </div>
      </div>
      <Strip />
      <span className="ay-checker" aria-hidden="true" />
    </section>
  );
}

function Strip() {
  const list = (hidden) => (
    <ul aria-hidden={hidden || undefined}>
      {STRIP.map((p) => (<li key={p.src}><img src={p.src} alt={hidden ? '' : p.alt} loading="lazy" /></li>))}
    </ul>
  );
  return <div className="ed-strip ay-pinstripe" role="group" aria-label="Photographs from ayna"><div className="ed-strip__track">{list(false)}{list(true)}</div></div>;
}

/* ---------- how it works: these ARE a sequence ---------- */
const STEPS = [
  { t: 'Answer six questions', d: 'About your body and what you avoid.', icon: 'chat', tone: '', src: '/landing/hiw-questions-cabinet.webp', alt: 'A woman in a white robe reaching into her bathroom cabinet', pos: '50% 35%' },
  { t: 'We check the evidence', d: 'Across products, apps and care.', icon: 'book', tone: 'sky', src: '/landing/hiw-evidence-reading.webp', alt: 'Two friends in glasses reading a book together in front of bookshelves', pos: '50% 40%' },
  { t: 'Get your ecosystem', d: 'Ranked for you.', icon: 'shelf', tone: 'espresso', src: '/landing/hiw-ecosystem-cabinet.webp', alt: 'A medicine cabinet with shelves full of skincare and beauty products', pos: '50% 50%' },
  { t: 'You decide', d: 'Nothing is bought until you say so.', icon: 'hand', tone: 'butter', src: '/landing/hiw-decide-basket.webp', alt: 'Looking down at a red shopping basket of products between two sneakers', pos: '50% 45%' },
];
function How({ onViewHowItWorks }) {
  return (
    <section className="ed-wrap ed-sec" aria-labelledby="ed-how-title">
      <header className="ed-head">
        <h2 id="ed-how-title" className="ed-h2">How it works</h2>
        <Go className="ay-btn ay-btn--text ed-head__all" href="/how-it-works" onGo={onViewHowItWorks}>The full method<Arrow /></Go>
      </header>
      <ol className="ed-steps">
        {STEPS.map((st, i) => (
          <li key={st.t} className="ed-step ay-tabcard">
            <span className={`ay-tabcard__strip${st.tone ? ` ay-tabcard__strip--${st.tone}` : ''}`} aria-hidden="true">Step {i + 1}</span>
            <Sticker icon={st.icon} />
            <div className="ed-step__in">
              <figure className="ed-step__img ay-frame"><img src={st.src} alt={st.alt} style={{ objectPosition: st.pos }} loading="lazy" /></figure>
              <div>
                <h3 className="ed-rowtitle"><span className="ed-sr">Step {i + 1}: </span>{st.t}</h3>
                <p>{st.d}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- proof: how evidence is graded (src/matching/v2.js evidenceGrade) ---------- */
const LEVELS = [
  { n: 3, word: 'Strong evidence', note: 'Research on the product itself.' },
  { n: 2, word: 'Some evidence', note: 'Clinical guidelines, or research on its ingredients.' },
  { n: 1, word: 'Limited evidence', note: 'Less direct research so far. We say so plainly.' },
];
function Evidence({ onViewArticles }) {
  return (
    <section className="ed-wrap ed-sec" aria-labelledby="ed-ev-title">
      <div className="ed-evidence">
        <div className="ed-evidence__copy">
          <h2 id="ed-ev-title" className="ed-h2">How strong is the evidence? We show you.</h2>
          <p className="ed-body">Product pages grade the research on the same three-step scale, next to the sources we read. Unsupported claims are labeled, not upgraded into facts.</p>
          <Go className="ay-btn ay-btn--text" href="/library" onGo={onViewArticles}>Read our sources<Arrow /></Go>
        </div>
        <div className="ay-group is-padded ed-evidence__group">
          <span className="ay-oval ed-evidence__oval" aria-hidden="true">Evidence checked</span>
          <ul className="ed-rows" aria-label="The three evidence levels">
            {LEVELS.map((l) => (
              <li key={l.n} className="ed-level">
                <span className="ay-meter" data-level={l.n}>
                  <span className="ay-meter__word">{l.word}</span>
                  <span className="ay-meter__bars" role="img" aria-label={`${l.n} of 3`}>{[1, 2, 3].map((b) => <i key={b} />)}</span>
                </span>
                <span className="ed-level__note">{l.note}</span>
              </li>
            ))}
          </ul>
          <p className="ed-evidence__srcs ed-caption">Sources include NIH research, ACOG guidance and CDC data, where they exist for the product.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- reads: today's word + the three reads that earn trust ---------- */
const LEAD_READS = [
  { id: 'heavy-bleeding', title: 'Heavy Menstrual Bleeding', teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated.', source: 'UpToDate · ACOG · CDC', src: '/landing/articles-heavy-bleeding-satin.webp', alt: 'Pads and tampons scattered on red satin' },
  { id: 'period-pain-when-to-seek-care', title: 'Period Pain: When to Seek Care', teaser: 'Normal cramps vs. signs that something else may be going on, and what clinicians may suggest.', source: 'ACOG · UpToDate · Mayo Clinic', src: '/landing/articles-period-pain-hotwater.webp', alt: 'A woman in striped pajamas holding a hot water bottle' },
  { id: 'pcos-basics', title: 'PMOS: What It Is and How It’s Managed', teaser: 'Diagnosis, symptoms, and evidence-based treatment, including lifestyle and medication.', source: 'ACOG · Endocrine Society · UpToDate', src: '/landing/articles-pcos-mirror.webp', alt: 'Red lips reflected in a small red compact mirror' },
];
function Reads({ onViewArticle, onViewArticles }) {
  const fact = useMemo(() => { try { return getDailyFact(); } catch { return null; } }, []);
  const open = (id) => { if (onViewArticle) onViewArticle(id); else onViewArticles?.(); };
  return (
    <section className="ed-wrap ed-sec" aria-labelledby="ed-reads-title">
      <header className="ed-head">
        <h2 id="ed-reads-title" className="ed-h2">Short reads, real sources.</h2>
        <a className="ay-btn ay-btn--text ed-head__all" href="/library" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onViewArticles?.(); }}>Open the Library<Arrow /></a>
      </header>
      <div className={fact ? 'ed-reads' : undefined}>
        {fact && (
          <aside className="ay-group is-padded ed-word" aria-label="Word of the day">
            <span className="ed-meta">Word of the day</span>
            <strong className="ed-word__term">{fact.term}</strong>
            <p>{fact.text}</p>
            <small className="ed-caption" style={{ marginTop: 'auto' }}>From the ayna glossary. General information, not medical advice.</small>
          </aside>
        )}
        <ul className="ed-readrow">
          {LEAD_READS.map((r) => (
            <li key={r.id}>
              <a className="ed-card ed-read" href={`/library/${r.id}`} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); open(r.id); }}>
                <span className="ed-read__img"><img src={r.src} alt={r.alt} loading="lazy" /></span>
                <span className="ed-read__body">
                  <strong className="ed-rowtitle">{r.title}</strong>
                  <span className="ed-read__teaser">{r.teaser}</span>
                  <small className="ed-read__src ed-caption">Sources: {String(r.source || '').replace(/\s*·\s*/g, ', ')}</small>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- community: the one sky band (news, real talk, members' top posts) ---------- */
function Community({ onViewCommunity, posts = [] }) {
  const news = useLatestAnnouncement();
  return (
    <section className="ed-sky ay-band ay-band--pink ay-band--scallop" aria-labelledby="ed-comm-title">
      <div className="ed-wrap ed-sky__grid">
        <figure className="ed-sky__photo ay-polaroid" style={{ '--tilt': '-1.5deg' }}><img src="/landing/story-reviews-phones.webp" alt="Friends in a circle looking down at their phones, blue sky above" loading="lazy" /><figcaption>The ayna community</figcaption></figure>
        <div className="ed-sky__copy">
          <h2 id="ed-comm-title" className="ed-h2">Real talk about what women actually use.</h2>
          <p className="ed-body">Reviews, questions and routines from the ayna community, in one place. Ask questions, review what you use and share playlists with women who get it.</p>
          <Go className="ay-btn ay-btn--secondary" href="/community" onGo={onViewCommunity}>Read reviews</Go>
        </div>
        <div>
          <article className="ed-news" aria-labelledby="ed-news-title">
            <span className="ed-news__label">ayna news</span>
            <h3 id="ed-news-title" className="ed-h3">{news ? news.title : 'ayna Community is open.'}</h3>
            <p className="ed-body">{news ? news.body : 'Ask questions, review what you use and share playlists with women who get it.'}</p>
            <Go className="ay-btn ay-btn--text" href="/community" onGo={onViewCommunity}>{news ? 'Read it in Community' : 'See Community'}<Arrow /></Go>
          </article>
          {posts.length > 0 && (
            <ul className="ed-posts" aria-label="From the Powder Room">
              {posts.slice(0, 2).map((post, i) => {
                const anon = post.is_anonymous || !post.author_id;
                const who = anon ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
                return (
                  <li key={post.id}>
                    <button type="button" className="ed-post ay-note" style={{ '--tilt': i ? '1deg' : '-1deg' }} onClick={() => onViewCommunity?.()}>
                      <span className="ed-post__meta">From the Powder Room · {post.kind === 'question' ? 'Question' : post.kind === 'review' ? 'Review' : 'Post'} · {who}</span>
                      <span className="ed-post__body">{post.body}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- who we are + the community round ----------
   Investment copy lives in src/data/invest.js. The disclaimer stays with the button. */
function Us({ onViewAbout }) {
  return (
    <section className="ed-wrap ed-sec" aria-labelledby="ed-us-title">
      <div className="ed-us">
        <figure className="ay-folder ed-us__photo">
          <span className="ay-folder__sheet" aria-hidden="true" /><span className="ay-folder__sheet" aria-hidden="true" />
          <span className="ay-folder__photo">
            <span className="ay-folder__clip" aria-hidden="true"><svg viewBox="0 0 46 40"><path d="M5 16h36l-5 20H10z" /><path d="M14 16V5h18v11" /></svg></span>
            <img src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" loading="lazy" width="1800" height="1198" />
          </span>
          <figcaption className="ay-folder__pocket"><span className="ay-folder__title">Puloma, Eliz &amp; Ameera</span></figcaption>
        </figure>
        <div className="ed-us__copy">
          <h2 id="ed-us-title" className="ed-h2">Built by three women who wanted better answers.</h2>
          <p className="ed-body">We met at Cornell, bringing different experiences to the same question: why does understanding our options require so much searching?</p>
          <Go className="ay-btn ay-btn--secondary" href="/about" onGo={onViewAbout}>Meet us</Go>
        </div>
      </div>
      <div className="ay-group is-padded ed-invest" aria-labelledby="ed-invest-title" role="region">
        <div className="ed-invest__copy">
          <h2 id="ed-invest-title" className="ed-h2">Invest in ayna</h2>
          <p className="ed-body">We&rsquo;re so excited to extend an opportunity for you to invest in ayna, whether you&rsquo;re one of our earliest ayna users or a part of the greater community passionate about ayna&rsquo;s work to expand the future of women&rsquo;s health. Join our community round and learn more on Wefunder.</p>
          <a className="ay-btn ay-btn--primary" href={WEFUNDER_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackInvestClick('landing')}>
            Invest on Wefunder<span className="ed-sr"> (opens in a new tab)</span><Arrow />
          </a>
          <div className="ed-invest__legal">
            <p className="ed-caption">{TESTING_WATERS_NOTICE}</p>
          </div>
        </div>
        <img src="/landing/laundry-duo.webp" alt="Two friends in curlers reading magazines together on a laundry room floor" loading="lazy" width="736" height="981" />
      </div>
    </section>
  );
}

/* ---------- final call to action ---------- */
function Final({ onStartQuiz, onViewDiscovery }) {
  return (
    <section className="ed-final ay-band ay-band--sky ay-band--grid ay-band--scallop" aria-labelledby="ed-start-title">
      <div className="ed-wrap ed-final__in">
        <span className="ay-frame ed-final__photo"><img src="/landing/banner-bath-phone.webp" alt="A woman in a face mask relaxing in a pink tiled bath, scrolling her phone, products along the ledge" loading="lazy" width="960" height="400" /></span>
        <Envelope className="ed-final__letter">
          <h2 id="ed-start-title" className="ed-h1">Start with six questions.</h2>
          <p className="ed-lead">Then a shop matched to you.</p>
          <div className="ed-final__cta">
            <Go className="ay-btn ay-btn--primary" href="/quiz" onGo={onStartQuiz}>See my matches<Arrow /></Go>
            <Go className="ay-btn ay-btn--text" href="/shop" onGo={() => onViewDiscovery?.('')}>Browse the Shop</Go>
          </div>
        </Envelope>
      </div>
    </section>
  );
}

/* ---------- page ---------- */
// `personal` (signed in): the same page with a welcome-back hero, and
// `personalSlot` (her dashboard row) right under it; `communityPosts` are
// the two most helpful Powder Room posts, shown in the community band.
export default function LandingV2({ onStartQuiz, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewWaitlist, onViewCommunity, onViewHowItWorks, onSearch, personal = null, personalSlot = null, communityPosts = [], heroBanner = null }) {
  const paused = useMotionPaused();
  return (
    <div className={`ed ed-home${paused ? ' is-paused' : ''}`}>
      <Hero onStartQuiz={onStartQuiz} onSearch={onSearch} personal={personal} banner={heroBanner} />
      {personal?.dashboard ? personalSlot : <Brands onViewWaitlist={onViewWaitlist} />}
      {!personal?.dashboard && personalSlot}
      <Picks onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} picks={personal?.topPicks || null} />
      {!personal && <ForYou onSearch={onSearch} onStartQuiz={onStartQuiz} />}
      <Why />
      <ShopBand onOpenProduct={onOpenProduct} onViewDiscovery={onViewDiscovery} />
      <How onViewHowItWorks={onViewHowItWorks} />
      <Evidence onViewArticles={onViewArticles} />
      <Reads onViewArticle={onViewArticle} onViewArticles={onViewArticles} />
      <Community onViewCommunity={onViewCommunity} posts={communityPosts} />
      <Us onViewAbout={onViewAbout} />
      {!(personal && personal.hasQuiz) && <Final onStartQuiz={onStartQuiz} onViewDiscovery={onViewDiscovery} />}
    </div>
  );
}
function useMotionPaused() {
  const read = () => { try { return document.documentElement.classList.contains('ay-motion-paused') || localStorage.getItem('ayna_motion_paused') === '1'; } catch { return false; } };
  const [paused, setPaused] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setPaused(document.documentElement.classList.contains('ay-motion-paused')));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return paused;
}
