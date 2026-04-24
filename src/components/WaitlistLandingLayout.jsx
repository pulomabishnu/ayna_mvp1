import React from 'react';

/**
 * Waitlist tokens (coral base + wash) with a full-bleed motion-blur wellness photo.
 * Photo: public/landing-bg.png (asset from product; same waitlist overlay on top).
 */
export default function WaitlistLandingLayout({ children, className = '' }) {
  return (
    <div
      className={`ayna-landing ${className}`.trim()}
      data-landing
    >
      <div className="ayna-landing__bg" aria-hidden />
      <div className="ayna-landing__photo" aria-hidden />
      <div className="ayna-landing__overlay" aria-hidden />
      <div className="ayna-landing__content container">
        {children}
      </div>
    </div>
  );
}
