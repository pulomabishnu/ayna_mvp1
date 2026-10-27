import { short } from './dashView.js';

/**
 * A metric's plain-English takeaway against her own usual (founder Oct 26:
 * "Sleep 40 min under your usual"). From the dashboard's own numbers
 * (chart.week, or chart.avg, and chart.usual); nothing new is measured.
 * Within 3% of her usual reads as "about your usual" (the dials' band).
 *
 *   takeaway(chart) -> { dir: -1 | 0 | 1, text, shortText } | null
 */
const BAND = 0.03;

function amount(metric, diff) {
  const d = Math.abs(diff);
  if (metric === 'sleep_minutes') {
    const m = Math.round(d);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
  }
  if (metric === 'steps') return Math.round(d).toLocaleString('en-US');
  return short(metric, Math.round(d * 10) / 10);
}

export function takeaway(chart) {
  const now = chart?.week ?? chart?.avg;
  if (now == null || !Number.isFinite(now)) return null;
  const usual = chart.usual;
  if (usual == null || !Number.isFinite(usual) || usual === 0) return { dir: 0, text: 'Still learning your usual', shortText: 'Learning your usual' };
  const pct = now / usual;
  const dir = pct > 1 + BAND ? 1 : pct < 1 - BAND ? -1 : 0;
  if (dir === 0) return { dir, text: 'About your usual', shortText: 'About usual' };
  const a = amount(chart.metric, now - usual);
  if (chart.metric === 'steps') {
    const w = dir > 0 ? 'more' : 'fewer';
    return { dir, text: `${a} ${w} steps than usual`, shortText: `${a} ${w}` };
  }
  if (chart.metric === 'sleep_minutes') {
    const w = dir > 0 ? 'over' : 'under';
    return { dir, text: `${a} ${w} your usual`, shortText: `${a} ${w}` };
  }
  const w = dir > 0 ? 'above' : 'below';
  return { dir, text: `${a} ${w} your usual`, shortText: `${a} ${w} usual` };
}
