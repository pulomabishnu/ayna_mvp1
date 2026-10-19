import { SOURCE_NAMES } from '../../data/healthConnections.js';
import { fmtMinutes } from '../../../health/insights.js';
import { useHealthData } from '../../hooks/useHealthData.js';
import './health-connections.css';

/**
 * Health Insights: a few plain trend cards, not a wall of numbers. Each says
 * what changed against her own normal, where it came from, and how it
 * changes her ayna experience. Never a diagnosis.
 */

const fromLine = (sources) => {
  const names = sources.map((s) => SOURCE_NAMES[s] || s);
  return names.length ? `From ${names.join(' and ')}` : null;
};
const fmtDay = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function Bars({ points, unit, label }) {
  if (!points?.length) return null;
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const w = 100 / points.length;
  const fmt = (v) => (unit === 'min' ? fmtMinutes(v) : unit === 'days' ? `${v} days` : `${Math.round(v)}${unit === 'bpm' ? ' bpm' : unit === 'ms' ? ' ms' : ''}`);
  return (
    <figure className="ay-hi-chart">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label={`${label}: ${points.map((p) => `${fmtDay(p.day)} ${fmt(p.value)}`).join(', ')}`}>
        {points.map((p, i) => {
          const h = Math.max(1.5, ((p.value - min) / span) * 36);
          return <rect key={p.day} x={i * w + w * 0.18} y={40 - h} width={w * 0.64} height={h} rx="1.2" className={i === points.length - 1 ? 'is-last' : ''} />;
        })}
      </svg>
      <figcaption><span>{fmtDay(points[0].day)}</span><span>{fmtDay(points[points.length - 1].day)}</span></figcaption>
    </figure>
  );
}

function SectionCard({ section }) {
  const arrow = section.change?.direction === 'down' ? '↓' : section.change?.direction === 'up' ? '↑' : '';
  return (
    <article className={`ay-hi-card is-${section.id}`} aria-labelledby={`ay-hi-${section.id}`}>
      <header>
        <h2 id={`ay-hi-${section.id}`}>{section.title}</h2>
        {section.status === 'building' && <span className="ay-hc-pill">Building</span>}
      </header>
      <p className="ay-hi-headline">{section.headline}</p>
      {section.change && <p className={`ay-hi-change is-${section.change.direction}`}>{arrow && <span aria-hidden="true">{arrow} </span>}{section.change.text}</p>}
      {section.status === 'ready' && <Bars points={section.trend} unit={section.unit} label={section.title} />}
      {section.estimate && <p className="ay-hi-estimate"><b>{section.estimate.label}:</b> around {fmtDay(section.estimate.day)}. <span>{section.estimate.basis}</span></p>}
      {section.explanation && <p className="ay-hi-explain">{section.explanation}</p>}
      {section.affects && <p className="ay-hi-affects">{section.affects}</p>}
      {fromLine(section.sources) && <p className="ay-hi-from">{fromLine(section.sources)}</p>}
    </article>
  );
}

const SUGGEST_LABEL = { 'sleep.trouble': 'sleep', 'cycle.irregular': 'irregular cycles', 'energy.fatigue': 'energy' };

export default function HealthInsightsScreen({ authUser, selectedNeedIds = [], onConnect, onEditProfile }) {
  const health = useHealthData(authUser?.id || null, selectedNeedIds);
  const { sections } = health.insights;
  const suggestions = health.matchContext?.suggestions || [];

  if (!authUser?.id) return <p className="ay-hc-intro">Sign in to see trends from your connected health data.</p>;
  if (health.status === 'loading') return <p className="ay-hc-intro" role="status">Loading your trends…</p>;
  if (!sections.length) {
    return (
      <div className="ay-hc-detail">
        <p className="ay-hc-intro">Connect an app or wearable, or upload a file, and your sleep, cycle, recovery and activity trends show up here.</p>
        <button type="button" className="ay-hc-primary" onClick={onConnect}>Connect health data</button>
      </div>
    );
  }
  return (
    <div className="ay-hi">
      <p className="ay-hc-intro">Compared with your own usual, not anyone else's. Trends, not diagnoses.</p>
      {sections.map((s) => <SectionCard key={s.id} section={s} />)}
      {suggestions.length > 0 && (
        <section className="ay-hi-suggest" aria-label="Suggestions">
          {suggestions.map((s) => (
            <div key={s.needId} className="ay-hc-note">
              {s.summary}. Want ayna to take {SUGGEST_LABEL[s.needId] || 'this'} into account? It only will if you add it to your goals.
              {onEditProfile && <> <button type="button" className="ay-hc-link" onClick={onEditProfile}>Update my goals</button></>}
            </div>
          ))}
        </section>
      )}
      <p className="ay-hc-small">These describe your data. They aren't medical advice. If something worries you, talk to a clinician.</p>
      <button type="button" className="ay-hc-ghost" onClick={onConnect}>Manage health data</button>
    </div>
  );
}
