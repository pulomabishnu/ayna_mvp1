import { formatMetric, isFlat, trendWord } from '../../health/dashboard.js';
import { CycleRing } from './HealthChart.jsx';
import { estimatePhase, PHASES } from '../../health/phase.js';
import ProductImage from './ProductImage.jsx';
import { displayName } from '../utils/displayName.js';
import { brandOf } from '../data/brandFallback.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { weekQuestions } from '../utils/dashboardAsk.js';
import { explainWeek, cycleLine } from '../../health/weekInsights.js';
import { weekPicks, LEVEL_WORD, NEED_WORDS } from '../../health/weekPicks.js';
import { comingUp } from '../../health/comingUp.js';
import { phaseCompare, normalRanges, goalsCovered, effectChecks, aynaAdds } from '../../health/beyondNumbers.js';
import { SOURCE_NAMES } from '../data/healthConnections.js';
import '../../styles/week-explained.css';

/**
 * The Summary view of Your health (app and website). Top to bottom:
 * This week, explained (the one Feature: her numbers read against her cycle,
 * src/health/weekInsights.js), What might help this week (her products for
 * what this week implies, src/health/weekPicks.js), Ask ayna about your week,
 * her cycle (Group), Coming up with what to expect (src/health/comingUp.js),
 * then the metric tiles. This is the answer to "why not just Apple Health":
 * Apple Health shows the numbers, ayna explains them against her cycle and
 * connects them to her products and their evidence.
 * Every number comes from her own rows. Nothing is invented: a block only
 * shows when there is data for it.
 */

const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtWeekday = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

const TONES = ['sky', 'ink', 'butter', 'pink'];

