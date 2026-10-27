import React, { Children, isValidElement, useId, useState } from 'react';
import { textOf } from './readTime.js';
import './read-body.css';

/*
 * One read, structured for a glance (Library critique, Oct 27), app and
 * website alike, built only from the read's own words:
 *   1. "In short": the opening sentence of the read's first paragraphs, verbatim.
 *   2. The body as tap-to-open sections. A section starts at a subheading
 *      (h2) or, in reads without subheadings, at a bold lead-in
 *      ("Key guidelines:"). Text before the first one is "Overview".
 *   3. "When to seek care", always shown (never folded) as a callout.
 * Sources ("Sources:" / "References:" and the list after it) are handed back
 * to the caller, which draws them in its own accordion.
 */

const plain = (node) => textOf(node).replace(/\s+/g, ' ').trim();
const LABEL_MAX = 90;
const SOURCES = /^(sources|references)$/i;
const CARE = /^when to (seek|get) care$/i;

// "<p><strong>Label:</strong> rest</p>" → { label, rest } (rest may be empty).
function leadLabel(el) {
  if (!isValidElement(el) || el.type !== 'p') return null;
  const parts = Children.toArray(el.props.children);
  const lead = parts[0];
  if (!isValidElement(lead) || lead.type !== 'strong') return null;
  const text = plain(lead.props.children);
  const rest = parts.slice(1);
  const restText = plain(rest);
  if (/:$/.test(text) && text.length < LABEL_MAX) return { label: text.replace(/:$/, '').replace(/\s*\(from [^)]*\)\s*$/i, '').trim(), rest: restText ? rest : null };
  return null;
}

function firstSentence(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const m = /^(.+?[.!?])(?=\s+[A-Z“"(]|$)/.exec(t);
  return (m ? m[1] : t).trim();
}

/** Split a read's body into byline, sections, the care note and the sources. */
function structureRead(body) {
  const kids = isValidElement(body) ? Children.toArray(body.props.children) : Children.toArray(body);
  const hasH2 = kids.some((k) => isValidElement(k) && k.type === 'h2');
  const out = { byline: null, sections: [], care: null, sources: null };
  let cur = { title: 'Overview', items: [] };
  const push = () => { if (cur.items.length) out.sections.push(cur); };
  for (let i = 0; i < kids.length; i += 1) {
    const el = kids[i];
    if (!isValidElement(el)) { if (String(el).trim()) cur.items.push(el); continue; }
    const text = plain(el);
    // The writer's credit line ("Reviewed by ... Written by ...") sits above everything.
    if (!out.byline && el.type === 'div' && /^(reviewed|written) by/i.test(text)) { out.byline = el; continue; }
    const lead = leadLabel(el);
    if (lead && SOURCES.test(lead.label)) { out.sources = { label: lead.label, items: kids.slice(i + 1) }; break; }
    if (lead && CARE.test(lead.label)) { out.care = { label: lead.label, rest: lead.rest }; continue; }
    if (el.type === 'h2') { push(); cur = { title: text, items: [] }; continue; }
    if (lead && !hasH2) { push(); cur = { title: lead.label, items: lead.rest ? [<p key={`r-${i}`}>{lead.rest}</p>] : [] }; continue; }
    cur.items.push(el);
  }
  push();
  // In short: the first sentence of the first three prose paragraphs (not lead-ins, not tiny lines).
  const prose = [];
  out.sections.forEach((s) => s.items.forEach((el) => {
    if (prose.length >= 3 || !isValidElement(el) || el.type !== 'p' || leadLabel(el)) return;
    const first = Children.toArray(el.props.children)[0];
    if (isValidElement(first) && first.type === 'strong') return;
    const s1 = firstSentence(plain(el));
    if (s1.length >= 40) prose.push(s1);
  }));
  out.inShort = prose;
  return out;
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={`ayr-sec${open ? ' is-open' : ''}`}>
      <h2 className="ayr-sec__h">
        <button type="button" className="ayr-sec__btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          <span>{title}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </h2>
      <div id={id} className="ayr-sec__body" hidden={!open}>{children}</div>
    </section>
  );
}

/**
 * @param {object} p
 * @param {import('react').ReactNode} p.body  the read's JSX body
 * @param {(sources:{label:string,items:any[]}) => import('react').ReactNode} [p.renderSources]
 * @param {import('react').ReactNode} [p.before]  drawn after "In short" (a video)
 */
export default function ReadBody({ body, renderSources = null, before = null, className = '' }) {
  const r = structureRead(body);
  const single = r.sections.length === 1;
  return (
    <div className={`ayr ${className}`.trim()}>
      {r.byline && <div className="ayr-byline">{r.byline}</div>}
      {r.inShort.length > 0 && (
        <section className="ayr-short" aria-labelledby="ayr-short-h">
          <h2 id="ayr-short-h" className="ayr-short__h">In short</h2>
          <ul>{r.inShort.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>
      )}
      {before}
      <div className="ayr-secs">
        {r.sections.map((s, i) => <Section key={`${s.title}-${i}`} title={single ? 'Read the full article' : s.title}>{s.items}</Section>)}
      </div>
      {r.care && (
        <aside className="ayr-care" aria-labelledby="ayr-care-h">
          <h2 id="ayr-care-h" className="ayr-care__h">{r.care.label}</h2>
          {r.care.rest && <p>{r.care.rest}</p>}
        </aside>
      )}
      {r.sources && renderSources?.(r.sources)}
    </div>
  );
}

/** Sources as one tap-to-open row: the read's own list, unchanged inside. */
export function SourcesAccordion({ id, count, children, label = 'Sources', open: openProp, onToggle }) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const bodyId = useId();
  return (
    <section className={`ayr-sec ayr-sources${open ? ' is-open' : ''}`} id={id}>
      <h2 className="ayr-sec__h">
        <button type="button" className="ayr-sec__btn" aria-expanded={open} aria-controls={bodyId} onClick={() => (onToggle ? onToggle(!open) : setOpenState(!open))}>
          <span>{label}{count ? <span className="ayr-sec__n"> {count}</span> : null}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </h2>
      <div id={bodyId} className="ayr-sec__body" hidden={!open}>{children}</div>
    </section>
  );
}
