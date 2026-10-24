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
import { splitNote } from './sentences';
import { fmtDate } from './fmtDate';
import { buildEvidence, noDash, linkKind, publisherOf, cleanTitle, claimRows, evidenceLayers } from './evidenceModel';
import PdpIcon from './PdpIcon.jsx';
import UrgentSigns from './UrgentSigns.jsx';
import ProductCommunityReviews from './ProductCommunityReviews.jsx';
import ProductPeopleSay from './ProductPeopleSay.jsx';
import { useProductReviews } from './useProductReviews.js';
import { evidenceLevel, gradeWords } from './evidenceLevel.js';
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
 * On phones, long multi-part text reads as a sideways shelf of cards (swipe or
 * use the arrows), so the page doesn't run on for screens. Every word stays in
 * the page; on wider screens it's ordinary paragraphs.
 */
function ReadShelf({ list, label, leadIn = false, min = 3 }) {
  const ref = useRef(null);
  if (!list?.length) return null;
  if (list.length < min) return <div className="ayq-prose"><Paras list={list} leadIn={leadIn} /></div>;
  const move = (dir) => { const el = ref.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.86, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  return (
    <div className="ayq-readshelf">
      <div className="ayq-readshelf__bar">
        <span className="ayq-readshelf__hint">{list.length} parts. Swipe to read on.</span>
        <span className="ayq-readshelf__btns">
          <button type="button" aria-label={`Previous part of ${label}`} onClick={() => move(-1)}><PdpIcon name="chevron" size={18} className="ayq-rot-l" /></button>
          <button type="button" aria-label={`Next part of ${label}`} onClick={() => move(1)}><PdpIcon name="chevron" size={18} className="ayq-rot-r" /></button>
        </span>
      </div>
      <div className="ayq-prose ayq-readshelf__track" ref={ref} tabIndex={0} role="region" aria-label={label}><Paras list={list} leadIn={leadIn} /></div>
    </div>
  );
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
function SourceCard({ s }) {
  const meta = [s.publisher || hostLabel(s.url), s.type, s.year].filter(Boolean);
  const why = whyText(s.why);
  return (
    <li className={`ayq-src${s.negative ? ' is-negative' : ''}`}>
      <p className="ayq-src__meta">{meta.map((m, i) => <span key={m}>{i > 0 ? ', ' : ''}{m}</span>)}</p>
      <h4 className="ayq-src__title">{s.title}</h4>
      {s.negative && <p className="ayq-src__flag">Found no clear benefit</p>}
      {s.summary && <p className="ayq-src__finding"><Tx>{s.summary}</Tx></p>}
      {s.altTitles?.length > 0 && <p className="ayq-src__note">Also listed as: {s.altTitles.join('; ')}</p>}
      {why && <p className="ayq-src__note">ayna’s note: {why}</p>}
      {s.kind?.label && <p className="ayq-src__tier">{s.kind.label}</p>}
      <a className="ayq-src__go" href={s.url} target="_blank" rel="noopener noreferrer">Read the source<span aria-hidden="true"> ↗</span><span className="sr-only">: {s.title} (opens in a new tab)</span></a>
    </li>
  );
}

/** Cards in two columns on wide screens, a sideways shelf on phones. */
function SourceGrid({ items, label, id, shelf = true, compact = false }) {
  if (!items?.length) return null;
  return (
    <div className="ayq-srcs">
      {label && <h4 className="ayq-subh" id={id}>{label} <span className="ayq-count">{items.length}</span></h4>}
      <ul className={`ayq-srcgrid${shelf ? ' is-shelf' : ''}${compact ? ' is-compact' : ''}`} aria-labelledby={label ? id : undefined}>{items.map((s) => <SourceCard key={s.url} s={s} />)}</ul>
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
  summary: { tab: 'summary' }, overview: { tab: 'summary' }, fit: { tab: 'summary', anchor: 'ay-sum-fit' },
  clinical: { tab: 'clinical' }, expert: { tab: 'clinical' },
  literature: { tab: 'literature' }, evidence: { tab: 'literature' }, science: { tab: 'literature' }, research: { tab: 'literature' },
  why: { tab: 'literature', anchor: 'ay-lit-why' }, sources: { tab: 'literature', anchor: 'ay-lit-sources' }, ingredients: { tab: 'literature', anchor: 'ay-lit-ings' },
  reviews: { tab: 'reviews' },
  safety: { tab: 'summary', anchor: 'ay-sum-safety' }, 'safety-use': { tab: 'summary', anchor: 'ay-sum-safety' },
  'how-to-use': { tab: 'summary', anchor: 'ay-sum-how' }, how: { tab: 'summary', anchor: 'ay-sum-how' },
  details: { tab: 'summary', anchor: 'ay-sum-details' }, inside: { tab: 'summary', anchor: 'ay-sum-details' },
};
const resolveTarget = (raw) => TARGETS[String(raw || '').replace(/^#/, '')] || null;

function StickyTabs({ tabs, active, onChange, stickTop }) {
  const listRef = useRef(null);
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
        <div className="ayq-st__list" role="tablist" aria-label="About this product" ref={listRef} onKeyDown={onKeyDown}>
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
        <div key={t.id} role="tabpanel" id={`ay-panel-${t.id}`} aria-labelledby={`ay-tab-${t.id}`} tabIndex={0} hidden={t.id !== active} className={`ayq-panel ayq-tp is-${t.id}`}>
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
export default function ProductEvidence({ product: baseProduct, glance = null, aynaData = null, aynaRating: aynaRatingProp = null, ratingCount: ratingCountProp = 0, rateControls = null, heroLine = '', extraRows = [], onOpenReview = null, onWriteReview = null, fitSlot = null, afterOverview = null, loading = false }) {
  const product = useApprovedResearch(baseProduct);
  const m = useMemo(() => buildEvidence(product, { heroLine, glance }), [product, heroLine, glance]);
  const works = worksWith(product);
  const reviewRows = useProductReviews(baseProduct?.id);
  const liveStats = reviewRows.length ? summarizeReviewRows(reviewRows)[baseProduct?.id] : null;
  const aynaRating = liveStats ? liveStats.average : aynaRatingProp;
  const ratingCount = liveStats ? liveStats.count : ratingCountProp;

  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 'summary';
    return resolveTarget(window.location.hash.slice(1))?.tab || 'summary';
  });
  // The tab row sticks just under the website's header (the app has none above it).
  const [stickTop, setStickTop] = useState(0);
  useEffect(() => {
    const read = () => {
      const nav = document.querySelector('.app-nav-wrap');
      const pos = nav ? window.getComputedStyle(nav).position : '';
      setStickTop(nav && (pos === 'sticky' || pos === 'fixed') ? Math.round(nav.getBoundingClientRect().height) : 0);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
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
    if (takeProductTab() === 'reviews') { goTo('reviews'); return; }
    const h = window.location.hash.slice(1);
    if (resolveTarget(h)) goTo(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // Through a ref: listeners are added once.
    const on = (e) => goToRef.current(e.detail || 'summary');
    const onHash = () => { const h = window.location.hash.slice(1); if (resolveTarget(h)) goToRef.current(h); };
    window.addEventListener('ay-open-tab', on);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('ay-open-tab', on); window.removeEventListener('hashchange', onHash); };
  }, []);

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
  const { graded, topGrade, level, word: levelWord, scope: evScope, line: evLine } = evidenceLevel({ ...(baseProduct || {}), evidenceStrength: m.research.evidenceStrength });
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

  // ---- At a glance tiles ------------------------------------------------------
  const factOf = (id) => (glance?.facts || []).find((f) => f.id === id && !f.unknown && f.value);
  const howText = m.how ? [m.how.intro, ...m.how.steps].join(' ') : '';
  const wear = howText.match(/\b(?:up to|every|for up to|for)\s+\d+(?:\s*(?:to|-|–)\s*\d+)?\s*hours?\b/i);
  const tiles = [
    factOf('format') && { id: 'format', icon: 'format', label: 'Format', value: factOf('format').value },
    factOf('size') && String(factOf('size').value).length <= 60 && { id: 'size', icon: 'size', label: 'Size or count', value: factOf('size').value },
    factOf('perunit') && { id: 'perunit', icon: 'tag', label: 'Price per unit', value: factOf('perunit').value },
    factOf('fsa')?.value === 'Eligible' && { id: 'fsa', icon: 'card', label: 'FSA/HSA', value: 'Eligible' },
    m.safety.fda && { id: 'reg', icon: 'regulator', label: m.isDigital ? 'Regulation' : 'FDA status', value: m.safety.fda.label },
    !m.safety.fda && m.isDigital && m.safety.fdaRaw && m.safety.fdaRaw.length <= 60 && { id: 'reg', icon: 'regulator', label: 'Regulation', value: m.safety.fdaRaw },
    wear && { id: 'wear', icon: 'clock', label: 'From the instructions', value: cap(wear[0]) },
    (m.details.platform || m.details.integrations.length > 0) && { id: 'works', icon: 'format', label: 'Works with', value: [m.details.platform, ...m.details.integrations].filter(Boolean).join(', ') },
  ].filter(Boolean).slice(0, 6).map((t) => {
    const dot = String(t.value).split(/\s+·\s+/);
    if (dot.length > 1) return { ...t, main: cap(dot[dot.length - 1]), note: cap(dot.slice(0, -1).join(', ')) };
    const sp = splitNote(noDash(t.value));
    return { ...t, main: sp.value, note: cap(sp.note) };
  });

  // ---- Panels -----------------------------------------------------------------
  const ex = m.expert;
  const expertBody = (ex.opinion.length || ex.note.length || ex.sourceSummary || ex.sources.length || ex.other.length) ? (
    <div className="ayq-cols">
      <div className="ayq-main">
        {/* The tab is named "Clinical opinion" (founder); say plainly who wrote it. The team's note stays as written. */}
        {ex.synthesis && <p className="ayq-byline"><b>Who wrote this:</b> ayna’s clinical summary, not reviewed by a named clinician.</p>}
        {ex.attribution && <p className={ex.synthesis ? 'ayq-meta' : 'ayq-byline'}>{ex.synthesis ? <>Note on file: <Tx>{ex.attribution}</Tx></> : <><b>Who wrote this:</b> <Tx>{ex.attribution}</Tx></>}</p>}
        {ex.opinion.length > 0 && <ReadShelf list={ex.opinion} label="The full expert view" leadIn />}
        {ex.note.length > 0 && <Folder id="ayq-more-clinical" title="More clinical context" icon="stethoscope"><ReadShelf list={ex.note} label="More clinical context" /><p className="ayq-meta">From the clinical guidance in the sources.</p></Folder>}
        {ex.sourceSummary && (
          <Folder id="ayq-clin-sum" title="What the linked sources say">
            <p className="ayq-p"><Tx>{ex.sourceSummary.text}</Tx></p>
            {ex.sourceSummary.untraced && <p className="ayq-flag">Names a person we couldn’t trace to a source. Not verified by ayna.</p>}
          </Folder>
        )}
        {m.safety.alert.length > 0 && <p className="ayq-meta">There’s a safety note for this product. <button type="button" className="ayq-textbtn" onClick={() => goTo('safety')}>Read it in Safety</button></p>}
      </div>
      <aside className="ayq-side">
        <SourceGrid items={ex.sources} label=".gov health sources" id="ayq-clin-src" compact />
        <OtherLinks items={ex.other} label="Other pages the team used" note="Not .gov health sources, so ayna has not checked them. Each is labelled by what it is." />
      </aside>
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
      <ul className="ayq-grades">
        {graded.map((g) => {
          let pub = '';
          // The site's own address: a one-word publisher ("Menopause") reads like a topic.
          try { pub = new URL(g.source_url).hostname.replace(/^www\./, ''); } catch { pub = hostLabel(g.source_url); }
          return (
            <li key={g.need}>
              <div className="ayq-meter" data-level={g.strength === 'none' ? 0 : Math.min(({ A: 3, B: 2, C: 1 })[g.grade] || 0, evScope === 'product' ? 3 : 2)}><span className="ayq-meter__word">{g.strength === 'none' ? 'Not a fit' : gradeWords(g.grade, evScope === 'product')}</span><span className="ayq-meter__bars" aria-hidden="true"><i /><i /><i /></span></div>
              <p className="ayq-grades__need">{cap(needPhrase(g.need))}</p>
              <p className="ayq-p"><Tx>{noDash(PLAIN[`${g.product}|${g.need}`] || g.rationale)}</Tx></p>
              {g.source_url && <a className="ayq-src__go" href={g.source_url} target="_blank" rel="noopener noreferrer">Source: {pub}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>}
            </li>
          );
        })}
      </ul>
      <p className="ayq-meta">Graded only from .gov health sources. Strong means those sources back this kind of product for this need. Limited means little or no good evidence.</p>
    </div>
  );
  const claimBlock = claims.length > 0 && (
    <div className="ayq-claims">
      <h4 className="ayq-subh">Claims, one by one</h4>
      <ul className="ayq-claimlist">
        {claims.map((c) => (
          <li key={`${c.claim}-${c.url}`} className={`is-${c.kind}`}>
            <span className="ayq-claimlist__kind">{c.label}</span>
            <p className="ayq-p">{c.kind === 'brand' ? <>The brand says: <Tx>{c.claim}</Tx></> : <Tx>{c.claim}</Tx>}</p>
            <p className="ayq-meta">{[c.strength && `Strength on file: ${c.strength.toLowerCase()}`, c.via].filter(Boolean).join('. ')}{c.url && <>{(c.strength || c.via) ? '. ' : ''}<a href={c.url} target="_blank" rel="noopener noreferrer">{c.publisher || 'Source'}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></>}</p>
          </li>
        ))}
      </ul>
    </div>
  );
  const whyRated = (graded.length || rs.summary.length || rs.sourceSummary || rs.evidenceStrength || claims.length) ? (
    <>
      {gradeBlock}
      {rs.summary.length > 0 && <><h4 className="ayq-subh">In short</h4><ReadShelf list={rs.summary} label="Research in short" /></>}
      {rs.sourceSummary && <><h4 className="ayq-subh">What the linked research says</h4><p className="ayq-p"><Tx>{rs.sourceSummary}</Tx></p></>}
      {rs.evidenceStrength && <p className="ayq-meta">Evidence level the team recorded: {rs.evidenceStrength}</p>}
      {claimBlock}
    </>
  ) : null;
  // Step 3: the sources themselves. Step 4: ingredient by ingredient.
  const studyCards = rs.studies.filter((x) => !x.negative);
  const studiesBlock = (studyCards.length || adds('research').length || rs.other.length) ? (
    <>
      <SourceGrid items={studyCards} label={rs.negative.length ? 'Other .gov health sources' : '.gov health sources'} id="ayq-studies" />
      {adds('research').map((a) => <Addition key={a.id} a={a} />)}
      <OtherLinks items={rs.other} label="Other pages the team used" note="Not .gov health sources, so ayna has not checked them. Each is labelled by what it is." />
    </>
  ) : null;
  const ingredientsBlock = rs.ingredients.length > 0 ? (
    <div className="ayq-ings">
      <ul className="ayq-inggrid" aria-label="Ingredient notes">
        {rs.ingredients.map((i) => (
          <li key={i.name} className="ayq-ing">
            <h5 className="ayq-ing__name">{i.name}</h5>
            {i.text.length ? <Paras list={i.text} /> : <p className="ayq-meta">No explanation on file yet.</p>}
            {i.links.length > 0 && <ul className="ayq-minilinks">{i.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer"><span className="ayq-minilinks__pub">{[l.publisher, l.year].filter(Boolean).join(', ')}</span> {l.title}{l.kind.tier !== 'credible' && <em> ({l.kind.label})</em>}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>}
          </li>
        ))}
      </ul>
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
  const reviewsBody = (
    <div className="ayq-cols">
      <div className="ayq-main">
        {ratingLines}
        {breakdown && (
          <ul className="ayq-bars" aria-label="Ratings from ayna members">
            {breakdown.map((b) => <li key={b.n}><span>{b.n} <span aria-hidden="true">★</span><span className="sr-only">stars</span></span><i><s style={{ width: `${Math.round((b.c / memberRatingCount) * 100)}%` }} /></i><span>{b.c}</span></li>)}
          </ul>
        )}
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
  const DOC = /\b(doctor|provider|clinician|gyn(a)?ecologist|ob\/?gyn|physician|pharmacist|midwife|lactation|consult|talk to|ask your|healthcare)\b/i;
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
  const factRows = [
    { label: m.isDigital ? 'Regulation' : 'FDA status', value: sf.fdaRaw, node: fdaValue },
    ...sf.labelRows.map((r) => ({ label: r.label, value: r.value })),
    { label: 'Allergens', value: sf.allergens },
    { label: 'Skip if you react to', value: sf.avoidIf.join(', ') },
    { label: 'Recalls', value: recallValue ? 'x' : '', node: recallValue },
  ];
  const hasSafety = sf.alert.length || sf.warnings.length || sf.sideEffects || factRows.some((r) => r.value) || sf.privacy.length || urgent.length || sf.opinionAlerts.length || adds('safety').length || adds('privacy').length;
  const safetyBody = hasSafety ? (
    <>
      {sf.alert.length > 0 && (
        <section className="ayq-alert ayq-wide" aria-labelledby="ayq-alert-h">
          <h4 id="ayq-alert-h" className="ayq-alert__h"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z" /><path d="M12 10v5M12 18v.5" /></svg>Safety note</h4>
          <div className="ayq-alert__cols">
            <div><Paras list={sf.alert} /></div>
            {sf.record && <div className="ayq-alert__record"><h5>The record</h5><p className="ayq-p"><Tx>{sf.record}</Tx></p></div>}
          </div>
          {sf.sources.length > 0 && <ul className="ayq-minilinks is-alert">{sf.sources.map((l) => { const lp = String(l.title).match(/^([^:]{2,40}):\s+(.+)$/); return <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer"><span className="ayq-minilinks__pub">{lp ? lp[1] : l.kind.tier === 'credible' ? l.publisher : l.kind.label}</span> {lp ? lp[2] : l.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></li>; })}</ul>}
        </section>
      )}
      <div className="ayq-cols">
        <div className="ayq-main">
          {docWarnings.length > 0 && <Folder id="ayq-doc" title="Check with a clinician first" icon="stethoscope" tone="alert"><Bullets items={docWarnings} /></Folder>}
          {restWarnings.length > 0 && <><h4 className="ayq-subh">Before you use it</h4><Bullets items={restWarnings} /></>}
          {sf.sideEffects && <><h4 className="ayq-subh">{m.isDigital ? 'Downsides to know' : 'Possible side effects'}</h4><p className="ayq-p"><Tx>{sf.sideEffects}</Tx></p></>}
          {sf.opinionAlerts.length > 0 && <><h4 className="ayq-subh">Also worth knowing</h4><Paras list={sf.opinionAlerts} /></>}
          <UrgentSigns product={product} flags={urgent} />
          {!sf.alert.length && <SourceGrid items={sf.sources} label="Sources for these notes" id="ayq-safe-src" shelf={false} />}
        </div>
        <aside className="ayq-side">
          {factRows.some((r) => r.value) && <Folder id="ayq-facts" title="Label and regulator facts" icon="regulator"><Rows rows={factRows} /></Folder>}
          {sf.privacy.length > 0 && <Folder id="ayq-priv" title="Privacy" icon="shield"><Rows rows={sf.privacy} /></Folder>}
          {[...adds('safety'), ...adds('privacy')].map((a) => <Addition key={a.id} a={a} />)}
        </aside>
      </div>
    </>
  ) : null;

  const howBody = m.how ? (
    <div className="ayq-cols">
      <div className="ayq-main">
        {m.how.intro && <p className="ayq-p ayq-intro"><Tx>{m.how.intro}</Tx></p>}
        <ol className="ayq-steps">{m.how.steps.map((st, i) => <li key={st}><span className="ayq-steps__n" aria-hidden="true">{i + 1}</span><span><Tx>{st}</Tx></span></li>)}</ol>
        {(m.how.source || m.how.faq) && (
          <p className="ayq-meta">Source: {[m.how.source, m.how.faq].filter(Boolean).map((l, i) => <React.Fragment key={l.url}>{i > 0 && ', '}<a href={l.url} target="_blank" rel="noopener noreferrer">{l.publisher && !l.title.toLowerCase().includes(String(l.publisher).toLowerCase()) ? `${l.publisher}: ` : ''}{l.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></React.Fragment>)}</p>
        )}
      </div>
      {adds('how').length > 0 && <aside className="ayq-side">{adds('how').map((a) => <Addition key={a.id} a={a} />)}</aside>}
    </div>
  ) : (adds('how').length ? <div className="ayq-cols"><div className="ayq-main">{adds('how').map((a) => <Addition key={a.id} a={a} />)}</div></div> : null);

  const dt = m.details;
  const priceRows = [
    ...(glance?.facts || []).filter((f) => !f.unknown && !['inside', 'fda', 'hipaa', 'data'].includes(f.id) && f.value).map((f) => ({ label: f.label, value: noDash(f.value), note: f.note ? fmtDate(f.note) : '' })),
    ...extraRows.filter((r) => r && r.value),
    { label: 'Price note', value: dt.priceNote },
    { label: 'Sold at', value: dt.whereToBuy.join(', ') },
    { label: 'In stock at', value: dt.inStock.join(', ') },
  ].filter((r, i, arr) => r.value && arr.findIndex((x) => x.label === r.label) === i);
  const insideBody = (
      <div className="ayq-cols">
        <div className="ayq-main">
          {(dt.ingredientsText || dt.materials) && <h4 className="ayq-subh">{m.isDigital ? 'What’s included' : 'What’s in it'}</h4>}
          {dt.ingredientsText && <>{dt.materials && <h5 className="ayq-subh5">{m.isDigital ? 'Included' : 'Ingredients'}</h5>}{(() => {
            // Website (main #73): a plain ingredient list reads as chips; anything else stays as written.
            const chips = ingredientChips(dt.ingredientsText);
            return chips ? <ul className="ay-chips" aria-label={m.isDigital ? 'Included' : 'Ingredients'}>{chips.map((c, i) => <li key={`${c}-${i}`}>{c}</li>)}</ul> : <p className="ayq-p ayq-pre">{dt.ingredientsText}</p>;
          })()}</>}
          {dt.materials && <>{dt.ingredientsText && <h5 className="ayq-subh5">Materials</h5>}<p className="ayq-p"><Tx>{dt.materials}</Tx></p></>}
          {dt.badges.length > 0 && <><h4 className="ayq-subh">Labels on file</h4><ul className="ayq-tags">{dt.badges.map((b) => <li key={b}>{b}</li>)}</ul><p className="ayq-meta">Claims and labels from the brand or listing. ayna hasn’t checked each one.</p></>}
          {works.items.length > 0 && <p className="ayq-meta"><b>Works with:</b> {works.items.map((t, i) => <React.Fragment key={t}>{i > 0 && ', '}{t === 'ayna' && works.ayna ? <a href="/health-data">ayna</a> : t}</React.Fragment>)}</p>}
        </div>
        {priceRows.length > 0 && <aside className="ayq-side"><Folder id="ayq-price" title="Size and price" icon="tag"><Rows rows={priceRows} /></Folder></aside>}
      </div>
  );
  const sourcesBody = allSources.length > 0 && (
        <div className="ayq-index">
          <h4 className="ayq-subh">Every source we checked <span className="ayq-count">{allSources.length}</span></h4>
          <ul className="ayq-indexlist">
            {allSources.map((x) => {
              const kind = linkKind(x.url, m.brand);
              const pub = x.publisher || publisherOf(x.url, m.brand);
              return <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer"><span className="ayq-indexlist__tag">{x.label || kind.label || 'Source'}</span><span className="ayq-indexlist__title">{cleanTitle(noDash(x.title), pub)}</span><span className="ayq-indexlist__pub">{[pub, x.year].filter(Boolean).join(', ')}</span><span className="sr-only"> (opens in a new tab)</span></a></li>;
            })}
          </ul>
        </div>
  );

  // ---- ayna summary --------------------------------------------------------------
  const shortList = ex.short;
  const hasWho = m.who.length > 0 || (glance?.who?.helps || []).length > 0;
  const hasWhat = m.summary.length > 0;
  const aboutTitle = hasWhat && hasWho ? 'What it is and who it’s for' : hasWhat ? 'What it is' : 'Who it’s for';
  const hasInside = Boolean(dt.ingredientsText || dt.materials || dt.badges.length || works.items.length || priceRows.length);
  const jumps = [
    fitSlot && { id: 'ay-sum-fit', label: 'Your match' },
    (hasWhat || hasWho) && { id: 'ay-sum-about', label: 'What it is' },
    safetyBody && { id: 'ay-sum-safety', label: 'Safety', tone: sf.alert.length ? 'alert' : '' },
    hasInside && { id: 'ay-sum-details', label: m.isDigital ? 'What’s included' : 'Ingredients' },
    howBody && { id: 'ay-sum-how', label: 'How to use' },
  ].filter(Boolean);
  const jumpTo = (id) => { const el = document.getElementById(id); if (el) scrollToEl(el); };
  const summaryBody = (
    <div className="ayq-sum">
      {jumps.length > 1 && (
        <nav className="ayq-sum__jump" aria-label="In ayna summary">
          {jumps.map((j) => <button key={j.id} type="button" className={j.tone ? `is-${j.tone}` : undefined} onClick={() => jumpTo(j.id)}>{j.label}</button>)}
        </nav>
      )}
      {shortList.length > 0 && (
        <article className="ayq-bottom" aria-labelledby="ayq-bottom-h">
          <h3 id="ayq-bottom-h" className="ayq-bottom__h">ayna’s take</h3>
          <ul className="ayq-bottom__list">{shortList.map((s) => <li key={s}><Tx>{s}</Tx></li>)}</ul>
          {ex.attribution && <p className="ayq-bottom__by">{m.independent ? 'ayna’s summary of the research' : 'Summary of the research, with claims credited to the brand'}. <button type="button" onClick={() => goTo('clinical')}>Read the clinical opinion</button></p>}
        </article>
      )}
      {fitSlot && <div id="ay-sum-fit" className="ayq-anchor ayq-sum__fit">{fitSlot}</div>}
      {(hasWhat || hasWho) && (
        <section id="ay-sum-about" className="ayq-anchor ayq-about" aria-labelledby="ayq-about-h">
          <h3 id="ayq-about-h" className="ayq-h3">{aboutTitle}</h3>
          {hasWhat && <div className="ayq-prose"><Paras list={m.summary} /></div>}
          {hasWho && (
            <div id="ayq-who" className="ayq-who">
              {m.who.length > 0 && <ol className="ayq-checks" aria-label="Who it’s for">{m.who.map((w, i) => <li key={w}><span className="ayq-checks__n" aria-hidden="true">{i + 1}</span><span><Tx>{w}</Tx></span></li>)}</ol>}
              {(glance?.who?.helps || []).length > 0 && <p className="ayq-meta"><b>Helps with:</b> {glance.who.helps.join(', ')}</p>}
            </div>
          )}
        </section>
      )}
      {tiles.length > 0 && (
        <section className="ayq-glance" aria-labelledby="ayq-glance-h">
          <h3 id="ayq-glance-h" className="ayq-h3">At a glance</h3>
          <ul className="ayq-tiles">
            {tiles.map((t) => <li key={t.id}><PdpIcon name={t.icon} size={20} /><span><span className="ayq-tiles__label">{t.label}</span><span className="ayq-tiles__value">{t.main}</span>{t.note && <span className="ayq-tiles__note">{t.note}</span>}</span></li>)}
          </ul>
        </section>
      )}
      {safetyBody && <section id="ay-sum-safety" className={`ayq-anchor ayq-sumsec${sf.alert.length ? ' is-alert' : ''}`} aria-labelledby="ay-sum-safety-h"><h3 id="ay-sum-safety-h" className="ayq-h3">Safety</h3>{safetyBody}</section>}
      {hasInside && <section id="ay-sum-details" className="ayq-anchor ayq-sumsec" aria-labelledby="ay-sum-details-h"><h3 id="ay-sum-details-h" className="ayq-h3">{m.isDigital ? 'What’s included and details' : 'Ingredients and dose'}</h3>{insideBody}</section>}
      {howBody && <section id="ay-sum-how" className="ayq-anchor ayq-sumsec" aria-labelledby="ay-sum-how-h"><h3 id="ay-sum-how-h" className="ayq-h3">How to use</h3>{howBody}</section>}
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
  const literatureBody = (
    <div className="ayq-lit">
      <section className="ayq-evo" aria-labelledby="ayq-evo-h">
        <h3 id="ayq-evo-h" className="ayq-h3">Evidence overview</h3>
        {level > 0 ? (
          <div className="ayq-evo__level">
            <span className="ayq-meter" data-level={level}><span className="ayq-meter__word">{levelWord}{topGrade && <span className="ayq-meter__for"> for {needPhrase(topGrade.need)}</span>}</span><span className="ayq-meter__bars" role="img" aria-label={`${levelWord}, ${level} of 3`}><i /><i /><i /></span></span>
            <p className="ayq-meta">{evScope === 'type' ? <Tx>{evLine}</Tx> : graded.length ? 'Graded by ayna from .gov health sources.' : 'The level the team recorded. Not yet checked against .gov health sources.'}</p>
          </div>
        ) : (
          <div className="ayq-evo__none">
            <p className="ayq-evo__noneh">No .gov-checked evidence yet</p>
            <p className="ayq-p">ayna checks health claims only against .gov sources such as MedlinePlus, NIH and FDA. None is linked to this product yet, so it has no grade. What is on file is listed below for what it is.</p>
          </div>
        )}
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
      {whyRated
        ? <Step id="ay-lit-why" title="Why ayna rated it this way">{whyRated}</Step>
        : <p className="ayq-meta">ayna has not graded this product yet, because no .gov source is linked to it.</p>}
      {(studiesBlock || sourcesBody) && <Step id="ay-lit-sources" title="View studies and sources" meta={sourceCount ? plural(sourceCount, 'link') : ''}>{studiesBlock}{sourcesBody}</Step>}
      {ingredientsBlock && <Step id="ay-lit-ings" title={rs.ingredientsAreTopics ? 'Point by point' : 'Ingredient by ingredient'} meta={plural(rs.ingredients.length, rs.ingredientsAreTopics ? 'topic' : 'ingredient')}>{ingredientsBlock}</Step>}
    </div>
  );

  // ---- Reviews: community first, then online; never evidence ----------------------
  const reviewsTab = (
    <div className="ayq-rev">
      <p className="ayq-callout">Reviews are people’s experiences. They are not evidence that a product works.</p>
      {reviewRows.length > 0 && <ProductPeopleSay productId={baseProduct?.id} reviews={reviewRows} onWriteReview={onWriteReview} onOpenPost={onOpenReview} />}
      {reviewsBody}
      {!reviewRows.length && onWriteReview && <button type="button" className="ayq-cta" onClick={onWriteReview}>Write a review</button>}
    </div>
  );

  const bodies = { clinical: clinicalBody, literature: literatureBody, summary: summaryBody, reviews: reviewsTab };
  const tabs = TAB_ORDER.map((id) => ({ id, label: TAB_LABELS[id], body: bodies[id] }));
  const activeTab = TAB_ORDER.includes(tab) ? tab : 'summary';

  return (
    <TermsCtx.Provider value={plan}>
      <div id="ay-tabs" className="ayq ayq--tabs">
        <section id="ay-pt" className="ayq-tabsec" aria-label="Clinical opinion, scientific literature, ayna summary and reviews">
          <StickyTabs tabs={tabs} active={activeTab} onChange={chooseTab} stickTop={stickTop} />
        </section>
        {afterOverview}
      </div>
    </TermsCtx.Provider>
  );
}

/** Kept for callers that still pass a safety block: the page now builds Safety itself. */
export function ProductSafety() { return null; }
