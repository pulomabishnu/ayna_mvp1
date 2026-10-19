import { useState } from 'react';
import { formatMetric } from '../../health/dashboard.js';

/**
 * One health chart: bars for daily amounts, a line for levels. The dashed
 * line is her own usual (28 days before the last 7), only when there is one.
 * Tap or focus a day to read its value. Brand colours only (app-landing.css).
 */
const W = 320;
const H = 132;
const PAD = { l: 6, r: 6, t: 14, b: 6 };
const fmtDay = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function HealthChart({ chart }) {
  const { points, type, usual, metric, label } = chart;
  const [active, setActive] = useState(points.length - 1);
  if (!points.length) return null;
  const values = points.map((p) => p.value);
  const lo = type === 'bar' ? 0 : Math.min(...values, usual ?? Infinity);
  const hi = Math.max(...values, usual ?? -Infinity);
  const pad = type === 'bar' ? 0 : (hi - lo) * 0.15 || Math.abs(hi) * 0.05 || 1;
  const min = lo - pad;
  const max = hi + pad || 1;
  const span = max - min || 1;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const step = iw / points.length;
  const x = (i) => PAD.l + step * i + step / 2;
  const y = (v) => PAD.t + ih - ((v - min) / span) * ih;
  const shown = points[Math.min(active, points.length - 1)];
  const summary = `${label}, ${points.length} days from ${fmtDay(points[0].day)} to ${fmtDay(points[points.length - 1].day)}. Lowest ${formatMetric(metric, Math.min(...values))}, highest ${formatMetric(metric, Math.max(...values))}${usual != null ? `, your usual ${formatMetric(metric, usual)}` : ''}.`;
  const key = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive((a) => Math.min(points.length - 1, a + 1)); }
  };
  return (
    <figure className={`ay-hd-chart is-${type}`}>
      <p className="ay-hd-readout" aria-live="polite"><b>{formatMetric(metric, shown.value)}</b> <span>{fmtDay(shown.day)}</span></p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} tabIndex={0} onKeyDown={key}>
        {usual != null && <line className="ay-hd-usual" x1={PAD.l} x2={W - PAD.r} y1={y(usual)} y2={y(usual)} />}
        {type === 'bar'
          ? points.map((p, i) => {
            const top = y(p.value);
            const bw = Math.max(2, step * (points.length > 40 ? 0.7 : 0.62));
            return <rect key={p.day} className={i === active ? 'is-on' : ''} x={x(i) - bw / 2} y={top} width={bw} height={Math.max(1.5, PAD.t + ih - top)} rx={Math.min(3, bw / 2)} />;
          })
          : <>
            <polyline className="ay-hd-line" points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} />
            {points.length <= 31 && points.map((p, i) => <circle key={p.day} className={i === active ? 'is-on' : ''} cx={x(i)} cy={y(p.value)} r={i === active ? 4.5 : 2.6} />)}
            {points.length > 31 && <circle className="is-on" cx={x(active)} cy={y(shown.value)} r="4.5" />}
          </>}
        {points.map((p, i) => <rect key={`hit-${p.day}`} className="ay-hd-hit" x={PAD.l + step * i} y="0" width={step} height={H} onClick={() => setActive(i)} onPointerEnter={(e) => { if (e.pointerType === 'mouse') setActive(i); }} />)}
      </svg>
      <figcaption>
        <span>{fmtDay(points[0].day)}</span>
        {usual != null && <span className="ay-hd-key"><i aria-hidden="true" />Your usual {formatMetric(metric, usual)}</span>}
        <span>{fmtDay(points[points.length - 1].day)}</span>
      </figcaption>
    </figure>
  );
}

/** Tiny trend line for a tile. Decorative: the tile's text says the same thing. */
export function Spark({ points }) {
  if (!points || points.length < 2) return null;
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const xy = points.map((p, i) => `${(i / (points.length - 1)) * 96 + 2},${30 - ((p.value - lo) / span) * 26}`);
  return (
    <svg className="ay-hd-spark" viewBox="0 0 100 34" aria-hidden="true" preserveAspectRatio="none">
      <polyline points={xy.join(' ')} />
    </svg>
  );
}

/**
 * Cycle ring (Clue-style overview): her period days in rose, today as a dot,
 * the estimated next start as a ring tick. Built only from her own logs.
 */
export function CycleRing({ cycleDay, avgLength, periodLength, windowStart = null, windowEnd = null }) {
  const len = Math.max(avgLength || 28, cycleDay || 0, 21);
  const R = 74;
  const C = 2 * Math.PI * R;
  const at = (d) => ((d - 1) / len) * 2 * Math.PI - Math.PI / 2;
  const pt = (d, r = R) => [100 + Math.cos(at(d)) * r, 100 + Math.sin(at(d)) * r];
  const period = Math.min(periodLength || 0, len);
  const [tx, ty] = pt(cycleDay || 1);
  return (
    <svg className="ay-hd-ring" viewBox="0 0 200 200" aria-hidden="true">
      <circle className="ay-hd-ring-track" cx="100" cy="100" r={R} />
      <circle className="ay-hd-ring-edge" cx="100" cy="100" r={R + 8.5} />
      <circle className="ay-hd-ring-edge" cx="100" cy="100" r={R - 8.5} />
      {period > 0 && <circle className="ay-hd-ring-period" cx="100" cy="100" r={R} strokeDasharray={`${(period / len) * C} ${C}`} transform="rotate(-90 100 100)" />}
      {windowStart && windowEnd && <circle className="ay-hd-ring-window" cx="100" cy="100" r={R} strokeDasharray={`${((windowEnd - windowStart + 1) / len) * C} ${C}`} transform={`rotate(${((windowStart - 1) / len) * 360 - 90} 100 100)`} />}
      {Array.from({ length: len }, (_, i) => { const [x, y] = pt(i + 1, R - 15); return <circle key={i} className={`ay-hd-ring-tick${i + 1 <= (cycleDay || 0) ? ' is-past' : ''}`} cx={x} cy={y} r="1.6" />; })}
      {cycleDay && <circle className="ay-hd-ring-today" cx={tx} cy={ty} r="9" />}
    </svg>
  );
}
