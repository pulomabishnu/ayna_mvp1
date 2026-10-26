import React from 'react';
import MatchPill from '../MatchPill.jsx';
import { matchText } from '../../utils/matchDisplay.js';
import { serviceFacts } from '../../data/startups.js';
import { productHref, isPlainLeftClick } from '../../utils/productRoute';
import { saveFeedback } from '../../utils/feedback.js';
import { EvidenceRow } from './CardBits.jsx';

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
  matchPercent = null, matchHold = false, matchLabel = '', why = '', onShowWhy = null, onSeeMatch = null,
  as = 'a', className = '',
}) {
  if (!service) return null;
  const { format, cost, logo, covers } = serviceFacts(service);
  const name = String(service.name || '').trim();
  const hasMatch = Number.isFinite(matchPercent) && matchPercent > 0;
  const open = (e) => {
    if (as === 'a' && !isPlainLeftClick(e)) return;
    e.preventDefault?.();
    onOpen?.(service);
  };
  const Link = as;
  return (
    <article className={`ay-pcard ay-scard${isSaved ? ' is-saved' : ''} ${className}`.trim()}>
      <div className="ay-pcard__plate ay-scard__plate">
        {logo ? <img src={logo} alt={`${name} logo`} loading="lazy" /> : <span className="ay-plate-name" aria-hidden="true"><span>{name}</span></span>}
      </div>
      <p className="ay-scard__head">
        <strong className="ay-scard__name">
          <Link className="ay-pcard__link" {...(as === 'a' ? { href: productHref(service) } : { type: 'button' })} onClick={open}>{name}</Link>
        </strong>
        {format && <span className="ay-scard__format">{format}</span>}
      </p>
      {covers && <p className="ay-scard__covers">{covers}</p>}
      {cost && <p className="ay-scard__cost"><span className="sr-only">Cost: </span>{cost}</p>}
      {(hasMatch || matchHold) && (
        <div className="ay-pcard__fit">
          <MatchPill hold={!hasMatch && matchHold} percent={matchPercent} size="sm" label={hasMatch ? `${matchLabel || matchText(matchPercent)}. Why this match for ${name}` : `Safety hold, match unavailable for ${name}`}
            onClick={() => (onShowWhy ? onShowWhy(service) : onOpen?.(service))} />
          {why && <span className="ay-pcard__why">{why}</span>}
        </div>
      )}
      {!hasMatch && !matchHold && typeof onSeeMatch === 'function' && <button type="button" className="ay-pcard__seematch" onClick={() => onSeeMatch(service)}>See your match <span aria-hidden="true">→</span></button>}
      <EvidenceRow product={service} />
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
