import React from 'react';
import MatchPill from '../MatchPill.jsx';
import { matchText } from '../../utils/matchDisplay.js';
import { serviceFacts } from '../../data/startups.js';
import { productHref, isPlainLeftClick } from '../../utils/productRoute';
import { saveFeedback } from '../../utils/feedback.js';
import { SafetyTag } from './CardBits.jsx';

// Whole card opens the service (same as ProductCard): a click that isn't on its own control
// forwards to the card's one link.
function openFromCard(e) {
  if (e.defaultPrevented || e.target?.closest?.('a, button, input, select, textarea, label, [role="button"]')) return;
  const link = e.currentTarget.querySelector('.ay-pcard__link:not(.is-static)');
  if (link) link.click();
}

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
    <article onClick={openFromCard} data-pid={service.id} className={`ay-pcard ay-scard${isSaved ? ' is-saved' : ''}${onToggleSaved ? ' has-heart' : ''} ${className}`.trim()}>
      {/* No logo file: a one-letter monogram (the name is printed right under it; long names broke mid-word on the plate). */}
      <div className="ay-pcard__photo ay-scard__photo">
        {logo ? <img src={logo} alt={`${name} logo`} loading="lazy" decoding="async" /> : <span className="ay-scard__mono" aria-hidden="true">{name.charAt(0)}</span>}
      </div>
      <div className="ay-pcard__body">
        <h3 className="ay-pcard__name ay-scard__name">
          <Link className="ay-pcard__link" {...(as === 'a' ? { href: productHref(service) } : { type: 'button' })} onClick={open}>{name}</Link>
        </h3>
        {format && <p className="ay-pcard__cat ay-scard__format">{format}</p>}
        {(cost || hasMatch || matchHold) && (
          <div className="ay-pcard__price">
            {cost && <span className="ay-pcard__amount ay-scard__cost"><span className="sr-only">Cost: </span>{cost}</span>}
            {(hasMatch || matchHold) && (
              <MatchPill hold={!hasMatch && matchHold} percent={matchPercent} size="sm" className="ay-pcard__pill" label={hasMatch ? `${matchLabel || matchText(matchPercent)}. Why this match for ${name}` : `Safety hold, match unavailable for ${name}`}
                onClick={() => (onShowWhy ? onShowWhy(service) : onOpen?.(service))} />
            )}
          </div>
        )}
        {!hasMatch && !matchHold && typeof onSeeMatch === 'function' && <button type="button" className="ay-pcard__seematch" onClick={() => onSeeMatch(service)}>See your match <span aria-hidden="true">→</span></button>}
        <SafetyTag product={service} />
      </div>
      {onToggleSaved && (
        <button type="button" className="ay-pcard__heart" aria-label={isSaved ? `Remove ${name} from Saved` : `Save ${name}`} aria-pressed={isSaved}
          onClick={(e) => { saveFeedback(e, !isSaved); onToggleSaved(service); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART} /></svg>
        </button>
      )}
    </article>
  );
}
