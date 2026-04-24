import React from 'react';

/**
 * Waitlist tokens (coral base + wash) with a full-bleed motion-blur wellness photo.
 * Photo: public/landing-bg.png (asset from product; same waitlist overlay on top).
 * @param {boolean} [fullViewport] — true for edge-to-edge height (e.g. welcome intro with nav hidden)
 */
export default function WaitlistLandingLayout({ children, className = '', fullViewport = false }) {
  return (
    <div
      className={[
        'ayna-landing',
        fullViewport ? 'ayna-landing--full-viewport' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-landing
      data-full-viewport={fullViewport ? 'true' : undefined}
    >
      <div className="ayna-landing__bg" aria-hidden />
      <div className="ayna-landing__photo" aria-hidden />
      <div className="ayna-landing__overlay" aria-hidden />
      <div
        className={[
          'ayna-landing__content',
          'container',
          fullViewport ? 'ayna-landing__content--full-bleed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
