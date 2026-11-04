import { useState } from 'react';
import { DEFAULT_RUNDOWN_TIME, PUSH_ASK_EVENT, RUNDOWN_TIMES, applyRundownPref, bookTomorrow, readRundownPush, timeLabel, writeRundownPush } from './rundownPush.js';
import { eventSurface, trackNotificationPrompt } from '../../utils/analyticsEvents.js';

const RESULT = {
  scheduled: (t) => `Done. You’ll get it every day at ${t}.`,
  denied: () => 'Notifications are off for ayna on this phone. Turn them on in your phone’s Settings, then here.',
  unavailable: () => 'Saved. Reminders come through the ayna app on your phone.',
  off: () => 'Daily Rundown reminders are off.',
  signed_out: () => 'Saved on this device. Sign in so ayna can send it to your phone.',
  offline: () => 'You are offline, so we could not set it yet. We will try after your next Rundown.',
  error: () => 'We could not set it right now. We will try again after your next Rundown.',
};

/**
 * Asked once, after her first Daily Rundown (retention checklist b): one
 * notification a day at the time she picks. "Not now" is a real answer and
 * nothing asks again. Nothing about her health is on the lock screen.
 */
export default function RundownNotifyAsk({ today, show }) {
  const [pref, setPref] = useState(() => readRundownPush());
  const [time, setTime] = useState(pref.time || DEFAULT_RUNDOWN_TIME);
  const [note, setNote] = useState('');
  if (!show || (pref.answered && !note)) return null;
  const on = async () => {
    setPref(writeRundownPush({ answered: true, on: true, time }));
    trackNotificationPrompt({ surface: eventSurface(), granted: true, prompt: 'after_rundown' });
    // The app asks the phone for permission in this moment (usePushNotifications).
    try { window.dispatchEvent(new CustomEvent(PUSH_ASK_EVENT)); } catch { /* old browser */ }
    const status = await bookTomorrow(today, time).catch(() => 'error');
    setNote((RESULT[status] || RESULT.error)(timeLabel(time)));
  };
  const no = () => {
    setPref(writeRundownPush({ answered: true, on: false }));
    trackNotificationPrompt({ surface: eventSurface(), granted: false, prompt: 'after_rundown' });
  };
  if (note) return <p className="ay-today__notify-done" role="status">{note}</p>;
  return (
    <section className="ay-today__notify" aria-labelledby="ay-today-notify-h">
      <h3 id="ay-today-notify-h">Get your Daily Rundown each morning?</h3>
      <p>One notification a day that says “Your daily rundown is ready.” Nothing about your health shows on the lock screen.</p>
      <div className="ay-today__notify-row">
        <label className="ay-today__notify-time">
          <span>Time</span>
          <select value={time} onChange={(e) => setTime(e.target.value)}>
            {RUNDOWN_TIMES.map((t) => <option key={t} value={t}>{timeLabel(t)}</option>)}
          </select>
        </label>
        <button type="button" className="ay-today__primary" onClick={on}>Turn on</button>
        <button type="button" className="ay-today__text" onClick={no}>Not now</button>
      </div>
    </section>
  );
}

/**
 * The same choice as a Settings row (founder Oct 26 19:22: "put that in settings").
 * Today no longer shows the ask card; she sets it here any time.
 */
export function RundownSetting({ today }) {
  const [pref, setPref] = useState(() => readRundownPush());
  const [time, setTime] = useState(pref.time || DEFAULT_RUNDOWN_TIME);
  const [note, setNote] = useState('');
  const isOn = Boolean(pref.on);
  const apply = async (next) => {
    const merged = { ...pref, ...next, answered: true };
    setPref(merged);
    if (next.on) {
      trackNotificationPrompt({ surface: eventSurface(), granted: true, prompt: 'settings' });
      try { window.dispatchEvent(new CustomEvent(PUSH_ASK_EVENT)); } catch { /* old browser */ }
    }
    const status = await applyRundownPref(today, { on: merged.on, time: merged.time });
    setNote((RESULT[status] || RESULT.error)(timeLabel(merged.time)));
  };
  return (
    <section className="ay-rundown-setting" aria-labelledby="ay-rundown-setting-h">
      <h3 id="ay-rundown-setting-h">Daily Rundown reminder</h3>
      <p>“Your ayna daily rundown is ready,” once a day. Nothing about your health shows on the lock screen.</p>
      <div className="ay-today__notify-row">
        <label className="ay-today__notify-time">
          <span>Time</span>
          <select value={time} onChange={(e) => { setTime(e.target.value); apply({ on: isOn, time: e.target.value }); }}>
            {RUNDOWN_TIMES.map((t) => <option key={t} value={t}>{timeLabel(t)}</option>)}
          </select>
        </label>
        {isOn
          ? <button type="button" className="ay-today__text" onClick={() => apply({ on: false })}>Turn off</button>
          : <button type="button" className="ay-today__primary" onClick={() => apply({ on: true, time })}>Turn on</button>}
      </div>
      {note && <p className="ay-today__notify-done" role="status">{note}</p>}
    </section>
  );
}
