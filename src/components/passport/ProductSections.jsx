import React, { useMemo, useState } from 'react';
import { GlossaryText } from '../GlossaryTerm';
import { LONG_TEXT, NOT_ON_FILE } from '../pdp/glance';
import { jumpTo } from '../pdp/jump';
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
          {open ? 'Less' : 'More'}
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

function Section({ section, plan, sources, extra, onXref }) {
  return (
    <section className={`ay-gl-sec is-${section.kind}`} id={`ay-sec-${section.id}`} tabIndex={-1} aria-labelledby={`ay-sec-h-${section.id}`}>
      <div className="ay-gl-sec__head">
        <span className="ay-gl-kind">{KIND_LABEL[section.kind] || ''}</span>
        <h3 id={`ay-sec-h-${section.id}`}>{section.title}</h3>
      </div>
      {section.blocks.map((b, i) => <Block key={`${section.id}-${i}`} block={b} k={`${section.id}:${i}`} plan={plan} sources={sources} onXref={onXref} />)}
      {extra}
    </section>
  );
}

/** Rough height so the two desktop columns come out even. */
function weight(section) {
  return section.blocks.reduce((n, b) => n + 80 + String(b.text || '').length * 0.5
    + (b.items ? b.items.reduce((m, t) => m + 40 + String(t.text || t.title || t.summary || t).length * 0.4, 0) : 0)
    + (b.rows ? b.rows.length * 48 : 0), 60);
}

export default function ProductSections({ glance, extras = {}, extraNav = [], onXref = null }) {
  const plan = glance?.glossary || {};
  const [left, right] = useMemo(() => {
    const L = [];
    const R = [];
    let lh = 0;
    let rh = 0;
    (glance?.sections || []).forEach((s, i) => {
      const w = weight(s);
      if (lh <= rh) { L.push({ s, i }); lh += w; } else { R.push({ s, i }); rh += w; }
    });
    return [L, R];
  }, [glance]);
  if (!glance) return null;
  const { what, who, facts, sources } = glance;
  const nav = [...glance.nav, ...extraNav];

  const renderCol = (list) => list.map(({ s, i }) => (
    <div key={s.id} className="ay-gl-cell" style={{ order: i }}>
      <Section section={s} plan={plan} sources={sources} extra={extras[s.id]} onXref={onXref} />
    </div>
  ));

  return (
    <section className="ay-glance" id="ay-sec-glance" tabIndex={-1} aria-labelledby="ay-glance-h">
      <header className="ay-glance__head">
        <h2 id="ay-glance-h">ayna at a glance</h2>
        <p>Everything we know about it in one place, with sources.</p>
      </header>

      <nav className="ay-glance__nav" aria-label="On this page">
        <ul>
          {nav.filter((n) => n.id !== 'glance').map((n) => (
            <li key={n.id}>
              <a href={`#ay-sec-${n.id}`} onClick={(e) => { e.preventDefault(); jumpTo(`ay-sec-${n.id}`); }}>{n.label}</a>
            </li>
          ))}
        </ul>
      </nav>

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
          {facts.map((f) => (
            <div key={f.id} className={f.unknown ? 'is-unknown' : undefined}>
              <dt>{f.label}</dt>
              <dd>
                {f.jump && !f.unknown
                  ? <a href={`#ay-sec-${f.jump}`} onClick={(e) => { e.preventDefault(); jumpTo(`ay-sec-${f.jump}`); }}>{f.value}</a>
                  : f.value}
                <Refs refs={f.refs} sources={sources} />
              </dd>
              {f.note && <small>{f.note}</small>}
            </div>
          ))}
        </dl>
      </div>

      <div className="ay-glance__grid">
        <div className="ay-gl-col">{renderCol(left)}</div>
        <div className="ay-gl-col">{renderCol(right)}</div>
      </div>

      {sources.length > 0 && (
        <section className="ay-gl-sec ay-gl-sources" id="ay-sec-sources" tabIndex={-1} aria-labelledby="ay-sec-h-sources">
          <div className="ay-gl-sec__head">
            <span className="ay-gl-kind">Sources</span>
            <h3 id="ay-sec-h-sources">Where this comes from</h3>
          </div>
          <ol className="ay-gl-srclist">
            {sources.map((s) => (
              <li key={s.url} id={`ay-src-${s.n}`} tabIndex={-1}>
                <span className="ay-gl-cites__n">{s.n}</span>
                <div>
                  <span className={`ay-gl-type is-${s.type}`}>{s.label}</span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                  <small>{[s.publisher, s.year].filter(Boolean).join(' · ')}</small>
                  {s.summary && <small>{s.summary}</small>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
