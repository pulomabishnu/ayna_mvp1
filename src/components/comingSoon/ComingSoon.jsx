import React from 'react';
import { UNRELEASED_STARTUPS } from '../../data/startups.js';
import { productImageOverride } from '../../data/productImageOverrides.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import './coming-soon.css';

// Founder, Nov 13 ("waitlist and not-yet-launched products: yes we should list them"): real services
// that aren't in the US yet, each with its own site's waitlist. Only entries with a working site
// (checked Nov 13); invented placeholders were removed from the data.
const WAITLIST = /waitlist|coming|launch|shipping soon|expansion|trials|expanding/i;
export const COMING_SOON = UNRELEASED_STARTUPS.filter((s) => /^https:\/\//.test(s.url || '') && WAITLIST.test(s.stage || ''));

// The stage as written, minus any FDA wording: regulatory status is shown only when checked against
// the FDA (CLAUDE.md). Qvin's "FDA-cleared" wasn't found in openFDA's 510(k) records on Nov 13.
const stageLine = (t) => String(t || '').replace(/FDA[- ][a-z]+,?\s*/ig, '').replace(/^./, (c) => c.toUpperCase());

function Pic({ s }) {
  const [failed, setFailed] = React.useState(false);
  const src = productImageOverride(s) || safeProductImageSrc(s.image || '');
  return <span className="ay-soon__pic" aria-hidden="true">{src && !failed ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <b>{String(s.name || '?').slice(0, 1)}</b>}</span>;
}

export default function ComingSoon({ className = '' }) {
  if (!COMING_SOON.length) return null;
  return (
    <section className={`ay-soon ${className}`.trim()} aria-labelledby="ay-soon-h">
      <h2 id="ay-soon-h" className="ay-soon__h">Coming soon</h2>
      <p className="ay-soon__sub">Not in the US yet. Join a waitlist on the company’s own site.</p>
      <ul className="ay-soon__list">
        {COMING_SOON.map((s) => (
          <li key={s.id} className="ay-soon__item">
            <Pic s={s} />
            <span className="ay-soon__t"><b>{s.name}</b><span>{s.tagline}</span><small>{stageLine(s.stage)}</small></span>
            <a className="ay-soon__go" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`Join the ${s.name} waitlist (opens their site)`}>Waitlist <span aria-hidden="true">↗</span></a>
          </li>
        ))}
      </ul>
    </section>
  );
}
