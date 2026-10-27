import { useEffect, useMemo, useRef, useState } from 'react';
import SlideToStart from '../ui/SlideToStart.jsx';
import SmartSearchInput from '../search/SmartSearchInput.jsx';
import MedicalNote from '../MedicalNote.jsx';
import ProductCard from '../ProductCard.jsx';
import Photo from '../ui/Photo.jsx';
import { Marquee, ScallopEdge, SnapCarousel } from '../ui/ay/index.js';
import ScoreRings from '../../mobile/components/ScoreRings.jsx';
import { HomeHighlights } from '../../mobile/components/HomeHero.jsx';
import { PARTNER_BRANDS } from '../../utils/partnerBrands.js';
import { HOME_SEARCH_HINTS } from '../shop/homeSearchHints.js';
import { ALL_PRODUCTS, useCatalogReady } from '../../data/catalog.js';
import { isPlainLeftClick } from '../../utils/productRoute.js';
import { motionOff, useCountUp, useInViewOnce } from '../../utils/motion.js';
import './landing-showcase.css';

/*
 * The landing (founder, Oct 27 01:10-01:18): the website's / and the app's
 * signed-out Home are this one page, so people see what they get.
 *
 *   1 hero      espresso band, wavy edge: the app's world raining down behind
 *               a centred block (headline, one line, search, Slide to start)
 *   2 trust     one row of facts that are true today
 *   3 features  five big alternating blocks, each a real ayna component fed a
 *               clearly labelled Sample state, then every feature in one row
 *   4 how       three steps
 *   5 brands    the real partner names (the page's one loop besides the rain)
 *   6 Pro       the Early Access prices, as static text
 *   7 founders  short, then the closing call to action and the medical note
 *
 * Never her data: every widget that looks like health data says "Sample", and
 * no match percentage is ever shown on a real product. Match % and data tiles
 * stand alone. Real products are shown as they are in the Shop.
 */

const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
const Sample = ({ className = '' }) => <span className={`lsx-sample ${className}`.trim()}>Sample</span>;

/* ------------------------------------------------------------------ */
/* Hero: the raining collage                                           */
/* ------------------------------------------------------------------ */

// Real catalog packshots (public/products/catalog), shown as they are.
const RAIN_PRODUCTS = ['p-saalt-cup', 'p-lola-tampon', 'p-thermacare', 'p-proov-complete', 'p-elvie-trainer', 'p-buni-transform-scar-body-oil', 'p-winx-uti-test-treat', 'p-lim-method-bundle', 'p-rael-organic-pad', 'p-thinx', 'p-evening-primrose', 'p-vitex'];
const img = (id) => `/products/catalog/${id}.webp`;

