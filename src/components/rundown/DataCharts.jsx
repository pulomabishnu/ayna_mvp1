/**
 * The Rundown's data graphics: one big visual per card, drawn from her
 * numbers only (rundownData.js). Inline SVG for the marks, HTML for every
 * number so text never drops under 13px. No decoration: no stickers, no
 * drawn shapes. Colours come from the story surface (story.css): the marks
 * use the surface ink and pink; blue is for chart lines only (her usual).
 * Motion: one draw-in per chart (bars grow, rings and the band draw), off in
 * the story's still mode and under reduced motion. Every graphic has a text
 * equivalent for screen readers; the SVG itself is aria-hidden.
 */
import { FMT } from './rundownData.js';

/** Last 7 days as bars, today pink ("so far"), her usual as a dashed blue line. */
export function StepsChart({ week = [], usual = null }) {
  const W = 320; const H = 168; const top = 24; const bottom = 28;
  const vals = week.map((d) => d.value).filter((v) => v != null);
  const max = Math.max(...vals, usual || 0, 1) * 1.08;
  const y = (v) => H - bottom - ((H - bottom - top) * v) / max;
  const slot = W / Math.max(week.length, 1); const bw = Math.min(28, slot * 0.56);
  const uy = usual ? y(usual) : null;
  // The big number is the day the card talks about: yesterday (a full day), else today so far.
  const ti = week.findIndex((d) => d.today);
  const yest = ti > 0 && week[ti - 1].value != null ? week[ti - 1] : null;
  const today = ti >= 0 && week[ti].value != null ? week[ti] : null;
  const hero = yest ? { v: yest.value, unit: 'steps yesterday' } : today ? { v: today.value, unit: 'steps so far today' } : null;
  return (
    <figure className="ay-rdd-viz ay-rdd-steps" role="group" aria-label="Steps, last 7 days">
      {hero && <p className="ays-big" aria-hidden="true"><b>{FMT.steps(hero.v)}</b><small>{hero.unit}</small></p>}
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        {week.map((d, i) => {
          const x = slot * i + (slot - bw) / 2;
          if (d.value == null) return <g key={d.day}><circle className="ay-rdd-miss" cx={x + bw / 2} cy={H - bottom - 4} r="3" /><text className="ay-rdd-axis" x={x + bw / 2} y={H - 6} textAnchor="middle">{d.label}</text></g>;
          const by = y(d.value);
          return (
            <g key={d.day}>
              <rect className={`ay-rdd-bar${d.today ? ' is-today' : ''} ay-rdd-anim`} x={x} y={by} width={bw} height={Math.max(2, H - bottom - by)} rx={Math.min(8, bw / 2)} />
              <text className={`ay-rdd-axis${d.today ? ' is-today' : ''}`} x={x + bw / 2} y={H - 6} textAnchor="middle">{d.today ? 'Today' : d.label}</text>
            </g>
          );
        })}
        {uy != null && <line className="ay-rdd-usual" x1="2" x2={W - 2} y1={uy} y2={uy} />}
      </svg>
      {usual != null && <figcaption className="ay-rdd-key is-row" aria-hidden="true"><span><i className="is-usual" />Your usual, about {FMT.steps(usual)}</span></figcaption>}
      <ul className="sr-only">
        {week.map((d) => <li key={d.day}>{d.today ? 'Today so far' : d.label}: {d.value == null ? 'no data' : `${FMT.steps(d.value)} steps`}</li>)}
        {usual != null && <li>Your usual: about {FMT.steps(usual)} steps a day</li>}
      </ul>
    </figure>
  );
}

/** A ring with HTML in its centre (the Your data dials): the big number and its unit. */
function Ring({ children, className = '', label, ...rest }) {
  return (
    <figure className={`ay-rdd-viz ay-rdd-ringwrap ${className}`.trim()} role="img" aria-label={label} {...rest}>
      <span className="ay-rdd-ringbox">
        {children[0]}
        <span className="ay-rdd-center" aria-hidden="true">{children[1]}</span>
      </span>
      {children[2] || null}
    </figure>
  );
}

