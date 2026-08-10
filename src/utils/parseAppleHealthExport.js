/**
 * Parses Apple Health's export.xml — plain, documented XML (Settings -> Health
 * -> Export All Health Data produces it), not a HealthKit-only format —
 * entirely client-side. No app, no server, no third-party processor: the file
 * never leaves the browser, same as parseFhirBundleText in healthDataProfile.js.
 *
 * Regex over the raw text instead of DOMParser: a multi-year export can carry
 * hundreds of thousands of single-line <Record/> tags, and building a full DOM
 * tree for that many nodes costs far more memory than a single-pass attribute
 * scan when all that's needed is a handful of aggregate stats.
 */

const RECORD_RE = /<Record\b[^>]*\/>/g;
const ATTR_RE = /(\w+)="([^"]*)"/g;
const WINDOW_DAYS = 30;
const MAX_TEXT_LENGTH = 150 * 1024 * 1024; // ~150MB of XML text; a multi-year export routinely lands well under this

function parseAttrs(tag) {
  const attrs = {};
  ATTR_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_RE.exec(tag))) attrs[m[1]] = m[2];
  return attrs;
}

/** "2024-01-15 08:23:00 -0500" -> Date, or null if unparseable. */
function parseAppleDate(s) {
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{4})$/.exec(s || '');
  if (!m) return null;
  const d = new Date(`${m[1]}T${m[2]}${m[3]}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function withThousands(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * @param {string} xmlText
 * @param {{ now?: Date }} [opts]
 * @returns {{ error?: string, summaryText?: string, hasData: boolean, stats: object }}
 */
export function summarizeAppleHealthExport(xmlText, { now = new Date() } = {}) {
  if (typeof xmlText !== 'string' || !xmlText.includes('<HealthData')) {
    return { error: 'not_apple_health_export', hasData: false, stats: {} };
  }
  if (xmlText.length > MAX_TEXT_LENGTH) {
    return { error: 'file_too_large', hasData: false, stats: {} };
  }

  const cutoff = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  let stepsTotal = 0;
  const stepDays = new Set();
  let restingHrSum = 0;
  let restingHrCount = 0;
  let sleepMsTotal = 0;
  const sleepNights = new Set();
  let cycleEntryCount = 0;

  for (const match of xmlText.matchAll(RECORD_RE)) {
    const attrs = parseAttrs(match[0]);
    const type = attrs.type;
    if (!type) continue;
    const start = parseAppleDate(attrs.startDate);
    if (!start || start < cutoff || start > now) continue;

    if (type === 'HKQuantityTypeIdentifierStepCount') {
      const v = parseFloat(attrs.value);
      if (Number.isFinite(v)) {
        stepsTotal += v;
        stepDays.add(attrs.startDate.slice(0, 10));
      }
    } else if (type === 'HKQuantityTypeIdentifierRestingHeartRate') {
      const v = parseFloat(attrs.value);
      if (Number.isFinite(v)) {
        restingHrSum += v;
        restingHrCount += 1;
      }
    } else if (type === 'HKCategoryTypeIdentifierSleepAnalysis' && /Asleep/.test(attrs.value || '')) {
      const end = parseAppleDate(attrs.endDate);
      if (end && end > start) {
        sleepMsTotal += end.getTime() - start.getTime();
        sleepNights.add(attrs.startDate.slice(0, 10));
      }
    } else if (type === 'HKCategoryTypeIdentifierMenstrualFlow') {
      cycleEntryCount += 1;
    }
  }

  const stats = {
    avgDailySteps: stepDays.size ? Math.round(stepsTotal / stepDays.size) : null,
    avgRestingHeartRate: restingHrCount ? Math.round(restingHrSum / restingHrCount) : null,
    avgSleepMinutes: sleepNights.size ? Math.round(sleepMsTotal / sleepNights.size / 60000) : null,
    cycleEntryCount,
    windowDays: WINDOW_DAYS,
  };

  const hasData =
    stats.avgDailySteps != null || stats.avgRestingHeartRate != null || stats.avgSleepMinutes != null || stats.cycleEntryCount > 0;
  if (!hasData) {
    return { error: 'no_recognized_records', hasData: false, stats };
  }

  const facts = [];
  if (stats.avgDailySteps != null) facts.push(`avg ${withThousands(stats.avgDailySteps)} steps/day`);
  if (stats.avgSleepMinutes != null) {
    const h = Math.floor(stats.avgSleepMinutes / 60);
    const m = stats.avgSleepMinutes % 60;
    facts.push(`avg sleep ${h}h${String(m).padStart(2, '0')}m/night`);
  }
  if (stats.avgRestingHeartRate != null) facts.push(`resting heart rate avg ${stats.avgRestingHeartRate} bpm`);
  if (stats.cycleEntryCount > 0) facts.push(`cycle tracking data present (${stats.cycleEntryCount} entries)`);

  return {
    summaryText: `Apple Health export, last ${WINDOW_DAYS} days: ${facts.join('; ')}.`,
    hasData: true,
    stats,
  };
}
