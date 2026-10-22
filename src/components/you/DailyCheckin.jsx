import React, { useState } from 'react';
import { CHECKIN_ITEMS, dayKey, lastWeek, readCheckins, saveCheckin, weekTakeaway } from '../../health/dailyCheckin.js';

/*
 * You: the daily 3-tap check-in (sleep, mood, skin). A takeaway line on top,
 * three rows of three choices, and a 7-day dot row per item. Only on this
 * device. Shared look: ay-group card, ay-chip choices, brand colours only.
 */
export default function DailyCheckin({ variant = 'web' }) {
  const app = variant === 'app';
  const [all, setAll] = useState(() => readCheckins());
  const today = dayKey();
  const todays = all[today] || {};
  const pick = (itemId, score) => setAll(saveCheckin(itemId, todays[itemId] === score ? null : score));
  return (
    <section className={app ? 'ay-you-section' : 'wy-sec'} aria-labelledby="wy-checkin-h">
      <div className={app ? 'ay-checkin__head' : 'wy-sec__head'}>
        <h2 className={app ? 'ay-you-h2' : 'ay-group__title'} id="wy-checkin-h">Today</h2>
        <span className={app ? 'ay-checkin__private' : 'wy-count'}>Only you can see this</span>
      </div>
      <div className="ay-group is-padded ay-checkin">
        <p className="ay-checkin__takeaway">{weekTakeaway(all)}</p>
        {CHECKIN_ITEMS.map((item) => {
          const week = lastWeek(all, item.id);
          return (
            <div key={item.id} className="ay-checkin__row" role="group" aria-labelledby={`ay-checkin-${item.id}`}>
              <span className="ay-checkin__label" id={`ay-checkin-${item.id}`}>{item.label}</span>
              <span className="ay-checkin__opts">
                {item.options.map((label, i) => (
                  <button key={label} type="button" className="ay-chip" aria-pressed={todays[item.id] === i + 1} onClick={() => pick(item.id, i + 1)}>{label}</button>
                ))}
              </span>
              <span className="ay-checkin__week" aria-label={`${item.label}, last 7 days: ${week.map((d) => (d.score ? item.options[d.score - 1] : 'no answer')).join(', ')}`}>
                {week.map((d) => <i key={d.day} className={d.score ? `is-${d.score}` : 'is-empty'} aria-hidden="true" />)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