/** Last night as a ring filled to the share of her usual, the hours in the centre. */
export function SleepRing({ lastNight, usual = null, pct = null, nights = 0, learning = false }) {
  const r = 52;
  const fill = pct == null ? 0 : Math.min(pct, 100);
  const over = pct != null && pct > 100 ? Math.min(pct - 100, 100) : 0;
  const label = learning ? `Last night: ${FMT.minutes(lastNight)}. ${nights} of 7 nights so far toward your usual.` : `Last night: ${FMT.minutes(lastNight)}, ${pct}% of your usual ${FMT.minutes(usual)}.`;
  return (
    <Ring className="ay-rdd-sleep" label={label}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className="ay-rdd-ring">
        <circle className="ay-rdd-track" cx="60" cy="60" r={r} />
        {!learning && <circle className="ay-rdd-arc ay-rdd-anim" cx="60" cy="60" r={r} pathLength="100" style={{ strokeDashoffset: 100 - fill }} transform="rotate(-90 60 60)" />}
        {over > 0 && <circle className="ay-rdd-arc is-over ay-rdd-anim" cx="60" cy="60" r={r - 12} pathLength="100" style={{ strokeDashoffset: 100 - over }} transform="rotate(-90 60 60)" />}
      </svg>
      <><b>{FMT.minutes(lastNight)}</b><small>{learning ? 'last night' : `${pct}% of usual`}</small></>
      {learning ? <div className="ay-rdd-dots" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < nights ? 'is-on' : ''} />)}</div> : null}
    </Ring>
  );
}

const TILE_WORD = { done: 'logged', gap: 'not logged', today: 'today', maybe: 'today, not sure yet', ahead: 'predicted' };
/** Period days as a row of day dots: logged, today, and the days her usual says may be left. */
export function PeriodStrip({ strip = [], left = null }) {
  return (
    <figure className="ay-rdd-viz ay-rdd-period" role="group" aria-label="Your period, day by day">
      {left != null && left > 0 && <p className="ays-big ay-rdd-num" aria-hidden="true"><b>{left}</b><small>{left === 1 ? 'day left' : 'days left'}</small></p>}
      <ol className="ay-rdd-days" aria-hidden="true">
        {strip.map((t) => <li key={t.n} className={`ay-rdd-tile is-${t.kind} ay-rdd-anim`}><span>{t.kind === 'maybe' ? '?' : t.n}</span></li>)}
      </ol>
      <ul className="sr-only">{strip.map((t) => <li key={t.n}>Day {t.n}: {TILE_WORD[t.kind]}</li>)}</ul>
    </figure>
  );
}

