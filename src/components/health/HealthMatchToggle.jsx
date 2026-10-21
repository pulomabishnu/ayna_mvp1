import { useId } from 'react';
import { useHealthMatchPref } from '../../health/matchPref.js';
import './health-shaped.css';

const ERROR_TEXT = {
  needs_migration: "Couldn't save this yet. Try again later.",
  not_signed_in: 'Sign in to change this.',
};

/**
 * "Use my health data in my matches": the one switch, explained in plain
 * words. Website (You, Health data) and app (Preferences, Health data).
 * Signed out there is nothing to switch, so it shows nothing.
 */
export default function HealthMatchToggle({ userId, className = '', compact = false }) {
  const pref = useHealthMatchPref(userId);
  const id = useId();
  if (!userId) return null;
  return (
    <div className={`ay-hmt${compact ? ' is-compact' : ''} ${className}`.trim()}>
      <div className="ay-hmt__text">
        <span className="ay-hmt__title" id={id}>Use my health data in my matches</span>
        <span className="ay-hmt__sub">
          {pref.on
            ? 'Trends from apps like Apple Health can move picks up inside goals you chose. They never add a goal, skip a safety check or reach brands.'
            : 'Off. Your matches use only your answers. Your health data still shows in your insights.'}
        </span>
        {pref.error && <span className="ay-hmt__error" role="alert">{ERROR_TEXT[pref.error] || "That didn't save. Try again."}</span>}
      </div>
      {/* The pill toggle ("ON" motif from the personality kit): word and knob, flat fills. */}
      <button type="button" role="switch" aria-checked={pref.on} aria-labelledby={id} className="ay-hmt__switch" onClick={() => pref.set(!pref.on)}>
        <span className="ay-hmt__word" aria-hidden="true">{pref.on ? 'ON' : 'OFF'}</span>
        <span className="ay-hmt__knob" aria-hidden="true" />
      </button>
    </div>
  );
}
