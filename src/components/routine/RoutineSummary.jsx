import { useRoutines } from './useRoutines.js';
import './routine.css';

/**
 * Her routines, short, for Today (team direction 3 and 70). Mount it where
 * Today wants it; it needs nothing from Today's own state. Shows each active
 * need's Start here (names and when), and links to the full routine in
 * My Ecosystem. Renders nothing when she has no routine yet.
 *
 * Props: userId, quizAnswers, matchOpts, products (her routine products),
 * saved, omitted, needs (optional: Today's decision.debug.needs), variant
 * 'app' | 'web', onOpenRoutine(), onOpenProduct(product), onCheckIn().
 */
export default function RoutineSummary({ variant = 'app', onOpenRoutine, onOpenProduct, onCheckIn, max = 2, ...source }) {
  const { routines } = useRoutines(source);
  if (!routines.length) return null;
  const list = routines.slice(0, max);
  return (
    <section className={`ay-rxr ay-rxs is-${variant}`} aria-labelledby={`ay-rxs-h-${variant}`}>
      <div className="ay-rxs__head">
        <h2 id={`ay-rxs-h-${variant}`}>{list.length === 1 ? list[0].title : 'Your routines'}</h2>
        {onOpenRoutine && <button type="button" className="ay-rx__link" onClick={onOpenRoutine}>See your routine</button>}
      </div>
      {list.map((r) => (
        <div key={r.need} className="ay-rxs__one">
          {list.length > 1 && <h3>{r.title}</h3>}
          <p className="ay-rx__kicker">Start here</p>
          <ul className="ay-rxs__list">
            {r.start.map((it) => (
              <li key={it.key}>
                {it.kind === 'product' && onOpenProduct
                  ? <button type="button" className="ay-rx__namebtn" onClick={() => onOpenProduct(it.product)}>{it.title}</button>
                  : <b>{it.title}</b>}
                <span>{[it.when, it.horizon ? `try for ${it.horizon.label}` : ''].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
            <li className="is-track">
              <b>{r.track.title}</b>
              <span>About 30 seconds{onCheckIn ? ' · ' : ''}{onCheckIn && <button type="button" className="ay-rx__link" onClick={onCheckIn}>Check in</button>}</span>
            </li>
          </ul>
        </div>
      ))}
    </section>
  );
}
