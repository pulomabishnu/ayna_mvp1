import { useState } from 'react';
import NotUsefulMenu from './NotUsefulMenu.jsx';
import { dismissWithReason, markInteracted } from '../../health/decisionEngine.js';
import { readToday, writeToday } from '../../health/todayStore.js';
import { todayKey } from '../../health/dailyLog.js';

/**
 * "Was this match useful?" under a match explanation (UX spec sections 9 and
 * 29). Stored on this device with the Today store (dismissWithReason), keyed by
 * product, never sent to analytics. It does not change the match score: the
 * score comes from her answers and the product, nothing else.
 * "My information changed" opens her profile (onUpdateHealth).
 */
export default function MatchFeedback({ productId, onUpdateHealth }) {
  const [done, setDone] = useState('');
  if (!productId) return null;
  const id = `match:${productId}`;
  const helpful = () => {
    try { writeToday('seen', markInteracted(readToday().seen, id, todayKey())); } catch { /* storage unavailable */ }
    setDone('Thanks. Noted.');
  };
  const notUseful = (reason) => {
    try { writeToday('dismissed', dismissWithReason(readToday().dismissed, { id, type: 'match' }, todayKey(), reason)); } catch { /* storage unavailable */ }
    setDone('Thanks. Noted.');
    if (reason === 'info_changed') onUpdateHealth?.();
  };
  return (
    <div className="ay-matchfb" role="group" aria-label="Was this match useful?">
      <span className="ay-matchfb__q">Was this match useful?</span>
      {done ? <span className="ay-matchfb__done" role="status">{done}</span> : (
        <span className="ay-matchfb__acts">
          <button type="button" className="ay-matchfb__btn" onClick={helpful}>Helpful</button>
          <NotUsefulMenu className="ay-matchfb__btn" onPick={notUseful} />
        </span>
      )}
    </div>
  );
}
