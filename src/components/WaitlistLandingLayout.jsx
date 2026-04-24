import React from 'react';

const DEFAULT_BG = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=2000&auto=format&fit=crop';

/**
 * Full-bleed waitlist-style shell: photo, warm/amber wash, glass-ready typography scope.
 * @param {string} [photoUrl] — optional override; replace with a local /public asset if preferred.
 */
export default function WaitlistLandingLayout({ children, photoUrl = DEFAULT_BG, className = '' }) {
  return (
    <div
      className={`ayna-landing ${className}`.trim()}
      data-landing
    >
      <div
        className="ayna-landing__photo"
        style={{ backgroundImage: `url(${photoUrl})` }}
        aria-hidden
      />
      <div className="ayna-landing__wash" aria-hidden />
      <div className="ayna-landing__content container">
        {children}
      </div>
    </div>
  );
}
