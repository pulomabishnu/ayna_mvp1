import { todayHelp } from '../../health/todayHelp.js';
import './today-plan.css';

/**
 * Home > For today (founder, Nov 11: "for today I logged and it didn't even tell me anything",
 * "For today and Routine need to be severely updated, use the inspo, not vibe coded").
 *
 * From her inspo boards: one big question ("How are you feeling today?"), answers as a
 * segmented control (the lb/kg toggle), then colour-block tiles (pink, brown) with one clear
 * thing per tile. Tapping an answer saves to her log right away and the tiles change at once,
 * so logging always gives her something back. Every tip comes from todayHelp.js (.gov sources).
 */
const QUICK = [
  { id: 'mood', label: 'Mood', values: [1, 2, 3], options: ['Low', 'Okay', 'Good'] },
  { id: 'energy', label: 'Energy', values: [1, 2, 3], options: ['Low', 'Okay', 'Good'] },
  { id: 'pain', label: 'Pain', values: [0, 1, 2, 3], options: ['None', 'Mild', 'Medium', 'Bad'] },
];

export default function TodayPlan({ entry = null, today, save, pregnant = false, postCycle = false, onOpenLog, onOpenRead, onExplore, onAddGoal, goalsAdded = [] }) {
  const help = todayHelp(entry, { pregnant, postCycle });
  const answered = QUICK.filter((q) => entry?.[q.id] != null).length;
  return (
    <section className="ay-plan" aria-labelledby="ay-plan-q">
      <h2 id="ay-plan-q" className="ay-plan__q">{answered ? 'Today, so far' : 'How are you today?'}</h2>
      <p className="ay-plan__sub">{answered ? 'Change an answer any time. ayna updates what may help.' : 'Three taps. ayna shows what may help today.'}</p>
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
      {onOpenLog && <button type="button" className="ay-plan__more" onClick={onOpenLog}>Log flow, sleep and more<span aria-hidden="true"> ›</span></button>}

      {help.length > 0 && (
        <ul className="ay-plan__tiles" aria-label="What may help today">
          {help.map((h, i) => (
            <li key={h.id} className={`ay-plan__tile ${i % 2 ? 'is-ink' : 'is-pink'}`}>
              <h3>{h.title}</h3>
              <p className="ay-plan__lead">{h.tips[0]}</p>
              {h.tips.length > 1 && <ul className="ay-plan__tips">{h.tips.slice(1).map((tip) => <li key={tip}>{tip}</li>)}</ul>}
              <p className="ay-plan__care">{h.care}</p>
              <div className="ay-plan__acts">
                {h.read && onOpenRead && <button type="button" onClick={() => onOpenRead(h.read)}>Read more</button>}
                {h.shop && onExplore && <button type="button" onClick={() => onExplore(h.shop)}>See products</button>}
                {h.goal && onAddGoal && <button type="button" disabled={goalsAdded.includes(h.goal)} onClick={() => onAddGoal(h.goal)}>{goalsAdded.includes(h.goal) ? 'Added to your goals' : `Make ${h.goalLabel} a goal`}</button>}
              </div>
              <p className="ay-plan__src">From {h.sources.map((s, j) => <span key={s.url}>{j ? ', ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
