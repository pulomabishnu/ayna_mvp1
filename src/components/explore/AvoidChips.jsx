import React from 'react';
import { Chip, ChipRow } from '../ui/ay';
import { AVOID_OPTIONS } from './avoid.js';
import './explore-shared.css';

const Crossed = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M3.8 12.2 12.2 3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
);

/**
 * "Leave out" chips (#17 food-scan "Want to avoid", #16 "choose as many as
 * you like"): multi-select, crossed-circle icon, her own avoid list first.
 * Shows only products confirmed free of each one, as labeled.
 */
export default function AvoidChips({ selected = [], onChange, mine = [], className = '' }) {
  const order = [...AVOID_OPTIONS].sort((a, b) => (mine.includes(b.attr) ? 1 : 0) - (mine.includes(a.attr) ? 1 : 0));
  const toggle = (attr) => onChange?.(selected.includes(attr) ? selected.filter((x) => x !== attr) : [...selected, attr]);
  return (
    <div className={`ay-avoid ${className}`.trim()}>
      <p className="ay-avoid__label" id="ay-avoid-h">Leave out <span>Choose as many as you like. Shows products labeled free of them.</span></p>
      <ChipRow label="Leave out">
        {order.map((o) => <Chip key={o.attr} selected={selected.includes(o.attr)} icon={<Crossed />} onClick={() => toggle(o.attr)}>{o.label}{mine.includes(o.attr) ? ' (your list)' : ''}</Chip>)}
      </ChipRow>
    </div>
  );
}
