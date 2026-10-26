import React, { useEffect, useMemo, useRef, useState } from 'react';
import PLAIN from '../../data/matching/plainRationales.js';
import { needPhrase } from '../../matching/ontology';
import { useApprovedResearch } from '../../utils/approvedResearch';
import { urgentSignsFor } from '../../utils/urgentSigns';
import { worksWith } from '../../utils/aynaIntegrations';
import { hostLabel } from '../../utils/verificationLinks';
import { summarizeReviewRows, takeProductTab } from '../../utils/community/reviewRatings.js';
import GlossaryTerm from '../GlossaryTerm';
import { findHardTerms, planGlossaryTerms } from '../../data/glossary';
import { fmtDate } from './fmtDate';
import { buildEvidence, noDash, linkKind, publisherOf, cleanTitle, claimRows, evidenceLayers } from './evidenceModel';
import PdpIcon from './PdpIcon.jsx';
import UrgentSigns from './UrgentSigns.jsx';
import ProductCommunityReviews from './ProductCommunityReviews.jsx';
import ProductPeopleSay from './ProductPeopleSay.jsx';
import { useProductReviews } from './useProductReviews.js';
import { evidenceLevel, gradeWords } from './evidenceLevel.js';
import { evidenceMeter, sortSources, clinicianOf, DOC, whoLists, keyFormat, criticalIndex, splitLead, heroNotes, dedupeList, leadClause, brandVoice, safetyGroupOf, groupSafety } from './pdpParts.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { EvidenceMeter, ShowAll } from './PdpParts.jsx';
import { FROM_LISTING } from '../../utils/howToSource.js';
import './pdp-complete.css';
import './pdp-sections.css';

/**
 * The inside of the product page (website and app): everything the team
 * wrote, grouped so it reads at a glance and nothing is lost.
 *
 * Four sticky top tabs (founder, Oct 24), the same on phone and desktop,
 * website and app: Clinical opinion (the team's clinician notes), Scientific
 * literature (evidence overview, then why ayna rated it, then the sources,
 * then ingredient by ingredient), ayna summary (ayna's take, her match, what
 * it is, safety, ingredients and dose, how to use) and Reviews (community,
 * then online; never evidence). Every panel is in the HTML from the start.
 *
 * The words are the team's (src/data); ayna's own additions
 * (src/data/pdpAdditions.js) are labelled as ayna's check with their source.
 */


const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const cap = (t) => String(t || '').replace(/^./, (c) => c.toUpperCase());
// Justifications that only praise the publisher say nothing about the product.
const FILLER_WHY = /is a (leading|trusted|respected|major|well-known)\b[^.]*\b(resource|source|authority|institution|organi[sz]ation)\.?$/i;
const whyText = (w) => {
  const t = noDash(w);
  if (!t || FILLER_WHY.test(t)) return '';
  return t.replace(/^Conservative ayna classification:\s*/i, '').replace(/^./, (c) => c.toUpperCase());
};

