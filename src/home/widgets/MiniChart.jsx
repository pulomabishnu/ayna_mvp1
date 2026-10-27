/**
 * A small chart for Home widgets: bars (amounts, log levels) or a line.
 * Real points only: a day with nothing logged is a gap, never a guessed
 * value. Brand palette through the widget tokens (home-widgets.css). The
 * svg is described in words for screen readers; the first and last day are
 * printed under it.
 */
import { fmtDay } from './widgetData.js';

const W = 300;

/** A soft curve through the real points only (soft-curve trend, inspo 59f3adc7). */
function curve(pts) {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0][0] - 2},${pts[0][1]}h4`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}

export default function MiniChart({ points = [], kind = 'bar', min = null, max = null, label = '', height = 44, marks = null }) {
  const real = points.filter((p) => p.value != null);
  if (!real.length) return null;
  const vals = real.map((p) => p.value);
  const lo = min ?? Math.min(...vals);
  const hi = max ?? Math.max(...vals);
  const span = hi - lo || 1;
  const step = W / points.length;
  const x = (i) => step * i + step / 2;
  const y = (v) => height - 3 - ((v - lo) / span) * (height - 8);
  const bw = Math.max(2, step * 0.6);
  return (
    <figure className={`ay-w-chart is-${kind}`}>
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" role="img" aria-label={label} style={{ height }}>
        <line className="ay-w-chart__base" x1="0" x2={W} y1={height - 1} y2={height - 1} />
        {kind === 'bar'
          ? points.map((p, i) => (p.value == null ? null : <rect key={p.day} className={marks?.(p) ? 'is-mark' : ''} x={x(i) - bw / 2} y={Math.min(y(p.value), height - 4)} width={bw} height={Math.max(3, height - 1 - Math.min(y(p.value), height - 4))} rx={Math.min(2, bw / 2)} />))
          : <>
            <path className="ay-w-chart__line" d={curve(points.map((p, i) => (p.value == null ? null : [x(i), y(p.value)])).filter(Boolean))} />
            {kind === 'curve' && points.map((p, i) => (p.value == null ? null : <path key={p.day} className="ay-w-chart__dot" d={`M${x(i)},${y(p.value)}h0.01`} />))}
          </>}
      </svg>
      <figcaption><span>{fmtDay(points[0].day)}</span><span>{fmtDay(points[points.length - 1].day)}</span></figcaption>
    </figure>
  );
}
