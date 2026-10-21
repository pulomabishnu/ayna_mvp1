import { useEffect, useId, useState } from 'react';
import { useHealthData } from '../../mobile/hooks/useHealthData.js';
import { useHealthMatchPref } from '../../health/matchPref.js';
import { changeLine, changeSources, joinNames, sourceName, splitSources, PERIOD_TIMING_SOURCE } from './healthCopy.js';
import { PulseIcon } from './HealthBackedBadge.jsx';
import HealthMatchToggle from './HealthMatchToggle.jsx';
import './health-shaped.css';

/**
 * "Shaped by your health data": a small note on the Ecosystem (website and
 * app) that says what her connected data changed, in one line per goal, with
 * a "Why?" that explains the rules and holds the on/off switch.
 * Without connected data it invites her to connect; with the switch off it
 * says so. It reads the shared health store and preference itself, so a
 * screen mounts it with one line:
 *
 *   <HealthShapedNote shaped={seed?.healthShaped} userId={user?.id} onConnect={...} />
 *
 * `shaped` is getEcosystemSeedFromQuiz(...).healthShaped (src/matching/healthShaping.js).
 */

const SOURCE_ICON = {
  apple_health: <path d="M12 19.5s-7-4.3-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.2c0 5-7 9.3-7 9.3Z" />,
  health_connect: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 17.5h2" /></>,
  oura: <><circle cx="12" cy="13" r="6" /><path d="M9.5 7.5 12 4l2.5 3.5" /></>,
  whoop: <><rect x="7" y="7" width="10" height="10" rx="3" /><path d="M9 7l.7-4h4.6l.7 4M9 17l.7 4h4.6l.7-4" /></>,
  manual_import: <><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M5 14v5h14v-5" /></>,
};

function SourceChip({ id }) {
  return (
    <li className="ay-hsn__src">
      <svg viewBox="0 0 24 24" aria-hidden="true">{SOURCE_ICON[id] || SOURCE_ICON.manual_import}</svg>
      {sourceName(id) === 'your uploads' ? 'Your uploads' : sourceName(id)}
    </li>
  );
}

function WhySheet({ changes, userId, insightsOnly, onClose }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const timing = changes.some((c) => c.kind === 'timing' || c.timing);
  return (
    <div className="ay-hsn-backdrop" onClick={onClose}>
      <div className="ay-hsn-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div className="ay-hsn-sheet__strip"><PulseIcon className="ay-hsn__icon" />Your health data</div>
        <button type="button" className="ay-hsn-sheet__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <h2 id={titleId} className="ay-hsn-sheet__title">How your health data shapes your picks</h2>
        {changes.length > 0 && (
          <section>
            <h3>What changed</h3>
            <ul className="ay-hsn-sheet__changes">
              {changes.map((c) => { const l = changeLine(c); return <li key={c.needId}><b>{l.lead}</b> {l.effect}{c.sources?.length ? <small> From {joinNames(c.sources.map(sourceName))}.</small> : null}</li>; })}
            </ul>
          </section>
        )}
        <section>
          <h3>The rules</h3>
          <ul className="ay-hsn-sheet__rules">
            <li>It only works inside goals you chose. It never adds a goal or takes one away.</li>
            <li>What you told us comes first, then safety. Your data can only move picks around after that.</li>
            <li>It compares this week with your own usual, never one night.</li>
            <li>It never changes Shop, brand placement or ads, and brands never see it.</li>
            {timing && <li>Period pain relievers work best started a day or two before your period, so when yours is close, things you use around it come first. <a href={PERIOD_TIMING_SOURCE} target="_blank" rel="noopener noreferrer">Source</a></li>}
            {insightsOnly.length > 0 && <li>{joinNames(insightsOnly.map(sourceName))} data shows in your insights but does not change your matches yet.</li>}
          </ul>
        </section>
        <HealthMatchToggle userId={userId} className="ay-hsn-sheet__toggle" />
      </div>
    </div>
  );
}

export default function HealthShapedNote({ shaped = null, userId = null, onConnect = null, className = '' }) {
  const health = useHealthData(userId);
  const pref = useHealthMatchPref(userId);
  const [open, setOpen] = useState(false);
  if (!userId) return null;
  const changes = pref.on ? shaped?.changes || [] : [];
  const { matching, insightsOnly } = splitSources(health.connected || []);
  const ready = health.status === 'ready' || health.status === 'refreshing' || health.loadedAt;
  const sheet = open && <WhySheet changes={changes} userId={userId} insightsOnly={insightsOnly} onClose={() => setOpen(false)} />;
  const why = <button type="button" className="ay-hsn__why" onClick={() => setOpen(true)} aria-haspopup="dialog">Why?</button>;
  const connect = () => { if (onConnect) onConnect(); else if (typeof window !== 'undefined') window.location.assign('/health-data'); };

  if (!pref.on) {
    return <aside className={`ay-hsn is-quiet ${className}`.trim()} aria-label="Health data in your matches">
      <p className="ay-hsn__line"><PulseIcon className="ay-hsn__icon" />Your health data is not used in your matches.</p>{why}{sheet}
    </aside>;
  }
  if (!ready) return null;
  if (!matching.length) {
    return <aside className={`ay-hsn is-invite ${className}`.trim()} aria-labelledby="ay-hsn-invite-h">
      <div className="ay-hsn__body">
        <h3 className="ay-hsn__title" id="ay-hsn-invite-h"><PulseIcon className="ay-hsn__icon" />Connect health data</h3>
        <p className="ay-hsn__text">Link Apple Health or another app and your picks can follow your sleep and your cycle. You choose what to share.</p>
      </div>
      <button type="button" className="ay-hsn__cta" onClick={connect}>Connect health data</button>
    </aside>;
  }
  if (!changes.length) {
    return <aside className={`ay-hsn is-quiet ${className}`.trim()} aria-label="Health data in your matches">
      <p className="ay-hsn__line"><PulseIcon className="ay-hsn__icon" />Your health data is connected. Nothing in it changes your picks this week.</p>{why}{sheet}
    </aside>;
  }
  const sources = changeSources(changes);
  const shown = changes.slice(0, 2);
  return (
    <aside className={`ay-hsn ${className}`.trim()} aria-labelledby="ay-hsn-h">
      <div className="ay-hsn__head">
        <h3 className="ay-hsn__title" id="ay-hsn-h"><PulseIcon className="ay-hsn__icon" />Shaped by your health data</h3>
        {sources.length > 0 && <ul className="ay-hsn__srcs" aria-label="From">{sources.map((id) => <SourceChip key={id} id={id} />)}</ul>}
      </div>
      <ul className="ay-hsn__changes">
        {shown.map((c) => { const l = changeLine(c); return <li key={c.needId}><b>{l.lead}</b> {l.effect}</li>; })}
      </ul>
      <div className="ay-hsn__foot">
        {changes.length > shown.length && <span className="ay-hsn__more">{changes.length - shown.length} more</span>}
        {why}
      </div>
      {sheet}
    </aside>
  );
}