function MiniRing({ value = 24, of = 28 }) {
  const r = 22; const c = 2 * Math.PI * r;
  return (
    <svg className="lsx-mini-ring" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r={r} className="lsx-mini-ring__track" />
      <circle cx="28" cy="28" r={r} className="lsx-mini-ring__arc" strokeDasharray={`${(c * value / of).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 28 28)" />
      <text x="28" y="33" textAnchor="middle">{value}</text>
    </svg>
  );
}
const SPARK = [6, 9, 7, 8, 11, 10, 13];
function MiniSpark({ values = SPARK, w = 120, h = 36 }) {
  const lo = Math.min(...values); const hi = Math.max(...values); const span = hi - lo || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (w - 8) + 4},${h - 4 - ((v - lo) / span) * (h - 10)}`);
  const [lx, ly] = pts[pts.length - 1].split(',');
  return (
    <svg className="lsx-mini-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true" preserveAspectRatio="none">
      <polyline points={pts.join(' ')} />
      <circle cx={lx} cy={ly} r="3.5" />
    </svg>
  );
}

// One tile per kind. Widget tiles are small real-looking versions of the app's features, always marked Sample.
function RainTile({ t }) {
  switch (t.kind) {
    case 'product':
      return <span className="lsx-t is-product"><img src={img(t.id)} alt="" loading="eager" fetchPriority={t.eager ? 'auto' : 'low'} decoding="async" width="160" height="160" /></span>;
    case 'ring':
      return <span className="lsx-t is-ring is-ink"><MiniRing /><b>Cycle day</b><Sample /></span>;
    case 'sleep':
      return (
        <span className="lsx-t is-sleep is-butter">
          <small>Sleep</small><b>6h 40m</b>
          <span className="lsx-t__bars" aria-hidden="true">{[7, 5, 8, 6, 9, 4, 6].map((h, i) => <i key={i} style={{ '--h': h / 9 }} />)}</span>
          <em>Under usual</em><Sample />
        </span>
      );
    case 'streak':
      return (
        <span className="lsx-t is-streak is-pink">
          <b>4-day streak</b>
          <span className="lsx-t__dots" aria-hidden="true">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <i key={i} className={i < 4 ? 'is-on' : ''}><small>{d}</small></i>)}</span>
          <Sample />
        </span>
      );
    case 'rundown':
      return <span className="lsx-t is-rundown is-ink"><span className="lsx-t__bubble">3</span><b>Rundown</b><Sample /></span>;
    case 'highlight':
      return <span className="lsx-t is-highlight is-pink"><small>Today&rsquo;s highlight</small><MiniSpark /><b>Resting heart rate</b><Sample /></span>;
    case 'ask':
      return <span className="lsx-t is-ask is-butter"><span className="lsx-t__chip"><i aria-hidden="true" />Ask ayna</span><b>What helps with cramps at night?</b><Sample /></span>;
    case 'match':
      return <span className="lsx-t is-match is-ink"><span className="lsx-t__pill">87% match</span><small>Why it fits you</small><Sample /></span>;
    case 'routine':
      return <span className="lsx-t is-routine is-butter"><span className="lsx-t__now">Now</span><b>Evening routine</b><small>2 steps</small><Sample /></span>;
    default:
      return null;
  }
}

// Columns: products and widgets interleaved, each column a different mix and speed.
const COLS = [
  [{ kind: 'product', id: RAIN_PRODUCTS[0], eager: true }, { kind: 'ring' }, { kind: 'product', id: RAIN_PRODUCTS[1] }, { kind: 'ask' }, { kind: 'product', id: RAIN_PRODUCTS[2] }, { kind: 'streak' }],
  [{ kind: 'highlight' }, { kind: 'product', id: RAIN_PRODUCTS[3], eager: true }, { kind: 'match' }, { kind: 'product', id: RAIN_PRODUCTS[4] }, { kind: 'routine' }, { kind: 'product', id: RAIN_PRODUCTS[5] }],
  [{ kind: 'product', id: RAIN_PRODUCTS[6], eager: true }, { kind: 'sleep' }, { kind: 'product', id: RAIN_PRODUCTS[7] }, { kind: 'rundown' }, { kind: 'product', id: RAIN_PRODUCTS[8] }, { kind: 'ask' }],
  [{ kind: 'streak' }, { kind: 'product', id: RAIN_PRODUCTS[9] }, { kind: 'ring' }, { kind: 'product', id: RAIN_PRODUCTS[10] }, { kind: 'highlight' }, { kind: 'product', id: RAIN_PRODUCTS[11] }],
  [{ kind: 'product', id: RAIN_PRODUCTS[2] }, { kind: 'routine' }, { kind: 'product', id: RAIN_PRODUCTS[0] }, { kind: 'sleep' }, { kind: 'product', id: RAIN_PRODUCTS[6] }, { kind: 'match' }],
  [{ kind: 'rundown' }, { kind: 'product', id: RAIN_PRODUCTS[4] }, { kind: 'highlight' }, { kind: 'product', id: RAIN_PRODUCTS[1] }, { kind: 'ring' }, { kind: 'product', id: RAIN_PRODUCTS[9] }],
];
const SPEEDS = [34, 40, 30, 38, 32, 42];

