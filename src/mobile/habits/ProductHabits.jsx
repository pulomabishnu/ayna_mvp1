import { useState } from 'react';
import { habitFor, setHabit, syncProductReminder, remindersAvailable } from './productHabits.js';
import { haptic } from '../../utils/haptics.js';
import './product-habits.css';

const TIMES = ['07:00', '08:00', '09:00', '12:00', '18:00', '20:00', '21:00', '22:00'];
const label = (t) => { const [h, m] = t.split(':').map(Number); const ap = h < 12 ? 'am' : 'pm'; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`; };
const today = () => new Date().toISOString().slice(0, 10);
const nice = (d) => { try { return new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; } };

/** "Using since" and a daily reminder, for a product in her routine (app product page). */
export default function ProductHabits({ product, ingested = false }) {
  const [h, setH] = useState(() => habitFor(product.id));
  const [note, setNote] = useState('');
  const canRemind = remindersAvailable();
  const save = (patch) => setH(setHabit(product.id, patch));
  const toggleRemind = async () => {
    const on = !h.remind;
    const time = h.time || '09:00';
    save({ remind: on, time });
    const r = await syncProductReminder(product.id, { on, time });
    haptic(on && r === 'scheduled' ? 'success' : 'light');
    setNote(r === 'denied' ? 'Notifications are off for ayna. Turn them on in iPhone Settings > ayna.' : r === 'scheduled' ? `Daily at ${label(time)}.` : '');
    if (r === 'denied') save({ remind: false });
  };
  const changeTime = async (time) => { save({ time }); if (h.remind) { await syncProductReminder(product.id, { on: true, time }); setNote(`Daily at ${label(time)}.`); } };
  return (
    <section className="ay-habit" aria-label="Your use of this product">
      <div className="ay-habit__row">
        <span className="ay-habit__lbl">Using since</span>
        {h.started
          ? <label className="ay-habit__date"><span>{nice(h.started)}</span><input type="date" value={h.started} max={today()} onChange={(e) => save({ started: e.target.value || undefined })} aria-label="Change the day you started" /></label>
          : <button type="button" className="ay-habit__btn" onClick={() => { save({ started: today() }); haptic('light'); }}>I started today</button>}
      </div>
      {ingested && canRemind && (
        <div className="ay-habit__row">
          <span className="ay-habit__lbl">Daily reminder</span>
          <span className="ay-habit__ctl">
            {h.remind && <select value={h.time || '09:00'} onChange={(e) => changeTime(e.target.value)} aria-label="Reminder time">{TIMES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>}
            <button type="button" role="switch" aria-checked={Boolean(h.remind)} className={`ay-habit__sw${h.remind ? ' is-on' : ''}`} onClick={toggleRemind}><span className="sr-only">Daily reminder</span><i aria-hidden="true" /></button>
          </span>
        </div>
      )}
      {note && <p className="ay-habit__note" role="status">{note}</p>}
    </section>
  );
}
