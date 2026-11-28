/*
 * Partner Studio chart kit, following Tableau, Power BI and Nielsen Norman
 * guidance: horizontal bars for rankings, 100% stacked bars for composition,
 * dumbbells for gaps, matrices for multi-attribute comparison, Pareto for
 * mutually exclusive reasons, sortable tables for exact values. No donuts,
 * gauges, 3D or dual axes. Every chart labels exact values and never relies
 * on color alone. Bars start at zero.
 */
import React, { useMemo, useState } from 'react';
import { InfoTip } from './ui.jsx';

import { C } from './chartColors.js';

const fmtNum = (v, unit = '') => (v == null ? 'N/A' : `${Math.round(v * 10) / 10}${unit}`);

/** Small segmented control for switching between alternative views of the same data. */
export function ViewSwitch({ views, value, onChange, label = 'View' }) {
  return (
    <div className="ps-seg ps-seg--sm" role="tablist" aria-label={label}>
      {views.map(([id, text]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} className="ps-seg-btn" onClick={() => onChange(id)}>{text}</button>
      ))}
    </div>
  );
}

/** Card frame used by every page section: title, (i) tip, optional switch, body. */
export function Panel({ title, info, right, children, className = '', id }) {
  return (
    <section className={`ps-card ps-panel ${className}`} aria-labelledby={id}>
      <div className="ps-panel-head">
        <h2 id={id}>{title}<InfoTip text={info} /></h2>
        {right ? <div className="ps-panel-right">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Ranked horizontal bars. rows: [{ label, value, you, sub, tag }]. */
export function RankedBars({ rows, unit = '%', max, bench, benchLabel = 'Median', total, valueText }) {
  const hi = max ?? Math.max(...rows.map((r) => r.value || 0), bench || 0, 1);
  return (
    <div className="ps-bars" role="table" aria-label="Ranked comparison">
      {rows.map((r, i) => (
        <div key={`${r.label}-${i}`} className={`ps-bars-row${r.you ? ' is-you' : ''}`} role="row">
          <span className="ps-bars-label" role="cell"><b>{r.label}</b>{r.tag}{r.sub ? <small>{r.sub}</small> : null}</span>
          <span className="ps-bars-track" role="cell">
            <span className="ps-bars-fill" style={{ width: `${((r.value || 0) / hi) * 100}%`, background: r.you ? C.you : (r.color || C.rival) }} />
            {bench != null ? <span className="ps-bars-bench" style={{ left: `${(bench / hi) * 100}%` }} title={`${benchLabel}: ${fmtNum(bench, unit)}`} /> : null}
          </span>
          <span className="ps-bars-val" role="cell">{valueText ? valueText(r) : fmtNum(r.value, unit)}</span>
        </div>
      ))}
      {bench != null || total != null ? (
        <div className="ps-chart-note">
          {bench != null ? <span><i className="ps-dash" /> {benchLabel}: {fmtNum(bench, unit)}</span> : null}
          {total != null ? <span>{total}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/** 100% stacked horizontal bars. keys: [{ key, label, color, pattern }]; rows: [{ label, you, counts: {key: n} }]. */
export function Stacked100({ rows, keys }) {
  return (
    <div className="ps-s100">
      {rows.map((r) => {
        const total = keys.reduce((a, k) => a + (r.counts[k.key] || 0), 0);
        return (
          <div key={r.label} className={`ps-s100-row${r.you ? ' is-you' : ''}`}>
            <span className="ps-s100-label"><b>{r.label}</b><small>{total ? `${total} total` : 'No data'}</small></span>
            <span className="ps-s100-bar" role="img" aria-label={`${r.label}: ${keys.map((k) => `${k.label} ${r.counts[k.key] || 0}`).join(', ')}`}>
              {total ? keys.map((k) => {
                const n = r.counts[k.key] || 0;
                if (!n) return null;
                const pct = (n / total) * 100;
                return <span key={k.key} className={k.pattern ? 'ps-hatch-soft' : ''} style={{ flex: `${n} 1 0`, background: k.pattern ? undefined : k.color, color: k.dark ? '#ffedac' : '#3e2723' }} title={`${k.label}: ${n} (${Math.round(pct)}%)`}>{pct >= 9 ? `${Math.round(pct)}%` : ''}</span>;
              }) : <span className="ps-s100-empty">No data</span>}
            </span>
          </div>
        );
      })}
      <Legend items={keys} />
    </div>
  );
}

export function Legend({ items }) {
  return (
    <ul className="ps-legend2">
      {items.map((k) => <li key={k.key || k.label}><i className={k.pattern ? 'ps-hatch-soft' : ''} style={k.pattern ? undefined : { background: k.color }} />{k.label}</li>)}
    </ul>
  );
}

/** Dumbbell: your value vs benchmark on the same 0-100 scale. rows: [{ label, you, bench, unit }]. */
export function Dumbbell({ rows, youLabel = 'You', benchLabel = 'Competitor median', max = 100 }) {
  return (
    <div className="ps-db">
      {rows.map((r) => {
        const has = r.you != null && r.bench != null;
        const diff = has ? Math.round((r.you - r.bench) * 10) / 10 : null;
        const a = r.you == null ? null : (r.you / max) * 100;
        const b = r.bench == null ? null : (r.bench / max) * 100;
        return (
          <div key={r.label} className="ps-db-row">
            <span className="ps-db-label"><b>{r.label}</b><small>{r.note || ''}</small></span>
            <span className="ps-db-track" role="img" aria-label={`${r.label}: ${youLabel} ${fmtNum(r.you, r.unit)}, ${benchLabel} ${fmtNum(r.bench, r.unit)}`}>
              {has ? <span className="ps-db-line" style={{ left: `${Math.min(a, b)}%`, width: `${Math.abs(a - b)}%`, background: diff >= 0 ? C.good : C.amber }} /> : null}
              {b != null ? <span className="ps-db-dot ps-db-dot--bench" style={{ left: `${b}%` }} /> : null}
              {a != null ? <span className="ps-db-dot ps-db-dot--you" style={{ left: `${a}%` }} /> : null}
            </span>
            <span className="ps-db-val">
              <b>{fmtNum(r.you, r.unit)}</b> vs {fmtNum(r.bench, r.unit)}
              {has ? <em className={diff >= 0 ? 'is-up' : 'is-down'}>{diff >= 0 ? '+' : ''}{diff}{r.unit === '%' ? ' pp' : r.unit}</em> : <em>N/A</em>}
            </span>
          </div>
        );
      })}
      <ul className="ps-legend2">
        <li><i className="ps-db-key ps-db-key--you" />{youLabel}</li>
        <li><i className="ps-db-key ps-db-key--bench" />{benchLabel}</li>
        <li><i style={{ background: C.good }} />Ahead</li>
        <li><i style={{ background: C.amber }} />Behind</li>
      </ul>
    </div>
  );
}

/** Matrix / heatmap. cols: [{ key, label, sub, you }]; rows: [{ key, label, group, sub }]; cell(row, col) -> { text, color, dark, title, onClick }. */
export function Matrix({ rows, cols, cell, legend, corner = '' }) {
  return (
    <div className="ps-mx-wrap">
      <table className="ps-mx">
        <thead>
          <tr>
            <th className="ps-mx-corner">{corner}</th>
            {cols.map((c) => <th key={c.key} className={c.you ? 'is-you' : ''}><span>{c.label}</span>{c.sub ? <small>{c.sub}</small> : null}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const head = r.group && r.group !== rows[ri - 1]?.group ? r.group : null;
            return (
              <React.Fragment key={r.key}>
                {head ? <tr className="ps-mx-group"><td colSpan={cols.length + 1}>{head}</td></tr> : null}
                <tr>
                  <th scope="row"><span>{r.label}</span>{r.sub ? <small>{r.sub}</small> : null}</th>
                  {cols.map((c) => {
                    const v = cell(r, c) || {};
                    const content = <span className="ps-mx-text">{v.text}</span>;
                    return (
                      <td key={c.key} className={`${c.you ? 'is-you ' : ''}${v.pattern ? 'ps-hatch-soft' : ''}`} style={{ background: v.pattern ? undefined : v.color, color: v.dark ? '#ffedac' : undefined }} title={v.title}>
                        {v.onClick ? <button type="button" className="ps-mx-btn" onClick={v.onClick}>{content}</button> : content}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {legend ? <Legend items={legend} /> : null}
    </div>
  );
}

/** Pareto: bars for mutually exclusive reasons plus a cumulative % line. */
export function Pareto({ rows }) {
  const total = rows.reduce((a, r) => a + r.n, 0);
  if (!total) return <p className="ps-small ps-muted">No losses to rank.</p>;
  const W = 640;
  const H = 240;
  const pad = { l: 36, r: 40, t: 14, b: 70 };
  const bw = (W - pad.l - pad.r) / rows.length;
  const hi = Math.max(...rows.map((r) => r.n));
  const cums = rows.map((_, i) => rows.slice(0, i + 1).reduce((a, x) => a + x.n, 0));
  const pts = cums.map((cum, i) => [pad.l + bw * i + bw / 2, pad.t + (H - pad.t - pad.b) * (1 - cum / total), Math.round((cum / total) * 100)]);
  return (
    <svg className="ps-pareto" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={rows.map((r) => `${r.label} ${r.n}`).join(', ')}>
      {[0, 0.5, 1].map((t) => <line key={t} x1={pad.l} x2={W - pad.r} y1={pad.t + (H - pad.t - pad.b) * (1 - t)} y2={pad.t + (H - pad.t - pad.b) * (1 - t)} stroke="rgba(62,39,35,.12)" />)}
      {rows.map((r, i) => {
        const h = ((H - pad.t - pad.b) * r.n) / hi;
        const x = pad.l + bw * i + bw * 0.15;
        return (
          <g key={r.label}>
            <rect x={x} y={H - pad.b - h} width={bw * 0.7} height={h} rx="4" fill={r.color || C.rival} />
            <text x={x + bw * 0.35} y={H - pad.b - h - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#3e2723">{r.n}</text>
            <text x={x + bw * 0.35} y={H - pad.b + 14} textAnchor="end" fontSize="10.5" fill="#3e2723" transform={`rotate(-30 ${x + bw * 0.35} ${H - pad.b + 14})`}>{r.short || r.label}</text>
          </g>
        );
      })}
      <polyline points={pts.map((p) => `${p[0]},${p[1]}`).join(' ')} fill="none" stroke={C.you} strokeWidth="2" />
      {pts.map((p) => <g key={p[0]}><circle cx={p[0]} cy={p[1]} r="3.5" fill={C.you} /><text x={p[0]} y={p[1] - 7} textAnchor="middle" fontSize="10" fill="#3e2723">{p[2]}%</text></g>)}
      <text x={W - pad.r + 6} y={pad.t + 4} fontSize="10" fill="#8a7f78">100%</text>
      <text x={W - pad.r + 6} y={H - pad.b} fontSize="10" fill="#8a7f78">0%</text>
      <text x={pad.l - 6} y={pad.t + 4} textAnchor="end" fontSize="10" fill="#8a7f78">{hi}</text>
      <text x={pad.l - 6} y={H - pad.b} textAnchor="end" fontSize="10" fill="#8a7f78">0</text>
    </svg>
  );
}

/** Funnel with one consistent denominator (the first step). steps: [{ label, n, note }]. */
export function FunnelBars({ steps }) {
  const base = steps[0]?.n || 1;
  return (
    <ol className="ps-fun">
      {steps.map((s, i) => (
        <li key={s.label}>
          <span className="ps-fun-label"><b>{i + 1}. {s.label}</b>{s.note ? <small>{s.note}</small> : null}</span>
          <span className="ps-fun-track"><span style={{ width: `${Math.max((s.n / base) * 100, 1.5)}%`, background: i === steps.length - 1 ? C.you : C.rival }} /></span>
          <span className="ps-fun-val"><b>{s.n}</b> <small>{Math.round((s.n / base) * 100)}%</small></span>
        </li>
      ))}
    </ol>
  );
}

/** Grouped horizontal bars. groups: [{ label, items: [{ name, value, you }] }]. */
export function GroupedBars({ groups, unit = '', max }) {
  const hi = max ?? Math.max(1, ...groups.flatMap((g) => g.items.map((x) => x.value || 0)));
  const names = [...new Set(groups.flatMap((g) => g.items.map((x) => x.name)))];
  const palette = [C.rival, C.rival2, '#b9c4ab', C.amberLight];
  const colorOf = (it) => (it.you ? C.you : palette[(names.filter((n) => !groups.some((g) => g.items.some((x) => x.name === n && x.you))).indexOf(it.name)) % palette.length]);
  return (
    <div className="ps-gb">
      {groups.map((g) => (
        <div key={g.label} className="ps-gb-group">
          <b className="ps-gb-title">{g.label}</b>
          {g.items.map((it) => (
            <div key={it.name} className="ps-gb-row">
              <span className="ps-gb-name">{it.name}</span>
              <span className="ps-bars-track"><span className="ps-bars-fill" style={{ width: `${((it.value || 0) / hi) * 100}%`, background: colorOf(it) }} /></span>
              <span className="ps-bars-val">{it.value == null ? 'N/A' : `${it.value}${unit}`}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Before / after grouped bars for a hypothetical change. rows: [{ label, before, after }]. */
export function BeforeAfter({ rows, unit = '' }) {
  const hi = Math.max(1, ...rows.flatMap((r) => [r.before, r.after]));
  return (
    <div className="ps-gb">
      {rows.map((r) => (
        <div key={r.label} className="ps-gb-group">
          <b className="ps-gb-title">{r.label}</b>
          <div className="ps-gb-row"><span className="ps-gb-name">Today</span><span className="ps-bars-track"><span className="ps-bars-fill" style={{ width: `${(r.before / hi) * 100}%`, background: C.rival }} /></span><span className="ps-bars-val">{r.before}{unit}</span></div>
          <div className="ps-gb-row"><span className="ps-gb-name">{r.afterLabel || 'With the change'}</span><span className="ps-bars-track"><span className="ps-bars-fill" style={{ width: `${(r.after / hi) * 100}%`, background: C.you }} /></span><span className="ps-bars-val">{r.after}{unit}</span></div>
        </div>
      ))}
    </div>
  );
}

/** Line chart over runs. With fewer than two runs it says so instead of drawing a fake trend. */
export function TrendLine({ points, unit = '%', label }) {
  if (!points || points.length < 2) {
    return (
      <div className="ps-trend-empty">
        <svg viewBox="0 0 400 120" aria-hidden="true"><line x1="20" y1="100" x2="380" y2="100" stroke="rgba(62,39,35,.2)" />{points?.[0] ? <circle cx="200" cy="60" r="6" fill={C.you} /> : null}</svg>
        <p><b>{points?.[0] ? `${points[0].value}${unit} on ${points[0].label}` : 'No data yet'}</b><br />A trend needs at least two benchmark runs. This is the first run, so there is nothing to compare yet. {label}</p>
      </div>
    );
  }
  const W = 600; const H = 200; const p = 30;
  const hi = Math.max(...points.map((x) => x.value), 1);
  const xy = points.map((pt, i) => [p + ((W - 2 * p) * i) / (points.length - 1), H - p - ((H - 2 * p) * pt.value) / hi]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={points.map((x) => `${x.label} ${x.value}${unit}`).join(', ')}>
      <polyline points={xy.map((q) => q.join(',')).join(' ')} fill="none" stroke={C.you} strokeWidth="2.5" />
      {xy.map((q, i) => <g key={i}><circle cx={q[0]} cy={q[1]} r="4" fill={C.you} /><text x={q[0]} y={q[1] - 8} textAnchor="middle" fontSize="11">{points[i].value}{unit}</text><text x={q[0]} y={H - 8} textAnchor="middle" fontSize="10">{points[i].label}</text></g>)}
    </svg>
  );
}

/** Sortable table. columns: [{ key, label, num, render }]. */
export function SortTable({ columns, rows, initial, rowClass, limit = 0 }) {
  const [sort, setSort] = useState(initial || { key: columns[0].key, dir: columns[0].num ? 'desc' : 'asc' });
  const [all, setAll] = useState(false);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key);
    const val = (r) => (col?.sortValue ? col.sortValue(r) : r[sort.key]);
    return [...rows].sort((a, b) => {
      const x = val(a); const y = val(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return sort.dir === 'asc' ? d : -d;
    });
  }, [rows, sort, columns]);
  const shown = limit && !all ? sorted.slice(0, limit) : sorted;
  return (
    <>
      <div className="ps-table-wrap">
        <table className="ps-table ps-table--sort">
          <thead>
            <tr>{columns.map((c) => (
              <th key={c.key} className={c.num ? 'ps-r' : ''} aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key && s.dir === 'desc' ? 'asc' : 'desc' }))}>{c.label}<span aria-hidden="true">{sort.key === c.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</span></button>
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {shown.map((r, i) => <tr key={r.id || i} className={rowClass ? rowClass(r) : ''}>{columns.map((c) => <td key={c.key} className={c.num ? 'ps-r' : ''}>{c.render ? c.render(r) : (r[c.key] ?? '–')}</td>)}</tr>)}
            {!rows.length ? <tr><td colSpan={columns.length} className="ps-muted">Nothing to show.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {limit && rows.length > limit ? <button type="button" className="ps-link" onClick={() => setAll((v) => !v)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</button> : null}
    </>
  );
}

/** What it means + what to do. findings: string[]; actions: [{ text, note }]. */
export function Findings({ findings, actions }) {
  return (
    <div className="ps-findings">
      <div>
        <h3>What this means</h3>
        <ul>{findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
      </div>
      <div>
        <h3>Recommended actions</h3>
        <ol>{actions.map((a, i) => <li key={i}><b>{a.text}</b>{a.note ? <small>{a.note}</small> : null}</li>)}</ol>
      </div>
    </div>
  );
}

/** Sources, methodology and dates at the bottom of every page. */
export function Method({ items, updated, scope }) {
  return (
    <details className="ps-method">
      <summary>Data sources, methodology and dates <span className="ps-muted">· Updated {updated}{scope ? ` · ${scope}` : ''}</span></summary>
      <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </details>
  );
}
