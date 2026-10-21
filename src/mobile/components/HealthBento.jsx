import { estimatePhase, PHASES } from '../../health/phase.js';
import ProductImage from './ProductImage.jsx';
import { displayName } from '../utils/displayName.js';
import { brandOf } from '../data/brandFallback.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { LEVEL_WORD, NEED_WORDS } from '../../health/weekPicks.js';
import { goalsCovered, aynaAdds } from '../../health/beyondNumbers.js';
import '../../styles/week-explained.css';

/**
 * Pieces of Your health shared by the app and the website: the evidence
 * meter, source links, the phase strip, phase comparison, normal ranges,
 * goals covered, this week's picks, what ayna adds, and the starter shown
 * before any health data. The screen itself is HealthHome.jsx.
 * Every number comes from her own rows. Nothing is invented.
 */



/** Smooth line over the last 14 days with a dashed marker on the latest day. */
export function Line({ points, usual }) {
  const pts = points.slice(-14).filter((p) => p.value != null);
  if (pts.length < 2) return null;
  const vals = pts.map((p) => p.value).concat(usual != null ? [usual] : []);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (i) => 4 + (i / (pts.length - 1)) * 92;
  const y = (v) => 40 - ((v - lo) / span) * 32;
  const d = pts.map((p, i) => {
    if (!i) return `M${x(i)},${y(p.value)}`;
    const px = x(i - 1); const py = y(pts[i - 1].value);
    const cx = (px + x(i)) / 2;
    return `C${cx},${py} ${cx},${y(p.value)} ${x(i)},${y(p.value)}`;
  }).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg className="ay-bn-line" viewBox="0 0 100 46" preserveAspectRatio="none" aria-hidden="true">
      {usual != null && <line className="ay-bn-usual" x1="2" x2="98" y1={y(usual)} y2={y(usual)} />}
      <path d={d} />
      <line className="ay-bn-now" x1={x(pts.length - 1)} x2={x(pts.length - 1)} y1={y(last.value)} y2="46" />
      <circle cx={x(pts.length - 1)} cy={y(last.value)} r="2.4" />
    </svg>
  );
}

/** The four phases across her cycle, with today marked and what this phase can mean. */
export function PhaseStrip({ cycle }) {
  const phase = estimatePhase(cycle);
  if (!phase?.windowStart || !cycle.avgLength) return null;
  const L = Math.max(cycle.avgLength, cycle.cycleDay);
  const seg = [
    { id: 'period', from: 1, to: Math.max(1, cycle.periodLength || 5) },
    { id: 'follicular', from: Math.max(1, cycle.periodLength || 5) + 1, to: phase.windowStart - 1 },
    { id: 'ovulation', from: phase.windowStart, to: phase.windowEnd },
    { id: 'luteal', from: phase.windowEnd + 1, to: L },
  ].filter((x) => x.to >= x.from);
  const short = { period: 'Period', follicular: 'Follicular', ovulation: 'Ovulation', luteal: 'Luteal' };
  return (
    <section className="ay-bn-phases" aria-label="Your cycle phases">
      <div className="ay-bn-phasebar">
        {seg.map((x) => (
          <span key={x.id} className={`is-${x.id}${x.id === phase.id ? ' is-now' : ''}`} style={{ flex: x.to - x.from + 1 }} title={short[x.id]} />
        ))}
        <i className="ay-bn-today" style={{ left: `${((cycle.cycleDay - 0.5) / L) * 100}%` }} aria-hidden="true" />
      </div>
      <ul className="ay-bn-legend">
        {seg.map((x) => <li key={x.id} className={`is-${x.id}${x.id === phase.id ? ' is-now' : ''}`}><i aria-hidden="true" />{short[x.id]}<small>days {x.from}{x.to > x.from ? `-${x.to}` : ''}</small></li>)}
      </ul>
      <p>{PHASES[phase.id]?.what}</p>
    </section>
  );
}


/** A source link that opens in a new tab. */
export function SourceLink({ source }) {
  return <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>;
}

/**
 * What ayna adds to Apple Health: the founder's one line, then one sentence
 * each for her data, evidence, products and community, with her own counts
 * where they exist. Claims about ayna only, nothing about Apple beyond
 * "stores the numbers".
 */
export function AddsStrip({ items, intro = true }) {
  return (
    <section className="ay-wx-adds" aria-labelledby="ay-wx-adds-title">
      <h3 id="ay-wx-adds-title">What ayna adds to Apple Health</h3>
      {intro && <p className="ay-wx-adds-lead">Apple Health stores the numbers. ayna reads them against your cycle and tells you which of your products fit this week.</p>}
      <ul>
        {items.map((x) => <li key={x.id}><b>{x.label}</b><span>{x.text}</span></li>)}
      </ul>
    </section>
  );
}

/** This phase so far against the same cycle days of her last cycles. */
export function PhaseCompare({ data }) {
  if (!data) return null;
  return (
    <section className="ay-wx-group ay-wx-compare" aria-labelledby="ay-wx-compare-title">
      <h3 id="ay-wx-compare-title">{data.title}</h3>
      <table>
        <thead><tr><th scope="col"><span className="sr-only">Measure</span></th><th scope="col">Now</th><th scope="col">Last {data.cycles}</th></tr></thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.metric}>
              <th scope="row">{r.label}<small>{r.word}</small></th>
              <td>{r.now}</td>
              <td>{r.usual}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ay-wx-note">{data.note}</p>
    </section>
  );
}

