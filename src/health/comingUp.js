/**
 * "Coming up": the next few dates from her own cycle estimate, each with one
 * line on what to expect and the source that line comes from. Only real
 * dates from her logs; nothing when there is no estimate.
 */
import { estimatePhase } from './phase.js';
import { EVIDENCE, daysBetween } from './weekInsights.js';

const DAY = 86400000;
const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);

export function comingUp(cycle, estimate, today, { hormonalBC = false, hasProducts = true } = {}) {
  const out = [];
  if (!cycle?.lastStart || !today) return out;
  const phase = hormonalBC ? null : estimatePhase(cycle);
  if (phase?.windowStart && phase?.windowEnd) {
    const ws = addDays(cycle.lastStart, phase.windowStart - 1);
    const we = addDays(cycle.lastStart, phase.windowEnd - 1);
    if (daysBetween(today, we) >= 0) {
      out.push({ day: ws < today ? today : ws, title: 'Likely ovulation window', sub: `${fmtDay(ws)} to ${fmtDay(we)}. An estimate, not birth control.`, expect: 'Temperature often rises about 0.2 to 0.5\u00a0°C after ovulation.', source: EVIDENCE.bbt, tone: 'sky' });
      const ls = addDays(cycle.lastStart, phase.windowEnd);
      out.push({ day: ls, title: 'Luteal phase likely starts', sub: 'Lasts until your next period.', expect: 'Resting heart rate often runs a few beats higher until your period.', source: EVIDENCE.rhr, tone: 'ink' });
    }
  }
  if (estimate?.day && daysBetween(today, estimate.day) >= 0) {
    const pms = addDays(estimate.day, -5);
    if (daysBetween(today, pms) >= 0) out.push({ day: pms, title: 'Restock before your period', sub: hasProducts ? 'Your shopping list is in Products.' : '', expect: 'Cramps can start a day or two before your period.', source: EVIDENCE.cramps, tone: 'butter' });
    out.push({ day: estimate.day, title: 'Next period, estimated', sub: 'From your last cycles. Can be off by a few days.', expect: hormonalBC ? '' : 'Temperature usually drops a day or two before.', source: hormonalBC ? null : EVIDENCE.bbt, tone: 'pink' });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day)).slice(0, 4);
}
