import { useState } from 'react';
import { todayHelp } from '../../health/todayHelp.js';
import './today-plan.css';

/**
 * Home > For today (founder, Nov 11: "for today I logged and it didn't even tell me anything",
 * "For today and Routine need to be severely updated, use the inspo, not vibe coded",
 * "don't overcrowd, use hierarchy").
 *
 * Hierarchy (NN/g progressive disclosure; her inspo boards: one big question, a segmented
 * control, colour-block tiles with one thing each):
 *   1. Not answered yet: the question and three tap rows, nothing else competing.
 *   2. Answered: the rows fold into one summary line; what may help leads.
 *   3. Each help tile: one tip, one main button. Other tips, when to call, links: behind "More".
 * Tapping saves to her log right away. Every tip comes from todayHelp.js (.gov sources).
 */
const QUICK = [
  { id: 'mood', label: 'Mood', values: [1, 2, 3], options: ['Low', 'Okay', 'Good'] },
  { id: 'energy', label: 'Energy', values: [1, 2, 3], options: ['Low', 'Okay', 'Good'] },
  { id: 'pain', label: 'Pain', values: [0, 1, 2, 3], options: ['None', 'Mild', 'Medium', 'Bad'] },
];

function HelpTile({ h, tone, onOpenRead, onExplore, onAddGoal, added }) {
  const [more, setMore] = useState(false);
  const id = `ay-plan-more-${h.id}`;
  const main = h.shop && onExplore ? { label: 'See products', go: () => onExplore(h.shop) } : h.read && onOpenRead ? { label: 'Read more', go: () => onOpenRead(h.read) } : null;
  return (
    <li className={`ay-plan__tile ${tone}`}>
      <h3>{h.title}</h3>
      <p className="ay-plan__lead">{h.tips[0]}</p>
      <div className="ay-plan__acts">
        {main && <button type="button" className="ay-plan__main" onClick={main.go}>{main.label}</button>}
        <button type="button" className="ay-plan__link" aria-expanded={more} aria-controls={id} onClick={() => setMore((v) => !v)}>{more ? 'Less' : 'More'}</button>
      </div>
      <div id={id} className="ay-plan__extra" hidden={!more}>
        {h.tips.length > 1 && <ul className="ay-plan__tips">{h.tips.slice(1).map((tip) => <li key={tip}>{tip}</li>)}</ul>}
        <p className="ay-plan__care">{h.care}</p>
        <p className="ay-plan__links">
          {h.read && onOpenRead && main?.label !== 'Read more' && <button type="button" className="ay-plan__link" onClick={() => onOpenRead(h.read)}>Read more</button>}
          {h.goal && onAddGoal && <button type="button" className="ay-plan__link" disabled={added} onClick={() => onAddGoal(h.goal)}>{added ? 'Added to your goals' : `Make ${h.goalLabel} a goal`}</button>}
        </p>
        <p className="ay-plan__src">From {h.sources.map((s, j) => <span key={s.url}>{j ? ', ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p>
      </div>
    </li>
  );
}

export default function TodayPlan({ entry = null, today, save, pregnant = false, postCycle = false, onOpenLog, onOpenRead, onExplore, onAddGoal, goalsAdded = [] }) {
  const help = todayHelp(entry, { pregnant, postCycle });
  const answered = QUICK.filter((q) => entry?.[q.id] != null);
  const [editing, setEditing] = useState(false);
  const folded = answered.length === QUICK.length && !editing;
  return (
    <section className="ay-plan" aria-labelledby="ay-plan-q">
      {folded ? (
        <div className="ay-plan__sum">
          <h2 id="ay-plan-q" className="ay-plan__q is-small">Today</h2>
          <p>{QUICK.map((q) => `${q.label} ${q.options[q.values.indexOf(entry[q.id])].toLowerCase()}`).join(' · ')}</p>
          <button type="button" className="ay-plan__link" onClick={() => setEditing(true)}>Change</button>
        </div>
      ) : (
        <>
          <h2 id="ay-plan-q" className="ay-plan__q">How are you today?</h2>
          <p className="ay-plan__sub">Three taps. ayna shows what may help.</p>
          <div className="ay-plan__quick">
            {QUICK.map((q) => (
              <div key={q.id} className="ay-plan__row" role="radiogroup" aria-label={q.label}>
                <span className="ay-plan__k" aria-hidden="true">{q.label}</span>
                <div className="ay-plan__seg">
                  {q.values.map((v, i) => {
                    const on = entry?.[q.id] === v;
                    return <button key={v} type="button" role="radio" aria-checked={on} className={on ? 'is-on' : undefined} onClick={() => save?.(today, { [q.id]: on ? null : v })}>{q.options[i]}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="ay-plan__row2">
            {onOpenLog && <button type="button" className="ay-plan__link" onClick={onOpenLog}>Log flow, sleep and more</button>}
            {editing && <button type="button" className="ay-plan__link" onClick={() => setEditing(false)}>Done</button>}
          </div>
        </>
      )}

      {help.length > 0 && (
        <>
          <h2 className="ay-plan__h">What may help today</h2>
          <ul className="ay-plan__tiles">
            {help.map((h, i) => <HelpTile key={h.id} h={h} tone={i % 2 ? 'is-ink' : 'is-pink'} onOpenRead={onOpenRead} onExplore={onExplore} onAddGoal={onAddGoal} added={goalsAdded.includes(h.goal)} />)}
          </ul>
        </>
      )}
    </section>
  );
}
