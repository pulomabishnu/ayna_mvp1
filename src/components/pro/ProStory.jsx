import { useEffect, useState } from 'react';
import './pro-story.css';

/*
 * What Pro includes, as a story (founder, Oct 28: "instead of all that text it can do like a slideshow,
 * kinda like an insta story, with different icons and short titles about the features, and there could
 * be a page to read more"). One feature a slide: an icon, a short title, one line. Segments at the top
 * show where you are; tap the right half (or the arrow) for next, the left half for back. It advances on
 * its own every few seconds, pauses on hover or focus, and never moves under reduced motion or Pause
 * motion. Every claim matches src/pro/plans.js and src/pro/features.js.
 */

const I = {
  dash: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 8 8" strokeWidth="3" /><path d="M8.5 13.5l2-2 2 2 3-3.5" /></>,
  watch: <><rect x="7" y="6" width="10" height="12" rx="3" /><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v2.5l1.5 1" /></>,
  trend: <><path d="M4 18h16" /><path d="M5 15l4-4 3 3 6-7" /><path d="M15 7h3v3" /></>,
  book: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z" /></>,
  chat: <><path d="M5 5h14v10H10l-5 4V5Z" /><path d="M9 9.5h6M9 12h4" /></>,
  infinity: <><path d="M7 15.5c-2 0-3.5-1.6-3.5-3.5S5 8.5 7 8.5c3.5 0 6.5 7 10 7 2 0 3.5-1.6 3.5-3.5S19 8.5 17 8.5c-3.5 0-6.5 7-10 7Z" /></>,
};

const PRO_STORY = [
  { id: 'dashboard', icon: 'dash', tone: 'ink', t: 'Your health dashboard', d: 'Cycle, sleep and activity, together in one place.', match: ['dashboard'] },
  { id: 'connect', icon: 'watch', tone: 'pink', t: 'Connect your health data', d: 'Apple Health, Health Connect and Oura. You choose what to share.', match: ['wearables', 'health'] },
  { id: 'deeper', icon: 'trend', tone: 'butter', t: 'Patterns over time', d: 'Deeper insights and trends, not single data points.', match: ['insights', 'tracking'] },
  { id: 'reads', icon: 'book', tone: 'pink', t: 'Every Read', d: 'The whole Library, with sources. Free has one a week.', match: ['reads'] },
  { id: 'ask', icon: 'chat', tone: 'ink', t: '50 Ask ayna chats a month', d: 'Ten times the free plan.', match: ['ask'] },
  { id: 'more', icon: 'infinity', tone: 'butter', t: 'Fewer limits', d: 'Retake the quiz and make playlists whenever you want.', match: ['quiz', 'playlists'] },
];

const motionOff = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('ay-motion-paused'); } catch { return true; }
};

export default function ProStory({ feature = '', moreHref = '/pro', seconds = 4 }) {
  const startAt = Math.max(0, PRO_STORY.findIndex((s) => s.match.includes(feature)));
  const [i, setI] = useState(startAt);
  const [paused, setPaused] = useState(false);
  const [still] = useState(motionOff);
  const n = PRO_STORY.length;
  const go = (d) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    if (paused || still) return undefined;
    const t = window.setTimeout(() => setI((x) => (x + 1) % n), seconds * 1000);
    return () => window.clearTimeout(t);
  }, [i, paused, n, seconds]);

  const s = PRO_STORY[i];
  return (
    <section className="ps" aria-roledescription="carousel" aria-label="What ayna Pro includes"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="ps__bars" aria-hidden="true">
        {PRO_STORY.map((x, k) => <span key={x.id} className={k < i ? 'is-done' : k === i ? `is-on${paused || still ? ' is-still' : ''}` : ''} style={k === i ? { '--ps-dur': `${seconds}s` } : undefined}><i key={`${x.id}-${i}`} /></span>)}
      </div>
      <div className={`ps__slide is-${s.tone}`} aria-live="polite" aria-atomic="true">
        <span className="ps__icon" aria-hidden="true"><svg viewBox="0 0 24 24">{I[s.icon]}</svg></span>
        <p className="ps__count">{i + 1} of {n}</p>
        <h3 className="ps__t">{s.t}</h3>
        <p className="ps__d">{s.d}</p>
        <button type="button" className="ps__tap is-back" onClick={() => go(-1)} aria-label="Previous feature" />
        <button type="button" className="ps__tap is-next" onClick={() => go(1)} aria-label="Next feature" />
      </div>
      <div className="ps__foot">
        <a className="ps__more" href={moreHref}>See everything in Pro<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a>
        <span className="ps__arrows">
          <button type="button" onClick={() => go(-1)} aria-label="Previous feature"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg></button>
          <button type="button" onClick={() => go(1)} aria-label="Next feature"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></button>
        </span>
      </div>
    </section>
  );
}
