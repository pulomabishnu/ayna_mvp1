import React from 'react';
import { areaTone, glideTo } from './ecosystemAreaTone';

// Website version of the app's Ecosystem ring (src/mobile/components/
// EcosystemChart.jsx): one ring segment per area of care, a legend with the
// real count per area, and a legend tap glides to that area's section.

const R = 72;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** groups: [{ key, label, products: [] }] in display order. */
export default function WebEcosystemChart({ groups = [], sectionId = (key) => `eco-area-${key}`, onPick = null }) {
  const total = groups.reduce((sum, group) => sum + group.products.length, 0);
  if (!total) return null;
  const gap = groups.length > 1 ? 7 : 0;

  return (
    <div className="eco3-chart">
      <div className="eco3-chart__ring" role="img" aria-label={`${total} products on ${groups.length} shelves`}>
        <svg viewBox="0 0 184 184" aria-hidden="true">
          <circle className="eco3-chart__track" cx="92" cy="92" r={R} />
          {groups.map((group, index) => {
            const share = (group.products.length / total) * CIRCUMFERENCE;
            const offset = (groups.slice(0, index).reduce((sum, g) => sum + g.products.length, 0) / total) * CIRCUMFERENCE;
            return (
              <circle
                key={group.key}
                className="eco3-chart__segment"
                cx="92" cy="92" r={R}
                style={{ stroke: areaTone(index), '--segment-index': index }}
                strokeDasharray={`${Math.max(0, share - gap)} ${CIRCUMFERENCE}`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </svg>
        <div className="eco3-chart__centre">
          <strong>{total}</strong>
          <span>{total === 1 ? 'pick' : 'picks'}</span>
        </div>
      </div>
      <nav className={`eco3-chart__legend${groups.length > 3 ? ' eco3-chart__legend--two' : ''}`} aria-label="Your areas of care">
        {groups.map((group, index) => (
          <a
            key={group.key}
            href={`#${sectionId(group.key)}`}
            onClick={(e) => { if (onPick) { e.preventDefault(); onPick(group); } else glideTo(e, sectionId(group.key)); }}
            style={{ '--area-color': areaTone(index) }}
          >
            <span className="eco3-chart__swatch" aria-hidden="true" />
            <span className="eco3-chart__name">{group.label}</span>
            <strong>{group.products.length}</strong>
          </a>
        ))}
      </nav>
    </div>
  );
}