/** Smooth line over the last 14 days with a dashed marker on the latest day. */
function Line({ points, usual }) {
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

function stats(c) {
  const vals = c.points.slice(-7).map((p) => p.value).filter((v) => v != null);
  if (!vals.length) return [];
  const show = (v) => (c.metric === 'steps' ? Math.round(v).toLocaleString('en-US') : formatMetric(c.metric, v));
  return [
    { k: 'Usual', v: c.usual != null ? show(c.usual) : 'Building' },
    { k: 'Low', v: show(Math.min(...vals)) },
    { k: 'High', v: show(Math.max(...vals)) },
  ];
}

function vsUsual(c) {
  if (c.delta == null || c.usual == null) return 'Building your usual, about two weeks of data';
  if (isFlat(c.metric, c.delta)) return 'Right around your usual';
  const amt = c.metric === 'steps' ? Math.abs(Math.round(c.delta)).toLocaleString('en-US') : formatMetric(c.metric, Math.abs(c.delta));
  const more = c.metric === 'sleep_minutes' ? (c.delta > 0 ? 'more' : 'less') : c.metric === 'steps' ? (c.delta > 0 ? 'more' : 'fewer') : (c.delta > 0 ? 'higher' : 'lower');
  return `${amt} ${more} than your usual`;
}

function MetricCard({ chart, tone, wide, onOpen }) {
  const big = chart.metric === 'steps' ? Math.round(chart.week ?? chart.avg).toLocaleString('en-US') : formatMetric(chart.metric, chart.week ?? chart.avg);
  const word = trendWord(chart.metric, chart.delta);
  const per = chart.metric === 'sleep_minutes' ? 'a night, last 7 days' : 'a day, last 7 days';
  return (
    <li className={`ay-bn-card is-${tone}${wide ? ' is-wide' : ''}`}>
      <button type="button" onClick={onOpen} aria-label={`${chart.label}: ${big} ${per}, ${word.toLowerCase()} than usual. Open charts.`}>
        <span className="ay-bn-label">{chart.label}</span>
        <span className="ay-bn-big">{big}</span>
        <span className="ay-bn-per">{per}</span>
        <span className="ay-bn-vs">{vsUsual(chart)}</span>
        <span className="ay-bn-stats">
          {stats(chart).map((s) => <span key={s.k}><b>{s.v}</b><small>{s.k}</small></span>)}
        </span>
        <Line points={chart.points} usual={chart.usual} />
      </button>
    </li>
  );
}

function CycleCard({ cycle, estimate, onOpen }) {
  const phase = estimatePhase(cycle);
  const phaseName = phase ? (phase.id === 'ovulation' ? 'Around ovulation' : phase.name) : 'Your cycle';
  return (
    <button type="button" className="ay-bn-cycle" onClick={onOpen} aria-label={`Cycle day ${cycle.cycleDay}. ${phaseName}. Open cycle charts.`}>
      <span className="ay-bn-cycle-text">
        <span className="ay-bn-big">Day {cycle.cycleDay}</span>
        <span className="ay-bn-phase">{phaseName}</span>
        <span className="ay-bn-stats">
          {cycle.avgLength && <span><b>{cycle.avgLength} days</b><small>Usual cycle</small></span>}
          {estimate && <span><b>{fmtDay(estimate.day)}</b><small>Next period</small></span>}
        </span>
      </span>
      <span className="ay-bn-ring">
        <CycleRing cycleDay={cycle.cycleDay} avgLength={cycle.avgLength} periodLength={cycle.periodLength} windowStart={phase?.windowStart} windowEnd={phase?.windowEnd} />
      </span>
    </button>
  );
}

/** The four phases across her cycle, with today marked and what this phase can mean. */
function PhaseStrip({ cycle }) {
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

const SPARK = 'M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z';

/** A plain summary of her week and questions built from it; a tap asks ayna with her numbers attached. */
function AskWeek({ summary, questions, onAsk }) {
  if (!onAsk || (!summary && !questions.length)) return null;
  return (
    <section className="ay-askweek" aria-labelledby="ay-askweek-title">
      <h3 id="ay-askweek-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={SPARK} /></svg>Ask ayna about your week</h3>
      {summary && <p>{summary}</p>}
      {questions.length > 0 && (
        <ul>
          {questions.map((q) => (
            <li key={q}><button type="button" onClick={() => onAsk(q)}><span>{q}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg></button></li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** A source link that opens in a new tab. */
function SourceLink({ source }) {
  return <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>;
}

/**
 * "This week, explained": the one Feature block. Two or three sentences from
 * her own numbers, each tied to her cycle or her own pattern, each with a
 * "Why we say this" that shows the comparison and the source.
 */
function Explained({ insights, line, onAsk }) {
  if (!insights.length) return null;
  const KEY = { heart: 'Heart', sleep: 'Sleep', temperature: 'Temperature', period: 'Cycle' };
  return (
    <section className="ay-wx-explain" aria-labelledby="ay-wx-explain-title">
      <header>
        <h3 id="ay-wx-explain-title">This week, explained</h3>
        {line && <p className="ay-wx-cycle">{line}</p>}
      </header>
      <ul>
        {insights.map((it) => (
          <li key={it.id}>
            <b className="ay-wx-k">{KEY[it.id] || it.id}</b>
            <p>{it.text}</p>
            <div className="ay-wx-actions">
            <details>
              <summary>Why we say this</summary>
              <div className="ay-wx-why-body">
                {it.basis && <p>{it.basis}</p>}
                {it.sources.length > 0 && <p>Source{it.sources.length > 1 ? 's' : ''}: {it.sources.map((src, i) => <span key={src.url}>{i ? '; ' : ''}<SourceLink source={src} /></span>)}</p>}
                {it.from?.length > 0 && <p>Your data: {it.from.map((x) => SOURCE_NAMES[x] || x).join(' and ')}.</p>}
              </div>
            </details>
            {onAsk && it.question && <button type="button" className="ay-wx-ask" onClick={() => onAsk(it.question)}>Ask ayna<span className="sr-only">: {it.question}</span></button>}
            </div>
          </li>
        ))}
      </ul>
      <p className="ay-wx-foot">Compared only with your own last 4 weeks. Patterns, not a diagnosis.</p>
    </section>
  );
}

/**
 * What ayna adds to Apple Health: the founder's one line, then one sentence
 * each for her data, evidence, products and community, with her own counts
 * where they exist. Claims about ayna only, nothing about Apple beyond
 * "stores the numbers".
 */
function AddsStrip({ items, intro = true }) {
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
function PhaseCompare({ data }) {
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
function NormalRanges({ data }) {
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

/** Each goal from her quiz, with what in her Ecosystem is graded for it. */
function GoalsCovered({ goals, effects = [], onOpenProduct, title = 'Your goals, covered' }) {
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
            {!g.owned.length && g.match && <div>{item(g.match.product, g.match.level, 'Not in your Ecosystem yet. Matched: ')}</div>}
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

function Meter({ level, need, short = false }) {
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
function WeekPicks({ picks, onOpenProduct }) {
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

export default function HealthBento({ name, cycle, estimate, pinnedCharts, today, onOpenArea, rows = [], needIds = [], hormonalBC = false, products = [], matches = [], onOpenProduct, onAsk }) {
  const { insights, ctx } = explainWeek(rows, { today, cycle, estimate, hormonalBC });
  const picks = weekPicks({ ctx, insights, needIds, products, matches });
  const coming = comingUp(cycle, estimate, today, { hormonalBC, hasProducts: products.length > 0 });
  const compare = phaseCompare(rows, { today, cycle, hormonalBC });
  const ranges = normalRanges(rows, { today, hormonalBC });
  const goals = goalsCovered({ needIds, products, matches });
  const effects = effectChecks(rows, { today, products });
  const adds = aynaAdds({ insights, picks, products, needIds, phaseName: ctx.phase ? ctx.phase.name.toLowerCase() : null });
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  // Questions not already offered next to an insight.
  const asked = new Set(insights.map((i) => i.question));
  const questions = weekQuestions({ insights: [], ctx, picks }).filter((q) => !asked.has(q));
  if (ranges && !ranges.allOk) questions.push('Is my cycle length something to ask a clinician about?');
  const ask = onAsk ? (q) => onAsk(q, { insights }) : undefined;

  return (
    <div className="ay-bn">
      <header className="ay-bn-hello">
        <h2>{hello}{name ? `, ${name}` : ''}</h2>
      </header>

      <Explained insights={insights} line={cycleLine(cycle, ctx)} onAsk={ask} />

      <AddsStrip items={adds} />

      <WeekPicks picks={picks} onOpenProduct={onOpenProduct} />

      <PhaseCompare data={compare} />

      {cycle?.cycleDay && (
        <div className="ay-bn-cyclegroup">
          <CycleCard cycle={cycle} estimate={estimate} onOpen={() => onOpenArea('cycle')} />
          <PhaseStrip cycle={cycle} />
        </div>
      )}

      {coming.length > 0 && (
        <section className="ay-bn-timeline" aria-labelledby="ay-bn-tl">
          <h3 id="ay-bn-tl">Coming up</h3>
          <ol>
            {coming.map((e) => (
              <li key={e.title + e.day} className={`is-${e.tone}`}>
                <span className="ay-bn-tl-date"><b>{fmtDay(e.day).split(' ')[1]}</b><small>{fmtWeekday(e.day)}</small></span>
                <span className="ay-bn-tl-card">
                  <b>{e.title}</b>
                  {e.sub && <small>{e.sub}</small>}
                  {e.expect && <small className="ay-bn-tl-expect">{e.expect}{e.source && <> <SourceLink source={{ ...e.source, label: 'Source' }} /></>}</small>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <NormalRanges data={ranges} />

      <GoalsCovered goals={goals} effects={effects} onOpenProduct={onOpenProduct} />

      <AskWeek summary={null} questions={questions.slice(0, 3)} onAsk={ask} />

      {pinnedCharts.length > 0 && (
        <ul className="ay-bn-grid" aria-label="Your pinned numbers">
          {pinnedCharts.map((c, i) => (
            <MetricCard key={c.metric} chart={c} tone={TONES[i % TONES.length]} wide={i === pinnedCharts.length - 1 && i % 2 === 0} onOpen={() => onOpenArea(c.group)} />
          ))}
        </ul>
      )}
    </div>
  );
}
