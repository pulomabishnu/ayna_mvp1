/* Small presentational pieces for Partner Studio. No data fetching here. */
import React, { useEffect, useRef } from 'react';
import { SYNTHETIC, fmtPct } from './format.js';

export function SyntheticBadge({ text = 'Synthetic benchmark' }) {
  return <span className="ps-badge ps-badge--syn" title={SYNTHETIC}>{text}</span>;
}
export function DraftBadge({ text = 'Draft, pending human review' }) {
  return <span className="ps-badge ps-badge--draft">{text}</span>;
}

export function Kpi({ tone = 'plain', label, value, den, badge }) {
  return (
    <div className={`ps-kpi ps-kpi--${tone}`}>
      <div className="ps-kpi-label"><span>{label}</span>{badge}</div>
      <span className="ps-num">{value}</span>
      <span className="ps-kpi-den">{den}</span>
    </div>
  );
}

export function HBar({ label, value, max = 100, text, tone = '', sub }) {
  const w = value == null ? 0 : Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className="ps-hbar">
      <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 700 }}>{label}</span>{sub ? <span className="ps-small ps-muted">{sub}</span> : null}</span>
      <span className="ps-hbar-track" role="img" aria-label={`${label}: ${text ?? fmtPct(value)}`}><span className={`ps-hbar-fill ${tone ? `ps-hbar-fill--${tone}` : ''}`} style={{ width: `${w}%` }} /></span>
      <span className="ps-hbar-val">{text ?? fmtPct(value)}</span>
    </div>
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
};
export function Icon({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name] || ICONS.overview} /></svg>
  );
}
