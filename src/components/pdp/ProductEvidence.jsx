import React, { useEffect, useMemo, useRef, useState } from 'react';
import NEED_MAP_RESEARCH from '../../data/matching/needMap.research.js';
import PLAIN from '../../data/matching/plainRationales.js';
import { needPhrase } from '../../matching/ontology';
import { useApprovedResearch } from '../../utils/approvedResearch';
import { urgentSignsFor } from '../../utils/urgentSigns';
import { worksWith } from '../../utils/aynaIntegrations';
import { hostLabel } from '../../utils/verificationLinks';
import { summarizeReviewRows, takeProductTab } from '../../utils/community/reviewRatings.js';
import GlossaryTerm from '../GlossaryTerm';
import { findHardTerms, planGlossaryTerms } from '../../data/glossary';
import { splitNote, splitSentences } from './sentences';
import { fmtDate } from './fmtDate';
import { buildEvidence, noDash, linkKind, publisherOf, cleanTitle } from './evidenceModel';
import PdpIcon from './PdpIcon.jsx';
import UrgentSigns from './UrgentSigns.jsx';
import ProductCommunityReviews from './ProductCommunityReviews.jsx';
import ProductPeopleSay from './ProductPeopleSay.jsx';
import { useProductReviews } from './useProductReviews.js';
import './pdp-complete.css';

/**
 * The inside of the product page (website and app): everything the team
 * wrote, grouped so it reads at a glance and nothing is lost.
 *
 * 1. Overview: the short answer (the team's bottom line), At a glance, one
 *    preview tile per section that jumps to it, what it is, who it's for.
 * 2. Sticky segmented tabs: Expert view, Research, Reviews, Safety, How to
 *    use, Details. Each panel is laid out in columns on wide screens, with
 *    sources on a shelf on phones. Every panel is in the HTML from the start.
 *
 * The words are the team's (src/data); ayna's own additions
 * (src/data/pdpAdditions.js) are labelled as ayna's check with their source.
 */

