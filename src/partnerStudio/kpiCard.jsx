/* KPI tile with a visible link to its breakdown, so every headline number leads somewhere. */
import React from 'react';
import { Kpi } from './ui.jsx';

export function KpiCard({ onOpen, openText = 'View breakdown', ...kpi }) {
  return (
    <div className="ps-kpicard">
      <Kpi {...kpi} />
      {onOpen ? <button type="button" className={`ps-kpi-open${kpi.tone === 'ink' ? ' is-ink' : ''}`} onClick={onOpen}>{openText} <span aria-hidden="true">›</span></button> : null}
    </div>
  );
}
