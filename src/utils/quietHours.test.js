import { describe, expect, it } from 'vitest';
import {
  formatQuietHoursSummary,
  formatTime12h,
  isValidQuietTime,
  normalizeTimeInput,
  quietHoursDurationMinutes,
  validateQuietHours,
} from './quietHours';

describe('quiet hours validation', () => {
  it('accepts only HH:MM 24-hour strings (same rule as the API)', () => {
    expect(isValidQuietTime('00:00')).toBe(true);
    expect(isValidQuietTime('23:59')).toBe(true);
    expect(isValidQuietTime('24:00')).toBe(false);
    expect(isValidQuietTime('7:00')).toBe(false);
    expect(isValidQuietTime('07:60')).toBe(false);
    expect(isValidQuietTime(null)).toBe(false);
  });

  it('normalizes time-input values', () => {
    expect(normalizeTimeInput('22:00')).toBe('22:00');
    expect(normalizeTimeInput('22:00:00')).toBe('22:00');
    expect(normalizeTimeInput('07:30:15.250')).toBe('07:30');
    expect(normalizeTimeInput('')).toBe(null);
    expect(normalizeTimeInput('25:00')).toBe(null);
    expect(normalizeTimeInput(undefined)).toBe(null);
  });

  it('rejects invalid or zero-length windows', () => {
    expect(validateQuietHours('22:00', '07:00')).toBe(null);
    expect(validateQuietHours('09:00', '17:00')).toBe(null);
    expect(validateQuietHours('22:00', '22:00')).toBe('same_time');
    expect(validateQuietHours('22:00', '')).toBe('invalid_time');
    expect(validateQuietHours('bad', '07:00')).toBe('invalid_time');
  });

  it('computes duration across midnight', () => {
    expect(quietHoursDurationMinutes('22:00', '07:00')).toBe(9 * 60);
    expect(quietHoursDurationMinutes('09:00', '17:30')).toBe(8 * 60 + 30);
    expect(quietHoursDurationMinutes('23:45', '00:15')).toBe(30);
    expect(quietHoursDurationMinutes('10:00', '10:00')).toBe(0);
  });
});

describe('quiet hours formatting', () => {
  it('formats 12-hour times', () => {
    expect(formatTime12h('00:00')).toBe('12 AM');
    expect(formatTime12h('12:00')).toBe('12 PM');
    expect(formatTime12h('07:30')).toBe('7:30 AM');
    expect(formatTime12h('22:05')).toBe('10:05 PM');
    expect(formatTime12h('nope')).toBe('nope');
  });

  it('summarizes the window', () => {
    expect(formatQuietHoursSummary(false, '22:00', '07:00')).toBe('Off');
    expect(formatQuietHoursSummary(true, '22:00', '07:00')).toBe('10 PM – 7 AM (9 h)');
    expect(formatQuietHoursSummary(true, '22:30', '07:00')).toBe('10:30 PM – 7 AM (8 h 30 min)');
    expect(formatQuietHoursSummary(true, '22:00', '22:00')).toBe('Pick a start and end time');
  });
});
