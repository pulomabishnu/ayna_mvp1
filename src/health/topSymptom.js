/**
 * Her top symptom this month (UCLA focus group 10/1: "top symptom this month"). Counted only from
 * her own daily log: a day counts once per symptom. No diagnosis, no comparison with other people.
 */
const PAIN_WORDS = { cramps: 'Cramps', back: 'Lower back pain', head: 'Headaches', pelvic: 'Pelvic pain', breast: 'Breast pain', other: 'Pain' };

function symptomsOf(e) {
  if (!e) return [];
  const out = [];
  if (Number(e.pain) >= 1) out.push(PAIN_WORDS[e.pain_where] || 'Pain');
  if (Number(e.pms) >= 1) out.push('PMS');
  if (e.mood === 1) out.push('Low mood');
  if (e.energy === 1) out.push('Low energy');
  if (e.sleep === 1) out.push('Rough sleep');
  if (e.skin === 1) out.push('Skin flare');
  return out;
}

const monthKey = (iso) => String(iso).slice(0, 7);
const prevMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; };

/**
 * @param {Record<string, object>} log day -> entry (dailyLog.js)
 * @param {string} today YYYY-MM-DD
 * @returns {{ label: string, days: number, lastMonth: number } | null} null until something is logged this month
 */
export function topSymptom(log = {}, today) {
  if (!today) return null;
  const now = monthKey(today);
  const before = prevMonth(now);
  const count = (ym) => {
    const c = new Map();
    for (const [day, e] of Object.entries(log || {})) {
      if (monthKey(day) !== ym || day > today) continue;
      for (const s of new Set(symptomsOf(e))) c.set(s, (c.get(s) || 0) + 1);
    }
    return c;
  };
  const cur = count(now);
  if (!cur.size) return null;
  const [label, days] = [...cur.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return { label, days, lastMonth: count(before).get(label) || 0 };
}

/** "Cramps, 6 days so far (4 last month)". */
export function topSymptomLine(t) {
  if (!t) return '';
  const d = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
  return `${t.label}, ${d(t.days)} so far${t.lastMonth ? ` (${d(t.lastMonth)} last month)` : ''}`;
}