const RESEARCH_BY_PRODUCT = NEED_MAP_RESEARCH.reduce((m, r) => { if (!m.has(r.product)) m.set(r.product, []); m.get(r.product).push(r); return m; }, new Map());
const GRADE_WORDS = { A: 'Strong evidence', B: 'Some evidence', C: 'Limited evidence' };
const TAB_IDS = ['overview', 'clinical', 'literature', 'reviews', 'safety', 'how-to-use', 'details'];
const PHONE = '(max-width: 760px)';
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
// Tabs (segmented: every tab visible on a phone, no sideways scroll)
// ---------------------------------------------------------------------------
function SegTabs({ tabs, active, onChange, explore = false }) {
  const listRef = useRef(null);
  // The tab row (main #73, Neycher HydroBloom design): a box with "Explore",
  // "2 of 7", arrows and a bar showing how far the row is scrolled. The edge
  // that still has tabs past it fades, so it's clear there is more.
  const [m, setM] = useState({ sl: 0, sw: 1, cw: 1 });
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const update = () => setM((prev) => (prev.sl === el.scrollLeft && prev.sw === el.scrollWidth && prev.cw === el.clientWidth ? prev : { sl: el.scrollLeft, sw: el.scrollWidth, cw: el.clientWidth }));
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [tabs.length]);
  const over = m.sw - m.cw > 4; const atStart = m.sl < 4; const atEnd = m.sl >= m.sw - m.cw - 4;
  const reduce = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = (dir) => { const el = listRef.current; if (el) el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: reduce() ? 'auto' : 'smooth' }); };
  useEffect(() => {
    const el = listRef.current;
    const tab = el?.querySelector(`[data-tab="${active}"]`);
    if (!el || !tab || el.scrollWidth <= el.clientWidth) return;
    const left = tab.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
    if (left < el.scrollLeft || left + tab.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: Math.max(0, left - 24), behavior: reduce() ? 'auto' : 'smooth' });
    }
  }, [active]);
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
  const at = Math.max(0, tabs.findIndex((t) => t.id === active));
  // Colour keys for the dots and the open tab (pdp-v4.css uses main's tab names).
  const KEY = { overview: 'overview', clinical: 'clinical', literature: 'science', reviews: 'reviews', safety: 'safety', 'how-to-use': 'how', details: 'details' };
  const panels = tabs.map((t) => (
    <div key={t.id} role="tabpanel" id={`ay-panel-${t.id}`} aria-labelledby={`ay-tab-${t.id}`} tabIndex={0} hidden={t.id !== active} className={`ayq-panel${explore ? ' ay-itabs__panel' : ''} is-${t.id}`}>
      <h3 className="sr-only">{t.label}</h3>
      {t.body}
    </div>
  ));
  // The app keeps its underline tabs (scrollable row, faded edge).
  if (!explore) {
    return (
      <>
        <div className={`ayq-tabsbar${over && !atStart ? ' has-left' : ''}${over && !atEnd ? ' has-right' : ''}`}>
          <div className={`ayq-tabs is-${tabs.length}`} role="tablist" aria-label="Product details" ref={listRef} onKeyDown={onKeyDown}>
            {tabs.map((t) => {
              const on = t.id === active;
              return (
                <button key={t.id} type="button" role="tab" id={`ay-tab-${t.id}`} data-tab={t.id} aria-selected={on} aria-controls={`ay-panel-${t.id}`} tabIndex={on ? 0 : -1} className={`ayq-tab${on ? ' is-on' : ''}${t.tone ? ` is-${t.tone}` : ''}`} onClick={() => choose(t.id)}>
                  <PdpIcon name={t.icon} size={18} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {panels}
      </>
    );
  }
  return (
    <>
      <div className="ay-explore">
        <div className="ay-explore__head">
          <p className="ay-explore__label"><span>Explore</span><span>{at + 1} of {tabs.length}</span></p>
          <div className="ay-explore__arrows">
            <button type="button" aria-label="Scroll tabs left" className={over && !atStart ? '' : 'is-dim'} onClick={() => step(-1)}>←</button>
            <button type="button" aria-label="Scroll tabs right" className={`is-next${over && !atEnd ? '' : ' is-dim'}`} onClick={() => step(1)}>→</button>
          </div>
        </div>
        <div className={`ay-explore__rowwrap${over && !atStart ? ' fade-l' : ''}${over && !atEnd ? ' fade-r' : ''}`}>
          <div className="ay-itabs__bar" role="tablist" aria-label="Product details" ref={listRef} onKeyDown={onKeyDown}>
            {tabs.map((t) => {
              const on = t.id === active;
              return (
                <button key={t.id} type="button" role="tab" id={`ay-tab-${t.id}`} data-tab={t.id} aria-selected={on} aria-controls={`ay-panel-${t.id}`} tabIndex={on ? 0 : -1} className={`is-${KEY[t.id] || t.id}${on ? ' is-on' : ''}${t.tone ? ` is-tone-${t.tone}` : ''}`} onClick={() => choose(t.id)}>
                  <i aria-hidden="true" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {over && (
          <div className="ay-explore__foot">
            <span className="ay-explore__track" aria-hidden="true"><b style={{ left: `${((m.sl / m.sw) * 100).toFixed(1)}%`, width: `${Math.min(100, (m.cw / m.sw) * 100).toFixed(1)}%` }} /></span>
            <span className="ay-explore__hint">{atEnd ? '← Scroll back' : 'Scroll for more →'}</span>
          </div>
        )}
      </div>
      {panels}
    </>
  );
}

// ---------------------------------------------------------------------------
// The page part
// ---------------------------------------------------------------------------
export default function ProductEvidence({ product: baseProduct, glance = null, aynaData = null, aynaRating: aynaRatingProp = null, ratingCount: ratingCountProp = 0, rateControls = null, heroLine = '', extraRows = [], onOpenReview = null, onWriteReview = null, fitSlot = null, afterOverview = null, loading = false, v4 = false }) {
  const product = useApprovedResearch(baseProduct);
  const m = useMemo(() => buildEvidence(product, { heroLine, glance }), [product, heroLine, glance]);
  const works = worksWith(product);
  const reviewRows = useProductReviews(baseProduct?.id);
  const liveStats = reviewRows.length ? summarizeReviewRows(reviewRows)[baseProduct?.id] : null;
  const aynaRating = liveStats ? liveStats.average : aynaRatingProp;
  const ratingCount = liveStats ? liveStats.count : ratingCountProp;

  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(PHONE);
    const on = () => setIsPhone(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return '';
    const h = window.location.hash.slice(1);
    return TAB_IDS.includes(h) ? h : '';
  });
  const scrollToTabs = () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const el = document.getElementById('ay-pt');
      if (!el) return;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }));
  };
  const chooseTab = (id) => {
    setTab(id);
    try { window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${id}`); } catch { /* sandboxed */ }
  };
  // Old ids used by other parts of the page map onto the tabs.
  const ALIAS = { science: 'literature', evidence: 'literature', how: 'how-to-use', sources: 'details', overview: 'overview', inside: 'literature' };
  const goTo = (raw) => {
    const id = ALIAS[raw] || raw;
    if (id === 'overview' && !v4) { document.getElementById('ayq-who')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    chooseTab(id);
    scrollToTabs();
  };
  useEffect(() => {
    if (takeProductTab() === 'reviews') goTo('reviews');
    else if (TAB_IDS.includes(window.location.hash.slice(1))) scrollToTabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const on = (e) => goTo(!e.detail || e.detail === 'details' ? 'safety' : e.detail);
    const onHash = () => { const h = window.location.hash.slice(1); if (TAB_IDS.includes(h)) { setTab(h); scrollToTabs(); } };
    window.addEventListener('ay-open-tab', on);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('ay-open-tab', on); window.removeEventListener('hashchange', onHash); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const graded = (RESEARCH_BY_PRODUCT.get(baseProduct?.id) || []).slice().sort((x, y) => (x.strength === 'none') - (y.strength === 'none') || x.grade.localeCompare(y.grade));
  const topGrade = graded.find((g) => g.strength !== 'none');
  const level = topGrade ? ({ A: 3, B: 2, C: 1 })[topGrade.grade] || 0
    : /strong/i.test(m.research.evidenceStrength) ? 3 : /moderate|some/i.test(m.research.evidenceStrength) ? 2 : /limited|weak|low|insufficient/i.test(m.research.evidenceStrength) ? 1 : 0;
  const levelWord = ['', 'Limited evidence', 'Some evidence', 'Strong evidence'][level];
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
        {ex.attribution && <p className="ayq-byline"><b>Who wrote this:</b> <Tx>{ex.attribution}</Tx></p>}
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
        <SourceGrid items={ex.sources} label="Health bodies and journals" id="ayq-clin-src" compact />
        <OtherLinks items={ex.other} label="Other pages the team used" note="Brand pages and other links that aren’t independent research." />
      </aside>
    </div>
  ) : null;

  const rs = m.research;
  const hasResearch = graded.length || rs.summary.length || rs.sourceSummary || rs.studies.length || rs.ingredients.length || rs.other.length || rs.evidenceStrength;
  const researchBody = hasResearch ? (
    <>
      {rs.negative.length > 0 && (
        <Folder id="ayq-neg" title="Results to know about" tone="alert" icon="paper" className="ayq-wide">
          <p className="ayq-p">{rs.negative.length === 1 ? 'This study found no clear benefit:' : `${rs.negative.length} studies found no clear benefit:`}</p>
          <ul className="ayq-neglist">{rs.negative.map((s) => <li key={s.url}><span className="ayq-neglist__meta">{[s.publisher, s.type, s.year].filter(Boolean).join(', ')}</span><b>{s.title}</b> <Tx>{s.summary}</Tx> <a href={s.url} target="_blank" rel="noopener noreferrer">Read the source<span aria-hidden="true"> ↗</span><span className="sr-only">: {s.title} (opens in a new tab)</span></a></li>)}</ul>
        </Folder>
      )}
      <div className="ayq-cols">
        <div className="ayq-main">
          {rs.summary.length > 0 && <><h4 className="ayq-subh">In short</h4><ReadShelf list={rs.summary} label="Research in short" /></>}
          {rs.sourceSummary && <><h4 className="ayq-subh">What the linked research says</h4><p className="ayq-p"><Tx>{rs.sourceSummary}</Tx></p></>}
          {rs.evidenceStrength && <p className="ayq-meta">Evidence level on file: {rs.evidenceStrength}</p>}
        </div>
        {graded.length > 0 && (
          <aside className="ayq-side">
            <Folder id="ayq-grade" title="ayna’s evidence check">
              <ul className="ayq-grades">
                {graded.map((g) => {
                  let pub = '';
                  // The site's own address: a one-word publisher ("Menopause") reads like a topic.
                  try { pub = new URL(g.source_url).hostname.replace(/^www\./, ''); } catch { pub = hostLabel(g.source_url); }
                  return (
                    <li key={g.need}>
                      <div className="ayq-meter" data-level={g.strength === 'none' ? 0 : ({ A: 3, B: 2, C: 1 })[g.grade] || 0}><span className="ayq-meter__word">{g.strength === 'none' ? 'Not a fit' : GRADE_WORDS[g.grade]}</span><span className="ayq-meter__bars" aria-hidden="true"><i /><i /><i /></span></div>
                      <p className="ayq-grades__need">{cap(needPhrase(g.need))}</p>
                      <p className="ayq-p"><Tx>{noDash(PLAIN[`${g.product}|${g.need}`] || g.rationale)}</Tx></p>
                      {g.source_url && <a className="ayq-src__go" href={g.source_url} target="_blank" rel="noopener noreferrer">Source: {pub}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>}
                    </li>
                  );
                })}
              </ul>
              <p className="ayq-meta">Graded from clinical guidelines, systematic reviews and government health sources. Strong means guidelines back this kind of product for this need. Limited means little or no good evidence.</p>
            </Folder>
          </aside>
        )}
      </div>
      <SourceGrid items={rs.studies.filter((x) => !x.negative)} label={rs.negative.length ? 'Other studies and reviews' : 'Studies and reviews'} id="ayq-studies" />
      {rs.ingredients.length > 0 && (
        <div className="ayq-ings">
          <h4 className="ayq-subh">{rs.ingredientsAreTopics ? 'Point by point' : 'Ingredient by ingredient'} <span className="ayq-count">{rs.ingredients.length}</span></h4>
          <ul className="ayq-inggrid" tabIndex={0} aria-label="Ingredient notes">
            {rs.ingredients.map((i) => (
              <li key={i.name} className="ayq-ing">
                <h5 className="ayq-ing__name">{i.name}</h5>
                {i.text.length ? <Paras list={i.text} /> : <p className="ayq-meta">No explanation on file yet.</p>}
                {i.links.length > 0 && <ul className="ayq-minilinks">{i.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer"><span className="ayq-minilinks__pub">{[l.publisher, l.year].filter(Boolean).join(', ')}</span> {l.title}{l.kind.tier !== 'credible' && <em> ({l.kind.label})</em>}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>}
              </li>
            ))}
          </ul>
          {rs.ingredientNote && <p className="ayq-meta">{rs.ingredientNote}</p>}
        </div>
      )}
      {adds('research').map((a) => <Addition key={a.id} a={a} />)}
      <OtherLinks items={rs.other} label="Other pages the team used" note="Not peer-reviewed research. Labelled by what they are." />
    </>
  ) : null;

  const rv = m.reviews;
  const ratingLines = [
    hasMemberRating && <p key="m" className="ayq-rating"><b><span aria-hidden="true">★ </span>{aynaRating.toFixed(1)}</b> from {plural(ratingCount, 'ayna member review')}</p>,
    rv.brandRating && <p key="b" className="ayq-rating"><b><span aria-hidden="true">★ </span>{rv.brandRating.value}</b> from {rv.brandRating.count} reviews <span className="ayq-flag">Reported by the brand or a retailer, not verified by ayna</span></p>,
    rv.userRating && <p key="u" className="ayq-rating"><b><span aria-hidden="true">★ </span>{rv.userRating.value}</b> {rv.userRating.url ? <a href={rv.userRating.url} target="_blank" rel="noopener noreferrer">online rating<span aria-hidden="true"> ↗</span></a> : 'online rating'} <span className="ayq-flag">Not verified by ayna</span></p>,
  ].filter(Boolean);
  const onlineLinks = [...rv.online, ...(m.brand ? [{ url: `https://www.trustpilot.com/search?query=${encodeURIComponent(m.brand)}`, title: `${m.brand} on Trustpilot`, publisher: 'Trustpilot', summary: '', kind: { label: 'Search of company reviews' } }] : [])];
  const hasReviews = ratingLines.length || reviewRows.length || rv.text.length || rv.sourceSummary || rv.ratingNote || rv.elsewhere.length || rv.online.length || memberReviews.length || rateControls;
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
  const detailsBody = (
    <>
      <div className="ayq-cols">
        <div className="ayq-main">
          {(dt.ingredientsText || dt.materials) && <h4 className="ayq-subh">{m.isDigital ? 'What’s included' : 'What’s in it'}</h4>}
          {dt.ingredientsText && <>{dt.materials && <h5 className="ayq-subh5">{m.isDigital ? 'Included' : 'Ingredients'}</h5>}{(() => {
            // Website (main #73): a plain ingredient list reads as chips; anything else stays as written.
            const chips = v4 ? ingredientChips(dt.ingredientsText) : null;
            return chips ? <ul className="ay-chips" aria-label={m.isDigital ? 'Included' : 'Ingredients'}>{chips.map((c, i) => <li key={`${c}-${i}`}>{c}</li>)}</ul> : <p className="ayq-p ayq-pre">{dt.ingredientsText}</p>;
          })()}</>}
          {dt.materials && <>{dt.ingredientsText && <h5 className="ayq-subh5">Materials</h5>}<p className="ayq-p"><Tx>{dt.materials}</Tx></p></>}
          {dt.badges.length > 0 && <><h4 className="ayq-subh">Labels on file</h4><ul className="ayq-tags">{dt.badges.map((b) => <li key={b}>{b}</li>)}</ul><p className="ayq-meta">Claims and labels from the brand or listing. ayna hasn’t checked each one.</p></>}
          {works.items.length > 0 && <p className="ayq-meta"><b>Works with:</b> {works.items.map((t, i) => <React.Fragment key={t}>{i > 0 && ', '}{t === 'ayna' && works.ayna ? <a href="/health-data">ayna</a> : t}</React.Fragment>)}</p>}
        </div>
        {priceRows.length > 0 && <aside className="ayq-side"><Folder id="ayq-price" title="Size and price" icon="tag"><Rows rows={priceRows} /></Folder></aside>}
      </div>
      {allSources.length > 0 && (
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
      )}
    </>
  );

  const tabs = [
    expertBody && { id: 'clinical', label: 'Expert view', icon: 'stethoscope', body: expertBody },
    researchBody && { id: 'literature', label: 'Research', icon: 'paper', body: researchBody },
    hasReviews && { id: 'reviews', label: 'Reviews', icon: 'community', body: reviewsBody },
    safetyBody && { id: 'safety', label: 'Safety', icon: 'shield', tone: sf.alert.length ? 'alert' : '', body: safetyBody },
    howBody && { id: 'how-to-use', label: 'How to use', icon: 'steps', body: howBody },
    { id: 'details', label: 'Details', icon: 'format', body: detailsBody },
  ].filter(Boolean);
  const activeTab = tabs.some((t) => t.id === tab) ? tab : (tabs[0]?.id || '');

  // ---- Overview: the short answer, at a glance, one preview per section --------
  const shortList = ex.short;
  const alertHead = (() => {
    const t = sf.alert[0] || '';
    const colon = t.indexOf(':');
    if (colon > 8 && colon <= 70) return `${t.slice(0, colon)}.`;
    return '';
  })();
  // Each preview leads with one real number (studies on file, things to check, a rating, steps).
  const researchCount = new Set([...ex.sources, ...rs.studies, ...rs.ingredients.flatMap((i) => i.links)].filter((l) => l.kind.tier === 'credible').map((l) => l.url)).size;
  const previews = [
    tabs.some((t) => t.id === 'literature') && (rs.negative.length
      ? { id: 'literature', icon: 'paper', label: 'Research', num: String(rs.negative.length), caption: rs.negative.length === 1 ? 'study found no clear benefit' : 'studies found no clear benefit', short: 'no benefit found' }
      : researchCount
        ? { id: 'literature', icon: 'paper', label: 'Research', num: String(researchCount), caption: `${researchCount === 1 ? 'study or health-body source' : 'studies and health-body sources'}${levelWord ? `. ${levelWord}` : ''}`, short: 'sources' }
        : { id: 'literature', icon: 'paper', label: 'Research', caption: levelWord || (rs.ingredients.length ? plural(rs.ingredients.length, rs.ingredientsAreTopics ? 'topic' : 'ingredient') + ' explained' : 'What the research says'), short: levelWord ? levelWord.replace(' evidence', '') : 'Read it' }),
    tabs.some((t) => t.id === 'safety') && (sf.alert.length
      ? { id: 'safety', icon: 'shield', label: 'Safety', caption: alertHead || 'Safety note on file', short: 'Note on file', tone: 'alert' }
      : sf.warnings.length
        ? { id: 'safety', icon: 'shield', label: 'Safety', num: String(sf.warnings.length), caption: sf.warnings.length === 1 ? 'thing to check first' : 'things to check first', short: 'to check' }
        : { id: 'safety', icon: 'shield', label: 'Safety', caption: 'Label and regulator facts', short: 'Label facts' }),
    tabs.some((t) => t.id === 'reviews') && (hasMemberRating
      ? { id: 'reviews', icon: 'community', label: 'Reviews', num: aynaRating.toFixed(1), caption: `from ${plural(ratingCount, 'ayna member')}`, short: 'members' }
      : rv.brandRating
        ? { id: 'reviews', icon: 'community', label: 'Reviews', num: rv.brandRating.value, caption: `from ${rv.brandRating.count} online reviews, not verified`, short: 'online' }
        : { id: 'reviews', icon: 'community', label: 'Reviews', caption: rv.text.length ? 'What people say online' : 'No reviews yet', short: rv.text.length ? 'Online' : 'None yet' }),
    tabs.some((t) => t.id === 'how-to-use') && m.how && { id: 'how-to-use', icon: 'steps', label: 'How to use', num: String(m.how.steps.length), caption: m.how.steps.length === 1 ? 'step' : 'steps', short: m.how.steps.length === 1 ? 'step' : 'steps' },
  ].filter(Boolean);

  // P1-5 / R2: "What it is" and "Who it's for" are one plain section with ONE
  // heading that names what's in it (no second "Who it's for" heading under
  // the first). Every team sentence still shows once, in one place.
  const hasWho = m.who.length > 0 || (glance?.who?.helps || []).length > 0;
  const hasWhat = m.summary.length > 0;
  const aboutTitle = hasWhat && hasWho ? 'What it is and who it’s for' : hasWhat ? 'What it is' : 'Who it’s for';
  const whoBlock = hasWho && (
    <div id="ayq-who" className="ayq-who">
      {m.who.length > 0 && <ol className="ayq-checks" aria-label="Who it’s for">{m.who.map((w, i) => <li key={w}><span className="ayq-checks__n" aria-hidden="true">{i + 1}</span><span><Tx>{w}</Tx></span></li>)}</ol>}
      {(glance?.who?.helps || []).length > 0 && <p className="ayq-meta"><b>Helps with:</b> {glance.who.helps.join(', ')}</p>}
    </div>
  );

  // Website (main #73, Neycher HydroBloom design): colour-coded cards, one per
  // section, each with its first line; they open the tab. Same numbers as the app's previews.
  const firstLine = (t) => { const x = splitSentences(noDash(String(t || '')))[0] || ''; return x.length > 120 ? `${x.slice(0, 110).replace(/\s+\S*$/, '')}…` : x; };
  const PREVIEW_KEY = { clinical: 'clinical', literature: 'science', safety: 'safety', reviews: 'reviews', 'how-to-use': 'how' };
  const cards = v4 ? [
    tabs.some((t) => t.id === 'clinical') && { id: 'clinical', label: 'Expert view', tag: '', text: firstLine(ex.opinion[0] || ex.short[0] || ex.note[0] || ex.sourceSummary?.text) || 'What the clinical guidance says' },
    ...previews.map((pv) => ({
      id: pv.id,
      label: pv.label,
      tag: [pv.num, pv.caption].filter(Boolean).join(' '),
      text: pv.id === 'safety' ? firstLine(sf.alert[0] || sf.warnings[0] || sf.sideEffects)
        : pv.id === 'reviews' ? (rv.text.length ? firstLine(rv.text[0]) : 'Tried it? Be the first to review it.')
          : pv.id === 'literature' ? firstLine(rs.summary[0] || rs.sourceSummary)
            : pv.id === 'how-to-use' ? firstLine(m.how?.intro || m.how?.steps?.[0]) : '',
      tone: pv.tone,
    })),
  ].filter((c) => c && (c.text || c.tag)) : [];
  const glanceCards = cards.length > 0 && (
    <ul className="ay-glance" aria-label="Jump to a section">
      {cards.map((c) => (
        <li key={c.id} className={`is-${PREVIEW_KEY[c.id] || c.id}${c.tone ? ` is-tone-${c.tone}` : ''}`}>
          <button type="button" onClick={() => goTo(c.id)}>
            <span className="ay-glance__label">{c.label}</span>
            {c.tag && <span className="ay-glance__tag">{c.tag}</span>}
            {c.text && <span className="ay-glance__text">{c.text}</span>}
            <span className="ay-glance__go" aria-hidden="true">→</span>
          </button>
        </li>
      ))}
    </ul>
  );

  const overview = (
    <section className="ayq-over" aria-label="Overview">
      {shortList.length > 0 ? (
        <article className="ayq-bottom" aria-labelledby="ayq-bottom-h">
          <h2 id="ayq-bottom-h" className="ayq-bottom__h">The short answer</h2>
          <ul className="ayq-bottom__list">{shortList.map((s) => <li key={s}><Tx>{s}</Tx></li>)}</ul>
          {ex.attribution && <p className="ayq-bottom__by">{m.independent ? 'ayna’s summary of the research' : 'Summary of the research, with claims credited to the brand'}. <button type="button" onClick={() => goTo('clinical')}>Read the full expert view</button></p>}
        </article>
      ) : (hasWhat || hasWho) ? (
        <article className="ayq-about" aria-labelledby="ayq-about-h">
          <h2 id="ayq-about-h" className="ayq-h3">{aboutTitle}</h2>
          {hasWhat && <div className="ayq-prose"><Paras list={m.summary} /></div>}
          {whoBlock}
        </article>
      ) : null}

      {(level > 0 || tiles.length > 0) && (
        <div className="ayq-glance" aria-labelledby="ayq-glance-h">
          <h2 id="ayq-glance-h" className="ayq-h3">At a glance</h2>
          {level > 0 && (
            <button type="button" className="ayq-glance__ev" onClick={() => goTo('literature')}>
              <span className="ayq-meter" data-level={level}><span className="ayq-meter__word">{levelWord}{topGrade && <span className="ayq-meter__for"> for {needPhrase(topGrade.need)}</span>}</span><span className="ayq-meter__bars" role="img" aria-label={`${levelWord}, ${level} of 3`}><i /><i /><i /></span></span>
              <span className="ayq-glance__go">See the research</span>
            </button>
          )}
          {tiles.length > 0 && (
            <ul className="ayq-tiles">
              {tiles.map((t) => <li key={t.id}><PdpIcon name={t.icon} size={20} /><span><span className="ayq-tiles__label">{t.label}</span><span className="ayq-tiles__value">{t.main}</span>{t.note && <span className="ayq-tiles__note">{t.note}</span>}</span></li>)}
            </ul>
          )}
          {fitSlot}
        </div>
      )}

      {v4 ? glanceCards : previews.length > 0 && (
        <nav className="ayq-previews" aria-label="Jump to a section">
          {previews.map((p) => (
            <button key={p.id} type="button" className={`ayq-preview${p.tone ? ` is-${p.tone}` : ''}`} onClick={() => goTo(p.id)}>
              <span className="ayq-preview__top"><PdpIcon name={p.icon} size={18} /><span>{p.label}</span></span>
              <span className="ayq-preview__main">{p.num && <b className="ayq-preview__num">{p.num}</b>}<span className="ayq-preview__cap">{p.caption}</span><span className="ayq-preview__short" aria-hidden="true">{p.short}</span></span>
              <span className="ayq-preview__go" aria-hidden="true"><PdpIcon name="arrow" size={18} /></span>
            </button>
          ))}
        </nav>
      )}

      {shortList.length > 0 && (hasWhat || hasWho) && (
        <section className="ayq-what ayq-about" aria-labelledby="ayq-what-h">
          <h2 id="ayq-what-h" className="ayq-h3">{aboutTitle}</h2>
          {hasWhat && <div className="ayq-prose"><Paras list={m.summary} /></div>}
          {whoBlock}
        </section>
      )}
    </section>
  );

  // Website: Overview is the first tab, inside the Explore box under the photo (main's structure).
  if (v4) {
    const allTabs = [{ id: 'overview', label: 'Overview', icon: 'format', body: overview }, ...tabs];
    const activeV4 = allTabs.some((t) => t.id === tab) ? tab : 'overview';
    return (
      <TermsCtx.Provider value={plan}>
        <div id="ay-tabs" className="ayq ayq--v4">
          <section id="ay-pt" className="ayq-tabsec ay-itabs" aria-label="Overview, expert view, research, reviews, safety, how to use and details">
            <SegTabs explore tabs={allTabs} active={activeV4} onChange={(id) => chooseTab(id)} />
          </section>
          {afterOverview}
          {reviewRows.length > 0 && <ProductPeopleSay productId={baseProduct?.id} reviews={reviewRows} onSeeAll={() => goTo('reviews')} onWriteReview={onWriteReview} onOpenPost={onOpenReview} hasOnline={Boolean(rv.text.length || rv.brandRating || rv.online.length || rv.elsewhere.length)} />}
        </div>
      </TermsCtx.Provider>
    );
  }

  return (
    <TermsCtx.Provider value={plan}>
      <div id="ay-tabs" className="ayq">
        {overview}

        {afterOverview}

        {tabs.length > 0 && (
          <section id="ay-pt" className="ayq-tabsec" aria-label="Expert view, research, reviews, safety, how to use and details">
            <SegTabs tabs={tabs} active={activeTab} onChange={(id) => { chooseTab(id); if (isPhone) scrollToTabs(); }} />
          </section>
        )}

        {/* Member reviews where she scrolls: only when there are some (the empty version repeated 'Tried it?'). */}
        {reviewRows.length > 0 && <ProductPeopleSay productId={baseProduct?.id} reviews={reviewRows} onSeeAll={() => goTo('reviews')} onWriteReview={onWriteReview} onOpenPost={onOpenReview} hasOnline={Boolean(rv.text.length || rv.brandRating || rv.online.length || rv.elsewhere.length)} />}
      </div>
    </TermsCtx.Provider>
  );
}

/** Kept for callers that still pass a safety block: the page now builds Safety itself. */
export function ProductSafety() { return null; }
