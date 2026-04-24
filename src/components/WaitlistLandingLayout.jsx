import React from 'react';

/**
 * Matches ayna_waitlist: fixed soft coral base + dark wash (no background photo in source).
 * @see https://github.com/pulomabishnu/ayna_waitlist/blob/main/index.html
 */
export default function WaitlistLandingLayout({ children, className = '' }) {
  return (
    <div
      className={`ayna-landing ${className}`.trim()}
      data-landing
    >
      <div className="ayna-landing__bg" aria-hidden />
      <div className="ayna-landing__overlay" aria-hidden />
      <div className="ayna-landing__content container">
        {children}
      </div>
    </div>
  );
}
