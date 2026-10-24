import React, { useState } from 'react';
import { LOG_FIELDS, lastWeek, todayKey, weekTakeaway } from '../../health/dailyLog.js';
import { useDailyLog } from '../../health/useDailyLog.js';

/*
 * You: the daily log. One card, a few taps a day: pain, flow, PMS and sleep,
 * with mood and skin behind "More". Each row is one tap; tap again to clear,
 * or skip it. Kept on this device signed out and offline, synced to her
 * account when signed in (src/health/useDailyLog.js). A takeaway line on
 * top and a 7-day row of the days she logged. Shared look: ay-group card,
 * ay-chip choices, brand colours only.
 */
const SAVE_TEXT = {
  idle: '',
  saving: 'Saving',
  saved: 'Saved',
  saved_device: 'Saved on this device',
  pending: 'Saved on this device. It syncs when you’re back online.',
};

export default function DailyCheckin({ variant = 'web', userId = null }) {
  const { log, save, saveState } = useDailyLog(userId);
  return <DailyCheckinCard variant={variant} log={log} save={save} saveState={saveState} />;
}

/** The card itself, for screens that already hold the log (Today: src/components/today/TodayFeed.jsx). */
export function DailyCheckinCard({ variant = 'web', log, save, saveState = 'idle', today: todayProp = null, headingId = 'wy-checkin-h', title = 'Today' }) {
  const app = variant === 'app';
  const today = todayProp || todayKey();
  const todays = log[today] || {};
  const [more, setMore] = useState(() => todays.mood != null || todays.skin != null);
  const pick = (fieldId, value) => save(today, { [fieldId]: todays[fieldId] === value ? null : value });
  const loggedWeek = lastWeek(log, 'day', today).map((d) => ({ day: d.day, logged: Boolean(log[d.day] && LOG_FIELDS.some((f) => log[d.day][f.id] != null)) }));
  const rows = LOG_FIELDS.filter((f) => f.primary || more);
  return (
    <section className={app ? 'ay-you-section' : 'wy-sec'} aria-labelledby={headingId}>
      <div className={app ? 'ay-checkin__head' : 'wy-sec__head'}>
        <h2 className={app ? 'ay-you-h2' : 'ay-group__title'} id={headingId}>{title}</h2>
        <span className={app ? 'ay-checkin__private' : 'wy-count'}>Only you can see this</span>
      </div>
      <div className="ay-group is-padded ay-checkin">
        <p className="ay-checkin__takeaway">{weekTakeaway(log, today)}</p>
        {rows.map((field) => (
          <div key={field.id} className="ay-checkin__row" role="group" aria-labelledby={`ay-checkin-${field.id}`}>
            <span className="ay-checkin__label" id={`ay-checkin-${field.id}`}>{field.label}</span>
            <span className="ay-checkin__opts">
              {field.values.map((value, i) => (
                <button key={String(value)} type="button" className="ay-chip" aria-pressed={todays[field.id] === value} onClick={() => pick(field.id, value)}>{field.options[i]}</button>
              ))}
            </span>
          </div>
        ))}
        <div className="ay-checkin__foot">
          <button type="button" className="ay-checkin__more" aria-expanded={more} onClick={() => setMore((v) => !v)}>{more ? 'Less' : 'More: mood and skin'}</button>
          <span className="ay-checkin__status" role="status" aria-live="polite">{SAVE_TEXT[saveState] || ''}</span>
        </div>
        <div className="ay-checkin__weekrow">
          <span className="ay-checkin__label">This week</span>
          <span className="ay-checkin__week" aria-label={`Days logged this week: ${loggedWeek.filter((d) => d.logged).length} of 7`}>
            {loggedWeek.map((d) => <i key={d.day} className={d.logged ? 'is-3' : 'is-empty'} aria-hidden="true" />)}
          </span>
        </div>
      </div>
    </section>
  );
}
