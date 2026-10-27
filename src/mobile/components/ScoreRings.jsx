import { short } from '../../health/dashView.js';
import './score-rings.css';

/**
 * Three dials at the top of Your data (founder Oct 26: "better than Apple
 * Health"; WHOOP and Oura open on three dials): Cycle day, Sleep vs usual,
 * Activity vs usual. Real values only. A dial without data says so and the
 * row ends with one way to connect a watch or ring; nothing is estimated.
 * The arc is this week's value as a share of her own usual (a full ring is
 * her usual); the cycle arc is today's day of her average length.
 */
const R = 40;
const C = 2 * Math.PI * R;

function Dial({ fill = 0, tone = 'pink', center, unit = '', label, sub, dir = 0, onClick, aria }) {
  const f = Math.max(0, Math.min(1, fill));
  const inner = (
    <>
      <svg className="ay-dial__svg" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ay-dial__track" cx="50" cy="50" r={R} />
        {f > 0 && <circle className={`ay-dial__arc is-${tone}`} cx="50" cy="50" r={R} strokeDasharray={`${(C * f).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 50 50)" />}
      </svg>
      <span className="ay-dial__center" aria-hidden="true"><b className={center.length > 5 ? 'is-long' : ''}>{center}</b>{unit && <small>{unit}</small>}</span>
      <span className="ay-dial__label" aria-hidden="true">{label}</span>
      <span className="ay-dial__sub" aria-hidden="true">
        {dir !== 0 && <svg viewBox="0 0 24 24"><path d={dir > 0 ? 'M12 19V5M6 11l6-6 6 6' : 'M12 5v14M6 13l6 6 6-6'} /></svg>}
        {sub}
      </span>
    </>
  );
  return onClick
    ? <button type="button" className="ay-dial__dial" onClick={onClick} aria-label={aria}>{inner}</button>
    : <div className="ay-dial__dial" role="img" aria-label={aria}>{inner}</div>;
}

const vsUsual = (chart) => {
  const now = chart?.week ?? chart?.avg;
  if (now == null) return null;
  if (!chart.usual) return { fill: 0, dir: 0, sub: 'Learning your usual', now };
  const pct = now / chart.usual;
  const dir = pct > 1.03 ? 1 : pct < 0.97 ? -1 : 0;
  return { fill: pct, dir, sub: dir === 0 ? 'About usual' : `${Math.round(pct * 100)}% of usual`, now };
};

export default function ScoreRings({ cycle = null, hormonalBC = false, sleep = null, activity = null, onOpen = null, onConnect = null }) {
  const s = vsUsual(sleep);
  const a = vsUsual(activity);
  const missing = [!s && 'sleep', !a && 'activity'].filter(Boolean);
  const open = (area) => (onOpen ? () => onOpen(area) : undefined);
  return (
    <section className="ay-dials" aria-label="Your scores">
      <div className="ay-dial__row">
        {cycle?.cycleDay
          ? <Dial
            fill={!hormonalBC && cycle.avgLength ? cycle.cycleDay / cycle.avgLength : 0}
            center={String(cycle.cycleDay)}
            unit={!hormonalBC && cycle.avgLength ? `of ${cycle.avgLength}` : ''}
            label={hormonalBC ? 'Since bleed' : 'Cycle day'}
            sub={hormonalBC ? 'Days' : 'Estimated'}
            onClick={open('cycle')}
            aria={hormonalBC ? `Day ${cycle.cycleDay} since your last bleed.` : `Cycle day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}, estimated.${onOpen ? ' Open cycle.' : ''}`}
          />
          : <Dial center="No data" label="Cycle day" sub="Log a period" aria="Cycle day: no data yet." />}
        {s
          ? <Dial tone="ink" fill={s.fill} dir={s.dir} center={short('sleep_minutes', s.now)} label="Sleep" sub={s.sub} onClick={open('sleep')}
            aria={`Sleep: ${short('sleep_minutes', s.now)} a night this week${sleep.usual ? `, usual ${short('sleep_minutes', sleep.usual)}` : ''}. ${s.sub}.${onOpen ? ' Open sleep.' : ''}`} />
          : <Dial center="No data" label="Sleep" sub="Not connected" aria="Sleep: no data yet." />}
        {a
          ? <Dial tone="ink" fill={a.fill} dir={a.dir} center={short(activity.metric, a.now)} label={activity.metric === 'steps' ? 'Steps' : 'Activity'} sub={a.sub} onClick={open('body')}
            aria={`${activity.metric === 'steps' ? 'Steps' : 'Activity'}: ${short(activity.metric, a.now)} a day this week${activity.usual ? `, usual ${short(activity.metric, activity.usual)}` : ''}. ${a.sub}.${onOpen ? ' Open body.' : ''}`} />
          : <Dial center="No data" label="Activity" sub="Not connected" aria="Activity: no data yet." />}
      </div>
      {missing.length > 0 && (
        <div className="ay-dial__empty">
          <p>Connect a watch or ring to see your {missing.join(' and ')}.</p>
          {onConnect && <button type="button" onClick={onConnect}>Connect</button>}
        </div>
      )}
    </section>
  );
}
