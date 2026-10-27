import React from 'react';
import { Plate, Shout } from '../ui/ay';
import '../../styles/uq-info.css';
import '../../styles/info-pages.css';

/**
 * InfoHero: the one header for every info page (info-pages audit, issue 1 and
 * section 6). Uniqueness pass A (Oct 26): a full-bleed espresso band, the
 * page's H1 as its one Shout, one sentence, and an optional photo on the
 * white scalloped plate. Used by EdPage (About, How it works, How we make money, Partners,
 * Contact, Privacy, Terms...), Compare and Free product.
 *
 *   photo: '/landing/x.webp' string or { src, alt, product: true }
 *     product: true puts a packshot at 70% on the plate (Partners);
 *     otherwise the photo is a round crop inside the plate.
 */
export default function InfoHero({ title, lede, crumb, onBack, backLabel = 'Home', backHref = '/', updated, photo = null, headingRef, children, className = '' }) {
  const ph = typeof photo === 'string' ? { src: photo, alt: '' } : photo;
  const home = (e) => {
    if (!onBack || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onBack(e);
  };
  return (
    <header className={`ay-ih uq-bleed is-ink${ph ? ' has-photo' : ''}${className ? ` ${className}` : ''}`}>
      <div className="ay-ih__copy">
        <nav className="ay-ih__crumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href={onBack ? backHref : '/'} onClick={home}>{onBack ? backLabel : 'Home'}</a></li>
            <li aria-current="page">{crumb || title}</li>
          </ol>
        </nav>
        <Shout size="l" className="ay-ih__h1" tabIndex={headingRef ? -1 : undefined} ref={headingRef}>{title}</Shout>
        {lede && <p className="ay-ih__lede">{lede}</p>}
        {updated && <p className="ay-ih__updated">{updated}</p>}
        {children}
      </div>
      {ph && (
        <div className="ay-ih__plate">
          {ph.product
            ? <Plate src={ph.src} alt={ph.alt || ''} sticker={ph.sticker || null} />
            : <Plate><img className="ay-ih__photo" src={ph.src} alt={ph.alt || ''} loading="eager" style={ph.pos ? { objectPosition: ph.pos } : undefined} /></Plate>}
        </div>
      )}
    </header>
  );
}
