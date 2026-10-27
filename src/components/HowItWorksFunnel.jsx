import React from 'react';
import { getSampleFunnel, SAMPLE_LABEL } from '../utils/sampleFunnel';

/**
 * The narrowing story with live numbers (audit HW02/HW03), drawn as one
 * funnel (critique, Oct 27): three centred bars that narrow from the whole
 * catalog to the strong fits, each with its number and what it counts.
 * Widths are to scale with a minimum so the small stages stay readable, and
 * every value is printed, so nothing depends on reading the bar. Colour has
 * one meaning: the last stage is pink because it is the part "for you".
 * The numbers are an example run, labelled as such.
 */
export default function HowItWorksFunnel() {
  const f = getSampleFunnel();
  const STAGES = [
    { label: 'In the ayna catalog today', value: f.catalog, tone: 'all' },
    { label: 'Matched to this profile', value: f.matched, tone: 'mid' },
    { label: 'Strong fits (80+)', value: f.strong, tone: 'you' },
  ];
  const max = STAGES[0].value || 1;
  const MIN = [100, 34, 22];
  return (
    <figure className="ed-funnel ip-funnel ip-funnel--h" style={{ margin: 0 }}>
      <ol
        className="ip-fun"
        role="img"
        aria-label={`${SAMPLE_LABEL}: ${STAGES[0].value} products in the catalog, ${STAGES[1].value} matched, ${STAGES[2].value} strong fits`}
      >
        {STAGES.map((stage, i) => (
          <li key={stage.label} aria-hidden="true" className={`is-${stage.tone}`}>
            <span className="ip-fun__bar" style={{ width: `${Math.max(MIN[i], (stage.value / max) * 100).toFixed(2)}%` }}>
              <b>{stage.value.toLocaleString()}</b>
              <span>{stage.label}</span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption className="ed-caption" style={{ marginTop: 16 }}>{SAMPLE_LABEL}, run live on today's catalog. Widths to scale, with a minimum so small numbers stay readable.</figcaption>
    </figure>
  );
}
