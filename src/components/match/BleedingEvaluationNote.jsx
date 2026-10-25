import { BLEEDING_EVALUATION } from '../../utils/matchDisplay.js';
import './safety-hold.css';

/**
 * Bleeding after menopause (founder, Oct 24): on a period or bleeding
 * product, the prompt-evaluation message (details.bleedingEvaluation from
 * src/data/products.js) instead of a match. Never a percent. Reuses the
 * safety hold note's look.
 */
export default function BleedingEvaluationNote({ note, className = '' }) {
  if (!note?.text) return null;
  return (
    <div className={`ay-hold ${className}`.trim()} role="note" aria-label={BLEEDING_EVALUATION}>
      <p className="ay-hold__k"><b>{BLEEDING_EVALUATION}</b></p>
      <p className="ay-hold__why">{note.text}</p>
      {note.source?.url && <p className="ay-hold__why"><a href={note.source.url} target="_blank" rel="noopener noreferrer">{note.source.label || 'Source'}</a></p>}
    </div>
  );
}
