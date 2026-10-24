// DEV-ONLY sample data for looking at Today without real logs.
// Open /ecosystem?fixture=today (web) or /mobile-preview?screen=eco&fixture=today
// on `vite` dev. Variants: fixture=today-care (severe pain today) and
// fixture=today-pregnant (pain in pregnancy, triage first).
// Only reached through `import.meta.env.DEV` branches, so a production build
// drops this module (check: grep dist for "Sample Today fixture"). Nothing
// here is anyone's data and it is never written to storage.

const FIXTURE_TAG = 'Sample Today fixture';

const dayStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plus = (day, n) => { const [y, m, d] = day.split('-').map(Number); return dayStr(new Date(y, m - 1, d + n)); };

/** 'today' | 'today-care' | 'today-pregnant' on `vite` dev with ?fixture=..., else null. Always null in a production build. */
export function todayFixtureOn() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  try {
    const v = new URLSearchParams(window.location.search).get('fixture') || sessionStorage.getItem('ayna_dev_fixture');
    return /^today(-care|-pregnant)?$/.test(v || '') ? v : null;
  } catch { return null; }
}

/** Four 28-day cycles: rough sleep in the 3 days before each period (the investor-demo story, section 161). */
export function makeTodayFixture(scenario = todayFixtureOn() || 'today', today = dayStr(new Date())) {
  const log = {};
  const lastStart = plus(today, -26); // cycle day 27 today: two days before the next period
  for (let c = 4; c >= 0; c -= 1) {
    const start = plus(lastStart, -28 * c);
    for (let i = 0; i < 28; i += 1) {
      const day = plus(start, i);
      if (day > today) break;
      const pre = i >= 25;
      log[day] = {
        day,
        pain: 0,
        flow: i < 2 ? 'medium' : i < 4 ? 'light' : 'none',
        pms: 0,
        sleep: pre ? 1 : 3,
        mood: 3,
        skin: 2,
        updatedAt: `${day}T12:00:00.000Z`,
      };
    }
  }
  if (scenario === 'today-care' || scenario === 'today-pregnant') log[today] = { ...log[today], pain: scenario === 'today-care' ? 3 : 1 };
  else log[today] = { day: today, pain: null, flow: null, pms: null, sleep: null, mood: null, skin: null, updatedAt: `${today}T12:00:00.000Z` };
  const tries = [{
    id: 'fixture-try-heat', kind: 'action', ref: 'heat', need: 'period_pain', startedDay: plus(today, -30), horizonDays: 28,
    status: 'due', outcome: null, updatedAt: `${plus(today, -30)}T12:00:00.000Z`, note: FIXTURE_TAG,
  }];
  const intake = {
    age: '27', lifeStageSelections: [scenario === 'today-pregnant' ? 'I am pregnant' : 'I get periods regularly'],
    lifeStage: scenario === 'today-pregnant' ? 'I am pregnant' : 'I get periods regularly',
    pregnancyTrimester: scenario === 'today-pregnant' ? 'Second trimester' : '',
    supportSelections: ['Cramps or period pain', 'Trouble sleeping'], diagnosisSelections: ['None that I know of'],
    allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No',
  };
  return { tag: FIXTURE_TAG, log, tries, intake, store: null };
}
