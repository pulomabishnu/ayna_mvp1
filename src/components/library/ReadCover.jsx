import React from 'react';
import { READ_SECTION, readPhoto } from '../../data/readCovers.js';
import './read-cover.css';

/*
 * Library cover, one anatomy for every read (website shelves, read pages and
 * the app's Library tab). After the "Academy" covers on the inspo board: a
 * colour field with a scalloped band, a paper label with the topic, and the
 * read time underneath. Reads with a real photo show the photo instead of the
 * colour field. Every shape is CSS or inline SVG, drawn at the cover's size.
 */

const SECTION_SHORT = { menstrual: 'Menstrual', hormonal: 'Hormonal', pelvic: 'Pelvic', vaginal: 'Intimate health', postpartum: 'Postpartum' };

// The short name on each cover, taken from the read's own title so cover and
// title always say the same thing.
const WORD = {
  'intimate-wash': 'Intimate washes', 'heavy-bleeding': 'Heavy menstrual bleeding', 'menopause-basics': 'Menopause', 'uti-prevention': 'UTI prevention',
  'yeast-infection-basics': 'Yeast infection', 'period-pain-when-to-seek-care': 'Period pain', 'pcos-basics': 'PMOS',
  'pelvic-floor-dysfunction': 'Pelvic floor', 'endometriosis-basics': 'Endometriosis', 'bacterial-vaginosis': 'BV', pmdd: 'PMDD',
  fibroids: 'Fibroids', 'iron-deficiency-anemia': 'Iron deficiency', 'ovarian-cysts': 'Ovarian cysts', 'hormonal-birth-control': 'Birth control',
  'postpartum-stretch-marks': 'Stretch marks', 'genitourinary-syndrome-of-menopause': 'GSM',
};
// Long single words (Endometriosis) step the type down so they never break.
const wordSize = (w) => { const n = Math.max(...String(w).split(/\s+/).map((x) => x.length)); return n >= 12 ? ' rc--w3' : n >= 10 ? ' rc--w2' : ''; };

/* One line weight, round caps; drawn in the field's ink colour. */
const SPOT = {
  'heavy-bleeding': <><path d="M20 6c-6 9-9 14-9 19a9 9 0 0 0 18 0c0-5-3-10-9-19Z" /><path d="M38 22c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8Z" /></>,
  'period-pain-when-to-seek-care': <path d="M27 4 12 26h11l-4 18 17-24H25l2-16Z" />,
  'menopause-basics': <><circle cx="24" cy="24" r="7" /><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M10 38l4-4" /></>,
  'uti-prevention': <><path d="M14 8h20l-3 32H17L14 8Z" /><path d="M15 18h18" /></>,
  'yeast-infection-basics': <><circle cx="16" cy="16" r="5" /><circle cx="31" cy="20" r="6" /><circle cx="19" cy="33" r="7" /><circle cx="35" cy="35" r="3" /></>,
  'pcos-basics': <><circle cx="24" cy="26" r="11" /><circle cx="20" cy="23" r="2.5" /><circle cx="28" cy="24" r="2" /><circle cx="24" cy="31" r="2.5" /></>,
  'pelvic-floor-dysfunction': <><path d="M6 18c0 12 8 22 18 22s18-10 18-22" /><path d="M6 18h36M16 28h16" /></>,
  'endometriosis-basics': <><circle cx="24" cy="24" r="4" /><path d="M24 20c-3-6 0-12 0-16M28 24c6-3 12 0 16 0M24 28c3 6 0 12 0 16M20 24c-6 3-12 0-16 0" /></>,
  'bacterial-vaginosis': <><circle cx="18" cy="28" r="9" /><circle cx="33" cy="16" r="6" /><circle cx="35" cy="34" r="4" /></>,
  pmdd: <><path d="M14 32h22a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-3 16Z" /><path d="M18 38l-2 5M26 38l-2 5M34 38l-2 5" /></>,
  fibroids: <><circle cx="24" cy="24" r="14" /><circle cx="19" cy="20" r="4" /><circle cx="29" cy="28" r="5" /></>,
  'iron-deficiency-anemia': <><path d="M10 38C10 18 22 8 40 8c0 18-10 30-30 30Z" /><path d="M10 38 30 18" /></>,
  'ovarian-cysts': <><circle cx="18" cy="28" r="9" /><circle cx="33" cy="16" r="6" /></>,
  'intimate-wash': <><rect x="15" y="16" width="18" height="26" rx="4" /><path d="M20 16V9h8v7M18 9h12M19 27h10" /></>,
  'hormonal-birth-control': <><rect x="8" y="10" width="32" height="28" rx="5" /><circle cx="17" cy="19" r="2.5" /><circle cx="24" cy="19" r="2.5" /><circle cx="31" cy="19" r="2.5" /><circle cx="17" cy="29" r="2.5" /><circle cx="24" cy="29" r="2.5" /><circle cx="31" cy="29" r="2.5" /></>,
};

const Bookmark = () => <svg className="rc__mark" viewBox="0 0 12 14" aria-hidden="true"><path d="M1.5 1.5h9v11L6 9.6l-4.5 2.9Z" /></svg>;

/**
 * @param {object} p
 * @param {{id:string,title:string}} p.article
 * @param {number} [p.minutes]  read time; the foot is left out without it
 * @param {'shelf'|'hero'} [p.size]
 */
export default function ReadCover({ article, minutes, size = 'shelf', className = '' }) {
  if (!article) return null;
  const { id, title } = article;
  const section = READ_SECTION[id] || 'hormonal';
  const photo = readPhoto(id);
  return (
    <span className={`rc rc--${section}${photo ? ' rc--photo' : ''} rc--${size}${wordSize(WORD[id] || title)} ${className}`.trim()} aria-hidden="true">
      {photo ? <img className="rc__photo" src={photo} alt="" loading="lazy" decoding="async" /> : <span className="rc__band" />}
      {!photo && SPOT[id] && <svg className="rc__spot" viewBox="0 0 48 48">{SPOT[id]}</svg>}
      <span className="rc__label">
        <span className="rc__pill">{SECTION_SHORT[section]}</span>
        <strong className="rc__word">{WORD[id] || title}</strong>
      </span>
      {minutes ? <span className="rc__foot"><Bookmark />{minutes} min read</span> : null}
    </span>
  );
}
