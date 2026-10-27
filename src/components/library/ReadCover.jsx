import React from 'react';
import { READ_SECTION, coverPhotoFor } from '../../data/readCovers.js';
import './read-cover.css';

/*
 * Library cover, one anatomy for every read (website shelves, read pages and
 * the app's Library tab). A read with a real photo shows the photo. Every
 * other read is a clean colour block with its short title set large: no
 * drawn icons, no label box, no sticker (founder, Oct 27: "no doodles").
 * The colour names the Library section, so it means something.
 */

// The short name on each plain cover, taken from the read's own title so
// cover and title always say the same thing.
const WORD = {
  'intimate-wash': 'Intimate washes', 'heavy-bleeding': 'Heavy menstrual bleeding', 'menopause-basics': 'Menopause', 'uti-prevention': 'UTI prevention',
  'yeast-infection-basics': 'Yeast infection', 'period-pain-when-to-seek-care': 'Period pain', 'pcos-basics': 'PMOS',
  'pelvic-floor-dysfunction': 'Pelvic floor', 'endometriosis-basics': 'Endometriosis', 'bacterial-vaginosis': 'BV', pmdd: 'PMDD',
  fibroids: 'Fibroids', 'iron-deficiency-anemia': 'Iron deficiency', 'ovarian-cysts': 'Ovarian cysts', 'hormonal-birth-control': 'Birth control',
  'postpartum-stretch-marks': 'Stretch marks', 'genitourinary-syndrome-of-menopause': 'GSM',
};
// Long single words (Endometriosis) step the type down so they never break.
const wordSize = (w) => { const n = Math.max(...String(w).split(/\s+/).map((x) => x.length)); return n >= 12 ? ' rc--w3' : n >= 10 ? ' rc--w2' : ''; };

/**
 * @param {object} p
 * @param {{id:string,title:string,image?:string}} p.article
 * @param {number} [p.minutes]  read time; the foot is left out without it
 * @param {'shelf'|'hero'|'thumb'} [p.size]
 */
export default function ReadCover({ article, minutes, size = 'shelf', className = '' }) {
  if (!article) return null;
  const { id, title } = article;
  const section = READ_SECTION[id] || 'hormonal';
  const photo = coverPhotoFor(article);
  const word = WORD[id] || title;
  return (
    <span className={`rc rc--${section}${photo ? ' rc--photo' : ''} rc--${size}${wordSize(word)} ${className}`.trim()} aria-hidden="true">
      {photo ? <img className="rc__photo" src={photo} alt="" loading={size === 'hero' ? 'eager' : 'lazy'} decoding="async" /> : <strong className="rc__word">{word}</strong>}
      {minutes ? <span className="rc__foot">{minutes} min read</span> : null}
    </span>
  );
}
