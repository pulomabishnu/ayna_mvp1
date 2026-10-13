import React from 'react';
import '../styles/audit-info.css';

/**
 * Shared shell for the secondary info / legal pages (About, How It Works,
 * How We Make Money, Brand Partnerships, Contact, Privacy, Terms, Screenings,
 * Recalls, Text ayna). One header with the page's only H1, then sections that
 * each use InfoSection's H2. Styles live in src/styles/audit-info.css.
 *
 * The medical disclaimer is NOT repeated here: it lives once in SiteFooter.
 */
export function InfoPage({ eyebrow, title, lede, onBack, width = 'default', className = '', aside, children }) {
  return (
    <div className={`ay-info ay-info--${width}${className ? ` ${className}` : ''}`}>
      <header className={`ay-info__head${aside ? ' ay-info__head--split' : ''}`}>
        <div className="ay-info__head-main">
          {onBack && (
            <button type="button" className="ay-info__back" onClick={onBack}>
              <span aria-hidden="true">←</span> Back
            </button>
          )}
          {eyebrow && <span className="ay-info__eyebrow">{eyebrow}</span>}
          <h1 className="ay-info__title">{title}</h1>
          {lede && <p className="ay-info__lede">{lede}</p>}
        </div>
        {aside}
      </header>
      {children}
    </div>
  );
}

export function InfoSection({ eyebrow, title, intro, children, className = '' }) {
  return (
    <section className={`ay-info__section${className ? ` ${className}` : ''}`}>
      {(eyebrow || title || intro) && (
        <div className="ay-info__section-head">
          {eyebrow && <span className="ay-info__eyebrow ay-info__eyebrow--sm">{eyebrow}</span>}
          {title && <h2 className="ay-info__h2">{title}</h2>}
          {intro && <p className="ay-info__intro">{intro}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export default InfoPage;
