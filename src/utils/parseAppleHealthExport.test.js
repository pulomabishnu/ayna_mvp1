import { describe, it, expect } from 'vitest';
import { summarizeAppleHealthExport } from './parseAppleHealthExport';

const NOW = new Date('2024-02-01T00:00:00-0500');

function xmlWith(records) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<HealthData locale="en_US">\n${records.join('\n')}\n</HealthData>`;
}

describe('summarizeAppleHealthExport', () => {
  it('rejects a file that is not an Apple Health export', () => {
    const res = summarizeAppleHealthExport('{"not": "xml"}', { now: NOW });
    expect(res.error).toBe('not_apple_health_export');
    expect(res.hasData).toBe(false);
  });

  it('reports no_recognized_records for a well-formed export with nothing usable', () => {
    const xml = xmlWith([
      '<Record type="HKQuantityTypeIdentifierBodyMass" sourceName="x" unit="lb" value="140" startDate="2024-01-20 08:00:00 -0500" endDate="2024-01-20 08:00:00 -0500"/>',
    ]);
    const res = summarizeAppleHealthExport(xml, { now: NOW });
    expect(res.error).toBe('no_recognized_records');
    expect(res.hasData).toBe(false);
  });

  it('averages steps PER DAY, not per record — many small records a day must not inflate the average', () => {
    // Two days, three step records on day 1 (summing to 5000) and one on day 2 (3000).
    // Correct daily average is (5000 + 3000) / 2 = 4000, not total/record-count.
    const xml = xmlWith([
      rec('HKQuantityTypeIdentifierStepCount', '2000', '2024-01-20 08:00:00 -0500', '2024-01-20 09:00:00 -0500'),
      rec('HKQuantityTypeIdentifierStepCount', '2000', '2024-01-20 12:00:00 -0500', '2024-01-20 13:00:00 -0500'),
      rec('HKQuantityTypeIdentifierStepCount', '1000', '2024-01-20 18:00:00 -0500', '2024-01-20 19:00:00 -0500'),
      rec('HKQuantityTypeIdentifierStepCount', '3000', '2024-01-21 08:00:00 -0500', '2024-01-21 09:00:00 -0500'),
    ]);
    const res = summarizeAppleHealthExport(xml, { now: NOW });
    expect(res.stats.avgDailySteps).toBe(4000);
  });

  it('ignores records outside the 30-day window', () => {
    const xml = xmlWith([
      rec('HKQuantityTypeIdentifierStepCount', '9999', '2023-06-01 08:00:00 -0500', '2023-06-01 09:00:00 -0500'),
      rec('HKQuantityTypeIdentifierStepCount', '1000', '2024-01-25 08:00:00 -0500', '2024-01-25 09:00:00 -0500'),
    ]);
    const res = summarizeAppleHealthExport(xml, { now: NOW });
    expect(res.stats.avgDailySteps).toBe(1000);
  });

  it('computes average nightly sleep duration from Asleep records, excluding InBed and Awake', () => {
    const xml = xmlWith([
      `<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="x" value="HKCategoryValueSleepAnalysisInBed" startDate="2024-01-20 22:00:00 -0500" endDate="2024-01-21 06:00:00 -0500"/>`,
      `<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="x" value="HKCategoryValueSleepAnalysisAsleepCore" startDate="2024-01-20 22:30:00 -0500" endDate="2024-01-21 05:30:00 -0500"/>`,
      `<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="x" value="HKCategoryValueSleepAnalysisAwake" startDate="2024-01-21 03:00:00 -0500" endDate="2024-01-21 03:10:00 -0500"/>`,
    ]);
    const res = summarizeAppleHealthExport(xml, { now: NOW });
    // 22:30 -> 05:30 = 7 hours = 420 minutes. InBed and Awake must not count.
    expect(res.stats.avgSleepMinutes).toBe(420);
  });

  it('reports resting heart rate and cycle-tracking presence', () => {
    const xml = xmlWith([
      rec('HKQuantityTypeIdentifierRestingHeartRate', '58', '2024-01-20 06:00:00 -0500', '2024-01-20 06:00:00 -0500'),
      rec('HKQuantityTypeIdentifierRestingHeartRate', '62', '2024-01-21 06:00:00 -0500', '2024-01-21 06:00:00 -0500'),
      `<Record type="HKCategoryTypeIdentifierMenstrualFlow" sourceName="x" value="HKCategoryValueMenstrualFlowMedium" startDate="2024-01-15 08:00:00 -0500" endDate="2024-01-15 08:00:00 -0500"/>`,
    ]);
    const res = summarizeAppleHealthExport(xml, { now: NOW });
    expect(res.stats.avgRestingHeartRate).toBe(60);
    expect(res.stats.cycleEntryCount).toBe(1);
    expect(res.summaryText).toMatch(/resting heart rate avg 60 bpm/);
    expect(res.summaryText).toMatch(/cycle tracking data present \(1 entries\)/);
  });

  it('formats the steps figure with a thousands separator', () => {
    const xml = xmlWith([rec('HKQuantityTypeIdentifierStepCount', '12345', '2024-01-20 08:00:00 -0500', '2024-01-20 09:00:00 -0500')]);
    const res = summarizeAppleHealthExport(xml, { now: NOW });
    expect(res.summaryText).toMatch(/avg 12,345 steps\/day/);
  });
});

function rec(type, value, startDate, endDate) {
  return `<Record type="${type}" sourceName="x" unit="count" value="${value}" startDate="${startDate}" endDate="${endDate}"/>`;
}
