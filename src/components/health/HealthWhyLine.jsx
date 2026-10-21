import { whyLine } from '../../health/matchContext.js';
import { sourceName } from './healthCopy.js';
import { PulseIcon } from './HealthBackedBadge.jsx';
import './health-shaped.css';

/**
 * "Your health data" on Why this match (website panel and app screen):
 * shown only when connected data backs the need this product is matched on.
 */
export default function HealthWhyLine({ healthData, as = 'h3', className = '' }) {
  const line = whyLine(healthData, sourceName);
  if (!line) return null;
  return (
    <section className={`ay-hwhy ${className}`.trim()}>
      {as === 'h2'
        ? <h2 className="ay-hwhy__title"><PulseIcon className="ay-hwhy__icon" />Your health data</h2>
        : <h3 className="ay-hwhy__title"><PulseIcon className="ay-hwhy__icon" />Your health data</h3>}
      <p><b>{line.text}.</b> {line.detail}{line.cite && <> <a href={line.cite} target="_blank" rel="noopener noreferrer">Source</a></>}</p>
    </section>
  );
}
