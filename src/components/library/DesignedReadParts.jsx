import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { inPlace } from './designedRead.js';

/*
 * Shared pieces for Library reads a writer designed as a full page (her own
 * layout, colours and image placement, converted from her HTML file).
 * Each page's root element carries the class "ay-read".
 */

// The site's stylesheets restyle every p, span and card with !important, which
// would repaint her page in the site theme. A shadow root keeps them out, so
// only her own styles apply. The plain read stays in the page (unshown) for
// search engines and screen readers that skip shadow content.
export function ShadowPage({ children, fallback }) {
  const [root, setRoot] = useState(null);
  const hostRef = useCallback((host) => {
    if (host) setRoot(host.shadowRoot || host.attachShadow({ mode: 'open' }));
  }, []);
  return <div ref={hostRef}>{fallback}{root && createPortal(children, root)}</div>;
}

/** "Read next" card at the end of a designed read. */
export function NextRead({ article, onOpen }) {
  if (!article) return null;
  return (
    <a href={`/library/${article.id}`} className="ay-read__next" onClick={inPlace(() => onOpen?.(article.id))} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px', alignItems: 'center', gap: '16px', minHeight: '80px', padding: '18px 20px', border: '2px solid var(--g-fg)', borderRadius: '20px', background: 'var(--g-butter)', color: '#3e2723', boxShadow: '4px 4px 0 #f7badd', textDecoration: 'none', font: "700 19px/1.3 'Figtree'" }}>
      {article.title}
      <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: '44px', height: '44px', borderRadius: '50%', background: '#3e2723', color: '#ffedac', font: "700 18px/1 'Figtree'" }}>→</span>
    </a>
  );
}

const AVATAR = { display: 'grid', placeItems: 'center', flex: 'none', width: '44px', height: '44px', borderRadius: '50%', background: '#f7badd', color: '#3e2723', font: "400 20px/1 'ayna Display',serif" };
const KICKER = { font: "700 13px/1.2 'Figtree'", letterSpacing: 0, textTransform: 'none', color: 'var(--g-pink)' };
const NAME = { font: "700 16px/1.3 'Figtree'" };

// The OB-GYN who reviews the medical reads (founders' wording, 2026-10-19).
export function ReviewerVyas() {
  return <>Dr. Anuja Vyas, Board-Certified OBGYN, Co-founder of <a href="/partners#brand-buni" style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>BUNI Body</a></>;
}

/** "Reviewed by" then "Written by", under the title. */
export function Credits({ reviewer, reviewerInitial, writer, writerInitial }) {
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      {[['Reviewed by', reviewerInitial, reviewer], ['Written by', writerInitial, writer]].map(([label, initial, who]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span aria-hidden="true" style={AVATAR}>{initial}</span>
          <span style={{ display: 'grid', gap: '4px' }}><span style={KICKER}>{label}</span><strong style={NAME}>{who}</strong></span>
        </div>
      ))}
    </div>
  );
}
