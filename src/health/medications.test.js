import { describe, it, expect, beforeEach } from 'vitest';
import {
  MEDS_KEY, readMeds, validateMed, saveMed, setMedActive, setMedReminder, scheduledOn, dosesFor,
  recordDose, undoDose, historyFor, doseState, scheduleLabel, doseLabel, fmtTime, localDay,
} from './medications.js';

function mem() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

let s;
beforeEach(() => { s = mem(); });

const base = { name: 'Levothyroxine', dose: '50', unit: 'mcg', times: ['08:00'] };

describe('validateMed', () => {
  it('needs a name and a time for scheduled meds', () => {
    const v = validateMed({ name: 'x', times: [] });
    expect(v.errors.name).toBeTruthy();
    expect(v.errors.times).toBeTruthy();
  });
  it('as needed needs no times and never reminds', () => {
    const v = validateMed({ name: 'Rescue inhaler', kind: 'as_needed', remind: true });
    expect(v.med.times).toEqual([]);
    expect(v.med.remind).toBe(false);
  });
  it('rejects non-numeric doses and end before start', () => {
    expect(validateMed({ ...base, dose: 'lots' }).errors.dose).toBeTruthy();
    expect(validateMed({ ...base, start: '2026-11-10', end: '2026-11-01' }).errors.end).toBeTruthy();
  });
  it('weekly needs one day', () => {
    expect(validateMed({ ...base, freq: 'weekly', days: [] }).errors.days).toBeTruthy();
    expect(validateMed({ ...base, freq: 'weekly', days: [3, 1] }).med.days).toEqual([1]);
  });
  it('sorts and dedupes times, drops bad ones', () => {
    expect(validateMed({ ...base, times: ['20:00', '08:00', '08:00', '25:00'] }).med.times).toEqual(['08:00', '20:00']);
  });
});

describe('save, edit, stop', () => {
  it('saves, dedupes a double tap, and keeps id on edit', () => {
    const a = saveMed(base, { storage: s });
    expect(a.ok).toBe(true);
    const b = saveMed(base, { storage: s });
    expect(b.duplicate).toBe(true);
    expect(readMeds(s).meds).toHaveLength(1);
    const e = saveMed({ ...base, dose: '75' }, { id: a.med.id, storage: s });
    expect(e.med.id).toBe(a.med.id);
    expect(readMeds(s).meds[0].dose).toBe('75');
  });
  it('stopping keeps history and turns reminders off', () => {
    const { med } = saveMed(base, { storage: s });
    recordDose({ medId: med.id, day: '2026-11-14', time: '08:00', status: 'taken' }, s);
    const st = setMedActive(med.id, false, s);
    expect(st.med.active).toBe(false);
    expect(st.med.remind).toBe(false);
    expect(historyFor(med.id, readMeds(s))).toHaveLength(1);
    expect(scheduledOn(st.med, '2026-11-15')).toBe(false);
  });
  it('reminder toggle only for active scheduled meds', () => {
    const { med } = saveMed(base, { storage: s });
    expect(setMedReminder(med.id, false, s).med.remind).toBe(false);
    expect(setMedReminder(med.id, true, s).med.remind).toBe(true);
  });
  it('corrupt storage reads as empty', () => {
    s.setItem(MEDS_KEY, '{bad');
    expect(readMeds(s).meds).toEqual([]);
  });
});

describe('schedule', () => {
  it('respects start, end and weekdays', () => {
    const { med } = saveMed({ ...base, freq: 'days', days: [1, 3], start: '2026-11-01', end: '2026-11-30' }, { storage: s });
    expect(scheduledOn(med, '2026-11-16')).toBe(true); // Monday
    expect(scheduledOn(med, '2026-11-17')).toBe(false); // Tuesday
    expect(scheduledOn(med, '2026-10-26')).toBe(false); // before start
    expect(scheduledOn(med, '2026-12-02')).toBe(false); // after end
  });
  it('lists today’s doses sorted by time', () => {
    saveMed({ name: 'B med', times: ['20:00'] }, { storage: s });
    saveMed({ name: 'A med', times: ['07:30'] }, { storage: s });
    const d = dosesFor('2026-11-15', readMeds(s));
    expect(d.map((x) => x.time)).toEqual(['07:30', '20:00']);
    expect(d.every((x) => x.status === 'due')).toBe(true);
  });
});

describe('doses', () => {
  it('records taken once per tap, skipped replaces, undo restores', () => {
    const { med } = saveMed(base, { storage: s });
    const t = recordDose({ medId: med.id, day: '2026-11-15', time: '08:00', status: 'taken' }, s);
    expect(recordDose({ medId: med.id, day: '2026-11-15', time: '08:00', status: 'taken' }, s).duplicate).toBe(true);
    recordDose({ medId: med.id, day: '2026-11-15', time: '08:00', status: 'skipped', now: new Date(Date.now() + 1000) }, s);
    expect(dosesFor('2026-11-15', readMeds(s))[0].status).toBe('skipped');
    const last = historyFor(med.id, readMeds(s))[0];
    undoDose(last.id, s);
    expect(dosesFor('2026-11-15', readMeds(s))[0].record.id).toBe(t.dose.id);
  });
  it('rejects unknown status or med', () => {
    expect(recordDose({ medId: 'nope', day: '2026-11-15', status: 'taken' }, s).ok).toBe(false);
    const { med } = saveMed(base, { storage: s });
    expect(recordDose({ medId: med.id, day: '2026-11-15', status: 'double' }, s).ok).toBe(false);
  });
  it('state: upcoming, due, missed, snoozed — never auto taken', () => {
    const day = '2026-11-15';
    const at = (h, m) => new Date(2026, 10, 15, h, m);
    const e = { time: '08:00', status: 'due', record: null };
    expect(doseState(e, at(7, 0), day)).toBe('upcoming');
    expect(doseState(e, at(8, 30), day)).toBe('due');
    expect(doseState(e, at(9, 30), day)).toBe('missed');
    const sn = { time: '08:00', status: 'snoozed', record: { snoozeUntil: at(9, 45).toISOString() } };
    expect(doseState(sn, at(9, 30), day)).toBe('snoozed');
    expect(doseState(sn, at(10, 0), day)).toBe('missed');
  });
});

describe('labels', () => {
  it('formats', () => {
    expect(fmtTime('08:05')).toBe('8:05 AM');
    expect(fmtTime('00:00')).toBe('12:00 AM');
    expect(fmtTime('13:30')).toBe('1:30 PM');
    expect(doseLabel({ dose: '50', unit: 'mcg' })).toBe('50 mcg');
    expect(doseLabel({ dose: '', unit: '' })).toBe('');
    expect(scheduleLabel({ kind: 'scheduled', freq: 'days', days: [1, 3], times: ['08:00', '20:00'] })).toBe('Mon, Wed · 8:00 AM, 8:00 PM');
    expect(scheduleLabel({ kind: 'as_needed', times: [] })).toBe('As needed');
    expect(localDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
