import React from 'react';
import { getSampleFunnel } from '../utils/sampleFunnel';

/**
 * The narrowing story with live numbers (audit HW02/HW03), drawn as rounded
 * vertical bars with the number at the base (info-pages audit v3, #6
 * Journal app). Heights are linear to the catalog; a minimum height keeps
 * the small stages readable, and every value is printed, so nothing depends
 * on reading the bar. The numbers are an example run, labelled as such.
 */
export default function HowItWorksFunnel() {
  const f = getSampleFunnel();
  const STAGES = [
    { label: 'In the ayna catalog today', value: f.catalog },
    { label: 'Matched to this profile', value: f.matched },
    { label: 'Strong matches (90+)', value: f.strong },
  ];
  const max = STAGES[0].value || 1;
  return (
    <figure className="ed-funnel ip-funnel" style={{ margin: 0 }}>
      <ol
        className="ip-bars"
        role="img"
        aria-label={`Sample profile: ${STAGES[0].value} products in the catalog, ${STAGES[1].value} matched, ${STAGES[2].value} strong matches`}
      >
        {STAGES.map((stage) => (
          <li key={stage.label} aria-hidden="true">
            <span className="ip-bars__track">
              <span className="ip-bars__fill" style={{ height: `${((stage.value / max) * 100).toFixed(2)}%` }}><b>{stage.value.toLocaleString()}</b></span>
            </span>
            <span className="ip-bars__cap">{stage.label}</span>
          </li>
        ))}
      </ol>
      <figcaption className="ed-caption" style={{ marginTop: 16 }}>Example: a sample profile, run live on today's catalog. Bar heights to scale, with a minimum so small numbers stay readable.</figcaption>
    </figure>
  );
}