/* Decorative: the app's world raining down. aria-hidden; pauses on hover; still under reduced motion. */
function Rain({ cols = 3, from = 0, className = '' }) {
  const list = COLS.slice(from, from + cols);
  return (
    <div className={`lsx-rain ${className}`.trim()} aria-hidden="true" style={{ '--cols': cols }}>
      {list.map((col, c) => (
        <div key={c} className="lsx-rain__col" style={{ '--dur': `${SPEEDS[from + c]}s`, '--delay': `${-(from + c) * 7}s` }}>
          <div className="lsx-rain__run">
            {[0, 1].map((copy) => (
              <div key={copy} className="lsx-rain__set">
                {col.map((t, i) => <RainTile key={`${copy}-${i}`} t={copy ? { ...t, eager: false } : t} />)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Search({ onSearch }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (q || focused || motionOff()) return undefined;
    const t = window.setInterval(() => setI((v) => (v + 1) % HOME_SEARCH_HINTS.length), 2800);
    return () => window.clearInterval(t);
  }, [q, focused]);
  return (
    <form className="lsx-search" role="search" onSubmit={(e) => { e.preventDefault(); onSearch?.(q); }}>
      <label>
        <span className="lsx-sr">Search products</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <SmartSearchInput
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }}
          onPick={(s) => onSearch?.(s.query)} anchor=".lsx-search" placeholder=" " enterKeyHint="search" autoComplete="off"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {!q && <span className="lsx-search__hint" aria-hidden="true">Try: <b key={i}>{HOME_SEARCH_HINTS[i]}</b></span>}
      </label>
      <button type="submit" aria-label="Search"><Arrow /></button>
    </form>
  );
}

function Hero({ variant, cta, onSearch, onSignIn, onBrowse, onHowItWorks, signedIn }) {
  const app = variant === 'app';
  return (
    <section className={`lsx-hero is-${variant}`} aria-labelledby="lsx-title">
      <div className="lsx-hero__band">
        {app && (
          <div className="lsx-top">
            <span className="lsx-top__mark" aria-hidden="true">ayna</span>
            {!signedIn && onSignIn && <button type="button" className="lsx-top__btn" onClick={onSignIn}>Sign in</button>}
          </div>
        )}
        <Rain cols={3} className="lsx-rain--strip" />
        <Rain cols={3} className="lsx-rain--left" />
        <Rain cols={3} from={3} className="lsx-rain--right" />
        <div className="lsx-hero__center">
          <h1 id="lsx-title" className="lsx-shout">Find what fits <span>your body.</span></h1>
          <p className="lsx-lead">Women&rsquo;s health products matched to you, with the evidence beside each one.</p>
          <Search onSearch={onSearch} />
          <SlideToStart className="lsx-hero__sts" tour="landing-start" label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
          <div className="lsx-hero__links">
            {app && !signedIn && onBrowse && <button type="button" onClick={() => onBrowse()}>Explore first</button>}
            {!app && onHowItWorks && <a href="/how-it-works" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onHowItWorks(); }}>How we match<Arrow /></a>}
          </div>
        </div>
      </div>
      <ScallopEdge shape="wave" tone="ink" className="lsx-edge" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip                                                         */
/* ------------------------------------------------------------------ */
const TRUST = [
  { k: 'health', t: 'Works with Apple Health and WHOOP', icon: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /> },
  { k: 'pay', t: 'Brands can’t pay to change your match', icon: <><circle cx="12" cy="12" r="8" /><path d="M7 7l10 10" /></> },
  { k: 'src', t: 'Sources linked on product pages', icon: <><path d="M6 4h9l3 3v13H6z" /><path d="M9 11h6M9 15h6" /></> },
];
function Trust() {
  return (
    <section className="lsx-trust" aria-label="Why you can trust ayna">
      <ul>
        {TRUST.map((x) => (
          <li key={x.k}><svg viewBox="0 0 24 24" aria-hidden="true">{x.icon}</svg><span>{x.t}</span></li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */
const isoDay = (offset) => { const d = new Date(); d.setDate(d.getDate() - offset); return d.toISOString().slice(0, 10); };
function sampleChart(metric, values, usual) {
  const points = values.map((value, i) => ({ day: isoDay(values.length - 1 - i), value }));
  return { metric, points, week: values.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, values.length), usual };
}

function DataVisual() {
  const ref = useRef(null);
  const seen = useInViewOnce(ref);
  const today = isoDay(0);
  const sleep = useMemo(() => sampleChart('sleep_minutes', [452, 430, 401, 415, 388, 402, 400], 452), []);
  const steps = useMemo(() => sampleChart('steps', [7400, 8800, 9100, 7900, 8600, 8300, 8201], 7600), []);
  const rhr = useMemo(() => sampleChart('resting_heart_rate', [61, 62, 61, 63, 64, 65, 66], 62), []);
  // One highlight, the way Home shows today's.
  const items = useMemo(() => [
    { id: 's1', metric: 'resting_heart_rate', label: 'Today’s highlight', title: 'Resting heart rate is above your usual', chart: rhr, band: { lo: 60, hi: 63 }, isNew: true },
  ], [rhr]);
  return (
    <div className="lsx-vis lsx-vis--data" ref={ref}>
      <div className="lsx-phone">
        <div className="lsx-phone__head"><b>Your data</b><Sample /></div>
        {/* The real dials, filled once when they come into view. */}
        <div className="lsx-phone__rings">{seen ? <ScoreRings bare animate label="Sample scores" cycle={{ cycleDay: 24, avgLength: 28 }} sleep={sleep} activity={steps} /> : <div className="lsx-rings-hold" />}</div>
        <div className="lsx-phone__row">
          <span className="lsx-bubble"><span>3</span><small>Rundown</small></span>
          <span className="lsx-streak"><b>4-day streak</b><span>{[1, 1, 1, 1, 0, 0, 0].map((on, i) => <i key={i} className={on ? 'is-on' : ''} />)}</span></span>
        </div>
      </div>
      <div className="lsx-vis__float"><HomeHighlights items={items} today={today} /></div>
    </div>
  );
}

function useShowcaseProducts(n = 3) {
  const ready = useCatalogReady();
  return useMemo(() => {
    if (!ready) return [];
    const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
    return ['p-saalt-cup', 'p-thermacare', 'p-lola-pad', 'p-rael-organic-pad', 'p-winx-uti-test-treat'].map((id) => byId.get(id)).filter((p) => p?.image).slice(0, n);
  }, [ready, n]);
}

function MatchVisual({ onOpenProduct, onSeeMatch }) {
  const products = useShowcaseProducts(2);
  const ref = useRef(null);
  const seen = useInViewOnce(ref);
  const n = Math.round(useCountUp(87, seen));
  const r = 30; const c = 2 * Math.PI * r;
  return (
    <div className="lsx-vis lsx-vis--match" ref={ref}>
      <ul className="lsx-cards">
        {products.length ? products.map((p) => (
          <li key={p.id}><ProductCard product={p} onOpen={onOpenProduct} onSeeMatch={onSeeMatch} /></li>
        )) : [0, 1].map((i) => <li key={i} aria-hidden="true"><div className="lsx-card-skel" /></li>)}
      </ul>
      <div className="lsx-why">
        <div className="lsx-why__top">
          <svg className="lsx-why__ring" viewBox="0 0 72 72" aria-hidden="true">
            <circle cx="36" cy="36" r={r} className="lsx-why__track" />
            <circle cx="36" cy="36" r={r} className="lsx-why__arc" strokeDasharray={`${(c * n / 100).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 36 36)" />
          </svg>
          <span className="lsx-why__n" aria-label="87% match, a sample">{n}%</span>
          <span className="lsx-why__t"><b>Why this match</b><Sample /></span>
        </div>
        <ul className="lsx-why__list">
          <li><i aria-hidden="true" />Fits what you told us</li>
          <li><i aria-hidden="true" />Evidence level beside it</li>
          <li><i aria-hidden="true" />Flags what you avoid</li>
        </ul>
        <span className="lsx-why__compare"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v16M16 4v16M4 8h8M12 16h8" /></svg>Compare side by side</span>
      </div>
    </div>
  );
}

function AskVisual() {
  const products = useShowcaseProducts(3);
  return (
    <div className="lsx-vis lsx-vis--ask">
      <div className="lsx-chat">
        <div className="lsx-chat__head"><span className="lsx-orb" aria-hidden="true" /><b>Ask ayna</b><Sample /></div>
        <p className="lsx-chat__me">What helps with cramps at night?</p>
        <div className="lsx-chat__ayna">
          <p>Here is what fits your answers, with the evidence level beside each one.</p>
          <ul>{products.map((p) => <li key={p.id}><span className="lsx-plate"><img src={p.image} alt="" loading="lazy" decoding="async" /></span><span>{p.name}</span></li>)}</ul>
        </div>
        <div className="lsx-chat__chips"><span>Why these?</span><span>Anything without fragrance?</span></div>
      </div>
    </div>
  );
}

function RoutineVisual() {
  const products = useShowcaseProducts(3);
  const slots = [
    { k: 'Morning', p: products[2] },
    { k: 'Afternoon', p: products[0], now: true },
    { k: 'Evening', p: products[1] },
  ];
  return (
    <div className="lsx-vis lsx-vis--routine">
      <div className="lsx-routine">
        <div className="lsx-routine__head"><b>Your routine</b><Sample /></div>
        <ol>
          {slots.map((s) => (
            <li key={s.k} className={s.now ? 'is-now' : ''}>
              <span className="lsx-routine__dot" aria-hidden="true" />
              <span className="lsx-routine__when">{s.k}{s.now && <em>Now</em>}</span>
              {s.p ? <span className="lsx-routine__item"><span className="lsx-plate"><img src={s.p.image} alt="" loading="lazy" decoding="async" /></span><span>{s.p.name}</span></span> : <span className="lsx-routine__item is-skel" />}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// Real reads from the Library (titles, photos and sources as published).
const READS = [
  { id: 'heavy-bleeding', title: 'Heavy menstrual bleeding', source: 'UpToDate, ACOG, CDC', src: '/landing/articles-heavy-bleeding-satin.webp' },
  { id: 'period-pain-when-to-seek-care', title: 'Period Pain: When to Seek Care', source: 'ACOG, UpToDate, Mayo Clinic', src: '/landing/articles-period-pain-hotwater.webp' },
];
function TalkVisual({ posts = [], onViewArticle, onViewCommunity }) {
  const real = posts.filter((p) => String(p.body || '').trim().length >= 20).slice(0, 1);
  return (
    <div className="lsx-vis lsx-vis--talk">
      <a className="lsx-talk__photo" href="/community" onClick={(e) => { if (!onViewCommunity || !isPlainLeftClick(e)) return; e.preventDefault(); onViewCommunity(); }}>
        <Photo src="/landing/story-reviews-phones.webp" alt="Friends in a circle looking down at their phones" sizes="(max-width: 767px) 80vw, 420px" loading="lazy" decoding="auto" />
        <span className="lsx-talk__tag">Community</span>
        {real[0] && <span className="lsx-talk__post"><small>{real[0].kind === 'question' ? 'Question' : real[0].kind === 'review' ? 'Review' : 'Post'} from the community</small>{real[0].body}</span>}
      </a>
      <ul className="lsx-reads">
        {READS.map((r) => (
          <li key={r.id}>
            <a href={`/library/${r.id}`} onClick={(e) => { if (!onViewArticle || !isPlainLeftClick(e)) return; e.preventDefault(); onViewArticle(r.id); }}>
              <span className="lsx-reads__ph"><Photo src={r.src} alt="" sizes="96px" loading="lazy" decoding="auto" /></span>
              <span className="lsx-reads__t"><b>{r.title}</b><small>Sources: {r.source}</small></span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FEATURES = [
  { id: 'data', tone: 'butter', h: 'See what your data means.', p: 'Your cycle, sleep and activity in three rings, with the one change worth knowing about each week.', Visual: DataVisual },
  { id: 'match', tone: 'pink', h: 'Products matched to you, with the evidence.', p: 'Every match says why it fits, how strong the research is, and what to watch out for.', Visual: MatchVisual },
  { id: 'ask', tone: 'butter', h: 'Ask anything.', p: 'Plain answers about your body and your products, with sources where we have them.', Visual: AskVisual },
  { id: 'routine', tone: 'deep', h: 'A routine that fits your day.', p: 'What you use and when you use it, in one simple timeline.', Visual: RoutineVisual },
  { id: 'talk', tone: 'butter', h: 'Real talk, with sources.', p: 'Reviews and questions from women who get it, and short reads with their sources.', Visual: TalkVisual },
];

function Feature({ f, i, props }) {
  const { Visual } = f;
  return (
    <section className={`lsx-feat is-${f.tone}${i % 2 ? ' is-flip' : ''}`} data-rise aria-labelledby={`lsx-f-${f.id}`}>
      <div className="lsx-wrap lsx-feat__grid">
        <div className="lsx-feat__copy">
          <span className="lsx-feat__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          <h2 id={`lsx-f-${f.id}`} className="lsx-h2">{f.h}</h2>
          <p className="lsx-body">{f.p}</p>
        </div>
        <Visual {...props} />
      </div>
    </section>
  );
}

// Every feature, one tap each.
const ALL = [
  { k: 'data', t: 'Your data', d: 'Cycle, sleep and activity, read for you.' },
  { k: 'rundown', t: 'Daily Rundown', d: 'The few things that matter today.' },
  { k: 'matches', t: 'Matches', d: 'Products matched to your answers.' },
  { k: 'ask', t: 'Ask ayna', d: 'Plain answers, with sources.' },
  { k: 'routine', t: 'Routine', d: 'What to use and when.' },
  { k: 'community', t: 'Community', d: 'Reviews and questions from women.' },
  { k: 'library', t: 'Library', d: 'Short reads about your body.' },
  { k: 'compare', t: 'Compare', d: 'Two products side by side.' },
  { k: 'services', t: 'Services', d: 'Care and services, matched too.' },
];
const ALL_ICON = {
  data: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 8 8" /></>,
  rundown: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  matches: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  ask: <><path d="M5 5h14v10H9l-4 4z" /></>,
  routine: <><path d="M5 7h14M5 12h14M5 17h9" /></>,
  community: <><circle cx="9" cy="9" r="3" /><circle cx="16" cy="10" r="2.5" /><path d="M4 19c.8-3 2.8-4.5 5-4.5s4.2 1.5 5 4.5M14 15.5c2.6-.6 4.8.6 5.6 3.5" /></>,
  library: <><path d="M5 5h5v14H5zM14 5h5v14h-5z" /></>,
  compare: <path d="M8 4v16M16 4v16M4 8h8M12 16h8" />,
  services: <><path d="M9 4v5a3 3 0 0 0 6 0V4" /><path d="M12 12v3a4 4 0 0 0 8 0v-1" /><circle cx="20" cy="12" r="2" /></>,
};
function AllFeatures({ onFeature }) {
  return (
    <section className="lsx-all" data-rise aria-labelledby="lsx-all-h">
      <div className="lsx-wrap">
        <h2 id="lsx-all-h" className="lsx-h3">Everything in ayna</h2>
        <SnapCarousel label="Everything in ayna" size="plate" className="lsx-all__snap" items={ALL.map((x) => ({ key: x.k, node: (
          <button type="button" className="lsx-all__tile" onClick={() => onFeature?.(x.k)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{ALL_ICON[x.k]}</svg>
            <b>{x.t}</b>
            <span>{x.d}</span>
          </button>
        ) }))} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works, brands, Pro, founders, close                          */
/* ------------------------------------------------------------------ */
const STEPS = [
  { t: 'Answer a few questions', d: 'About your body, your life stage and what you avoid.' },
  { t: 'See your matches', d: 'Each with why it fits and the evidence beside it.' },
  { t: 'You decide', d: 'Save, compare or skip. Nothing is bought until you say so.' },
];
function How({ onHowItWorks }) {
  return (
    <section className="lsx-how" data-rise aria-labelledby="lsx-how-h">
      <div className="lsx-wrap">
        <h2 id="lsx-how-h" className="lsx-h2">How it works</h2>
        <ol className="lsx-steps">
          {STEPS.map((s, i) => (
            <li key={s.t}>
              <span className="lsx-steps__n" aria-hidden="true">{i + 1}</span>
              <b>{s.t}</b>
              <span>{s.d}</span>
            </li>
          ))}
        </ol>
        {onHowItWorks && <a className="lsx-link" href="/how-it-works" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onHowItWorks(); }}>How we match<Arrow /></a>}
      </div>
    </section>
  );
}

function Brands({ onViewPartners }) {
  return (
    <section className="lsx-brands" aria-labelledby="lsx-brands-h">
      <div className="lsx-wrap lsx-brands__head">
        <h2 id="lsx-brands-h" className="lsx-h3">Brands we work with</h2>
        {onViewPartners && <a className="lsx-link" href="/partners" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onViewPartners(); }}>See all<Arrow /></a>}
      </div>
      <Marquee items={PARTNER_BRANDS.map((b) => b.name)} tone="pink" className="lsx-marquee" />
    </section>
  );
}

// Early Access prices (src/components/SubscriptionPaywallModal.jsx on main), as static text.
function Pro() {
  return (
    <section className="lsx-pro" data-rise aria-labelledby="lsx-pro-h">
      <div className="lsx-wrap lsx-pro__grid">
        <div>
          <span className="lsx-pro__tag">ayna Pro · Early Access</span>
          <h2 id="lsx-pro-h" className="lsx-h2">More of ayna, when you want it.</h2>
          <p className="lsx-body">More Ask ayna, unlimited Reads and detailed health history. Basic matches, safety flags and evidence stay free.</p>
          <a className="lsx-link" href="/pro">Learn more<Arrow /></a>
        </div>
        <ul className="lsx-pro__prices">
          <li><small>Monthly</small><b>$4.99</b><s>$8.99</s></li>
          <li><small>Yearly</small><b>$45</b><s>$90</s></li>
        </ul>
      </div>
    </section>
  );
}

function Founders({ onViewAbout }) {
  return (
    <section className="lsx-us" data-rise aria-labelledby="lsx-us-h">
      <div className="lsx-wrap lsx-us__grid">
        <span className="lsx-us__ph"><Photo src="/team/ayna-founders.jpg" alt="Puloma, Eliz and Ameera, ayna's founders, sitting together in Central Park" sizes="(max-width: 767px) 92vw, 520px" loading="lazy" decoding="auto" width="1800" height="1198" /></span>
        <div>
          <h2 id="lsx-us-h" className="lsx-h2">Built by three women who wanted better answers.</h2>
          <p className="lsx-body">Puloma, Eliz and Ameera met at Cornell.</p>
          {onViewAbout && <a className="lsx-link" href="/about" onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onViewAbout(); }}>Meet us<Arrow /></a>}
        </div>
      </div>
    </section>
  );
}

function Close({ cta }) {
  return (
    <section className="lsx-close" aria-labelledby="lsx-close-h">
      <ScallopEdge shape="wave" tone="ink" side="top" className="lsx-edge is-top" />
      <div className="lsx-wrap lsx-close__in">
        <h2 id="lsx-close-h" className="lsx-close__h">Ready when you are.</h2>
        <p className="lsx-body">{cta.note}</p>
        <SlideToStart label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="butter" />
      </div>
    </section>
  );
}

/**
 * variant: 'web' | 'app'. signedIn + hasProfile change the main action to
 * "Go to your Home". onFeature(key) opens a feature from "Everything in ayna".
 */
export default function LandingShowcase({
  variant = 'web', signedIn = false, hasProfile = false,
  onStartQuiz, onGoHome, onSearch, onSignIn, onBrowse, onHowItWorks, onOpenProduct, onFeature,
  onViewArticle, onViewCommunity, onViewAbout, onViewPartners, communityPosts = [], footer = null, banner = null,
}) {
  const home = signedIn && hasProfile && onGoHome;
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: onGoHome, note: 'Your matches, your data and your routine are on Home.' }
    : { label: 'Get my matches', slide: 'Slide to get your matches', go: onStartQuiz, note: 'A few short questions, then your matches. No account needed to start.' };
  const featureProps = { onOpenProduct, onSeeMatch: home ? null : onStartQuiz, posts: communityPosts, onViewArticle, onViewCommunity };
  return (
    <div id="ay-landing" className={`lsx is-${variant}`}>
      <Hero variant={variant} cta={cta} onSearch={onSearch} onSignIn={onSignIn} onBrowse={onBrowse} onHowItWorks={onHowItWorks} signedIn={signedIn} />
      {banner && <div className="lsx-wrap lsx-banner">{banner}</div>}
      <Trust />
      {FEATURES.map((f, i) => <Feature key={f.id} f={f} i={i} props={featureProps} />)}
      <AllFeatures onFeature={onFeature} />
      <How onHowItWorks={onHowItWorks} />
      <Brands onViewPartners={onViewPartners} />
      <Pro />
      <Founders onViewAbout={onViewAbout} />
      <Close cta={cta} />
      <div className="lsx-foot">
        <MedicalNote className="lsx-med" />
        {footer}
      </div>
    </div>
  );
}

