// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MonthSheet from './MonthSheet.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const today = '2026-10-27';
let root;
let host;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
const mount = (props) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<MonthSheet today={today} onClose={() => {}} {...props} />));
  return document.querySelector('.ay-mcal');
};

describe('MonthSheet', () => {
  it('shows how to log past periods with no period data, and one More symptoms button (mood, energy, pain and sleep are right in the sheet, Nov 11)', () => {
    const onLog = vi.fn();
    const onClose = vi.fn();
    const sheet = mount({ onLog, onClose });
    expect(sheet.textContent).toContain('Tap the first day of your last period');
    const log = [...sheet.querySelectorAll('button')].filter((b) => b.textContent === 'More symptoms');
    expect(log).toHaveLength(1);
    act(() => log[0].click());
    expect(onClose).toHaveBeenCalled();
    expect(onLog).toHaveBeenCalled();
  });

  it('marks period, estimated and today; today starts picked; a tap shows that day only', () => {
    const rows = [{ metric: 'menstrual_flow', day: '2026-10-05', value: 3, source: 'apple_health' }];
    const sheet = mount({ rows, estimate: { day: '2026-10-30' }, cycle: { periodLength: 2 } });
    expect(sheet.querySelector('.ay-mcal__day.is-today').getAttribute('aria-label')).toContain('today');
    expect(sheet.querySelectorAll('.ay-mcal__day.is-period')).toHaveLength(1);
    expect(sheet.querySelectorAll('.ay-mcal__day.is-estimated')).toHaveLength(2);
    expect([...sheet.querySelectorAll('.ay-mcal__legend li')].map((l) => l.textContent)).toEqual(['Period', 'Estimated']);
    // Founder, Nov 11: today is picked so logging it is one tap.
    expect(sheet.querySelector('.ay-mcal__pday').textContent).toBe('Today');
    expect(sheet.querySelector('.ay-mcal__flow')).not.toBeNull();
    act(() => sheet.querySelector('.ay-mcal__day.is-estimated').click());
    // A future day can't be logged.
    expect(sheet.querySelector('.ay-mcal__flow')).toBeNull();
    expect(sheet.querySelector('.ay-mcal__picked').textContent).toContain('Period expected, estimated');
  });

  it('says bleed with hormonal birth control', () => {
    const rows = [{ metric: 'menstrual_flow', day: '2026-10-05', value: 3, source: 'apple_health' }];
    const sheet = mount({ rows, hormonalBC: true });
    expect(sheet.querySelector('.ay-mcal__legend').textContent).toBe('Bleed');
    expect(sheet.querySelector('.ay-mcal__day.is-period').getAttribute('aria-label')).toContain('bleed logged');
  });

  it('logs a past period day from the calendar and marks it', () => {
    localStorage.clear();
    const onSaved = vi.fn();
    const sheet = mount({ onSaved });
    const day = [...sheet.querySelectorAll('.ay-mcal__day')].find((b) => b.querySelector('.ay-mcal__n').textContent === '3');
    act(() => day.click());
    const medium = [...sheet.querySelectorAll('.ay-mcal__chip')].find((b) => b.textContent === 'Medium');
    act(() => medium.click());
    expect(medium.getAttribute('aria-pressed')).toBe('true');
    expect(day.classList.contains('is-period')).toBe(true);
    expect(onSaved).toHaveBeenCalled();
    expect(onSaved.mock.calls[0][0][day.getAttribute('aria-label') && Object.keys(onSaved.mock.calls[0][0])[0]].flow).toBe('medium');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    mount({ onClose });
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(onClose).toHaveBeenCalled();
  });
});
