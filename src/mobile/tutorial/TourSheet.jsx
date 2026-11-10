import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * The whole tour on one sheet (focus group, Nov 9: "a tutorial all at once,
 * not little labels every time I tap something"). Offered once on Home and
 * from Settings > Show the tour. Read it, close it, done. Nothing pops up
 * later unless she turns page tips on in Settings.
 */
export const TOUR_SECTIONS = [
  { title: 'Home', items: [
    'Your cycle, sleep and activity sit at the top. Tap a ring for more.',
    'Rundown plays your 60-second Daily Rundown.',
    'Your data and Your products each open in one tap.',
    'Log your period and symptoms from the log card, once a day.',
  ] },
  { title: 'Your matches', items: [
    'Your products, in Home, lists every match by what it helps with.',
    'Tap any match to see why it fits you, what is in it and what people say.',
    'Change your quiz answers anytime: You, then My health, then Health profile. Or ask ayna to add something.',
  ] },
  { title: 'Shop and Services', items: [
    'Search products, brands and care by need. Each one shows how well it fits you.',
    'Tap Compare to see 2 to 4 products side by side.',
  ] },
  { title: 'Ask ayna', items: [
    'Ask anything, type or use the mic. ayna answers from your profile and checked sources.',
  ] },
  { title: 'Community and Library', items: [
    'Questions, reviews and playlists from members. Post anonymously if you like.',
    'Reads by symptom, product or topic.',
  ] },
  { title: 'You', items: [
    'Your profile, saved products, health data and Settings.',
    'Settings has this tour again, and page tips if you want them.',
  ] },
];

export default function TourSheet({ onClose, theme = 'light' }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('button')?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="ay-tour is-app is-sheet" data-theme={theme}>
      <div className="ay-tour__dim is-soft" aria-hidden="true" onClick={onClose} />
      <section ref={ref} className="ay-tour__card ay-tour__all" role="dialog" aria-modal="true" aria-labelledby="ay-tour-all-h">
        <header className="ay-tour__all-head">
          <h2 id="ay-tour-all-h">How ayna works</h2>
          <button type="button" className="ay-tour__x" aria-label="Close the tour" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </header>
        <div className="ay-tour__all-body">
          {TOUR_SECTIONS.map((s) => (
            <section key={s.title} className="ay-tour__all-sec">
              <h3>{s.title}</h3>
              <ul>{s.items.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          ))}
        </div>
        <button type="button" className="ay-tour__go" onClick={onClose}>Got it</button>
      </section>
    </div>,
    document.body,
  );
}
