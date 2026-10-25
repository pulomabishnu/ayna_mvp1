/**
 * The Rundown's data graphics (scratchpad/RUNDOWN_DATA_RESEARCH.md, section 2
 * for what each one borrows). Inline SVG, one device per card, drawn from
 * her numbers only. Motion is CSS in rundown-data.css: bars grow, rings and
 * lines draw in, about 700ms eased and staggered; reduced motion (or the
 * story's still mode) shows the final state. Every graphic has a text
 * equivalent for screen readers; the SVG itself is aria-hidden.
 */
import { FMT } from './rundownData.js';

const stagger = (i, base = 0) => ({ '--i': i, '--d': `${base + i * 60}ms` });

/** Playful drawn shapes (founder 23:49): one per card, decorative only. */
const SHAPES = {
  sparkle: 'M12 1c1 6 5 10 11 11-6 1-10 5-11 11-1-6-5-10-11-11 6-1 10-5 11-11z',
  asterisk: 'M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10',
};
export function Shape({ name, className = '' }) {
  if (name === 'flower') {
    return (
      <svg className={`ay-rdd-shape is-flower ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="12" cy="6.5" rx="3.6" ry="5" transform={`rotate(${a} 12 12)`} />)}
        <circle cx="12" cy="12" r="3" className="is-core" />
      </svg>
    );
  }
  return <svg className={`ay-rdd-shape is-${name} ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={SHAPES[name]} /></svg>;
}

/** Last 7 days as bars, today highlighted ("so far"), her usual as a dashed line. */
export function StepsChart({ week = [], usual = null, level = null }) {
  const W = 320; const H = 150; const top = 22; const bottom = 26;
  const vals = week.map((d) => d.value).filter((v) => v != null);
  const max = Math.max(...vals, usual || 0, 1) * 1.08;
  const y = (v) => H - bottom - ((H - bottom - top) * v) / max;
  const slot = W / week.length; const bw = Math.min(30, slot * 0.58);
  const uy = usual ? y(usual) : null;
  return (
    <figure className="ay-rdd-viz ay-rdd-steps" role="group" aria-label="Steps, last 7 days">
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        {week.map((d, i) => {
          const x = slot * i + (slot - bw) / 2;
          if (d.value == null) return <g key={d.day}><circle className="ay-rdd-miss" cx={x + bw / 2} cy={H - bottom - 4} r="3" /><text className="ay-rdd-axis" x={x + bw / 2} y={H - 8} textAnchor="middle">{d.label}</text></g>;
          const by = y(d.value);
          return (
            <g key={d.day}>
              <rect className={`ay-rdd-bar${d.today ? ' is-today' : ''} ay-rdd-anim`} style={stagger(i)} x={x} y={by} width={bw} height={Math.max(2, H - bottom - by)} rx={Math.min(8, bw / 2)} />
              {d.today && <text className="ay-rdd-tag ay-rdd-anim ay-rdd-fade" style={stagger(i, 300)} x={x + bw / 2} y={Math.max(12, by - 6)} textAnchor="middle">so far</text>}
              <text className={`ay-rdd-axis${d.today ? ' is-today' : ''}`} x={x + bw / 2} y={H - 8} textAnchor="middle">{d.today ? 'Today' : d.label}</text>
            </g>
          );
        })}
        {uy != null && <>
          <line className="ay-rdd-usual ay-rdd-anim" pathLength="1" x1="2" x2={W - 2} y1={uy} y2={uy} style={stagger(0, 520)} />
          <text className="ay-rdd-usual-label ay-rdd-anim ay-rdd-fade" style={stagger(0, 800)} x="4" y={uy - 6} textAnchor="start">your usual</text>
        </>}
      </svg>
      {(level === 'good' || level === 'steady') && <Shape name="sparkle" />}
      <ul className="sr-only">
        {week.map((d) => <li key={d.day}>{d.today ? 'Today so far' : d.label}: {d.value == null ? 'no data' : `${FMT.steps(d.value)} steps`}</li>)}
        {usual != null && <li>Your usual: about {FMT.steps(usual)} steps a day</li>}
      </ul>
    </figure>
  );
}

/** Last night as a ring filled to the share of her usual, the hours in the centre (a pink disc). */
export function SleepRing({ lastNight, usual = null, pct = null, nights = 0, learning = false }) {
  const r = 46; const C = 2 * Math.PI * r;
  const fill = pct == null ? 0 : Math.min(pct, 100);
  const over = pct != null && pct > 100 ? Math.min(pct - 100, 100) : 0;
  const label = learning ? `Last night: ${FMT.minutes(lastNight)}. ${nights} of 7 nights so far toward your usual.` : `Last night: ${FMT.minutes(lastNight)}, ${pct}% of your usual ${FMT.minutes(usual)}.`;
  return (
    <figure className="ay-rdd-viz ay-rdd-sleep" role="img" aria-label={label}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className="ay-rdd-ring">
        <circle className="ay-rdd-track" cx="60" cy="60" r={r} />
        {!learning && <circle className="ay-rdd-arc ay-rdd-anim" cx="60" cy="60" r={r} pathLength="100" style={{ strokeDashoffset: 100 - fill, ...stagger(0) }} transform="rotate(-90 60 60)" />}
        {over > 0 && <circle className="ay-rdd-arc is-over ay-rdd-anim" cx="60" cy="60" r={r - 9} pathLength="100" style={{ strokeDashoffset: 100 - over, ...stagger(0, 500) }} transform="rotate(-90 60 60)" />}
        <circle className="ay-rdd-seal" cx="60" cy="60" r={r - 15} />
        <text className="ay-rdd-big" x="60" y="60" textAnchor="middle">{FMT.minutes(lastNight)}</text>
        <text className="ay-rdd-small" x="60" y="76" textAnchor="middle">{learning ? 'last night' : `${pct}% of usual`}</text>
      </svg>
      {learning ? (
        <div className="ay-rdd-dots" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} className={`ay-rdd-anim${i < nights ? ' is-on' : ''}`} style={stagger(i, 200)} />)}</div>
      ) : (
        <dl className="ay-rdd-pair">
          <div><dt>Last night</dt><dd>{FMT.minutes(lastNight)}</dd></div>
          <div><dt>Your usual</dt><dd>{FMT.minutes(usual)}</dd></div>
        </dl>
      )}
    </figure>
  );
}

