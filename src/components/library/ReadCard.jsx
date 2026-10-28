import React from 'react';
import ReadCover from './ReadCover.jsx';
import { minutesFor } from './readTime.js';
import { READ_SECTIONS } from '../../data/readSections.js';
import { READ_CREDITS, coverPhotoFor } from '../../data/readCovers.js';
import { EvMark } from '../cards/CardBits.jsx';
import './read-card.css';

const plainClick = (e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);
const sectionLabel = (id) => READ_SECTIONS.find((s) => s.articleIds.includes(id))?.label || '';

// A source named in a read's credit line ("UpToDate, ACOG, CDC"), marked the
// way the product page marks evidence: filled = a .gov health source, half =
// peer-reviewed (PubMed/PMC). Anything else is listed without a mark.
const GOV = /\b(CDC|NIH|NICHD|NIDDK|NCI|NHLBI|ODS|MedlinePlus|FDA|womenshealth\.gov|Office on Women.s Health|OWH|AHRQ|NLM|DailyMed|HHS)\b/i;
const PEER = /\b(PubMed|PMC|Cochrane)\b/i;
function sourceList(text) {
  return String(text || '').split(/\s*[,;]\s*/).map((s) => s.trim()).filter(Boolean)
    .map((name) => ({ name, level: GOV.test(name) ? 'gov' : PEER.test(name) ? 'peer' : '' }));
}

/**
 * The one read card (Explore audit, Oct 25, issue 4), website and app.
 * - layout "row": 120px cover · topic · title · one line · Written by /
 *   Reviewed by (when the team recorded them) · sources with evidence marks.
 * - layout "rail": a 4:3 cover, then topic · read time, then the title.
 * - layout "feature": the row's anatomy with the photo or cover big on top
 *   (the one big feature of the Reads editorial grid, #4dfb3fbd FEEL FITS).
 * A real link on the website (`href`), a button in the app (no `href`).
 */
export default function ReadCard({ article, layout = 'rail', href = null, onOpen, progress = 0, headingLevel = 3, className = '', summary = false }) {
  if (!article) return null;
  const { id, title, teaser, source } = article;
  const minutes = minutesFor(article);
  const credit = READ_CREDITS[id];
  const click = (e) => { if (href && !plainClick(e)) return; e.preventDefault(); onOpen?.(article); };
  const Link = href ? 'a' : 'button';
  const linkProps = href ? { href } : { type: 'button' };
  const H = `h${headingLevel}`;
  const state = progress > 0 ? <span className="ay-rcard__state">{progress >= 1 ? 'Finished' : `${Math.round(progress * 100)}% read`}</span> : null;
  if (layout === 'row' || layout === 'feature') {
    const sources = sourceList(source);
    const feature = layout === 'feature';
    return (
      <article className={`ay-rcard ${feature ? 'is-feature' : 'is-row'} ${className}`.trim()}>
        <span className="ay-rcard__thumb" aria-hidden="true">
          {coverPhotoFor(article) ? <img src={coverPhotoFor(article)} alt="" loading={feature ? 'eager' : 'lazy'} /> : <ReadCover article={article} size={feature ? 'hero' : 'thumb'} />}
        </span>
        <div className="ay-rcard__text">
          <p className="ay-rcard__topic">{sectionLabel(id)} <span aria-hidden="true">·</span> {minutes} min read</p>
          <H className="ay-rcard__title"><Link className="ay-rcard__link" {...linkProps} onClick={click}>{title}</Link></H>
          {teaser && <p className="ay-rcard__line">{teaser}</p>}
          {credit && <p className="ay-rcard__credit">Written by {credit.by} <span aria-hidden="true">·</span> Reviewed by {credit.reviewedBy}</p>}
          {sources.length > 0 && (
            <p className="ay-rcard__sources"><span className="sr-only">Sources: </span>
              {sources.map((s, i) => <span key={`${s.name}-${i}`} className="ay-rcard__src">{s.level && <EvMark level={s.level} />}{s.name}{s.level && <span className="sr-only"> ({s.level === 'gov' ? '.gov health source' : 'peer-reviewed'})</span>}</span>)}
            </p>
          )}
          {state}
        </div>
      </article>
    );
  }
  return (
    <article className={`ay-rcard is-rail ${className}`.trim()}>
      <span className="ay-rcard__cover" aria-hidden="true"><ReadCover article={article} /></span>
      {/* Topic and read time at a glance, then the title (Library nav pass, Oct 27). */}
      <p className="ay-rcard__topic">{sectionLabel(id)}{sectionLabel(id) ? <span aria-hidden="true"> · </span> : null}{minutes} min read</p>
      <H className="ay-rcard__title"><Link className="ay-rcard__link" {...linkProps} onClick={click} aria-label={`${title}, ${minutes} min read`}>{title}</Link></H>
      {summary && teaser && <p className="ay-rcard__sum">{teaser}</p>}
      {state}
    </article>
  );
}
