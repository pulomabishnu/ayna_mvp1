import React, { useEffect, useRef, useState } from 'react';
import { shownMatchPercent, matchText, PARTIAL_FIT } from '../../utils/matchDisplay.js';
import HealthBackedBadge from '../health/HealthBackedBadge.jsx';
import { GlossaryText } from '../GlossaryTerm';
import { LONG_TEXT, NOT_ON_FILE } from '../pdp/glance';
import { jumpTo } from '../pdp/jump';
import { useEdgeFade } from '../pdp/useEdgeFade';

/** Tabs open their dropdown, then scroll to it. */
const openSection = (id) => { try { window.dispatchEvent(new CustomEvent('ay-open-section', { detail: id })); } catch { /* ignore */ } };
const jumpOpen = (id, domId) => { openSection(id); setTimeout(() => jumpTo(domId), 30); };
import './ProductSections.css';
import SafetyHoldNote from '../match/SafetyHoldNote.jsx';

/**
 * "ayna at a glance": the product page's consolidated information, open by
 * default (website + app). The founder's point: women get the whole picture
 * in one place instead of flipping through tabs, so nothing here hides
 * behind a tap. Long text and long lists get an inline "More".
 *
 * Built from buildGlance() (src/components/pdp/glance.js). Sources are
 * numbered once; [n] in the text jumps to that source in the list below.
 *
 * Props
 *   glance       buildGlance() result
 *   extras       { [sectionId]: ReactNode } appended inside a section
 *   extraNav     [{ id, label }] more jump chips (e.g. Ask ayna)
 *   onXref       (productName) => void for "(see X for Y)" links
 */
const KIND_LABEL = {
  evidence: 'Evidence',
  safety: 'What we know',
  facts: 'What we know',
  people: 'People',
  brand: 'Brand claims',
  unknown: 'Gaps',
  match: 'For you',
};

function Fn({ n, sources, hidden = false }) {
  const s = sources.find((x) => x.n === n);
  return (
    <a
      className="ay-fn"
      href={`#ay-src-${n}`}
      aria-label={`Source ${n}${s ? `: ${s.title}` : ''}`}
      title={s ? `${s.label}: ${s.title}` : undefined}
      tabIndex={hidden ? -1 : undefined}
      onClick={(e) => { e.preventDefault(); jumpOpen('sources', `ay-src-${n}`); }}
    >
      {n}
    </a>
  );
}

function Refs({ refs, sources, hidden = false }) {
  if (!refs?.length) return null;
  // Footnotes inside folded text stay out of the tab order until it is shown.
  return <sup className="ay-fns">{refs.map((n) => <Fn key={n} n={n} sources={sources} hidden={hidden} />)}</sup>;
}

function Label({ children }) {
  return children ? <span className="ay-gl-label">{children}</span> : null;
}

