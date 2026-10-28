import React from 'react';
import MatchPill from '../MatchPill.jsx';
import { matchText } from '../../utils/matchDisplay.js';
import { serviceFacts } from '../../data/startups.js';
import { productHref, isPlainLeftClick } from '../../utils/productRoute';
import { saveFeedback } from '../../utils/feedback.js';
import { SafetyTag } from './CardBits.jsx';
import './service-card.css';

// Whole card opens the service (same as ProductCard): a click that isn't on its own control
// forwards to the card's one link.
function openFromCard(e) {
  if (e.defaultPrevented || e.target?.closest?.('a, button, input, select, textarea, label, [role="button"]')) return;
  const link = e.currentTarget.querySelector('.ay-svc__link');
  if (link) link.click();
}

const HEART = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z';

/** "Visana Health" -> "VH", "Calm" -> "C": the monogram for a service with no logo file. Never a made-up logo. */
function monogram(text) {
  const words = String(text || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0][0]).toUpperCase();
}

/** The name once: the brand is added only when the name alone would not say whose it is ("Eight Sleep Pod 4"). */
function serviceTitle(service) {
  const name = String(service?.name || '').trim();
  const brand = String(service?.brand || '').trim();
  if (!brand || name.toLowerCase().includes(brand.toLowerCase())) return name;
  return `${brand} ${name}`;
}

/** One line on what it does: the first sentence of the record's own line, word for word. */
function oneLine(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  const m = s.match(/^(.{12,160}?[.!?])(\s|$)/);
  return m ? m[1] : s;
}

/**
 * The services card (critique Oct 27, web and app): a logo row, not a shop
 * photo card. Logo (or a clean monogram), the name once, one line on what it
 * does, then chips for format and cost (only when the record states them),
 * her match or "See your match", and the save heart. The whole card opens it.
 */
export default function ServiceCard({
  service, onOpen, isSaved = false, onToggleSaved = null,
  matchPercent = null, matchHold = false, matchLabel = '', onShowWhy = null, onSeeMatch = null,
  as = 'a', className = '',
}) {
  if (!service) return null;
  const { format, cost, logo, covers } = serviceFacts(service);
  const title = serviceTitle(service);
  const line = oneLine(covers);
  const hasMatch = Number.isFinite(matchPercent) && matchPercent > 0;
  const open = (e) => {
    if (as === 'a' && !isPlainLeftClick(e)) return;
    e.preventDefault?.();
    onOpen?.(service);
  };
  const Link = as;
  return (
    <article onClick={openFromCard} data-pid={service.id} data-tour="service-card" className={`ay-svc${isSaved ? ' is-saved' : ''}${onToggleSaved ? ' has-heart' : ''} ${className}`.trim()}>
      <div className="ay-svc__logo">
        {logo ? <img src={logo} alt={`${title} logo`} loading="lazy" decoding="async" /> : <span className="ay-svc__mono" aria-hidden="true">{monogram(service.brand || title)}</span>}
      </div>
      <div className="ay-svc__body">
        <h3 className="ay-svc__name">
          <Link className="ay-svc__link" {...(as === 'a' ? { href: productHref(service) } : { type: 'button' })} onClick={open}>{title}</Link>
        </h3>
        {line && <p className="ay-svc__line">{line}</p>}
        {(format || cost || hasMatch || matchHold) && (
          <div className="ay-svc__chips">
            {format && <span className="ay-svc__chip"><span className="sr-only">Format: </span>{format}</span>}
            {cost && <span className="ay-svc__chip is-cost"><span className="sr-only">Cost: </span>{cost}</span>}
            {(hasMatch || matchHold) && (
              <MatchPill hold={!hasMatch && matchHold} percent={matchPercent} size="sm" className="ay-svc__pill" label={hasMatch ? `${matchLabel || matchText(matchPercent)}. Why this match for ${title}` : `Safety hold, match unavailable for ${title}`}
                onClick={() => (onShowWhy ? onShowWhy(service) : onOpen?.(service))} />
            )}
          </div>
        )}
        {!hasMatch && !matchHold && typeof onSeeMatch === 'function' && <button type="button" className="ay-svc__seematch" onClick={() => onSeeMatch(service)}>See your match <span aria-hidden="true">→</span></button>}
        <SafetyTag product={service} />
      </div>
      {onToggleSaved && (
        <button type="button" className="ay-svc__heart" aria-label={isSaved ? `Remove ${title} from Saved` : `Save ${title}`} aria-pressed={isSaved}
          onClick={(e) => { saveFeedback(e, !isSaved); onToggleSaved(service); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART} /></svg>
        </button>
      )}
    </article>
  );
}
