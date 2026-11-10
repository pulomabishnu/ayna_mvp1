import { useState } from 'react';
import './pdp-stack.css';

/**
 * The product page's four views as one card stack (founder, Nov 9-10 mockup, "like Apple
 * Wallet"): ayna summary, Clinical opinion, Scientific literature, Reviews. Every name shows;
 * tapping a card lifts it and opens it in place (nothing reorders). Brown, pink, brown, pink.
 * The content inside each card is the same content the tabs showed, on a butter panel.
 */
const ICONS = {
  summary: 'M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z',
  clinical: 'M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2M20 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  literature: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M8 14h8',
  reviews: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
};

export default function PdpStack({ cards = [], initial = 'summary', active, onChange = null, onOpen = null }) {
  // Controlled when the page passes `active` (so "Read the clinical opinion" can open a card).
  const [own, setOwn] = useState(initial);
  const open = active === undefined ? own : active;
  const setOpen = (id) => { if (active === undefined) setOwn(id); onChange?.(id); };
  const lift = (id) => window.requestAnimationFrame(() => {
    const el = document.querySelector(`.ay-stack__card[data-card="${id}"]`);
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  return (
    <section className="ay-stack" aria-label="ayna summary, clinical opinion, scientific literature and reviews">
      {cards.map((c, i) => {
        const on = c.id === open;
        return (
          <div key={c.id} className={`ay-stack__card is-${i % 2 ? 'pink' : 'ink'}${on ? ' is-open' : ''}`} style={{ zIndex: i + 1 }} data-card={c.id}>
            <button type="button" className="ay-stack__head" aria-expanded={on} aria-controls={`ay-stack-${c.id}`}
              onClick={() => { const next = on ? null : c.id; setOpen(next); if (next) { onOpen?.(next); lift(next); } }}>
              <span className="ay-stack__ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={ICONS[c.id] || ICONS.summary} /></svg></span>
              <b>{c.title}</b>
              {c.tag && <span className="ay-stack__tag">{c.tag}</span>}
              <svg className="ay-stack__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div className="ay-stack__body" id={`ay-stack-${c.id}`} role="region" aria-label={c.title} hidden={!on || undefined}>
              <div className={`ay-stack__panel${c.panelClass ? ` ${c.panelClass}` : ""}`}>{c.body}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
