import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { readChanges, CHANGES_EVENT } from '../../utils/changeHistory.js';
import { SOURCE_LABEL } from '../../matching/personalizationDiff.js';
import '../routine/day-plan.css';

/** "What's changed": every time her matches changed, newest first, with a replay of the recap. */
export default function ChangeHistory({ onClose, onReplay }) {
  const [list, setList] = useState(() => readChanges());
  useEffect(() => {
    const on = () => setList(readChanges());
    window.addEventListener(CHANGES_EVENT, on);
    const k = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener(CHANGES_EVENT, on); window.removeEventListener('keydown', k); };
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(<div className="ay-dp-sheet ay-ch" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
    <div className="ay-dp-sheet__panel" role="dialog" aria-modal="true" aria-label="What's changed">
      <div className="ay-dp-sheet__head"><p className="ay-dp-sheet__title">What's changed</p><button type="button" className="ay-dp__ghost" onClick={onClose} autoFocus>Close</button></div>
      {!list.length
        ? <p className="ay-dp__muted">Nothing yet. When you update your answers or check in, what changed in your matches shows here.</p>
        : <ul className="ay-dp-mlist">{list.map((e) => <li key={e.id}>
          <div>
            <b>{SOURCE_LABEL[e.source] || 'Your profile changed'}</b>
            <span>{new Date(e.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            {e.lines.map((l) => <span key={l}>{l}</span>)}
          </div>
          {e.level >= 2 && onReplay && <div className="ay-dp-mlist__acts"><button type="button" className="ay-dp__ghost" onClick={() => onReplay(e)}>See the recap</button></div>}
        </li>)}</ul>}
      <p className="ay-dp__muted">Kept on this phone only.</p>
    </div>
  </div>, document.querySelector('.ayna-mobile') || document.body);
}
