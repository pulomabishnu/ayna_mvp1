import { changeLine } from './healthCopy.js';

const lower = (s) => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);

/** Health-shaped change lines, with goals that share a finding merged:
 *  "Your period is due in about 5 days. It backs up your cramps and heavy periods picks." */
export function mergeLines(changes = []) {
  const out = [];
  for (const c of changes) {
    const l = changeLine(c);
    if (!l) continue;
    const same = out.find((o) => o.lead === l.lead && o.backs && /^It backs up your /.test(l.effect));
    if (same) { same.labels.push(lower(c.label || '')); same.effect = `It backs up your ${same.labels.join(' and ')} picks.`; continue; }
    out.push({ key: c.needId || l.lead, lead: l.lead, effect: l.effect, backs: /^It backs up your /.test(l.effect), labels: [lower(c.label || '')] });
  }
  return out;
}
