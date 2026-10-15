import React, { useEffect, useState } from 'react';
import { GlossaryText } from '../GlossaryTerm';
import { LONG_TEXT, NOT_ON_FILE } from '../pdp/glance';
import { jumpTo } from '../pdp/jump';

/** Tabs open their dropdown, then scroll to it. */
const openSection = (id) => { try { window.dispatchEvent(new CustomEvent('ay-open-section', { detail: id })); } catch { /* ignore */ } };
const jumpOpen = (id, domId) => { openSection(id); setTimeout(() => jumpTo(domId), 30); };
import './ProductSections.css';

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

function Fn({ n, sources }) {
  const s = sources.find((x) => x.n === n);
  return (
    <a
      className="ay-fn"
      href={`#ay-src-${n}`}
      aria-label={`Source ${n}${s ? `: ${s.title}` : ''}`}
      title={s ? `${s.label}: ${s.title}` : undefined}
      onClick={(e) => { e.preventDefault(); jumpTo(`ay-src-${n}`); }}
    >
      {n}
    </a>
  );
}

function Refs({ refs, sources }) {
  if (!refs?.length) return null;
  return <sup className="ay-fns">{refs.map((n) => <Fn key={n} n={n} sources={sources} />)}</sup>;
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
        <Refs refs={refs} sources={sources} />
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
const TAB_GROUPS = [
  { id: 'match', label: 'Your match', ids: ['match'], tone: 'pink' },
  { id: 'clinician', label: 'Clinical view', ids: ['clinician'], tone: 'peri' },
  { id: 'reviews', label: 'Reviews', ids: ['people', 'brand'], tone: 'pink' },
  { id: 'evidence', label: 'Evidence', ids: ['evidence', 'unknown'], tone: 'peri' },
  { id: 'safety', label: 'Safety', ids: ['safety'], tone: 'pink' },
  { id: 'details', label: 'Ingredients & use', ids: ['inside', 'howto'], tone: 'peri' },
];
const SUB_LABEL = { evidence: 'The evidence', safety: 'Safety', inside: 'Ingredients', howto: 'How to use', unknown: 'Still unknown', people: 'What people say', brand: 'What the brand claims', clinician: 'Clinical view', match: 'Why it matches you' };
const SUB_ICON = { evidence: '🔬', safety: '🛡', inside: '🧪', howto: '✋', unknown: '?', people: '💬', brand: '🏷', clinician: '🩺', match: '♡' };
const groupOf = (id) => (TAB_GROUPS.find((g) => g.ids.includes(id)) || {}).id || id;

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

export default function ProductSections({ glance, extras = {}, extraNav = [], onXref = null }) {
  const plan = glance?.glossary || {};
  const [tab, setTab] = useState('glance');
  const [sub, setSub] = useState({});
  useEffect(() => {
    const on = (e) => {
      const id = e.detail;
      if (id === 'sources' || id === 'clinician' || (glance?.sections || []).some((x) => x.id === id)) {
        const g = groupOf(id);
        setTab(g);
        if (g !== id && g !== 'glance') setSub((m) => ({ ...m, [g]: id }));
      }
    };
    window.addEventListener('ay-open-section', on);
    return () => window.removeEventListener('ay-open-section', on);
  }, [glance]);
  if (!glance) return null;
  const { what, who, facts, sources } = glance;
  const secs = splitSections(glance.sections);
  const nav = [...glance.nav, ...extraNav];

  const tabs = [
    { id: 'glance', label: 'Overview', tone: 'butter' },
    ...TAB_GROUPS.filter((g) => secs.some((sec) => g.ids.includes(sec.id))).map((g) => ({ id: g.id, label: g.label, tone: g.tone })),
    ...(sources.length ? [{ id: 'sources', label: `Sources (${sources.length})`, tone: 'cream' }] : []),
  ];
  void nav; void extraNav;
  const cur = tabs.find((t) => t.id === tab) || tabs[0];
  const curGroup = TAB_GROUPS.find((g) => g.id === cur.id);
  const groupSections = curGroup ? secs.filter((sec) => curGroup.ids.includes(sec.id)) : [];
  const title = cur.id === 'glance' ? 'Overview' : cur.id === 'sources' ? 'Where this comes from' : cur.label;

  return (
    <section className="ay-glance is-tabbed" id="ay-sec-glance" tabIndex={-1} aria-label="Product information">
      <div className="ay-glance__nav" role="tablist" aria-label="Product information">
        <ul>
          {tabs.map((t) => (
            <li key={t.id}>
              <button type="button" role="tab" id={`ay-tab-${t.id}`} aria-selected={t.id === cur.id} aria-controls="ay-tabpanel" className={t.id === cur.id ? 'is-on' : undefined} onClick={() => setTab(t.id)}>{t.label}</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="ay-glance__panel" id="ay-tabpanel" role="tabpanel" aria-labelledby={`ay-tab-${cur.id}`} data-tone={cur.tone}>
        <div className="ay-glance__panelhead">
          <h2>{title}</h2>
          {cur.id === 'glance' && sources.length > 0 && <span className="ay-glance__chip">{sources.length} source{sources.length === 1 ? '' : 's'}</span>}
        </div>
      {cur.id === 'glance' && (
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
          {!glance.verified && (
            <p className="ay-glance__caveat">
              {glance.researched
                ? 'Details marked with a date were checked against the listed sources. Full review is still in progress.'
                : 'From ayna’s catalog. We have not checked these details against the label yet.'}
            </p>
          )}
        </div>
        <dl className="ay-glance__facts" aria-label="Key facts">
          {[...facts].sort((a, b) => Number(!!a.unknown) - Number(!!b.unknown)).map((f) => (
            <div key={f.id} className={f.unknown ? 'is-unknown' : undefined}>
              <dt>{f.label}</dt>
              <dd>
                {f.jump && !f.unknown
                  ? <a href={`#ay-sec-${f.jump}`} onClick={(e) => { e.preventDefault(); jumpOpen(f.jump, `ay-sec-${f.jump}`); }}>{f.value}</a>
                  : f.value}
                <Refs refs={f.refs} sources={sources} />
              </dd>
              {f.note && <small>{f.note}</small>}
            </div>
          ))}
        </dl>
      </div>
        )}
        {curGroup && curGroup.id === 'reviews' && groupSections.length > 0 && (
          <div className={`ay-gl-split${groupSections.length === 1 ? ' is-one' : ''}`}>
            {groupSections.map((sec) => (
              <article key={sec.id} className={`ay-gl-card is-${sec.id}`}>
                <h3 className="ay-gl-cardh"><span aria-hidden="true">{SUB_ICON[sec.id]}</span>{SUB_LABEL[sec.id] || sec.title}</h3>
                <Section bare section={sec} plan={plan} sources={sources} extra={extras[sec.id]} onXref={onXref} />
              </article>
            ))}
          </div>
        )}
        {curGroup && curGroup.id !== 'reviews' && groupSections.length === 1 && (
          <article className={`ay-gl-card is-single is-${groupSections[0].id}`}>
            <Section bare section={groupSections[0]} plan={plan} sources={sources} extra={extras[groupSections[0].id]} onXref={onXref} />
          </article>
        )}
        {curGroup && curGroup.id !== 'reviews' && groupSections.length > 1 && (() => {
          const active = groupSections.find((sec) => sec.id === sub[curGroup.id]) || groupSections[0];
          return (
            <div className="ay-gl-subs">
              <ul className="ay-gl-subnav" aria-label={`${curGroup.label} topics`}>
                {groupSections.map((sec) => {
                  const d = sectionDigest(sec);
                  return (
                    <li key={sec.id}>
                      <button type="button" aria-pressed={sec.id === active.id} className={sec.id === active.id ? 'is-on' : undefined} onClick={() => setSub((m) => ({ ...m, [curGroup.id]: sec.id }))}>
                        <span className="ay-gl-subnav__i" aria-hidden="true">{SUB_ICON[sec.id]}</span>
                        <span className="ay-gl-subnav__t"><strong>{SUB_LABEL[sec.id] || sec.title}</strong>{d && <small>{d}</small>}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <article className={`ay-gl-card is-${active.id}`} key={active.id}>
                <h3 className="ay-gl-cardh"><span aria-hidden="true">{SUB_ICON[active.id]}</span>{active.title}</h3>
                <Section bare section={active} plan={plan} sources={sources} extra={extras[active.id]} onXref={onXref} />
                {groupSections.length > 1 && (() => {
                  const i = groupSections.indexOf(active);
                  const nx = groupSections[(i + 1) % groupSections.length];
                  return <button type="button" className="ay-gl-next" onClick={() => setSub((m) => ({ ...m, [curGroup.id]: nx.id }))}>Next: {SUB_LABEL[nx.id] || nx.title} <span aria-hidden="true">→</span></button>;
                })()}
              </article>
            </div>
          );
        })()}
        {cur.id === 'sources' && (
          <ol className="ay-gl-srclist">
            {sources.map((src) => (
              <li key={src.url} id={`ay-src-${src.n}`} tabIndex={-1}>
                <span className="ay-gl-cites__n">{src.n}</span>
                <div>
                  <span className={`ay-gl-type is-${src.type}`}>{src.label}</span>
                  <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a>
                  <small>{[src.publisher, src.year].filter(Boolean).join(' · ')}</small>
                  {src.summary && <small>{src.summary}</small>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