const TILE_WORD = { done: 'logged', gap: 'not logged', today: 'today', maybe: 'today, not sure yet', ahead: 'predicted' };
/** Period days as tiles: logged, today, and the days her usual says may be left. */
export function PeriodStrip({ strip = [], left = null }) {
  const n = strip.length; const tw = 30; const gap = 6; const W = n * (tw + gap) - gap + 4;
  return (
    <figure className="ay-rdd-viz ay-rdd-period" role="group" aria-label="Your period, day by day">
      <svg viewBox={`0 0 ${Math.max(W, 60)} 62`} aria-hidden="true" focusable="false" style={{ maxWidth: `${Math.max(W, 60) * 1.25}px` }}>
        {strip.map((t, i) => {
          const x = 2 + i * (tw + gap);
          return (
            <g key={t.n} className={`ay-rdd-tile is-${t.kind} ay-rdd-anim`} style={stagger(i)}>
              <rect x={x} y="14" width={tw} height="40" rx="9" />
              <text x={x + tw / 2} y="39" textAnchor="middle">{t.kind === 'maybe' ? '?' : t.n}</text>
              {(t.kind === 'today' || t.kind === 'maybe') && <path className="ay-rdd-pin" d={`M${x + tw / 2 - 5} 2h10l-5 7z`} />}
            </g>
          );
        })}
      </svg>
      {left != null && left > 0 && <span className="ay-rdd-num ay-rdd-anim" style={stagger(0, 450)} aria-hidden="true"><b>{left}</b><small>{left === 1 ? 'day left' : 'days left'}</small></span>}
      <Shape name="asterisk" />
      <ul className="sr-only">{strip.map((t) => <li key={t.n}>Day {t.n}: {TILE_WORD[t.kind]}</li>)}</ul>
    </figure>
  );
}

