import { useId, useState } from 'react';
import { NOT_USEFUL_REASONS } from './rundownStore.js';

/**
 * "Not useful", then an optional reason (UX spec 9). Minimal, keyboard
 * friendly disclosure; a shared NotUsefulMenu can replace it later with the
 * same props: onPick(reasonId).
 */
export default function NotUsefulMenu({ onPick, className = '' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`ay-rd-nu ${className}`}>
      <button type="button" className="ay-rd-link" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>Not useful</button>
      {open && (
        <div id={id} className="ay-rd-nu__list" role="group" aria-label="Why is this not useful?">
          {NOT_USEFUL_REASONS.map((r) => (
            <button key={r.id} type="button" className="ay-rd-chip" onClick={() => { setOpen(false); onPick?.(r.id); }}>{r.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