const arc = (cx, cy, r, a0, a1) => {
  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0); const [x1, y1] = p(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
/** Her cycle as one ring: period days pink, possible ovulation days a blue line, a dot for today. An estimate. */
export function CycleRing({ cycleDay, avgLength, periodLength = 0, phase = null }) {
  if (!avgLength) {
    return (
      <figure className="ay-rdd-viz ay-rdd-cycle is-solo" role="img" aria-label={`Cycle day ${cycleDay}`}>
        <p className="ays-big" aria-hidden="true"><small>cycle day</small><b>{cycleDay}</b></p>
      </figure>
    );
  }
  const total = Math.max(avgLength, cycleDay);
  const ang = (d) => -Math.PI / 2 + (2 * Math.PI * (d - 1)) / total;
  const cx = 60; const cy = 60; const r = 52;
  const dot = ang(cycleDay + 0.5);
  const label = `Cycle day ${cycleDay} of about ${avgLength}. ${periodLength ? `Period days 1 to ${periodLength}. ` : ''}${phase?.windowStart ? `Possible ovulation days ${phase.windowStart} to ${phase.windowEnd}. ` : ''}An estimate.`;
  return (
    <Ring className="ay-rdd-cycle" label={label}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className="ay-rdd-ring">
        <circle className="ay-rdd-track" cx={cx} cy={cy} r={r} />
        {periodLength > 0 && <path className="ay-rdd-seg is-period ay-rdd-anim" pathLength="1" d={arc(cx, cy, r, ang(1), ang(periodLength + 1) - 0.06)} />}
        {phase?.windowStart && <path className="ay-rdd-seg is-window ay-rdd-anim" pathLength="1" d={arc(cx, cy, r, ang(phase.windowStart), ang(phase.windowEnd + 1) - 0.06)} />}
        <circle className="ay-rdd-today" cx={cx + r * Math.cos(dot)} cy={cy + r * Math.sin(dot)} r="7" />
      </svg>
      <><small>day</small><b>{cycleDay}</b><small>of about {avgLength}</small></>
      <ul className="ay-rdd-key is-row" aria-hidden="true">
        {periodLength > 0 && <li><i className="is-period" />Period</li>}
        {phase?.windowStart && <li><i className="is-window" />Possible ovulation days</li>}
        <li><i className="is-today" />Today</li>
      </ul>
    </Ring>
  );
}

/** Her usual range as a band, the latest reading as a dot; the reading is the big number. */
export function RangeTrack({ range }) {
  const { low, high, last, lowLabel, highLabel, lastLabel, what } = range;
  const span = Math.max(high - low, 1e-6);
  const lo = Math.min(low, last) - span * 0.6; const hi = Math.max(high, last) + span * 0.6;
  const x = (v) => 12 + (296 * (v - lo)) / (hi - lo);
  const inside = last >= low && last <= high;
  const label = `${what}: ${lastLabel}. Your usual range: ${lowLabel} to ${highLabel}. ${inside ? 'Inside' : 'Outside'} your usual range.`;
  const m = String(lastLabel).match(/^([\d.,]+)\s*(.*)$/);
  return (
    <figure className="ay-rdd-viz ay-rdd-range" role="img" aria-label={label}>
      <p className="ays-big" aria-hidden="true"><b>{m ? m[1] : lastLabel}</b>{m && m[2] && <small>{m[2]}</small>}</p>
      <svg viewBox="0 0 320 40" aria-hidden="true" focusable="false">
        <line className="ay-rdd-axisline" x1="12" x2="308" y1="20" y2="20" />
        <rect className="ay-rdd-band ay-rdd-anim" x={x(low)} y="10" width={Math.max(4, x(high) - x(low))} height="20" rx="10" />
        <circle className="ay-rdd-dot" cx={x(last)} cy="20" r="9" />
      </svg>
      {/* Every mark captioned: which is her usual, which is the latest reading. */}
      <figcaption className="ay-rdd-key is-row" aria-hidden="true">
        <span><i className="is-band" />Your usual {lowLabel} to {highLabel}</span>
        <span><i className="is-dot" />Latest</span>
      </figcaption>
    </figure>
  );
}

const ARROW = { up: 'M12 19V5M6 11l6-6 6 6', down: 'M12 5v14M6 13l6 6 6-6', flat: 'M5 12h14M13 6l6 6-6 6' };
/** Up to 3 numbers: today vs the day before. */
export function DeltaBoxes({ deltas = [] }) {
  return (
    <ul className="ay-rdd-viz ay-rdd-deltas">
      {deltas.map((d) => (
        <li key={d.id}>
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
    case 'steps': return <StepsChart week={card.week} usual={card.usual} />;
    case 'sleep': return <SleepRing lastNight={card.lastNight} usual={card.usual} pct={card.pct ?? null} nights={card.nights || 0} learning={Boolean(card.learning)} />;
    case 'period': return card.strip ? <PeriodStrip strip={card.strip} left={card.check ? null : card.left} /> : null;
    case 'cycle': return card.cycleDay ? <CycleRing cycleDay={card.cycleDay} avgLength={card.avgLength} periodLength={card.periodLength || 0} phase={card.phase} /> : null;
    case 'signal': return card.range ? <RangeTrack range={card.range} /> : null;
    case 'delta': return <DeltaBoxes deltas={card.deltas} />;
    default: return null;
  }
}