// ---------------------------------------------------------------------------
// Text with tap-to-define words
// ---------------------------------------------------------------------------
const TermsCtx = React.createContext(null);
function Tx({ children }) {
  const plan = React.useContext(TermsCtx);
  const text = String(children ?? '');
  const allowed = plan && plan[text];
  if (!allowed || !allowed.length) return text;
  const left = new Set(allowed);
  const out = [];
  let at = 0;
  for (const hit of findHardTerms(text)) {
    if (!left.has(hit.entry.term)) continue;
    left.delete(hit.entry.term);
    if (hit.index > at) out.push(text.slice(at, hit.index));
    out.push(<GlossaryTerm key={`${hit.index}-${hit.text}`} term={hit.entry.term}>{hit.text}</GlossaryTerm>);
    at = hit.index + hit.length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

/** Paragraphs. In long pieces the first sentence of each paragraph leads in bold, so the page can be skimmed. */
function Paras({ list, leadIn = false, className = '' }) {
  if (!list?.length) return null;
  const bold = leadIn && list.length > 1;
  return list.map((p, i) => {
    const m = bold ? p.match(/^(.{20,220}?[.!?])\s+(?=[A-Z0-9"“(])/) : null;
    return (
      <p key={`${i}-${p.slice(0, 24)}`} className={`ayq-p ${className}`.trim()}>
        {m ? <><b className="ayq-leadin"><Tx>{m[1]}</Tx></b> <Tx>{p.slice(m[0].length)}</Tx></> : <Tx>{p}</Tx>}
      </p>
    );
  });
}

/**
 * Long multi-part text: the first parts, then "Show all N parts" opens the
 * rest in place (Oct 25: no sideways shelves; people scroll down, not across).
 * Every word stays in the page.
 */
function ReadShelf({ list, label, leadIn = false, min = 3 }) {
  const [open, setOpen] = useState(false);
  if (!list?.length) return null;
  if (list.length < min) return <div className="ayq-prose"><Paras list={list} leadIn={leadIn} /></div>;
  const first = list.slice(0, 2);
  const rest = list.slice(2);
  return (
    <div className="ayq-prose" aria-label={label}>
      <Paras list={first} leadIn={leadIn} />
      <div hidden={!open || undefined}><Paras list={rest} leadIn={leadIn} /></div>
      <button type="button" className="ayv-showall" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? 'Show less' : `Show all ${list.length} parts`}</button>
    </div>
  );
}

/**
 * One item, full text, scannable: the lead phrase bold on its own line, the
 * rest of the same sentence under it (founder, Oct 26). `lead` names a label
 * ("Pregnancy:") that leads instead. Short items stay one line.
 */
function LR({ text, lead = '' }) {
  const t = String(text || '');
  if (lead) {
    const long = `${lead} ${t}`.trim().split(/\s+/).length >= 12;
    return long ? <span className="ayv-lr"><b className="ayv-lr__lead">{lead}</b><span className="ayv-lr__rest"><Tx>{t}</Tx></span></span> : <span><b className="ayv-item__lead">{lead} </b><Tx>{t}</Tx></span>;
  }
  const [a, b] = leadClause(t);
  return a ? <span className="ayv-lr"><b className="ayv-lr__lead"><Tx>{a}</Tx></b><span className="ayv-lr__rest"><Tx>{b}</Tx></span></span> : <Tx>{t}</Tx>;
}

/** Back to the top of the page (phones), from the end of Safety. */
function BackToTop() {
  const go = (e) => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let n = e.currentTarget.parentElement;
    for (; n && n !== document.body; n = n.parentElement) { const oy = window.getComputedStyle(n).overflowY; if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) break; }
    const target = n && n !== document.body ? n : window;
    target.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };
  return <button type="button" className="ayv-totop" onClick={go}>Back to top</button>;
}

function Bullets({ items, tone = '' }) {
  if (!items?.length) return null;
  return <ul className={`ayq-bullets${tone ? ` is-${tone}` : ''}`}>{items.map((t, i) => <li key={`${i}-${String(t).slice(0, 20)}`}><Tx>{t}</Tx></li>)}</ul>;
}

/** A folder-tab header over a Group: the tab names the part, the Group holds it. */
function Folder({ title, tone = '', children, id, icon = '', className = '' }) {
  return (
    <section className={`ayq-folder${tone ? ` is-${tone}` : ''} ${className}`.trim()} aria-labelledby={id}>
      <h3 id={id} className="ayq-folder__tab">{icon && <PdpIcon name={icon} size={18} />}{title}</h3>
      <div className="ayq-folder__body">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sources: one card style everywhere
// ---------------------------------------------------------------------------
/** One source card: title, the .gov publisher and year, the one-line finding, what kind of source it is. */
function SourceBody({ s }) {
  const meta = [s.publisher || hostLabel(s.url), s.type, s.year].filter(Boolean);
  const why = whyText(s.why);
  return (
    <>
      <h4 className="ayq-src__title">{s.title}</h4>
      <p className="ayq-src__meta">{meta.map((m, i) => <span key={m}>{i > 0 ? ', ' : ''}{m}</span>)}</p>
      {s.negative && <p className="ayq-src__flag">Found no clear benefit</p>}
      {s.summary && <p className="ayq-src__finding"><Tx>{s.summary}</Tx></p>}
      {s.altTitles?.length > 0 && <p className="ayq-src__note">Also listed as: {s.altTitles.join('; ')}</p>}
      {why && <p className="ayq-src__note">ayna’s note: {why}</p>}
      {s.kind?.label && <p className="ayq-src__tier">{s.kind.label}</p>}
      <a className="ayq-src__go" href={s.url} target="_blank" rel="noopener noreferrer">Read the source<span aria-hidden="true"> ↗</span><span className="sr-only">: {s.title} (opens in a new tab)</span></a>
    </>
  );
}


/** Cards in two columns on wide screens, a sideways shelf on phones. */
/** Source cards, strongest first (pdpParts sortSources), 3 then "Show all N". */
function SourceGrid({ items, label, id, compact = false }) {
  if (!items?.length) return null;
  return (
    <div className="ayq-srcs">
      {label && <h4 className="ayq-subh" id={id}>{label} <span className="ayq-count">{items.length}</span></h4>}
      <ShowAll items={sortSources(items)} label="sources" className={`ayq-srcgrid ayv-srclist${compact ? ' is-compact' : ''}`} itemClass={(s) => `ayq-src${s.negative ? ' is-negative' : ''}`} render={(s) => <SourceBody s={s} />} />
    </div>
  );
}

/** Lower-tier links (brand pages, retailers, forums, press): kept, and labelled for what they are. */
function OtherLinks({ items, label = 'Other links', note = '' }) {
  if (!items?.length) return null;
  return (
    <div className="ayq-other">
      <h4 className="ayq-subh">{label}</h4>
      {note && <p className="ayq-meta">{note}</p>}
      <ul className="ayq-linklist">
        {items.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              <span className="ayq-linklist__main">
                <span className="ayq-linklist__title">{s.title}</span>
                {s.summary && <span className="ayq-linklist__sum"><Tx>{s.summary}</Tx></span>}
                {whyText(s.why) && <span className="ayq-linklist__sum">ayna’s note: {whyText(s.why)}</span>}
                <span className="ayq-linklist__tag">{[s.publisher, s.kind?.label].filter(Boolean).join(', ')}</span>
              </span>
              <span className="ayq-linklist__go" aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** ayna's addition: a fact read from a regulator page, labelled as ayna's check. */
function Addition({ a }) {
  return (
    <div className={`ayq-add${a.tone === 'brand' ? ' is-brand' : ''}`}>
      <h4 className="ayq-subh">{a.title}</h4>
      {a.intro && <p className="ayq-p"><Tx>{a.intro}</Tx></p>}
      {a.items?.length > 0 && <Bullets items={a.items} />}
      {a.table && (
        <table className="ayq-table">
          <thead><tr><th scope="col">On the box</th><th scope="col">Holds</th></tr></thead>
          <tbody>{a.table.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody>
        </table>
      )}
      {a.note && <p className="ayq-meta">{a.note}</p>}
      {a.links?.length > 0 && (
        <ul className="ayq-minilinks">{a.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>
      )}
      <p className="ayq-addsrc">
        {a.tone === 'brand' ? 'Source: ' : a.source ? 'Added by ayna from ' : 'Added by ayna'}
        {a.source && <a href={a.source.url} target="_blank" rel="noopener noreferrer">{a.tone === 'brand' ? a.source.publisher : `${a.source.publisher}: ${a.source.title}`}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>}
        {`. Checked ${fmtDate(a.checked) || a.checked}.`}
      </p>
    </div>
  );
}

/** An ingredient list split into its items (commas outside brackets), or null when it isn't a plain list (main #73). */
function ingredientChips(text) {
  const parts = []; let cur = ''; let depth = 0;
  for (const ch of String(text || '')) {
    if (ch === '(' || ch === '[') depth += 1;
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  const items = parts.map((x) => x.trim().replace(/\.$/, '')).filter(Boolean);
  return items.length >= 3 && items.every((x) => x.length <= 70 && !/[.:;]\s/.test(x)) ? items : null;
}

function Rows({ rows }) {
  const list = rows.filter((r) => r && r.value);
  if (!list.length) return null;
  return (
    <dl className="ayq-rows">
      {list.map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.node || <Tx>{r.value}</Tx>}{r.note && <small>{r.note}</small>}</dd></div>)}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Sticky top tabs (founder, Oct 24): Clinical opinion, Scientific literature,
// ayna summary, Reviews. Same on phone and desktop, website and app. The tab
// row sticks under the site header once she scrolls past the product hero.
// WAI-ARIA tabs pattern: arrow keys, Home and End move and select.
// ---------------------------------------------------------------------------
const TAB_ORDER = ['clinical', 'literature', 'summary', 'reviews'];
const TAB_LABELS = { clinical: 'Clinical opinion', literature: 'Scientific literature', summary: 'ayna summary', reviews: 'Reviews' };
// Every id other parts of the site link to, mapped onto a tab (and a spot in it).
const TARGETS = {
  facts: { tab: 'summary', anchor: 'ay-sum-facts' },
  summary: { tab: 'summary' }, overview: { tab: 'summary' }, fit: { tab: 'summary', anchor: 'ay-sum-who' }, about: { tab: 'summary', anchor: 'ay-sum-about' },
  clinical: { tab: 'clinical' }, expert: { tab: 'clinical' },
  literature: { tab: 'literature' }, evidence: { tab: 'literature' }, science: { tab: 'literature' }, research: { tab: 'literature' },
  why: { tab: 'literature', anchor: 'ay-lit-why' }, sources: { tab: 'literature', anchor: 'ay-lit-sources' }, ingredients: { tab: 'literature', anchor: 'ay-lit-ings' },
  reviews: { tab: 'reviews' },
  safety: { tab: 'summary', anchor: 'ay-sum-safety' }, 'safety-use': { tab: 'summary', anchor: 'ay-sum-safety' },
  'how-to-use': { tab: 'summary', anchor: 'ay-sum-how' }, how: { tab: 'summary', anchor: 'ay-sum-how' },
  details: { tab: 'summary', anchor: 'ay-sum-details' }, inside: { tab: 'summary', anchor: 'ay-sum-details' },
};
const resolveTarget = (raw) => TARGETS[String(raw || '').replace(/^#/, '')] || null;

// A row inside a tab that scrolls sideways (a reading shelf, a wide table) keeps its own swipe.
function scrollsSideways(el, stop) {
  for (let n = el; n && n !== stop; n = n.parentElement) {
    const ox = window.getComputedStyle(n).overflowX;
    if ((ox === 'auto' || ox === 'scroll') && n.scrollWidth > n.clientWidth + 1) return true;
  }
  return false;
}

function StickyTabs({ tabs, active, onChange, stickTop, swipe = false }) {
  const listRef = useRef(null);
  // The app's product sheet: swipe left or right on a tab to move to the next one.
  const touch = useRef(null);
  const swipeProps = swipe ? {
    onTouchStart: (e) => {
      if (e.touches.length !== 1 || scrollsSideways(e.target, e.currentTarget)) { touch.current = null; return; }
      touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e) => {
      const t0 = touch.current;
      touch.current = null;
      if (!t0 || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - t0.x;
      const dy = e.changedTouches[0].clientY - t0.y;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const i = tabs.findIndex((t) => t.id === active);
      const next = tabs[i + (dx < 0 ? 1 : -1)];
      if (next) onChange(next.id);
    },
  } : {};
  const choose = (id, focus) => {
    onChange(id);
    if (focus) window.requestAnimationFrame(() => listRef.current?.querySelector(`[data-tab="${id}"]`)?.focus());
  };
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === active);
    const next = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    choose(tabs[next].id, true);
  };
  return (
    <>
      <div className="ayq-st" style={{ '--ayq-stick-top': `${stickTop}px` }}>
        <div className="ayq-st__list" data-tour="evidence-tabs" role="tablist" aria-label="About this product" ref={listRef} onKeyDown={onKeyDown}>
          {tabs.map((t) => {
            const on = t.id === active;
            return (
              <button key={t.id} type="button" role="tab" id={`ay-tab-${t.id}`} data-tab={t.id} aria-selected={on} aria-controls={`ay-panel-${t.id}`} tabIndex={on ? 0 : -1} className={`ayq-st__tab is-${t.id}${on ? ' is-on' : ''}`} onClick={() => choose(t.id)}>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`ay-panel-${t.id}`} aria-labelledby={`ay-tab-${t.id}`} tabIndex={0} hidden={t.id !== active} className={`ayq-panel ayq-tp is-${t.id}`} {...swipeProps}>
          {t.body}
        </div>
      ))}
    </>
  );
}

/** A progressive-disclosure step inside a tab (closed until she asks for it). */
function Step({ id, title, meta = '', children, open = false }) {
  return (
    <details id={id} className="ayq-step ayq-anchor" open={open || undefined}>
      <summary className="ayq-step__sum">
        <span className="ayq-step__text"><span className="ayq-step__h">{title}</span>{meta && <span className="ayq-step__meta">{meta}</span>}</span>
        <PdpIcon name="chevron" size={20} className="ayq-step__chev" />
      </summary>
      <div className="ayq-step__body">{children}</div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// The page part
// ---------------------------------------------------------------------------
export default function ProductEvidence({ product: baseProduct, glance = null, aynaData = null, aynaRating: aynaRatingProp = null, ratingCount: ratingCountProp = 0, rateControls = null, extraRows = [], onOpenReview = null, onWriteReview = null, afterOverview = null, loading = false,
  // The app's product sheet: tabs also switch with a sideways swipe, and the
  // address bar is left alone (the sheet is not a page of its own).
  swipeTabs = false, syncHash = true,
  // Above the tabs (Oct 25 redesign): Is it for you (her match details, when
  // she has a profile) and At a glance. `showFit` false when the page shows
  // Is it for you elsewhere (the website's right column on wide screens).
  fit = null,
  // The one line already in the safety box near the top, so the summary's caution is a different one.
  safetyLead = '',
  // "Ask about this product" at the end of ayna summary (each surface passes its own).
  askSlot = null }) {
  const product = useApprovedResearch(baseProduct);
  // The short answer leads with the summary's first sentence (unless the team wrote a short take), so "What it is" starts after it.
  // A spec first sentence ("65 mg elemental iron…") becomes Key facts "Strength"; the next sentence is the one-liner.
  const leadParts = useMemo(() => splitLead(product), [product]);
  const lead = leadParts.lead;
  const teamShort = Boolean(String(product?.doctorOpinionShort || '').trim());
  const m = useMemo(() => buildEvidence(product, { heroLine: teamShort ? '' : leadParts.used, glance }), [product, leadParts, teamShort, glance]);
  const works = worksWith(product);
  const reviewRows = useProductReviews(baseProduct?.id);
  const liveStats = reviewRows.length ? summarizeReviewRows(reviewRows)[baseProduct?.id] : null;
  const aynaRating = liveStats ? liveStats.average : aynaRatingProp;
  const ratingCount = liveStats ? liveStats.count : ratingCountProp;

  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined' || !syncHash) return 'summary';
    return resolveTarget(window.location.hash.slice(1))?.tab || 'summary';
  });
  // The tab row sticks just under the website's header (the app has none above it).
  const [stickTop, setStickTop] = useState(0);
  useEffect(() => {
    // The website header hides while she scrolls down: follow its visible
    // bottom edge so the tabs sit right under it, or at the very top once it is gone.
    const nav = document.querySelector('.app-nav-wrap');
    const read = () => {
      const pos = nav ? window.getComputedStyle(nav).position : '';
      setStickTop(nav && (pos === 'sticky' || pos === 'fixed') ? Math.max(0, Math.round(nav.getBoundingClientRect().bottom)) : 0);
    };
    let raf = 0;
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(() => { raf = 0; read(); }); };
    read();
    window.addEventListener('resize', read);
    window.addEventListener('scroll', onScroll, { passive: true });
    nav?.addEventListener('transitionend', read);
    return () => {
      window.removeEventListener('resize', read);
      window.removeEventListener('scroll', onScroll);
      nav?.removeEventListener('transitionend', read);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);
  const reduce = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const scrollToEl = (el) => el?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' });
  // Back to the top of the tabs when the row is stuck, so the new tab starts at its beginning.
  const toTabTop = (force = false) => {
    window.requestAnimationFrame(() => {
      const el = document.getElementById('ay-pt');
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (force || top < stickTop - 2) scrollToEl(el);
    });
  };
  const setHash = (id) => {
    if (!syncHash) return;
    try { window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${id}`); } catch { /* sandboxed */ }
  };
  const chooseTab = (id) => { setTab(id); setHash(id); toTabTop(); };
  /** Open the tab that holds `raw` (an old tab id, a section id) and bring it into view. */
  const goTo = (raw) => {
    const t = resolveTarget(raw) || { tab: 'summary' };
    setTab(t.tab);
    setHash(raw && resolveTarget(raw) ? raw : t.tab);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const el = t.anchor ? document.getElementById(t.anchor) : null;
      if (el) {
        if (el.tagName === 'DETAILS') el.open = true;
        scrollToEl(el);
      } else toTabTop(true);
    }));
  };
  const goToRef = useRef(goTo);
  useEffect(() => { goToRef.current = goTo; });
  useEffect(() => {
    if (!syncHash) return;
    if (takeProductTab() === 'reviews') { goTo('reviews'); return; }
    const h = window.location.hash.slice(1);
    if (resolveTarget(h)) goTo(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // Through a ref: listeners are added once.
    const on = (e) => goToRef.current(e.detail || 'summary');
    const onHash = () => { if (!syncHash) return; const h = window.location.hash.slice(1); if (resolveTarget(h)) goToRef.current(h); };
    window.addEventListener('ay-open-tab', on);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('ay-open-tab', on); window.removeEventListener('hashchange', onHash); };
  }, [syncHash]);

  // Every hard word on the page gets a tap-to-define underline, once, where it first appears.
  const plan = useMemo(() => {
    if (!m) return {};
    const texts = [
      ...m.expert.short, ...m.summary, ...m.who,
      ...m.expert.opinion, ...m.expert.note, m.expert.sourceSummary?.text, ...m.expert.sources.map((s) => s.summary),
      ...m.research.summary, m.research.sourceSummary, ...m.research.studies.map((s) => s.summary), ...m.research.ingredients.flatMap((i) => i.text),
      ...m.reviews.text, m.reviews.sourceSummary, m.reviews.ratingNote,
      ...m.safety.alert, m.safety.record, ...m.safety.opinionAlerts, ...m.safety.warnings, m.safety.sideEffects, ...m.safety.labelRows.map((r) => r.value), m.safety.fdaRaw,
      ...(m.how ? [m.how.intro, ...m.how.steps] : []),
    ].filter(Boolean);
    return planGlossaryTerms(texts.map((t) => ({ key: t, text: t })), Infinity);
  }, [m]);

  if (!m) return null;
  // While the research file loads (first product page of a visit), a quiet outline of the page holds its place.
  if (loading) {
    return (
      <div id="ay-tabs" className="ayq is-loading" aria-busy="true">
        <p className="sr-only" role="status">Loading the research for this product…</p>
        <div className="ayq-over" aria-hidden="true"><div className="ayq-skel ayq-skel--bottom" /><div className="ayq-skel ayq-skel--glance" /><div className="ayq-skel ayq-skel--row" /></div>
        <div className="ayq-tabsec" aria-hidden="true"><div className="ayq-skel ayq-skel--tabs" /><div className="ayq-skel ayq-skel--panel" /></div>
      </div>
    );
  }

  // ---- shared numbers -------------------------------------------------------
  const ev = evidenceLevel({ ...(baseProduct || {}), evidenceStrength: m.research.evidenceStrength });
  const meter = evidenceMeter(ev);
  const { graded, level, scope: evScope } = ev;
  const allSources = (() => {
    // The index under Details: each page once (same URL, or the same title from the same publisher).
    const seen = new Set();
    return (glance?.sources || []).filter((x) => {
      const k1 = x.url; const k2 = `${x.publisher}|${String(x.title).toLowerCase()}`;
      if (seen.has(k1) || seen.has(k2)) return false;
      seen.add(k1); seen.add(k2); return true;
    });
  })();
  const histogram = liveStats?.histogram || aynaData?.histogram || null;
  const memberRatingCount = histogram ? Object.values(histogram).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
  const breakdown = memberRatingCount >= 6 ? [5, 4, 3, 2, 1].map((n) => ({ n, c: Number(histogram[n]) || 0 })) : null;
  const memberReviews = (aynaData?.reviews || []).map((r) => noDash(r?.text)).filter(Boolean).slice(0, 3);
  const hasMemberRating = aynaRating != null && ratingCount > 0;
  const urgent = urgentSignsFor(product);
  const adds = (g) => m.additions.filter((a) => a.group === g);

  // ---- At a glance tiles (above the tabs) ------------------------------------

  // ---- Panels -----------------------------------------------------------------
  const ex = m.expert;
  const clin = clinicianOf(ex);
  const linkedClinical = (ex.sources.length > 0 || ex.other.length > 0) && (
    <div className="ayv-stack">
      {ex.sources.length > 0 && (
        <div className="ayq-srcs">
          <h4 className="ayq-subh" id="ayq-clin-src">.gov health sources <span className="ayq-count">{ex.sources.length}</span></h4>
          <ShowAll items={ex.sources} className="ayq-srcgrid is-compact ayv-srclist" label="sources" render={(s) => <SourceBody s={s} />} itemClass={(s) => `ayq-src${s.negative ? ' is-negative' : ''}`} />
        </div>
      )}
      <OtherLinks items={ex.other} label="Other pages the team used" note="Not .gov health sources, so ayna has not checked them. Each is labelled by what it is." />
    </div>
  );
  const expertBody = (ex.opinion.length || ex.note.length || ex.sourceSummary || ex.sources.length || ex.other.length) ? (
    <div className="ayv-stack">
      {clin ? (
        // A named clinician: who, credential, the quote (the team's words as written).
        <article className="ayv-clin" aria-label="Clinician opinion">
          <p className="ayv-clin__who"><span className="ayv-clin__name">{clin.who || 'Clinician'}</span>{clin.credential && <span className="ayv-clin__cred">{clin.credential}</span>}</p>
          <p className="ayq-byline"><b>Who wrote this:</b> <Tx>{ex.attribution}</Tx></p>
          {ex.opinion.length > 0 && <blockquote className="ayv-clin__quote"><ReadShelf list={ex.opinion} label="The full expert view" leadIn /></blockquote>}
        </article>
      ) : (
        <>
          {/* No named clinician: say so plainly, then ayna's own clinical summary, labelled. */}
          <p className="ayv-empty">No named clinician has reviewed this product for ayna yet. Below is ayna’s clinical summary of the guidance.</p>
          <section className="ayv-box" aria-label="ayna’s clinical summary">
            {ex.synthesis && <p className="ayq-byline"><b>Who wrote this:</b> ayna’s clinical summary, not reviewed by a named clinician.</p>}
            {ex.attribution && <p className={ex.synthesis ? 'ayq-meta' : 'ayq-byline'}>{ex.synthesis ? <>Note on file: <Tx>{ex.attribution}</Tx></> : <><b>Who wrote this:</b> <Tx>{ex.attribution}</Tx></>}</p>}
            {ex.opinion.length > 0 && <ReadShelf list={ex.opinion} label="The full expert view" leadIn />}
          </section>
        </>
      )}
      {ex.note.length > 0 && <Folder id="ayq-more-clinical" title="More clinical context" icon="stethoscope"><ReadShelf list={ex.note} label="More clinical context" /><p className="ayq-meta">From the clinical guidance in the sources.</p></Folder>}
      {ex.sourceSummary && (
        <Folder id="ayq-clin-sum" title="What the linked sources say">
          <p className="ayq-p"><Tx>{ex.sourceSummary.text}</Tx></p>
          {ex.sourceSummary.untraced && <p className="ayq-flag">Names a person we couldn’t trace to a source. Not verified by ayna.</p>}
        </Folder>
      )}
      {linkedClinical}
      {m.safety.alert.length > 0 && <p className="ayq-meta">There’s a safety note for this product. <button type="button" className="ayq-textbtn" onClick={() => goTo('safety')}>Read it in Safety</button></p>}
    </div>
  ) : null;

  const rs = m.research;
  const claims = claimRows(product);
  const negativeBlock = rs.negative.length > 0 && (
    <Folder id="ayq-neg" title="Results to know about" tone="alert" icon="paper" className="ayq-wide">
      <p className="ayq-p">{rs.negative.length === 1 ? 'This study found no clear benefit:' : `${rs.negative.length} studies found no clear benefit:`}</p>
      <ul className="ayq-neglist">{rs.negative.map((s) => <li key={s.url}><span className="ayq-neglist__meta">{[s.publisher, s.type, s.year].filter(Boolean).join(', ')}</span><b>{s.title}</b> <Tx>{s.summary}</Tx> <a href={s.url} target="_blank" rel="noopener noreferrer">Read the source<span aria-hidden="true"> ↗</span><span className="sr-only">: {s.title} (opens in a new tab)</span></a></li>)}</ul>
    </Folder>
  );
  // Step 2: why ayna rated it this way (grades per need, the team's reading of the research, each claim and what backs it).
  const gradeBlock = graded.length > 0 && (
    <div className="ayq-gradebox">
      <h4 className="ayq-subh">ayna’s evidence check</h4>
      <ShowAll items={graded} label="grades" className="ayq-grades" render={(g) => {
        let pub = '';
        // The site's own address: a one-word publisher ("Menopause") reads like a topic.
        try { pub = new URL(g.source_url).hostname.replace(/^www\./, ''); } catch { pub = hostLabel(g.source_url); }
        return (
          <>
            <div className="ayq-meter" data-level={g.strength === 'none' ? 0 : Math.min(({ A: 3, B: 2, C: 1 })[g.grade] || 0, evScope === 'product' ? 3 : 2)}><span className="ayq-meter__word">{g.strength === 'none' ? 'Not a fit' : gradeWords(g.grade, evScope === 'product')}</span><span className="ayq-meter__bars" aria-hidden="true"><i /><i /><i /></span></div>
            <p className="ayq-grades__need">{cap(needPhrase(g.need))}</p>
            <p className="ayq-p"><Tx>{noDash(PLAIN[`${g.product}|${g.need}`] || g.rationale)}</Tx></p>
            {g.source_url && <a className="ayq-src__go" href={g.source_url} target="_blank" rel="noopener noreferrer">Source: {pub}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>}
          </>
        );
      }} />
      <p className="ayq-meta">Graded only from .gov health sources. Strong means those sources back this kind of product for this need. Limited means little or no good evidence.</p>
    </div>
  );
  const claimBlock = claims.length > 0 && (
    <div className="ayq-claims">
      <h4 className="ayq-subh">Claims, one by one</h4>
      <ShowAll items={claims} label="claims" className="ayq-claimlist" itemClass={(c) => `is-${c.kind}`} render={(c) => (
        <>
          <span className="ayq-claimlist__kind">{c.label}</span>
          <p className="ayq-p">{c.kind === 'brand' ? <>The brand says: <Tx>{c.claim}</Tx></> : <Tx>{c.claim}</Tx>}</p>
          <p className="ayq-meta">{[c.strength && `Strength on file: ${c.strength.toLowerCase()}`, c.via].filter(Boolean).join('. ')}{c.url && <>{(c.strength || c.via) ? '. ' : ''}<a href={c.url} target="_blank" rel="noopener noreferrer">{c.publisher || 'Source'}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></>}</p>
        </>
      )} />
    </div>
  );
  const whyRated = (rs.summary.length || rs.sourceSummary || rs.evidenceStrength || claims.length) ? (
    <>
      {rs.summary.length > 0 && <><h4 className="ayq-subh">In short</h4><ReadShelf list={rs.summary} label="Research in short" /></>}
      {rs.sourceSummary && <><h4 className="ayq-subh">What the linked research says</h4><p className="ayq-p"><Tx>{rs.sourceSummary}</Tx></p></>}
      {rs.evidenceStrength && <p className="ayq-meta">Evidence level the team recorded: {rs.evidenceStrength}</p>}
      {claimBlock}
    </>
  ) : null;
  // Step 3: the sources themselves. Step 4: ingredient by ingredient.
  const studyCards = rs.studies.filter((x) => !x.negative);
  const ingredientsBlock = rs.ingredients.length > 0 ? (
    <div className="ayq-ings">
      <ShowAll items={rs.ingredients} label={rs.ingredientsAreTopics ? 'topics' : 'ingredients'} className="ayq-inggrid" itemClass={() => 'ayq-ing'} render={(i) => (
        <>
          <h5 className="ayq-ing__name">{i.name}</h5>
          {i.text.length ? <Paras list={i.text} /> : <p className="ayq-meta">No explanation on file yet.</p>}
          {i.links.length > 0 && <ul className="ayq-minilinks">{i.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer"><span className="ayq-minilinks__pub">{[l.publisher, l.year].filter(Boolean).join(', ')}</span> {l.title}{l.kind.tier !== 'credible' && <em> ({l.kind.label})</em>}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>}
        </>
      )} />
      <p className="ayq-meta">Research on an ingredient is not research on this exact product.</p>
      {rs.ingredientNote && <p className="ayq-meta">{rs.ingredientNote}</p>}
    </div>
  ) : null;

  const rv = m.reviews;
  const ratingLines = [
    hasMemberRating && <p key="m" className="ayq-rating"><b><span aria-hidden="true">★ </span>{aynaRating.toFixed(1)}</b> from {plural(ratingCount, 'ayna member review')}</p>,
    rv.brandRating && <p key="b" className="ayq-rating"><b><span aria-hidden="true">★ </span>{rv.brandRating.value}</b> from {rv.brandRating.count} reviews <span className="ayq-flag">Reported by the brand or a retailer, not verified by ayna</span></p>,
    rv.userRating && <p key="u" className="ayq-rating"><b><span aria-hidden="true">★ </span>{rv.userRating.value}</b> {rv.userRating.url ? <a href={rv.userRating.url} target="_blank" rel="noopener noreferrer">online rating<span aria-hidden="true"> ↗</span></a> : 'online rating'} <span className="ayq-flag">Not verified by ayna</span></p>,
  ].filter(Boolean);
  const onlineLinks = [...rv.online, ...(m.brand ? [{ url: `https://www.trustpilot.com/search?query=${encodeURIComponent(m.brand)}`, title: `${m.brand} on Trustpilot`, publisher: 'Trustpilot', summary: '', kind: { label: 'Search of company reviews' } }] : [])];
  // The rating summary first (Baymard: the distribution is the most-used part of reviews).
  const ratingsCard = (ratingLines.length > 0 || breakdown) ? (
    <section className="ayv-ratings" aria-label="Ratings">
      {ratingLines}
      {breakdown && (
        <ul className="ayq-bars" aria-label="Ratings from ayna members">
          {breakdown.map((b) => <li key={b.n}><span>{b.n} <span aria-hidden="true">★</span><span className="sr-only">stars</span></span><i><s style={{ width: `${Math.round((b.c / memberRatingCount) * 100)}%` }} /></i><span>{b.c}</span></li>)}
        </ul>
      )}
    </section>
  ) : null;
  const reviewsBody = (
    <div className="ayq-cols">
      <div className="ayq-main">
        {rv.ratingNote && <div className="ayq-callout"><h4 className="ayq-subh">Before you trust the stars</h4><p className="ayq-p"><Tx>{rv.ratingNote}</Tx></p></div>}
        {(rv.text.length > 0 || rv.sourceSummary) && (
          <>
            <h4 className="ayq-subh">What people say online</h4>
            <ReadShelf list={rv.text} label="What people say online" />{rv.sourceSummary && <p className="ayq-p"><Tx>{rv.sourceSummary}</Tx></p>}
            <p className="ayq-meta">Online reviews and posts are people’s experiences, not clinical evidence.</p>
          </>
        )}
        {rv.incentivized.length > 0 && <p className="ayq-meta">Reviews on {rv.incentivized.join(', ')} may include incentivized reviews.</p>}
        <div className="ayq-reviews"><ProductCommunityReviews productId={baseProduct?.id} rows={reviewRows} onOpenReview={onOpenReview} initial={4} /></div>
        {memberReviews.length > 0 && <><h4 className="ayq-subh">From ayna members</h4><ul className="ayq-quotes">{memberReviews.map((r) => <li key={r.slice(0, 40)}><blockquote>{r}</blockquote></li>)}</ul></>}
        {rateControls}
        {!ratingLines.length && !reviewRows.length && !rv.text.length && <p className="ayq-p">No reviews yet. Tried it? You can be the first.</p>}
      </div>
      <aside className="ayq-side">
        {rv.elsewhere.length > 0 && (
          <Folder id="ayq-elsewhere" title="Ratings on other sites">
            <ul className="ayq-elsewhere">
              {rv.elsewhere.map((l) => (
                <li key={l.url}>
                  {l.rating && <p className="ayq-elsewhere__num"><b>{l.rating.value}</b> <span>out of 5, {l.rating.count} ratings</span></p>}
                  <p className="ayq-elsewhere__where">{l.publisher}: {l.title}</p>
                  {l.summary && <p className="ayq-p"><Tx>{l.summary}</Tx></p>}
                  <p className="ayq-flag">{l.kind.tier === 'brand' ? 'Brand-reported, not verified by ayna' : 'Retailer listing, not verified by ayna'}</p>
                  <a className="ayq-src__go" href={l.url} target="_blank" rel="noopener noreferrer">See the listing<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>
                </li>
              ))}
            </ul>
          </Folder>
        )}
        <OtherLinks items={onlineLinks} label="Read more reviews online" />
      </aside>
    </div>
  );

  const sf = m.safety;
  const docWarnings = sf.warnings.filter((w) => DOC.test(w));
  const restWarnings = sf.warnings.filter((w) => !DOC.test(w));
  const fdaValue = (() => {
    if (!sf.fdaRaw) return null;
    const label = sf.fda?.label || '';
    // The plain label first, then the words on file (unless they are the label itself).
    const raw = sf.fdaRaw.trim().replace(/\.$/, '');
    const same = label && raw.toLowerCase() === label.toLowerCase();
    return <>{label && <b>{label}. </b>}{sf.fda?.line && <span>{sf.fda.line} </span>}{!same && (label ? <span className="ayq-rowsrc">On file: <Tx>{fmtDate(sf.fdaRaw)}</Tx></span> : <Tx>{fmtDate(sf.fdaRaw)}</Tx>)}</>;
  })();
  const recallAdd = adds('recall')[0];
  const recallValue = sf.recall && (sf.recall.text || recallAdd) ? (
    <>{sf.recall.text ? <Tx>{sf.recall.text}</Tx> : 'No recall check on file.'}{recallAdd && <> <a href={recallAdd.source.url} target="_blank" rel="noopener noreferrer">Search FDA recalls<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></>}</>
  ) : null;

  // ---- Safety facts: one panel, Drug Facts style (founder, Oct 26) -----------
  // Each item verbatim, in a fixed group order; the hero line's item leads its group.
  const SAFETY_ROWS = /^(pregnancy|breastfeeding|medicines)/i;
  const Fw = ({ text }) => { const w = String(text || '').split(/(\s+)/); const head = w.slice(0, 7).join(''); return <><b className="ayv-sf__fw">{head}</b><Tx>{w.slice(7).join('')}</Tx></>; };
  const safetyItems = [
    sf.alert.length > 0 && { key: 'alert', kind: '', text: sf.alert.join(' '), node: (
      <div className="ayv-alert">
        <Paras list={sf.alert} />
        {sf.record && <p className="ayq-p">The record: <Tx>{sf.record}</Tx></p>}
        {sf.sources.length > 0 && <ul className="ayq-minilinks is-alert">{sf.sources.map((l) => { const lp = String(l.title).match(/^([^:]{2,40}):\s+(.+)$/); return <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer"><span className="ayq-minilinks__pub">{lp ? lp[1] : l.kind.tier === 'credible' ? l.publisher : l.kind.label}</span> {lp ? lp[2] : l.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></li>; })}</ul>}
      </div>
    ) },
    ...docWarnings.map((w) => ({ key: `d-${w}`, kind: '', text: w, node: <Tx>{w}</Tx> })),
    ...restWarnings.map((w) => ({ key: `w-${w}`, kind: '', text: w, node: <Tx>{w}</Tx> })),
    ...sf.labelRows.filter((r) => SAFETY_ROWS.test(r.label)).map((r) => ({ key: `l-${r.label}`, kind: /medicines/i.test(r.label) ? 'med-row' : 'preg-row', text: `${r.label}: ${r.value}`, node: /medicines/i.test(r.label) ? <>{r.label}: <Tx>{r.value}</Tx></> : <><b className="ayv-sf__fw">{r.label}:</b> <Tx>{r.value}</Tx></> })),
    sf.allergens && { key: 'allergens', kind: 'allergens', text: sf.allergens, node: <>Allergens: <Tx>{sf.allergens}</Tx></> },
    sf.avoidIf.length > 0 && { key: 'avoid', kind: 'avoid', text: sf.avoidIf.join(', '), node: <>You react to: {sf.avoidIf.join(', ')}</> },
    sf.sideEffects && { key: 'side', kind: 'side', text: sf.sideEffects, node: <>{m.isDigital ? 'Downsides to know: ' : 'Possible side effects: '}<Tx>{sf.sideEffects}</Tx></> },
    sf.opinionAlerts.length > 0 && { key: 'also', kind: '', text: sf.opinionAlerts.join(' '), node: <>Also worth knowing: <Tx>{sf.opinionAlerts.join(' ')}</Tx></> },
    recallValue && { key: 'recall', kind: 'recall', text: sf.recall.text || '', node: <>Recalls: {recallValue}</> },
    ...sf.privacy.map((r) => ({ key: `p-${r.label}`, kind: 'privacy', text: r.value, node: <>{r.label}: <Tx>{r.value}</Tx></> })),
    ...[...adds('safety'), ...adds('privacy')].map((a) => ({ key: `a-${a.id}`, kind: 'addition', text: a.title, node: <Addition a={a} /> })),
  ].filter(Boolean).map((x) => ({ ...x, group: safetyGroupOf(x.text, x.kind) }));
  // Pregnancy items in bold for their first four words (the Drug Facts rule) only when they are pregnancy items.
  safetyItems.forEach((x) => { if (x.group === 'preg' && !x.kind) x.node = <Fw text={x.text} />; });
  const crit = criticalIndex(safetyItems.map((x) => x.text), safetyLead);
  if (crit > 0) safetyItems.unshift(safetyItems.splice(crit, 1)[0]);
  const critKey = crit >= 0 || safetyItems[0]?.key === 'alert' ? safetyItems[0]?.key : '';
  const groups = groupSafety(safetyItems);
  const hasSafety = safetyItems.length > 0 || urgent.length > 0;
  const safetyBody = hasSafety ? (
    <>
      {groups.length > 0 && (
        <div className="ayv-panel ayv-sf" role="group" aria-labelledby="ayv-sf-h">
          <p id="ayv-sf-h" className="ayv-panel__title">Safety facts</p>
          {groups.map((g) => (
            <div key={g.id} className={`ayv-panel__group is-${g.id}`}>
              <p className="ayv-panel__sub">{g.title}</p>
              {g.chunks.map((chunk, ci) => (
                <ul key={ci} className="ayv-sf__list">
                  {chunk.map((x) => <li key={x.key} className={[x.key === critKey && 'is-critical', x.kind === 'addition' && 'is-block'].filter(Boolean).join(' ') || undefined}>{x.kind === 'addition' ? x.node : <span className="ayq-p">{x.node}</span>}</li>)}
                </ul>
              ))}
            </div>
          ))}
        </div>
      )}
      <UrgentSigns product={product} flags={urgent} />
      {!sf.alert.length && <SourceGrid items={sf.sources} label="Sources for these notes" id="ayq-safe-src" />}
    </>
  ) : null;

  // ---- How to use: numbered, 3 then Show all ---------------------------------
  const howBody = (m.how || adds('how').length) ? (
    <>
      {m.how?.intro && <p className="ayq-p ayq-intro"><Tx>{m.how.intro}</Tx></p>}
      {m.how && <ShowAll items={m.how.steps} n={Infinity} label="steps" className="ayv-steps" render={(st, i) => <><span className="ayv-steps__n" aria-hidden="true">{i + 1}</span><span className="ayq-p"><Tx>{st}</Tx></span></>} />}
      {/* The listing footer only when the intro does not already name the source. */}
      {m.how && !m.how.source && m.how.fromListing && !/\b(per|listing|instructions|according)\b/i.test(m.how.intro || '') && <p className="ayq-meta">{FROM_LISTING}.</p>}
      {m.how && (m.how.source || m.how.faq) && (
        <p className="ayq-meta">Source: {[m.how.source, m.how.faq].filter(Boolean).map((l, i) => <React.Fragment key={l.url}>{i > 0 && ', '}<a href={l.url} target="_blank" rel="noopener noreferrer">{l.publisher && !l.title.toLowerCase().includes(String(l.publisher).toLowerCase()) ? `${l.publisher}: ` : ''}{l.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></React.Fragment>)}</p>
      )}
      {adds('how').map((a) => <Addition key={a.id} a={a} />)}
    </>
  ) : null;

  // ---- Key facts: label / value, only real values -----------------------------
  const dt = m.details;
  const factOf = (id) => (glance?.facts || []).find((f) => f.id === id && !f.unknown && f.value);
  const howText = m.how ? [m.how.intro, ...m.how.steps].join(' ') : '';
  const wear = howText.match(/\b(?:up to|every|for up to|for)\s+\d+(?:\s*(?:to|-|–)\s*\d+)?\s*hours?\b/i);
  // Dates behind single facts collapse into one footer ("Facts checked Oct 13, 2026").
  const checkedDates = ['size', 'perunit', 'fsa'].map((id) => factOf(id)?.note).filter((n) => /verified|checked/i.test(String(n || ''))).map((n) => String(n).replace(/^(verified|checked)\s*/i, ''));
  const factsChecked = checkedDates.length ? fmtDate(checkedDates.sort().slice(-1)[0]) : '';
  const listedAs = heroNotes(formatPrice(product).sub ? String(formatPrice(product).sub).split(/\s+·\s+/) : []).moved;
  const keyFacts = [
    { label: 'Format', value: keyFormat(product, m.brand || glance?.brand) },
    leadParts.strength && { label: 'Strength', value: leadParts.strength },
    factOf('size') && { label: 'Size or count', value: noDash(factOf('size').value) },
    factOf('perunit') && { label: 'Price per unit', value: noDash(factOf('perunit').value), note: /verified|checked/i.test(factOf('perunit').note || '') ? '' : factOf('perunit').note || '' },
    factOf('fsa') && { label: 'FSA/HSA', value: factOf('fsa').value },
    // FDA status: the short value, the explanation behind "What this means".
    sf.fdaRaw && { label: m.isDigital ? 'Regulation' : 'FDA status', value: sf.fda?.label || sf.fdaRaw, node: sf.fda?.label ? <>{sf.fda.label}<details className="ayv-more2"><summary>What this means</summary><span>{sf.fda?.line && <>{sf.fda.line} </>}{sf.fdaRaw.trim().replace(/\.$/, '').toLowerCase() !== sf.fda.label.toLowerCase() && <>On file: <Tx>{fmtDate(sf.fdaRaw)}</Tx></>}</span></details></> : fdaValue },
    wear && { label: 'How long it lasts', value: cap(wear[0]), note: 'From the instructions' },
    works.items.length > 0 && { label: 'Works with', value: works.items.join(', '), node: <>{works.items.map((t, i) => <React.Fragment key={t}>{i > 0 && ', '}{t === 'ayna' && works.ayna ? <a href="/health-data">ayna</a> : t}</React.Fragment>)}</> },
    (glance?.who?.helps || []).length > 0 && { label: 'Helps with', value: dedupeList(glance.who.helps.join(', ')) },
    ...sf.labelRows.filter((r) => !SAFETY_ROWS.test(r.label)).map((r) => ({ label: r.label, value: r.value })),
    dt.badges.length > 0 && { label: 'Labels on file', value: dt.badges.join(', '), note: 'Claims and labels from the brand or listing. ayna hasn’t checked each one.' },
    // Where to buy, Sold by and the price check live with the Buy button now (one source of truth).
    ...(glance?.facts || []).filter((f) => !f.unknown && !['format', 'size', 'perunit', 'fsa', 'inside', 'fda', 'hipaa', 'data', 'where'].includes(f.id) && f.value).map((f) => ({ label: f.label, value: noDash(f.value), note: f.note && !/verified|checked/i.test(f.note) ? fmtDate(f.note) : '' })),
    ...extraRows.filter((r) => r && (r.value || r.node)).map((r) => ({ ...r, value: r.value || 'x' })),
    listedAs.length > 0 && { label: 'Listed as', value: cap(listedAs.join(', ')) },
    { label: 'Price note', value: dt.priceNote },
  ].filter((r, i, arr) => r && r.value && arr.findIndex((x) => x && x.label === r.label) === i)
    // Two rows that say the same thing ("Where to buy" and "Sold at", "Works with" and "Available on"): keep the first.
    .filter((r, i, arr) => arr.findIndex((x) => String(x.value).toLowerCase() === String(r.value).toLowerCase()) === i);

  // ---- Ingredients: 5 then Show all -------------------------------------------
  const chips = dt.ingredientsText ? ingredientChips(dt.ingredientsText) : null;
  // A device's "ingredients" and "materials" often list the same parts: show one (founder, Oct 25).
  const words = (t) => String(t || '').toLowerCase().match(/[a-z]{3,}/g) || [];
  const materialsDup = Boolean(chips && dt.materials && (() => { const have = new Set(words(dt.ingredientsText)); const mw = words(dt.materials); return mw.filter((w) => have.has(w)).length / Math.max(1, mw.length) >= 0.6; })());
  const isDevice = !m.isDigital && !['ingestible', 'topical', 'vaginal_insert'].includes(m.pp?.risk?.route);
  const hasInside = Boolean(dt.ingredientsText || dt.materials);
  const insideBody = hasInside ? (
    <>
      {dt.ingredientsText && (chips
        ? <><p className="ayv-leadin">{m.isDigital ? 'Included:' : 'On the label:'}</p><ShowAll items={chips} n={Infinity} label={m.isDigital ? 'items' : 'ingredients'} className="ayv-chips" render={(c) => c} /></>
        : <p className="ayq-p ayq-pre">{dt.ingredientsText}</p>)}
      {dt.materials && !materialsDup && <p className="ayq-p">Materials: <Tx>{dt.materials}</Tx></p>}
    </>
  ) : null;

  const sourceRow = (x) => {
    const kind = linkKind(x.url, m.brand);
    const pub = x.publisher || publisherOf(x.url, m.brand);
    const tag = kind.tier === 'credible' ? (x.label && !/expert guidance/i.test(x.label) ? x.label : '.gov health source') : kind.label || 'Not checked by ayna';
    return <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer"><span className="ayq-indexlist__tag">{tag}</span><span className="ayq-indexlist__title">{cleanTitle(noDash(x.title), pub)}</span><span className="ayq-indexlist__pub">{[pub, x.year].filter(Boolean).join(', ')}</span><span className="sr-only"> (opens in a new tab)</span></a></li>;
  };
  const govSources = allSources.filter((x) => linkKind(x.url, m.brand).tier === 'credible');
  const otherSources = allSources.filter((x) => linkKind(x.url, m.brand).tier !== 'credible');
  const sourcesBody = allSources.length > 0 && (
        <div className="ayq-index">
          {govSources.length > 0 && <>
            <h4 className="ayq-subh">.gov sources we checked <span className="ayq-count">{govSources.length}</span></h4>
            <ul className="ayq-indexlist">{govSources.map(sourceRow)}</ul>
          </>}
          {otherSources.length > 0 && <>
            <h4 className="ayq-subh">Other pages on file, not checked by ayna <span className="ayq-count">{otherSources.length}</span></h4>
            <ul className="ayq-indexlist">{otherSources.map(sourceRow)}</ul>
          </>}
        </div>
  );

  // ---- ayna summary: one reading column, each fact once (founder, Oct 25) -----
  const whoL = whoLists({ details: fit?.hasProfile ? fit.details : null, who: m.who });
  // A section whose panel has its own title ("Safety facts", "Product facts") keeps its heading for screen readers only.
  const sec = (id, title, body, extra = '', hideTitle = false) => body && (
    <section id={id} className={`ayq-anchor ayv-sec${extra ? ` ${extra}` : ''}`} aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className={hideTitle ? 'sr-only' : 'ayv-sec__h'}>{title}</h3>
      {body}
    </section>
  );
  const summaryBody = (
    <div className="ayq-sum ayv-read">
      {(lead || m.summary.length > 0) && (
        <section id="ay-sum-about" className="ayq-anchor ayv-sec ayv-sec--lead" aria-label="What it is">
          {lead && <p className="ayv-oneline"><Tx>{brandVoice(lead, m.brand || glance?.brand)}</Tx></p>}
          {m.summary.length > 0 && <div className="ayq-prose"><Paras list={m.summary.filter((x) => !(teamShort && x.startsWith(leadParts.used)))} /></div>}
        </section>
      )}
      {sec('ay-sum-who', 'Who it’s for', (whoL.yes.length > 0 || whoL.no.length > 0) && (
        <>
          {whoL.yes.length > 0 && <p className="ayv-leadin">Good for:</p>}
          {whoL.yes.length > 0 && <ShowAll items={whoL.yes} n={Infinity} label="" className="ayv-list ayv-list--yes" render={(t) => <><span className="ayv-mark is-yes" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span><span className="ayq-p"><span className="sr-only">For: </span><LR text={t} /></span></>} />}
          {whoL.no.length > 0 && <>
            <p className="ayv-leadin ayv-sub">Not for:</p>
            <ShowAll items={whoL.no} n={Infinity} label="" className="ayv-list ayv-list--no" render={(t) => <><span className="ayv-mark is-no" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M7 7l10 10M17 7 7 17" /></svg></span><span className="ayq-p"><span className="sr-only">Not for: </span><LR text={t} /></span></>} />
          </>}
          {fit?.hasProfile && fit?.onShowWhy && <p className="ayv-links"><button type="button" className="ayv-textbtn" onClick={fit.onShowWhy}>See the breakdown</button><a className="ayv-textbtn" href="/how-it-works">How we match</a></p>}
          {fit?.extra}
        </>
      ))}
      {sec('ay-sum-facts', 'Key facts', keyFacts.length > 0 && (
        <>
          <div className="ayv-panel ayv-pf" role="group" aria-labelledby="ayv-pf-h">
            <p id="ayv-pf-h" className="ayv-panel__title">Product facts</p>
            <ShowAll items={keyFacts} n={8} label="facts" className="ayv-facts" render={(r) => <><span className="ayv-facts__k">{r.label}</span><span className="ayv-facts__v">{r.node || <Tx>{r.value}</Tx>}{r.note && <small>{r.note}</small>}</span></>} />
            {factsChecked && <p className="ayq-meta ayv-facts__foot">Facts checked {factsChecked}</p>}
          </div>
        </>
      ), '', true)}
      {sec('ay-sum-how', 'How to use', howBody)}
      {sec('ay-sum-safety', 'Safety', safetyBody, 'ayv-sec--safety', groups.length > 0)}
      {safetyBody && <BackToTop />}
      {sec('ay-sum-evidence', 'Evidence', (
        <>
          <div className="ayv-evrow">
            <EvidenceMeter meter={{ ...meter, note: '' }} />
            <button type="button" className="ayv-textbtn" onClick={() => goTo('literature')}>See the research</button>
          </div>
          {teamShort && ex.short.length > 0 && <>
            <ul className="ayv-bullets">{ex.short.map((t) => <li key={t}><Tx>{t}</Tx></li>)}</ul>
            {ex.attribution && <p className="ayq-meta">{m.independent ? 'ayna’s summary of the research' : 'Summary of the research, with claims credited to the brand'}. <button type="button" className="ayv-textbtn" onClick={() => goTo('clinical')}>Read the clinical opinion</button></p>}
          </>}
        </>
      ))}
      {sec('ay-sum-details', m.isDigital ? 'What’s included' : isDevice ? 'What it’s made of' : 'Ingredients', insideBody)}
      {askSlot && <section className="ayv-ask" aria-label="Ask about this product">{askSlot}</section>}
    </div>
  );

  // ---- Clinical opinion --------------------------------------------------------
  const clinicalBody = (
    <div className="ayq-clin">
      {!m.independent && (ex.opinion.length > 0 || ex.short.length > 0) && <p className="ayq-callout ayq-callout--brand">This comes from the brand’s own materials, not an independent clinician.</p>}
      {expertBody || <p className="ayq-empty">No clinician has written about this product for ayna yet. The ayna summary and Scientific literature tabs have what we know.</p>}
    </div>
  );

  // ---- Scientific literature: overview, then why, then sources, then deeper ------
  const reviewCount = (reviewRows.length || 0) + (rv.text.length ? 1 : 0) + rv.online.length + rv.elsewhere.length;
  const layers = evidenceLayers(product, m, { communityCount: reviewCount });
  const sourceCount = studyCards.length + rs.other.length + allSources.length;
  const otherLinksBlock = (adds('research').length || rs.other.length || sourcesBody) ? (
    <>
      {adds('research').map((a) => <Addition key={a.id} a={a} />)}
      <OtherLinks items={rs.other} label="Other pages the team used" note="Not .gov health sources, so ayna has not checked them. Each is labelled by what it is." />
      {sourcesBody}
    </>
  ) : null;
  const literatureBody = (
    <div className="ayq-lit">
      {/* 1. How strong, as a meter (the existing grade), and what is on file. */}
      <section className="ayq-evo ayv-evo" aria-labelledby="ayq-evo-h">
        <h3 id="ayq-evo-h" className="ayq-h3">Evidence overview</h3>
        <EvidenceMeter meter={meter} size="lg" />
        {!level && <><p className="ayq-p">ayna checks health claims only against .gov sources such as MedlinePlus, NIH and FDA.</p><p className="ayq-p">None is linked to this product yet, so it has no grade.</p><p className="ayq-p">What is on file is listed below for what it is.</p></>}
        {negativeBlock}
        {layers.length > 0 && (
          <ul className="ayq-layers" aria-label="What is on file">
            {layers.map((l) => (
              <li key={l.id} className={`is-${l.id}`}>
                <span className="ayq-layers__label">{l.label}{l.n ? <span className="ayq-count">{l.n}</span> : null}</span>
                <span className="ayq-layers__note">{l.note}</span>
                {l.id === 'community' && <button type="button" className="ayq-textbtn" onClick={() => goTo('reviews')}>Read the reviews</button>}
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* 2. The sources, strongest first: ayna's grades, then the .gov studies. */}
      {gradeBlock}
      {studyCards.length > 0 && <SourceGrid items={studyCards} label={rs.negative.length ? 'Other .gov health sources' : '.gov health sources'} id="ayq-studies" />}
      {!graded.length && <p className="ayq-meta">ayna has not graded this product yet, because no .gov source is linked to it.</p>}
      {/* 3. Deeper, closed until she asks. */}
      {whyRated && <Step id="ay-lit-why" title="Why ayna rated it this way">{whyRated}</Step>}
      {ingredientsBlock && <Step id="ay-lit-ings" title={rs.ingredientsAreTopics ? 'Point by point' : 'Ingredient by ingredient'} meta={plural(rs.ingredients.length, rs.ingredientsAreTopics ? 'topic' : 'ingredient')}>{ingredientsBlock}</Step>}
      {otherLinksBlock && <Step id="ay-lit-sources" title="View studies and sources" meta={sourceCount ? plural(sourceCount, 'link') : ''}>{otherLinksBlock}</Step>}
    </div>
  );

  // ---- Reviews: community first, then online; never evidence ----------------------
  const reviewsTab = (
    <div className="ayq-rev">
      {ratingsCard}
      {reviewRows.length > 0 && <ProductPeopleSay productId={baseProduct?.id} reviews={reviewRows} onWriteReview={onWriteReview} onOpenPost={onOpenReview} />}
      <p className="ayv-note">Reviews are people’s experiences. They are not evidence that a product works.</p>
      {reviewsBody}
      {!reviewRows.length && onWriteReview && <button type="button" className="ayq-cta" onClick={onWriteReview}>Write a review</button>}
    </div>
  );

  const bodies = { clinical: clinicalBody, literature: literatureBody, summary: summaryBody, reviews: reviewsTab };
  const tabs = TAB_ORDER.map((id) => ({ id, label: TAB_LABELS[id], body: bodies[id] }));
  const activeTab = TAB_ORDER.includes(tab) ? tab : 'summary';

  return (
    <TermsCtx.Provider value={plan}>
      <div id="ay-tabs" className="ayq ayq--tabs ayv">
        <section id="ay-pt" className="ayq-tabsec" aria-label="Clinical opinion, scientific literature, ayna summary and reviews">
          <StickyTabs tabs={tabs} active={activeTab} onChange={chooseTab} stickTop={stickTop} swipe={swipeTabs} />
        </section>
        {afterOverview}
      </div>
    </TermsCtx.Provider>
  );
}

/** Kept for callers that still pass a safety block: the page now builds Safety itself. */
export function ProductSafety() { return null; }