const arc = (cx, cy, r, a0, a1) => {
  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0); const [x1, y1] = p(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
/** Her cycle as one ring: period days, possible ovulation days, a dot for today. An estimate. */
export function CycleRing({ cycleDay, avgLength, periodLength = 0, phase = null }) {
  if (!avgLength) {
    return (
      <figure className="ay-rdd-viz ay-rdd-cycle is-solo" role="img" aria-label={`Cycle day ${cycleDay}`}>
        <span className="ay-rdd-num is-round ay-rdd-anim" style={stagger(0)} aria-hidden="true"><small>cycle day</small><b>{cycleDay}</b></span>
        <Shape name="flower" />
      </figure>
    );
  }
  const total = Math.max(avgLength, cycleDay);
  const ang = (d) => -Math.PI / 2 + (2 * Math.PI * (d - 1)) / total;
  const cx = 60; const cy = 60; const r = 46;
  const dot = ang(cycleDay + 0.5);
  const label = `Cycle day ${cycleDay} of about ${avgLength}. ${periodLength ? `Period days 1 to ${periodLength}. ` : ''}${phase?.windowStart ? `Possible ovulation days ${phase.windowStart} to ${phase.windowEnd}. ` : ''}An estimate.`;
  return (
    <figure className="ay-rdd-viz ay-rdd-cycle" role="img" aria-label={label}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className="ay-rdd-ring">
        <circle className="ay-rdd-track" cx={cx} cy={cy} r={r} />
        {periodLength > 0 && <path className="ay-rdd-seg is-period ay-rdd-anim" pathLength="1" d={arc(cx, cy, r, ang(1), ang(periodLength + 1) - 0.04)} style={stagger(0)} />}
        {phase?.windowStart && <path className="ay-rdd-seg is-window ay-rdd-anim" pathLength="1" d={arc(cx, cy, r, ang(phase.windowStart), ang(phase.windowEnd + 1) - 0.04)} style={stagger(2)} />}
        <circle className="ay-rdd-today ay-rdd-anim ay-rdd-pop" cx={cx + r * Math.cos(dot)} cy={cy + r * Math.sin(dot)} r="7" style={stagger(0, 600)} />
        <circle className="ay-rdd-seal" cx={cx} cy={cy} r={r - 13} />
        <text className="ay-rdd-small" x={cx} y={cy - 10} textAnchor="middle">day</text>
        <text className="ay-rdd-big" x={cx} y={cy + 8} textAnchor="middle">{cycleDay}</text>
        <text className="ay-rdd-small" x={cx} y={cy + 20} textAnchor="middle" style={{ fontSize: 7.5 }}>of about {avgLength}</text>
      </svg>
      <Shape name="flower" />
      <ul className="ay-rdd-key">
        {periodLength > 0 && <li><i className="is-period" aria-hidden="true" />Period</li>}
        {phase?.windowStart && <li><i className="is-window" aria-hidden="true" />Possible ovulation days</li>}
        <li><i className="is-today" aria-hidden="true" />Today</li>
      </ul>
    </figure>
  );
}

/** Her usual range as a track, last night as a dot. */
export function RangeTrack({ range }) {
  const { low, high, last, lowLabel, highLabel, lastLabel, what } = range;
  const span = Math.max(high - low, 1e-6);
  const lo = Math.min(low, last) - span * 0.6; const hi = Math.max(high, last) + span * 0.6;
  const x = (v) => 12 + (296 * (v - lo)) / (hi - lo);
  const inside = last >= low && last <= high;
  const label = `${what}: ${lastLabel}. Your usual range: ${lowLabel} to ${highLabel}. ${inside ? 'Inside' : 'Outside'} your usual range.`;
  return (
    <figure className="ay-rdd-viz ay-rdd-range" role="img" aria-label={label}>
      <svg viewBox="0 0 320 78" aria-hidden="true" focusable="false">
        <line className="ay-rdd-axisline" x1="12" x2="308" y1="40" y2="40" />
        <rect className="ay-rdd-band ay-rdd-anim" x={x(low)} y="30" width={Math.max(4, x(high) - x(low))} height="20" rx="10" style={stagger(0)} />
        <text className="ay-rdd-axis" x={x(low)} y="70" textAnchor={x(high) - x(low) < 70 ? 'end' : 'middle'}>{lowLabel}</text>
        <text className="ay-rdd-axis" x={x(high)} y="70" textAnchor={x(high) - x(low) < 70 ? 'start' : 'middle'}>{highLabel}</text>
        <g className="ay-rdd-dot ay-rdd-anim ay-rdd-pop" style={stagger(0, 450)}>
          <circle cx={x(last)} cy="40" r="9" />
          <text className="ay-rdd-tag" x={Math.min(296, Math.max(24, x(last)))} y="18" textAnchor="middle">{lastLabel}</text>
        </g>
      </svg>
    </figure>
  );
}

const ARROW = { up: 'M12 19V5M6 11l6-6 6 6', down: 'M12 5v14M6 13l6 6 6-6', flat: 'M5 12h14M13 6l6 6-6 6' };
/** Up to 3 small boxes: today vs the day before. */
export function DeltaBoxes({ deltas = [] }) {
  return (
    <ul className="ay-rdd-viz ay-rdd-deltas">
      {deltas.map((d, i) => (
        <li key={d.id} className="ay-rdd-anim ay-rdd-pop" style={stagger(i)}>
          <span className="ay-rdd-delta-label">{d.label}</span>
          <b>{d.value}</b>
          <span className={`ay-rdd-delta is-${d.dir}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={ARROW[d.dir]} /></svg>{d.change}<span className="sr-only"> since the day before</span></span>
        </li>
      ))}
    </ul>
  );
}

export const DATA_KINDS = new Set(['steps', 'sleep', 'period', 'cycle', 'signal', 'delta']);

export function DataViz({ card }) {
  switch (card.kind) {
    case 'steps': return <StepsChart week={card.week} usual={card.usual} level={card.level} />;
    case 'sleep': return <SleepRing lastNight={card.lastNight} usual={card.usual} pct={card.pct ?? null} nights={card.nights || 0} learning={Boolean(card.learning)} />;
    case 'period': return card.strip ? <PeriodStrip strip={card.strip} left={card.check ? null : card.left} /> : null;
    case 'cycle': return card.cycleDay ? <CycleRing cycleDay={card.cycleDay} avgLength={card.avgLength} periodLength={card.periodLength || 0} phase={card.phase} /> : null;
    case 'signal': return card.range ? <RangeTrack range={card.range} /> : null;
    case 'delta': return <DeltaBoxes deltas={card.deltas} />;
    default: return null;
  }
}