/** Paragraph with glossary terms; very long text folds to a few lines with an inline More. */
function Para({ text, terms, refs, sources, pre = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const long = String(text || '').length > LONG_TEXT;
  return (
    <>
      <p className={`${pre ? 'is-pre ' : ''}${long && !open ? 'is-folded ' : ''}${className}`.trim() || undefined}>
        <GlossaryText text={text} terms={terms} />
        <Refs refs={refs} sources={sources} hidden={long && !open} />
      </p>
      {long && (
        <button type="button" className="ay-gl-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </>
  );
}

function List({ items, k, plan, ordered = false, max = 5, refs, sources }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, max);
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <>
      <Tag className={ordered ? 'ay-gl-steps' : 'ay-gl-list'}>
        {shown.map((t, j) => (
          <li key={`${j}-${t}`}>
            <span><GlossaryText text={t} terms={plan[`${k}:${j}`] || []} />{ordered && j === shown.length - 1 && <Refs refs={refs} sources={sources} />}</span>
          </li>
        ))}
      </Tag>
      {items.length > max && (
        <button type="button" className="ay-gl-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show less' : `Show ${items.length - max} more`}
        </button>
      )}
    </>
  );
}

function Rows({ rows }) {
  return (
    <dl className="ay-gl-rows">
      {rows.map((r) => (
        <div key={r.label} className={r.unknown ? 'is-unknown' : undefined}>
          <dt>{r.label}</dt>
          <dd>{r.unknown ? NOT_ON_FILE : <FoldText text={r.value} />}</dd>
        </div>
      ))}
    </dl>
  );
}

function FoldText({ text }) {
  const [open, setOpen] = useState(false);
  const long = String(text || '').length > 200;
  if (!long) return text;
  return (
    <>
      <span className={open ? undefined : 'is-folded'}>{text}</span>
      <button type="button" className="ay-gl-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? 'Less' : 'More'}</button>
    </>
  );
}

function Cites({ items }) {
  return (
    <ul className="ay-gl-cites">
      {items.map((s) => (
        <li key={s.url}>
          <span className="ay-gl-cites__n">{s.n}</span>
          <div>
            <span className={`ay-gl-type is-${s.type}`}>{s.label}</span>
            <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
            {s.summary && <small>{s.summary}</small>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Block({ block, k, plan, sources, onXref }) {
  const terms = plan[k] || [];
  switch (block.type) {
    case 'tags':
      return (
        <ul className="ay-gl-tags">
          {block.items.map((t) => <li key={t.text} className={`is-${t.tone}`}>{t.text}</li>)}
        </ul>
      );
    case 'text':
      return (
        <div className="ay-gl-block">
          <Label>{block.label}</Label>
          <Para text={block.text} terms={terms} refs={block.refs} sources={sources} pre={block.pre} />
          {block.note && <p className="ay-gl-note">{block.note}</p>}
        </div>
      );
    case 'note':
      return <p className="ay-gl-note"><GlossaryText text={block.text} terms={terms} /></p>;
    case 'empty':
      return <p className="ay-gl-empty">{block.text}</p>;
    case 'alert':
      return (
        <div className="ay-gl-alert" role="note">
          <strong>Safety note on file</strong>
          <Para text={block.text} terms={terms} />
        </div>
      );
    case 'rows':
      return <Rows rows={block.rows} />;
    case 'list':
      return (
        <div className="ay-gl-block">
          <Label>{block.label}</Label>
          <List items={block.items} k={k} plan={plan} />
        </div>
      );
    case 'steps':
      return <List items={block.items} k={k} plan={plan} ordered max={8} refs={block.refs} sources={sources} />;
    case 'chips':
      return (
        <div className="ay-gl-block">
          <Label>{block.label}</Label>
          <ul className="ay-gl-chips">{block.items.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      );
    case 'science':
      return (
        <div className="ay-gl-science">
          {block.items.map((r, j) => (
            <div key={r.title}>
              <strong>{r.title}</strong>
              {r.text && <Para text={r.text} terms={plan[`${k}:${j}`] || []} />}
            </div>
          ))}
        </div>
      );
    case 'cites':
      return <Cites items={block.items} />;
    case 'rating':
      return (
        <p className="ay-gl-rating">
          <span aria-hidden="true">★</span> <strong>{block.value.toFixed(1)}</strong> from {block.count} ayna member rating{block.count === 1 ? '' : 's'}
        </p>
      );
    case 'reviews':
      return (
        <div className="ay-gl-block">
          <Label>From ayna members</Label>
          {block.items.map((t) => <blockquote key={t} className="ay-gl-quote">{t}</blockquote>)}
        </div>
      );
    case 'xref':
      return (
        <p className="ay-gl-note">
          See {onXref ? <button type="button" className="ay-gl-xref" onClick={() => onXref(block.name)}>{block.name}</button> : block.name} for the {block.what}.
        </p>
      );
    default:
      return null;
  }
}


/** First sentence of a section, taken from its own content (never written by us). */
function sectionDigest(section) {
  for (const b of section.blocks || []) {
    let t = '';
    if (['text', 'note', 'alert', 'empty'].includes(b.type)) t = b.text;
    else if (['list', 'steps'].includes(b.type)) t = b.items?.[0];
    else if (b.type === 'science') t = b.items?.[0] ? [b.items[0].title, b.items[0].text].filter(Boolean).join(': ') : '';
    else if (b.type === 'reviews') t = b.items?.[0];
    else if (b.type === 'tags' || b.type === 'chips') t = (b.items || []).map((x) => x.text || x).join(' · ');
    else if (b.type === 'rating') t = `${b.value.toFixed(1)} from ${b.count} ayna member rating${b.count === 1 ? '' : 's'}`;
    t = String(t || '').trim();
    if (!t) continue;
    const m = t.match(/^(.{20,180}?[.!?])(\s|$)/);
    const one = m ? m[1] : t;
    return one.length > 180 ? `${one.slice(0, 177).trimEnd()}…` : one;
  }
  return '';
}

const TONE = { evidence: 'peri', people: 'butter', brand: 'cream', unknown: 'cream', match: 'pink', safety: 'mint' };

function Section({ section, plan, sources, extra, onXref, bare = false }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const on = (e) => { if (e.detail === section.id) setOpen(true); };
    window.addEventListener('ay-open-section', on);
    return () => window.removeEventListener('ay-open-section', on);
  }, [section.id]);
  if (bare) {
    return (
      <div className={`ay-gl-sec is-${section.kind} is-bare`} id={`ay-sec-${section.id}`} tabIndex={-1}>
        <div className="ay-gl-sec__body">
          {section.blocks.map((b, i) => <Block key={`${section.id}-${i}`} block={b} k={`${section.id}:${i}`} plan={plan} sources={sources} onXref={onXref} />)}
          {extra}
        </div>
      </div>
    );
  }
  return (
    <section className={`ay-gl-sec is-${section.kind}${open ? ' is-open' : ''}`} id={`ay-sec-${section.id}`} tabIndex={-1} aria-labelledby={`ay-sec-h-${section.id}`}>
      <button type="button" className="ay-gl-sec__head ay-gl-sec__toggle" aria-expanded={open} aria-controls={`ay-sec-body-${section.id}`} onClick={() => setOpen((v) => !v)}>
        <span className="ay-gl-kind">{KIND_LABEL[section.kind] || ''}</span>
        <h3 id={`ay-sec-h-${section.id}`}>{section.title}</h3>
        <span className="ay-gl-sec__chev" aria-hidden="true" />
      </button>
      <div className="ay-gl-sec__body" id={`ay-sec-body-${section.id}`} hidden={!open}>
        {section.blocks.map((b, i) => <Block key={`${section.id}-${i}`} block={b} k={`${section.id}:${i}`} plan={plan} sources={sources} onXref={onXref} />)}
        {extra}
      </div>
    </section>
  );
}

/* Tabs are grouped so there are only a few, in plain words:
   summary (plus why it matched), research and safety, reviews, sources. */
// Five tabs (Oct 19): what it is and how to use it, why it fits her, what
// the research and safety say, what people say, and where it all comes from.
const TAB_GROUPS = [
  { id: 'match', label: 'Your match', ids: ['match'], tone: 'pink' },
  { id: 'evidence', label: 'Evidence & safety', ids: ['clinician', 'evidence', 'unknown', 'safety'], tone: 'peri' },
  { id: 'reviews', label: 'Reviews', ids: ['people', 'brand'], tone: 'pink' },
];
// Ingredients and how to use sit under Overview.
const OVERVIEW_IDS = ['inside', 'howto'];
const SUB_LABEL = { evidence: 'The evidence', safety: 'Safety', inside: 'Ingredients', howto: 'How to use', unknown: 'Still unknown', people: 'What people say', brand: 'What the brand claims', clinician: 'Clinical view', match: 'Why it matches you' };
// Small brown line icons (emoji looked different on every phone and clashed with the brand marks).
const ICON_PATHS = {
  evidence: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3',
  safety: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z',
  inside: 'M5 8h14l-1.5 12h-11L5 8ZM9 8V5h6v3',
  howto: 'M4 12h10M10 6l6 6-6 6M18 5v14',
  unknown: 'M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7V15M12 18v.5',
  people: 'M4 5h16v11H9l-5 4V5Z',
  brand: 'M3 12 12 3h8v8l-9 9-8-8ZM16 8h.01',
  clinician: 'M6 3v6a6 6 0 0 0 12 0V3M12 15v3a3 3 0 0 0 6 0v-1M18 15a1.5 1.5 0 1 0 0 3',
  match: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
};
const SUB_ICON = Object.fromEntries(Object.entries(ICON_PATHS).map(([k, d]) => [k, <svg key={k} className="ay-line-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>]));
const groupOf = (id) => (OVERVIEW_IDS.includes(id) ? 'glance' : (TAB_GROUPS.find((g) => g.ids.includes(id)) || {}).id || id);

/* Inside a tab that holds two parts, the part's heading already says it. */
function dropRepeatLabel(sec) {
  const head = String(SUB_LABEL[sec.id] || sec.title || '').toLowerCase();
  const blocks = (sec.blocks || []).map((b, i) => (i === 0 && b?.label && String(b.label).toLowerCase() === head ? { ...b, label: undefined } : b));
  return { ...sec, blocks };
}

/* The clinician's own view (when we have one) gets its own tab instead of
   sitting inside the evidence list. Nothing is added that isn't in the data. */
function splitSections(sections = []) {
  const out = [];
  sections.forEach((sec) => {
    if (sec.id !== 'evidence') { out.push(sec); return; }
    const clin = (sec.blocks || []).filter((b) => b && b.label === 'Clinical view');
    const rest = (sec.blocks || []).filter((b) => !(b && b.label === 'Clinical view'));
    if (clin.length) out.push({ id: 'clinician', title: 'Clinical view', kind: 'evidence', blocks: clin.map((b) => ({ ...b, label: undefined })) });
    if (rest.length) out.push({ ...sec, blocks: rest });
  });
  return out;
}

// "Brand cites X, brand-hosted figures, not independently verified here." reads as
// a hedge stuck on a hedge; the label under the block already says it once.
function brandLine(text) {
  return String(text || '')
    .replace(/^Brand (cites|says|states|claims)\s+/i, 'The brand reports ')
    .replace(/,?\s*(brand-hosted figures,?\s*)?(and\s+)?not (independently )?verified( here| by ayna)?\.?\s*$/i, '.')
    .replace(/\.\.$/, '.');
}

/**
 * worksWith  { items: string[], ayna: { name } | null, onOpenAyna } from
 *            worksWith() in src/utils/aynaIntegrations.js; replaces the
 *            "Available on" fact (the platforms are its first items).
 */
export default function ProductSections({ glance, extras = {}, extraNav = [], onXref = null, worksWith = null }) {
  const plan = glance?.glossary || {};
  const [tab, setTab] = useState('glance');
  const [sub, setSub] = useState({});
  const tabsRef = useRef(null);
  useEdgeFade(tabsRef, [glance]);
  // A link anywhere on the page (a fact, a [n] footnote) opens the tab that holds it.
  useEffect(() => {
    const on = (e) => {
      const id = e.detail;
      if (id === 'sources' || id === 'clinician' || (glance?.sections || []).some((x) => x.id === id)) setTab(groupOf(id));
    };
    window.addEventListener('ay-open-section', on);
    return () => window.removeEventListener('ay-open-section', on);
  }, [glance]);
  if (!glance) return null;
  const { what, who, sources } = glance;
  const secs = splitSections(glance.sections);
  const nav = [...glance.nav, ...extraNav];
  // "Works with" takes the place of "Available on" (it starts with the same platforms).
  const worksRow = worksWith?.items?.length ? { id: 'works', label: 'Works with', works: true } : null;
  const facts = worksRow
    ? (glance.facts.some((f) => f.id === 'platform')
      ? glance.facts.map((f) => (f.id === 'platform' ? worksRow : f))
      : glance.facts.flatMap((f, i) => (i === 0 ? [f, worksRow] : [f])))
    : glance.facts;
  const worksValue = worksRow && worksWith.items.map((t, i) => (
    <React.Fragment key={t}>
      {i > 0 && ', '}
      {t === 'ayna' && worksWith.ayna && worksWith.onOpenAyna
        ? <button type="button" className="ay-gl-inlinelink" onClick={worksWith.onOpenAyna} aria-label={`ayna: connect ${worksWith.ayna.name} in Health data`}>ayna</button>
        : t}
    </React.Fragment>
  ));

  const tabs = [
    { id: 'glance', label: 'Overview', tone: 'butter' },
    ...TAB_GROUPS.filter((g) => secs.some((sec) => g.ids.includes(sec.id))).map((g) => ({ id: g.id, label: g.label, tone: g.tone })),
    ...(sources.length ? [{ id: 'sources', label: `Sources (${sources.length})`, tone: 'cream' }] : []),
  ];
  void nav; void extraNav;
  // App (Oct 19): real tabs, one part at a time, so the page reads in small
  // pieces instead of one long scroll. Everything is still one tap away, and
  // links on the page open the tab they point to.
  void sub; void setSub;
  const choose = (id) => {
    setTab(id);
    // If she has scrolled down into a long part, bring the new tab's start into view.
    const nav = document.getElementById('ay-sec-glance');
    if (nav && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: 'start' });
  };
  const active = tabs.some((t) => t.id === tab) ? tab : 'glance';
  const groupBody = (group) => {
    const list = secs.filter((sec) => group.ids.includes(sec.id));
    return list.map((sec) => (
      <article key={sec.id} className={`ay-gl-card is-${sec.id}${list.length === 1 ? ' is-single' : ''}`}>
        {(list.length > 1 || group.forceHeads) && <h3 className="ay-gl-cardh"><span aria-hidden="true">{SUB_ICON[sec.id]}</span>{SUB_LABEL[sec.id] || sec.title}</h3>}
        <Section bare section={list.length > 1 || group.forceHeads ? dropRepeatLabel(sec) : sec} plan={plan} sources={sources} extra={extras[sec.id]} onXref={onXref} />
      </article>
    ));
  };

  return (
    <section className="ay-glance is-stacked" id="ay-sec-glance" tabIndex={-1} aria-label="Product information">
      <nav className="ay-glance__nav" aria-label="Product information">
        <ul role="tablist" ref={tabsRef}>
          {tabs.map((t) => (
            <li key={t.id} role="presentation">
              <button type="button" role="tab" id={`ay-tab-${t.id}`} aria-selected={active === t.id} aria-controls={`ay-panel-${t.id}`} className={active === t.id ? 'is-active' : undefined} onClick={() => choose(t.id)}>{t.label}</button>
            </li>
          ))}
        </ul>
      </nav>
      {tabs.filter((t) => t.id === active).map((t) => {
        const group = TAB_GROUPS.find((g) => g.id === t.id);
        const heading = t.id === 'glance' ? 'Overview' : t.id === 'sources' ? 'Where this comes from' : t.label;
        return (
          <div key={t.id} className="ay-glance__panel is-tab" id={`ay-panel-${t.id}`} role="tabpanel" aria-labelledby={`ay-tab-${t.id}`} data-tone={t.tone}>
            {/* The source count lives on the Sources tab itself, so the heading is for screen readers only. */}
            <h2 className="ay-glance__srh sr-only">{heading}</h2>
            {t.id === 'glance' && (
      <div className="ay-glance__top">
        <div className="ay-glance__what">
          {what.text && (
            <div className="ay-gl-block">
              <Label>What it is</Label>
              <Para className="is-lead" text={what.text} terms={plan.what || []} />
              {what.xref && <Block block={{ type: 'xref', ...what.xref }} k="what:x" plan={plan} sources={sources} onXref={onXref} />}
              {what.detail && <Para text={what.detail} terms={plan['what:detail'] || []} />}
            </div>
          )}
          {(who.items.length > 0 || who.helps.length > 0) && (
            <div className="ay-gl-block">
              <Label>Who it’s for</Label>
              {who.items.length > 0
                ? <List items={who.items} k="who" plan={plan} max={4} />
                : <ul className="ay-gl-chips is-fit">{who.helps.map((t) => <li key={t}>{t}</li>)}</ul>}
              {who.items.length > 0 && who.helps.length > 0 && <ul className="ay-gl-chips is-fit">{who.helps.map((t) => <li key={t}>{t}</li>)}</ul>}
            </div>
          )}
        </div>
        <div className="ay-glance__factcard">
        <dl className="ay-glance__facts" aria-label="Key facts">
          {[...facts].sort((a, b) => Number(!!a.unknown) - Number(!!b.unknown)).map((f) => (
            <div key={f.id} className={f.unknown ? 'is-unknown' : undefined}>
              <dt>{f.label}</dt>
              <dd>
                {f.works ? worksValue : f.jump && !f.unknown
                  ? <a href={`#ay-sec-${f.jump}`} onClick={(e) => { e.preventDefault(); jumpOpen(f.jump, `ay-sec-${f.jump}`); }}>{f.value}</a>
                  : f.value}
                <Refs refs={f.refs} sources={sources} />
              </dd>
              {f.note && <small>{f.note}</small>}
            </div>
          ))}
        </dl>
        {!glance.verified && (
          <p className="ay-glance__caveat">
            {glance.researched
              ? 'Dated details were checked against the sources listed.'
              : 'From ayna’s catalog. We have not checked these details against the label yet.'}
          </p>
        )}
        </div>
      </div>
            )}
            {group && groupBody(group)}
            {t.id === 'glance' && secs.some((sec) => OVERVIEW_IDS.includes(sec.id)) && <div className="ay-glance__more">{groupBody({ ids: OVERVIEW_IDS, forceHeads: true })}</div>}
            {t.id === 'sources' && (
          <ol className="ay-gl-srclist">
            {sources.map((src) => (
              <li key={src.url} id={`ay-src-${src.n}`} tabIndex={-1}>
                <span className="ay-gl-cites__n">{src.n}</span>
                <div>
                  <span className={`ay-gl-type is-${src.type} is-tier-${src.tier || 'mid'}`}>{src.label}</span>
                  <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a>
                  <small>{[src.publisher, src.year].filter(Boolean).join(' · ')}</small>
                  {src.summary && <small>{src.summary}</small>}
                </div>
              </li>
            ))}
          </ol>
            )}
          </div>
        );
      })}
    </section>
  );
}

/* ===================================================================
   Product page as a story (Oct 2026): what is it, why it's right for me,
   ask ayna, can I trust it, good to know; then the deep details folded
   away. Every line comes from the product's own data; nothing is invented.
   =================================================================== */
const ASK_QUESTIONS = [
  'Is this right for me?',
  'Why did you recommend this?',
  'What do the reviews say?',
  'Any ingredients I should know about?',
  'Compare this to another product',
  'Is it worth the price?',
];

function firstSentence(text, max = 220) {
  const t = String(text || '').trim();
  const m = t.match(/^(.{20,}?[.!?])(\s|$)/);
  const one = m ? m[1] : t;
  return one.length > max ? `${one.slice(0, max - 1).trimEnd()}…` : one;
}

/* The landing's "MATCHED TO YOU" seal, set around the score. */
function MatchSeal({ children }) {
  return (
    <span className="ay-seal" aria-hidden="true">
      <svg viewBox="0 0 120 120" className="ay-seal__ring">
        <defs><path id="ay-seal-path" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" /></defs>
        <text><textPath href="#ay-seal-path" startOffset="0">MATCHED TO YOU ★ MATCHED TO YOU ★ </textPath></text>
      </svg>
      <span className="ay-seal__core">{children}</span>
    </span>
  );
}

export function ProductMatch({ glance, matchPercent, why = '', fallback = '', onShowWhy, onFindFit = null, hasProfile = false, exclusions = [], health = null, hold = null, onFixHold = null }) {
  if (!glance) return null;
  // Held back for safety: no number, the reason and what resolves it (founder, Oct 24).
  if (hold && hasProfile) {
    return (
      <section className="ay-story ay-story--match is-none" aria-label="Your match">
        <SafetyHoldNote hold={hold} onFix={onFixHold} />
      </section>
    );
  }
  // Signed in with a profile but no score (a partner bundle, an excluded item):
  // the block still shows, worded honestly, instead of disappearing.
  if (!(matchPercent > 0) && hasProfile) {
    return (
      <section className="ay-story ay-story--match is-none" aria-labelledby="ay-match-h">
        <button type="button" className="ay-match__score" onClick={onShowWhy} aria-label="No match score. See why">
          <span className="ay-match__big is-none">No match</span>
        </button>
        <div className="ay-match__body">
          <h2 id="ay-match-h">How it compares to your needs</h2>
          <ul className="ay-match__reasons">{(exclusions.length ? exclusions.slice(0, 3) : ['Not one of the needs you told us about.']).map((r) => <li key={r} className="is-miss"><span className="sr-only">Counts against: </span>{r}</li>)}</ul>
          <div className="ay-match__links"><button type="button" onClick={onShowWhy}>See the breakdown</button><a href="/how-it-works">How we match</a></div>
        </div>
      </section>
    );
  }
  if (!(matchPercent > 0)) {
    // Logged out (or no profile yet): the best moment to say what ayna does.
    if (!onFindFit) return null;
    return (
      <p className="ay-fitline">
        <span>How well does this fit you?</span>
        <button type="button" onClick={onFindFit}>See my matches <span aria-hidden="true">→</span></button>
      </p>
    );
  }
  const sec = splitSections(glance.sections).find((s) => s.id === 'match');
  const list = sec?.blocks?.find((b) => b.type === 'list');
  const reasons = (list?.items || []).map((r) => String(typeof r === 'string' ? r : r?.text || '')).filter(Boolean).slice(0, 4);
  const lines = reasons.length ? reasons : (fallback ? [fallback] : []);
  // The heading follows the score: a 7% match is never "Why it fits you".
  const band = matchPercent >= 70 ? 'strong' : matchPercent >= 50 ? 'some' : 'weak';
  const heading = band === 'strong' ? <>Why it fits you</> : band === 'some' ? <>How it fits you</> : <>How it compares to your needs</>;
  // A reason that counts against the product gets a –, never a ✓.
  const isMiss = (t) => /\b(above|over|outside|not|no|doesn.t|does not|isn.t|missing|lower|less|unknown|can.t|cannot|without)\b/i.test(t);
  return (
    <section className={`ay-story ay-story--match is-${band}`} aria-labelledby="ay-match-h">
      <button type="button" className="ay-match__score" onClick={onShowWhy} aria-label={`${matchText(matchPercent)}. See why`}>
        {shownMatchPercent(matchPercent) != null
          ? <span className="ay-match__big"><b>{shownMatchPercent(matchPercent)}%</b> match</span>
          : <span className="ay-match__big is-partial">{PARTIAL_FIT}</span>}
      </button>
      <div className="ay-match__body">
        <h2 id="ay-match-h">{heading}</h2>
        {/* The % explained in one plain line from the engine's reasons. */}
        {why && <p className="ay-match__lede">{why}</p>}
        {health && <HealthBackedBadge backed={health} />}
        {lines.length > 0 && <ul className="ay-match__reasons">{lines.map((r) => <li key={r} className={isMiss(r) ? 'is-miss' : 'is-hit'}><span className="sr-only">{isMiss(r) ? 'Counts against: ' : 'Fits: '}</span>{r}</li>)}</ul>}
        <div className="ay-match__links">
          <button type="button" onClick={onShowWhy}>See the breakdown</button>
          <a href="/how-it-works">How we match</a>
        </div>
      </div>
    </section>
  );
}

// Questions the page can't answer on its own: they're about her (product page audit).
const ASK_SITUATION = ['Is this right for me?', 'Is it safe with what I already use?', 'How does it compare with what I have now?'];
export function ProductAsk({ productName, onAsk }) {
  // While this strip is on screen the floating "Ask ayna" button steps aside (it covered the compare table).
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => document.body.classList.toggle('ay-ask-inline-on', e.isIntersecting));
    io.observe(el);
    return () => { io.disconnect(); document.body.classList.remove('ay-ask-inline-on'); };
  }, []);
  if (!onAsk) return null;
  return (
    <section ref={ref} className="ay-askrow" aria-labelledby="ay-ask-h">
      <h2 id="ay-ask-h">Ask about your situation</h2>
      <ul>
        {ASK_SITUATION.map((q) => <li key={q}><button type="button" onClick={() => onAsk(`About ${productName}: ${q}`)}>{q}</button></li>)}
        <li><button type="button" onClick={() => onAsk(`About ${productName}: `)}>Ask your own question</button></li>
      </ul>
    </section>
  );
}

export function ProductTrust({ glance, aynaRating = null, ratingCount = 0, extras = {}, evidenceStrength = '', onXref = null }) {
  if (!glance) return null;
  const plan = glance.glossary || {};
  const secs = splitSections(glance.sections);
  const people = secs.find((s) => s.id === 'people');
  const clinician = secs.find((s) => s.id === 'clinician');
  const evidence = secs.find((s) => s.id === 'evidence');
  const evText = evidence ? ((evidence.blocks || []).find((b) => b.type === 'text' && /^Backed by:/.test(String(b.text || '')))?.text || sectionDigest(evidence)) : '';
  const evCount = glance.sources.filter((s) => ['product_study', 'clinical_guideline', 'regulatory', 'ingredient_research', 'expert_guidance'].includes(s.type)).length;
  // Brand-hosted ratings are not "what people say": file them under the brand.
  const isBrandClaim = (b) => /\bbrand(-hosted)?\b[^.]{0,40}\b(cites|reports|claims|hosted|says)\b|brand-hosted/i.test(String(b?.text || ''));
  const brandBlocks = people ? people.blocks.filter(isBrandClaim) : [];
  // What people say is not evidence: no footnote numbers here (the posts are listed last under Research & sources).
  const peopleOnly = people ? { ...people, blocks: people.blocks.filter((b) => !isBrandClaim(b)).map((b) => ({ ...b, refs: [] })) } : null;
  const peopleEmpty = !peopleOnly || peopleOnly.blocks.length === 0 || peopleOnly.blocks.every((b) => b.type === 'empty');
  const totalSources = glance.sources.length;
  return (
    <section className="ay-story ay-story--trust" aria-labelledby="ay-trust-h">
      <h2 id="ay-trust-h">Can you trust it?</h2>
      <div className="ay-trust">
        <article className="ay-trust__card is-reviews">
          <header><h3>Reviews</h3>{aynaRating != null && ratingCount > 0 && <span className="ay-trust__rating"><b>★ {aynaRating.toFixed(1)}</b> · {ratingCount} ayna member review{ratingCount === 1 ? '' : 's'}</span>}</header>
          {peopleEmpty
            ? <p className="ay-trust__muted">No ayna member reviews yet. Be the first.</p>
            : <Section bare section={peopleOnly} plan={plan} sources={glance.sources} onXref={onXref} />}
          {brandBlocks.length > 0 && <div className="ay-trust__brand"><h4>What the brand says</h4>{brandBlocks.map((b) => <p key={b.key || b.text}>{brandLine(b.text)}</p>)}<small>The brand's own figures. Not verified by ayna.</small></div>}
          {extras.people}
        </article>
        {clinician && (
          <article className="ay-trust__card is-clinical">
            <header><h3>What clinicians say</h3></header>
            {(() => {
              const lead = firstSentence(sectionDigest(clinician) || '');
              const full = (clinician.blocks || []).map((b) => b.text || '').join(' ').trim();
              // "Read more" only when there is more than the sentence already shown.
              return full.length > lead.length + 40
                ? <details className="ay-trust__more"><summary>{lead}</summary><Section bare section={clinician} plan={plan} sources={glance.sources} onXref={onXref} /></details>
                : <Section bare section={clinician} plan={plan} sources={glance.sources} onXref={onXref} />;
            })()}
          </article>
        )}
        <article className="ay-trust__card is-evidence">
          <header><h3>Evidence</h3>{evidenceStrength ? <span className={`ay-trust__level is-${evidenceStrength.toLowerCase()}`}>{evidenceStrength}</span> : null}</header>
          <p>{evCount ? firstSentence(evText) || `${evCount} source${evCount === 1 ? '' : 's'} on file.` : 'We have no research or clinical sources linked for it yet.'}</p>
          {evCount > 0 && <button type="button" className="ay-trust__link" onClick={() => { const d = document.getElementById('ay-more-research'); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }}>{totalSources > evCount ? `${evCount} research source${evCount === 1 ? '' : 's'} · ${totalSources} sources in all` : `See the ${evCount} source${evCount === 1 ? '' : 's'}`}</button>}
        </article>
      </div>
    </section>
  );
}

export function ProductGoodToKnow({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="ay-story ay-story--know" aria-labelledby="ay-know-h">
      <h2 id="ay-know-h">Good to know</h2>
      <p className="ay-know__src">From the product’s listing and label.</p>
      <ul className="ay-know">{items.map((t) => <li key={t}>{t}</li>)}</ul>
    </section>
  );
}

const MORE_FOR = { safety: 'safety', inside: 'ingredients', evidence: 'research', unknown: 'research', sources: 'research', howto: 'details', brand: 'details', glance: 'details' };
export function ProductMore({ glance, extras = {}, onXref = null }) {
  useEffect(() => {
    const on = (e) => {
      const key = MORE_FOR[e.detail];
      const d = key && document.getElementById(`ay-more-${key}`);
      if (d) { d.open = true; window.setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); }
    };
    window.addEventListener('ay-open-section', on);
    return () => window.removeEventListener('ay-open-section', on);
  }, []);
  if (!glance) return null;
  const plan = glance.glossary || {};
  const secs = splitSections(glance.sections);
  const get = (id) => secs.find((s) => s.id === id);
  const { what, who, facts, sources } = glance;
  const fold = (id, title, children, open = false) => (
    <details className="ay-more" id={`ay-more-${id}`} open={open}>
      <summary><span>{title}</span><span className="ay-more__chev" aria-hidden="true">+</span></summary>
      <div className="ay-more__body">{children}</div>
    </details>
  );
  const S = (sec) => sec && <Section bare section={sec} plan={plan} sources={sources} extra={extras[sec.id]} onXref={onXref} />;
  return (
    <section className="ay-story ay-story--more" aria-label="More about this product">
      {fold('details', 'Product details', <>
        {what.text && <><Label>What it is</Label><Para className="is-lead" text={what.text} terms={plan.what || []} />{what.detail && <Para text={what.detail} terms={plan['what:detail'] || []} />}</>}
        {(who.items.length > 0 || who.helps.length > 0) && <><Label>Who it’s for</Label>{who.items.length > 0 ? <List items={who.items} k="who" plan={plan} max={4} /> : <ul className="ay-gl-chips is-fit">{who.helps.map((t) => <li key={t}>{t}</li>)}</ul>}</>}
        {get('howto') && <><Label>How to use</Label>{S(get('howto'))}</>}
        {facts.filter((f) => !f.unknown).length > 0 && <><Label>Size and specs</Label><dl className="ay-glance__facts">{facts.filter((f) => !f.unknown).map((f) => <div key={f.id}><dt>{f.label}</dt><dd>{f.value}<Refs refs={f.refs} sources={sources} /></dd>{f.note && <small>{f.note}</small>}</div>)}</dl></>}
        {get('brand')?.blocks?.some((b) => b.type !== 'empty') && <><Label>From the manufacturer</Label>{S(get('brand'))}</>}
      </>)}
      {get('inside') && fold('ingredients', glance.insideTitle || 'Ingredients', S(get('inside')))}
      {get('safety') && fold('safety', 'Safety', S(get('safety')))}
      {fold('research', `Research & sources${sources.length ? ` (${sources.length})` : ''}`, <>
        {get('evidence') && S(get('evidence'))}
        {get('unknown') && <><Label>What we don’t know</Label>{S(get('unknown'))}</>}
        {sources.length > 0 && <ol className="ay-gl-srclist">{sources.map((src) => (
          <li key={src.url} id={`ay-src-${src.n}`} tabIndex={-1}>
            <span className="ay-gl-cites__n">{src.n}</span>
            <div><span className={`ay-gl-type is-${src.type} is-tier-${src.tier || 'mid'}`}>{src.label}</span><a href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a><small>{[src.publisher, src.year].filter(Boolean).join(' · ')}</small></div>
          </li>
        ))}</ol>}
      </>)}
    </section>
  );
}
