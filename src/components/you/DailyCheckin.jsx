import React, { useState } from 'react';
import { LOG_FIELDS, lastWeek, todayKey, weekTakeaway } from '../../health/dailyLog.js';
import { useDailyLog } from '../../health/useDailyLog.js';
import { todayHelp } from '../../health/todayHelp.js';

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
// After menopause there is no cycle to track (team direction 14): no PMS, and
// flow becomes "Bleeding", kept because any bleeding then is worth a care check.
const POST_CYCLE_LABELS = { flow: 'Bleeding' };
const POST_CYCLE_HIDDEN = new Set(['pms']);

export function DailyCheckinCard({ variant = 'web', log, save, saveState = 'idle', today: todayProp = null, headingId = 'wy-checkin-h', title = 'Today', noCycle = false, pregnant = false, onOpenRead = null, onExplore = null, onAddGoal = null }) {
  const app = variant === 'app';
  const today = todayProp || todayKey();
  const todays = log[today] || {};
  const [more, setMore] = useState(() => todays.mood != null || todays.skin != null || todays.energy != null);
  const help = todayHelp(todays, { pregnant, postCycle: noCycle });
  const [goalsAdded, setGoalsAdded] = useState({});
  const pick = (fieldId, value) => save(today, { [fieldId]: todays[fieldId] === value ? null : value });
  const loggedWeek = lastWeek(log, 'day', today).map((d) => ({ day: d.day, logged: Boolean(log[d.day] && LOG_FIELDS.some((f) => log[d.day][f.id] != null)) }));
  // "What kind of pain" sits right under Pain, only once she logged some pain.
  const painKnown = todays.pain != null && todays.pain >= 1;
  const ordered = LOG_FIELDS.filter((f) => !f.follows).flatMap((f) => [f, ...LOG_FIELDS.filter((x) => x.follows === f.id)]);
  const rows = ordered.filter((f) => (f.follows ? f.follows === 'pain' && painKnown : f.primary || more) && !(noCycle && POST_CYCLE_HIDDEN.has(f.id)))
    .map((f) => (noCycle && POST_CYCLE_LABELS[f.id] ? { ...f, label: POST_CYCLE_LABELS[f.id] } : f));
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
        {/* Founder, Nov 11: what she logged today brings things that may help, right here. */}
        {help.length > 0 && (
          <div className="ay-checkin__help" aria-live="polite">
            {help.map((h) => (
              <section key={h.id} className="ay-checkin__helpcard" aria-label={h.title}>
                <h3>{h.title}</h3>
                <ul>{h.tips.map((t) => <li key={t}>{t}</li>)}</ul>
                <p className="ay-checkin__helpcare">{h.care}</p>
                <p className="ay-checkin__helplinks">
                  {h.read && onOpenRead && <button type="button" onClick={() => onOpenRead(h.read)}>Read more</button>}
                  {h.shop && onExplore && <button type="button" onClick={() => onExplore(h.shop)}>See products</button>}
                  {/* Founder, Nov 11: "maybe it adds a goal to raise your mood": one tap adds it, and matches follow. */}
                  {h.goal && onAddGoal && (goalsAdded[h.goal]
                    ? <span className="ay-checkin__helpdone" role="status">Added to your goals</span>
                    : <button type="button" onClick={() => { onAddGoal(h.goal); setGoalsAdded((g) => ({ ...g, [h.goal]: true })); }}>Make {h.goalLabel} a goal</button>)}
                </p>
                <p className="ay-checkin__helpsrc">Source: {h.sources.map((s, i) => <React.Fragment key={s.url}>{i ? ', ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></React.Fragment>)}</p>
              </section>
            ))}
          </div>
        )}
        {noCycle && <p className="ay-checkin__takeaway ay-checkin__note">Any bleeding after menopause is worth logging and checking with a clinician.</p>}
        <div className="ay-checkin__foot">
          <button type="button" className="ay-checkin__more" aria-expanded={more} onClick={() => setMore((v) => !v)}>{more ? 'Less' : 'More: mood, skin and energy'}</button>
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
