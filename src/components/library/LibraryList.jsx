import React from 'react';
import ReadCover from './ReadCover.jsx';
import { minutesFor } from './readTime.js';
import { READ_SECTIONS } from '../../data/readSections.js';
import { READ_CREDITS, READ_SECTION, coverPhotoFor } from '../../data/readCovers.js';
import './library-list.css';

/*
 * The website Library as lists (founder, Oct 28: "why is it spaced out like that for the reads, why are
 * the pictures so huge"). Same language as the app's Library and the ecosystem shelves:
 *   - two featured reads as wide cards with a modest photo beside the words (not a full-width carousel);
 *   - every other read as a row: small cover, topic and time, title, chevron;
 *   - rows grouped under the pink folder-tab heads, two shelves side by side on desktop.
 * The free Read she chose this week is marked on its row.
 */

const plainClick = (e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);
const sectionLabel = (id) => READ_SECTIONS.find((s) => s.articleIds.includes(id))?.label || '';

function Thumb({ article, size }) {
  const photo = coverPhotoFor(article);
  // Small rows: a read without a photo gets its section colour and a book mark (its title is right next
  // to it); squeezing the title into a 64px tile broke words apart.
  const plain = size === 'row' ? <span className={`rc rc--${READ_SECTION[article.id] || 'hormonal'} ll-glyph`}><svg viewBox="0 0 24 24"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z" /></svg></span> : <ReadCover article={article} size="thumb" />;
  return <span className={`ll-thumb is-${size}`} aria-hidden="true">{photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : plain}</span>;
}

export function ReadRow({ article, onOpen, chosen = false, progress = 0, showSection = false }) {
  if (!article) return null;
  const minutes = minutesFor(article);
  const state = progress >= 1 ? 'Finished' : progress > 0 ? `${Math.round(progress * 100)}% read` : null;
  return (
    <li className="ll-row">
      <a className="ll-row__link" href={`/library/${article.id}`} onClick={(e) => { if (!plainClick(e)) return; e.preventDefault(); onOpen?.(article); }}>
        <span className="ll-row__text">
          <small className="ll-row__meta">{[showSection ? sectionLabel(article.id) : null, `${minutes} min read`, state].filter(Boolean).join(' · ')}</small>
          <span className="ll-row__title">{article.title}</span>
        </span>
        {chosen && <span className="ll-row__free">Your free Read</span>}
        <svg className="ll-row__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
      </a>
    </li>
  );
}

export function FeaturedReads({ reads = [], onOpen }) {
  const list = reads.filter(Boolean).slice(0, 2);
  if (!list.length) return null;
  return (
    <section className="ll-featured" aria-labelledby="ll-featured-h">
      <h2 id="ll-featured-h" className="ll-h2">Featured</h2>
      <ul className="ll-featured__grid">
        {list.map((a) => {
          const credit = READ_CREDITS[a.id];
          return (
            <li key={a.id}>
              <a className="ll-feature" href={`/library/${a.id}`} onClick={(e) => { if (!plainClick(e)) return; e.preventDefault(); onOpen?.(a); }}>
                <Thumb article={a} size="feature" />
                <span className="ll-feature__text">
                  <small className="ll-row__meta">{sectionLabel(a.id)} · {minutesFor(a)} min read</small>
                  <span className="ll-feature__title">{a.title}</span>
                  {a.teaser && <span className="ll-feature__line">{a.teaser}</span>}
                  {credit?.reviewedBy && <small className="ll-feature__credit">Reviewed by {credit.reviewedBy}</small>}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** One shelf: the folder tab on the rule, a count, an optional action, then rows. */
export function ReadShelf({ id, label, items, onOpen, chosenId = null, progressOf = () => 0, action = null, note = null, mixed = false }) {
  if (!items?.length) return null;
  return (
    <section className="ll-shelf" id={id} aria-labelledby={`${id}-h`}>
      <header className="ll-shelf__head">
        <h3 id={`${id}-h`}>{label}</h3>
        <span className="ll-shelf__n">{items.length}</span>
        {action}
      </header>
      {note && <p className="ll-shelf__note">{note}</p>}
      <ul className="ll-rows">{items.map((a) => <ReadRow key={a.id} article={a} onOpen={onOpen} chosen={chosenId === a.id} progress={progressOf(a)} showSection={mixed} />)}</ul>
    </section>
  );
}