/** Her cycle and period lengths next to the typical ranges, with the source. */
export function NormalRanges({ data }) {
  if (!data) return null;
  return (
    <section className="ay-wx-group ay-wx-normal" aria-labelledby="ay-wx-normal-title">
      <h3 id="ay-wx-normal-title">Is this normal?</h3>
      <ul>
        {data.rows.map((r) => (
          <li key={r.id} className={r.ok ? 'is-ok' : 'is-out'}>
            <span className="ay-wx-normal-label">{r.label}</span>
            <b>{r.value}</b>
            <small>{r.ok ? 'Typical' : 'Outside the typical range of'} {r.typical}</small>
          </li>
        ))}
      </ul>
      <p className="ay-wx-note">{data.note} Source: <SourceLink source={data.source} /></p>
    </section>
  );
}

/** Each goal from her quiz, with what in her ecosystem is graded for it. */
export function GoalsCovered({ goals, effects = [], onOpenProduct, title = 'Your goals, covered' }) {
  if (!goals.length && !effects.length) return null;
  const item = (product, level, prefix) => (
    <button type="button" className="ay-wx-goal-product" onClick={() => onOpenProduct?.(product)}>
      <span>{prefix}{displayName(product)}</span>
      <Meter level={level} short />
    </button>
  );
  return (
    <section className="ay-wx-group ay-wx-goals" aria-labelledby="ay-wx-goals-title">
      <h3 id="ay-wx-goals-title">{title}</h3>
      <ul>
        {goals.map((g) => (
          <li key={g.needId}>
            <span className="ay-wx-goal-label">{g.label}</span>
            {g.owned.map((o) => <div key={o.product.id}>{item(o.product, o.level, '')}</div>)}
            {!g.owned.length && g.match && <div>{item(g.match.product, g.match.level, 'Not in your ecosystem yet. Matched: ')}</div>}
          </li>
        ))}
        {effects.map((e) => (
          <li key={`fx-${e.product.id}`} className="is-effect">
            <span className="ay-wx-goal-label">{displayName(e.product)}, before and since</span>
            <p>{e.text}</p>
            <p className="ay-wx-note">{e.caveat} <SourceLink source={e.sources[0]} /></p>
          </li>
        ))}
      </ul>
      <p className="ay-wx-note">Grades are ayna&rsquo;s reading of the research for that goal. Open a product for the studies.</p>
    </section>
  );
}

/**
 * For someone with no connected health data yet: what ayna adds, her goals
 * matched to her products (from the quiz alone), and how to connect.
 */
export function HealthStarter({ needIds = [], products = [], matches = [], onOpenProduct, onConnect, connectLabel = 'Connect health data' }) {
  const goals = goalsCovered({ needIds, products, matches });
  const adds = aynaAdds({ products, needIds });
  return (
    <div className="ay-bn ay-wx-starter">
      <AddsStrip items={adds} />
      <GoalsCovered goals={goals} onOpenProduct={onOpenProduct} title="Your goals, covered today" />
      {onConnect && (
        <div className="ay-wx-connect">
          <p>Connect Apple Health, Health Connect or Oura and this page explains your week against your cycle: what changed, why it often does, and which of your products fit.</p>
          <button type="button" className="ay-qc-primary ay-wx-connect-btn" onClick={onConnect}>{connectLabel}</button>
        </div>
      )}
    </div>
  );
}

export function Meter({ level, need, short = false }) {
  if (!level) return null;
  return (
    <span className="ay-wx-meter" data-level={level}>
      <span className="ay-wx-meter-bars" role="img" aria-label={`${LEVEL_WORD[level]}${need ? ` for ${need}` : ''}, ${level} of 3`}><i /><i /><i /></span>
      <span className="ay-wx-meter-word">{short ? LEVEL_WORD[level].replace(' evidence', '') : LEVEL_WORD[level]}</span>
    </span>
  );
}

/**
 * What might help this week: her products (then matches), each with the
 * reason from her data and the product's evidence grade. One card anatomy
 * (white tile, brand, name, price), the same in the app and on the website.
 */
export function WeekPicks({ picks, onOpenProduct }) {
  if (!picks.length) return null;
  return (
    <section className="ay-wx-picks" aria-labelledby="ay-wx-picks-title">
      <h3 id="ay-wx-picks-title">What might help this week</h3>
      <ul className="ay-wx-picks-row">
        {picks.map((pk) => {
          const p = pk.product;
          const brand = brandOf(p);
          const name = displayName(p);
          const price = formatPrice({ ...p, price: p.price || p.priceDisplay });
          return (
            <li key={p.id} className="ay-wx-pick">
              <button type="button" className="ay-wx-card" onClick={() => onOpenProduct?.(p)} aria-label={`${name}${brand ? ` by ${brand}` : ''}. ${pk.reason} View product details`}>
                <span className="ay-wx-tile"><ProductImage product={p} src={p.image || p.imageUrl} alt="" style={{ objectFit: 'contain' }} /></span>
                {brand && brand.toLowerCase() !== String(name).toLowerCase() && <small className="ay-wx-brand">{brand}</small>}
                <strong className="ay-wx-name">{name}</strong>
                {price.main !== 'Price at retailer' && <span className="ay-wx-price">{price.main}</span>}
              </button>
              <p className="ay-wx-reason">{pk.reason}</p>
              <Meter level={pk.level} need={NEED_WORDS[pk.needId]} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
