import React from 'react';

/**
 * The radial "% match" gauge previously only existed on the Evidence tab
 * (.pdp-rail__match-ring, dark-card themed) — the Summary tab showed a flat
 * text badge, and Browse cards showed a flat badge too (when populated at
 * all). Same number, three different presentations depending on where you
 * looked (found live, 2026-08-24 bug bash: "using the same radial gauge
 * everywhere... would let people compare matches at a glance"). One shared
 * component now, with a `theme` for the two different card backgrounds it
 * has to sit on (the dark evidence rail vs. the light Summary/Browse cards).
 */
export default function MatchGauge({ percent, size = 44, theme = 'light', label = 'match' }) {
  if (!Number.isFinite(percent)) return null;
  const pct = Math.max(0, Math.min(100, percent));
  const ringColor = '#F0A84B';
  const trackColor = theme === 'dark' ? 'rgba(255,255,255,.16)' : 'rgba(36,42,82,0.12)';
  const holeColor = theme === 'dark' ? '#2E315D' : '#FFFFFF';
  const textColor = theme === 'dark' ? '#F0A84B' : '#242A52';

  return (
    <div
      className="ayna-match-gauge"
      role="img"
      aria-label={`${pct}% ${label}`}
      style={{
        '--gauge-size': `${size}px`,
        '--gauge-pct': `${pct}%`,
        '--gauge-ring': ringColor,
        '--gauge-track': trackColor,
        '--gauge-hole': holeColor,
        '--gauge-text': textColor,
        '--gauge-font': `${Math.max(9, Math.round(size * 0.26))}px`,
      }}
    >
      <span>{pct}%</span>
    </div>
  );
}
