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
  it('shows the friendly empty state with no period data, and one Log today button', () => {
    const onLog = vi.fn();
    const onClose = vi.fn();
    const sheet = mount({ onLog, onClose });
    expect(sheet.textContent).toContain('Log a period to see your month.');
    const log = [...sheet.querySelectorAll('button')].filter((b) => b.textContent === 'Log today');
    expect(log).toHaveLength(1);
    act(() => log[0].click());
    expect(onClose).toHaveBeenCalled();
    expect(onLog).toHaveBeenCalled();
  });

  it('marks period, estimated and today, and a tap shows that day only', () => {
    const rows = [{ metric: 'menstrual_flow', day: '2026-10-05', value: 3, source: 'apple_health' }];
    const sheet = mount({ rows, estimate: { day: '2026-10-30' }, cycle: { periodLength: 2 } });
    expect(sheet.querySelector('.ay-mcal__day.is-today').getAttribute('aria-label')).toContain('today');
    expect(sheet.querySelectorAll('.ay-mcal__day.is-period')).toHaveLength(1);
    expect(sheet.querySelectorAll('.ay-mcal__day.is-estimated')).toHaveLength(2);
    expect([...sheet.querySelectorAll('.ay-mcal__legend li')].map((l) => l.textContent)).toEqual(['Period', 'Estimated']);
    expect(sheet.querySelector('.ay-mcal__picked')).toBeNull();
    act(() => sheet.querySelector('.ay-mcal__day.is-estimated').click());
    expect(sheet.querySelector('.ay-mcal__picked').textContent).toContain('Period expected, estimated');
  });

  it('says bleed with hormonal birth control', () => {
    const rows = [{ metric: 'menstrual_flow', day: '2026-10-05', value: 3, source: 'apple_health' }];
    const sheet = mount({ rows, hormonalBC: true });
    expect(sheet.querySelector('.ay-mcal__legend').textContent).toBe('Bleed');
    expect(sheet.querySelector('.ay-mcal__day.is-period').getAttribute('aria-label')).toContain('bleed logged');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    mount({ onClose });
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(onClose).toHaveBeenCalled();
  });
});
