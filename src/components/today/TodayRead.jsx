import { pickReadForYou } from '../../data/readPicks.js';
import ReadCover from '../library/ReadCover.jsx';

/**
 * Today > More for you: the one Library read that fits her answers (the same
 * picker Home uses, src/data/readPicks.js), with its real cover. Nothing fits:
 * nothing renders (no empty module).
 */
export default function TodayRead({ quizResults, healthProfile = null, onOpen }) {
  let read = null;
  try { read = pickReadForYou(quizResults, healthProfile); } catch { read = null; }
  if (!read || !onOpen) return null;
  return (
    <a className="ay-tread" href={`/library/${read.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); onOpen(read.id); }}>
      <ReadCover article={{ id: read.id, title: read.title }} size="shelf" className="ay-tread__cover" />
      <span className="ay-tread__text">
        <span className="ay-tread__label">A read for you</span>
        <strong className="ay-tread__title">{read.title}</strong>
        <span className="ay-tread__teaser">{read.teaser}</span>
      </span>
    </a>
  );
}
