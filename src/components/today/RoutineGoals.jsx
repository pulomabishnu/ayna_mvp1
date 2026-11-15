import { useEffect, useState } from 'react';
import { readGoals, toggleDone, moveGoal, weekFor, GOALS_CHANGED_EVENT } from '../../health/myGoals.js';
import { haptic } from '../../utils/haptics.js';

/**
 * Her goals at the top of the Routine tab (run-through, Nov 12, Puloma: "link goals directly to the
 * routine tab"). Same goals and ticks as For today (myGoals.js), so ticking here ticks there too.
 * Shows nothing until she has a goal.
 */
export default function RoutineGoals({ today, log = {} }) {
  const [goals, setGoals] = useState(() => { try { return readGoals(); } catch { return []; } });
  useEffect(() => {
    const on = () => { try { setGoals(readGoals()); } catch { /* storage blocked */ } };
    window.addEventListener(GOALS_CHANGED_EVENT, on);
    return () => window.removeEventListener(GOALS_CHANGED_EVENT, on);
  }, []);
  if (!goals.length || !today) return null;
  return (
    <section className="ay-rg" aria-labelledby="ay-rg-h">
      <h3 id="ay-rg-h">Your goals today</h3>
      <ul>
        {goals.map((g, i) => {
          const w = weekFor(g, log, today);
          return (
            <li key={g.id}>
              {goals.length > 1 && (
                // Zoleka, focus group 11/11: "let people edit and rearrange". Up and down, one tap each.
                <span className="ay-rg__move">
                  <button type="button" disabled={i === 0} aria-label={`Move ${g.text} up`} onClick={() => setGoals(moveGoal(g.id, -1))}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg></button>
                  <button type="button" disabled={i === goals.length - 1} aria-label={`Move ${g.text} down`} onClick={() => setGoals(moveGoal(g.id, 1))}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></button>
                </span>
              )}
              <span><b>{g.text}</b><small>{w.count} {w.count === 1 ? 'day' : 'days'} this week</small></span>
              <button type="button" className={`ay-rg__tick${w.doneToday ? ' is-on' : ''}`} aria-pressed={w.doneToday} aria-label={`${g.text}: did it today`}
                onClick={() => { haptic(w.doneToday ? 'light' : 'success'); setGoals(toggleDone(g.id, today)); }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
