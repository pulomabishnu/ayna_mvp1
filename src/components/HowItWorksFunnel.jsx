import React from 'react';
import { getSampleFunnel } from '../utils/sampleFunnel';

/**
 * The narrowing story, drawn to scale (audit HW03), with live numbers.
 *
 * Bar widths are linear: 212 is 6.8% of 3,140 and 14 is 0.4%, so the small
 * stages are thin slivers on purpose. That IS the story. A minimum width keeps
 * them visible, and every value is printed, centred on the same axis as its
 * bar, so nothing depends on reading the bar length. The numbers are an
 * example run (audit HW02), labelled as such.
 */
export default function HowItWorksFunnel() {
  const f = getSampleFunnel();
  const STAGES = [
    { label: 'In the ayna catalog today', value: f.catalog },
    { label: 'Matched to this profile', value: f.matched },
    { label: 'Strong matches (90+)', value: f.strong },
  ];
  const max = STAGES[0].value;
  return (
    <figure className="ay-info-funnel">
      <span className="ay-info-example">Example</span>
      <div
        className="ay-info-funnel__rows"
        role="img"
        aria-label={`Sample profile: ${STAGES[0].value} products in the catalog, ${STAGES[1].value} matched, ${STAGES[2].value} strong matches`}
      >
        {STAGES.map((stage) => {
          const pct = (stage.value / max) * 100;
          return (
            <div key={stage.label} className="ay-info-funnel__row" aria-hidden="true">
              <div className="ay-info-funnel__text">
                <strong>{stage.value.toLocaleString()}</strong>
                <span>{stage.label}</span>
              </div>
              <div className="ay-info-funnel__track">
                <div className="ay-info-funnel__bar" style={{ width: `max(6px, ${pct.toFixed(2)}%)` }} />
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="ay-info-funnel__note">A sample profile, run live on today's catalog. Bars drawn to scale.</figcaption>
    </figure>
  );
}
