/* Small presentational pieces for Partner Studio. No data fetching here. */
import React, { useEffect, useRef } from 'react';
import { SYNTHETIC, fmtPct } from './format.js';

export function SyntheticBadge({ text = 'Synthetic benchmark' }) {
  return <span className="ps-badge ps-badge--syn" title={SYNTHETIC}>{text}</span>;
}
export function DraftBadge({ text = 'Draft, pending human review' }) {
  return <span className="ps-badge ps-badge--draft">{text}</span>;
}

/** Small (i) button. Hover or focus shows the explanation, so cards stay short. */
export function InfoTip({ text, label = 'What this means' }) {
  if (!text) return null;
  return (
    <span className="ps-tip">
      <button type="button" className="ps-tip-btn" aria-label={`${label}: ${text}`}>i</button>
      <span className="ps-tip-pop" role="tooltip">{text}</span>
    </span>
  );
}

/** KPI tile. `cmp` is the one comparison every number needs (peer median, rank). */
export function Kpi({ tone = 'plain', label, value, den, badge, cmp, meter, icon, info }) {
  return (
    <div className={`ps-kpi ps-kpi--${tone}`}>
      <div className="ps-kpi-label">{icon ? <span className="ps-kpi-icon"><Icon name={icon} /></span> : null}<span className="ps-kpi-text">{label}</span>{badge}<InfoTip text={info} /></div>
      <span className="ps-num">{value}</span>
      {meter != null ? <span className="ps-kpi-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} /></span> : null}
      {cmp ? <span className={`ps-cmp ps-cmp--${cmp.dir || 'flat'}`}>{cmp.dir === 'up' ? '▲ ' : cmp.dir === 'down' ? '▼ ' : ''}{cmp.text}</span> : null}
      <span className="ps-kpi-den">{den}</span>
    </div>
  );
}

/** Card title with a one-line "what this shows" description. */
export function CardHead({ id, title, desc, right, icon, info }) {
  return (
    <div className="ps-card-head">
      <div className="ps-card-title"><h2 id={id}>{icon ? <span className="ps-h-icon"><Icon name={icon} /></span> : null}{title}<InfoTip text={info} /></h2>{desc ? <p className="ps-desc">{desc}</p> : null}</div>
      {right ? <div className="ps-card-right">{right}</div> : null}
    </div>
  );
}

/** Need × budget heatmap of slot share. Ink scale on butter; N/A cells hatched. */
export function Heatmap({ grid }) {
  if (!grid?.rows?.length) return null;
  const vals = grid.rows.flatMap((r) => r.cells.map((c) => c.slotShare)).filter((v) => v != null);
  const hi = Math.max(...vals, 1);
  return (
    <div className="ps-heat" style={{ gridTemplateColumns: `minmax(140px, 1.3fr) repeat(${grid.cols.length}, minmax(80px, 1fr))` }}>
      <span />
      {grid.cols.map((c) => <span key={c.key} className="ps-heat-col">{c.label}</span>)}
      {grid.rows.map((r) => (
        <React.Fragment key={r.need}>
          <span className="ps-heat-row">{r.need}</span>
          {r.cells.map((c) => {
            const v = c.slotShare;
            const a = v == null ? 0 : 0.08 + 0.92 * (v / hi);
            return (
              <span key={c.key} className={`ps-heat-cell${v == null ? ' ps-hatch' : ''}`} style={v == null ? undefined : { background: `rgba(62,39,35,${a.toFixed(2)})`, color: a > 0.5 ? '#ffedac' : '#3e2723' }} title={`${r.need}, ${c.key}: ${c.brandSlots} of ${c.slots} slots in ${c.scenarios} scenarios`}>
                <b>{v == null ? 'N/A' : `${v}%`}</b>
                <small>{v == null ? 'no slots' : `${c.brandSlots}/${c.slots}`}</small>
              </span>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

/** 100% stacked bar of loss reasons with direct labels. */
export function ReasonStack({ reasons }) {
  const total = reasons.reduce((a, r) => a + r.n, 0);
  if (!total) return null;
  const tone = (id) => (id === 'diversity_tie' || id === 'unclassified' ? 'ps-hatch' : id === 'budget' ? 'is-pink' : id === 'relevance' ? 'is-ink' : 'is-blue');
  return (
    <div className="ps-rstack" role="img" aria-label={reasons.map((r) => `${r.label} ${r.n}`).join(', ')}>
      {reasons.map((r) => <span key={r.id} className={tone(r.id)} style={{ flex: `${r.n} 1 0` }} title={`${r.label}: ${r.n}`}>{r.n / total >= 0.12 ? <em>{Math.round((r.n / total) * 100)}%</em> : ''}</span>)}
    </div>
  );
}

export function HBar({ label, value, max = 100, text, tone = '', sub, name }) {
  const w = value == null ? 0 : Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className="ps-hbar">
      <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 700 }}>{label}</span>{sub ? <span className="ps-small ps-muted">{sub}</span> : null}</span>
      <span className="ps-hbar-track" role="img" aria-label={`${name ?? label}: ${text ?? fmtPct(value)}`}><span className={`ps-hbar-fill ${tone ? `ps-hbar-fill--${tone}` : ''}`} style={{ width: `${w}%` }} /></span>
      <span className="ps-hbar-val">{text ?? fmtPct(value)}</span>
    </div>
  );
}

/** Multi-segment ring (hero chart). segments: [{ label, value, color }]. */
export function Ring({ segments, center, sub, size = 240, label }) {
  const total = segments.reduce((a, x) => a + x.value, 0) || 1;
  const r = 84;
  const c = 2 * Math.PI * r;
  const gap = segments.filter((x) => x.value > 0).length > 1 ? 4 : 0;
  const shown = segments.filter((x) => x.value > 0);
  const starts = shown.map((_, i) => shown.slice(0, i).reduce((a, x) => a + (x.value / total) * c, 0));
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" role="img" aria-label={label || segments.map((x) => `${x.label} ${Math.round((x.value / total) * 100)}%`).join(', ')}>
      <circle cx="110" cy="110" r={r} fill="none" stroke="#f6e3a1" strokeWidth="26" />
      {shown.map((x, i) => {
        const len = Math.max((x.value / total) * c - gap, 1.5);
        return <circle key={x.label} cx="110" cy="110" r={r} fill="none" stroke={x.color} strokeWidth="26" strokeLinecap="round" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-starts[i]} transform="rotate(-90 110 110)" />;
      })}
      <text x="110" y="112" textAnchor="middle" fontFamily="'ayna Display','Bricolage Grotesque',sans-serif" fontWeight="700" fontSize="40" fill="#3e2723">{center}</text>
      {sub ? <text x="110" y="136" textAnchor="middle" fontFamily="Figtree,sans-serif" fontSize="12" fontWeight="600" fill="rgba(62,39,35,.75)">{sub}</text> : null}
    </svg>
  );
}

/** Donut of one share: ink arc on a butter track. */
export function Donut({ value, label, size = 168, center, sub }) {
  const v = value == null ? 0 : Math.max(0, Math.min(1, value));
  const r = 62;
  const c = 2 * Math.PI * r;
  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 160 160" role="img" aria-label={`${label}: ${value == null ? 'N/A' : fmtPct(v * 100)}`}>
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f6e3a1" strokeWidth="20" />
        <circle cx="80" cy="80" r={r} fill="none" stroke="#3e2723" strokeWidth="20" strokeDasharray={`${v * c} ${c}`} strokeLinecap="butt" transform="rotate(-90 80 80)" />
        <circle cx="80" cy="80" r={r + 11} fill="none" stroke="#3e2723" strokeWidth="1.5" />
        <circle cx="80" cy="80" r={r - 11} fill="none" stroke="#3e2723" strokeWidth="1.5" />
        <text x="80" y="82" textAnchor="middle" fontFamily="'ayna Display','Bricolage Grotesque',sans-serif" fontWeight="700" fontSize="26" fill="#3e2723">{center ?? (value == null ? 'N/A' : fmtPct(v * 100))}</text>
        {sub ? <text x="80" y="102" textAnchor="middle" fontFamily="Figtree,sans-serif" fontSize="11" fill="#3e2723">{sub}</text> : null}
      </svg>
      <figcaption className="ps-small" style={{ fontWeight: 700 }}>{label}</figcaption>
    </figure>
  );
}

export function Drawer({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <>
      <div className="ps-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="ps-drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="ps-drawer-head"><h2>{title}</h2><button type="button" className="ps-btn ps-btn--sm" onClick={onClose}>Close</button></div>
        {children}
      </aside>
    </>
  );
}

export function Empty({ title, children }) {
  return <div className="ps-empty"><h3>{title}</h3><div className="ps-muted">{children}</div></div>;
}

const ICONS = {
  overview: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  actions: 'M4 6h16M4 12h16M4 18h10',
  evidence: 'M6 2h9l5 5v15H6zM14 2v6h6',
  claims: 'M4 5h16v11H8l-4 4z',
  share: 'M12 3a9 9 0 1 0 9 9h-9z',
  losses: 'M3 4h18l-7 8v7l-4 2v-9z',
  competitors: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M17 11a3 3 0 1 0 0-6M22 21v-1a5 5 0 0 0-4-4.9',
  feed: 'M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0',
  reports: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  hash: 'M5 9h14M5 15h14M10 3 8 21M16 3l-2 18',
  swap: 'M4 8h13l-3-3M20 16H7l3 3',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
  tag: 'M3 12V3h9l9 9-9 9zM7.5 7.5h.01',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  doc: 'M6 2h9l5 5v15H6zM9 13h6M9 17h6',
  layers: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5',
  alert: 'M12 3 2 20h20zM12 9v5M12 17h.01',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  grid: 'M4 4h16v16H4zM4 10h16M4 16h16M10 4v16',
};
export function Icon({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name] || ICONS.overview} /></svg>
  );
}
