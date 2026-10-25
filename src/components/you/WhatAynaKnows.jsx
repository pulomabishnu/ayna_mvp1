import { useEffect, useMemo, useRef, useState } from 'react';
import { SOURCE_LABELS, aynaBeliefs } from '../../utils/aynaBeliefs.js';
import { readToday, setTodayOwner, writeToday } from '../../health/todayStore.js';
import '../../styles/onboarding.css';

/**
 * You -> My health: what ayna is using about you (UX spec section 29, master
 * prompt section 151). Every row shows where it came from (stated, worked out,
 * from Today, from connected data) and how to change it: Edit reopens that one
 * question, Remove takes it out and re-saves. Signed out it still works on this
 * device (the intake saves locally first).
 */
export default function WhatAynaKnows({ variant = 'app', quizAnswers = null, userId = null, connected = [], onUpdateIntake = null, onEditStep, onManageData, focus = '' }) {
  const snapshot = quizAnswers?.fullHealthIntake || null;
  const [todayAnswers, setTodayAnswers] = useState(() => { try { setTodayOwner(userId); return readToday().answers || {}; } catch { return {}; } });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState('');
  const groups = useMemo(() => aynaBeliefs(snapshot, { todayAnswers, connected }), [snapshot, todayAnswers, connected]);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!focus) return;
    rootRef.current?.querySelector(`[data-group="${focus}"]`)?.scrollIntoView({ block: 'start' });
  }, [focus]);

  const remove = async (row) => {
    if (row.todayField) {
      const { [row.todayField]: _gone, ...rest } = todayAnswers;
      const next = writeToday('answers', rest).answers || {};
      setTodayAnswers(next);
      setStatus(`Removed “${row.label}”.`);
      return;
    }
    if (!row.remove || !onUpdateIntake) return;
    setBusy(row.id);
    const ok = await onUpdateIntake(row.remove());
    setBusy('');
    setStatus(ok ? `Removed “${row.label}”. Your matches use this change now.` : 'Could not save that change. Try again.');
  };

  if (!snapshot) {
    return (
      <section className={`ay-know is-${variant}`} aria-labelledby={`ay-know-h-${variant}`}>
        <h2 id={`ay-know-h-${variant}`} className="ay-know__title">What ayna knows about you</h2>
        <div className="ay-ob-empty">
          <strong>Nothing yet.</strong>
          <p>Answer a few quick questions and this page shows everything ayna uses, where it came from, and how to change it.</p>
          {onEditStep && <button type="button" className="ay-ob-primary" onClick={() => onEditStep('')}>Start the questions</button>}
        </div>
      </section>
    );
  }

  return (
    <section ref={rootRef} className={`ay-know is-${variant}`} aria-labelledby={`ay-know-h-${variant}`}>
      <h2 id={`ay-know-h-${variant}`} className="ay-know__title">What ayna knows about you</h2>
      <p className="ay-know__lead">Everything ayna uses to personalize Today and your matches. Change or remove anything. Brands never see it.</p>
      {status && <p className="ay-know__status" role="status">{status}</p>}
      {groups.map((g) => (
        <div key={g.id} className="ay-know__group" data-group={g.id}>
          <h3>{g.title}</h3>
          {/* The app's tab is Home; the website keeps Today (QA, Oct 25). */}
          {g.note && <p className="ay-know__note">{variant === 'web' ? g.note : g.note.replace(/\bToday\b/g, 'Home')}</p>}
          <ul>
            {g.rows.map((row) => (
              <li key={row.id} className={row.missing ? 'is-missing' : ''}>
                <span className="ay-know__what">
                  <b>{row.label}</b>
                  {row.value && <span>{row.value}</span>}
                  <small>{row.missing ? 'Not answered yet' : SOURCE_LABELS[row.source] || ''}</small>
                </span>
                <span className="ay-know__acts">
                  {row.manage && onManageData && <button type="button" onClick={onManageData}>{row.missing ? 'Connect' : 'Manage'}</button>}
                  {row.step && onEditStep && <button type="button" onClick={() => onEditStep(row.step)} aria-label={`${row.missing ? 'Answer' : 'Edit'}: ${row.label}`}>{row.missing ? 'Answer' : 'Edit'}</button>}
                  {(row.todayField || (row.remove && onUpdateIntake)) && <button type="button" disabled={busy === row.id} onClick={() => remove(row)} aria-label={`Remove: ${row.label}`}>Remove</button>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="ay-know__foot">Reading posts or products never adds anything here.</p>
    </section>
  );
}
