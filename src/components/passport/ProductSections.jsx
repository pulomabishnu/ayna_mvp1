import React, { useMemo, useState } from 'react';
import { GlossaryText } from '../GlossaryTerm';
import { planSectionGlossary } from '../../data/passport/content';
import './ProductSections.css';

/**
 * The product page body, shared by the website and the app (founder spec 19,
 * 20, 28, 29). "What it is" and "What it may help with" are always open;
 * everything deeper is one tap away. Sections come from
 * buildProductSections(); empty ones never reach here.
 *
 * extras: { [sectionId]: ReactNode } appended inside that section (rating
 * controls, "See the full breakdown", Ask ayna).
 */
const INTRO = new Set(['what', 'helps']);

function Label({ children }) {
  return children ? <span className="ay-psec-label">{children}</span> : null;
}

function SourceList({ items, grouped }) {
  if (!items?.length) return null;
  const groups = grouped
    ? Object.entries(items.reduce((acc, s) => { (acc[s.evidence_label] ||= []).push(s); return acc; }, {}))
    : [[null, items]];
  return groups.map(([label, list]) => (
    <div key={label || 'all'} className="ay-psec-srcgroup">
      {label && <Label>{label}</Label>}
      <ul className="ay-psec-sources">
        {list.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              <span className="ay-psec-src-title">{s.title}</span>
              <span className="ay-psec-src-meta">{[s.publisher, grouped ? null : s.evidence_label, s.year].filter(Boolean).join(' · ')}</span>
              {s.summary && <span className="ay-psec-src-sum">{s.summary}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  ));
}

function Block({ block, sid, index, plan, onXref }) {
  const k = `${sid}:${index}`;
  const g = (text, key) => <GlossaryText text={text} terms={plan[key] || []} />;
  switch (block.type) {
    case 'text':
      return (
        <div className="ay-psec-block">
          <Label>{block.label}</Label>
          <p className={block.pre ? 'is-pre' : undefined}>{g(block.text, k)}</p>
          {block.note && <p className="ay-psec-note">{block.note}</p>}
        </div>
      );
    case 'xref':
      return (
        <p className="ay-psec-note">
          See {onXref ? <button type="button" className="ay-psec-xref" onClick={() => onXref(block.text)}>{block.text}</button> : block.text} for the {block.what}.
        </p>
      );
    case 'note':
      return <p className="ay-psec-note">{g(block.text, k)}</p>;
    case 'alert':
      return <div className="ay-psec-alert" role="note"><strong>Safety note</strong><p>{g(block.text, k)}</p></div>;
    case 'list':
      return (
        <div className="ay-psec-block">
          <Label>{block.label}</Label>
          <ul className="ay-psec-list">{block.items.map((t, j) => <li key={t}>{g(t, `${k}:${j}`)}</li>)}</ul>
        </div>
      );
    case 'steps':
      return <ol className="ay-psec-steps">{block.items.map((t, j) => <li key={t}><span>{g(t, `${k}:${j}`)}</span></li>)}</ol>;
    case 'chips':
      return (
        <div className="ay-psec-block">
          <Label>{block.label}</Label>
          <ul className="ay-psec-chips">{block.items.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      );
    case 'facts':
      return <dl className="ay-psec-facts">{block.rows.map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>;
    case 'rows':
      return (
        <div className="ay-psec-rows">
          {block.items.map((r, j) => <div key={r.title}><strong>{r.title}</strong>{r.text && <p>{g(r.text, `${k}:${j}`)}</p>}</div>)}
        </div>
      );
    case 'reviews':
      return (
        <div className="ay-psec-block">
          <Label>From ayna members</Label>
          {block.items.map((t) => <blockquote key={t} className="ay-psec-quote">{t}</blockquote>)}
        </div>
      );
    case 'sources':
      return <SourceList items={block.items} grouped={block.grouped} />;
    default:
      return null;
  }
}

function SectionBody({ section, plan, extra, onXref }) {
  return (
    <>
      {section.blocks.map((b, i) => <Block key={`${section.id}-${i}`} block={b} sid={section.id} index={i} plan={plan} onXref={onXref} />)}
      {extra}
    </>
  );
}

export default function ProductSections({ sections, extras = {}, extraSections = [], initiallyOpen = [], onXref = null }) {
  const plan = useMemo(() => planSectionGlossary(sections), [sections]);
  const [open, setOpen] = useState(() => new Set(initiallyOpen));
  const toggle = (id) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const intro = sections.filter((s) => INTRO.has(s.id));
  const rest = [...sections.filter((s) => !INTRO.has(s.id)), ...extraSections];

  return (
    <div className="ay-psec">
      {intro.length > 0 && (
        <div className="ay-psec-intro">
          {intro.map((s) => (
            <section key={s.id} className={`ay-psec-introsec is-${s.id}`} aria-labelledby={`ay-psec-h-${s.id}`}>
              <h2 id={`ay-psec-h-${s.id}`}>{s.title}</h2>
              <SectionBody section={s} plan={plan} extra={extras[s.id]} onXref={onXref} />
            </section>
          ))}
        </div>
      )}
      <div className="ay-psec-acc">
        {rest.map((s) => {
          const isOpen = open.has(s.id);
          return (
            <section key={s.id} className={`ay-psec-item is-${s.id}${isOpen ? ' is-open' : ''}`}>
              <h2>
                <button type="button" aria-expanded={isOpen} aria-controls={`ay-psec-b-${s.id}`} onClick={() => toggle(s.id)}>
                  <span className="ay-psec-title">{s.title}</span>
                  {s.preview && !isOpen && <span className="ay-psec-preview">{s.preview}</span>}
                  <svg className="ay-psec-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
              </h2>
              {isOpen && (
                <div className="ay-psec-body" id={`ay-psec-b-${s.id}`}>
                  {s.node || <SectionBody section={s} plan={plan} extra={extras[s.id]} onXref={onXref} />}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
