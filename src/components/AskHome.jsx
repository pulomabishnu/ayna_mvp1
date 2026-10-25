import { haptic } from '../utils/haptics.js';
import '../styles/ask-home.css';

/**
 * Ask ayna's first screen, the same on the app sheet and the website panel.
 * From the founder's Cooper reference (cefbab0a), rebuilt in ayna's inks:
 * a hello line, the starter questions as a plain list of rows (one "New";
 * master prompt 154: no bento), recent questions, and one curved-text ribbon
 * as the page's single seal.
 * A row is asked as soon as she taps it (founder, Oct 24 22:17).
 */

const ICONS = {
  week: <><path d="M3 12h4l2-5 4 10 2-5h6" /></>,
  match: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></>,
  cramps: <><path d="M12 20s-7-4.3-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.7 12 20 12 20z" /></>,
  safety: <><path d="M12 3l7 3v5.5c0 4.4-3 7.7-7 9.5-4-1.8-7-5.1-7-9.5V6z" /><path d="M9 12l2 2 4-4" /></>,
  heavy: <><path d="M12 3.5c3 4.2 5.5 7.4 5.5 10.5a5.5 5.5 0 0 1-11 0c0-3.1 2.5-6.3 5.5-10.5z" /></>,
  leaf: <><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" /><path d="M5 19l7-7" /></>,
  chat: <><path d="M5 6h14v9H9l-4 3.5z" /></>,
};

export function AskIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[name] || ICONS.chat}</svg>;
}

/** The one seal: a wavy band with curved text across the top corner. Decorative. */
export function AskRibbon() {
  const phrase = 'ask ayna · real research · your own data · ';
  return (
    <svg className="ay-askh-ribbon" viewBox="0 0 400 56" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <path id="ay-askh-wave" d="M-20 40 C 60 40, 90 14, 170 14 S 300 42, 420 18" />
      <path className="ay-askh-band" d="M-20 40 C 60 40, 90 14, 170 14 S 300 42, 420 18" />
      <text><textPath href="#ay-askh-wave" startOffset="4%" dominantBaseline="middle">{phrase.repeat(3)}</textPath></text>
    </svg>
  );
}

/** Her numbers that went with a dashboard question, shown back in the answer. Real values only. */
export function AskStatCard({ stats }) {
  if (!stats?.length) return null;
  return (
    <figure className="ay-askh-stats">
      <figcaption>Your numbers ayna read</figcaption>
      <ul>
        {stats.map((s) => <li key={s.label}><b>{s.value}</b><small>{s.label}</small></li>)}
      </ul>
    </figure>
  );
}

export default function AskHome({ name = '', intro = '', note = '', tiles = [], recent = [], onPick, onContinue = null }) {
  return (
    <div className="ay-askh">
      <AskRibbon />
      <div className="ay-askh-hello">
        <h2>{name ? `Hello, ${name}` : 'Hello'}</h2>
        {intro && <p>{intro}</p>}
      </div>
      <ul className="ay-askh-list" aria-label="Questions to start with">
        {tiles.map((t, i) => (
          <li key={t.label} className={`is-${t.tone || 'group'}`} style={{ '--i': i }}>
            <button type="button" onClick={() => { haptic('selection'); onPick(t.question); }}>
              <span className="ay-askh-icon"><AskIcon name={t.icon} /></span>
              <span className="ay-askh-list-text">
                <span className="ay-askh-tile-label">{t.label}{t.isNew && <span className="ay-askh-new">New</span>}</span>
                {t.sub && <small>{t.sub}</small>}
              </span>
              <svg className="ay-askh-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </li>
        ))}
      </ul>
      {(recent.length > 0 || onContinue) && (
        <section className="ay-askh-recent" aria-labelledby="ay-askh-recent-title">
          <div className="ay-askh-recent-head">
            <h3 id="ay-askh-recent-title">Recent questions</h3>
            {onContinue && <button type="button" onClick={onContinue}>Open chat</button>}
          </div>
          <ul>
            {recent.map((q, i) => (
              <li key={q}>
                <button type="button" onClick={() => onPick(q)}>
                  <span className={`ay-askh-sq is-${['pink', 'sky', 'ink', 'butter'][i % 4]}`}><AskIcon name="chat" /></span>
                  <span className="ay-askh-q">{q}</span>
                  <span className="ay-askh-again">Ask again</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {note && <p className="ay-askh-note">{note}</p>}
    </div>
  );
}
