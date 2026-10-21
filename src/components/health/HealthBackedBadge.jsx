import { backedText } from './healthCopy.js';
import './health-shaped.css';

/** A small line icon for health data: a pulse line (no sparkles). */
export function PulseIcon({ className = '' }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12.5h4l2.4-6 4.8 11.5 2.4-5.5H21" /></svg>;
}

/**
 * "Backed by your sleep data" on a pick her connected health data supports.
 * `backed` is pick.healthBacked from the ecosystem seed, or
 * { section } from a need match's healthData.
 */
export default function HealthBackedBadge({ backed, className = '' }) {
  const text = backedText(backed);
  if (!text) return null;
  return <span className={`ay-hbadge ${className}`.trim()}><PulseIcon className="ay-hbadge__icon" />{text}</span>;
}
