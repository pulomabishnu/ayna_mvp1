import { describe, expect, it } from 'vitest';
import { parseHealthFile, parseDay, parseDuration, parseTempC, metricForField, categoriesFor } from './manualImport.js';

describe('manual import parsing', () => {
  it('reads dates in common formats and rejects impossible ones', () => {
    expect(parseDay('2026-10-01')).toBe('2026-10-01');
    expect(parseDay('10/01/2026')).toBe('2026-10-01');
    expect(parseDay('Oct 1, 2026')).toBe('2026-10-01');
    expect(parseDay('1 October 2026')).toBe('2026-10-01');
    expect(parseDay('2026-02-30')).toBeNull();
    expect(parseDay('yesterday')).toBeNull();
  });

  it('reads durations and temperatures', () => {
    expect(parseDuration('7h 20m')).toBe(440);
    expect(parseDuration('7:20')).toBe(440);
    expect(parseDuration('7.5 hours')).toBe(450);
    expect(parseDuration('395 min')).toBe(395);
    expect(parseTempC('97.9 F')).toBeCloseTo(36.61, 1);
    expect(parseTempC('36.6 °C')).toBe(36.6);
  });

  it('never reads a score as a duration', () => {
    expect(metricForField('Sleep score')).toBeNull();
    expect(metricForField('Sleep efficiency')).toBeNull();
    expect(metricForField('Readiness score').metric).toBe('readiness_score');
  });

  it('parses a CSV export and lists columns it ignored', () => {
    const text = 'Date,Total sleep,Steps,Resting heart rate,Sleep score,Mood\n2026-10-01,6h 32m,"7,420",68,81,ok\n2026-10-02,7:05,9100,66,85,good\n';
    const out = parseHealthFile({ name: 'export.csv', text, declaredApp: 'Fitbit' });
    expect(out.kind).toBe('csv');
    expect(out.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: 'sleep_minutes', day: '2026-10-01', value: 392, origin: 'fitbit' }),
      expect.objectContaining({ metric: 'steps', day: '2026-10-01', value: 7420 }),
      expect.objectContaining({ metric: 'resting_hr_bpm', day: '2026-10-02', value: 66 }),
    ]));
    expect(out.ignoredColumns).toEqual(['Sleep score', 'Mood']);
  });

  it('turns period ranges from a cycle-app JSON export into flow days', () => {
    const text = JSON.stringify({ periods: [{ period_start: '2026-09-01', period_end: '2026-09-04' }] });
    const out = parseHealthFile({ name: 'flo.json', text, declaredApp: 'Flo' });
    expect(out.candidates.map((c) => c.day)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04']);
    expect(out.candidates.every((c) => c.metric === 'menstrual_flow' && c.origin === 'flo')).toBe(true);
    expect(categoriesFor(out.candidates)).toEqual(['cycle']);
  });

  it('reads simple text lines', () => {
    const out = parseHealthFile({ name: 'notes.txt', text: '2026-10-01 sleep 7h 20m\nOct 2, 2026: 8,400 steps\nfelt tired today\n' });
    expect(out.candidates).toHaveLength(2);
    expect(out.unrecognized).toBe(1);
  });

  it('handles malformed and unsupported files without throwing', () => {
    expect(parseHealthFile({ name: 'x.json', text: '{not json' }).error).toBe('invalid_json');
    expect(parseHealthFile({ name: 'x.csv', text: 'a,b\n1,2' }).error).toBe('no_date_column');
    expect(parseHealthFile({ name: 'x.docx', text: 'hi' }).error).toBe('unsupported_file');
    expect(parseHealthFile({ name: 'x.png', text: '' }).error).toBe('needs_extraction');
    expect(parseHealthFile({ name: 'x.csv', text: '' }).error).toBe('empty');
  });

  it('drops impossible values instead of saving them', () => {
    const out = parseHealthFile({ name: 'x.csv', text: 'date,resting heart rate,steps\n2026-10-01,900,-5\n' });
    expect(out.candidates).toEqual([]);
    expect(out.unrecognized).toBe(2);
  });

  it('keeps one value per metric per day inside a file', () => {
    const out = parseHealthFile({ name: 'x.csv', text: 'date,steps\n2026-10-01,100\n2026-10-01,200\n' });
    expect(out.candidates).toHaveLength(1);
  });
});

describe('foundSummary: what ayna found, in words', () => {
  it('counts days per kind of data with the date range', async () => {
    const { foundSummary } = await import('./manualImport.js');
    const out = foundSummary([
      { metric: 'sleep_minutes', day: '2026-10-01', value: 400 },
      { metric: 'sleep_minutes', day: '2026-10-03', value: 420 },
      { metric: 'steps', day: '2026-10-02', value: 5000 },
      { metric: 'nope', day: '2026-10-02', value: 1 },
    ]);
    expect(out.map((x) => x.line)).toEqual(['Sleep: 2 days from Oct 1, 2026 to Oct 3, 2026', 'Steps: 1 day on Oct 2, 2026']);
  });
});
