import React from 'react';
import MatchPill from '../MatchPill.jsx';
import { matchText } from '../../utils/matchDisplay.js';
import { serviceFacts } from '../../data/startups.js';
import { productHref, isPlainLeftClick } from '../../utils/productRoute';
import { saveFeedback } from '../../utils/feedback.js';
import { SafetyTag } from './CardBits.jsx';
import { Plate } from '../ui/ay';

const HEART = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z';

/**
 * One card for a service (telehealth, an at-home test, an app...), website
 * and app (Explore audit Oct 25, issue 2; v3 #1 and #12). Fixed slots like
 * the product card: logo plate → name · format tag → what it covers → cost
 * (only when the record states one; never "Price at retailer") → her match
 * or "See your match" → evidence mark → save heart. Never an invented logo:
 * without a logo file the plate shows the name.
 */
export default function ServiceCard({
  service, onOpen, isSaved = false, onToggleSaved = null,
  matchPercent = null, matchHold = false, matchLabel = '', onShowWhy = null, onSeeMatch = null,
  as = 'a', className = '',
}) {
  if (!service) return null;
  const { format, cost, logo } = serviceFacts(service);
  const name = String(service.name || '').trim();
  const hasMatch = Number.isFinite(matchPercent) && matchPercent > 0;
  const open = (e) => {
    if (as === 'a' && !isPlainLeftClick(e)) return;
    e.preventDefault?.();
    onOpen?.(service);
  };
  const Link = as;
  return (
    <article data-pid={service.id} className={`ay-pcard ay-scard${isSaved ? ' is-saved' : ''} ${className}`.trim()}>
      {/* No logo file: a one-letter monogram (the name is printed right under it; long names broke mid-word on the plate). */}
      <Plate className="ay-pcard__plate ay-scard__plate" saved={isSaved} src={logo} alt={logo ? `${name} logo` : ''}>{!logo && <span className="ay-scard__mono" aria-hidden="true">{name.charAt(0)}</span>}</Plate>
      <p className="ay-scard__head">
        <strong className="ay-scard__name">
          <Link className="ay-pcard__link" {...(as === 'a' ? { href: productHref(service) } : { type: 'button' })} onClick={open}>{name}</Link>
        </strong>
        {format && <span className="ay-scard__format">{format}</span>}
      </p>
      {cost && <p className="ay-scard__cost"><span className="sr-only">Cost: </span>{cost}</p>}
      {(hasMatch || matchHold) && (
        <div className="ay-pcard__fit">
          <MatchPill hold={!hasMatch && matchHold} percent={matchPercent} size="sm" label={hasMatch ? `${matchLabel || matchText(matchPercent)}. Why this match for ${name}` : `Safety hold, match unavailable for ${name}`}
            onClick={() => (onShowWhy ? onShowWhy(service) : onOpen?.(service))} />
          {hasMatch && <button type="button" className="ay-pcard__what" onClick={() => (onShowWhy ? onShowWhy(service) : onOpen?.(service))} aria-label={`What's this? How the ${matchPercent}% match for ${name} was worked out`}>What’s this?</button>}
        </div>
      )}
      {!hasMatch && !matchHold && typeof onSeeMatch === 'function' && <button type="button" className="ay-pcard__seematch" onClick={() => onSeeMatch(service)}>See your match <span aria-hidden="true">→</span></button>}
      <SafetyTag product={service} />
      {onToggleSaved && (
        <div className="ay-pcard__foot">
          <span className="ay-pcard__tags" />
          <button type="button" className="ay-pcard__heart" aria-label={isSaved ? `Remove ${name} from Saved` : `Save ${name}`} aria-pressed={isSaved}
            onClick={(e) => { saveFeedback(e, !isSaved); onToggleSaved(service); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART} /></svg>
          </button>
        </div>
      )}
    </article>
  );
}
