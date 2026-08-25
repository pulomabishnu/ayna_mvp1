import React from 'react';

/**
 * The 3,140 -> 212 -> 14 narrowing story used to be three flat number cards
 * side by side, spread across separate step cards with no visual connection
 * between them — the actual "narrowing down" story (the whole point of this
 * page) never landed as a shape (found live, 2026-08-24 bug bash: "an actual
 * funnel/waterfall chart would make that narrowing-down story land much
 * harder").
 *
 * Widths use a square-root scale, not linear — a linear scale would make the
 * 14-product stage nearly invisible next to 3,140 and read as "basically
 * nothing," when the actual number is still clearly labeled either way. Sqrt
 * keeps every stage visible as a real bar while still showing a dramatic,
 * honest narrowing.
 */
const STAGES = [
  { label: 'Pulled in from the open market', value: 3140 },
  { label: 'Relevant to your profile', value: 212 },
  { label: 'In your ecosystem', value: 14 },
];

export default function HowItWorksFunnel() {
  const maxWidth = Math.sqrt(STAGES[0].value);
  return (
    <div className="hiw-funnel" role="img" aria-label="3,140 products narrowed down to 212 relevant to you, then to 14 in your ecosystem">
      {STAGES.map((stage, i) => {
        const widthPct = Math.max(14, (Math.sqrt(stage.value) / maxWidth) * 100);
        return (
          <div key={stage.label} className="hiw-funnel__row">
            <div className="hiw-funnel__bar-track">
              <div className="hiw-funnel__bar" style={{ width: `${widthPct}%` }}>
                <span className="hiw-funnel__value">{stage.value.toLocaleString()}</span>
              </div>
            </div>
            <span className="hiw-funnel__label">{stage.label}</span>
            {i < STAGES.length - 1 && <span className="hiw-funnel__arrow" aria-hidden="true">↓</span>}
          </div>
        );
      })}
    </div>
  );
}
