import { useState } from 'react';
import { clearSavedReminder, dueSavedReminders, fmtRemindDay, readSavedReminders } from '../../utils/savedReminders.js';
import './save.css';

/**
 * In Saved: reminders she set with "Remind me later". Due ones lead with
 * "Something you saved is waiting" and open the product.
 */
export default function SavedReminders({ resolve, onOpenProduct, variant = 'app' }) {
  const [v, setV] = useState(0);
  const all = readSavedReminders();
  const due = new Set(dueSavedReminders().map((r) => r.id));
  const list = all.map((r) => ({ ...r, product: resolve?.(r.id) || null, due: due.has(r.id) })).filter((r) => r.product || r.name);
  if (!list.length) return null;
  const done = (id) => { clearSavedReminder(id); setV(v + 1); };
  return (
    <section className={`ay-svr is-${variant}`} aria-labelledby={`ay-svr-h-${variant}`}>
      <h2 id={`ay-svr-h-${variant}`}>{due.size ? 'Something you saved is waiting' : 'Your reminders'}</h2>
      <ul>
        {list.map((r) => (
          <li key={r.id} className={r.due ? 'is-due' : undefined}>
            <span>
              {r.product && onOpenProduct ? <button type="button" className="ay-svf__link" onClick={() => onOpenProduct(r.product)}>{r.product.name || r.name}</button> : <b>{r.name}</b>}
              <small>{r.due ? 'Your reminder is here' : `Reminder on ${fmtRemindDay(r.at)}`}</small>
            </span>
            <button type="button" className="ay-svf__link" onClick={() => done(r.id)}>{r.due ? 'Done' : 'Cancel reminder'}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
